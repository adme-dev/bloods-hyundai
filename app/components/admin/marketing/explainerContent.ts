export type ExplainerTopicKey =
  | 'unmatched-banner'
  | 'crm-leads'
  | 'ad-spend'
  | 'website-activity'
  | 'utm-coverage'
  | 'data-layer-audit'
  | 'cpl-reconciliation';

export interface ExplainerTopic {
  key: ExplainerTopicKey;
  title: string;
  measures: string;
  whyAlarming: string;
  whatGoodLooksLike: string;
  whatToCheck: string[];
}

export const explainerTopics: ExplainerTopic[] = [
  {
    key: 'unmatched-banner',
    title: 'Why "no CRM leads matched to paid media"?',
    measures:
      'This banner compares synced ad spend with CRM leads that carry paid-platform evidence — UTM tags, ad click IDs, or other recorded paid-platform signals. Spend showing here means the platform connection is working.',
    whyAlarming:
      'It reads like the spend produced nothing. Zero matches has four common, honest explanations: campaigns whose objective is awareness or traffic rather than leads; campaigns still pending or in their learning phase; tracking feeds not live yet; and leads arriving by phone or walk-in, which never carry ad tags.',
    whatGoodLooksLike:
      'For lead-generation campaigns with live tracking, most paid leads should carry platform evidence. For periods running only awareness or traffic campaigns, zero matches is expected — not a fault.',
    whatToCheck: [
      'Which campaign objectives ran this period — lead-gen, or awareness/traffic',
      'Whether campaigns were pending, in learning, or waiting on feeds during the period',
      'UTM tags and click-ID capture on every paid ad final URL',
      'Whether the period\'s leads arrived via phone, walk-in or marketplace channels that never carry tags',
    ],
  },
  {
    key: 'crm-leads',
    title: 'Admin CRM leads',
    measures:
      'Enquiries captured in this CRM during the selected period — website forms, phone, walk-in and marketplace leads — regardless of what marketing drove them.',
    whyAlarming:
      'A low count next to a visible ad spend looks like the spend "bought" only these leads. The two numbers come from different systems: spend syncs from the ad platforms, while leads are what actually reached the CRM. Awareness or traffic campaigns can spend without creating form-fill leads.',
    whatGoodLooksLike:
      'Lead volume in line with the campaigns that are genuinely lead-gen. Judge lead-gen campaigns on leads; judge awareness or traffic campaigns on reach and clicks.',
    whatToCheck: [
      'Which campaign objectives ran this period',
      'Whether the period includes days before campaigns went live',
      'Whether phone and walk-in enquiries are being logged in the CRM',
    ],
  },
  {
    key: 'ad-spend',
    title: 'Ad spend',
    measures:
      'Total spend synced from the connected ad platforms (Meta and Google) for the selected period.',
    whyAlarming:
      'Spend shows even when no leads match it, so it can read as money without results. The blended cost-per-lead beneath it divides all spend by matched leads, so it is only meaningful when lead-gen campaigns are running.',
    whatGoodLooksLike:
      'Spend you can assign to a named objective. A blended CPL judged only against lead-gen spend.',
    whatToCheck: [
      'Campaign objectives for the spend in this period',
      'Campaigns pending or in learning — spend without full delivery yet',
      'Whether CPL is being read against awareness spend, where it does not apply',
    ],
  },
  {
    key: 'website-activity',
    title: 'Website activity',
    measures:
      'GA4 sessions for the period, with key events (the conversion actions configured in GA4) as the caption.',
    whyAlarming:
      'High sessions next to few CRM leads can look like the website is failing. Sessions count all visits — service customers, parts lookups, existing owners — not just in-market buyers, and many real enquiries arrive by phone rather than forms.',
    whatGoodLooksLike:
      'Steady sessions with key events tracking the actions that matter (form submits, calls, direction clicks) so the two numbers can be compared honestly.',
    whatToCheck: [
      'Which key events are configured in GA4 and whether they match real enquiry actions',
      'Whether phone-call enquiries are tracked as events or only appear in the CRM',
    ],
  },
  {
    key: 'utm-coverage',
    title: 'UTM coverage',
    measures:
      'The share of this period\'s CRM leads that arrived carrying UTM parameters — the tags that record which campaign, source and medium drove the lead.',
    whyAlarming:
      'With few leads the percentage swings hard: 33.3% can simply mean one of three leads carried tags. It measures tagging completeness, not marketing performance.',
    whatGoodLooksLike:
      '80% or higher. Sustained low coverage usually means some entry points (phone, chat, marketplaces) never carry tags, or ad links are missing UTMs.',
    whatToCheck: [
      'UTM tags on every paid ad final URL',
      'Whether the untagged leads came from phone, walk-in or marketplace sources',
      'Lead volume — below roughly ten leads, read the count, not the percentage',
    ],
  },
  {
    key: 'data-layer-audit',
    title: 'Data Layer Audit',
    measures:
      'Field-by-field coverage of the lead-tracking contract: how many of the period\'s leads carried UTMs, a source, a campaign tag, paid-platform evidence, a click ID, or backfilled attribution.',
    whyAlarming:
      'A 0% row means none of the period\'s leads carried that field — with three leads, one field missing on all of them reads as total failure. Source coverage at 100% alongside 0% click-ID coverage typically means leads are captured correctly but did not come from ad clicks.',
    whatGoodLooksLike:
      'UTM coverage at 80% or higher and source coverage at 95% or higher. Click-ID and paid-attribution rows only apply to ad-click leads, so they sit at 0% whenever no ad-click leads arrived.',
    whatToCheck: [
      'Which rows apply to this period\'s lead mix — ad-click fields are expected to be 0% without ad-click leads',
      'Whether website forms pass UTMs and click IDs through to the CRM',
      'Lead volume before treating any percentage as a trend',
    ],
  },
  {
    key: 'cpl-reconciliation',
    title: 'Campaign CPL Reconciliation',
    measures:
      'Each ad campaign\'s spend alongside the platform\'s own reported leads and the CRM leads matched back to that campaign.',
    whyAlarming:
      'Zero platform leads against real spend most often means the campaign is not optimising for leads — the platform itself reports none. A broken tracking pixel on a lead-gen campaign can produce the same zero, so the campaign objective is the first thing to confirm. Zero CRM matches on top of that follows from the same cause.',
    whatGoodLooksLike:
      'Lead-gen campaigns showing platform leads and CRM matches. Awareness and traffic rows showing clicks and impressions, with CPL treated as not applicable.',
    whatToCheck: [
      'Each campaign\'s objective before reading its CPL column',
      'Whether platform-reported leads and CRM matches diverge on lead-gen campaigns (a real tracking question)',
    ],
  },
];
