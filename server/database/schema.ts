import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index, inet, uniqueIndex, integer, numeric, date } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

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
  emailHeaderBgColor: varchar('email_header_bg_color', { length: 7 }), // Email header background (e.g., #FFFFFF for white)
  websiteUrl: varchar('website_url', { length: 255 }),

  // Social Media
  facebookUrl: varchar('facebook_url', { length: 255 }),
  instagramUrl: varchar('instagram_url', { length: 255 }),
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  youtubeUrl: varchar('youtube_url', { length: 255 }),
  twitterUrl: varchar('twitter_url', { length: 255 }),

  // Trading Hours (for email footer)
  tradingHours: jsonb('trading_hours').$type<{
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  }>(),

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
  passwordHash: varchar('password_hash', { length: 255 }), // Nullable for invited users who haven't set password yet
  
  // Profile
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  // Role & Permissions
  role: varchar('role', { length: 30 }).default('staff').notNull(),
  department: varchar('department', { length: 50 }),
  permissions: jsonb('permissions').default([]).notNull(),
  
  // Status: 'invited' | 'active' | 'inactive'
  status: varchar('status', { length: 20 }).default('invited').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  
  // Invitation & Activation
  invitationToken: varchar('invitation_token', { length: 100 }),
  invitationTokenExpiry: timestamp('invitation_token_expiry', { withTimezone: true }),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  invitedBy: uuid('invited_by'),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLogin: timestamp('last_login', { withTimezone: true }),

  // Notification tracking
  lastSeenNotificationsAt: timestamp('last_seen_notifications_at', { withTimezone: true }),
  // Ids of individually-dismissed notifications (per-item read state). "Mark all"
  // still uses lastSeenNotificationsAt; this is for marking one at a time.
  readNotificationIds: jsonb('read_notification_ids').default([]).notNull(),
}, (table) => ({
  dealerIdx: index('idx_users_dealer').on(table.dealerId),
  emailIdx: index('idx_users_email').on(table.email),
  invitationTokenIdx: index('idx_users_invitation_token').on(table.invitationToken),
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
  // Valid statuses: new_lead, qualified, attempted_contact, appointment_set, showed,
  // test_drive, negotiating, pending_finance, pending_trade, deposit_taken, sold, lost, dead
  status: varchar('status', { length: 30 }).default('new_lead').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),

  // Lost deal tracking
  lostReason: varchar('lost_reason', { length: 50 }),
  lostNotes: text('lost_notes'),
  
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
// CUSTOMERS (Customer accounts for portal access)
// ============================================================================

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  // Authentication
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),

  // Profile
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),

  // Address
  address: text('address'),
  suburb: varchar('suburb', { length: 100 }),
  state: varchar('state', { length: 20 }),
  postcode: varchar('postcode', { length: 10 }),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  verificationToken: varchar('verification_token', { length: 100 }),
  resetToken: varchar('reset_token', { length: 100 }),
  resetTokenExpiry: timestamp('reset_token_expiry', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
}, (table) => ({
  dealerIdx: index('idx_customers_dealer').on(table.dealerId),
  emailIdx: index('idx_customers_email').on(table.email),
  uniqueDealerEmail: uniqueIndex('customers_dealer_id_email_key').on(table.dealerId, table.email),
}));

// ============================================================================
// CUSTOMER VEHICLES (Registered vehicles for customers)
// ============================================================================

export const customerVehicles = pgTable('customer_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  // Vehicle identification
  make: varchar('make', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: varchar('year', { length: 4 }),
  registration: varchar('registration', { length: 20 }),
  vin: varchar('vin', { length: 20 }),

  // Vehicle details
  color: varchar('color', { length: 50 }),
  engineType: varchar('engine_type', { length: 50 }),
  transmission: varchar('transmission', { length: 50 }),

  // Current state
  currentOdometer: varchar('current_odometer', { length: 20 }),
  lastServiceDate: timestamp('last_service_date', { withTimezone: true }),
  nextServiceDue: timestamp('next_service_due', { withTimezone: true }),

  // Notes
  notes: text('notes'),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_customer_vehicles_dealer').on(table.dealerId),
  customerIdx: index('idx_customer_vehicles_customer').on(table.customerId),
  regoIdx: index('idx_customer_vehicles_rego').on(table.registration),
}));

