# Drizzle ORM Setup - Complete! ✅

## What's Been Built

I've successfully integrated Drizzle ORM with your Neon database. Here's everything that's now in place:

### 1. ✅ Drizzle ORM Installed
```bash
✓ drizzle-orm
✓ @neondatabase/serverless
✓ drizzle-kit (dev dependency)
✓ ws (WebSocket support)
```

### 2. ✅ Database Schema (`server/database/schema.ts`)

Complete TypeScript schema with all 7 tables:
- `dealerGroups` - Multi-dealership organizations
- `dealers` - Tenant registry with API keys
- `users` - Staff accounts (tenant-scoped)
- `enquiries` - Form submissions (tenant-scoped)
- `enquiryNotes` - Notes on enquiries
- `enquiryActivityLog` - Complete audit trail
- `emailLogs` - Email delivery tracking

**Features:**
- ✅ Full type safety with TypeScript
- ✅ All indexes and constraints defined
- ✅ Relations between tables
- ✅ Type exports for Insert and Select operations

### 3. ✅ Database Connection (`server/utils/db.ts`)

Utilities for database access:
- `db` - Main Drizzle instance
- `setTenantContext(dealerId)` - Set RLS context
- `clearTenantContext()` - Clear RLS context
- `withTenantContext(dealerId, callback)` - Execute with tenant context
- `getPool()` - Get connection pool for transactions

### 4. ✅ Tenant Middleware (`server/middleware/tenant.ts`)

Automatically sets tenant context for all `/api/admin/*` routes:
- Extracts dealer_id from JWT (when implemented)
- Sets PostgreSQL session variable for RLS
- Skips public routes like `/api/enquiry`
- Stores dealer_id in event context

### 5. ✅ Form Submission Endpoint (`server/api/enquiry.post.ts`)

Public API endpoint for form submissions:
- **Authentication**: X-Dealer-Key header
- **Validates**: API key against database
- **Accepts**: All enquiry types (contact, finance, vehicle, etc.)
- **Stores**: Customer info, vehicle details, UTM tracking
- **Logs**: Activity for audit trail
- **Returns**: Success response with enquiry ID

## How to Use

### Environment Variables

Add to your `.env` file:

```env
# Production Database
NEON_DATABASE_URL="postgresql://neondb_owner:npg_Uzwn9jFBd0bM@ep-bitter-grass-a7xesaio-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Sale Hyundai (Production)
NUXT_DEALER_ID="70ff8127-18a7-449b-a288-1441baf9a466"
NUXT_DEALER_API_KEY="dk_live_salehyundai_d394bd4e4535e890107abb48"
```

### Submitting Forms from Your Website

Update your form handlers to use the new endpoint:

```typescript
// Example: Contact form submission
const submitContactForm = async (formData) => {
  const config = useRuntimeConfig();
  
  const response = await $fetch('/api/enquiry', {
    method: 'POST',
    headers: {
      'X-Dealer-Key': config.public.dealerApiKey,
    },
    body: {
      type: 'contact',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      source: window.location.href,
      utmSource: formData.utm_source,
      utmMedium: formData.utm_medium,
      utmCampaign: formData.utm_campaign,
    },
  });
  
  if (response.success) {
    console.log('Enquiry submitted:', response.enquiryId);
    // Show success message
  }
};
```

### Vehicle Enquiry Example

```typescript
const submitVehicleEnquiry = async (formData, vehicle) => {
  const config = useRuntimeConfig();
  
  const response = await $fetch('/api/enquiry', {
    method: 'POST',
    headers: {
      'X-Dealer-Key': config.public.dealerApiKey,
    },
    body: {
      type: 'vehicle',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      vehicleInfo: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        variant: vehicle.variant,
        stockId: vehicle.stockId,
        price: vehicle.price,
        condition: vehicle.condition,
        imageUrl: vehicle.imageUrl,
      },
      tradeInInfo: formData.tradeIn ? {
        make: formData.tradeIn.make,
        model: formData.tradeIn.model,
        year: formData.tradeIn.year,
        rego: formData.tradeIn.rego,
        odometer: formData.tradeIn.odometer,
      } : undefined,
    },
  });
};
```

### Accessories Cart Enquiry Example

```typescript
const submitAccessoriesEnquiry = async (formData, cart) => {
  const config = useRuntimeConfig();
  
  const response = await $fetch('/api/enquiry', {
    method: 'POST',
    headers: {
      'X-Dealer-Key': config.public.dealerApiKey,
    },
    body: {
      type: 'accessories',
      department: 'parts',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      vehicleInfo: {
        model: cart.selectedModel,
        year: '2025',
      },
      accessoriesCart: {
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          partNumber: item.partNumber,
          quantity: item.quantity,
          price: item.price,
        })),
        itemCount: cart.itemCount,
        total: cart.total,
      },
    },
  });
};
```

