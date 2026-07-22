export const STOCK_CARD_PROMO_MAX_OFFERS = 200;
export const STOCK_CARD_PROMO_MAX_GROUPS = 20;
export const STOCK_CARD_PROMO_MAX_GRAPHICS = 6;
export const STOCK_CARD_PROMO_MAX_PERCENT_OFF = 75;
export const STOCK_CARD_PROMO_MIN_INTERVAL = 2;
export const STOCK_CARD_PROMO_MAX_INTERVAL = 10;
export const STOCK_CARD_PROMO_DEFAULT_INTERVAL = 3;

export interface StockCardOffer {
  stockNumber: string;
  wasPrice: number | null;
  comment: string;
  badgeText: string;
  badgeColor: string;
  start: string;
  end: string;
}

export interface StockPromoGraphic {
  id: string;
  enabled: boolean;
  image: string;
  mobileImage: string;
  link: string;
  heading: string;
  subheading: string;
  start: string;
  end: string;
}

export interface StockGroupRule {
  id: string;
  enabled: boolean;
  make: string;
  model: string;
  variant: string;
  condition: '' | 'new' | 'demo' | 'used';
  discountType: '' | 'amount' | 'percent';
  discountValue: number | null;
  comment: string;
  badgeText: string;
  badgeColor: string;
  start: string;
  end: string;
}

export interface StockPageHeader {
  enabled: boolean;
  desktop: string;
  mobile: string;
  link: string;
  alt: string;
  start: string;
  end: string;
}

export interface StockCardPromoSettings {
  version: 1;
  updatedAt: string | null;
  wasNowEnabled: boolean;
  commentsEnabled: boolean;
  badgesEnabled: boolean;
  scroller: {
    enabled: boolean;
    text: string;
    color: string;
    make: string;
    model: string;
    variant: string;
    condition: '' | 'new' | 'demo' | 'used';
  };
  offers: StockCardOffer[];
  groups: StockGroupRule[];
  graphics: {
    enabled: boolean;
    interval: number;
    items: StockPromoGraphic[];
  };
  stockHeader: StockPageHeader;
}

export type StockCardPromoParseResult =
  | { ok: true; value: StockCardPromoSettings }
  | { ok: false; errors: string[] };

interface ParseOptions {
  allowedImageHosts: Set<string>;
  now?: Date;
}

const MAX_COPY_LENGTHS = {
  scrollerText: 160,
  comment: 200,
  badgeText: 32,
  stockNumber: 40,
  heading: 120,
  subheading: 200,
} as const;

const DEFAULT_SCROLLER_COLOR = '#e11d48';
const DEFAULT_BADGE_COLOR = '#e11d48';
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function defaultStockCardPromoSettings(): StockCardPromoSettings {
  return {
    version: 1,
    updatedAt: null,
    wasNowEnabled: false,
    commentsEnabled: false,
    badgesEnabled: false,
    scroller: { enabled: false, text: '', color: DEFAULT_SCROLLER_COLOR, make: '', model: '', variant: '', condition: '' },
    offers: [],
    groups: [],
    graphics: { enabled: false, interval: STOCK_CARD_PROMO_DEFAULT_INTERVAL, items: [] },
    stockHeader: defaultStockPageHeader(),
  };
}

export function defaultStockPageHeader(): StockPageHeader {
  return { enabled: false, desktop: '', mobile: '', link: '', alt: '', start: '', end: '' };
}

