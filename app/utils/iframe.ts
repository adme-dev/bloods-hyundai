const SAFE_IFRAME_SRC = /^https?:\/\//i;

export function extractSafeIframeUrl(input?: string | null): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;

  if (SAFE_IFRAME_SRC.test(trimmed)) {
    return trimmed;
  }

  const srcMatch = trimmed.match(/<iframe[^>]*src\s*=\s*["']([^"']+)["']/i);
  const extracted = srcMatch?.[1]?.trim();
  if (!extracted || !SAFE_IFRAME_SRC.test(extracted)) {
    return null;
  }

  return extracted;
}
