import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enquiryPage = readFileSync(resolve(__dirname, '../app/pages/admin/enquiries/[id].vue'), 'utf8');

describe('admin enquiry hydration', () => {
  it('formats server-rendered enquiry timestamps in a fixed timezone', () => {
    const formatDate = enquiryPage.match(/const formatDate[\s\S]*?^\};/m)?.[0] || '';
    assert.match(formatDate, /timeZone:\s*['"]Australia\/Melbourne['"]/);
  });
});
