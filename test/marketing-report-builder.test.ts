import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportBuilderRows,
  normalizeReportBuilderSelection,
  sortReportBuilderRows,
} from '../app/utils/marketingReportBuilder.ts';

const report = {
  campaigns: [
    { platform: 'google_ads', campaignName: 'Search', spend: 120, impressions: 2_000, clicks: 100, crmLeads: 4 },
    { platform: 'meta_ads', campaignName: 'Social', spend: 60, impressions: 3_000, clicks: 90, crmLeads: 0 },
  ],
  summary: { totalCrmLeads: 4 },
  platformMetrics: {
    google_ads: { crmLeads: 4 },
    meta_ads: { crmLeads: 0 },
  },
  audienceBreakdowns: {
    age: [
      { platform: 'google_ads', value: '25–34', spend: 50, impressions: 1_000, clicks: 40 },
      { platform: 'google_ads', value: '25–34', spend: 20, impressions: 500, clicks: 10 },
    ],
    area: [],
    device: [],
  },
  websiteAnalytics: {
    topLandingPages: [
      { dimensions: { landingPagePlusQueryString: '/' }, metrics: { sessions: 200, totalUsers: 150, keyEvents: 12 } },
    ],
    sourceMedium: [
      { dimensions: { sessionSourceMedium: 'google / organic' }, metrics: { sessions: 90, totalUsers: 70, keyEvents: 4 } },
    ],
    deviceCategories: [
      { dimensions: { deviceCategory: 'mobile' }, metrics: { sessions: 140, totalUsers: 110, keyEvents: 8 } },
    ],
  },
  professionalMetrics: {
    ga4Website: { sessions: 200, users: 150, keyEvents: 12 },
  },
};

describe('Marketing report builder', () => {
  it('builds campaign rows from real campaign values and derives ratios safely', () => {
    const rows = buildReportBuilderRows(report, ['platform', 'campaign'], ['spend', 'crm_leads', 'cpl', 'ctr']);

    assert.deepEqual(rows[0], {
      key: 'google_ads\u0000Search',
      dimensions: { platform: 'google_ads', campaign: 'Search' },
      metrics: { spend: 120, crm_leads: 4, cpl: 30, ctr: 5 },
    });
    assert.equal(rows[1]?.metrics.cpl, null);
    assert.equal(rows[1]?.metrics.ctr, 3);
  });

  it('reconciles campaign rows to every CRM lead without fabricating unavailable spend', () => {
    const rows = buildReportBuilderRows({
      ...report,
      campaigns: [
        { platform: 'google_ads', campaignName: 'Search', spend: 120, impressions: 2_000, clicks: 100, crmLeads: 0 },
        { platform: 'meta_ads', campaignName: 'Social', spend: 60, impressions: 3_000, clicks: 90, crmLeads: 0 },
      ],
      summary: { totalCrmLeads: 9 },
      platformMetrics: {
        google_ads: { crmLeads: 2 },
        meta_ads: { crmLeads: 0 },
      },
    }, ['platform', 'campaign'], ['spend', 'crm_leads', 'cpl']);

    assert.equal(
      rows.reduce((total, row) => total + (row.metrics.crm_leads || 0), 0),
      9,
    );
    assert.deepEqual(
      rows.find(row => row.dimensions.platform === 'google_ads' && row.dimensions.campaign === 'Campaign unavailable'),
      {
        key: 'google_ads\u0000Campaign unavailable',
        dimensions: { platform: 'google_ads', campaign: 'Campaign unavailable' },
        metrics: { spend: null, crm_leads: 2, cpl: null },
      },
    );
    assert.deepEqual(
      rows.find(row => row.dimensions.platform === 'crm'),
      {
        key: 'crm\u0000No paid campaign attribution',
        dimensions: { platform: 'crm', campaign: 'No paid campaign attribution' },
        metrics: { spend: null, crm_leads: 7, cpl: null },
      },
    );
  });

  it('aggregates duplicate audience rows before calculating CTR', () => {
    const rows = buildReportBuilderRows(report, ['platform', 'age'], ['spend', 'clicks', 'impressions', 'ctr']);

    assert.deepEqual(rows, [{
      key: 'google_ads\u000025–34',
      dimensions: { platform: 'google_ads', age: '25–34' },
      metrics: { spend: 70, clicks: 50, impressions: 1_500, ctr: 50 / 1_500 * 100 },
    }]);
  });

  it('uses GA4 breakdown metrics without manufacturing paid-media values', () => {
    const rows = buildReportBuilderRows(report, ['platform', 'landing_page'], ['sessions', 'users', 'key_events']);

    assert.deepEqual(rows, [{
      key: 'ga4\u0000/',
      dimensions: { platform: 'ga4', landing_page: '/' },
      metrics: { sessions: 200, users: 150, key_events: 12 },
    }]);
  });

  it('builds Website device rows from cached GA4 device categories', () => {
    const rows = buildReportBuilderRows(report, ['website_device'], ['sessions', 'users', 'key_events']);

    assert.deepEqual(rows, [{
      key: 'mobile',
      dimensions: { website_device: 'mobile' },
      metrics: { sessions: 140, users: 110, key_events: 8 },
    }]);
  });

  it('normalizes incompatible selections to a valid real-data model', () => {
    assert.deepEqual(
      normalizeReportBuilderSelection(['platform', 'landing_page'], ['spend', 'sessions']),
      { dimensions: ['platform', 'landing_page'], metrics: ['sessions'] },
    );
    assert.deepEqual(
      normalizeReportBuilderSelection(['age', 'source_medium'], ['crm_leads']),
      { dimensions: ['source_medium'], metrics: ['sessions'] },
    );
    assert.deepEqual(
      normalizeReportBuilderSelection([], []),
      { dimensions: ['platform'], metrics: ['spend'] },
    );
  });

  it('sorts nulls after real values in both directions', () => {
    const rows = buildReportBuilderRows(report, ['platform', 'campaign'], ['cpl']);

    assert.equal(sortReportBuilderRows(rows, 'cpl', 'desc')[0]?.dimensions.campaign, 'Search');
    assert.equal(sortReportBuilderRows(rows, 'cpl', 'asc').at(-1)?.dimensions.campaign, 'Social');
  });
});