export function parseStockCardPromoInput(
  input: unknown,
  options: ParseOptions,
): StockCardPromoParseResult {
  const errors: string[] = [];
  const body = isRecord(input) ? input : {};

  const scrollerInput = isRecord(body.scroller) ? body.scroller : {};
  const scrollerText = plainTextValue(scrollerInput.text, MAX_COPY_LENGTHS.scrollerText, 'Scrolling banner text', errors);
  const scroller = {
    enabled: scrollerInput.enabled === true,
    text: scrollerText,
    color: parseHexColor(scrollerInput.color, 'Scrolling banner colour', DEFAULT_SCROLLER_COLOR, errors),
    make: stringValue(scrollerInput.make).slice(0, 60),
    model: stringValue(scrollerInput.model).slice(0, 60),
    variant: stringValue(scrollerInput.variant).slice(0, 60),
    condition: normalizeCondition(scrollerInput.condition),
  };
  if (scroller.enabled && !scroller.text) {
    errors.push('Scrolling banner text is required when the banner is enabled.');
  }

  const offersInput = Array.isArray(body.offers) ? body.offers : [];
  if (offersInput.length > STOCK_CARD_PROMO_MAX_OFFERS) {
    errors.push(`A maximum of ${STOCK_CARD_PROMO_MAX_OFFERS} vehicle offers is allowed.`);
  }
  // Duplicate stock numbers keep the last entry, so re-adding a car in the
  // admin behaves as an update rather than a silent no-op.
  const offers = [...new Map(
    offersInput
      .slice(0, STOCK_CARD_PROMO_MAX_OFFERS)
      .map((value, index) => parseOffer(value, index, errors))
      .filter((offer) => offer.stockNumber)
      .map((offer) => [offer.stockNumber.toLowerCase(), offer] as const),
  ).values()];

  const groupsInput = Array.isArray(body.groups) ? body.groups : [];
  if (groupsInput.length > STOCK_CARD_PROMO_MAX_GROUPS) {
    errors.push(`A maximum of ${STOCK_CARD_PROMO_MAX_GROUPS} group offers is allowed.`);
  }
  const groups = groupsInput
    .slice(0, STOCK_CARD_PROMO_MAX_GROUPS)
    .map((value, index) => parseGroupRule(value, index, errors));

  const stockHeader = parseStockHeader(body.stockHeader, options.allowedImageHosts, errors);

  const graphicsInput = isRecord(body.graphics) ? body.graphics : {};
  const graphicItemsInput = Array.isArray(graphicsInput.items) ? graphicsInput.items : [];
  if (graphicItemsInput.length > STOCK_CARD_PROMO_MAX_GRAPHICS) {
    errors.push(`A maximum of ${STOCK_CARD_PROMO_MAX_GRAPHICS} promo graphics is allowed.`);
  }
  const graphics = {
    enabled: graphicsInput.enabled === true,
    interval: parseInterval(graphicsInput.interval, errors),
    items: graphicItemsInput
      .slice(0, STOCK_CARD_PROMO_MAX_GRAPHICS)
      .map((value, index) => parseGraphic(value, index, options.allowedImageHosts, errors)),
  };
  if (graphics.enabled && !graphics.items.some((item) => item.enabled && item.image)) {
    errors.push('Add at least one promo graphic with an image before enabling graphics between cards.');
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      version: 1,
      updatedAt: (options.now || new Date()).toISOString(),
      wasNowEnabled: body.wasNowEnabled === true,
      commentsEnabled: body.commentsEnabled === true,
      badgesEnabled: body.badgesEnabled === true,
      scroller,
      offers,
      groups,
      graphics,
      stockHeader,
    },
  };
}

