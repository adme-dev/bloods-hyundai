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
 * Get default recipients based on enquiry type
 */
function getDefaultRecipients(enquiry: any, dealer: any): string[] {
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
  
  return [
    {
      id: 'new-vehicle',
      name: 'New Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'metadata.vehicle_condition', operator: 'equals', value: 'New' },
      ],
      actions: {
        send_to: [dealerEmail],
        priority: 'high',
      },
    },
    {
      id: 'demo-vehicle',
      name: 'Demo Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'metadata.vehicle_condition', operator: 'equals', value: 'Demo' },
      ],
      actions: {
        send_to: [dealerEmail],
        priority: 'high',
      },
    },
    {
      id: 'used-vehicle',
      name: 'Used Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'metadata.vehicle_condition', operator: 'equals', value: 'Used' },
      ],
      actions: {
        send_to: [dealerEmail],
        priority: 'normal',
      },
    },
    {
      id: 'test-drive',
      name: 'Test Drive Requests',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'test_drive' },
      ],
      actions: {
        send_to: [dealerEmail],
        priority: 'high',
      },
    },
    {
      id: 'finance',
      name: 'Finance Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'finance' },
      ],
      actions: {
        send_to: [dealerEmail],
        priority: 'normal',
      },
    },
    {
      id: 'service',
      name: 'Service Bookings',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'service' },
      ],
      actions: {
        send_to: [dealerEmail],
        priority: 'normal',
      },
    },
    {
      id: 'default',
      name: 'All Other Enquiries',
      enabled: true,
      conditions: [], // No conditions = catch all
      actions: {
        send_to: [dealerEmail],
        priority: 'normal',
      },
    },
  ];
}










