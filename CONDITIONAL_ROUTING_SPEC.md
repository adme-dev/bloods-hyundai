# Conditional Email Routing Specification

## Overview
Implement conditional email routing in the admin dashboard to send enquiry notifications to different recipients based on enquiry attributes (like vehicle condition, type, department, etc.).

## Use Cases

### 1. **Vehicle Enquiries by Condition**
```
IF vehicle_condition = "New" 
  THEN send to: newsales@dealer.com
  
IF vehicle_condition = "Demo" 
  THEN send to: demosales@dealer.com
  
IF vehicle_condition = "Used" 
  THEN send to: usedsales@dealer.com
```

### 2. **Enquiries by Type**
```
IF type = "vehicle" 
  THEN send to: sales@dealer.com
  
IF type = "service" 
  THEN send to: service@dealer.com
  
IF type = "parts" 
  THEN send to: parts@dealer.com
  
IF type = "finance" 
  THEN send to: finance@dealer.com
```

### 3. **High-Value Enquiries**
```
IF vehicle_price > $50,000 
  THEN send to: manager@dealer.com, sales@dealer.com
  
IF finance_amount > $100,000 
  THEN send to: financemanager@dealer.com
```

### 4. **Time-Based Routing**
```
IF submitted_time BETWEEN 9am-5pm 
  THEN send to: sales@dealer.com
  
IF submitted_time OUTSIDE business_hours 
  THEN send to: afterhours@dealer.com
```

### 5. **Geographic Routing**
```
IF postcode IN [3850, 3851, 3852] 
  THEN send to: localsales@dealer.com
  
IF state = "VIC" 
  THEN send to: vicsales@dealer.com
```

---

## Database Schema

### Add to `dealers` table:
```sql
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS routing_rules JSONB DEFAULT '[]';
```

**Structure**:
```json
{
  "routing_rules": [
    {
      "id": "rule-1",
      "name": "New Vehicle Enquiries",
      "enabled": true,
      "conditions": [
        {
          "field": "metadata.vehicle_condition",
          "operator": "equals",
          "value": "New"
        }
      ],
      "actions": {
        "send_to": ["newsales@dealer.com", "manager@dealer.com"],
        "assign_to": "user-uuid-123",
        "priority": "high"
      }
    },
    {
      "id": "rule-2",
      "name": "Demo Vehicle Enquiries",
      "enabled": true,
      "conditions": [
        {
          "field": "metadata.vehicle_condition",
          "operator": "equals",
          "value": "Demo"
        }
      ],
      "actions": {
        "send_to": ["demosales@dealer.com"],
        "assign_to": "user-uuid-456"
      }
    },
    {
      "id": "rule-3",
      "name": "Used Vehicle Enquiries",
      "enabled": true,
      "conditions": [
        {
          "field": "metadata.vehicle_condition",
          "operator": "equals",
          "value": "Used"
        }
      ],
      "actions": {
        "send_to": ["usedsales@dealer.com"],
        "assign_to": "user-uuid-789"
      }
    },
    {
      "id": "rule-4",
      "name": "High Value Enquiries",
      "enabled": true,
      "conditions": [
        {
          "field": "metadata.vehicle_price",
          "operator": "greater_than",
          "value": 50000
        }
      ],
      "actions": {
        "send_to": ["manager@dealer.com", "sales@dealer.com"],
        "priority": "urgent"
      }
    },
    {
      "id": "rule-5",
      "name": "After Hours",
      "enabled": true,
      "conditions": [
        {
          "field": "created_at_time",
          "operator": "outside_hours",
          "value": "09:00-17:00"
        }
      ],
      "actions": {
        "send_to": ["afterhours@dealer.com"],
        "assign_to": null
      }
    }
  ]
}
```

---

## Supported Operators

### Comparison Operators
- `equals` - Exact match
- `not_equals` - Not equal
- `contains` - String contains
- `not_contains` - String does not contain
- `starts_with` - String starts with
- `ends_with` - String ends with
- `greater_than` - Numeric >
- `less_than` - Numeric <
- `greater_than_or_equal` - Numeric >=
- `less_than_or_equal` - Numeric <=
- `in_array` - Value in list
- `not_in_array` - Value not in list

### Special Operators
- `is_empty` - Field is null/empty
- `is_not_empty` - Field has value
- `between` - Numeric range
- `outside_hours` - Time outside range
- `within_hours` - Time within range
- `matches_regex` - Regex pattern match

---

## Available Fields for Conditions

### Core Enquiry Fields
- `type` - Enquiry type (contact, vehicle, finance, etc.)
- `status` - Current status (new, in_progress, etc.)
- `first_name` - Customer first name
- `last_name` - Customer last name
- `email` - Customer email
- `phone` - Customer phone
- `suburb` - Customer suburb
- `state` - Customer state
- `postcode` - Customer postcode
- `created_at` - Submission timestamp
- `created_at_time` - Submission time (HH:MM)
- `created_at_day` - Day of week (Monday-Sunday)