// ============================================================================
// SERVICE APPOINTMENTS (Service bookings and appointments)
// ============================================================================

export const serviceAppointments = pgTable('service_appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  // Linked records
  customerId: uuid('customer_id').references(() => customers.id),
  vehicleId: uuid('vehicle_id').references(() => customerVehicles.id),
  enquiryId: uuid('enquiry_id').references(() => enquiries.id),

  // Customer details (denormalized for quick access)
  customerFirstName: varchar('customer_first_name', { length: 100 }).notNull(),
  customerLastName: varchar('customer_last_name', { length: 100 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),

  // Vehicle details (denormalized)
  vehicleMake: varchar('vehicle_make', { length: 100 }).notNull(),
  vehicleModel: varchar('vehicle_model', { length: 100 }).notNull(),
  vehicleYear: varchar('vehicle_year', { length: 4 }),
  vehicleRegistration: varchar('vehicle_registration', { length: 20 }),
  vehicleVin: varchar('vehicle_vin', { length: 20 }),
  vehicleOdometer: varchar('vehicle_odometer', { length: 20 }),

  // Appointment scheduling
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
  scheduledTime: varchar('scheduled_time', { length: 10 }),
  estimatedDuration: varchar('estimated_duration', { length: 50 }),

  // Drop-off / Pick-up
  dropOffDate: timestamp('drop_off_date', { withTimezone: true }),
  dropOffTime: varchar('drop_off_time', { length: 10 }),
  pickUpDate: timestamp('pick_up_date', { withTimezone: true }),
  pickUpTime: varchar('pick_up_time', { length: 10 }),
  actualDropOff: timestamp('actual_drop_off', { withTimezone: true }),
  actualPickUp: timestamp('actual_pick_up', { withTimezone: true }),

  // Service details
  serviceType: varchar('service_type', { length: 100 }).notNull(),
  serviceDescription: text('service_description'),
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),

  // Service options
  isScheduledService: boolean('is_scheduled_service').default(false),
  isPreviouslyServiced: boolean('is_previously_serviced').default(false),
  hasOtherRepairs: boolean('has_other_repairs').default(false),
  requiresLoanCar: boolean('requires_loan_car').default(false),
  loanCarProvided: boolean('loan_car_provided').default(false),

  // Status & workflow
  status: varchar('status', { length: 30 }).default('pending').notNull(),
  // pending, confirmed, in_progress, awaiting_parts, completed, cancelled, no_show
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),

  // Assignment
  assignedTechnicianId: uuid('assigned_technician_id').references(() => users.id),
  assignedServiceAdvisorId: uuid('assigned_service_advisor_id').references(() => users.id),

  // Costing
  estimatedCost: varchar('estimated_cost', { length: 20 }),
  actualCost: varchar('actual_cost', { length: 20 }),
  quoteSent: boolean('quote_sent').default(false),
  quoteApproved: boolean('quote_approved').default(false),
  invoiceNumber: varchar('invoice_number', { length: 50 }),

  // Completion
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedOdometer: varchar('completed_odometer', { length: 20 }),
  workPerformed: text('work_performed'),
  partsUsed: jsonb('parts_used'),

  // Customer communication
  reminderSent: boolean('reminder_sent').default(false),
  confirmationSent: boolean('confirmation_sent').default(false),
  completionNotified: boolean('completion_notified').default(false),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_service_appointments_dealer').on(table.dealerId),
  customerIdx: index('idx_service_appointments_customer').on(table.customerId),
  vehicleIdx: index('idx_service_appointments_vehicle').on(table.vehicleId),
  scheduledDateIdx: index('idx_service_appointments_scheduled').on(table.scheduledDate),
  statusIdx: index('idx_service_appointments_status').on(table.status),
  technicianIdx: index('idx_service_appointments_technician').on(table.assignedTechnicianId),
}));

