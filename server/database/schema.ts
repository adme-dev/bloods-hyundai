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