### Metadata Fields (from JSONB)
- `metadata.vehicle_condition` - New/Demo/Used
- `metadata.vehicle_make` - Vehicle make
- `metadata.vehicle_model` - Vehicle model
- `metadata.vehicle_year` - Vehicle year
- `metadata.vehicle_price` - Vehicle price
- `metadata.stock_id` - Stock ID
- `metadata.test_drive` - Test drive requested (boolean)
- `metadata.trade_in` - Trade-in interest (boolean)
- `metadata.finance_interest` - Finance interest (boolean)
- `metadata.finance_amount` - Requested finance amount
- `metadata.preferred_date` - Preferred contact date
- `metadata.urgency` - Urgency level

---

## Rule Processing Logic

### 1. **Rule Evaluation Order**
Rules are evaluated in order from top to bottom. First matching rule wins (unless "continue" flag is set).

### 2. **Multiple Conditions (AND Logic)**
All conditions in a rule must be true for the rule to match:
```json
{
  "conditions": [
    {"field": "type", "operator": "equals", "value": "vehicle"},
    {"field": "metadata.vehicle_condition", "operator": "equals", "value": "New"}
  ]
}
```
Both conditions must be true.

### 3. **OR Logic (Multiple Rules)**
Create separate rules for OR logic:
```json
[
  {
    "name": "New or Demo Vehicles - Rule 1",
    "conditions": [{"field": "metadata.vehicle_condition", "operator": "equals", "value": "New"}],
    "actions": {"send_to": ["sales@dealer.com"]}
  },
  {
    "name": "New or Demo Vehicles - Rule 2",
    "conditions": [{"field": "metadata.vehicle_condition", "operator": "equals", "value": "Demo"}],
    "actions": {"send_to": ["sales@dealer.com"]}
  }
]
```

### 4. **Default Fallback Rule**
Always have a catch-all rule at the end:
```json
{
  "id": "default",
  "name": "Default - All Other Enquiries",
  "enabled": true,
  "conditions": [],
  "actions": {
    "send_to": ["reception@dealer.com"]
  }
}
```

---

## Admin UI Design

### Page: `/admin/settings/routing`