// ============================================================================
// SERVICE HISTORY (Completed service records)
// ============================================================================

export const serviceHistory = pgTable('service_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  // Linked records
  appointmentId: uuid('appointment_id').references(() => serviceAppointments.id),
  customerId: uuid('customer_id').references(() => customers.id),
  vehicleId: uuid('vehicle_id').references(() => customerVehicles.id),

  // Service details
  serviceDate: timestamp('service_date', { withTimezone: true }).notNull(),
  serviceType: varchar('service_type', { length: 100 }).notNull(),
  odometerReading: varchar('odometer_reading', { length: 20 }),

  // Work performed
  workPerformed: text('work_performed').notNull(),
  partsReplaced: jsonb('parts_replaced'),
  recommendations: text('recommendations'),

  // Technician info
  technicianId: uuid('technician_id').references(() => users.id),
  technicianName: varchar('technician_name', { length: 200 }),

  // Costing
  laborCost: varchar('labor_cost', { length: 20 }),
  partsCost: varchar('parts_cost', { length: 20 }),
  totalCost: varchar('total_cost', { length: 20 }),
  invoiceNumber: varchar('invoice_number', { length: 50 }),

  // Next service
  nextServiceDue: timestamp('next_service_due', { withTimezone: true }),
  nextServiceOdometer: varchar('next_service_odometer', { length: 20 }),

  // Documents
  documents: jsonb('documents'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_service_history_dealer').on(table.dealerId),
  customerIdx: index('idx_service_history_customer').on(table.customerId),
  vehicleIdx: index('idx_service_history_vehicle').on(table.vehicleId),
  serviceDateIdx: index('idx_service_history_date').on(table.serviceDate),
}));

// ============================================================================
// SERVICE SLOTS (Available time slots for booking)
// ============================================================================

export const serviceSlots = pgTable('service_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  // Day and time
  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(), // monday, tuesday, etc.
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(),

  // Capacity
  maxAppointments: varchar('max_appointments', { length: 5 }).default('3').notNull(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_service_slots_dealer').on(table.dealerId),
  dayIdx: index('idx_service_slots_day').on(table.dayOfWeek),
}));

// ============================================================================
// SERVICE BLOCKED DATES (Holidays, closures)
// ============================================================================

export const serviceBlockedDates = pgTable('service_blocked_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  blockedDate: timestamp('blocked_date', { withTimezone: true }).notNull(),
  reason: varchar('reason', { length: 200 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_service_blocked_dates_dealer').on(table.dealerId),
  dateIdx: index('idx_service_blocked_dates_date').on(table.blockedDate),
}));

// ============================================================================
// ADDITIONAL RELATIONS
// ============================================================================

export const customersRelations = relations(customers, ({ one, many }) => ({
  dealer: one(dealers, {
    fields: [customers.dealerId],
    references: [dealers.id],
  }),
  vehicles: many(customerVehicles),
  appointments: many(serviceAppointments),
  serviceHistory: many(serviceHistory),
}));

export const customerVehiclesRelations = relations(customerVehicles, ({ one, many }) => ({
  dealer: one(dealers, {
    fields: [customerVehicles.dealerId],
    references: [dealers.id],
  }),
  customer: one(customers, {
    fields: [customerVehicles.customerId],
    references: [customers.id],
  }),
  appointments: many(serviceAppointments),
  serviceHistory: many(serviceHistory),
}));

