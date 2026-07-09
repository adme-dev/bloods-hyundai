import { isDateInRangeAt } from './date';

export interface FrontSlide {
  desktop?: string;
  tablet?: string;
  mobile?: string;
  video?: string;
  video_poster?: string;
  contrast?: string;
  postion?: string;
  heading_content?: string;
  sub_heading?: string;
  link?: string;
  button_text?: string;
  button?: string;
  button_colour?: string;
  start?: string;
  end?: string;
  [key: string]: unknown;
}

export interface OffersHeroImage {
  desktop?: string | null;
  mobile?: string | null;
  heroBanner?: string | null;
}

interface ResolveHomeSlidesOptions {
  siteName?: string | null;
  offersHero?: OffersHeroImage | null;
  now?: Date;
}

interface PromotionalEntry {
  slides?: unknown;
  footerbanner?: unknown;
  footerblocks?: unknown;
  thumbs?: unknown;
}

function normalizePromotionalSource(source: unknown): PromotionalEntry[] {
  if (Array.isArray(source)) {
    return source.filter((entry): entry is PromotionalEntry =>
      entry && typeof entry === 'object'
    );
  }

  if (source && typeof source === 'object') {
    const entry = source as Record<string, unknown>;

    // Handle legacy shape where promotional object is wrapped in known keys.
    if (entry.slides || entry.footerbanner || entry.footerblocks || entry.thumbs) {
      return [entry as PromotionalEntry];
    }
  }

  return [];
}

export interface FrontThumb {
  image: string;
  link?: string;
  content?: string;
  button_text?: string;
  start?: string;
  end?: string;
}

export function getConfiguredFrontSlides(source: unknown): FrontSlide[] {
  const normalized = normalizePromotionalSource(source);

  return normalized
    .flatMap((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return [];

      const item = entry as Record<string, unknown>;

      const legacySlides = Array.isArray(item.slides) ? item.slides : [];
      const footerblockSlides = Array.isArray(item.footerblocks) ? item.footerblocks : [];

      const mapped = [
        ...legacySlides.map(mapSlideConfig),
        ...footerblockSlides.map((block) => mapFooterBlockSlide(block)),
      ];

      return mapped.filter(isRenderableSlide);
    })
    .filter(isRenderableSlide);
}

export function getConfiguredFrontThumbs(source: unknown): FrontThumb[] {
  const normalized = normalizePromotionalSource(source);

  return normalized
    .flatMap((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return [];
      const item = entry as Record<string, unknown>;

      const thumbs = Array.isArray(item.thumbs) ? item.thumbs : [];
      return thumbs.map((thumb) => mapThumb(thumb)).filter(isRenderableThumb);
    })
    .filter(isRenderableThumb);
}

export function resolveHomeSlides(source: unknown, options: ResolveHomeSlidesOptions = {}): FrontSlide[] {
  const now = options.now || new Date();
  const activeSlides = getConfiguredFrontSlides(source).filter((slide) =>
    isDateInRangeAt(slide.start, slide.end, now)
  );

  if (activeSlides.length) {
    return activeSlides;
  }

  if (!isBloodHyundai(options.siteName)) {
    return [];
  }

  const offersSlide = createOffersHeroSlide(options.offersHero);
  return offersSlide ? [offersSlide] : [];
}

export function shouldFetchOffersHero(source: unknown, siteName?: string | null, now: Date = new Date()): boolean {
  if (!isBloodHyundai(siteName)) return false;

  return getConfiguredFrontSlides(source).every((slide) =>
    !isDateInRangeAt(slide.start, slide.end, now)
  );
}

function createOffersHeroSlide(hero?: OffersHeroImage | null): FrontSlide | null {
  const desktop = hero?.desktop || hero?.heroBanner;
  if (!desktop) return null;

  return {
    desktop,
    tablet: hero?.mobile || desktop,
    mobile: hero?.mobile || desktop,
    contrast: 'uk-light',
    postion: 'uk-position-cover',
    heading_content: '',
    sub_heading: '',
    link: '/special-offers',
    button_text: 'Explore Offers',
  };
}

function mapSlideConfig(slide: unknown): FrontSlide {
  if (!slide || typeof slide !== 'object') return {};
  const item = slide as Record<string, unknown>;

  return {
    desktop: pickFirstString(item.desktop, item.image, item.slides, item.slide),
    tablet: pickFirstString(item.tablet, item.mobile_img, item.mobileImage),
    mobile: pickFirstString(item.mobile, item.mobile_img, item.mobileImage),
    video: pickFirstString(item.video),
    video_poster: pickFirstString(item.video_poster, item.videoPoster),
    contrast: pickFirstString(item.contrast, item.text_contrast, item.textContrast),
    postion: pickFirstString(item.postion, item.position),
    heading_content: pickFirstString(item.heading_content, item.heading),
    sub_heading: pickFirstString(item.sub_heading, item.content),
    link: pickFirstString(item.link, item.page_link),
    button_text: pickFirstString(item.button_text, item.button),
    button_colour: pickFirstString(item.button_colour, item.button_color),
    start: pickFirstString(item.start, item.start_date),
    end: pickFirstString(item.end, item.end_date),
  };
}

function mapFooterBlockSlide(slide: unknown): FrontSlide {
  if (!slide || typeof slide !== 'object') return {};

  const item = slide as Record<string, unknown>;

  return {
    desktop: pickFirstString(item.slides, item.desktop),
    tablet: pickFirstString(item.desktop, item.mobile_img, item.mobileImage),
    mobile: pickFirstString(item.mobile_img, item.mobile, item.slides),
    heading_content: pickFirstString(item.heading_content, item.heading),
    sub_heading: pickFirstString(item.sub_heading, item.content),
    link: pickFirstString(item.link, item.page_link),
    button_text: pickFirstString(item.button),
    button_colour: pickFirstString(item.text_contrast, item.contrast),
    start: pickFirstString(item.start_date, item.start),
    end: pickFirstString(item.end_date, item.end),
  };
}

function mapThumb(thumb: unknown): FrontThumb {
  if (!thumb || typeof thumb !== 'object') return {} as FrontThumb;

  const item = thumb as Record<string, unknown>;

  return {
    image: pickFirstString(
      item.image,
      item.img,
      item.src,
      item.url,
      item.thumbnail,
      item.desktop
    ) || '',
    link: pickFirstString(item.link, item.href, item.to),
    content: pickFirstString(item.content, item.title, item.heading_content, item.heading),
    button_text: pickFirstString(item.button_text, item.button, item.cta),
    start: pickFirstString(item.start, item.start_date),
    end: pickFirstString(item.end, item.end_date),
  };
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function isRenderableThumb(thumb: unknown): thumb is FrontThumb {
  return Boolean(thumb && typeof thumb === 'object' && (thumb as FrontThumb).image);
}

function isBloodHyundai(siteName?: string | null): boolean {
  return /blood'?s?\s+hyundai/i.test(siteName || '');
}

function isRenderableSlide(slide: unknown): slide is FrontSlide {
  if (!slide || typeof slide !== 'object') return false;
  const candidate = slide as FrontSlide;
  return Boolean(candidate.desktop || candidate.mobile || candidate.video);
}
