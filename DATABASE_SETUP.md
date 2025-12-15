# Database Setup Documentation

## Overview
The multi-tenant enquiry management system database has been successfully set up on Neon PostgreSQL.

## Database Information
- **Project ID**: `green-tooth-34908352`
- **Project Name**: Hyundai-Dealer
- **Database**: `neondb`
- **Branches**:
  - `production` (br-tiny-credit-a7flvj6h) - Main production branch
  - `development` (br-fragrant-hill-a7q9omx0) - Development/testing branch

## Current Status
✅ **Development Branch**: Fully configured with multi-tenant schema
⏳ **Production Branch**: Ready for schema migration

## Schema Overview

### Core Tables Created

#### 1. `dealer_groups` (Optional)
Parent table for multi-dealership owners.
- `id` (UUID, Primary Key)
- `name` (VARCHAR 200)
- `slug` (VARCHAR 50, Unique)
- `settings` (JSONB)
- `created_at` (Timestamp)

#### 2. `dealers` (Tenant Registry)
Central registry for all dealerships using the platform.
- `id` (UUID, Primary Key)
- `slug` (VARCHAR 50, Unique) - e.g., 'sale-hyundai'
- `name` (VARCHAR 200) - e.g., 'Sale Hyundai'
- `api_key` (VARCHAR 100, Unique) - For form submissions
- Contact info: `email`, `phone`, `address`, `suburb`, `state`, `postcode`
- Branding: `logo_url`, `primary_color`, `website_url`
- `settings` (JSONB) - Dealer-specific configuration
- `email_settings` (JSONB) - Email notification preferences
- `oem` (VARCHAR 50) - e.g., 'hyundai'
- `dealer_group_id` (UUID, FK to dealer_groups)
- `is_active` (Boolean)
- `subscription_tier` (VARCHAR 30)
- Timestamps: `created_at`, `updated_at`

**Indexes:**
- `idx_dealers_api_key` on `api_key`
- `idx_dealers_slug` on `slug`

#### 3. `users` (Staff Accounts - Tenant-Scoped)
Staff members who access the dashboard.
- `id` (UUID, Primary Key)
- `dealer_id` (UUID, FK to dealers) - **Tenant isolation key**
- Authentication: `email`, `password_hash`
- Profile: `first_name`, `last_name`, `avatar_url`
- Authorization: `role`, `department`, `permissions` (JSONB)
- Status: `is_active`, `email_verified`
- Timestamps: `created_at`, `updated_at`, `last_login`
- **Unique constraint**: (dealer_id, email) - Same email can exist at different dealers

**Indexes:**
- `idx_users_dealer` on `dealer_id`
- `idx_users_email` on `email`

**Row-Level Security**: ✅ Enabled

#### 4. `enquiries` (Form Submissions - Tenant-Scoped)
All customer enquiries from dealer websites.
- `id` (UUID, Primary Key)
- `dealer_id` (UUID, FK to dealers) - **Tenant isolation key**
- Type & Source: `type`, `source`, `department`
- Customer: `first_name`, `last_name`, `email`, `phone`, `postcode`
- Content: `message`
- Type-specific data (JSONB):
  - `vehicle_info` - Vehicle enquiries
  - `trade_in_info` - Trade-in details
  - `finance_details` - Finance applications
  - `sell_car_details` - Sell my car submissions
  - `accessories_cart` - Accessories shop cart
- Workflow: `status`, `priority`, `assigned_to` (FK to users)
- Timestamps: `created_at`, `updated_at`, `contacted_at`, `closed_at`
- Integration: `external_ref`, `synced_to_crm`, `crm_ref`
- Tracking: `utm_source`, `utm_medium`, `utm_campaign`, `ip_address`, `user_agent`

**Indexes:**
- `idx_enquiries_dealer` on `dealer_id`
- `idx_enquiries_dealer_status` on `(dealer_id, status)`
- `idx_enquiries_dealer_type` on `(dealer_id, type)`
- `idx_enquiries_dealer_created` on `(dealer_id, created_at DESC)`
- `idx_enquiries_assigned` on `assigned_to`
- `idx_enquiries_email` on `email`

**Row-Level Security**: ✅ Enabled

#### 5. `enquiry_notes`
Notes and comments on enquiries.
- `id` (UUID, Primary Key)
- `enquiry_id` (UUID, FK to enquiries)
- `user_id` (UUID, FK to users)
- `content` (TEXT)
- `is_system` (Boolean) - System-generated vs user-written
- `created_at` (Timestamp)

**Indexes:**
- `idx_notes_enquiry` on `enquiry_id`

**Row-Level Security**: ✅ Enabled (inherits from enquiry)

#### 6. `enquiry_activity_log` (Audit Trail)
Complete audit trail of all actions.
- `id` (UUID, Primary Key)
- `dealer_id` (UUID, FK to dealers) - **Tenant isolation key**
- `enquiry_id` (UUID, FK to enquiries)
- `user_id` (UUID, FK to users)
- `action` (VARCHAR 50) - e.g., 'created', 'viewed', 'status_changed'
- `entity_type` (VARCHAR 50)
- `old_value` (JSONB)
- `new_value` (JSONB)
- `created_at` (Timestamp)

**Indexes:**
- `idx_activity_dealer` on `dealer_id`
- `idx_activity_enquiry` on `enquiry_id`

**Row-Level Security**: ✅ Enabled

