const DEFAULT_HERO_BANNER =
  'https://www.hyundai.com/content/dam/hyundai/au/en/offers-images/2025/2026-retail-offers/104249_DAC_Q1_2026_Web_banners_V1_1920x720.png';

const OFFER_IMAGE_ATTRIBUTE_RE =
  /\b(?:href|src|data-src)=["']([^"']*\/offers-images\/[^"']*\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;

export function prependBaseUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://www.hyundai.com${path}`;
}

export function extractHeroBanner(html: string): string {
  const candidates = [...html.matchAll(OFFER_IMAGE_ATTRIBUTE_RE)]
    .map((match, index) => {
      const matchedUrl = match[1];
      if (!matchedUrl) return null;

      const url = prependBaseUrl(matchedUrl);
      return url
        ? {
            url,
            index,
            score: scoreHeroCandidate(url),
          }
        : null;
    })
    .filter((candidate): candidate is { url: string; index: number; score: number } =>
      Boolean(candidate && candidate.score > 0)
    )
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return candidates[0]?.url || DEFAULT_HERO_BANNER;
}

function scoreHeroCandidate(url: string): number {
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