export function readStockCardPromoSettings(settings: unknown): StockCardPromoSettings | null {
  if (!isRecord(settings) || !isRecord(settings.stockCardPromo)) return null;
  const stored = settings.stockCardPromo;
  if (stored.version !== 1) return null;

  const scroller = isRecord(stored.scroller) ? stored.scroller : {};
  const graphics = isRecord(stored.graphics) ? stored.graphics : {};

  return {
    version: 1,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : null,
    wasNowEnabled: stored.wasNowEnabled === true,
    commentsEnabled: stored.commentsEnabled === true,
    badgesEnabled: stored.badgesEnabled === true,
    scroller: {
      enabled: scroller.enabled === true,
      text: stringValue(scroller.text),
      color: HEX_COLOR_PATTERN.test(stringValue(scroller.color)) ? stringValue(scroller.color) : DEFAULT_SCROLLER_COLOR,
      make: stringValue(scroller.make),
      model: stringValue(scroller.model),
      variant: stringValue(scroller.variant),
      condition: normalizeCondition(scroller.condition),
    },
    offers: (Array.isArray(stored.offers) ? stored.offers : [])
      .filter(isRecord)
      .map((offer) => ({
        stockNumber: stringValue(offer.stockNumber),
        wasPrice: normalizeStoredPrice(offer.wasPrice),
        comment: stringValue(offer.comment),
        badgeText: stringValue(offer.badgeText),
        badgeColor: HEX_COLOR_PATTERN.test(stringValue(offer.badgeColor)) ? stringValue(offer.badgeColor) : DEFAULT_BADGE_COLOR,
        start: normalizeDate(stringValue(offer.start)),
        end: normalizeDate(stringValue(offer.end)),
      }))
      .filter((offer) => offer.stockNumber),
    groups: (Array.isArray(stored.groups) ? stored.groups : [])
      .filter(isRecord)
      .map((rule, index) => ({
        id: cleanGroupId(rule.id, index),
        enabled: rule.enabled !== false,
        make: stringValue(rule.make),
        model: stringValue(rule.model),
        variant: stringValue(rule.variant),
        condition: normalizeCondition(rule.condition),
        discountType: rule.discountType === 'amount' || rule.discountType === 'percent' ? rule.discountType : '' as const,
        discountValue: normalizeStoredDiscount(rule.discountType, rule.discountValue),
        comment: stringValue(rule.comment),
        badgeText: stringValue(rule.badgeText),
        badgeColor: HEX_COLOR_PATTERN.test(stringValue(rule.badgeColor)) ? stringValue(rule.badgeColor) : DEFAULT_BADGE_COLOR,
        start: normalizeDate(stringValue(rule.start)),
        end: normalizeDate(stringValue(rule.end)),
      })),
    graphics: {
      enabled: graphics.enabled === true,
      interval: normalizeStoredInterval(graphics.interval),
      items: (Array.isArray(graphics.items) ? graphics.items : [])
        .filter(isRecord)
        .map((item, index) => ({
          id: cleanId(item.id, index),
          enabled: item.enabled !== false,
          image: stringValue(item.image),
          mobileImage: stringValue(item.mobileImage),
          link: stringValue(item.link),
          heading: stringValue(item.heading),
          subheading: stringValue(item.subheading),
          start: normalizeDate(stringValue(item.start)),
          end: normalizeDate(stringValue(item.end)),
        })),
    },
    stockHeader: (() => {
      const header = isRecord(stored.stockHeader) ? stored.stockHeader : {};
      return {
        enabled: header.enabled === true,
        desktop: stringValue(header.desktop),
        mobile: stringValue(header.mobile),
        link: stringValue(header.link),
        alt: stringValue(header.alt),
        start: normalizeDate(stringValue(header.start)),
        end: normalizeDate(stringValue(header.end)),
      };
    })(),
  };
}

function normalizeStoredDiscount(type: unknown, value: unknown): number | null {
  if (type !== 'amount' && type !== 'percent') return null;
  const discount = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(discount) || discount <= 0) return null;
  if (type === 'percent' && discount > STOCK_CARD_PROMO_MAX_PERCENT_OFF) return null;
  if (type === 'amount' && discount > 1_000_000) return null;
  return discount;
}

export interface VehiclePromoAttrs {
  stockNumber: string;
  make: string;
  model: string;
  variant: string;
  condition: string;
  price: number;
}

export interface ResolvedCardPromo {
  wasPrice: number | null;
  comment: string;
  badgeText: string;
  badgeColor: string;
  source: 'stock' | 'group';
}

/**
 * Per-vehicle stock offers always beat group rules; the first matching
 * enabled, in-window group rule applies otherwise. Group discounts derive
 * the was-price from the vehicle's live feed price.
 */
export function resolveCardPromo(
  settings: Pick<StockCardPromoSettings, 'offers' | 'groups'>,
  attrs: VehiclePromoAttrs,
  now: Date = new Date(),
): ResolvedCardPromo | null {
  const stockKey = attrs.stockNumber.trim().toLowerCase();
  if (stockKey) {
    const offer = settings.offers.find(
      (candidate) =>
        candidate.stockNumber.trim().toLowerCase() === stockKey
        && isPromoWindowActive(candidate.start, candidate.end, now),
    );
    if (offer) {
      return {
        wasPrice: offer.wasPrice,
        comment: offer.comment,
        badgeText: offer.badgeText,
        badgeColor: offer.badgeColor,
        source: 'stock',
      };
    }
  }

  const rule = (settings.groups || []).find(
    (candidate) =>
      candidate.enabled
      && isPromoWindowActive(candidate.start, candidate.end, now)
      && matchesPromoTarget(candidate, attrs),
  );
  if (!rule) return null;

  return {
    wasPrice: groupWasPrice(rule, attrs.price),
    comment: rule.comment,
    badgeText: rule.badgeText,
    badgeColor: rule.badgeColor,
    source: 'group',
  };
}

export interface PromoTarget {
  make: string;
  model: string;
  variant: string;
  condition: '' | 'new' | 'demo' | 'used';
}

