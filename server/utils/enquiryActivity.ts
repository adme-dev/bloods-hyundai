import type { db } from './db';
import { enquiryActivityLog } from '../database/schema';

export interface EnquiryActivityInput {
  dealerId: string;
  enquiryId: string;
  userId: string | null;
  action: string;
  entityType?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Build the row for an enquiry_activity_log insert. `dealerId` is a required
 * field of the input type, so no caller can omit it (enquiry_activity_log.dealer_id
 * is NOT NULL). Optional fields normalize to null.
 */
export function buildEnquiryActivityRow(input: EnquiryActivityInput) {
  return {
    dealerId: input.dealerId,
    enquiryId: input.enquiryId,
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType ?? null,
    oldValue: (input.oldValue ?? null) as any,
    newValue: (input.newValue ?? null) as any,
  };
}

/**
 * Insert an enquiry activity-log entry. Pass a transaction client as `tx` to
 * make the log write atomic with the change it records.
 */
export async function logEnquiryActivity(input: EnquiryActivityInput, tx?: typeof db) {
  const client = tx ?? (await import('./db')).db;
  await client.insert(enquiryActivityLog).values(buildEnquiryActivityRow(input));
}
