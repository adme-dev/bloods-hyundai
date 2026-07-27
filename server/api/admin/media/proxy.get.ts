/**
 * Media Proxy API
 * GET /api/admin/media/proxy?url=…
 *
 * Streams an allow-listed remote image back through this origin so the admin
 * crop tool can read its pixels. The CDN and R2 buckets don't send
 * Access-Control-Allow-Origin, so fetching them from the browser fails CORS
 * and a direct <img> load taints the canvas — either way canvas.toBlob()
 * cannot produce the crop. Proxying keeps the read same-origin.
 *
 * Deny-by-default: only hosts already trusted for stored image URLs.
 */

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  if (!['admin', 'dealer_admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }

  const raw = getQuery(event).url;
  if (typeof raw !== 'string' || !raw) {
    throw createError({ statusCode: 400, message: 'url is required' });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    throw createError({ statusCode: 400, message: 'url is not a valid URL' });
  }

  // Mirrors the validation applied when these URLs are saved: HTTPS only, no
  // embedded credentials, host must be on the allowlist.
  if (target.protocol !== 'https:' || target.username || target.password
    || !getAllowedImageHosts().has(target.hostname.toLowerCase())) {
    throw createError({ statusCode: 403, message: 'This image host is not allowed.' });
  }

  const response = await fetch(target.toString(), { redirect: 'follow' });
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message: `Could not fetch the image (${response.status}).`,
    });
  }

  const contentType = (response.headers.get('content-type') || '').split(';')[0]!.trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw createError({ statusCode: 415, message: 'That URL is not an image.' });
  }

  const body = Buffer.from(await response.arrayBuffer());
  if (body.byteLength > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 413, message: 'Image is too large to crop.' });
  }

  setHeader(event, 'content-type', contentType);
  setHeader(event, 'cache-control', 'private, max-age=300');
  return body;
});

function getAllowedImageHosts() {
  const config = useRuntimeConfig();
  const hosts = new Set([
    'bloodhyundai.com.au',
    'www.bloodhyundai.com.au',
    'driveagent.b-cdn.net',
    'driveagentmedia.b-cdn.net',
  ]);

  for (const rawUrl of [config.r2PublicUrl, config.public.siteUrl, config.public.cdnUrl]) {
    if (typeof rawUrl !== 'string' || !rawUrl) continue;
    try { hosts.add(new URL(rawUrl).hostname.toLowerCase()); }
    catch { /* Invalid runtime URLs are ignored; validation remains deny-by-default. */ }
  }

  return hosts;
}
