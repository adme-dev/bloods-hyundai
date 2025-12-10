# Product Requirements Document (PRD)
# Multi-Tenant Enquiry Management System

## Document Information
- **Version:** 2.0
- **Created:** December 8, 2025
- **Updated:** December 8, 2025
- **Project:** Dealer Enquiry Management Platform
- **Inspired By:** Better Off platform / lead management systems

---

## 1. Executive Summary

### 1.1 Overview
Build a **multi-tenant Enquiry Management System** that captures all form submissions from multiple dealership websites into a shared NEON PostgreSQL database with complete data isolation per dealer. Each dealership gets their own dashboard to manage their leads while sharing the same infrastructure.

### 1.2 Multi-Tenancy Model
- **Shared Database** with tenant isolation via `dealer_id` foreign key
- **Row-Level Security (RLS)** to ensure dealers only see their own data
- **Subdomain-based routing** (e.g., `salehyundai.leads.app`, `pakenhamhyundai.leads.app`)
- **Single codebase** serving multiple dealers

### 1.3 Goals
- **Centralize all enquiries** from multiple dealers into a single platform
- **Complete data isolation** between dealerships
- **Scalable architecture** to onboard new dealers quickly
- **Dealer-specific branding** and configuration
- **Unified reporting** for dealer groups (optional)

### 1.4 Success Metrics
- 100% of form submissions captured per dealer
- < 5 minutes to onboard a new dealer
- Complete data isolation (zero cross-tenant data leaks)
- 99.9% platform uptime

---

## 2. Multi-Tenant Architecture

### 2.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEALER WEBSITES                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Sale Hyundai   │  │ Pakenham Hyundai│  │  Dealer X       │             │
│  │    Website      │  │    Website      │  │    Website      │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           │ dealer_id=1        │ dealer_id=2        │ dealer_id=3          │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────▼───────────┐                               │
│                    │  /api/enquiry.post.ts │                               │
│                    │  (with dealer_id)     │                               │
│                    └───────────┬───────────┘                               │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   NEON PostgreSQL       │
                    │   (Shared Database)     │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │     dealers       │  │  ← Tenant registry
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │    enquiries      │  │  ← dealer_id FK + RLS
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │      users        │  │  ← dealer_id FK + RLS
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │  enquiry_notes    │  │  ← Inherits from enquiry
                    │  └───────────────────┘  │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────────┐
        │                        │                            │
