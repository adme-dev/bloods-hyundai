export const DEFAULT_HERO_BANNER =
  'https://www.hyundai.com/content/dam/hyundai/au/en/offers-images/2025/2026-retail-offers/104249_DAC_Q1_2026_Web_banners_V1_1920x720.png';

const OFFER_IMAGE_ATTRIBUTE_RE =
  /\b(?:href|src|data-src)=["']([^"']*\/offers-images\/[^"']*\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;

interface HeroCandidate {
  url: string;
  index: number;
  desktopScore: number;
  mobileScore: number;
}

export function prependBaseUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://www.hyundai.com${path}`;
}

export function extractHeroBanner(html: string): string {
  return extractHeroBanners(html).desktop;
}

export function extractHeroBanners(html: string): { desktop: string; mobile: string | null } {
  const candidates = extractHeroCandidates(html);
  const desktop = candidates
    .filter((candidate) => candidate.desktopScore > 0)
    .sort((a, b) => b.desktopScore - a.desktopScore || a.index - b.index)[0]?.url;

  const mobile = candidates
    .filter((candidate) => candidate.mobileScore > 0)
    .sort((a, b) => b.mobileScore - a.mobileScore || a.index - b.index)[0]?.url || null;

  return {
    desktop: desktop || DEFAULT_HERO_BANNER,
    mobile,
  };
}

function extractHeroCandidates(html: string): HeroCandidate[] {
  return [...html.matchAll(OFFER_IMAGE_ATTRIBUTE_RE)]
    .map((match, index) => {
      const matchedUrl = match[1];
      if (!matchedUrl) return null;

      const url = prependBaseUrl(matchedUrl);
      return url
        ? {
            url,
            index,
            desktopScore: scoreDesktopHeroCandidate(url),
            mobileScore: scoreMobileHeroCandidate(url),
          }
        : null;
    })
    .filter((candidate): candidate is HeroCandidate => Boolean(candidate));
}

function scoreDesktopHeroCandidate(url: string): number {
  const lowerUrl = url.toLowerCase();
  let score = 0;

  if (!/\.(jpg|jpeg|png|webp)(\?|$)/.test(lowerUrl)) return 0;
  if (!lowerUrl.includes('/offers-images/')) return 0;

  if (/1920x720|1920-?x-?720|1920_720/.test(lowerUrl)) score += 10;
  if (lowerUrl.includes('desktop')) score += 5;
  if (/q[1-4]|gameon|retail-offers/.test(lowerUrl)) score += 2;
  if (/202[6-9]/.test(lowerUrl)) score += 1;

  if (/mobile|767x975|global-nav|menu/.test(lowerUrl)) score -= 10;

  return score >= 10 ? score : 0;
}

function scoreMobileHeroCandidate(url: string): number {
  const lowerUrl = url.toLowerCase();
  let score = 0;

  if (!/\.(jpg|jpeg|png|webp)(\?|$)/.test(lowerUrl)) return 0;
  if (!lowerUrl.includes('/offers-images/')) return 0;

  if (/767x975|767-?x-?975/.test(lowerUrl)) score += 10;
  if (lowerUrl.includes('mobile')) score += 5;
  if (/q[1-4]|gameon|retail-offers/.test(lowerUrl)) score += 2;
  if (/202[6-9]/.test(lowerUrl)) score += 1;

  if (/desktop|1920x720|1920-?x-?720|global-nav|menu/.test(lowerUrl)) score -= 10;

  return score >= 10 ? score : 0;
}
