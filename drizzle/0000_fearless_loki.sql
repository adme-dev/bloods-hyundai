CREATE TABLE "customer_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"customer_id" uuid,
	"enquiry_id" uuid,
	"task_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"activity_date" timestamp with time zone DEFAULT now() NOT NULL,
	"subject" varchar(255),
	"description" text,
	"notes" text,
	"call_duration" varchar(20),
	"call_outcome" varchar(50),
	"email_log_id" uuid,
	"old_value" jsonb,
	"new_value" jsonb,
	"created_by" uuid,
	"is_system_generated" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_retention_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"lifecycle_stage" varchar(30) DEFAULT 'prospect' NOT NULL,
	"risk_score" varchar(5) DEFAULT '0',
	"risk_level" varchar(20) DEFAULT 'low',
	"engagement_score" varchar(5) DEFAULT '50',
	"last_engagement_date" timestamp with time zone,
	"last_contact_date" timestamp with time zone,
	"days_since_contact" varchar(10),
	"estimated_lifetime_value" varchar(20),
	"total_purchase_value" varchar(20),
	"total_service_value" varchar(20),
	"vehicle_interests" jsonb DEFAULT '[]'::jsonb,
	"estimated_budget" varchar(20),
	"purchase_timeline" varchar(30),
	"finance_preference" varchar(20),
	"preferred_contact_method" varchar(20) DEFAULT 'email',
	"do_not_call" boolean DEFAULT false,
	"do_not_email" boolean DEFAULT false,
	"do_not_sms" boolean DEFAULT false,
	"marketing_consent" boolean DEFAULT true,
	"consent_obtained_date" timestamp with time zone,
	"last_retention_action" varchar(100),
	"last_retention_action_date" timestamp with time zone,
	"retention_strategy" varchar(50),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"customer_id" uuid,
	"enquiry_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"task_type" varchar(50) DEFAULT 'follow_up' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"due_time" varchar(10),
	"reminder_date" timestamp with time zone,
	"assigned_to" uuid,
	"created_by" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"completion_notes" text,
	"outcome" varchar(50),
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" varchar(50),
	"next_recurrence_date" timestamp with time zone,
	"is_auto_generated" boolean DEFAULT false,
	"automation_rule" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"customer_id" uuid,
	"make" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"year" varchar(4),
	"registration" varchar(20),
	"vin" varchar(20),
	"color" varchar(50),
	"engine_type" varchar(50),
	"transmission" varchar(50),
	"current_odometer" varchar(20),
	"last_service_date" timestamp with time zone,
	"next_service_due" timestamp with time zone,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"suburb" varchar(100),
	"state" varchar(20),
	"postcode" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(100),
	"reset_token" varchar(100),
	"reset_token_expiry" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dealer_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dealer_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dealers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"api_key" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"address" text,
	"suburb" varchar(100),
	"state" varchar(20),
	"postcode" varchar(10),
	"logo_url" varchar(500),
	"primary_color" varchar(7),
	"website_url" varchar(255),
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"routing_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"email_settings" jsonb DEFAULT '{"notification_emails":[],"send_customer_confirmation":true,"send_daily_summary":true,"daily_summary_time":"07:00","daily_summary_timezone":"Australia/Melbourne","custom_sender_email":null,"custom_sender_name":null}'::jsonb NOT NULL,
	"oem" varchar(50),
	"dealer_group_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"subscription_tier" varchar(30) DEFAULT 'standard' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dealers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "dealers_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid,
	"template_id" varchar(100) NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_type" varchar(30),
	"subject" varchar(255),
	"sendgrid_message_id" varchar(100),
	"status" varchar(30) DEFAULT 'sent' NOT NULL,
	"enquiry_id" uuid,
	"user_id" uuid,
	"template_data" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"source" varchar(255),
	"department" varchar(50),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"postcode" varchar(10),
	"suburb" varchar(100),
	"state" varchar(20),
	"message" text,
	"test_drive" boolean DEFAULT false,
	"finance_interest" boolean DEFAULT false,
	"vehicle_stock_id" varchar(50),
	"vehicle_info" jsonb,
	"trade_in_info" jsonb,
	"finance_details" jsonb,
	"sell_car_details" jsonb,
	"accessories_cart" jsonb,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"contacted_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"external_ref" varchar(100),
	"synced_to_crm" boolean DEFAULT false NOT NULL,
	"crm_ref" varchar(100),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "enquiry_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"enquiry_id" uuid,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50),
	"old_value" jsonb,
	"new_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiry_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"user_id" uuid,
	"content" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"campaign_type" varchar(50) NOT NULL,
	"target_segment" jsonb DEFAULT '{}'::jsonb,
	"target_count" varchar(10),
	"subject" varchar(255),
	"message_template" text,
	"email_template_id" varchar(100),
	"scheduled_date" timestamp with time zone,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"sent_count" varchar(10) DEFAULT '0',
	"delivered_count" varchar(10) DEFAULT '0',
	"opened_count" varchar(10) DEFAULT '0',
	"clicked_count" varchar(10) DEFAULT '0',
	"responded_count" varchar(10) DEFAULT '0',
	"converted_count" varchar(10) DEFAULT '0',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"customer_id" uuid,
	"vehicle_id" uuid,
	"enquiry_id" uuid,
	"customer_first_name" varchar(100) NOT NULL,
	"customer_last_name" varchar(100) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(20),
	"vehicle_make" varchar(100) NOT NULL,
	"vehicle_model" varchar(100) NOT NULL,
	"vehicle_year" varchar(4),
	"vehicle_registration" varchar(20),
	"vehicle_vin" varchar(20),
	"vehicle_odometer" varchar(20),
	"scheduled_date" timestamp with time zone NOT NULL,
	"scheduled_time" varchar(10),
	"estimated_duration" varchar(50),
	"drop_off_date" timestamp with time zone,
	"drop_off_time" varchar(10),
	"pick_up_date" timestamp with time zone,
	"pick_up_time" varchar(10),
	"actual_drop_off" timestamp with time zone,
	"actual_pick_up" timestamp with time zone,
	"service_type" varchar(100) NOT NULL,
	"service_description" text,
	"customer_notes" text,
	"internal_notes" text,
	"is_scheduled_service" boolean DEFAULT false,
	"is_previously_serviced" boolean DEFAULT false,
	"has_other_repairs" boolean DEFAULT false,
	"requires_loan_car" boolean DEFAULT false,
	"loan_car_provided" boolean DEFAULT false,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"assigned_technician_id" uuid,
	"assigned_service_advisor_id" uuid,
	"estimated_cost" varchar(20),
	"actual_cost" varchar(20),
	"quote_sent" boolean DEFAULT false,
	"quote_approved" boolean DEFAULT false,
	"invoice_number" varchar(50),
	"completed_at" timestamp with time zone,
	"completed_odometer" varchar(20),
	"work_performed" text,
	"parts_used" jsonb,
	"reminder_sent" boolean DEFAULT false,
	"confirmation_sent" boolean DEFAULT false,
	"completion_notified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_blocked_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"blocked_date" timestamp with time zone NOT NULL,
	"reason" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"appointment_id" uuid,
	"customer_id" uuid,
	"vehicle_id" uuid,
	"service_date" timestamp with time zone NOT NULL,
	"service_type" varchar(100) NOT NULL,
	"odometer_reading" varchar(20),
	"work_performed" text NOT NULL,
	"parts_replaced" jsonb,
	"recommendations" text,
	"technician_id" uuid,
	"technician_name" varchar(200),
	"labor_cost" varchar(20),
	"parts_cost" varchar(20),
	"total_cost" varchar(20),
	"invoice_number" varchar(50),
	"next_service_due" timestamp with time zone,
	"next_service_odometer" varchar(20),
	"documents" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"day_of_week" varchar(10) NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"max_appointments" varchar(5) DEFAULT '3' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"avatar_url" varchar(500),
	"role" varchar(30) DEFAULT 'staff' NOT NULL,
	"department" varchar(50),
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'invited' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"invitation_token" varchar(100),
	"invitation_token_expiry" timestamp with time zone,
	"invited_at" timestamp with time zone,
	"invited_by" uuid,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_task_id_customer_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."customer_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_email_log_id_email_logs_id_fk" FOREIGN KEY ("email_log_id") REFERENCES "public"."email_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_retention_profiles" ADD CONSTRAINT "customer_retention_profiles_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_retention_profiles" ADD CONSTRAINT "customer_retention_profiles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_dealer_group_id_dealer_groups_id_fk" FOREIGN KEY ("dealer_group_id") REFERENCES "public"."dealer_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_activity_log" ADD CONSTRAINT "enquiry_activity_log_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_activity_log" ADD CONSTRAINT "enquiry_activity_log_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_activity_log" ADD CONSTRAINT "enquiry_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_campaigns" ADD CONSTRAINT "retention_campaigns_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_campaigns" ADD CONSTRAINT "retention_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_vehicle_id_customer_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."customer_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_assigned_technician_id_users_id_fk" FOREIGN KEY ("assigned_technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_assigned_service_advisor_id_users_id_fk" FOREIGN KEY ("assigned_service_advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_blocked_dates" ADD CONSTRAINT "service_blocked_dates_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_appointment_id_service_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."service_appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_vehicle_id_customer_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."customer_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_slots" ADD CONSTRAINT "service_slots_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customer_activities_dealer" ON "customer_activities" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_activities_customer" ON "customer_activities" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_activities_enquiry" ON "customer_activities" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "idx_customer_activities_date" ON "customer_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "idx_customer_activities_type" ON "customer_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_customer_activities_dealer_customer_date" ON "customer_activities" USING btree ("dealer_id","customer_id","activity_date");--> statement-breakpoint
