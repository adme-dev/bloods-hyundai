/**
 * Conditional Routing Engine
 * Evaluates routing rules and determines email recipients and assignment
 */

export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: RoutingCondition[];
  actions: RoutingActions;
  continue?: boolean; // If true, continue evaluating more rules
}

export interface RoutingCondition {
  field: string;
  operator: RoutingOperator;
  value: any;
}

export type RoutingOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in_array'
  | 'not_in_array'
  | 'is_empty'
  | 'is_not_empty'
  | 'between'
  | 'outside_hours'
  | 'within_hours'
  | 'matches_regex';

export interface RoutingActions {
  send_to: string[];
  assign_to?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  cc?: string[];
  bcc?: string[];
}

export interface RoutingResult {
  send_to: string[];
  assign_to?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  cc?: string[];
  bcc?: string[];
  matched_rules: string[];
}

/**
 * Evaluate all routing rules for an enquiry
 */
export async function evaluateRoutingRules(
  enquiry: any,
  dealer: any
): Promise<RoutingResult> {
  const rules: RoutingRule[] = dealer.routing_rules || [];
  
  const result: RoutingResult = {
    send_to: [],
    priority: 'normal',
    matched_rules: [],
  };
  
  // Evaluate each rule
  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    if (evaluateConditions(enquiry, rule.conditions)) {
      // Rule matched!
      result.matched_rules.push(rule.name);
      
      // Merge actions
      result.send_to = [...new Set([...result.send_to, ...rule.actions.send_to])];
      
      if (rule.actions.assign_to && !result.assign_to) {
        result.assign_to = rule.actions.assign_to;
      }
      
      if (rule.actions.priority) {
        result.priority = getHigherPriority(result.priority, rule.actions.priority);
      }
      
      if (rule.actions.cc) {
        result.cc = [...new Set([...(result.cc || []), ...rule.actions.cc])];
      }
      
      if (rule.actions.bcc) {
        result.bcc = [...new Set([...(result.bcc || []), ...rule.actions.bcc])];
      }
      
      // If continue flag is not set, stop after first match
      if (!rule.continue) {
        break;
      }
    }
  }
  
  // If no rules matched, use default fallback
  if (result.send_to.length === 0) {
    result.send_to = getDefaultRecipients(enquiry, dealer);
  }
  
  return result;
}

/**
 * Evaluate all conditions in a rule (AND logic)
 */
function evaluateConditions(
  enquiry: any,
  conditions: RoutingCondition[]
): boolean {
  if (conditions.length === 0) return true; // No conditions = always match
  
  return conditions.every(condition => 
    evaluateCondition(enquiry, condition)
  );
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  enquiry: any,
  condition: RoutingCondition
): boolean {
  const fieldValue = getFieldValue(enquiry, condition.field);
  const { operator, value } = condition;
  
  try {
    switch (operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(value).toLowerCase();
      
      case 'not_equals':
        return String(fieldValue).toLowerCase() !== String(value).toLowerCase();
      
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
      
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
      
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      
      case 'less_than':
        return Number(fieldValue) < Number(value);
      
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(value);
      
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(value);
      
      case 'in_array':
        return Array.isArray(value) && value.includes(fieldValue);
      
      case 'not_in_array':
        return Array.isArray(value) && !value.includes(fieldValue);
      
      case 'is_empty':
        return !fieldValue || fieldValue === '' || fieldValue === null;
      
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '' && fieldValue !== null;
      
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          const numValue = Number(fieldValue);
          return numValue >= Number(value[0]) && numValue <= Number(value[1]);
        }
        return false;
      
      case 'outside_hours':
        return isOutsideBusinessHours(enquiry.createdAt, value);
      
      case 'within_hours':
        return !isOutsideBusinessHours(enquiry.createdAt, value);
      
      case 'matches_regex':
        const regex = new RegExp(value);
        return regex.test(String(fieldValue));
      
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  } catch (error) {
    console.error(`Error evaluating condition:`, error);
    return false;
  }
}

/**
 * Get field value from enquiry (supports nested paths like "metadata.vehicle_condition")
 */
function getFieldValue(enquiry: any, field: string): any {
  const parts = field.split('.');
  let value = enquiry;
  
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return null;
  }
  
  return value;
}

/**
 * Check if time is outside business hours
 */
function isOutsideBusinessHours(timestamp: Date, hoursRange: string): boolean {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  // Parse range like "09:00-17:00"
  const [start, end] = hoursRange.split('-');
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime < startTime || currentTime >= endTime;
}

/**
 * Get higher priority between two priorities
 */
function getHigherPriority(
  p1: 'low' | 'normal' | 'high' | 'urgent',
  p2: 'low' | 'normal' | 'high' | 'urgent'
): 'low' | 'normal' | 'high' | 'urgent' {
  const priorities = { low: 0, normal: 1, high: 2, urgent: 3 };
  return priorities[p1] > priorities[p2] ? p1 : p2;
}

/**
 * BMGroup email addresses for routing (Bloods Hyundai)
 */