export const serviceAppointmentsRelations = relations(serviceAppointments, ({ one }) => ({
  dealer: one(dealers, {
    fields: [serviceAppointments.dealerId],
    references: [dealers.id],
  }),
  customer: one(customers, {
    fields: [serviceAppointments.customerId],
    references: [customers.id],
  }),
  vehicle: one(customerVehicles, {
    fields: [serviceAppointments.vehicleId],
    references: [customerVehicles.id],
  }),
  enquiry: one(enquiries, {
    fields: [serviceAppointments.enquiryId],
    references: [enquiries.id],
  }),
  technician: one(users, {
    fields: [serviceAppointments.assignedTechnicianId],
    references: [users.id],
  }),
  serviceAdvisor: one(users, {
    fields: [serviceAppointments.assignedServiceAdvisorId],
    references: [users.id],
  }),
}));

export const serviceHistoryRelations = relations(serviceHistory, ({ one }) => ({
  dealer: one(dealers, {
    fields: [serviceHistory.dealerId],
    references: [dealers.id],
  }),
  appointment: one(serviceAppointments, {
    fields: [serviceHistory.appointmentId],
    references: [serviceAppointments.id],
  }),
  customer: one(customers, {
    fields: [serviceHistory.customerId],
    references: [customers.id],
  }),
  vehicle: one(customerVehicles, {
    fields: [serviceHistory.vehicleId],
    references: [customerVehicles.id],
  }),
  technician: one(users, {
    fields: [serviceHistory.technicianId],
    references: [users.id],
  }),
}));

export const serviceSlotsRelations = relations(serviceSlots, ({ one }) => ({
  dealer: one(dealers, {
    fields: [serviceSlots.dealerId],
    references: [dealers.id],
  }),
}));

