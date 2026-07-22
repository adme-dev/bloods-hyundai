/**
 * TEMPORARY diagnostics for the media library storage connection.
 * GET /api/admin/media/diagnostics (admin auth required)
 *
 * Reports which R2 configuration the running server actually resolves
 * (masked — never the secret) and the raw result of a live bucket check,
 * so environment issues can be diagnosed without guessing.
 */
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || !event.context.dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const config = useRuntimeConfig();
  const accountId = firstOf([
    ['runtimeConfig.cloudflareAccountId', config.cloudflareAccountId],
    ['env.CLOUDFLARE_ACCOUNT_ID', process.env.CLOUDFLARE_ACCOUNT_ID],
    ['env.CLOUDFLARE_R2_ACCOUNT_ID', process.env.CLOUDFLARE_R2_ACCOUNT_ID],
  ]);
  const accessKeyId = firstOf([
    ['runtimeConfig.r2AccessKeyId', config.r2AccessKeyId],
    ['env.R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID],
    ['env.CLOUDFLARE_R2_ACCESS_KEY', process.env.CLOUDFLARE_R2_ACCESS_KEY],
  ]);
  const secretAccessKey = firstOf([
    ['runtimeConfig.r2SecretAccessKey', config.r2SecretAccessKey],
    ['env.R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY],
    ['env.CLOUDFLARE_R2_SECRET_KEY', process.env.CLOUDFLARE_R2_SECRET_KEY],
  ]);
  const bucket = firstOf([
    ['runtimeConfig.r2BucketName', config.r2BucketName],
    ['env.R2_BUCKET_NAME', process.env.R2_BUCKET_NAME],
    ['env.CLOUDFLARE_R2_BUCKET', process.env.CLOUDFLARE_R2_BUCKET],
  ]);

  const summary = {
    accountId: mask(accountId.value),
    accountIdSource: accountId.source,
    accessKeyId: mask(accessKeyId.value),
    accessKeyIdLength: accessKeyId.value.length,
    accessKeyIdSource: accessKeyId.source,
    secretLength: secretAccessKey.value.length,
    secretSource: secretAccessKey.source,
    bucket: bucket.value,
    bucketSource: bucket.source,
    endpoint: accountId.value ? `https://${mask(accountId.value)}.r2.cloudflarestorage.com` : '(no account id)',
    nodeVersion: process.version,
  };

  let bucketCheck: Record<string, unknown>;
  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId.value}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId.value, secretAccessKey: secretAccessKey.value },
      forcePathStyle: true,
    });
    const result = await client.send(new ListObjectsV2Command({ Bucket: bucket.value, MaxKeys: 1 }));
    bucketCheck = { ok: true, objectsVisible: result.KeyCount ?? 0 };
  } catch (error: any) {
    bucketCheck = {
      ok: false,
      errorName: error?.name || 'Unknown',
      errorMessage: error?.message || String(error),
      httpStatus: error?.$metadata?.httpStatusCode ?? null,
    };
  }

  setResponseHeader(event, 'Cache-Control', 'no-store');
  return { summary, bucketCheck };
});

function firstOf(candidates: [string, unknown][]): { value: string; source: string } {
  for (const [source, value] of candidates) {
    if (typeof value === 'string' && value.trim()) return { value: value.trim(), source };
  }
  return { value: '', source: '(none set)' };
}

function mask(value: string): string {
  if (!value) return '(empty)';
  if (value.length <= 8) return `${value.slice(0, 2)}…`;
  return `${value.slice(0, 6)}…${value.slice(-4)} (len ${value.length})`;
}
