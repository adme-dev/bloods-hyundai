import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index, inet, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// DEALER GROUPS (Optional - for multi-dealership owners)
// ============================================================================

export const dealerGroups = pgTable('dealer_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// DEALERS (Tenant Registry)
// ============================================================================

export const dealers = pgTable('dealers', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Identification
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  apiKey: varchar('api_key', { length: 100 }).unique().notNull(),
  
  // Contact & Location
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  suburb: varchar('suburb', { length: 100 }),
  state: varchar('state', { length: 20 }),
  postcode: varchar('postcode', { length: 10 }),
  
  // Branding
  logoUrl: varchar('logo_url', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 7 }),
  websiteUrl: varchar('website_url', { length: 255 }),
  
  // Configuration
  settings: jsonb('settings').default({}).notNull(),
  routingRules: jsonb('routing_rules').default([]).notNull(),
  emailSettings: jsonb('email_settings').default({
    notification_emails: [],
    send_customer_confirmation: true,
    send_daily_summary: true,
    daily_summary_time: '07:00',
    daily_summary_timezone: 'Australia/Melbourne',
    custom_sender_email: null,
    custom_sender_name: null,
  }).notNull(),
  
  // OEM/Group
  oem: varchar('oem', { length: 50 }),
  dealerGroupId: uuid('dealer_group_id').references(() => dealerGroups.id),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 30 }).default('standard').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  apiKeyIdx: uniqueIndex('idx_dealers_api_key').on(table.apiKey),
  slugIdx: uniqueIndex('idx_dealers_slug').on(table.slug),
}));

// ============================================================================
// USERS (Staff Accounts - Tenant-Scoped)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  
  // Authentication
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  
  // Profile
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  // Role & Permissions
  role: varchar('role', { length: 30 }).default('staff').notNull(),
  department: varchar('department', { length: 50 }),
  permissions: jsonb('permissions').default([]).notNull(),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
}, (table) => ({
  dealerIdx: index('idx_users_dealer').on(table.dealerId),
  emailIdx: index('idx_users_email').on(table.email),
  // Unique constraint: same email can exist at different dealers
  uniqueDealerEmail: uniqueIndex('users_dealer_id_email_key').on(table.dealerId, table.email),
}));

// ============================================================================
// ENQUIRIES (Form Submissions - Tenant-Scoped)
// ============================================================================

export const enquiries = pgTable('enquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  
  // Enquiry Type & Source
  type: varchar('type', { length: 50 }).notNull(),
  source: varchar('source', { length: 255 }),
  department: varchar('department', { length: 50 }),
  
  // Customer Information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  postcode: varchar('postcode', { length: 10 }),
  suburb: varchar('suburb', { length: 100 }),
  state: varchar('state', { length: 20 }),
  
  // Enquiry Details
  message: text('message'),
  testDrive: boolean('test_drive').default(false),
  financeInterest: boolean('finance_interest').default(false),
  
  // Vehicle-specific fields (nullable)
  vehicleStockId: varchar('vehicle_stock_id', { length: 50 }),
  vehicleInfo: jsonb('vehicle_info'),
  
  // Trade-in fields
  tradeInInfo: jsonb('trade_in_info'),
  
  // Finance fields
  financeDetails: jsonb('finance_details'),
  
  // Sell My Car fields
  sellCarDetails: jsonb('sell_car_details'),
  
  // Accessories cart
  accessoriesCart: jsonb('accessories_cart'),
  
  // Status & Workflow
  status: varchar('status', { length: 30 }).default('new').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  contactedAt: timestamp('contacted_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  
  // Snooze & Archive
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  
  // External Integration
  externalRef: varchar('external_ref', { length: 100 }),
  syncedToCrm: boolean('synced_to_crm').default(false).notNull(),
  crmRef: varchar('crm_ref', { length: 100 }),
  
  // Metadata
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
}, (table) => ({
  dealerIdx: index('idx_enquiries_dealer').on(table.dealerId),
  dealerStatusIdx: index('idx_enquiries_dealer_status').on(table.dealerId, table.status),
  dealerTypeIdx: index('idx_enquiries_dealer_type').on(table.dealerId, table.type),
  dealerCreatedIdx: index('idx_enquiries_dealer_created').on(table.dealerId, table.createdAt),
  assignedIdx: index('idx_enquiries_assigned').on(table.assignedTo),
  emailIdx: index('idx_enquiries_email').on(table.email),
}));

