# Forms Integration Research & Development

## Executive Summary

This document outlines the research findings for connecting existing frontend forms to the new backend enquiry management system. Currently, all forms submit to an external API (`/api/form` or `/api/newform`). We need to:

1. **Redirect all form submissions** to the new `/api/enquiry` endpoint
2. **Add email notification system** to alert staff when enquiries arrive
3. **Add auto-assignment rules** in the admin dashboard
4. **Implement conditional routing** based on enquiry type

---

## Current Form Inventory

### 1. **Contact Form** (`/contact`)
**Location**: `app/components/contact/ContactFormCard.vue`

**Current Behavior**:
- Submits to: `${config.public.apiUrl}/form`
- Form ID: `mainStore.site?.forms?.contact`
- Departments: Sales, Parts, Finance, Service, General

**Fields Collected**:
- First Name, Last Name
- Email, Phone
- Registration (Parts only)
- Message
- Department Type

**Required Changes**:
- ✅ Redirect to `/api/enquiry`
- ✅ Map `formType` to enquiry `type`
- ✅ Add dealer API key authentication
- ⚠️ Need to add email notifications for each department
- ⚠️ Need auto-assignment rules by department

---

### 2. **Vehicle Enquiry Forms** (Multiple Locations)

#### A. **Vehicle Enquiry Modal**
**Location**: `app/components/vehicle/VehicleEnquiryModal.vue`

**Current Behavior**:
- Submits to: `/api/form`
- Form ID: `mainStore.site?.forms?.carsales`
- Includes vehicle details, test drive, trade-in, finance options

**Fields Collected**:
- Name, Phone, Email, Message
- Vehicle Stock ID, Make, Model, Badge
- Test Drive checkbox
- Trade-in checkbox
- Finance interest checkbox

**Required Changes**:
- ✅ Redirect to `/api/enquiry` with `type: 'vehicle'`
- ✅ Map vehicle data to `vehicle_of_interest`
- ✅ Store test_drive, trade_in, finance flags
- ⚠️ Email sales team when submitted
- ⚠️ Auto-assign to available sales staff

---

#### B. **Single Form** (Search Results)
**Location**: `app/components/search/SingleForm.vue`

**Current Behavior**:
- Submits to: `/api/form`
- Similar to VehicleEnquiryModal

**Required Changes**: Same as Vehicle Enquiry Modal

---

#### C. **Vehicle Enquiry Form** (Standalone)
**Location**: `app/components/search/VehicleEnquiryForm.vue`

**Current Behavior**:
- Submits to: `/api/form`
- Form ID: `mainStore.site?.forms?.vehicle_enquiry`

**Required Changes**: Same as Vehicle Enquiry Modal

---

#### D. **Vehicle Enquire Page**
**Location**: `app/pages/vehicle-enquire/[...params].vue`

**Current Behavior**:
- Direct form submission (no API call visible in snippet)

**Required Changes**:
- ✅ Redirect to `/api/enquiry`
- ⚠️ Needs full code review

---

### 3. **Test Drive Forms**

#### A. **Test Drive Modal**
**Location**: `app/components/vehicle/VehicleTestDriveModal.vue`

**Current Behavior**:
- Submits to external API

**Fields Collected**:
- Name, Email, Phone
- Preferred Date, Time
- Vehicle details

**Required Changes**:
- ✅ Redirect to `/api/enquiry` with `type: 'test_drive'`
- ✅ Store preferred date/time in metadata
- ⚠️ Email sales team
- ⚠️ Auto-assign to test drive coordinator

---

#### B. **Test Drive Page**
**Location**: `app/pages/test-drive.vue`

**Current Behavior**:
- Just displays vehicle catalog (no form visible)

**Required Changes**:
- ⚠️ Needs form component added

---

### 4. **Sell My Car Form**
**Location**: `app/pages/sell-my-car.vue`

**Current Behavior**:
- Submits to: `${config.public.apiUrl}/newform`
- Form ID: 9
- Multi-step form with photo uploads

**Fields Collected**:
- Personal: First Name, Last Name, Email, Phone
- Vehicle: Year, Make, Model, Grade, VIN, Registration, Odometer
- Condition: Vehicle condition, Tyre condition, Service history, One owner
- Photos: 6 photo uploads
- Additional: Hail damage, Finance owing, Known faults, Accessories, Comments

**Required Changes**:
- ✅ Redirect to `/api/enquiry` with `type: 'sell_car'`
- ✅ Store vehicle details in metadata
- ✅ Handle photo uploads (store URLs in metadata)
- ⚠️ Email used car manager
- ⚠️ Auto-assign to used car department

