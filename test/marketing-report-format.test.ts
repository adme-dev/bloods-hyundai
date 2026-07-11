import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatReportDate,
  formatReportShortDate,
  formatReportTimestamp,
  reportDateInTimeZone,
} from '../app/utils/marketingReportFormat.ts';

describe('marketing report date formatting', () => {
  it('formats date-only values without runtime-dependent month names', () => {
    assert.equal(formatReportDate('2026-07-01'), '1 Jul 2026');
    assert.equal(formatReportShortDate('2026-07-11'), '11 Jul');
  });

  it('formats sync timestamps in the dealer timezone deterministically', () => {
    assert.equal(formatReportTimestamp('2026-07-10T18:35:00.000Z'), '11 Jul 04:35');
  });

  it('uses the dealer timezone when deriving the current report date', () => {
    assert.equal(reportDateInTimeZone(new Date('2026-07-10T15:30:00.000Z')), '2026-07-11');
  });
});
