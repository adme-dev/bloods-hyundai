import { createHmac, randomUUID } from 'node:crypto';
import type { DealerRealtimeEvent } from '~~/shared/realtime/events';

export type EnquiryRealtimeInput = {
  id: string;
  dealerId: string;
  type: string;
  firstName: string;
  lastName: string;
  email: string;
  vehicleInfo?: any;
};

export type BuildEnquiryRealtimeOptions = {
  eventId?: string;
  occurredAt?: string;
  source?: string;
};

export function buildEnquiryCreatedRealtimeEvent(
  enquiry: EnquiryRealtimeInput,
  options: BuildEnquiryRealtimeOptions = {},
): DealerRealtimeEvent {
  const customerName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || enquiry.email;
  const vehicleLabel = getVehicleLabel(enquiry.vehicleInfo);
  const labelParts = [customerName, vehicleLabel].filter(Boolean);

  return {
    version: 1,
    eventId: options.eventId || randomUUID(),
    dealerId: enquiry.dealerId,
    type: 'enquiry.created',
    occurredAt: options.occurredAt || new Date().toISOString(),
    source: options.source,
    entity: {
      type: 'enquiry',
      id: enquiry.id,
    },
    summary: {
      title: 'New enquiry',
      message: labelParts.join(' - ') || 'New enquiry received',
      enquiryType: enquiry.type,
      customerName,
      vehicleLabel,
    },
    invalidate: ['notifications', 'enquiries', 'dashboard'],
  };
}

export function signRealtimePayload(secret: string, timestamp: string, body: string) {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return `sha256=${digest}`;
}

function getVehicleLabel(vehicleInfo: any): string | undefined {
  if (!vehicleInfo || typeof vehicleInfo !== 'object') return undefined;
  return [
    vehicleInfo.year,
    vehicleInfo.make,
    vehicleInfo.model,
    vehicleInfo.variant,
  ].filter(Boolean).join(' ').trim() || undefined;
}
