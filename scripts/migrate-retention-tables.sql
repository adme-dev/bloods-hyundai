-- Migration script to create missing retention system tables
-- Run with: psql $NEON_DATABASE_URL -f scripts/migrate-retention-tables.sql

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS "customers" (
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

-- Create customer_retention_profiles table if not exists
CREATE TABLE IF NOT EXISTS "customer_retention_profiles" (
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

-- Create customer_tasks table if not exists
CREATE TABLE IF NOT EXISTS "customer_tasks" (
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

-- Create customer_activities table if not exists
CREATE TABLE IF NOT EXISTS "customer_activities" (
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

-- Create retention_campaigns table if not exists
CREATE TABLE IF NOT EXISTS "retention_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"campaign_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"target_lifecycle_stages" jsonb DEFAULT '[]'::jsonb,
	"target_risk_levels" jsonb DEFAULT '[]'::jsonb,
	"target_engagement_score_min" varchar(5),
	"target_engagement_score_max" varchar(5),
	"target_vehicle_interests" jsonb DEFAULT '[]'::jsonb,
	"message_template" text,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"total_recipients" varchar(10) DEFAULT '0',
	"sent_count" varchar(10) DEFAULT '0',
	"open_count" varchar(10) DEFAULT '0',
	"click_count" varchar(10) DEFAULT '0',
	"conversion_count" varchar(10) DEFAULT '0',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_customers_dealer_id" ON "customers" ("dealer_id");
CREATE INDEX IF NOT EXISTS "idx_customers_email" ON "customers" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_customers_dealer_email" ON "customers" ("dealer_id", "email");

CREATE INDEX IF NOT EXISTS "idx_retention_profiles_dealer_id" ON "customer_retention_profiles" ("dealer_id");
CREATE INDEX IF NOT EXISTS "idx_retention_profiles_customer_id" ON "customer_retention_profiles" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_retention_profiles_risk_level" ON "customer_retention_profiles" ("risk_level");
CREATE INDEX IF NOT EXISTS "idx_retention_profiles_lifecycle" ON "customer_retention_profiles" ("lifecycle_stage");

CREATE INDEX IF NOT EXISTS "idx_tasks_dealer_id" ON "customer_tasks" ("dealer_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_customer_id" ON "customer_tasks" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_assigned_to" ON "customer_tasks" ("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_tasks_due_date" ON "customer_tasks" ("due_date");
CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "customer_tasks" ("status");
CREATE INDEX IF NOT EXISTS "idx_tasks_dealer_status" ON "customer_tasks" ("dealer_id", "status");
CREATE INDEX IF NOT EXISTS "idx_tasks_dealer_due" ON "customer_tasks" ("dealer_id", "due_date");

CREATE INDEX IF NOT EXISTS "idx_activities_dealer_id" ON "customer_activities" ("dealer_id");
CREATE INDEX IF NOT EXISTS "idx_activities_customer_id" ON "customer_activities" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_activities_enquiry_id" ON "customer_activities" ("enquiry_id");
CREATE INDEX IF NOT EXISTS "idx_activities_activity_date" ON "customer_activities" ("activity_date");
CREATE INDEX IF NOT EXISTS "idx_activities_dealer_date" ON "customer_activities" ("dealer_id", "activity_date");
CREATE INDEX IF NOT EXISTS "idx_activities_dealer_type" ON "customer_activities" ("dealer_id", "activity_type");

CREATE INDEX IF NOT EXISTS "idx_campaigns_dealer_id" ON "retention_campaigns" ("dealer_id");
CREATE INDEX IF NOT EXISTS "idx_campaigns_status" ON "retention_campaigns" ("status");

-- Add foreign key constraints (only if tables exist)
DO $$
BEGIN
    -- customers -> dealers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_dealer_id_dealers_id_fk') THEN
        ALTER TABLE "customers" ADD CONSTRAINT "customers_dealer_id_dealers_id_fk"
        FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE;
    END IF;

    -- customer_retention_profiles -> dealers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_retention_profiles_dealer_id_dealers_id_fk') THEN
        ALTER TABLE "customer_retention_profiles" ADD CONSTRAINT "customer_retention_profiles_dealer_id_dealers_id_fk"
        FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE;
    END IF;

    -- customer_retention_profiles -> customers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_retention_profiles_customer_id_customers_id_fk') THEN
        ALTER TABLE "customer_retention_profiles" ADD CONSTRAINT "customer_retention_profiles_customer_id_customers_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
    END IF;

    -- customer_tasks -> dealers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_tasks_dealer_id_dealers_id_fk') THEN
        ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_dealer_id_dealers_id_fk"
        FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE;
    END IF;

    -- customer_tasks -> customers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_tasks_customer_id_customers_id_fk') THEN
        ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_customer_id_customers_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;
    END IF;

    -- customer_tasks -> enquiries
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_tasks_enquiry_id_enquiries_id_fk') THEN
        ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_enquiry_id_enquiries_id_fk"
        FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE SET NULL;
    END IF;

    -- customer_tasks -> users (assigned_to)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_tasks_assigned_to_users_id_fk') THEN
        ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_assigned_to_users_id_fk"
        FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;

    -- customer_tasks -> users (created_by)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_tasks_created_by_users_id_fk') THEN
        ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_created_by_users_id_fk"
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;

    -- customer_tasks -> users (completed_by)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_tasks_completed_by_users_id_fk') THEN
        ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_completed_by_users_id_fk"
        FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;

    -- customer_activities -> dealers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_activities_dealer_id_dealers_id_fk') THEN
        ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_dealer_id_dealers_id_fk"
        FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE;
    END IF;

    -- customer_activities -> customers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_activities_customer_id_customers_id_fk') THEN
        ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_customer_id_customers_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;
    END IF;

    -- customer_activities -> enquiries
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_activities_enquiry_id_enquiries_id_fk') THEN
        ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_enquiry_id_enquiries_id_fk"
        FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE SET NULL;
    END IF;

    -- customer_activities -> customer_tasks
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_activities_task_id_customer_tasks_id_fk') THEN
        ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_task_id_customer_tasks_id_fk"
        FOREIGN KEY ("task_id") REFERENCES "customer_tasks"("id") ON DELETE SET NULL;
    END IF;

    -- customer_activities -> users (created_by)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_activities_created_by_users_id_fk') THEN
        ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_created_by_users_id_fk"
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;

    -- customer_activities -> email_logs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_activities_email_log_id_email_logs_id_fk') THEN
        ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_email_log_id_email_logs_id_fk"
        FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE SET NULL;
    END IF;

    -- retention_campaigns -> dealers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retention_campaigns_dealer_id_dealers_id_fk') THEN
        ALTER TABLE "retention_campaigns" ADD CONSTRAINT "retention_campaigns_dealer_id_dealers_id_fk"
        FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE;
    END IF;

    -- retention_campaigns -> users (created_by)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retention_campaigns_created_by_users_id_fk') THEN
        ALTER TABLE "retention_campaigns" ADD CONSTRAINT "retention_campaigns_created_by_users_id_fk"
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Output confirmation
SELECT 'Migration completed successfully!' AS status;