┌───────▼───────┐    ┌───────────▼───────────┐    ┌──────────▼──────────┐
│ Sale Hyundai  │    │ Pakenham Hyundai      │    │ Dealer X            │
│   Dashboard   │    │   Dashboard           │    │   Dashboard         │
│ /admin/*      │    │ /admin/*              │    │ /admin/*            │
│               │    │                       │    │                     │
│ Only sees     │    │ Only sees             │    │ Only sees           │
│ dealer_id=1   │    │ dealer_id=2           │    │ dealer_id=3         │
└───────────────┘    └───────────────────────┘    └─────────────────────┘
```

### 2.2 Tenant Identification Strategy

#### Option A: Subdomain-based (Recommended)
```
salehyundai.leads.yourdomain.com     → dealer_id = 1
pakenhamhyundai.leads.yourdomain.com → dealer_id = 2
```

#### Option B: Path-based
```
leads.yourdomain.com/salehyundai/admin     → dealer_id = 1
leads.yourdomain.com/pakenhamhyundai/admin → dealer_id = 2
```

#### Option C: API Key (for form submissions)
```typescript
// Each dealer website has a unique API key
POST /api/enquiry
Headers: X-Dealer-Key: dk_live_salehyundai_xxxxx
```

### 2.3 Technology Stack
- **Database:** NEON PostgreSQL (serverless) with Row-Level Security
- **ORM:** Drizzle ORM (TypeScript-first, serverless-ready)
- **Authentication:** Custom JWT with tenant context
- **Frontend:** Nuxt 3 with tenant-aware routing
- **Deployment:** Netlify with wildcard subdomain support

---

## 3. Database Schema (Multi-Tenant)

### 3.1 Core Tables

#### `dealers` (Tenant Registry)
```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  slug VARCHAR(50) UNIQUE NOT NULL,      -- 'sale-hyundai', 'pakenham-hyundai'
  name VARCHAR(200) NOT NULL,            -- 'Sale Hyundai'
  api_key VARCHAR(100) UNIQUE NOT NULL,  -- 'dk_live_xxxxx' for form submissions
  
  -- Contact & Location
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  suburb VARCHAR(100),
  state VARCHAR(20),
  postcode VARCHAR(10),
  
  -- Branding
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),              -- '#001E50'
  website_url VARCHAR(255),
  
  -- Configuration
  settings JSONB DEFAULT '{}',           -- {notifications: {}, forms: {}, etc}
  
  -- OEM/Group
  oem VARCHAR(50),                       -- 'hyundai', 'toyota', etc
  dealer_group_id UUID REFERENCES dealer_groups(id),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier VARCHAR(30) DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick API key lookups
CREATE UNIQUE INDEX idx_dealers_api_key ON dealers(api_key);
CREATE UNIQUE INDEX idx_dealers_slug ON dealers(slug);
```

#### `dealer_groups` (Optional - for multi-dealership owners)
```sql
CREATE TABLE dealer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,            -- 'Automotive Holdings Group'
  slug VARCHAR(50) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `users` (Staff - Tenant-Scoped)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  
  -- Authentication
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Profile
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  
  -- Role & Permissions
  role VARCHAR(30) DEFAULT 'staff',      -- 'super_admin', 'dealer_admin', 'manager', 'staff'
  department VARCHAR(50),                -- 'sales', 'service', 'parts', 'finance'
  permissions JSONB DEFAULT '[]',        -- Additional granular permissions
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Unique per dealer (same email can exist at different dealers)
  UNIQUE(dealer_id, email)
);

CREATE INDEX idx_users_dealer ON users(dealer_id);
CREATE INDEX idx_users_email ON users(email);
```

#### `enquiries` (Tenant-Scoped)
```sql
CREATE TABLE enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  
  -- Enquiry Type & Source
  type VARCHAR(50) NOT NULL,             -- 'contact', 'finance', 'vehicle', etc
  source VARCHAR(255),                   -- Full page URL
  department VARCHAR(50),                -- 'sales', 'service', 'parts', 'finance', 'general'
  
  -- Customer Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  postcode VARCHAR(10),
  
  -- Enquiry Details
  message TEXT,
  
  -- Vehicle-specific fields (nullable)
  vehicle_stock_id VARCHAR(50),
  vehicle_info JSONB,                    -- {make, model, year, variant, price, condition, image_url}
  
  -- Trade-in fields
  trade_in_info JSONB,                   -- {make, model, year, rego, odometer, condition}
  
  -- Finance fields
  finance_details JSONB,                 -- {loan_amount, term, deposit, rate, repayment}
  
  -- Sell My Car fields
  sell_car_details JSONB,                -- {year, make, model, grade, rego, odometer, photos[]}
  
  -- Status & Workflow
  status VARCHAR(30) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- External Integration
  external_ref VARCHAR(100),
  synced_to_crm BOOLEAN DEFAULT FALSE,
  crm_ref VARCHAR(100),
  
  -- Metadata
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  ip_address INET,
  user_agent TEXT
);

-- Indexes for common queries
CREATE INDEX idx_enquiries_dealer ON enquiries(dealer_id);
CREATE INDEX idx_enquiries_dealer_status ON enquiries(dealer_id, status);
CREATE INDEX idx_enquiries_dealer_type ON enquiries(dealer_id, type);
CREATE INDEX idx_enquiries_dealer_created ON enquiries(dealer_id, created_at DESC);
CREATE INDEX idx_enquiries_assigned ON enquiries(assigned_to);
CREATE INDEX idx_enquiries_email ON enquiries(email);
```

#### `enquiry_notes` (Inherits tenant from enquiry)
```sql
CREATE TABLE enquiry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_enquiry ON enquiry_notes(enquiry_id);
```

#### `enquiry_activity_log` (Audit Trail)
```sql
CREATE TABLE enquiry_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(50) NOT NULL,           -- 'created', 'viewed', 'status_changed', 'assigned'
  entity_type VARCHAR(50),               -- 'enquiry', 'user', 'dealer'
  old_value JSONB,
  new_value JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_dealer ON enquiry_activity_log(dealer_id);
CREATE INDEX idx_activity_enquiry ON enquiry_activity_log(enquiry_id);
```

### 3.2 Row-Level Security (RLS) Policies
```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their dealer's data
CREATE POLICY users_tenant_isolation ON users
  USING (dealer_id = current_setting('app.current_dealer_id')::uuid);

-- Enquiries tenant isolation
CREATE POLICY enquiries_tenant_isolation ON enquiries
  USING (dealer_id = current_setting('app.current_dealer_id')::uuid);

-- Notes inherit from enquiry (no direct dealer_id)
CREATE POLICY notes_tenant_isolation ON enquiry_notes
  USING (enquiry_id IN (
    SELECT id FROM enquiries 
    WHERE dealer_id = current_setting('app.current_dealer_id')::uuid
  ));

-- Activity log tenant isolation
CREATE POLICY activity_tenant_isolation ON enquiry_activity_log
  USING (dealer_id = current_setting('app.current_dealer_id')::uuid);
```

---

## 4. API Endpoints (Multi-Tenant)

### 4.1 Public Endpoints (Form Submissions)

#### `POST /api/enquiry`
Submit a new enquiry with dealer identification.

```typescript
// Request Headers
Headers: {
  'X-Dealer-Key': 'dk_live_salehyundai_xxxxx'  // Required
}

// Request Body
interface EnquirySubmission {
  type: 'contact' | 'finance' | 'vehicle' | 'sell_car' | 'test_drive' | 'parts' | 'service' | 'fleet';
  source: string;
  department?: string;
  
  // Customer info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postcode?: string;
  message?: string;
  
  // Type-specific data
  vehicleInfo?: VehicleInfo;
  tradeInInfo?: TradeInInfo;
  financeDetails?: FinanceDetails;
  sellCarDetails?: SellCarDetails;
  
  // UTM tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Response
interface EnquiryResponse {
  success: boolean;
  enquiryId: string;
  dealerName: string;  // Confirmation of which dealer received it
  message: string;
}
```

### 4.2 Protected Endpoints (Staff Dashboard)

All protected endpoints require:
1. Bearer token (JWT with `dealer_id` claim)
2. Automatic tenant filtering via middleware

#### Authentication
```
POST /api/auth/login          - Staff login (returns JWT with dealer_id)
POST /api/auth/logout         - Staff logout
POST /api/auth/refresh        - Refresh token
GET  /api/auth/me             - Get current user + dealer info
```

#### Enquiries (Auto-filtered by dealer)
```
GET    /api/admin/enquiries              - List dealer's enquiries
GET    /api/admin/enquiries/:id          - Get enquiry (must belong to dealer)
PATCH  /api/admin/enquiries/:id          - Update enquiry
DELETE /api/admin/enquiries/:id          - Delete enquiry (admin only)
POST   /api/admin/enquiries/:id/notes    - Add note
```

#### Analytics (Dealer-scoped)
```
GET    /api/admin/analytics/overview     - Dealer's dashboard stats
GET    /api/admin/analytics/by-type      - Dealer's enquiries by type
GET    /api/admin/analytics/by-status    - Dealer's enquiries by status
GET    /api/admin/analytics/trends       - Dealer's trends over time
```

#### Users (Dealer-scoped)
```
GET    /api/admin/users                  - List dealer's staff
POST   /api/admin/users                  - Create staff (dealer_admin only)
PATCH  /api/admin/users/:id              - Update user
DELETE /api/admin/users/:id              - Deactivate user
```

#### Dealer Settings (Dealer Admin only)
```
GET    /api/admin/settings               - Get dealer settings
PATCH  /api/admin/settings               - Update dealer settings
GET    /api/admin/settings/api-key       - View/regenerate API key
```

### 4.3 Super Admin Endpoints (Platform Admin)
For platform operators to manage dealers.

```
GET    /api/super/dealers                - List all dealers
POST   /api/super/dealers                - Create new dealer
PATCH  /api/super/dealers/:id            - Update dealer
DELETE /api/super/dealers/:id            - Deactivate dealer

GET    /api/super/analytics              - Platform-wide analytics
GET    /api/super/audit-log              - Platform audit log
```

---

## 5. Dealer Onboarding

### 5.1 Onboarding Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPER ADMIN: Create New Dealer                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Basic Info                                                              │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ Dealer Name:    [Sale Hyundai                    ]                  │ │
│     │ Slug:           [sale-hyundai                    ] (auto-generated) │ │
│     │ OEM:            [Hyundai ▼]                                         │ │
│     │ Dealer Group:   [None ▼]                                            │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  2. Contact Details                                                         │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ Email:          [enquiries@salehyundai.com.au    ]                  │ │
│     │ Phone:          [(03) 5144 2877                  ]                  │ │
│     │ Address:        [123 York St, Sale VIC 3850      ]                  │ │
│     │ Website:        [https://salehyundai.com.au      ]                  │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  3. Branding                                                                │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ Logo:           [📷 Upload Logo]                                    │ │
│     │ Primary Color:  [#001E50] 🎨                                        │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  4. Initial Admin User                                                      │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ Admin Email:    [admin@salehyundai.com.au        ]                  │ │
│     │ First Name:     [John                            ]                  │ │
│     │ Last Name:      [Smith                           ]                  │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                          [Cancel]  [Create Dealer →]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 After Creation
1. **API Key Generated:** `dk_live_salehyundai_a1b2c3d4e5f6`
2. **Admin receives email** with login credentials
3. **Subdomain activated:** `salehyundai.leads.app`
4. **Dealer adds API key** to their website environment variables

### 5.3 Website Integration
```typescript
// In dealer's website .env
NUXT_DEALER_API_KEY=dk_live_salehyundai_a1b2c3d4e5f6
NUXT_ENQUIRY_API_URL=https://api.leads.app/api/enquiry

// In form submission
await $fetch(config.public.enquiryApiUrl, {
  method: 'POST',
  headers: {
    'X-Dealer-Key': config.public.dealerApiKey
  },
  body: {
    type: 'vehicle',
    firstName: form.firstName,
    // ... rest of form data
  }
});
```

---

## 6. Staff Dashboard (Tenant-Aware)

### 6.1 Login Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      leads.app                                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │              🏢  Dealer Enquiry Management                          │   │
│  │                                                                     │   │
│  │     Enter your dealership to continue                               │   │
│  │                                                                     │   │
│  │     Dealership: [sale-hyundai          ] .leads.app                 │   │
│  │                                                                     │   │
│  │                        [Continue →]                                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ↓ Redirects to

┌─────────────────────────────────────────────────────────────────────────────┐
│                 salehyundai.leads.app/login                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │              [Sale Hyundai Logo]                                    │   │
│  │                                                                     │   │
│  │     Staff Login                                                     │   │
│  │                                                                     │   │
│  │     Email:    [________________________]                            │   │
│  │     Password: [________________________]                            │   │
│  │                                                                     │   │
│  │               [Forgot Password?]                                    │   │
│  │                                                                     │   │
│  │                        [Sign In →]                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Dashboard Header (Shows Dealer Context)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sale Hyundai Logo]  📋 Enquiries  📊 Analytics  ⚙️ Settings    👤 John ▼ │
├─────────────────────────────────────────────────────────────────────────────┤
│  ...dashboard content...                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Dealer Settings Page
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Dealer Settings                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ GENERAL                                                               │ │
│  │                                                                       │ │
│  │ Dealer Name:     [Sale Hyundai                    ]                   │ │
│  │ Email:           [enquiries@salehyundai.com.au    ]                   │ │
│  │ Phone:           [(03) 5144 2877                  ]                   │ │
│  │ Website:         [https://salehyundai.com.au      ]                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ API INTEGRATION                                                       │ │
│  │                                                                       │ │
│  │ API Key:         dk_live_salehyundai_a1••••••••••••                   │ │
│  │                  [👁️ Show] [🔄 Regenerate]                            │ │
│  │                                                                       │ │
│  │ Webhook URL:     [https://your-crm.com/webhook    ] (optional)        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ NOTIFICATIONS                                                         │ │
│  │                                                                       │ │
│  │ ☑️ Email new enquiries to: [sales@salehyundai.com.au]                 │ │
│  │ ☐ SMS notifications (Premium)                                         │ │
│  │ ☑️ Daily summary email                                                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                                          [Save Changes]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Role-Based Access Control (RBAC)

### 7.1 Role Hierarchy
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPER_ADMIN (Platform Level)                                               │
│  └── Can manage all dealers, view platform analytics                        │
│                                                                             │
│  DEALER_ADMIN (Dealer Level)                                                │
│  └── Full access to dealer's data, manage staff, settings                   │
│                                                                             │
│  MANAGER (Dealer Level)                                                     │
│  └── View all dealer enquiries, assign to staff, view analytics             │
│                                                                             │
│  STAFF (Dealer Level)                                                       │
│  └── View assigned enquiries only, add notes, update status                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Permission Matrix

| Feature | Super Admin | Dealer Admin | Manager | Staff |
|---------|-------------|--------------|---------|-------|
| View all enquiries | ✅ All dealers | ✅ Own dealer | ✅ Own dealer | ❌ Assigned only |
| Update enquiry status | ✅ | ✅ | ✅ | ✅ Own assigned |
| Assign enquiries | ✅ | ✅ | ✅ | ❌ |
| Add notes | ✅ | ✅ | ✅ | ✅ |
| Delete enquiries | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ Platform | ✅ Dealer | ✅ Dealer | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ |
| Dealer settings | ✅ | ✅ | ❌ | ❌ |
| Create dealers | ✅ | ❌ | ❌ | ❌ |

---

## 8. Implementation Phases

### Phase 1: Multi-Tenant Foundation (Week 1-2)
- [ ] Set up NEON PostgreSQL with multi-tenant schema
- [ ] Implement Row-Level Security policies
- [ ] Create `dealers` table and seed Sale Hyundai
- [ ] Build tenant-aware API middleware
- [ ] Implement `/api/enquiry` with dealer API key validation
- [ ] Update Sale Hyundai website to use new endpoint

### Phase 2: Authentication & Dashboard (Week 2-3)
- [ ] Implement JWT auth with `dealer_id` claim
- [ ] Build subdomain routing for tenant resolution
- [ ] Create login page with dealer branding
- [ ] Build enquiries list (tenant-filtered)
- [ ] Build enquiry detail view

### Phase 3: Dealer Management (Week 3-4)
- [ ] Super admin dashboard
- [ ] Dealer onboarding flow
- [ ] Dealer settings page
- [ ] API key management
- [ ] User management per dealer

### Phase 4: Analytics & Notifications (Week 4-5)
- [ ] Dealer-scoped analytics
- [ ] Email notifications for new enquiries
- [ ] Daily summary emails
- [ ] Webhook integration for CRM

### Phase 5: Scale & Polish (Week 5-6)
- [ ] Onboard second dealer (real-world test)
- [ ] Performance optimization
- [ ] Documentation
- [ ] Dealer group features (optional)

---

## 9. Email System (SendGrid)

### 9.1 Overview
All transactional emails are sent via **SendGrid** using dynamic templates. Each dealer can have custom branding applied to their emails while using shared templates.

### 9.2 SendGrid Configuration
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SendGrid Account Structure                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  API Key: SG.xxxxxx (single key for platform)                               │
│                                                                             │
│  Sender Identities:                                                         │
│  ├── noreply@leads.app (platform default)                                   │
│  ├── enquiries@salehyundai.com.au (dealer-specific, optional)               │
│  └── enquiries@pakenhamhyundai.com.au (dealer-specific, optional)           │
│                                                                             │
│  Dynamic Templates:                                                         │
│  ├── d-xxx001 - New Enquiry Notification (to dealer staff)                  │
│  ├── d-xxx002 - Customer Confirmation (to customer)                         │
│  ├── d-xxx003 - Enquiry Assigned (to staff member)                          │
│  ├── d-xxx004 - Daily Summary (to dealer managers)                          │
│  ├── d-xxx005 - Staff Welcome / Password Set                                │
│  ├── d-xxx006 - Password Reset                                              │
│  └── d-xxx007 - Dealer Onboarding (to new dealer admin)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Email Templates

#### Template 1: New Enquiry Notification (to Dealer Staff)
**Template ID:** `d-new-enquiry-notification`
**Trigger:** When a new enquiry is submitted
**Recipients:** Dealer's notification email(s)

```html
<!-- SendGrid Dynamic Template -->
Subject: 🚗 New {{enquiry_type}} Enquiry - {{customer_name}}

<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: {{dealer_primary_color}}; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .value { color: #111827; font-size: 16px; font-weight: 500; }
    .btn { display: inline-block; background: {{dealer_primary_color}}; color: white; padding: 12px 24px; 
           text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#if dealer_logo_url}}
        <img src="{{dealer_logo_url}}" alt="{{dealer_name}}" height="40">
      {{else}}
        <h2 style="margin:0;">{{dealer_name}}</h2>
      {{/if}}
    </div>
    
    <div class="content">
      <h2 style="margin-top:0;">New {{enquiry_type}} Enquiry</h2>
      
      <div class="card">
        <div class="label">Customer</div>
        <div class="value">{{customer_name}}</div>
        <div style="margin-top:8px;">
          <a href="mailto:{{customer_email}}">{{customer_email}}</a>
          {{#if customer_phone}} • <a href="tel:{{customer_phone}}">{{customer_phone}}</a>{{/if}}
        </div>
      </div>
      
      {{#if vehicle_info}}
      <div class="card">
        <div class="label">Vehicle of Interest</div>
        <div class="value">{{vehicle_info.year}} {{vehicle_info.make}} {{vehicle_info.model}}</div>
        {{#if vehicle_info.stock_id}}<div style="color:#6b7280;">Stock #{{vehicle_info.stock_id}}</div>{{/if}}
        {{#if vehicle_info.price}}<div style="color:#059669;font-weight:600;">${{vehicle_info.price}}</div>{{/if}}
      </div>
      {{/if}}
      
      {{#if message}}
      <div class="card">
        <div class="label">Message</div>
        <div class="value">{{message}}</div>
      </div>
      {{/if}}
      
      {{#if trade_in_info}}
      <div class="card">
        <div class="label">Trade-In Vehicle</div>
        <div class="value">{{trade_in_info.year}} {{trade_in_info.make}} {{trade_in_info.model}}</div>
      </div>
      {{/if}}
      
      <div style="text-align:center;margin-top:30px;">
        <a href="{{dashboard_url}}/enquiries/{{enquiry_id}}" class="btn">
          View Enquiry in Dashboard →
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>This notification was sent to {{dealer_name}} staff.</p>
      <p>Manage notifications in <a href="{{dashboard_url}}/settings">Settings</a></p>
    </div>
  </div>
</body>
</html>
```

**Template Variables:**
```typescript
interface NewEnquiryEmailData {
  // Dealer branding
  dealer_name: string;
  dealer_logo_url?: string;
  dealer_primary_color: string;  // e.g., '#001E50'
  dashboard_url: string;         // e.g., 'https://salehyundai.leads.app'
  
  // Enquiry data
  enquiry_id: string;
  enquiry_type: string;          // 'Vehicle', 'Finance', 'Service', etc.
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  message?: string;
  
  // Optional type-specific data
  vehicle_info?: {
    year?: string;
    make?: string;
    model?: string;
    stock_id?: string;
    price?: string;
  };
  trade_in_info?: {
    year?: string;
    make?: string;
    model?: string;
  };
  finance_details?: {
    loan_amount?: string;
    term?: string;
  };
}
```

---

#### Template 2: Customer Confirmation (to Customer)
**Template ID:** `d-customer-confirmation`
**Trigger:** Immediately after form submission
**Recipients:** Customer's email address

```html
Subject: Thanks for your enquiry, {{customer_first_name}}! - {{dealer_name}}

<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: {{dealer_primary_color}}; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .highlight { background: #f0f9ff; border-left: 4px solid {{dealer_primary_color}}; padding: 15px; margin: 20px 0; }
    .contact-card { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: {{dealer_primary_color}}; color: white; padding: 12px 24px; 
           text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#if dealer_logo_url}}
        <img src="{{dealer_logo_url}}" alt="{{dealer_name}}" height="50">
      {{else}}
        <h1 style="margin:0;">{{dealer_name}}</h1>
      {{/if}}
    </div>
    
    <div class="content">
      <h2>Thanks for getting in touch, {{customer_first_name}}!</h2>
      
      <p>We've received your {{enquiry_type_lower}} enquiry and one of our team members will be in contact with you shortly.</p>
      
      <div class="highlight">
        <strong>Your Reference Number:</strong> {{reference_number}}
      </div>
      
      {{#if vehicle_info}}
      <div class="contact-card">
        <h3 style="margin-top:0;">Vehicle You Enquired About</h3>
        <p style="margin-bottom:0;">
          <strong>{{vehicle_info.year}} {{vehicle_info.make}} {{vehicle_info.model}}</strong><br>
          {{#if vehicle_info.price}}Price: ${{vehicle_info.price}}{{/if}}
        </p>
      </div>
      {{/if}}
      
      <div class="contact-card">
        <h3 style="margin-top:0;">Need to reach us sooner?</h3>
        <p>
          📞 <a href="tel:{{dealer_phone}}">{{dealer_phone}}</a><br>
          ✉️ <a href="mailto:{{dealer_email}}">{{dealer_email}}</a><br>
          📍 {{dealer_address}}
        </p>
        {{#if dealer_website}}
        <a href="{{dealer_website}}" class="btn">Visit Our Website</a>
        {{/if}}
      </div>
      
      <p style="color:#6b7280;font-size:14px;">
        This is an automated confirmation. Please do not reply to this email.
      </p>
    </div>
    
    <div class="footer">
      <p>{{dealer_name}} | {{dealer_address}}</p>
      <p>LMCT {{dealer_lmct}}</p>
    </div>
  </div>
</body>
</html>
```

**Template Variables:**
```typescript
interface CustomerConfirmationEmailData {
  // Dealer info
  dealer_name: string;
  dealer_logo_url?: string;
  dealer_primary_color: string;
  dealer_phone: string;
  dealer_email: string;
  dealer_address: string;
  dealer_website?: string;
  dealer_lmct?: string;
  
  // Customer & enquiry
  customer_first_name: string;
  enquiry_type_lower: string;    // 'vehicle', 'finance', etc.
  reference_number: string;       // e.g., 'ENQ-2024-001234'
  
  // Optional
  vehicle_info?: {
    year?: string;
    make?: string;
    model?: string;
    price?: string;
  };
}
```

---

#### Template 3: Enquiry Assigned (to Staff Member)
**Template ID:** `d-enquiry-assigned`
**Trigger:** When a manager assigns an enquiry to a staff member
**Recipients:** Assigned staff member's email

```html
Subject: 📋 Enquiry Assigned to You - {{customer_name}}

<!DOCTYPE html>
<html>
<head>
  <style>
    /* Same base styles as above */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">New Enquiry Assigned</h2>
    </div>
    
    <div class="content">
      <p>Hi {{staff_first_name}},</p>
      
      <p><strong>{{assigned_by_name}}</strong> has assigned you a new {{enquiry_type}} enquiry.</p>
      
      <div class="card">
        <div class="label">Customer</div>
        <div class="value">{{customer_name}}</div>
        <div>{{customer_email}} {{#if customer_phone}}• {{customer_phone}}{{/if}}</div>
      </div>
      
      {{#if vehicle_info}}
      <div class="card">
        <div class="label">Vehicle</div>
        <div class="value">{{vehicle_info.year}} {{vehicle_info.make}} {{vehicle_info.model}}</div>
      </div>
      {{/if}}
      
      {{#if message}}
      <div class="card">
        <div class="label">Customer Message</div>
        <div class="value">{{message}}</div>
      </div>
      {{/if}}
      
      {{#if assignment_note}}
      <div class="card" style="border-left: 4px solid #f59e0b;">
        <div class="label">Note from {{assigned_by_name}}</div>
        <div class="value">{{assignment_note}}</div>
      </div>
      {{/if}}
      
      <div style="text-align:center;margin-top:30px;">
        <a href="{{dashboard_url}}/enquiries/{{enquiry_id}}" class="btn">
          View & Respond →
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>{{dealer_name}} Enquiry Management</p>
    </div>
  </div>
</body>
</html>
```

---

#### Template 4: Daily Summary (to Dealer Managers)
**Template ID:** `d-daily-summary`
**Trigger:** Daily at 7:00 AM dealer's local time
**Recipients:** Dealer admin/managers with daily summary enabled

```html
Subject: 📊 Daily Enquiry Summary - {{date}} | {{dealer_name}}

<!DOCTYPE html>
<html>
<head>
  <style>
    .stat-box { display: inline-block; text-align: center; padding: 15px 25px; background: #f9fafb; 
                border-radius: 8px; margin: 5px; }
    .stat-number { font-size: 32px; font-weight: 700; color: {{dealer_primary_color}}; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .enquiry-row { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .status-new { background: #fef3c7; color: #92400e; }
    .status-in-progress { background: #dbeafe; color: #1e40af; }
    .status-contacted { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#if dealer_logo_url}}
        <img src="{{dealer_logo_url}}" alt="{{dealer_name}}" height="40">
      {{/if}}
      <h2 style="margin:10px 0 0;">Daily Enquiry Summary</h2>
      <p style="margin:5px 0;opacity:0.8;">{{date}}</p>
    </div>
    
    <div class="content">
      <!-- Stats Overview -->
      <div style="text-align:center;margin-bottom:30px;">
        <div class="stat-box">
          <div class="stat-number">{{stats.new_today}}</div>
          <div class="stat-label">New Today</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">{{stats.open_total}}</div>
          <div class="stat-label">Open Total</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">{{stats.closed_today}}</div>
          <div class="stat-label">Closed Today</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">{{stats.avg_response_time}}</div>
          <div class="stat-label">Avg Response</div>
        </div>
      </div>
      
      <!-- Unassigned Enquiries (Attention Needed) -->
      {{#if unassigned_enquiries.length}}
      <div class="card" style="border-left: 4px solid #ef4444;">
        <h3 style="margin-top:0;color:#ef4444;">⚠️ Unassigned Enquiries ({{unassigned_enquiries.length}})</h3>
        {{#each unassigned_enquiries}}
        <div class="enquiry-row">
          <strong>{{this.customer_name}}</strong> - {{this.type}}
          <span style="float:right;color:#6b7280;">{{this.time_ago}}</span>
        </div>
        {{/each}}
      </div>
      {{/if}}
      
      <!-- New Enquiries Today -->
      {{#if new_enquiries.length}}
      <div class="card">
        <h3 style="margin-top:0;">📥 New Enquiries Today</h3>
        {{#each new_enquiries}}
        <div class="enquiry-row">
          <strong>{{this.customer_name}}</strong> - {{this.type}}
          <span class="status-badge status-{{this.status}}">{{this.status}}</span>
          <span style="float:right;color:#6b7280;">{{this.time}}</span>
        </div>
        {{/each}}
      </div>
      {{/if}}
      
      <!-- Staff Leaderboard -->
      {{#if staff_stats.length}}
      <div class="card">
        <h3 style="margin-top:0;">👥 Team Activity (Last 7 Days)</h3>
        <table style="width:100%;">
          <tr style="color:#6b7280;font-size:12px;">
            <td>Staff</td>
            <td style="text-align:center;">Assigned</td>
            <td style="text-align:center;">Closed</td>
            <td style="text-align:center;">Avg Response</td>
          </tr>
          {{#each staff_stats}}
          <tr>
            <td>{{this.name}}</td>
            <td style="text-align:center;">{{this.assigned}}</td>
            <td style="text-align:center;">{{this.closed}}</td>
            <td style="text-align:center;">{{this.avg_response}}</td>
          </tr>
          {{/each}}
        </table>
      </div>
      {{/if}}
      
      <div style="text-align:center;margin-top:30px;">
        <a href="{{dashboard_url}}/enquiries" class="btn">Open Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you have daily summaries enabled.</p>
      <p><a href="{{dashboard_url}}/settings">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>
```

---

#### Template 5: Staff Welcome / Set Password
**Template ID:** `d-staff-welcome`
**Trigger:** When a new staff user is created
**Recipients:** New staff member's email

```html
Subject: Welcome to {{dealer_name}} - Set Your Password

<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <div class="header">
      {{#if dealer_logo_url}}
        <img src="{{dealer_logo_url}}" alt="{{dealer_name}}" height="40">
      {{/if}}
    </div>
    
    <div class="content">
      <h2>Welcome to the team, {{staff_first_name}}!</h2>
      
      <p>You've been added to <strong>{{dealer_name}}</strong>'s enquiry management system by {{invited_by_name}}.</p>
      
      <div class="card">
        <p><strong>Your login email:</strong> {{staff_email}}</p>
        <p><strong>Your role:</strong> {{staff_role}}</p>
        {{#if staff_department}}<p><strong>Department:</strong> {{staff_department}}</p>{{/if}}
      </div>
      
      <p>To get started, please set your password:</p>
      
      <div style="text-align:center;margin:30px 0;">
        <a href="{{set_password_url}}" class="btn">Set Your Password</a>
      </div>
      
      <p style="color:#6b7280;font-size:14px;">
        This link will expire in 24 hours. If you didn't expect this invitation, please ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p>{{dealer_name}} Enquiry Management</p>
    </div>
  </div>
</body>
</html>
```

---

#### Template 6: Password Reset
**Template ID:** `d-password-reset`
**Trigger:** When user requests password reset
**Recipients:** User's email

```html
Subject: Reset Your Password - {{dealer_name}}

<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <div class="header">
      {{#if dealer_logo_url}}
        <img src="{{dealer_logo_url}}" alt="{{dealer_name}}" height="40">
      {{/if}}
    </div>
    
    <div class="content">
      <h2>Reset Your Password</h2>
      
      <p>Hi {{user_first_name}},</p>
      
      <p>We received a request to reset your password for your {{dealer_name}} account.</p>
      
      <div style="text-align:center;margin:30px 0;">
        <a href="{{reset_url}}" class="btn">Reset Password</a>
      </div>
      
      <p style="color:#6b7280;font-size:14px;">
        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p>{{dealer_name}} Enquiry Management</p>
    </div>
  </div>
</body>
</html>
```

---

#### Template 7: Dealer Onboarding (to New Dealer Admin)
**Template ID:** `d-dealer-onboarding`
**Trigger:** When a new dealer is created by super admin
**Recipients:** New dealer's admin email

```html
Subject: 🎉 Welcome to Leads Platform - {{dealer_name}}

<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #001E50 0%, #0066cc 100%);">
      <h1 style="margin:0;color:white;">Welcome to Leads Platform</h1>
    </div>
    
    <div class="content">
      <h2>Hi {{admin_first_name}},</h2>
      
      <p>Your dealership <strong>{{dealer_name}}</strong> has been set up on our enquiry management platform!</p>
      
      <div class="card" style="background:#f0fdf4;border:1px solid #86efac;">
        <h3 style="margin-top:0;color:#166534;">🚀 Quick Start Checklist</h3>
        <ul style="margin:0;padding-left:20px;">
          <li>Set your password (link below)</li>
          <li>Add your team members</li>
          <li>Configure notification preferences</li>
          <li>Add your API key to your website</li>
        </ul>
      </div>
      
      <div class="card">
        <h3 style="margin-top:0;">Your Account Details</h3>
        <p><strong>Dashboard URL:</strong> <a href="{{dashboard_url}}">{{dashboard_url}}</a></p>
        <p><strong>Your Email:</strong> {{admin_email}}</p>
        <p><strong>API Key:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">{{api_key}}</code></p>
        <p style="color:#6b7280;font-size:12px;">⚠️ Keep your API key secure. You can regenerate it in Settings.</p>
      </div>
      
      <div class="card">
        <h3 style="margin-top:0;">📖 Integration Guide</h3>
        <p>Add this to your website's environment variables:</p>
        <pre style="background:#1f2937;color:#f9fafb;padding:15px;border-radius:6px;overflow-x:auto;">
NUXT_DEALER_API_KEY={{api_key}}
NUXT_ENQUIRY_API_URL=https://api.leads.app/api/enquiry</pre>
      </div>
      
      <div style="text-align:center;margin:30px 0;">
        <a href="{{set_password_url}}" class="btn">Set Your Password & Get Started</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Need help? Contact <a href="mailto:support@leads.app">support@leads.app</a></p>
    </div>
  </div>
</body>
</html>
```

---

### 9.4 Email Service Implementation

#### Database Schema Addition
```sql
-- Add to dealers table for email preferences
ALTER TABLE dealers ADD COLUMN email_settings JSONB DEFAULT '{
  "notification_emails": [],
  "send_customer_confirmation": true,
  "send_daily_summary": true,
  "daily_summary_time": "07:00",
  "daily_summary_timezone": "Australia/Melbourne",
  "custom_sender_email": null,
  "custom_sender_name": null
}';

-- Email log for debugging and analytics
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id),
  
  template_id VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(30),            -- 'customer', 'staff', 'dealer'
  
  subject VARCHAR(255),
  
  -- SendGrid response
  sendgrid_message_id VARCHAR(100),
  status VARCHAR(30) DEFAULT 'sent',     -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  
  -- Reference
  enquiry_id UUID REFERENCES enquiries(id),
  user_id UUID REFERENCES users(id),
  
  -- Metadata
  template_data JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_dealer ON email_logs(dealer_id);
CREATE INDEX idx_email_logs_enquiry ON email_logs(enquiry_id);
```

#### Server Utility: `server/utils/email.ts`
```typescript
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Template IDs (from SendGrid dashboard)
export const EMAIL_TEMPLATES = {
  NEW_ENQUIRY_NOTIFICATION: 'd-xxxxxxxx001',
  CUSTOMER_CONFIRMATION: 'd-xxxxxxxx002',
  ENQUIRY_ASSIGNED: 'd-xxxxxxxx003',
  DAILY_SUMMARY: 'd-xxxxxxxx004',
  STAFF_WELCOME: 'd-xxxxxxxx005',
  PASSWORD_RESET: 'd-xxxxxxxx006',
  DEALER_ONBOARDING: 'd-xxxxxxxx007',
} as const;

interface SendEmailOptions {
  to: string | string[];
  templateId: string;
  dynamicTemplateData: Record<string, any>;
  from?: {
    email: string;
    name: string;
  };
  dealerId?: string;
  enquiryId?: string;
  userId?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<string | null> {
  const {
    to,
    templateId,
    dynamicTemplateData,
    from = {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@leads.app',
      name: process.env.SENDGRID_FROM_NAME || 'Leads Platform',
    },
    dealerId,
    enquiryId,
    userId,
  } = options;

  try {
    const msg = {
      to,
      from,
      templateId,
      dynamicTemplateData,
    };

    const [response] = await sgMail.send(msg);
    const messageId = response.headers['x-message-id'];

    // Log email (async, don't await)
    logEmail({
      dealerId,
      templateId,
      recipientEmail: Array.isArray(to) ? to.join(', ') : to,
      sendgridMessageId: messageId,
      status: 'sent',
      enquiryId,
      userId,
      templateData: dynamicTemplateData,
    }).catch(console.error);

    return messageId;
  } catch (error: any) {
    console.error('[Email] Send failed:', error.message);
    
    // Log failure
    logEmail({
      dealerId,
      templateId,
      recipientEmail: Array.isArray(to) ? to.join(', ') : to,
      status: 'failed',
      errorMessage: error.message,
      enquiryId,
      userId,
      templateData: dynamicTemplateData,
    }).catch(console.error);

    return null;
  }
}

// Convenience functions for each template
export async function sendNewEnquiryNotification(
  dealer: Dealer,
  enquiry: Enquiry,
  recipientEmails: string[]
) {
  return sendEmail({
    to: recipientEmails,
    templateId: EMAIL_TEMPLATES.NEW_ENQUIRY_NOTIFICATION,
    dynamicTemplateData: {
      dealer_name: dealer.name,
      dealer_logo_url: dealer.logo_url,
      dealer_primary_color: dealer.primary_color || '#001E50',
      dashboard_url: `https://${dealer.slug}.leads.app`,
      enquiry_id: enquiry.id,
      enquiry_type: formatEnquiryType(enquiry.type),
      customer_name: `${enquiry.first_name} ${enquiry.last_name}`,
      customer_email: enquiry.email,
      customer_phone: enquiry.phone,
      message: enquiry.message,
      vehicle_info: enquiry.vehicle_info,
      trade_in_info: enquiry.trade_in_info,
    },
    dealerId: dealer.id,
    enquiryId: enquiry.id,
  });
}

export async function sendCustomerConfirmation(
  dealer: Dealer,
  enquiry: Enquiry
) {
  // Check if dealer has customer confirmations enabled
  if (!dealer.email_settings?.send_customer_confirmation) {
    return null;
  }

  return sendEmail({
    to: enquiry.email,
    templateId: EMAIL_TEMPLATES.CUSTOMER_CONFIRMATION,
    from: dealer.email_settings?.custom_sender_email
      ? { email: dealer.email_settings.custom_sender_email, name: dealer.name }
      : undefined,
    dynamicTemplateData: {
      dealer_name: dealer.name,
      dealer_logo_url: dealer.logo_url,
      dealer_primary_color: dealer.primary_color || '#001E50',
      dealer_phone: dealer.phone,
      dealer_email: dealer.email,
      dealer_address: dealer.address,
      dealer_website: dealer.website_url,
      dealer_lmct: dealer.lmct,
      customer_first_name: enquiry.first_name,
      enquiry_type_lower: enquiry.type.toLowerCase().replace('_', ' '),
      reference_number: generateReferenceNumber(enquiry),
      vehicle_info: enquiry.vehicle_info,
    },
    dealerId: dealer.id,
    enquiryId: enquiry.id,
  });
}

export async function sendEnquiryAssigned(
  dealer: Dealer,
  enquiry: Enquiry,
  assignedUser: User,
  assignedByUser: User,
  note?: string
) {
  return sendEmail({
    to: assignedUser.email,
    templateId: EMAIL_TEMPLATES.ENQUIRY_ASSIGNED,
    dynamicTemplateData: {
      dealer_name: dealer.name,
      dealer_primary_color: dealer.primary_color || '#001E50',
      dashboard_url: `https://${dealer.slug}.leads.app`,
      staff_first_name: assignedUser.first_name,
      assigned_by_name: `${assignedByUser.first_name} ${assignedByUser.last_name}`,
      assignment_note: note,
      enquiry_id: enquiry.id,
      enquiry_type: formatEnquiryType(enquiry.type),
      customer_name: `${enquiry.first_name} ${enquiry.last_name}`,
      customer_email: enquiry.email,
      customer_phone: enquiry.phone,
      message: enquiry.message,
      vehicle_info: enquiry.vehicle_info,
    },
    dealerId: dealer.id,
    enquiryId: enquiry.id,
    userId: assignedUser.id,
  });
}

export async function sendDailySummary(
  dealer: Dealer,
  recipientEmails: string[],
  summaryData: DailySummaryData
) {
  return sendEmail({
    to: recipientEmails,
    templateId: EMAIL_TEMPLATES.DAILY_SUMMARY,
    dynamicTemplateData: {
      dealer_name: dealer.name,
      dealer_logo_url: dealer.logo_url,
      dealer_primary_color: dealer.primary_color || '#001E50',
      dashboard_url: `https://${dealer.slug}.leads.app`,
      date: summaryData.date,
      stats: summaryData.stats,
      unassigned_enquiries: summaryData.unassigned_enquiries,
      new_enquiries: summaryData.new_enquiries,
      staff_stats: summaryData.staff_stats,
    },
    dealerId: dealer.id,
  });
}

export async function sendStaffWelcome(
  dealer: Dealer,
  user: User,
  invitedBy: User,
  setPasswordToken: string
) {
  return sendEmail({
    to: user.email,
    templateId: EMAIL_TEMPLATES.STAFF_WELCOME,
    dynamicTemplateData: {
      dealer_name: dealer.name,
      dealer_logo_url: dealer.logo_url,
      staff_first_name: user.first_name,
      staff_email: user.email,
      staff_role: formatRole(user.role),
      staff_department: user.department,
      invited_by_name: `${invitedBy.first_name} ${invitedBy.last_name}`,
      set_password_url: `https://${dealer.slug}.leads.app/set-password?token=${setPasswordToken}`,
    },
    dealerId: dealer.id,
    userId: user.id,
  });
}

export async function sendPasswordReset(
  dealer: Dealer,
  user: User,
  resetToken: string
) {
  return sendEmail({
    to: user.email,
    templateId: EMAIL_TEMPLATES.PASSWORD_RESET,
    dynamicTemplateData: {
      dealer_name: dealer.name,
      dealer_logo_url: dealer.logo_url,
      user_first_name: user.first_name,
      reset_url: `https://${dealer.slug}.leads.app/reset-password?token=${resetToken}`,
    },
    dealerId: dealer.id,
    userId: user.id,
  });
}

export async function sendDealerOnboarding(
  dealer: Dealer,
  adminUser: User,
  apiKey: string,
  setPasswordToken: string
) {
  return sendEmail({
    to: adminUser.email,
    templateId: EMAIL_TEMPLATES.DEALER_ONBOARDING,
    dynamicTemplateData: {
      dealer_name: dealer.name,
      admin_first_name: adminUser.first_name,
      admin_email: adminUser.email,
      dashboard_url: `https://${dealer.slug}.leads.app`,
      api_key: apiKey,
      set_password_url: `https://${dealer.slug}.leads.app/set-password?token=${setPasswordToken}`,
    },
    dealerId: dealer.id,
    userId: adminUser.id,
  });
}

// Helper functions
function formatEnquiryType(type: string): string {
  const typeMap: Record<string, string> = {
    vehicle: 'Vehicle',
    finance: 'Finance',
    contact: 'Contact',
    sell_car: 'Sell My Car',
    test_drive: 'Test Drive',
    parts: 'Parts',
    service: 'Service',
    fleet: 'Fleet',
  };
  return typeMap[type] || type;
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    dealer_admin: 'Dealer Administrator',
    manager: 'Manager',
    staff: 'Staff Member',
  };
  return roleMap[role] || role;
}

function generateReferenceNumber(enquiry: Enquiry): string {
  const date = new Date(enquiry.created_at);
  const year = date.getFullYear();
  const shortId = enquiry.id.slice(0, 6).toUpperCase();
  return `ENQ-${year}-${shortId}`;
}
```

### 9.5 Cron Job: Daily Summary
```typescript
// server/api/cron/daily-summary.ts
// Triggered by Netlify Scheduled Function or external cron service

export default defineEventHandler(async (event) => {
  // Verify cron secret
  const cronSecret = getHeader(event, 'x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // Get all dealers with daily summary enabled
  const dealers = await db.query.dealers.findMany({
    where: sql`email_settings->>'send_daily_summary' = 'true'`,
  });

  for (const dealer of dealers) {
    // Get managers/admins who should receive summary
    const recipients = await db.query.users.findMany({
      where: and(
        eq(users.dealer_id, dealer.id),
        eq(users.is_active, true),
        inArray(users.role, ['dealer_admin', 'manager'])
      ),
    });

    if (recipients.length === 0) continue;

    // Gather summary data
    const summaryData = await generateDailySummary(dealer.id);

    // Send email
    await sendDailySummary(
      dealer,
      recipients.map(r => r.email),
      summaryData
    );
  }

  return { success: true, dealersProcessed: dealers.length };
});
```

---

## 10. Environment Variables

```env
# Database (shared)
NEON_DATABASE_URL=postgresql://user:pass@host/leads_platform?sslmode=require

# Authentication
NUXT_JWT_SECRET=your-secure-jwt-secret
NUXT_JWT_REFRESH_SECRET=your-secure-refresh-secret

# Platform
PLATFORM_DOMAIN=leads.app
SUPER_ADMIN_EMAIL=admin@leads.app

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@leads.app
SENDGRID_FROM_NAME=Leads Platform

# SendGrid Template IDs
SENDGRID_TEMPLATE_NEW_ENQUIRY=d-xxxxxxxx001
SENDGRID_TEMPLATE_CUSTOMER_CONFIRM=d-xxxxxxxx002
SENDGRID_TEMPLATE_ENQUIRY_ASSIGNED=d-xxxxxxxx003
SENDGRID_TEMPLATE_DAILY_SUMMARY=d-xxxxxxxx004
SENDGRID_TEMPLATE_STAFF_WELCOME=d-xxxxxxxx005
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxx006
SENDGRID_TEMPLATE_DEALER_ONBOARD=d-xxxxxxxx007

# Cron (for scheduled functions)
CRON_SECRET=your-cron-secret

# Per-Dealer (in their website's .env)
NUXT_DEALER_API_KEY=dk_live_xxxxx
NUXT_ENQUIRY_API_URL=https://api.leads.app/api/enquiry
```

---

## 11. Security Considerations

### 11.1 Tenant Isolation
- **Row-Level Security** enforced at database level
- **API middleware** validates dealer context on every request
- **JWT claims** include `dealer_id` for server-side verification
- **Audit logging** tracks all data access

### 11.2 API Key Security
- Keys are hashed in database (only shown once on creation)
- Rate limiting per API key (100 requests/minute)
- Key rotation supported with 24-hour grace period
- Webhook signature verification for callbacks

### 11.3 Data Isolation Testing
```typescript
// Test: Dealer A cannot see Dealer B's enquiries
const dealerAToken = await loginAs('admin@dealera.com');
const enquiries = await fetchEnquiries(dealerAToken);
expect(enquiries.every(e => e.dealer_id === DEALER_A_ID)).toBe(true);
```

---

## 12. Success Criteria

### 12.1 Technical
- [ ] Complete tenant isolation (verified by security audit)
- [ ] < 500ms API response times
- [ ] Support for 50+ dealers without performance degradation
- [ ] Zero cross-tenant data leaks

### 12.2 Business
- [ ] Onboard new dealer in < 5 minutes
- [ ] Each dealer only sees their own data
- [ ] Dealer admins can manage their staff
- [ ] Platform analytics for overall health

---

## 13. Appendix

### A. Example Dealers
| Dealer | Slug | OEM | API Key Pattern |
|--------|------|-----|-----------------|
| Sale Hyundai | `sale-hyundai` | Hyundai | `dk_live_salehyundai_xxx` |
| Pakenham Hyundai | `pakenham-hyundai` | Hyundai | `dk_live_pakenhamhyundai_xxx` |
| Sale Toyota | `sale-toyota` | Toyota | `dk_live_saletoyota_xxx` |

### B. Dashboard URLs
```
# Main platform
https://leads.app                         → Landing/dealer selector

# Dealer dashboards (subdomain)
https://salehyundai.leads.app/admin       → Sale Hyundai dashboard
https://pakenhamhyundai.leads.app/admin   → Pakenham Hyundai dashboard

# API
https://api.leads.app/api/enquiry         → Form submission endpoint
```

### C. Related Files
- `server/api/form.post.ts` - Current form handler (to be deprecated)
- `server/middleware/tenant.ts` - New tenant resolution middleware
- `server/utils/db.ts` - Database connection with RLS context

### D. Related PRDs
- **Accessories Store R&D** - `memory-bank/PRD-accessories-store.md`
  - Live at `/accessories`
  - Hyundai Genuine Accessories shopping experience
  - Cart functionality with localStorage persistence
  - Integration with enquiry system planned

### E. Enquiry Types (Including Accessories)
| Type | Key | Form Location | Description |
|------|-----|---------------|-------------|
| Contact | `contact` | `/contact` | General dealership contact |
| Finance | `finance` | Finance pages | Finance pre-approval |
| Vehicle | `vehicle` | Car sales pages | Vehicle-specific enquiry |
| Sell My Car | `sell_car` | `/sell-my-car` | Trade-in valuation |
| Test Drive | `test_drive` | `/test-drive` | Book a test drive |
| Parts | `parts` | Contact (Parts tab) | Parts enquiry |
| Service | `service` | Contact (Service tab) | Service booking |
| Fleet | `fleet` | Fleet pages | Fleet enquiry |
| **Accessories** | `accessories` | `/accessories` | Accessories cart enquiry |

### F. Accessories Integration
When a customer submits an enquiry from the accessories cart:

```typescript
// Enquiry payload for accessories
{
  type: 'accessories',
  department: 'parts',
  source: '/accessories?model=tucson',
  
  // Customer info
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@email.com',
  phone: '0412345678',
  
  // Model context
  vehicleInfo: {
    model: 'Tucson',
    year: '2025',
  },
  
  // Cart contents
  accessoriesCart: {
    items: [
      { id: 'D3F15-AP000', name: 'Roof Racks', partNumber: 'D3F15AP000', quantity: 1, price: 599 },
      { id: 'D3F15-AP001', name: 'Cargo Mat', partNumber: 'D3F15AP001', quantity: 2, price: 149 },
    ],
    itemCount: 3,
    total: 897,
  },
}


