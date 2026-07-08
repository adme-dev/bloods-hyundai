const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Validate/normalize an IP address before writing it to the `inet` column.
 * `getRequestIP({ xForwardedFor: true })` trusts a client-controlled header,
 * so a spoofed non-IP value would otherwise throw on insert and drop the lead.
 * Returns a valid IP string, or null when the value isn't a usable IP.
 */
export function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // X-Forwarded-For may be a comma-separated chain; take the first entry.
  const first = String(ip).split(',')[0]?.trim() ?? '';
  if (!first) return null;

  const v4 = IPV4.exec(first);
  if (v4) {
    const octetsValid = v4.slice(1).every((o) => {
      const n = Number(o);
      return n >= 0 && n <= 255 && String(n) === String(Number(o));
    });
    return octetsValid ? first : null;
  }

  // Loose IPv6 acceptance: hex groups and colons only (Postgres validates further).
  if (first.includes(':') && /^[0-9a-fA-F:.]+$/.test(first)) {
    return first;
  }

  return null;
}