CREATE INDEX "idx_retention_profiles_dealer" ON "customer_retention_profiles" USING btree ("dealer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_retention_profiles_customer" ON "customer_retention_profiles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_retention_profiles_risk_level" ON "customer_retention_profiles" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_retention_profiles_lifecycle" ON "customer_retention_profiles" USING btree ("lifecycle_stage");--> statement-breakpoint
CREATE INDEX "idx_customer_tasks_dealer" ON "customer_tasks" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tasks_customer" ON "customer_tasks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tasks_enquiry" ON "customer_tasks" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tasks_assigned" ON "customer_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_customer_tasks_due_date" ON "customer_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_customer_tasks_status" ON "customer_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_customer_tasks_dealer_status_due" ON "customer_tasks" USING btree ("dealer_id","status","due_date");--> statement-breakpoint
CREATE INDEX "idx_customer_vehicles_dealer" ON "customer_vehicles" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_vehicles_customer" ON "customer_vehicles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_vehicles_rego" ON "customer_vehicles" USING btree ("registration");--> statement-breakpoint
CREATE INDEX "idx_customers_dealer" ON "customers" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_dealer_id_email_key" ON "customers" USING btree ("dealer_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dealers_api_key" ON "dealers" USING btree ("api_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dealers_slug" ON "dealers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_email_logs_dealer" ON "email_logs" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_email_logs_enquiry" ON "email_logs" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "idx_enquiries_dealer" ON "enquiries" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_enquiries_dealer_status" ON "enquiries" USING btree ("dealer_id","status");--> statement-breakpoint
CREATE INDEX "idx_enquiries_dealer_type" ON "enquiries" USING btree ("dealer_id","type");--> statement-breakpoint
CREATE INDEX "idx_enquiries_dealer_created" ON "enquiries" USING btree ("dealer_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_enquiries_assigned" ON "enquiries" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_enquiries_email" ON "enquiries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_activity_dealer" ON "enquiry_activity_log" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_activity_enquiry" ON "enquiry_activity_log" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "idx_notes_enquiry" ON "enquiry_notes" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "idx_retention_campaigns_dealer" ON "retention_campaigns" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_retention_campaigns_status" ON "retention_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_dealer" ON "service_appointments" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_customer" ON "service_appointments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_vehicle" ON "service_appointments" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_scheduled" ON "service_appointments" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_status" ON "service_appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_technician" ON "service_appointments" USING btree ("assigned_technician_id");--> statement-breakpoint
CREATE INDEX "idx_service_blocked_dates_dealer" ON "service_blocked_dates" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_service_blocked_dates_date" ON "service_blocked_dates" USING btree ("blocked_date");--> statement-breakpoint
CREATE INDEX "idx_service_history_dealer" ON "service_history" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_service_history_customer" ON "service_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_service_history_vehicle" ON "service_history" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_service_history_date" ON "service_history" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "idx_service_slots_dealer" ON "service_slots" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_service_slots_day" ON "service_slots" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "idx_users_dealer" ON "users" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_invitation_token" ON "users" USING btree ("invitation_token");--> statement-breakpoint
CREATE UNIQUE INDEX "users_dealer_id_email_key" ON "users" USING btree ("dealer_id","email");