export const serviceBlockedDatesRelations = relations(serviceBlockedDates, ({ one }) => ({
  dealer: one(dealers, {
    fields: [serviceBlockedDates.dealerId],
    references: [dealers.id],
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

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type CustomerVehicle = typeof customerVehicles.$inferSelect;
export type NewCustomerVehicle = typeof customerVehicles.$inferInsert;

export type ServiceAppointment = typeof serviceAppointments.$inferSelect;
export type NewServiceAppointment = typeof serviceAppointments.$inferInsert;

export type ServiceHistory = typeof serviceHistory.$inferSelect;
export type NewServiceHistory = typeof serviceHistory.$inferInsert;

export type ServiceSlot = typeof serviceSlots.$inferSelect;
export type NewServiceSlot = typeof serviceSlots.$inferInsert;

export type ServiceBlockedDate = typeof serviceBlockedDates.$inferSelect;
export type NewServiceBlockedDate = typeof serviceBlockedDates.$inferInsert;

// ============================================================================
// CUSTOMER RETENTION PROFILES (CRM/Retention tracking)
// ============================================================================

export const customerRetentionProfiles = pgTable('customer_retention_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),

  // Lifecycle Stage
  lifecycleStage: varchar('lifecycle_stage', { length: 30 }).default('prospect').notNull(),
  // prospect, lead, test_drive, negotiating, purchased, service_customer, at_risk, inactive, lost

  // Engagement & Risk Scoring
  riskScore: varchar('risk_score', { length: 5 }).default('0'), // 0-100
  riskLevel: varchar('risk_level', { length: 20 }).default('low'), // low, medium, high, critical
  engagementScore: varchar('engagement_score', { length: 5 }).default('50'), // 0-100
  lastEngagementDate: timestamp('last_engagement_date', { withTimezone: true }),
  lastContactDate: timestamp('last_contact_date', { withTimezone: true }),
  daysSinceContact: varchar('days_since_contact', { length: 10 }),

  // Value Metrics
  estimatedLifetimeValue: varchar('estimated_lifetime_value', { length: 20 }),
  totalPurchaseValue: varchar('total_purchase_value', { length: 20 }),
  totalServiceValue: varchar('total_service_value', { length: 20 }),

  // Vehicle Interest (for prospects/leads)
  vehicleInterests: jsonb('vehicle_interests').default([]),
  // [{ model: 'Tucson', trim: 'Highlander', color: 'White', addedAt: timestamp }]
  estimatedBudget: varchar('estimated_budget', { length: 20 }),
  purchaseTimeline: varchar('purchase_timeline', { length: 30 }),
  // immediate, within_30_days, within_90_days, within_6_months, exploring
  financePreference: varchar('finance_preference', { length: 20 }),
  // cash, finance, lease, undecided

  // Communication Preferences
  preferredContactMethod: varchar('preferred_contact_method', { length: 20 }).default('email'),
  // email, phone, sms
  doNotCall: boolean('do_not_call').default(false),
  doNotEmail: boolean('do_not_email').default(false),
  doNotSms: boolean('do_not_sms').default(false),
  marketingConsent: boolean('marketing_consent').default(true),
  consentObtainedDate: timestamp('consent_obtained_date', { withTimezone: true }),

  // Retention Actions
  lastRetentionAction: varchar('last_retention_action', { length: 100 }),
  lastRetentionActionDate: timestamp('last_retention_action_date', { withTimezone: true }),
  retentionStrategy: varchar('retention_strategy', { length: 50 }),
  // loyalty, win_back, service_reminder, trade_in, referral

  // Tags for segmentation
  tags: jsonb('tags').default([]),
  // ['vip', 'fleet', 'repeat-buyer', 'service-only']

  // Notes
  notes: text('notes'),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_retention_profiles_dealer').on(table.dealerId),
  customerIdx: uniqueIndex('idx_retention_profiles_customer').on(table.customerId),
  riskLevelIdx: index('idx_retention_profiles_risk_level').on(table.riskLevel),
  lifecycleIdx: index('idx_retention_profiles_lifecycle').on(table.lifecycleStage),
}));

// ============================================================================
// CUSTOMER TASKS (Follow-ups, reminders, to-dos)
// ============================================================================

export const customerTasks = pgTable('customer_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  // Linked records (at least one should be set)
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'cascade' }),

  // Task details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  taskType: varchar('task_type', { length: 50 }).default('follow_up').notNull(),
  // follow_up, call, email, sms, meeting, service_reminder, trade_in_offer, other
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  // low, normal, high, urgent

  // Scheduling
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  dueTime: varchar('due_time', { length: 10 }), // HH:MM format
  reminderDate: timestamp('reminder_date', { withTimezone: true }),

  // Assignment
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),

  // Status
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  // pending, in_progress, completed, cancelled, overdue

  // Completion
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: uuid('completed_by').references(() => users.id),
  completionNotes: text('completion_notes'),

  // Outcome tracking (for follow-ups)
  outcome: varchar('outcome', { length: 50 }),
  // contacted, left_voicemail, no_answer, not_interested, scheduled_appointment, sale_made

  // Recurrence (for automated tasks)
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: varchar('recurrence_pattern', { length: 50 }),
  // daily, weekly, monthly, quarterly, annually
  nextRecurrenceDate: timestamp('next_recurrence_date', { withTimezone: true }),

  // Automation source
  isAutoGenerated: boolean('is_auto_generated').default(false),
  automationRule: varchar('automation_rule', { length: 100 }),
  // service_reminder_60d, no_contact_30d, post_purchase_7d, birthday

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_customer_tasks_dealer').on(table.dealerId),
  customerIdx: index('idx_customer_tasks_customer').on(table.customerId),
  enquiryIdx: index('idx_customer_tasks_enquiry').on(table.enquiryId),
  assignedIdx: index('idx_customer_tasks_assigned').on(table.assignedTo),
  dueDateIdx: index('idx_customer_tasks_due_date').on(table.dueDate),
  statusIdx: index('idx_customer_tasks_status').on(table.status),
  dealerStatusDueIdx: index('idx_customer_tasks_dealer_status_due').on(table.dealerId, table.status, table.dueDate),
}));

// ============================================================================
// CUSTOMER ACTIVITIES (Unified activity/communication log)
// ============================================================================