---

### 5. **Finance Forms**

#### A. **Finance Form Component**
**Location**: `app/components/page-elements/FinanceForm.vue`

**Current Behavior**:
- Submits to external API

**Required Changes**:
- ✅ Redirect to `/api/enquiry` with `type: 'finance'`
- ⚠️ Email finance team
- ⚠️ Auto-assign to finance manager

---

#### B. **Finance Page Forms**
**Location**: `app/pages/finance/[id]/[slug].vue`

**Current Behavior**:
- Contains finance calculator and enquiry form

**Required Changes**:
- ✅ Redirect to `/api/enquiry`
- ⚠️ Store calculator results in metadata

---

### 6. **Offer/Special Offer Forms**
**Location**: `app/pages/offer/[id]/[name].vue`, `app/pages/special-offer/[id]/[name].vue`

**Current Behavior**:
- Submits to external API

**Required Changes**:
- ✅ Redirect to `/api/enquiry` with `type: 'vehicle'`
- ✅ Store offer ID in metadata
- ⚠️ Email sales team

---

## Backend Enquiry API Analysis

### Current Endpoint: `/api/enquiry`
**Location**: `server/api/enquiry.post.ts`

**Authentication**: API Key via `x-api-key` header

**Supported Types**:
- `contact`
- `vehicle`
- `finance`
- `test_drive`
- `service`
- `parts`
- `accessories`
- `sell_car`

**Required Fields**:
- `first_name`, `last_name`
- `email`
- `phone` (optional)
- `type`

**Optional Fields**:
- `message`
- `vehicle_of_interest`
- `preferred_contact_method`
- `preferred_contact_time`
- `test_drive` (boolean)
- `trade_in` (boolean)
- `finance_interest` (boolean)
- `metadata` (JSONB)
- `accessories_cart` (JSONB)
- `suburb`, `state`, `postcode`

---

## Required Backend Enhancements

### 1. **Email Notification System** 🔴 HIGH PRIORITY

**What's Needed**:
- SendGrid integration
- Email templates for each enquiry type
- Configurable recipient lists per department
- Email logging to `email_logs` table

**Implementation**:
```typescript
// server/utils/email.ts
- sendEnquiryNotification(enquiry, dealer)
- sendCustomerConfirmation(enquiry, dealer)
- sendDailySummary(dealer, enquiries)
```

**Admin Configuration**:
- Settings page: Configure email recipients by department
- Email template management (optional v2)

---

### 2. **Auto-Assignment Rules** 🟡 MEDIUM PRIORITY

**What's Needed**:
- Assignment logic in enquiry creation
- Round-robin or load-based assignment
- Department-based routing
- Admin UI to configure rules

**Implementation**:
```typescript
// server/utils/assignment.ts
- assignEnquiryToStaff(enquiryType, dealerId)
- getAvailableStaff(department, dealerId)
- updateAssignment(enquiryId, userId)
```

**Admin UI**:
- Settings page: Configure auto-assignment rules
- Staff page: Set department and availability

---

### 3. **Conditional Routing** 🟢 LOW PRIORITY

**What's Needed**:
- Business hours check
- After-hours routing
- Priority escalation rules

**Implementation**:
- Check dealer trading hours
- Route urgent enquiries differently
- Escalate old unassigned enquiries

---

## Implementation Plan

### Phase 1: Form Redirects (Week 1)
1. ✅ Update `ContactFormCard.vue` to use `/api/enquiry`
2. ✅ Update all vehicle enquiry forms
3. ✅ Update test drive forms
4. ✅ Update sell my car form
5. ✅ Update finance forms
6. ✅ Update offer forms
7. ✅ Add dealer API key to all submissions
8. ✅ Test all form submissions

### Phase 2: Email Notifications (Week 2)
1. 🔴 Install SendGrid SDK
2. 🔴 Create email templates
3. 🔴 Implement email utility functions
4. 🔴 Add email sending to enquiry creation
5. 🔴 Create admin UI for email configuration
6. 🔴 Test email delivery

### Phase 3: Auto-Assignment (Week 3)
1. 🟡 Add department field to users table
2. 🟡 Create assignment logic
3. 🟡 Add assignment to enquiry creation
4. 🟡 Create admin UI for assignment rules
5. 🟡 Test assignment logic

### Phase 4: Advanced Features (Week 4)
1. 🟢 Business hours logic
2. 🟢 Priority routing
3. 🟢 Escalation rules
4. 🟢 Analytics dashboard enhancements

---

## Database Schema Updates Needed