## Querying the Database

### Example: Get All Enquiries for a Dealer

```typescript
import { db } from '~/server/utils/db';
import { enquiries } from '~/server/database/schema';
import { eq, desc } from 'drizzle-orm';

// In an API handler
export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId; // Set by tenant middleware
  
  const allEnquiries = await db
    .select()
    .from(enquiries)
    .where(eq(enquiries.dealerId, dealerId))
    .orderBy(desc(enquiries.createdAt));
  
  return allEnquiries;
});
```

### Example: Get Single Enquiry with Relations

```typescript
import { db } from '~/server/utils/db';
import { enquiries, users, enquiryNotes } from '~/server/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  const enquiry = await db.query.enquiries.findFirst({
    where: eq(enquiries.id, id),
    with: {
      assignedUser: true,
      notes: {
        with: {
          user: true,
        },
        orderBy: (notes, { desc }) => [desc(notes.createdAt)],
      },
      activityLogs: {
        with: {
          user: true,
        },
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      },
    },
  });
  
  return enquiry;
});
```

### Example: Create a Note

```typescript
import { db } from '~/server/utils/db';
import { enquiryNotes } from '~/server/database/schema';

export default defineEventHandler(async (event) => {
  const { enquiryId, content } = await readBody(event);
  const userId = event.context.userId; // From auth middleware
  
  const [note] = await db
    .insert(enquiryNotes)
    .values({
      enquiryId,
      userId,
      content,
      isSystem: false,
    })
    .returning();
  
  return note;
});
```

## Testing the Setup

### 1. Test Form Submission

```bash
curl -X POST http://localhost:3000/api/enquiry \
  -H "Content-Type: application/json" \
  -H "X-Dealer-Key: dk_live_salehyundai_d394bd4e4535e890107abb48" \
  -d '{
    "type": "contact",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "0412345678",
    "message": "Test enquiry from API"
  }'
```

Expected response:
```json
{
  "success": true,
  "enquiryId": "uuid-here",
  "dealerName": "Sale Hyundai",
  "message": "Enquiry submitted successfully"
}
```

### 2. Verify in Database

Use Neon MCP to check the data:

```typescript
// Check enquiries table
const enquiries = await db.query.enquiries.findMany({
  where: eq(enquiries.dealerId, 'your-dealer-id'),
  limit: 10,
});
```

## Next Steps

### Phase 2: Authentication (Week 2)

Now that forms can submit to the database, the next phase is building staff authentication:

1. **Install bcrypt for password hashing**
   ```bash
   npm install bcrypt
   npm install -D @types/bcrypt
   ```

2. **Create JWT utilities** (`server/utils/jwt.ts`)
   - Sign JWT with dealer_id claim
   - Verify JWT tokens
   - Refresh token logic

3. **Build auth endpoints**
   - `POST /api/auth/login` - Staff login
   - `POST /api/auth/logout` - Logout
   - `GET /api/auth/me` - Get current user

4. **Create first admin user**
   - Seed script to create admin for Sale Hyundai
   - Hash password with bcrypt

5. **Update tenant middleware**
   - Extract dealer_id from JWT instead of env var
   - Verify token on each request

### Phase 3: Dashboard (Week 2-3)

Build the staff dashboard:

1. **Admin layout** (`app/layouts/admin.vue`)
2. **Login page** (`app/pages/admin/login.vue`)
3. **Enquiries list** (`app/pages/admin/enquiries/index.vue`)
4. **Enquiry detail** (`app/pages/admin/enquiries/[id].vue`)

## Files Created

```
server/
├── database/
│   └── schema.ts          ✅ Complete Drizzle schema
├── middleware/
│   └── tenant.ts          ✅ Tenant context middleware
├── utils/
│   └── db.ts              ✅ Database connection
└── api/
    └── enquiry.post.ts    ✅ Form submission endpoint
```

## Documentation

- `DATABASE_SETUP.md` - Database schema documentation
- `DATABASE_QUICK_START.md` - Quick start guide
- `PRODUCTION_DATABASE_INFO.md` - Production credentials
- `DRIZZLE_SETUP_COMPLETE.md` - This file

## Status

✅ **Drizzle ORM Integration: COMPLETE**
✅ **Form Submission Endpoint: READY**
🔄 **Next: JWT Authentication**

Your website can now start saving enquiries to the database! 🎉








