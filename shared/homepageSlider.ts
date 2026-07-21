export const HOMEPAGE_SLIDER_MAX_SLIDES = 12;

export interface HomepageSlide {
  id: string;
  enabled: boolean;
  desktop: string;
  tablet: string;
  mobile: string;
  video: string;
  video_poster: string;
  contrast: '' | 'uk-light' | 'uk-dark';
  postion: 'uk-position-cover' | 'uk-position-center';
  heading_content: string;
  sub_heading: string;
  link: string;
  button_text: string;
  button_colour: '' | 'uk-light' | 'uk-dark';
  start: string;
  end: string;
}

export interface HomepageSliderSettings {
  version: 1;
  enabled: boolean;
  updatedAt: string | null;
  slides: HomepageSlide[];
}

export type HomepageSliderParseResult =
  | { ok: true; value: HomepageSliderSettings }
  | { ok: false; errors: string[] };

interface ParseOptions {
  allowedImageHosts: Set<string>;
  now?: Date;
}

const MAX_COPY_LENGTHS = {
  heading_content: 160,
  sub_heading: 320,
  button_text: 48,
} as const;

export function parseHomepageSliderInput(
  input: unknown,
  options: ParseOptions,
): HomepageSliderParseResult {
  const errors: string[] = [];
  const body = isRecord(input) ? input : {};
  const enabled = body.enabled === true;
  const inputSlides = Array.isArray(body.slides) ? body.slides : [];

  if (inputSlides.length > HOMEPAGE_SLIDER_MAX_SLIDES) {
    errors.push(`A maximum of ${HOMEPAGE_SLIDER_MAX_SLIDES} slides is allowed.`);
  }

  const slides = inputSlides.slice(0, HOMEPAGE_SLIDER_MAX_SLIDES).map((value, index) =>
    parseSlide(value, index, options.allowedImageHosts, errors)
  );

  if (enabled && !slides.some((slide) => slide.enabled)) {
    errors.push('At least one enabled slide is required when custom slider management is enabled.');
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      version: 1,
      enabled,
      updatedAt: (options.now || new Date()).toISOString(),
      slides,
    },
  };
}

export function readHomepageSliderSettings(settings: unknown): HomepageSliderSettings | null {
  if (!isRecord(settings) || !isRecord(settings.homepageSlider)) return null;
  const stored = settings.homepageSlider;
  if (stored.version !== 1 || !Array.isArray(stored.slides)) return null;

  return {
    version: 1,
    enabled: stored.enabled === true,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : null,
    slides: stored.slides.filter(isRecord).map((slide, index) => ({
      id: cleanId(slide.id, index),
      enabled: slide.enabled !== false,
      desktop: stringValue(slide.desktop),
      tablet: stringValue(slide.tablet),
      mobile: stringValue(slide.mobile),
      video: '',
      video_poster: '',
      contrast: normalizeContrast(slide.contrast),
      postion: normalizePosition(slide.postion),
      heading_content: stringValue(slide.heading_content),
      sub_heading: stringValue(slide.sub_heading),
      link: stringValue(slide.link),
      button_text: stringValue(slide.button_text),
      button_colour: normalizeContrast(slide.button_colour),
      start: stringValue(slide.start),
      end: stringValue(slide.end),
    })),
  };
}

export function applyHomepageSliderOverride<T extends Record<string, unknown>>(
  siteConfig: T,
  settings: HomepageSliderSettings | null,
): T {
  if (!settings?.enabled) return siteConfig;

  const currentPromotional = Array.isArray(siteConfig.promotional)
    ? siteConfig.promotional.filter(isRecord)
    : [];
  const firstEntry = currentPromotional[0] || {};
  const publicSlides = settings.slides
    .filter((slide) => slide.enabled)
    .map(toPublicSlide);
  const promotional = [
    { ...firstEntry, slides: publicSlides },
    ...currentPromotional.slice(1),
  ];

  return { ...siteConfig, promotional };
}

function parseSlide(
  value: unknown,
  index: number,
  allowedImageHosts: Set<string>,
  errors: string[],
): HomepageSlide {
  const slide = isRecord(value) ? value : {};
  const label = `Slide ${index + 1}`;
  const desktop = stringValue(slide.desktop);
  const mobile = stringValue(slide.mobile);
  const tablet = stringValue(slide.tablet) || mobile;
  const link = stringValue(slide.link);
  const heading = plainTextValue(slide.heading_content, MAX_COPY_LENGTHS.heading_content, `${label} heading`, errors);
  const subHeading = plainTextValue(slide.sub_heading, MAX_COPY_LENGTHS.sub_heading, `${label} subheading`, errors);
  const buttonText = plainTextValue(slide.button_text, MAX_COPY_LENGTHS.button_text, `${label} button text`, errors);
  const start = normalizeDate(stringValue(slide.start));
  const end = normalizeDate(stringValue(slide.end));

  validateImageUrl(desktop, `${label} desktop image`, allowedImageHosts, errors);
  validateImageUrl(mobile, `${label} mobile image`, allowedImageHosts, errors);
  if (tablet) validateImageUrl(tablet, `${label} tablet image`, allowedImageHosts, errors);
  validateLink(link, label, errors);

  if (stringValue(slide.start) && !start) errors.push(`${label} has an invalid start date.`);
  if (stringValue(slide.end) && !end) errors.push(`${label} has an invalid end date.`);
  if (start && end && toIsoDate(start) > toIsoDate(end)) {
    errors.push(`${label} start date must not be after its end date.`);
  }

  return {
    id: cleanId(slide.id, index),
    enabled: slide.enabled !== false,
    desktop,
    tablet,
    mobile,
    video: '',
    video_poster: '',
    contrast: normalizeContrast(slide.contrast),
    postion: normalizePosition(slide.postion),
    heading_content: heading,
    sub_heading: subHeading,
    link,
    button_text: buttonText,
    button_colour: normalizeContrast(slide.button_colour),
    start,
    end,
  };
}

function toPublicSlide(slide: HomepageSlide) {
  return {
    desktop: slide.desktop,
    tablet: slide.tablet || slide.mobile,
    mobile: slide.mobile,
    video: '',
    video_poster: '',
    contrast: slide.contrast,
    postion: slide.postion,
    heading_content: slide.heading_content,
    sub_heading: slide.sub_heading,
    link: slide.link,
    button_text: slide.button_text,
    button_colour: slide.button_colour,
    start: slide.start,
    end: slide.end,
  };
}

function validateImageUrl(
  value: string,
  label: string,
  allowedImageHosts: Set<string>,
  errors: string[],
) {
  if (!value) {
    errors.push(`${label} is required.`);
    return;
  }

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

function cleanId(value: unknown, index: number) {
  const id = stringValue(value);
  return /^[a-zA-Z0-9_-]{1,80}$/.test(id) ? id : `slide-${index + 1}`;
}

function normalizeContrast(value: unknown): HomepageSlide['contrast'] {
  return value === 'uk-dark' ? 'uk-dark' : value === 'uk-light' ? 'uk-light' : '';
}

function normalizePosition(value: unknown): HomepageSlide['postion'] {
  return value === 'uk-position-center' ? 'uk-position-center' : 'uk-position-cover';
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
