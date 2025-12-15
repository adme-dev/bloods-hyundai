/**
 * Franchise Dealership Sales Funnel Configuration
 *
 * Based on automotive industry CRM best practices:
 * - Lead temperature classification (Cold → Warm → Hot)
 * - Stage-based pipeline progression
 * - Outcome tracking (Won/Lost/Dead)
 *
 * References:
 * - https://modera.com/automotive/sales-funnel-car-dealers/
 * - https://www.acvmax.com/blog/automotive-sales-funnel
 */

// ============================================================================
// ENQUIRY/LEAD STATUS - Sales Pipeline Stages
// ============================================================================

export const ENQUIRY_STATUSES = {
  // Stage 1: New Leads (Cold)
  NEW_LEAD: 'new_lead',

  // Stage 2: Qualification (Cold → Warm)
  QUALIFIED: 'qualified',
  ATTEMPTED_CONTACT: 'attempted_contact',

  // Stage 3: Engagement (Warm)
  APPOINTMENT_SET: 'appointment_set',
  SHOWED: 'showed',
  TEST_DRIVE: 'test_drive',

  // Stage 4: Negotiation (Hot)
  NEGOTIATING: 'negotiating',
  PENDING_FINANCE: 'pending_finance',
  PENDING_TRADE: 'pending_trade',
  DEPOSIT_TAKEN: 'deposit_taken',

  // Stage 5: Outcomes
  SOLD: 'sold',
  LOST: 'lost',
  DEAD: 'dead',
} as const;

export type EnquiryStatus = typeof ENQUIRY_STATUSES[keyof typeof ENQUIRY_STATUSES];

// All valid status values for validation
export const VALID_ENQUIRY_STATUSES: EnquiryStatus[] = Object.values(ENQUIRY_STATUSES);

// Status metadata for UI display
export interface StatusConfig {
  key: EnquiryStatus;
  label: string;
  description: string;
  stage: 'cold' | 'warm' | 'hot' | 'closed';
  color: string;
  bgClass: string;
  textClass: string;
  order: number;
}

export const ENQUIRY_STATUS_CONFIG: Record<EnquiryStatus, StatusConfig> = {
  // Cold Leads
  [ENQUIRY_STATUSES.NEW_LEAD]: {
    key: ENQUIRY_STATUSES.NEW_LEAD,
    label: 'New Lead',
    description: 'Fresh enquiry, not yet contacted',
    stage: 'cold',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
    order: 1,
  },
  [ENQUIRY_STATUSES.QUALIFIED]: {
    key: ENQUIRY_STATUSES.QUALIFIED,
    label: 'Qualified',
    description: 'Budget & intent confirmed',
    stage: 'cold',
    color: 'cyan',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    order: 2,
  },
  [ENQUIRY_STATUSES.ATTEMPTED_CONTACT]: {
    key: ENQUIRY_STATUSES.ATTEMPTED_CONTACT,
    label: 'Attempted Contact',
    description: 'Contact attempted, no response yet',
    stage: 'cold',
    color: 'slate',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-700 dark:text-slate-300',
    order: 3,
  },

  // Warm Leads
  [ENQUIRY_STATUSES.APPOINTMENT_SET]: {
    key: ENQUIRY_STATUSES.APPOINTMENT_SET,
    label: 'Appointment Set',
    description: 'Showroom visit scheduled',
    stage: 'warm',
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300',
    order: 4,
  },
  [ENQUIRY_STATUSES.SHOWED]: {
    key: ENQUIRY_STATUSES.SHOWED,
    label: 'Showed',
    description: 'Customer visited showroom',
    stage: 'warm',
    color: 'yellow',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-300',
    order: 5,
  },
  [ENQUIRY_STATUSES.TEST_DRIVE]: {
    key: ENQUIRY_STATUSES.TEST_DRIVE,
    label: 'Test Drive',
    description: 'Completed test drive',
    stage: 'warm',
    color: 'orange',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-300',
    order: 6,
  },

  // Hot Leads
  [ENQUIRY_STATUSES.NEGOTIATING]: {
    key: ENQUIRY_STATUSES.NEGOTIATING,
    label: 'Negotiating',
    description: 'Price/terms discussion',
    stage: 'hot',
    color: 'rose',
    bgClass: 'bg-rose-100 dark:bg-rose-900/30',
    textClass: 'text-rose-700 dark:text-rose-300',
    order: 7,
  },
  [ENQUIRY_STATUSES.PENDING_FINANCE]: {
    key: ENQUIRY_STATUSES.PENDING_FINANCE,
    label: 'Pending Finance',
    description: 'Awaiting finance approval',
    stage: 'hot',
    color: 'purple',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300',
    order: 8,
  },
  [ENQUIRY_STATUSES.PENDING_TRADE]: {
    key: ENQUIRY_STATUSES.PENDING_TRADE,
    label: 'Pending Trade',
    description: 'Trade-in valuation pending',
    stage: 'hot',
    color: 'violet',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    textClass: 'text-violet-700 dark:text-violet-300',
    order: 9,
  },
  [ENQUIRY_STATUSES.DEPOSIT_TAKEN]: {
    key: ENQUIRY_STATUSES.DEPOSIT_TAKEN,
    label: 'Deposit Taken',
    description: 'Holding deposit received',
    stage: 'hot',
    color: 'pink',
    bgClass: 'bg-pink-100 dark:bg-pink-900/30',
    textClass: 'text-pink-700 dark:text-pink-300',
    order: 10,
  },

  // Closed Outcomes
  [ENQUIRY_STATUSES.SOLD]: {
    key: ENQUIRY_STATUSES.SOLD,
    label: 'Sold',
    description: 'Deal completed',
    stage: 'closed',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
    order: 11,
  },
  [ENQUIRY_STATUSES.LOST]: {
    key: ENQUIRY_STATUSES.LOST,
    label: 'Lost',
    description: 'Customer chose competitor',
    stage: 'closed',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-300',
    order: 12,
  },
  [ENQUIRY_STATUSES.DEAD]: {
    key: ENQUIRY_STATUSES.DEAD,
    label: 'Dead',
    description: 'Unresponsive or invalid lead',
    stage: 'closed',
    color: 'gray',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-500 dark:text-gray-400',
    order: 13,
  },
};

