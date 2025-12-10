# Database Quick Start Guide

## ✅ What's Been Done

The multi-tenant enquiry management system database has been successfully set up on **Neon PostgreSQL**.

### Database Created
- **Project**: green-tooth-34908352 (Hyundai-Dealer)
- **Branch**: development (fully configured)
- **Branch**: production (ready for migration)

### Schema Implemented
✅ 7 core tables created:
1. `dealer_groups` - Multi-dealership parent organizations
2. `dealers` - Tenant registry (dealerships)
3. `users` - Staff accounts (tenant-scoped)
4. `enquiries` - Form submissions (tenant-scoped)
5. `enquiry_notes` - Notes on enquiries
6. `enquiry_activity_log` - Complete audit trail
7. `email_logs` - Email delivery tracking

✅ Row-Level Security (RLS) enabled on all tenant-scoped tables

✅ Sale Hyundai seeded as first dealer

### Important Credentials

**Sale Hyundai Dealer**
- Dealer ID: `3991e589-6a86-4a4f-ad30-f945ae876910`
- API Key: `dk_live_salehyundai_eec059c8d8de7e8affc864e9`
- Slug: `sale-hyundai`

**Database Connection (Development)**
```
postgresql://neondb_owner:npg_Uzwn9jFBd0bM@ep-cold-term-a76493qz-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

## 🔄 Next Steps

### 1. Add Environment Variables
Copy values from `env.database.example` to your `.env` file:

```bash
cp env.database.example .env
# Then edit .env with your actual values
```

### 2. Install Drizzle ORM
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### 3. Create Drizzle Schema
Create `server/database/schema.ts` with TypeScript definitions:

```typescript
import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const dealers = pgTable('dealers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  apiKey: varchar('api_key', { length: 100 }).unique().notNull(),
  // ... rest of fields
});

export const enquiries = pgTable('enquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  // ... rest of fields
}, (table) => ({
  dealerIdx: index('idx_enquiries_dealer').on(table.dealerId),
  // ... rest of indexes
}));
```

### 4. Create Database Connection Utility
Create `server/utils/db.ts`:

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../database/schema';

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });
export const db = drizzle(pool, { schema });

// Helper to set tenant context for RLS
export async function setTenantContext(dealerId: string) {
  await pool.query(`SET app.current_dealer_id = '${dealerId}'`);
}
```

### 5. Create Tenant Middleware
Create `server/middleware/tenant.ts`:

```typescript
export default defineEventHandler(async (event) => {
  // Skip for public endpoints
  if (event.path.startsWith('/api/enquiry')) return;
  
  // Extract dealer_id from JWT
  const token = getCookie(event, 'auth_token');
  if (!token) return;
  
  const decoded = verifyJWT(token);
  if (decoded?.dealer_id) {
    // Set RLS context for this request
    await setTenantContext(decoded.dealer_id);
  }
});
```

### 6. Implement Form Submission Endpoint
Create `server/api/enquiry.post.ts`:

```typescript
export default defineEventHandler(async (event) => {
  // 1. Validate API key from header
  const apiKey = getHeader(event, 'x-dealer-key');
  const dealer = await db.query.dealers.findFirst({
    where: eq(dealers.apiKey, apiKey)
  });
  
  if (!dealer) {
    throw createError({ statusCode: 401, message: 'Invalid API key' });
  }
  
  // 2. Parse and validate request body
  const body = await readBody(event);
  
  // 3. Insert enquiry
  const [enquiry] = await db.insert(enquiries).values({
    dealerId: dealer.id,
    type: body.type,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    // ... rest of fields
  }).returning();
  
  // 4. Send notifications (optional)
  await sendNewEnquiryNotification(dealer, enquiry);
  
  return {
    success: true,
    enquiryId: enquiry.id,
    dealerName: dealer.name
  };
});
```

### 7. Update Website Forms
Update all form submission handlers to use the new endpoint:

```typescript
// In your form component
const submitEnquiry = async (formData) => {
  const response = await $fetch('/api/enquiry', {
    method: 'POST',
    headers: {
      'X-Dealer-Key': config.public.dealerApiKey
    },
    body: {
      type: 'vehicle',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      // ... rest of form data
    }
  });
  
  if (response.success) {
    // Show success message
  }
};
```

### 8. Test Tenant Isolation
Create a test to ensure dealers can only see their own data:

```typescript
// Test: Dealer A cannot see Dealer B's enquiries
const dealerAToken = await loginAs('admin@dealera.com');
const enquiries = await fetchEnquiries(dealerAToken);
expect(enquiries.every(e => e.dealer_id === DEALER_A_ID)).toBe(true);
```

## 📚 Documentation

- **Full Setup Guide**: `DATABASE_SETUP.md`
- **PRD**: `memory-bank/PRD-enquiry-management-system.md`
- **MCP Setup**: `MCP_SETUP.md`
- **Neon Console**: https://console.neon.tech/app/projects/green-tooth-34908352

## 🔐 Security Reminders

1. ✅ Row-Level Security is enabled - dealers can only see their own data
2. ⚠️ Keep the API key secure - never commit to version control
3. ⚠️ Use JWT with `dealer_id` claim for staff authentication
4. ⚠️ Always set tenant context before querying tenant-scoped tables
5. ⚠️ Test data isolation thoroughly before going to production

## 🚀 Deploying to Production

When ready to deploy:

1. Apply the same schema to the production branch
2. Update `NEON_DATABASE_URL` to use production branch
3. Regenerate API key for production (optional)
4. Test thoroughly on staging first
5. Monitor RLS policies are working correctly

## 🆘 Need Help?

- Check `DATABASE_SETUP.md` for detailed troubleshooting
- Review the PRD for architecture decisions
- Use Neon MCP tools to query and inspect the database
- Check Neon Console for monitoring and logs

---

**Status**: ✅ Database ready for Drizzle ORM integration
**Next**: Install Drizzle and create schema definitions


