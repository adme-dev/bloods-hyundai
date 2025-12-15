ALTER TABLE "enquiries" ALTER COLUMN "status" SET DEFAULT 'new_lead';--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "lost_reason" varchar(50);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "lost_notes" text;