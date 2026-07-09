import { createHash } from 'node:crypto';

export type InboundLeadSource = 'carsales' | 'autotrader' | 'hyundai_oem' | 'meta_lead_ads' | 'other';

export interface InboundLeadEmailAddress {
  id: string;
  source: InboundLeadSource;
  label: string;
  localPart: string;
  email: string | null;
  enabled: boolean;
  enquiryType: string;
  createdAt: string;
}

export interface InboundLeadEmailSettings {
  domain: string | null;
  addresses: InboundLeadEmailAddress[];
}

const SOURCE_LABELS: Record<InboundLeadSource, string> = {
  carsales: 'Carsales',
  autotrader: 'Autotrader',
  hyundai_oem: 'Hyundai OEM',
  meta_lead_ads: 'Meta Lead Ads',
  other: 'Other inbound lead source',
};

export function listInboundLeadEmailAddresses(settings: Record<string, any>, domain: string | null): InboundLeadEmailSettings {
  const configured = settings?.marketing?.inboundLeadEmail || {};
  const configuredDomain = normalizeDomain(configured.domain || domain);
  const addresses: unknown[] = Array.isArray(configured.addresses) ? configured.addresses : [];

  return {
    domain: configuredDomain,
    addresses: addresses
      .filter(isAddressLike)
      .map(address => normalizeAddress(address, configuredDomain)),
  };
}

export function upsertInboundLeadEmailAddress(
  settings: Record<string, any>,
  input: { source: InboundLeadSource; label?: string; domain?: string | null; dealerSlug: string; now?: Date },
): { settings: Record<string, any>; address: InboundLeadEmailAddress } {
  const domain = normalizeDomain(input.domain || settings?.marketing?.inboundLeadEmail?.domain || null);
  const existing = listInboundLeadEmailAddresses(settings, domain);
  const current = existing.addresses.find(address => address.source === input.source);
  const createdAt = input.now?.toISOString() || new Date().toISOString();
  const localPart = current?.localPart || buildLocalPart(input.dealerSlug, input.source);
  const address: InboundLeadEmailAddress = {
    id: current?.id || stableAddressId(input.dealerSlug, input.source),
    source: input.source,
    label: input.label?.trim() || current?.label || SOURCE_LABELS[input.source],
    localPart,
    email: domain ? `${localPart}@${domain}` : null,
    enabled: true,
    enquiryType: current?.enquiryType || 'vehicle',
    createdAt: current?.createdAt || createdAt,
  };

  const nextAddresses = [
    ...existing.addresses.filter(item => item.source !== input.source),
    address,
  ].sort((a, b) => a.label.localeCompare(b.label));

  const nextSettings = {
    ...settings,
    marketing: {
      ...(settings.marketing || {}),
      inboundLeadEmail: {
        ...(settings.marketing?.inboundLeadEmail || {}),
        domain,
        addresses: nextAddresses,
      },
    },
  };

  return { settings: nextSettings, address };
}

export function findInboundLeadAddress(
  settings: Record<string, any>,
  recipients: string[],
  fallbackDomain: string | null,
): InboundLeadEmailAddress | null {
  const configured = listInboundLeadEmailAddresses(settings, fallbackDomain);
  const normalizedRecipients = recipients.flatMap((recipient) => {
    const extracted = extractEmailAddresses(recipient);
    return extracted.length ? extracted : [normalizeEmail(recipient)];
  }).filter(Boolean);

  for (const address of configured.addresses) {
    if (!address.enabled) continue;
    const email = normalizeEmail(address.email || '');
    if (email && normalizedRecipients.includes(email)) return address;
    if (normalizedRecipients.some(recipient => recipient.startsWith(`${address.localPart}@`))) return address;
  }

  return null;
}

export function extractEmailAddresses(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  const emails = new Set<string>();
  for (const item of values) {
    if (item == null) continue;
    const str = typeof item === 'string' ? item : JSON.stringify(item);
    for (const match of str.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
      const email = normalizeEmail(match[0]);
      if (email) emails.add(email);
    }
  }
  return [...emails];
}