/**
 * Empty target fields match everything. Slug-insensitive: the feed stores
 * "i30-sedan" in value[] but "i30 Sedan" in displayValue[], and admin rules
 * are saved from display strings.
 */
export function matchesPromoTarget(target: PromoTarget, attrs: VehiclePromoAttrs): boolean {
  const fingerprint = (value: string) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const matches = (wanted: string, actual: string) =>
    !wanted || fingerprint(wanted) === fingerprint(actual);

  return (
    matches(target.make, attrs.make)
    && matches(target.model, attrs.model)
    && matches(target.variant, attrs.variant)
    && (!target.condition || target.condition === normalizeCondition(attrs.condition))
  );
}

/**
 * The site-wide scrolling banner, filtered to the vehicles it targets.
 * Returns null when disabled, empty, or the vehicle doesn't match.
 */
export function resolveCardScroller(
  settings: Pick<StockCardPromoSettings, 'scroller'>,
  attrs: VehiclePromoAttrs,
): { text: string; color: string } | null {
  const scroller = settings.scroller;
  if (!scroller?.enabled || !scroller.text) return null;
  if (!matchesPromoTarget(scroller, attrs)) return null;
  return { text: scroller.text, color: scroller.color };
}

function groupWasPrice(rule: StockGroupRule, price: number): number | null {
  if (!price || price <= 0 || !rule.discountType || !rule.discountValue) return null;
  if (rule.discountType === 'amount') return Math.round(price + rule.discountValue);
  return Math.round(price / (1 - rule.discountValue / 100));
}

function parseOffer(value: unknown, index: number, errors: string[]): StockCardOffer {
  const offer = isRecord(value) ? value : {};
  const label = `Offer ${index + 1}`;
  const stockNumber = stringValue(offer.stockNumber);

  if (stockNumber.length > MAX_COPY_LENGTHS.stockNumber) {
    errors.push(`${label} stock number must be ${MAX_COPY_LENGTHS.stockNumber} characters or fewer.`);
  }
  const hasContent = offer.wasPrice || stringValue(offer.comment) || stringValue(offer.badgeText);
  if (!stockNumber && hasContent) {
    errors.push(`${label} needs a stock number.`);
  }

  return {
    stockNumber: stockNumber.slice(0, MAX_COPY_LENGTHS.stockNumber),
    wasPrice: parseWasPrice(offer.wasPrice, label, errors),
    comment: plainTextValue(offer.comment, MAX_COPY_LENGTHS.comment, `${label} comment`, errors),
    badgeText: plainTextValue(offer.badgeText, MAX_COPY_LENGTHS.badgeText, `${label} badge text`, errors),
    badgeColor: parseHexColor(offer.badgeColor, `${label} badge colour`, DEFAULT_BADGE_COLOR, errors),
    ...parseDateWindow(offer, label, errors),
  };
}

function parseDateWindow(source: Record<string, any>, label: string, errors: string[]) {
  const start = normalizeDate(stringValue(source.start));
  const end = normalizeDate(stringValue(source.end));

  if (stringValue(source.start) && !start) errors.push(`${label} has an invalid start date.`);
  if (stringValue(source.end) && !end) errors.push(`${label} has an invalid end date.`);
  if (start && end && toIsoDate(start) > toIsoDate(end)) {
    errors.push(`${label} start date must not be after its end date.`);
  }

  return { start, end };
}