### 1. **Add to `dealers` table**:
```sql
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT '{}';
-- Structure: {
--   "sales": ["sales@dealer.com", "manager@dealer.com"],
--   "service": ["service@dealer.com"],
--   "parts": ["parts@dealer.com"],
--   "finance": ["finance@dealer.com"]
-- }
```

### 2. **Add to `users` table**:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
-- department: 'sales', 'service', 'parts', 'finance', 'admin'
```

### 3. **Add to `enquiries` table** (already exists):
- `assigned_to` ✅ Already exists
- `metadata` ✅ Already exists (JSONB)

---

## API Key Management

**Current Setup**:
- API key stored in `.env`: `NUXT_DEALER_API_KEY`
- Visible in admin settings page

**Required Changes**:
1. ✅ Make API key available to frontend forms
2. ✅ Add to runtime config as public variable
3. ✅ Include in all form submissions

**Implementation**:
```typescript
// nuxt.config.ts
runtimeConfig: {
  public: {
    dealerApiKey: process.env.NUXT_DEALER_API_KEY,
  }
}

// In forms:
const config = useRuntimeConfig();
await $fetch('/api/enquiry', {
  method: 'POST',
  headers: {
    'x-api-key': config.public.dealerApiKey,
  },
  body: { ... }
});
```

---

## Testing Checklist

### Form Submission Tests
- [ ] Contact form (all 5 departments)
- [ ] Vehicle enquiry modal
- [ ] Test drive form
- [ ] Sell my car form (all 4 steps)
- [ ] Finance form
- [ ] Service booking
- [ ] Parts enquiry
- [ ] Accessories cart

### Backend Tests
- [ ] Enquiry creation
- [ ] Email notifications sent
- [ ] Auto-assignment working
- [ ] Activity logging
- [ ] RLS enforcement

### Admin Dashboard Tests
- [ ] View all enquiries
- [ ] Filter by type/status
- [ ] View enquiry details
- [ ] Add notes
- [ ] Change status
- [ ] Reassign enquiries
- [ ] Email configuration
- [ ] Assignment rules

---

## Next Steps

1. **Immediate**: Update all forms to use `/api/enquiry` endpoint
2. **Week 1**: Implement email notification system
3. **Week 2**: Add auto-assignment logic
4. **Week 3**: Build admin configuration UI
5. **Week 4**: Test and refine

---

## Questions for Stakeholder

1. **Email Recipients**: Who should receive notifications for each department?
2. **Assignment Logic**: Round-robin or load-based? Or manual only?
3. **Business Hours**: Should after-hours enquiries be handled differently?
4. **Priority Levels**: Do some enquiry types need faster response?
5. **Integration**: Keep old API for backwards compatibility or full cutover?

---

## Risk Assessment

### High Risk
- ⚠️ Breaking existing form submissions during migration
- ⚠️ Email deliverability issues
- ⚠️ API key exposure

### Medium Risk
- ⚠️ Assignment logic bugs causing missed enquiries
- ⚠️ Performance issues with email sending

### Low Risk
- ⚠️ UI/UX changes needed for new features
- ⚠️ Training staff on new system

---

## Success Metrics

1. **100% of forms** submit to new enquiry system
2. **< 1 minute** email notification delivery
3. **< 5 minutes** auto-assignment time
4. **Zero lost enquiries** during migration
5. **Staff satisfaction** with new system

---

## Appendix: Form Mapping Table

| Form | Current Endpoint | New Type | Priority | Email To | Auto-Assign |
|------|-----------------|----------|----------|----------|-------------|
| Contact - Sales | `/api/form` | `contact` | High | Sales Team | Sales Staff |
| Contact - Service | `/api/form` | `service` | High | Service Team | Service Advisor |
| Contact - Parts | `/api/form` | `parts` | Medium | Parts Team | Parts Staff |
| Contact - Finance | `/api/form` | `finance` | High | Finance Team | Finance Manager |
| Contact - General | `/api/form` | `contact` | Medium | Reception | Admin |
| Vehicle Enquiry | `/api/form` | `vehicle` | High | Sales Team | Sales Staff |
| Test Drive | `/api/form` | `test_drive` | High | Sales Team | Test Drive Coordinator |
| Sell My Car | `/api/newform` | `sell_car` | Medium | Used Car Manager | Used Car Staff |
| Finance Calculator | `/api/form` | `finance` | High | Finance Team | Finance Manager |
| Service Booking | `/api/form` | `service` | High | Service Team | Service Advisor |
| Parts Order | `/api/form` | `parts` | Medium | Parts Team | Parts Staff |
| Accessories | `/api/form` | `accessories` | Low | Parts Team | Parts Staff |







