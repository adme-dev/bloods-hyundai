export const DEALER_REALTIME_EVENT_VERSION = 1 as const;

export type DealerRealtimeEventType =
  | 'enquiry.created'
  | 'enquiry.updated'
  | 'dashboard.invalidate';

export type DealerRealtimeInvalidationTarget =
  | 'notifications'
  | 'enquiries'
  | 'dashboard';

export interface DealerRealtimeEvent {
  version: typeof DEALER_REALTIME_EVENT_VERSION;
  eventId: string;
  dealerId: string;
  type: DealerRealtimeEventType;
  occurredAt: string;
  source?: string;
  entity: {
    type: 'enquiry';
    id: string;
  };
  summary?: {
    title: string;
    message: string;
    enquiryType?: string;
    customerName?: string;
    vehicleLabel?: string;
  };
  invalidate?: DealerRealtimeInvalidationTarget[];
}