function parseGroupRule(value: unknown, index: number, errors: string[]): StockGroupRule {
  const rule = isRecord(value) ? value : {};
  const label = `Group offer ${index + 1}`;
  const make = stringValue(rule.make);
  const model = stringValue(rule.model);
  const variant = stringValue(rule.variant);
  const condition = normalizeCondition(rule.condition);

  if (!make && !model && !variant && !condition) {
    errors.push(`${label} needs at least one target (make, model, variant or condition).`);
  }

  const discountType = rule.discountType === 'amount' || rule.discountType === 'percent' ? rule.discountType : '';
  let discountValue: number | null = null;
  if (discountType) {
    const raw = typeof rule.discountValue === 'number'
      ? rule.discountValue
      : typeof rule.discountValue === 'string' ? Number(rule.discountValue.trim()) : Number.NaN;
    if (discountType === 'amount' && (!Number.isFinite(raw) || raw <= 0 || raw > 1_000_000)) {
      errors.push(`${label} discount must be a positive dollar amount.`);
    } else if (discountType === 'percent' && (!Number.isFinite(raw) || raw <= 0 || raw > STOCK_CARD_PROMO_MAX_PERCENT_OFF)) {
      errors.push(`${label} discount must be between 1% and ${STOCK_CARD_PROMO_MAX_PERCENT_OFF}%.`);
    } else {
      discountValue = Math.round(raw * 100) / 100;
    }
  }

  return {
    id: cleanGroupId(rule.id, index),
    enabled: rule.enabled !== false,
    make: make.slice(0, 60),
    model: model.slice(0, 60),
    variant: variant.slice(0, 60),
    condition,
    discountType,
    discountValue,
    comment: plainTextValue(rule.comment, MAX_COPY_LENGTHS.comment, `${label} comment`, errors),
    badgeText: plainTextValue(rule.badgeText, MAX_COPY_LENGTHS.badgeText, `${label} badge text`, errors),
    badgeColor: parseHexColor(rule.badgeColor, `${label} badge colour`, DEFAULT_BADGE_COLOR, errors),
    ...parseDateWindow(rule, label, errors),
  };
}

function parseStockHeader(
  value: unknown,
  allowedImageHosts: Set<string>,
  errors: string[],
): StockPageHeader {
  const header = isRecord(value) ? value : {};
  const label = 'Stock page header';
  const enabled = header.enabled === true;
  const desktop = stringValue(header.desktop);
  const mobile = stringValue(header.mobile);
  const link = stringValue(header.link);

  if (desktop) validateImageUrl(desktop, `${label} desktop image`, allowedImageHosts, errors);
  else if (enabled) errors.push(`${label} desktop image is required when the header is enabled.`);
  if (mobile) validateImageUrl(mobile, `${label} mobile image`, allowedImageHosts, errors);
  validateLink(link, label, errors);

  return {
    enabled,
    desktop,
    mobile,
    link,
    alt: plainTextValue(header.alt, MAX_COPY_LENGTHS.heading, `${label} alt text`, errors),
    ...parseDateWindow(header, label, errors),
  };
}

function normalizeCondition(value: unknown): StockGroupRule['condition'] {
  const condition = stringValue(value).toLowerCase();
  if (condition.includes('demo')) return 'demo';
  if (condition.includes('new')) return 'new';
  if (condition.includes('used')) return 'used';
  return '';
}

function cleanGroupId(value: unknown, index: number) {
  const id = stringValue(value);
  return /^[a-zA-Z0-9_-]{1,80}$/.test(id) ? id : `group-${index + 1}`;
}

function parseGraphic(
  value: unknown,
  index: number,
  allowedImageHosts: Set<string>,
  errors: string[],
): StockPromoGraphic {
  const graphic = isRecord(value) ? value : {};
  const label = `Promo graphic ${index + 1}`;
  const enabled = graphic.enabled !== false;
  const image = stringValue(graphic.image);
  const mobileImage = stringValue(graphic.mobileImage);
  const link = stringValue(graphic.link);

  // A disabled graphic may be saved as an imageless draft; a visible one may not.
  if (image) validateImageUrl(image, `${label} image`, allowedImageHosts, errors);
  else if (enabled) errors.push(`${label} image is required (or mark the graphic as hidden).`);
  if (mobileImage) validateImageUrl(mobileImage, `${label} mobile image`, allowedImageHosts, errors);
  validateLink(link, label, errors);

  return {
    id: cleanId(graphic.id, index),
    enabled,
    image,
    mobileImage,
    link,
    heading: plainTextValue(graphic.heading, MAX_COPY_LENGTHS.heading, `${label} heading`, errors),
    subheading: plainTextValue(graphic.subheading, MAX_COPY_LENGTHS.subheading, `${label} subheading`, errors),
    ...parseDateWindow(graphic, label, errors),
  };
}

/**
 * "Now" expressed in the dealer's timezone, so campaign windows start and end
 * on Melbourne days regardless of where the server runs (production is UTC).
 */
export function promoNow(timeZone = 'Australia/Melbourne'): Date {
  try {
    return new Date(new Date().toLocaleString('en-US', { timeZone }));
  } catch {
    return new Date();
  }
}

/**
 * Inclusive date-window check for DD-MM-YYYY values; empty bounds are open.
 */
