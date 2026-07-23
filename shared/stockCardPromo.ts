export const STOCK_CARD_PROMO_MAX_OFFERS = 200;
export const STOCK_CARD_PROMO_MAX_GROUPS = 20;
export const STOCK_CARD_PROMO_MAX_GRAPHICS = 6;
export const STOCK_CARD_PROMO_MAX_SCROLLERS = 10;
export const STOCK_CARD_PROMO_MAX_PERCENT_OFF = 75;
export const STOCK_CARD_PROMO_MIN_INTERVAL = 2;
export const STOCK_CARD_PROMO_MAX_INTERVAL = 10;
export const STOCK_CARD_PROMO_DEFAULT_INTERVAL = 3;

export type PromoCondition = 'new' | 'demo' | 'used';

export const PROMO_FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const;
export type PromoFuelType = (typeof PROMO_FUEL_TYPES)[number];

export interface StockCardOffer {
  stockNumber: string;
  wasPrice: number | null;
  comment: string;
  /** Background of the scrolling comment strip; separate from the badge colour. */
  commentColor: string;
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
  fuelType: '' | PromoFuelType;
  discountType: '' | 'amount' | 'percent';
  discountValue: number | null;
  comment: string;
  /** Background of the scrolling comment strip; separate from the badge colour. */
  commentColor: string;
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

export interface StockScrollerBanner {
  id: string;
  enabled: boolean;
  text: string;
  color: string;
  make: string;
  model: string;
  variant: string;
  /** Multi-select; empty means every condition. */
  conditions: PromoCondition[];
  /** Multi-select; empty means every fuel type. */
  fuelTypes: PromoFuelType[];
  start: string;
  end: string;
}

export interface StockCardPromoSettings {
  version: 1;
  updatedAt: string | null;
  wasNowEnabled: boolean;
  commentsEnabled: boolean;
  badgesEnabled: boolean;
  /** Ordered scrolling banners; the first banner matching a vehicle shows on its card. */
  scrollers: StockScrollerBanner[];
  offers: StockCardOffer[];
  groups: StockGroupRule[];
  graphics: {
    enabled: boolean;
    interval: number;
    /** One campaign window for the whole rotating set. */
    start: string;
    end: string;
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
    scrollers: [],
    offers: [],
    groups: [],
    graphics: { enabled: false, interval: STOCK_CARD_PROMO_DEFAULT_INTERVAL, start: '', end: '', items: [] },
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

  // Legacy payloads sent a single `scroller` object; wrap it as a one-banner list.
  const scrollersInput = Array.isArray(body.scrollers)
    ? body.scrollers
    : isRecord(body.scroller) ? [body.scroller] : [];
  if (scrollersInput.length > STOCK_CARD_PROMO_MAX_SCROLLERS) {
    errors.push(`A maximum of ${STOCK_CARD_PROMO_MAX_SCROLLERS} scrolling banners is allowed.`);
  }
  const scrollers = scrollersInput
    .slice(0, STOCK_CARD_PROMO_MAX_SCROLLERS)
    .map((value, index) => parseScrollerBanner(value, index, errors));

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
    ...parseDateWindow(graphicsInput, 'Graphics between cards', errors),
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
      scrollers,
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

  const graphics = isRecord(stored.graphics) ? stored.graphics : {};
  // Legacy stored settings held a single `scroller` object; read it as a one-banner list.
  const storedScrollers = Array.isArray(stored.scrollers)
    ? stored.scrollers
    : isRecord(stored.scroller) && (stored.scroller.enabled === true || stringValue(stored.scroller.text))
      ? [stored.scroller]
      : [];

  return {
    version: 1,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : null,
    wasNowEnabled: stored.wasNowEnabled === true,
    commentsEnabled: stored.commentsEnabled === true,
    badgesEnabled: stored.badgesEnabled === true,
    scrollers: storedScrollers
      .filter(isRecord)
      .slice(0, STOCK_CARD_PROMO_MAX_SCROLLERS)
      .map((banner, index) => ({
        id: cleanBannerId(banner.id, index),
        enabled: banner.enabled !== false,
        text: stringValue(banner.text),
        color: HEX_COLOR_PATTERN.test(stringValue(banner.color)) ? stringValue(banner.color) : DEFAULT_SCROLLER_COLOR,
        make: stringValue(banner.make),
        model: stringValue(banner.model),
        variant: stringValue(banner.variant),
        conditions: parseConditionList(banner.conditions ?? banner.condition),
        fuelTypes: parseFuelList(banner.fuelTypes),
        start: normalizeDate(stringValue(banner.start)),
        end: normalizeDate(stringValue(banner.end)),
      })),
    offers: (Array.isArray(stored.offers) ? stored.offers : [])
      .filter(isRecord)
      .map((offer) => ({
        stockNumber: stringValue(offer.stockNumber),
        wasPrice: normalizeStoredPrice(offer.wasPrice),
        comment: stringValue(offer.comment),
        commentColor: HEX_COLOR_PATTERN.test(stringValue(offer.commentColor)) ? stringValue(offer.commentColor) : DEFAULT_BADGE_COLOR,
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
        fuelType: normalizeFuelType(rule.fuelType),
        discountType: rule.discountType === 'amount' || rule.discountType === 'percent' ? rule.discountType : '' as const,
        discountValue: normalizeStoredDiscount(rule.discountType, rule.discountValue),
        comment: stringValue(rule.comment),
        commentColor: HEX_COLOR_PATTERN.test(stringValue(rule.commentColor)) ? stringValue(rule.commentColor) : DEFAULT_BADGE_COLOR,
        badgeText: stringValue(rule.badgeText),
        badgeColor: HEX_COLOR_PATTERN.test(stringValue(rule.badgeColor)) ? stringValue(rule.badgeColor) : DEFAULT_BADGE_COLOR,
        start: normalizeDate(stringValue(rule.start)),
        end: normalizeDate(stringValue(rule.end)),
      })),
    graphics: {
      enabled: graphics.enabled === true,
      interval: normalizeStoredInterval(graphics.interval),
      start: normalizeDate(stringValue(graphics.start)),
      end: normalizeDate(stringValue(graphics.end)),
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
  /** Raw feed fuel value (e.g. "Petrol - Unleaded ULP"); optional for callers that don't filter on it. */
  fuel?: string;
  price: number;
}

export interface ResolvedCardPromo {
  wasPrice: number | null;
  comment: string;
  commentColor: string;
  badgeText: string;
  badgeColor: string;
  source: 'stock' | 'group';
}

/**
 * Unsaved promo state for rendering a live admin preview on ModernVehicleCard,
 * bypassing the saved settings the card normally fetches.
 */
export interface CardPromoPreview {
  offer: ResolvedCardPromo | null;
  scroller: { text: string; color: string } | null;
  wasNowEnabled: boolean;
  commentsEnabled: boolean;
  badgesEnabled: boolean;
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
        commentColor: offer.commentColor,
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
    commentColor: rule.commentColor,
    badgeText: rule.badgeText,
    badgeColor: rule.badgeColor,
    source: 'group',
  };
}

export interface PromoTarget {
  make: string;
  model: string;
  variant: string;
  /** Single condition (group offers). */
  condition?: '' | PromoCondition;
  /** Multi-select conditions (scrolling banner); empty means all. */
  conditions?: readonly PromoCondition[];
  /** Single fuel type (group offers). */
  fuelType?: '' | PromoFuelType;
  /** Multi-select fuel types (scrolling banner); empty means all. */
  fuelTypes?: readonly PromoFuelType[];
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

  const wantedConditions = target.conditions?.length
    ? target.conditions
    : target.condition ? [target.condition] : [];

  const wantedFuels = target.fuelTypes?.length
    ? target.fuelTypes
    : target.fuelType ? [target.fuelType] : [];

  return (
    matches(target.make, attrs.make)
    && matches(target.model, attrs.model)
    && matches(target.variant, attrs.variant)
    && (!wantedConditions.length || wantedConditions.includes(normalizeCondition(attrs.condition) as PromoCondition))
    && (!wantedFuels.length || wantedFuels.includes(normalizeFuelType(attrs.fuel) as PromoFuelType))
  );
}

/**
 * The scrolling banner for a vehicle card. Banners are ordered; the first
 * enabled, in-window banner whose target matches the vehicle wins.
 * Returns null when no banner applies.
 */
export function resolveCardScroller(
  settings: Pick<StockCardPromoSettings, 'scrollers'>,
  attrs: VehiclePromoAttrs,
  now: Date = new Date(),
): { text: string; color: string } | null {
  for (const banner of settings.scrollers || []) {
    if (!banner.enabled || !banner.text) continue;
    if (!isPromoWindowActive(banner.start || '', banner.end || '', now)) continue;
    if (!matchesPromoTarget(banner, attrs)) continue;
    return { text: banner.text, color: banner.color };
  }
  return null;
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
    commentColor: parseHexColor(offer.commentColor, `${label} comment colour`, DEFAULT_BADGE_COLOR, errors),
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
  const fuelType = normalizeFuelType(rule.fuelType);

  if (!make && !model && !variant && !condition && !fuelType) {
    errors.push(`${label} needs at least one target (make, model, variant, condition or fuel type).`);
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
    fuelType,
    discountType,
    discountValue,
    comment: plainTextValue(rule.comment, MAX_COPY_LENGTHS.comment, `${label} comment`, errors),
    commentColor: parseHexColor(rule.commentColor, `${label} comment colour`, DEFAULT_BADGE_COLOR, errors),
    badgeText: plainTextValue(rule.badgeText, MAX_COPY_LENGTHS.badgeText, `${label} badge text`, errors),
    badgeColor: parseHexColor(rule.badgeColor, `${label} badge colour`, DEFAULT_BADGE_COLOR, errors),
    ...parseDateWindow(rule, label, errors),
  };
}

function parseScrollerBanner(value: unknown, index: number, errors: string[]): StockScrollerBanner {
  const banner = isRecord(value) ? value : {};
  const label = `Scrolling banner ${index + 1}`;
  const enabled = banner.enabled !== false;
  const text = plainTextValue(banner.text, MAX_COPY_LENGTHS.scrollerText, `${label} text`, errors);

  // A disabled banner may be saved as a textless draft; a live one may not.
  if (enabled && !text) {
    errors.push(`${label} needs banner text (or switch it off).`);
  }

  return {
    id: cleanBannerId(banner.id, index),
    enabled,
    text,
    color: parseHexColor(banner.color, `${label} colour`, DEFAULT_SCROLLER_COLOR, errors),
    make: stringValue(banner.make).slice(0, 60),
    model: stringValue(banner.model).slice(0, 60),
    variant: stringValue(banner.variant).slice(0, 60),
    conditions: parseConditionList(banner.conditions ?? banner.condition),
    fuelTypes: parseFuelList(banner.fuelTypes),
    ...parseDateWindow(banner, label, errors),
  };
}

function cleanBannerId(value: unknown, index: number) {
  const id = stringValue(value);
  return /^[a-zA-Z0-9_-]{1,80}$/.test(id) ? id : `banner-${index + 1}`;
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

/** Accepts a single value or an array; legacy stored `condition` strings load fine. */
function parseConditionList(value: unknown): PromoCondition[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const out: PromoCondition[] = [];
  for (const item of raw) {
    const condition = normalizeCondition(item);
    if (condition && !out.includes(condition)) out.push(condition);
  }
  return out;
}

/** Accepts a single value or an array; unknown fuels are dropped. */
function parseFuelList(value: unknown): PromoFuelType[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const out: PromoFuelType[] = [];
  for (const item of raw) {
    const fuel = normalizeFuelType(item);
    if (fuel && !out.includes(fuel)) out.push(fuel);
  }
  return out;
}

/**
 * Buckets the feed's granular fuel strings ("Petrol - Unleaded ULP",
 * "Hybrid-Electric (HEV)") into the four admin-facing fuel types.
 * Hybrid is checked first so HEV/PHEV values don't land in "electric".
 */
export function normalizeFuelType(value: unknown): '' | PromoFuelType {
  const fuel = stringValue(value).toLowerCase();
  if (fuel.includes('hybrid') || fuel.includes('phev') || fuel.includes('plug')) return 'hybrid';
  if (fuel.includes('electric') || fuel === 'ev' || fuel.includes('bev')) return 'electric';
  if (fuel.includes('diesel')) return 'diesel';
  if (fuel.includes('petrol') || fuel.includes('unleaded') || fuel.includes('ulp')) return 'petrol';
  return '';
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
