import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(
  resolve(__dirname, '../app/pages/admin/settings/email.vue'),
  'utf8',
);
const createSenderSource = readFileSync(
  resolve(__dirname, '../server/api/admin/sendgrid/senders.post.ts'),
  'utf8',
);

describe('Email settings UI', () => {
  it('does not show the unrelated cdmg.com.au authenticated domain', () => {
    assert.match(pageSource, /domain\.valid\s*&&\s*domain\.domain\s*!==\s*['"]cdmg\.com\.au['"]/);
  });

  it('shows provider failures instead of presenting them as empty connection lists', () => {
    assert.match(pageSource, /sendersError/);
    assert.match(pageSource, /domainsError/);
    assert.match(pageSource, /Could not load verified senders/);
    assert.match(pageSource, /Could not load authenticated domains/);
  });

  it('never substitutes dummy business-address data when creating a sender', () => {
    assert.doesNotMatch(createSenderSource, /123 Main Street|Sydney|NSW|2000/);
    assert.match(
      createSenderSource,
      /\[\s*nickname,\s*fromEmail,\s*fromName,\s*address,\s*city,\s*state,\s*zip,\s*country,?\s*\]\.every/,
    );
    assert.match(createSenderSource, /address:\s*address\.trim\(\)/);
    assert.match(createSenderSource, /city:\s*city\.trim\(\)/);
    assert.match(createSenderSource, /state:\s*state\.trim\(\)/);
    assert.match(createSenderSource, /zip:\s*zip\.trim\(\)/);
  });
});
