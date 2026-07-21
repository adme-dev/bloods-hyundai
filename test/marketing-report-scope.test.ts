import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  SYNTHETIC_MARKETING_LEAD_SOURCES,
  marketingReportDateForInstant,
  resolveMarketingReportRange,
} from '../server/utils/metrics/reportScope.ts';

describe('marketing report CRM scope', () => {
  it('converts selected Melbourne calendar dates to exact UTC query boundaries', () => {
    const range = resolveMarketingReportRange({
      from: '2026-07-01',
      to: '2026-07-21',
    });

    assert.equal(range.from, '2026-07-01');
    assert.equal(range.to, '2026-07-21');
    assert.equal(range.fromDate.toISOString(), '2026-06-30T14:00:00.000Z');
    assert.equal(range.dayAfterTo.toISOString(), '2026-07-21T14:00:00.000Z');
  });

  it('preserves Melbourne daylight-saving transitions', () => {
    const range = resolveMarketingReportRange({
      from: '2026-10-04',
      to: '2026-10-04',
    });

    assert.equal(range.fromDate.toISOString(), '2026-10-03T14:00:00.000Z');
    assert.equal(range.dayAfterTo.toISOString(), '2026-10-04T13:00:00.000Z');
  });

  it('assigns CRM trend records to their Melbourne calendar date', () => {
    assert.equal(
      marketingReportDateForInstant(new Date('2026-07-20T14:30:00.000Z')),
      '2026-07-21',
    );
  });

  it('derives the default month-to-date range in Melbourne time', () => {
    const range = resolveMarketingReportRange({}, new Date('2026-07-10T15:30:00.000Z'));

    assert.equal(range.from, '2026-07-01');
    assert.equal(range.to, '2026-07-11');
  });

  it('retains the report date-range validation contract', () => {
    assert.throws(
      () => resolveMarketingReportRange({ from: '2026-07-22', to: '2026-07-21' }),
      /from must be on or before to/,
    );
    assert.throws(
      () => resolveMarketingReportRange({ from: '2026-02-30', to: '2026-03-01' }),
      /from must be a valid YYYY-MM-DD date/,
    );
    assert.throws(
      () => resolveMarketingReportRange({ from: '2025-01-01', to: '2026-01-02' }),
      /Date range cannot exceed 366 days/,
    );
  });

  it('excludes the canonical live smoke-test source without excluding test-drive enquiries', () => {
    const syntheticSources = new Set<string>(SYNTHETIC_MARKETING_LEAD_SOURCES);

    assert.deepEqual(SYNTHETIC_MARKETING_LEAD_SOURCES, ['live-smoke-test']);
    assert.equal(syntheticSources.has('live-smoke-test'), true);
    assert.equal(syntheticSources.has('calculator-test-drive'), false);
    assert.equal(syntheticSources.has('vehicle-test-drive-modal'), false);
  });

  it('inlines the fixed timezone in the grouped daily CRM query', () => {
    const endpoint = readFileSync(
      new URL('../server/api/admin/analytics/marketing-report.get.ts', import.meta.url),
      'utf8',
    );

    assert.match(endpoint, /sql\.raw\(`'\$\{MARKETING_REPORT_TIME_ZONE\}'`\)/);
    assert.doesNotMatch(
      endpoint,
      /AT TIME ZONE \$\{MARKETING_REPORT_TIME_ZONE\}/,
      'A bound timezone becomes a different PostgreSQL parameter in SELECT, GROUP BY, and ORDER BY',
    );
  });
});