// Helper to get sorted statuses for dropdowns
export function getSortedStatuses(): StatusConfig[] {
  return Object.values(ENQUIRY_STATUS_CONFIG).sort((a, b) => a.order - b.order);
}

// Helper to get statuses by stage
export function getStatusesByStage(stage: StatusConfig['stage']): StatusConfig[] {
  return getSortedStatuses().filter(s => s.stage === stage);
}

// Pipeline stages for visual funnel
export const PIPELINE_STAGES = [
  {
    key: 'cold',
    label: 'Cold Leads',
    description: 'New & qualifying',
    statuses: [ENQUIRY_STATUSES.NEW_LEAD, ENQUIRY_STATUSES.QUALIFIED, ENQUIRY_STATUSES.ATTEMPTED_CONTACT],
  },
  {
    key: 'warm',
    label: 'Warm Leads',
    description: 'Engaged & visiting',
    statuses: [ENQUIRY_STATUSES.APPOINTMENT_SET, ENQUIRY_STATUSES.SHOWED, ENQUIRY_STATUSES.TEST_DRIVE],
  },
  {
    key: 'hot',
    label: 'Hot Leads',
    description: 'Negotiating & closing',
    statuses: [ENQUIRY_STATUSES.NEGOTIATING, ENQUIRY_STATUSES.PENDING_FINANCE, ENQUIRY_STATUSES.PENDING_TRADE, ENQUIRY_STATUSES.DEPOSIT_TAKEN],
  },
  {
    key: 'closed',
    label: 'Closed',
    description: 'Outcomes',
    statuses: [ENQUIRY_STATUSES.SOLD, ENQUIRY_STATUSES.LOST, ENQUIRY_STATUSES.DEAD],
  },
] as const;


// ============================================================================
// CUSTOMER LIFECYCLE STAGES - Retention & CRM
// ============================================================================

export const LIFECYCLE_STAGES = {
  // Acquisition
  PROSPECT: 'prospect',
  LEAD: 'lead',
  OPPORTUNITY: 'opportunity',

  // Conversion
  TEST_DRIVE: 'test_drive',
  NEGOTIATING: 'negotiating',

  // Customer
  NEW_CUSTOMER: 'new_customer',
  ACTIVE_CUSTOMER: 'active_customer',
  SERVICE_CUSTOMER: 'service_customer',

  // Retention Risk
  AT_RISK: 'at_risk',
  CHURNING: 'churning',

  // Lost
  INACTIVE: 'inactive',
  LOST: 'lost',
} as const;

export type LifecycleStage = typeof LIFECYCLE_STAGES[keyof typeof LIFECYCLE_STAGES];

export const VALID_LIFECYCLE_STAGES: LifecycleStage[] = Object.values(LIFECYCLE_STAGES);

export interface LifecycleConfig {
  key: LifecycleStage;
  label: string;
  description: string;
  category: 'acquisition' | 'conversion' | 'customer' | 'risk' | 'lost';
  color: string;
  order: number;
}