#### 7. `email_logs`
Email delivery tracking and debugging.
- `id` (UUID, Primary Key)
- `dealer_id` (UUID, FK to dealers)
- `template_id` (VARCHAR 100) - SendGrid template ID
- `recipient_email` (VARCHAR 255)
- `recipient_type` (VARCHAR 30) - 'customer', 'staff', 'dealer'
- `subject` (VARCHAR 255)
- `sendgrid_message_id` (VARCHAR 100)
- `status` (VARCHAR 30) - 'sent', 'delivered', 'opened', 'bounced', 'failed'
- References: `enquiry_id`, `user_id`
- `template_data` (JSONB)
- `error_message` (TEXT)
- Timestamps: `created_at`, `updated_at`

**Indexes:**
- `idx_email_logs_dealer` on `dealer_id`
- `idx_email_logs_enquiry` on `enquiry_id`

## Row-Level Security (RLS)

All tenant-scoped tables have RLS policies enabled to ensure complete data isolation:

### Policy: `users_tenant_isolation`
```sql
USING (dealer_id = current_setting('app.current_dealer_id', true)::uuid)
```
Users can only see staff from their own dealership.

### Policy: `enquiries_tenant_isolation`
```sql
USING (dealer_id = current_setting('app.current_dealer_id', true)::uuid)
```
Enquiries are filtered by dealer_id automatically.

### Policy: `notes_tenant_isolation`
```sql
USING (enquiry_id IN (
  SELECT id FROM enquiries 
  WHERE dealer_id = current_setting('app.current_dealer_id', true)::uuid
))
```
Notes inherit tenant isolation from their parent enquiry.

### Policy: `activity_tenant_isolation`
```sql
USING (dealer_id = current_setting('app.current_dealer_id', true)::uuid)
```
Activity logs are filtered by dealer_id.

## Seeded Data

### Sale Hyundai (First Dealer)
```json
{
  "id": "3991e589-6a86-4a4f-ad30-f945ae876910",
  "slug": "sale-hyundai",
  "name": "Sale Hyundai",
  "api_key": "dk_live_salehyundai_eec059c8d8de7e8affc864e9",
  "email": "enquiries@salehyundai.com.au",
  "phone": "(03) 5144 2877",
  "website_url": "https://salehyundai.com.au",
  "primary_color": "#001E50",
  "oem": "hyundai",
  "is_active": true
}
```

**⚠️ IMPORTANT**: Save the API key securely. It will be needed for form submissions.

## Connection Strings

### Development Branch
```
postgresql://neondb_owner:npg_Uzwn9jFBd0bM@ep-cold-term-a76493qz-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### Environment Variables
Add these to your `.env` file:

```env
# Neon Database
NEON_DATABASE_URL=postgresql://neondb_owner:npg_Uzwn9jFBd0bM@ep-cold-term-a76493qz-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# Sale Hyundai Dealer
NUXT_DEALER_ID=3991e589-6a86-4a4f-ad30-f945ae876910
NUXT_DEALER_API_KEY=dk_live_salehyundai_eec059c8d8de7e8affc864e9

# For form submissions (public)
NUXT_PUBLIC_ENQUIRY_API_URL=https://your-domain.com/api/enquiry
```

## Next Steps

### 1. Apply Schema to Production Branch
Once testing is complete on development, apply the same schema to production:

```bash
# Use Neon MCP to run the same migrations on production branch
```

### 2. Install Drizzle ORM
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### 3. Create Drizzle Schema
Create `server/database/schema.ts` with TypeScript definitions matching the database schema.

### 4. Implement API Endpoints

#### Public Endpoint
- `POST /api/enquiry` - Form submission with API key authentication

#### Protected Endpoints (require JWT)
- `POST /api/auth/login` - Staff login
- `GET /api/admin/enquiries` - List enquiries (auto-filtered by dealer)
- `GET /api/admin/enquiries/:id` - Get single enquiry
- `PATCH /api/admin/enquiries/:id` - Update enquiry
- `POST /api/admin/enquiries/:id/notes` - Add note

### 5. Implement Tenant Middleware
Create `server/middleware/tenant.ts` to:
- Extract dealer_id from JWT
- Set PostgreSQL session variable: `SET app.current_dealer_id = '<dealer_id>'`
- This activates RLS policies automatically

### 6. Update Existing Forms
Update all form submission handlers in the Sale Hyundai website to use the new `/api/enquiry` endpoint with the API key.

## Enquiry Types Supported

| Type | Key | Description |
|------|-----|-------------|
| Contact | `contact` | General dealership contact |
| Finance | `finance` | Finance pre-approval |
| Vehicle | `vehicle` | Vehicle-specific enquiry |
| Sell My Car | `sell_car` | Trade-in valuation |
| Test Drive | `test_drive` | Book a test drive |
| Parts | `parts` | Parts enquiry |
| Service | `service` | Service booking |
| Fleet | `fleet` | Fleet enquiry |
| Accessories | `accessories` | Accessories cart enquiry |

## Security Notes

1. **API Key Security**: The dealer API key should be stored as an environment variable and never committed to version control.

2. **Row-Level Security**: All queries automatically filter by dealer_id when the session variable is set.

3. **JWT Claims**: JWTs must include `dealer_id` claim for tenant resolution.

4. **Testing Isolation**: Always test that Dealer A cannot access Dealer B's data.

## Monitoring & Maintenance

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Check Indexes
```sql
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### Monitor Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### RLS Not Working
If data isolation isn't working:
1. Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Verify session variable is set: `SHOW app.current_dealer_id;`
3. Check policy definitions: `SELECT * FROM pg_policies WHERE tablename = 'enquiries';`

### Connection Issues
- Ensure connection string includes `sslmode=require`
- Check Neon project is active and not suspended
- Verify database credentials are correct

## Resources

- [Neon Console](https://console.neon.tech/app/projects/green-tooth-34908352)
- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PRD: Multi-Tenant Enquiry Management System](./memory-bank/PRD-enquiry-management-system.md)