export function parseInboundLeadEmail(body: Record<string, any>) {
  const raw = String(body.raw || body.rawEmail || body.mime || '');
  const rawHeaders = raw ? parseRawHeaders(raw) : {};
  const text = selectTextPayload(body, raw);
  const subject = decodeMimeWords(String(body.subject || body.headers?.subject || rawHeaders.subject || 'Inbound lead'));
  const fromEmail = extractEmailAddresses(body.from || body.sender || body.envelope?.from || body.headers?.from || rawHeaders.from)[0] || null;
  const customerEmail = findField(text, ['email', 'e-mail']) || extractEmailAddresses(text).find(email => email !== fromEmail) || fromEmail;
  const name = findField(text, ['name', 'customer', 'full name']) || nameFromEmail(customerEmail);
  const [firstName, ...lastNameParts] = name.split(/\s+/).filter(Boolean);
  const phone = findField(text, ['phone', 'mobile', 'telephone']);
  const message = compact([
    subject,
    findField(text, ['message', 'comments', 'enquiry']) || trimText(text, 2000),
  ]).join('\n\n');

  return {
    fromEmail,
    customerEmail: customerEmail || null,
    firstName: firstName || 'Inbound',
    lastName: lastNameParts.join(' ') || 'Lead',
    phone,
    message,
    subject,
  };
}

function buildLocalPart(dealerSlug: string, source: InboundLeadSource) {
  return `${slugify(dealerSlug)}-${source.replaceAll('_', '-')}`;
}

function stableAddressId(dealerSlug: string, source: InboundLeadSource) {
  return createHash('sha1').update(`${dealerSlug}:${source}`).digest('hex').slice(0, 16);
}

function normalizeAddress(address: Record<string, unknown>, domain: string | null): InboundLeadEmailAddress {
  const source = isSource(address.source) ? address.source : 'other';
  const localPart = slugify(String(address.localPart || buildLocalPart('dealer', source)));
  return {
    id: String(address.id || stableAddressId(localPart, source)),
    source,
    label: String(address.label || SOURCE_LABELS[source]),
    localPart,
    email: domain ? `${localPart}@${domain}` : null,
    enabled: address.enabled !== false,
    enquiryType: String(address.enquiryType || 'vehicle'),
    createdAt: String(address.createdAt || new Date(0).toISOString()),
  };
}

function isAddressLike(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function isSource(value: unknown): value is InboundLeadSource {
  return typeof value === 'string' && value in SOURCE_LABELS;
}

function normalizeDomain(value: unknown) {
  if (!value) return null;
  return String(value).trim().toLowerCase().replace(/^@/, '') || null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return String(value || 'dealer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'dealer';
}

function findField(text: string, labels: string[]) {
  for (const label of labels) {
    const match = new RegExp(`(?:^|\\n)\\s*${label}\\s*[:\\-]\\s*(.+)`, 'i').exec(text);
    if (match?.[1]) return trimText(match[1], 180);
  }
  return null;
}

function selectTextPayload(body: Record<string, any>, raw: string) {
  for (const value of [body.text, body.plain, body.body, body.html]) {
    if (typeof value === 'string' && value.trim()) return normalizeEmailText(value);
  }
  return raw ? extractRawEmailText(raw) : '';
}

function extractRawEmailText(raw: string) {
  const decoded = decodeQuotedPrintable(raw.replace(/\r\n/g, '\n'));
  const body = decoded.includes('\n\n') ? decoded.split(/\n\n/).slice(1).join('\n\n') : decoded;
  return normalizeEmailText(body
    .replace(/^Content-(?:Type|Transfer-Encoding|Disposition):.*$/gim, '')
    .replace(/^--[A-Za-z0-9'()+_,./:=?-]+(?:--)?$/gim, '\n')
    .replace(/\n{3,}/g, '\n\n'));
}

function parseRawHeaders(raw: string) {
  const headerBlock = raw.replace(/\r\n/g, '\n').split('\n\n')[0] || '';
  const headers: Record<string, string> = {};
  let current = '';
  for (const line of headerBlock.split('\n')) {
    if (/^\s/.test(line) && current) {
      headers[current] = `${headers[current]} ${line.trim()}`;
      continue;
    }
    const index = line.indexOf(':');
    if (index === -1) continue;
    current = line.slice(0, index).trim().toLowerCase();
    headers[current] = line.slice(index + 1).trim();
  }
  return headers;
}

function normalizeEmailText(value: string) {
  return decodeQuotedPrintable(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeQuotedPrintable(value: string) {
  return value
    .replace(/=\r?\n/g, '')
    .replace(/=([A-F0-9]{2})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function decodeMimeWords(value: string) {
  return value.replace(/=\?([^?]+)\?Q\?([^?]+)\?=/gi, (_, _charset, text) =>
    decodeQuotedPrintable(String(text).replace(/_/g, ' ')));
}

function nameFromEmail(email: string | null | undefined) {
  if (!email) return 'Inbound Lead';
  return email.split('@')[0]!.replace(/[._-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function trimText(value: string, length: number) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, length);
}

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}