#### **Section 1: Routing Rules List**
```
┌─────────────────────────────────────────────────────────────┐
│ Email Routing Rules                          [+ Add Rule]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ☑ New Vehicle Enquiries                    [Edit] [Delete]  │
│   When: Vehicle Condition = "New"                            │
│   Send to: newsales@dealer.com, manager@dealer.com          │
│   Assign to: John Smith                                      │
│                                                               │
│ ☑ Demo Vehicle Enquiries                   [Edit] [Delete]  │
│   When: Vehicle Condition = "Demo"                           │
│   Send to: demosales@dealer.com                             │
│   Assign to: Jane Doe                                        │
│                                                               │
│ ☑ Used Vehicle Enquiries                   [Edit] [Delete]  │
│   When: Vehicle Condition = "Used"                           │
│   Send to: usedsales@dealer.com                             │
│   Assign to: Bob Johnson                                     │
│                                                               │
│ ☐ High Value Enquiries (Disabled)          [Edit] [Delete]  │
│   When: Vehicle Price > $50,000                              │
│   Send to: manager@dealer.com                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### **Section 2: Add/Edit Rule Modal**
```
┌─────────────────────────────────────────────────────────────┐
│ Add Routing Rule                                      [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Rule Name *                                                   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ New Vehicle Enquiries                                  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ Enabled  [✓]                                                 │
│                                                               │
│ ─────────────────────────────────────────────────────────   │
│                                                               │
│ Conditions (All must be true)                                │
│                                                               │
│ ┌─────────────┬──────────────┬─────────────────┬─────┐      │
│ │ Field       │ Operator     │ Value           │  -  │      │
│ ├─────────────┼──────────────┼─────────────────┼─────┤      │
│ │ Vehicle     │ equals       │ New             │  X  │      │
│ │ Condition ▼ │            ▼ │               ▼ │     │      │
│ └─────────────┴──────────────┴─────────────────┴─────┘      │
│                                                [+ Add]        │
│                                                               │
│ ─────────────────────────────────────────────────────────   │
│                                                               │
│ Actions                                                       │
│                                                               │
│ Send Email To *                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ newsales@dealer.com                            [X]    │   │
│ │ manager@dealer.com                             [X]    │   │
│ └───────────────────────────────────────────────────────┘   │
│ [+ Add Email]                                                 │
│                                                               │
│ Auto-Assign To                                                │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Select Staff Member                                  ▼│   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ Priority Level                                                │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Normal                                               ▼│   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│                                    [Cancel]  [Save Rule]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Files

### 1. **Backend: Routing Engine**
`server/utils/routing.ts`
```typescript
export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: RoutingCondition[];
  actions: RoutingActions;
}

export interface RoutingCondition {
  field: string;
  operator: string;
  value: any;
}

export interface RoutingActions {
  send_to: string[];
  assign_to?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export async function evaluateRoutingRules(
  enquiry: any,
  dealer: any
): Promise<RoutingActions> {
  const rules = dealer.routing_rules || [];
  
  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    if (evaluateConditions(enquiry, rule.conditions)) {
      return rule.actions;
    }
  }
  
  // Default fallback
  return {
    send_to: [dealer.email || 'reception@dealer.com'],
    priority: 'normal'
  };
}

function evaluateConditions(
  enquiry: any,
  conditions: RoutingCondition[]
): boolean {
  return conditions.every(condition => 
    evaluateCondition(enquiry, condition)
  );
}

function evaluateCondition(
  enquiry: any,
  condition: RoutingCondition
): boolean {
  const fieldValue = getFieldValue(enquiry, condition.field);
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains':
      return String(fieldValue).includes(condition.value);
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    case 'in_array':
      return condition.value.includes(fieldValue);
    // ... more operators
    default:
      return false;
  }
}

function getFieldValue(enquiry: any, field: string): any {
  // Handle nested fields like "metadata.vehicle_condition"
  const parts = field.split('.');
  let value = enquiry;
  
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return null;
  }
  
  return value;
}
```

### 2. **Backend: Update Enquiry Creation**
`server/api/enquiry.post.ts` (add routing logic)
```typescript
import { evaluateRoutingRules } from '../utils/routing';
import { sendEnquiryNotification } from '../utils/email';

// After creating enquiry...
const routingActions = await evaluateRoutingRules(enquiry, dealer);

// Send emails to routed recipients
await sendEnquiryNotification(
  enquiry,
  dealer,
  routingActions.send_to
);

// Auto-assign if specified
if (routingActions.assign_to) {
  await db.update(enquiries)
    .set({ assignedTo: routingActions.assign_to })
    .where(eq(enquiries.id, enquiry.id));
}
```

### 3. **Admin UI: Routing Rules Page**
`app/pages/admin/settings/routing.vue`

### 4. **Admin UI: Rule Editor Component**
`app/components/admin/RoutingRuleEditor.vue`

---

## Testing Scenarios

### Test Case 1: New Vehicle Enquiry
```
Input:
- type: "vehicle"
- metadata.vehicle_condition: "New"

Expected:
- Email sent to: newsales@dealer.com, manager@dealer.com
- Assigned to: John Smith
```

### Test Case 2: After Hours Enquiry
```
Input:
- created_at: "2024-01-15 22:30:00"

Expected:
- Email sent to: afterhours@dealer.com
- Not auto-assigned
```

### Test Case 3: High Value Finance
```
Input:
- type: "finance"
- metadata.finance_amount: 120000

Expected:
- Email sent to: financemanager@dealer.com
- Priority: urgent
```

### Test Case 4: No Matching Rules
```
Input:
- type: "general"
- No special conditions

Expected:
- Email sent to: reception@dealer.com (default)
- Priority: normal
```

---

## Migration Plan

### Step 1: Add Database Column
```sql
ALTER TABLE dealers ADD COLUMN routing_rules JSONB DEFAULT '[]';
```

### Step 2: Create Default Rules
For each dealer, create basic rules:
```sql
UPDATE dealers SET routing_rules = '[
  {
    "id": "default-sales",
    "name": "Sales Enquiries",
    "enabled": true,
    "conditions": [{"field": "type", "operator": "equals", "value": "vehicle"}],
    "actions": {"send_to": ["sales@dealer.com"]}
  },
  {
    "id": "default-service",
    "name": "Service Enquiries",
    "enabled": true,
    "conditions": [{"field": "type", "operator": "equals", "value": "service"}],
    "actions": {"send_to": ["service@dealer.com"]}
  }
]'::jsonb WHERE routing_rules = '[]'::jsonb;
```

### Step 3: Implement Routing Engine
- Create `server/utils/routing.ts`
- Add tests

### Step 4: Update Enquiry API
- Integrate routing evaluation
- Add email sending

### Step 5: Build Admin UI
- Create routing rules page
- Add rule editor
- Test UI

### Step 6: User Training
- Document how to create rules
- Provide examples
- Train admin staff

---

## Future Enhancements

### Phase 2 Features
1. **Rule Templates** - Pre-built rules for common scenarios
2. **Rule Testing** - Test rules before enabling
3. **Rule Analytics** - Track which rules are triggered most
4. **Advanced Logic** - Support for OR conditions, nested groups
5. **Webhooks** - Trigger external systems based on rules
6. **SMS Notifications** - Send SMS in addition to email
7. **Escalation Rules** - Auto-escalate if no response in X hours
8. **Business Hours Config** - Per-dealer business hours settings

---

## Success Metrics

1. **Routing Accuracy**: 95%+ of enquiries routed correctly
2. **Response Time**: Faster response due to correct routing
3. **Staff Satisfaction**: Easier to manage enquiries
4. **Configuration Time**: < 10 minutes to set up basic rules
5. **Error Rate**: < 1% routing errors











