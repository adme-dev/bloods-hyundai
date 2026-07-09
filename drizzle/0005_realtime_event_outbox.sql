CREATE TABLE IF NOT EXISTS "realtime_event_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "dealer_id" uuid NOT NULL,
  "event_type" varchar(80) NOT NULL,
  "aggregate_type" varchar(50) NOT NULL,
  "aggregate_id" uuid,
  "payload" jsonb NOT NULL,
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "realtime_event_outbox"
    ADD CONSTRAINT "realtime_event_outbox_dealer_id_dealers_id_fk"
    FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_realtime_outbox_dealer_created_desc" ON "realtime_event_outbox" ("dealer_id","created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_realtime_outbox_status_created" ON "realtime_event_outbox" ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_realtime_outbox_aggregate" ON "realtime_event_outbox" ("aggregate_type","aggregate_id");