const BMGROUP_EMAILS = {
  parts: 'bmgparts@bmgroup.com.au',         // Parts, Fleet, Contact
  service: 'bmgservice6@bmgroup.com.au',    // Service
  sellCar: ['hyundai@bmgroup.com.au', 'bmgused@bmgroup.com.au', 'bmgreception1@bmgroup.com.au'],
  showroom: 'hyundai@bmgroup.com.au',       // Showroom, Test Drive, Finance
  salesNew: 'hyundai@bmgroup.com.au',       // New vehicle sales
  salesDemo: 'hyundai@bmgroup.com.au',      // Demo vehicle sales
  salesUsed: 'bmgused@bmgroup.com.au',      // Used vehicle sales
};

/**
 * Check if dealer is BMGroup (Bloods Hyundai)
 */
function isBMGroupDealer(dealer: any): boolean {
  return ['blood-hyundai', 'bloods-hyundai'].includes(dealer.slug) || dealer.name?.toLowerCase().includes('blood');
}

/**
 * Get default recipients based on enquiry type
 */
function getDefaultRecipients(enquiry: any, dealer: any): string[] {
  const isBMGroup = isBMGroupDealer(dealer);

  // BMGroup-specific email routing
  if (isBMGroup) {
    const bmgEmails: Record<string, string | string[]> = {
      vehicle: BMGROUP_EMAILS.showroom,
      contact: BMGROUP_EMAILS.parts,
      finance: BMGROUP_EMAILS.showroom,
      service: BMGROUP_EMAILS.service,
      parts: BMGROUP_EMAILS.parts,
      fleet: BMGROUP_EMAILS.parts,
      test_drive: BMGROUP_EMAILS.showroom,
      sell_car: BMGROUP_EMAILS.sellCar,
      accessories: BMGROUP_EMAILS.parts,
      special_offer: BMGROUP_EMAILS.showroom,
    };
    const email = bmgEmails[enquiry.type] || BMGROUP_EMAILS.parts;
    return Array.isArray(email) ? email : [email];
  }

  // Default email routing for other dealers
  const defaultEmails: Record<string, string> = {
    vehicle: dealer.email || 'sales@dealer.com',
    contact: dealer.email || 'reception@dealer.com',
    finance: dealer.email || 'finance@dealer.com',
    service: dealer.email || 'service@dealer.com',
    parts: dealer.email || 'parts@dealer.com',
    test_drive: dealer.email || 'sales@dealer.com',
    sell_car: dealer.email || 'sales@dealer.com',
    accessories: dealer.email || 'parts@dealer.com',
  };

  const defaultEmail = defaultEmails[enquiry.type] || dealer.email || 'reception@dealer.com';
  return [defaultEmail];
}

/**
 * Create default routing rules for a dealer
 */
export function createDefaultRoutingRules(dealer: any): RoutingRule[] {
  const dealerEmail = dealer.email || 'reception@dealer.com';
  const isBMGroup = isBMGroupDealer(dealer);

  return [
    // Vehicle Enquiries - New
    {
      id: 'new-vehicle',
      name: 'New Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'vehicleInfo.condition', operator: 'equals', value: 'New' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.salesNew : dealerEmail],
        priority: 'high',
      },
    },
    // Vehicle Enquiries - Demo
    {
      id: 'demo-vehicle',
      name: 'Demo Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'vehicleInfo.condition', operator: 'equals', value: 'Demo' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.salesDemo : dealerEmail],
        priority: 'high',
      },
    },
    // Vehicle Enquiries - Used
    {
      id: 'used-vehicle',
      name: 'Used Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'vehicleInfo.condition', operator: 'equals', value: 'Used' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.salesUsed : dealerEmail],
        priority: 'normal',
      },
    },
    // Test Drive Requests
    {
      id: 'test-drive',
      name: 'Test Drive Requests',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'test_drive' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.showroom : dealerEmail],
        priority: 'high',
      },
    },
    // Finance Enquiries
    {
      id: 'finance',
      name: 'Finance Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'finance' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.showroom : dealerEmail],
        priority: 'normal',
      },
    },
    // Service Bookings
    {
      id: 'service',
      name: 'Service Bookings',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'service' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.service : dealerEmail],
        priority: 'normal',
      },
    },
    // Sell My Car
    {
      id: 'sell-car',
      name: 'Sell My Car Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'sell_car' },
      ],
      actions: {
        send_to: isBMGroup ? BMGROUP_EMAILS.sellCar : [dealerEmail],
        priority: 'normal',
      },
    },
    // Parts Enquiries
    {
      id: 'parts',
      name: 'Parts Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'parts' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.parts : dealerEmail],
        priority: 'normal',
      },
    },
    // Fleet Enquiries
    {
      id: 'fleet',
      name: 'Fleet Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'fleet' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.parts : dealerEmail],
        priority: 'normal',
      },
    },
    // Contact Form
    {
      id: 'contact',
      name: 'Contact Form Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'contact' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.parts : dealerEmail],
        priority: 'normal',
      },
    },
    // Accessories Enquiries
    {
      id: 'accessories',
      name: 'Accessories Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'accessories' },
      ],
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.parts : dealerEmail],
        priority: 'normal',
      },
    },
    // Catch-all for any other enquiries
    {
      id: 'default',
      name: 'All Other Enquiries',
      enabled: true,
      conditions: [], // No conditions = catch all
      actions: {
        send_to: [isBMGroup ? BMGROUP_EMAILS.parts : dealerEmail],
        priority: 'normal',
      },
    },
  ];
}