export const customerActivities = pgTable('customer_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  // Linked records
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => customerTasks.id, { onDelete: 'set null' }),

  // Activity details
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  // email_sent, email_received, call_outbound, call_inbound, sms_sent, sms_received,
  // meeting, note, status_change, task_completed, form_submission, service_completed,
  // purchase, vehicle_added, document_uploaded
  activityDate: timestamp('activity_date', { withTimezone: true }).defaultNow().notNull(),

  // Content
  subject: varchar('subject', { length: 255 }),
  description: text('description'),
  notes: text('notes'),

  // For calls
  callDuration: varchar('call_duration', { length: 20 }), // in minutes or HH:MM:SS
  callOutcome: varchar('call_outcome', { length: 50 }),
  // connected, voicemail, no_answer, busy, wrong_number

  // For emails (link to email log)
  emailLogId: uuid('email_log_id').references(() => emailLogs.id),

  // For status changes
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),

  // Attribution
  createdBy: uuid('created_by').references(() => users.id),
  isSystemGenerated: boolean('is_system_generated').default(false),

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_customer_activities_dealer').on(table.dealerId),
  customerIdx: index('idx_customer_activities_customer').on(table.customerId),
  enquiryIdx: index('idx_customer_activities_enquiry').on(table.enquiryId),
  activityDateIdx: index('idx_customer_activities_date').on(table.activityDate),
  activityTypeIdx: index('idx_customer_activities_type').on(table.activityType),
  dealerCustomerDateIdx: index('idx_customer_activities_dealer_customer_date').on(table.dealerId, table.customerId, table.activityDate),
}));

// ============================================================================
// RETENTION CAMPAIGNS (For bulk outreach)
// ============================================================================

export const retentionCampaigns = pgTable('retention_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),

  // Campaign details
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  campaignType: varchar('campaign_type', { length: 50 }).notNull(),
  // email, sms, multi_channel, service_reminder, trade_in, loyalty, win_back

  // Targeting
  targetSegment: jsonb('target_segment').default({}),
  // { lifecycleStage: ['at_risk'], riskLevel: ['high'], daysSinceContact: { min: 30 } }
  targetCount: varchar('target_count', { length: 10 }),

  // Content
  subject: varchar('subject', { length: 255 }),
  messageTemplate: text('message_template'),
  emailTemplateId: varchar('email_template_id', { length: 100 }),

  // Scheduling
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),

  // Status
  status: varchar('status', { length: 30 }).default('draft').notNull(),
  // draft, scheduled, in_progress, completed, paused, cancelled

  // Metrics
  sentCount: varchar('sent_count', { length: 10 }).default('0'),
  deliveredCount: varchar('delivered_count', { length: 10 }).default('0'),
  openedCount: varchar('opened_count', { length: 10 }).default('0'),
  clickedCount: varchar('clicked_count', { length: 10 }).default('0'),
  respondedCount: varchar('responded_count', { length: 10 }).default('0'),
  convertedCount: varchar('converted_count', { length: 10 }).default('0'),

  // Attribution
  createdBy: uuid('created_by').references(() => users.id),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index('idx_retention_campaigns_dealer').on(table.dealerId),
  statusIdx: index('idx_retention_campaigns_status').on(table.status),
}));

// ============================================================================
// RETENTION RELATIONS
// ============================================================================

export const customerRetentionProfilesRelations = relations(customerRetentionProfiles, ({ one }) => ({
  dealer: one(dealers, {
    fields: [customerRetentionProfiles.dealerId],
    references: [dealers.id],
  }),
  customer: one(customers, {
    fields: [customerRetentionProfiles.customerId],
    references: [customers.id],
  }),
}));