export const LIFECYCLE_STAGE_CONFIG: Record<LifecycleStage, LifecycleConfig> = {
  // Acquisition
  [LIFECYCLE_STAGES.PROSPECT]: {
    key: LIFECYCLE_STAGES.PROSPECT,
    label: 'Prospect',
    description: 'Potential customer, minimal engagement',
    category: 'acquisition',
    color: 'slate',
    order: 1,
  },
  [LIFECYCLE_STAGES.LEAD]: {
    key: LIFECYCLE_STAGES.LEAD,
    label: 'Lead',
    description: 'Submitted enquiry or contact info',
    category: 'acquisition',
    color: 'blue',
    order: 2,
  },
  [LIFECYCLE_STAGES.OPPORTUNITY]: {
    key: LIFECYCLE_STAGES.OPPORTUNITY,
    label: 'Opportunity',
    description: 'Qualified with purchase intent',
    category: 'acquisition',
    color: 'cyan',
    order: 3,
  },

  // Conversion
  [LIFECYCLE_STAGES.TEST_DRIVE]: {
    key: LIFECYCLE_STAGES.TEST_DRIVE,
    label: 'Test Drive',
    description: 'Completed vehicle test drive',
    category: 'conversion',
    color: 'amber',
    order: 4,
  },
  [LIFECYCLE_STAGES.NEGOTIATING]: {
    key: LIFECYCLE_STAGES.NEGOTIATING,
    label: 'Negotiating',
    description: 'Active deal negotiation',
    category: 'conversion',
    color: 'orange',
    order: 5,
  },

  // Customer
  [LIFECYCLE_STAGES.NEW_CUSTOMER]: {
    key: LIFECYCLE_STAGES.NEW_CUSTOMER,
    label: 'New Customer',
    description: 'Recently purchased (< 90 days)',
    category: 'customer',
    color: 'green',
    order: 6,
  },
  [LIFECYCLE_STAGES.ACTIVE_CUSTOMER]: {
    key: LIFECYCLE_STAGES.ACTIVE_CUSTOMER,
    label: 'Active Customer',
    description: 'Regular engagement',
    category: 'customer',
    color: 'emerald',
    order: 7,
  },
  [LIFECYCLE_STAGES.SERVICE_CUSTOMER]: {
    key: LIFECYCLE_STAGES.SERVICE_CUSTOMER,
    label: 'Service Customer',
    description: 'Service-only relationship',
    category: 'customer',
    color: 'teal',
    order: 8,
  },

  // Risk
  [LIFECYCLE_STAGES.AT_RISK]: {
    key: LIFECYCLE_STAGES.AT_RISK,
    label: 'At Risk',
    description: 'Declining engagement',
    category: 'risk',
    color: 'yellow',
    order: 9,
  },
  [LIFECYCLE_STAGES.CHURNING]: {
    key: LIFECYCLE_STAGES.CHURNING,
    label: 'Churning',
    description: 'High churn risk',
    category: 'risk',
    color: 'red',
    order: 10,
  },

  // Lost
  [LIFECYCLE_STAGES.INACTIVE]: {
    key: LIFECYCLE_STAGES.INACTIVE,
    label: 'Inactive',
    description: 'No engagement for extended period',
    category: 'lost',
    color: 'gray',
    order: 11,
  },
  [LIFECYCLE_STAGES.LOST]: {
    key: LIFECYCLE_STAGES.LOST,
    label: 'Lost',
    description: 'Confirmed lost customer',
    category: 'lost',
    color: 'zinc',
    order: 12,
  },
};


// ============================================================================
// LOST REASON CODES
// ============================================================================

export const LOST_REASONS = {
  PRICE: 'price',
  COMPETITOR: 'competitor',
  TIMING: 'timing',
  CREDIT_DECLINED: 'credit_declined',
  TRADE_VALUE: 'trade_value',
  VEHICLE_UNAVAILABLE: 'vehicle_unavailable',
  POOR_EXPERIENCE: 'poor_experience',
  NO_RESPONSE: 'no_response',
  OTHER: 'other',
} as const;

export type LostReason = typeof LOST_REASONS[keyof typeof LOST_REASONS];

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  [LOST_REASONS.PRICE]: 'Price too high',
  [LOST_REASONS.COMPETITOR]: 'Went to competitor',
  [LOST_REASONS.TIMING]: 'Not ready to buy',
  [LOST_REASONS.CREDIT_DECLINED]: 'Finance declined',
  [LOST_REASONS.TRADE_VALUE]: 'Trade-in value dispute',
  [LOST_REASONS.VEHICLE_UNAVAILABLE]: 'Vehicle not available',
  [LOST_REASONS.POOR_EXPERIENCE]: 'Poor experience',
  [LOST_REASONS.NO_RESPONSE]: 'No response / uncontactable',
  [LOST_REASONS.OTHER]: 'Other',
};