export function isPromoWindowActive(start: string, end: string, now: Date = new Date()): boolean {
  if (start) {
    const startDate = parseAuDate(start);
    if (startDate && now < startDate) return false;
  }
  if (end) {
    const endDate = parseAuDate(end);
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
      if (now > endDate) return false;
    }
  }
  return true;
}

function parseAuDate(value: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function normalizeDate(value: string) {
  if (!value) return '';

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const auMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  const parts = isoMatch
    ? { year: isoMatch[1], month: isoMatch[2], day: isoMatch[3] }
    : auMatch
      ? { year: auMatch[3], month: auMatch[2], day: auMatch[1] }
      : null;
  if (!parts?.year || !parts.month || !parts.day) return '';

  const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  if (
    date.getUTCFullYear() !== Number(parts.year)
    || date.getUTCMonth() !== Number(parts.month) - 1
    || date.getUTCDate() !== Number(parts.day)
  ) return '';

  return `${parts.day}-${parts.month}-${parts.year}`;
}

function toIsoDate(value: string) {
  const [day, month, year] = value.split('-');
  return `${year}-${month}-${day}`;
}

function parseWasPrice(value: unknown, label: string, errors: string[]): number | null {
  if (value === undefined || value === null || value === '') return null;
  const price = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) {
    errors.push(`${label} was-price must be a positive number.`);
    return null;
  }
  return Math.round(price);
}

function parseInterval(value: unknown, errors: string[]): number {
  if (value === undefined || value === null || value === '') return STOCK_CARD_PROMO_DEFAULT_INTERVAL;
  const interval = typeof value === 'number' ? value : Number(String(value).trim());
  if (
    !Number.isInteger(interval)
    || interval < STOCK_CARD_PROMO_MIN_INTERVAL
    || interval > STOCK_CARD_PROMO_MAX_INTERVAL
  ) {
    errors.push(
      `Graphics interval must be a whole number between ${STOCK_CARD_PROMO_MIN_INTERVAL} and ${STOCK_CARD_PROMO_MAX_INTERVAL}.`,
    );
    return STOCK_CARD_PROMO_DEFAULT_INTERVAL;
  }
  return interval;
}

function parseHexColor(value: unknown, label: string, fallback: string, errors: string[]): string {
  const color = stringValue(value);
  if (!color) return fallback;
  if (!HEX_COLOR_PATTERN.test(color)) {
    errors.push(`${label} must be a hex colour like #E11D48.`);
    return fallback;
  }
  return color.toLowerCase();
}

function normalizeStoredPrice(value: unknown): number | null {
  const price = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(price) && price > 0 ? Math.round(price) : null;
}

function normalizeStoredInterval(value: unknown): number {
  const interval = typeof value === 'number' ? value : Number.NaN;
  return Number.isInteger(interval)
    && interval >= STOCK_CARD_PROMO_MIN_INTERVAL
    && interval <= STOCK_CARD_PROMO_MAX_INTERVAL
    ? interval
    : STOCK_CARD_PROMO_DEFAULT_INTERVAL;
}

function validateImageUrl(
  value: string,
  label: string,
  allowedImageHosts: Set<string>,
  errors: string[],
) {
  if (value.length > 2048) {
    errors.push(`${label} URL is too long.`);
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !allowedImageHosts.has(url.hostname.toLowerCase())) {
      errors.push(`${label} must use HTTPS on an approved media host.`);
    }
  } catch {
    errors.push(`${label} must use HTTPS on an approved media host.`);
  }
}

function validateLink(value: string, label: string, errors: string[]) {
  if (!value) return;

  const isInternal = /^\/(?!\/)[^\s\\]*$/.test(value);
  let isHttps = false;
  try {
    const url = new URL(value);
    isHttps = url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    isHttps = false;
  }

  if (!isInternal && !isHttps) {
    errors.push(`${label} link must be a safe internal path or HTTPS URL.`);
  }
}

function plainTextValue(
  value: unknown,
  maxLength: number,
  label: string,
  errors: string[],
) {
  const text = stringValue(value);
  if (/[<>]/.test(text)) errors.push(`${label} must be plain text without HTML markup.`);
  if (text.length > maxLength) errors.push(`${label} must be ${maxLength} characters or fewer.`);
  return text;
}

function cleanId(value: unknown, index: number) {
  const id = stringValue(value);
  return /^[a-zA-Z0-9_-]{1,80}$/.test(id) ? id : `graphic-${index + 1}`;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