export const customerTasksRelations = relations(customerTasks, ({ one }) => ({
  dealer: one(dealers, {
    fields: [customerTasks.dealerId],
    references: [dealers.id],
  }),
  customer: one(customers, {
    fields: [customerTasks.customerId],
    references: [customers.id],
  }),
  enquiry: one(enquiries, {
    fields: [customerTasks.enquiryId],
    references: [enquiries.id],
  }),
  assignedUser: one(users, {
    fields: [customerTasks.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [customerTasks.createdBy],
    references: [users.id],
  }),
  completer: one(users, {
    fields: [customerTasks.completedBy],
    references: [users.id],
  }),
}));

export const customerActivitiesRelations = relations(customerActivities, ({ one }) => ({
  dealer: one(dealers, {
    fields: [customerActivities.dealerId],
    references: [dealers.id],
  }),
  customer: one(customers, {
    fields: [customerActivities.customerId],
    references: [customers.id],
  }),
  enquiry: one(enquiries, {
    fields: [customerActivities.enquiryId],
    references: [enquiries.id],
  }),
  task: one(customerTasks, {
    fields: [customerActivities.taskId],
    references: [customerTasks.id],
  }),
  emailLog: one(emailLogs, {
    fields: [customerActivities.emailLogId],
    references: [emailLogs.id],
  }),
  creator: one(users, {
    fields: [customerActivities.createdBy],
    references: [users.id],
  }),
}));

export const retentionCampaignsRelations = relations(retentionCampaigns, ({ one }) => ({
  dealer: one(dealers, {
    fields: [retentionCampaigns.dealerId],
    references: [dealers.id],
  }),
  creator: one(users, {
    fields: [retentionCampaigns.createdBy],
    references: [users.id],
  }),
}));

// ============================================================================
// RETENTION TYPE EXPORTS
// ============================================================================

export type CustomerRetentionProfile = typeof customerRetentionProfiles.$inferSelect;
export type NewCustomerRetentionProfile = typeof customerRetentionProfiles.$inferInsert;

export type CustomerTask = typeof customerTasks.$inferSelect;
export type NewCustomerTask = typeof customerTasks.$inferInsert;

export type CustomerActivity = typeof customerActivities.$inferSelect;
export type NewCustomerActivity = typeof customerActivities.$inferInsert;

export type RetentionCampaign = typeof retentionCampaigns.$inferSelect;
export type NewRetentionCampaign = typeof retentionCampaigns.$inferInsert;

// ============================================================================
// MARKETING PLATFORM METRICS (GA4 / Meta Ads / Google Ads daily sync)
// ============================================================================

export const marketingMetricsDaily = pgTable('marketing_metrics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 20 }).notNull(),
  date: date('date').notNull(),
  campaignId: varchar('campaign_id', { length: 100 }).notNull().default(''),
  campaignName: varchar('campaign_name', { length: 255 }),
  spend: numeric('spend', { precision: 12, scale: 2 }),
  impressions: integer('impressions'),
  clicks: integer('clicks'),
  platformLeads: integer('platform_leads'),
  sessions: integer('sessions'),
  users: integer('users'),
  conversions: integer('conversions'),
  raw: jsonb('raw'),
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  metricsUniq: uniqueIndex('marketing_metrics_daily_uniq').on(t.dealerId, t.platform, t.date, t.campaignId),
  metricsDealeDate: index('marketing_metrics_daily_dealer_date').on(t.dealerId, t.date),
}));

export const marketingSyncRuns = pgTable('marketing_sync_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 20 }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('running'),
  error: text('error'),
  rowsUpserted: integer('rows_upserted'),
}, (t) => ({
  syncRunsDealerPlatform: index('marketing_sync_runs_dealer_platform').on(t.dealerId, t.platform, t.startedAt),
  oneRunning: uniqueIndex('marketing_sync_runs_one_running').on(t.dealerId, t.platform).where(sql`status = 'running'`),
}));

export type MarketingMetricsDaily = typeof marketingMetricsDaily.$inferSelect;
export type NewMarketingMetricsDaily = typeof marketingMetricsDaily.$inferInsert;

export type MarketingSyncRuns = typeof marketingSyncRuns.$inferSelect;
export type NewMarketingSyncRuns = typeof marketingSyncRuns.$inferInsert;