// ============================================================================
// ENQUIRY NOTES
// ============================================================================

export const enquiryNotes = pgTable('enquiry_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  
  content: text('content').notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  enquiryIdx: index('idx_notes_enquiry').on(table.enquiryId),
}));

// ============================================================================
// ENQUIRY ACTIVITY LOG (Audit Trail)
// ============================================================================

export const enquiryActivityLog = pgTable('enquiry_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id),
  enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  
  action: varchar('action', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_activity_dealer').on(table.dealerId),
  enquiryIdx: index('idx_activity_enquiry').on(table.enquiryId),
}));

// ============================================================================
// EMAIL LOGS
// ============================================================================

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').references(() => dealers.id),
  
  templateId: varchar('template_id', { length: 100 }).notNull(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  recipientType: varchar('recipient_type', { length: 30 }),
  
  subject: varchar('subject', { length: 255 }),
  
  // SendGrid response
  sendgridMessageId: varchar('sendgrid_message_id', { length: 100 }),
  status: varchar('status', { length: 30 }).default('sent').notNull(),
  
  // Reference
  enquiryId: uuid('enquiry_id').references(() => enquiries.id),
  userId: uuid('user_id').references(() => users.id),
  
  // Metadata
  templateData: jsonb('template_data'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_email_logs_dealer').on(table.dealerId),
  enquiryIdx: index('idx_email_logs_enquiry').on(table.enquiryId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const dealerGroupsRelations = relations(dealerGroups, ({ many }) => ({
  dealers: many(dealers),
}));

export const dealersRelations = relations(dealers, ({ one, many }) => ({
  dealerGroup: one(dealerGroups, {
    fields: [dealers.dealerGroupId],
    references: [dealerGroups.id],
  }),
  users: many(users),
  enquiries: many(enquiries),
  activityLogs: many(enquiryActivityLog),
  emailLogs: many(emailLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  dealer: one(dealers, {
    fields: [users.dealerId],
    references: [dealers.id],
  }),
  assignedEnquiries: many(enquiries),
  notes: many(enquiryNotes),
  activityLogs: many(enquiryActivityLog),
}));

export const enquiriesRelations = relations(enquiries, ({ one, many }) => ({
  dealer: one(dealers, {
    fields: [enquiries.dealerId],
    references: [dealers.id],
  }),
  assignedUser: one(users, {
    fields: [enquiries.assignedTo],
    references: [users.id],
  }),
  notes: many(enquiryNotes),
  activityLogs: many(enquiryActivityLog),
  emailLogs: many(emailLogs),
}));

export const enquiryNotesRelations = relations(enquiryNotes, ({ one }) => ({
  enquiry: one(enquiries, {
    fields: [enquiryNotes.enquiryId],
    references: [enquiries.id],
  }),
  user: one(users, {
    fields: [enquiryNotes.userId],
    references: [users.id],
  }),
}));

export const enquiryActivityLogRelations = relations(enquiryActivityLog, ({ one }) => ({
  dealer: one(dealers, {
    fields: [enquiryActivityLog.dealerId],
    references: [dealers.id],
  }),
  enquiry: one(enquiries, {
    fields: [enquiryActivityLog.enquiryId],
    references: [enquiries.id],
  }),
  user: one(users, {
    fields: [enquiryActivityLog.userId],
    references: [users.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  dealer: one(dealers, {
    fields: [emailLogs.dealerId],
    references: [dealers.id],
  }),
  enquiry: one(enquiries, {
    fields: [emailLogs.enquiryId],
    references: [enquiries.id],
  }),
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DealerGroup = typeof dealerGroups.$inferSelect;
export type NewDealerGroup = typeof dealerGroups.$inferInsert;

export type Dealer = typeof dealers.$inferSelect;
export type NewDealer = typeof dealers.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;

export type EnquiryNote = typeof enquiryNotes.$inferSelect;
export type NewEnquiryNote = typeof enquiryNotes.$inferInsert;

export type EnquiryActivityLog = typeof enquiryActivityLog.$inferSelect;
export type NewEnquiryActivityLog = typeof enquiryActivityLog.$inferInsert;

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;

