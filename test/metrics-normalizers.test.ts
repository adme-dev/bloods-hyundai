import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateStoredGa4Breakdowns, attachGa4Breakdowns, normalizeGa4BreakdownResponse, normalizeGa4Response } from '../server/utils/metrics/ga4.ts';
import { normalizeMetaBreakdownInsights, normalizeMetaCreatives, normalizeMetaInsights } from '../server/utils/metrics/metaAds.ts';
import {
  buildAgeBreakdownGaql,
  buildAreaBreakdownGaql,
  buildAssetGroupGaql,
  buildDeviceBreakdownGaql,
  normalizeGoogleAdsResults,
  normalizeGoogleBreakdownResults,
  normalizeGoogleAreaBreakdownResults,
  normalizeGoogleCreativeAssets,
  flattenSearchStream,
  buildCampaignGaql,
} from '../server/utils/metrics/googleAds.ts';
import {
  aggregateProviderBreakdowns,
  attachProviderBreakdowns,
} from '../server/utils/metrics/providerBreakdowns.ts';

describe('normalizeGa4Response', () => {
  it('maps runReport rows to property-level NormalizedRows', () => {
    const resp = {
      rows: [
        { dimensionValues: [{ value: '20260701' }], metricValues: [{ value: '120' }, { value: '95' }, { value: '7' }] },
        { dimensionValues: [{ value: '20260702' }], metricValues: [{ value: '80' }, { value: '60' }, { value: '3' }] },
      ],
    };
    const rows = normalizeGa4Response(resp);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      platform: 'ga4',
      date: '2026-07-01',
      campaignId: '',
      campaignName: null,
      spend: null,
      impressions: null,
      clicks: null,
      platformLeads: null,
      sessions: 120,
      users: 95,
      conversions: 7,
      raw: resp.rows[0],
    });
  });

  it('returns [] for empty/missing rows', () => {
    assert.deepEqual(normalizeGa4Response({}), []);
    assert.deepEqual(normalizeGa4Response({ rows: [] }), []);
  });
});

describe('normalizeGa4BreakdownResponse', () => {
  it('maps named GA4 dimensions and metrics into stable row objects', () => {
    const rows = normalizeGa4BreakdownResponse({
      dimensionHeaders: [{ name: 'landingPagePlusQueryString' }],
      metricHeaders: [{ name: 'sessions' }, { name: 'engagementRate' }],
      rows: [
        {
          dimensionValues: [{ value: '/new-cars' }],
          metricValues: [{ value: '42' }, { value: '0.625' }],
        },
      ],
    });

    assert.deepEqual(rows, [
      {
        dimensions: { landingPagePlusQueryString: '/new-cars' },
        metrics: { sessions: 42, engagementRate: 0.625 },
      },
    ]);
  });

  it('returns [] for empty/missing breakdown rows', () => {
    assert.deepEqual(normalizeGa4BreakdownResponse({}), []);
    assert.deepEqual(normalizeGa4BreakdownResponse({ rows: [] }), []);
  });
});

describe('GA4 stored breakdown cache', () => {
  it('attaches daily dimension rows and aggregates them across the report range', () => {
    const daily = [
      { platform: 'ga4' as const, date: '2026-07-01', campaignId: '', campaignName: null, spend: null, impressions: null, clicks: null, platformLeads: null, sessions: 10, users: 8, conversions: 2, raw: {} },
      { platform: 'ga4' as const, date: '2026-07-02', campaignId: '', campaignName: null, spend: null, impressions: null, clicks: null, platformLeads: null, sessions: 20, users: 16, conversions: 3, raw: {} },
    ];
    const landing = [
      { dimensions: { date: '20260701', landingPagePlusQueryString: '/offers' }, metrics: { sessions: 4, totalUsers: 3, keyEvents: 1 } },
      { dimensions: { date: '20260702', landingPagePlusQueryString: '/offers' }, metrics: { sessions: 6, totalUsers: 5, keyEvents: 2 } },
    ];
    const devices = [
      { dimensions: { date: '20260701', deviceCategory: 'mobile' }, metrics: { sessions: 7, totalUsers: 6, keyEvents: 1 } },
      { dimensions: { date: '20260702', deviceCategory: 'mobile' }, metrics: { sessions: 11, totalUsers: 9, keyEvents: 2 } },
    ];
    const cached = attachGa4Breakdowns(daily, { topLandingPages: landing, trafficChannels: [], sourceMedium: [], deviceCategories: devices });
    const result = aggregateStoredGa4Breakdowns(cached);

    assert.equal(result.topLandingPages[0]?.dimensions.landingPagePlusQueryString, '/offers');
    assert.equal(result.topLandingPages[0]?.metrics.sessions, 10);
    assert.equal(result.topLandingPages[0]?.metrics.keyEvents, 3);
    assert.equal(result.deviceCategories[0]?.dimensions.deviceCategory, 'mobile');
    assert.equal(result.deviceCategories[0]?.metrics.sessions, 18);
    assert.equal(result.deviceCategories[0]?.metrics.keyEvents, 3);
  });
});

describe('paid provider breakdown cache', () => {
  it('attaches campaign-day breakdowns and aggregates spend by provider and value', () => {
    const daily = [
      { platform: 'meta_ads' as const, date: '2026-07-01', campaignId: 'c1', campaignName: 'EOFY', spend: 10, impressions: 100, clicks: 5, platformLeads: 1, sessions: null, users: null, conversions: null, raw: {} },
      { platform: 'meta_ads' as const, date: '2026-07-02', campaignId: 'c1', campaignName: 'EOFY', spend: 12, impressions: 120, clicks: 6, platformLeads: 1, sessions: null, users: null, conversions: null, raw: {} },
    ];
    const cached = attachProviderBreakdowns(daily, [
      { dimension: 'age', value: '25-34', date: '2026-07-01', campaignId: 'c1', spend: 4, impressions: 40, clicks: 2 },
      { dimension: 'age', value: '25-34', date: '2026-07-02', campaignId: 'c1', spend: 6, impressions: 60, clicks: 3 },
      { dimension: 'device', value: 'mobile', date: '2026-07-02', campaignId: 'c1', spend: 8, impressions: 80, clicks: 4 },
    ]);

    assert.deepEqual(aggregateProviderBreakdowns(cached), {
      age: [{ platform: 'meta_ads', value: '25-34', spend: 10, impressions: 100, clicks: 5 }],
      device: [{ platform: 'meta_ads', value: 'mobile', spend: 8, impressions: 80, clicks: 4 }],
      area: [],
    });
  });

  it('ignores malformed cached values instead of emitting fabricated totals', () => {
    const rows = [{
      platform: 'google_ads' as const, date: '2026-07-01', campaignId: 'c1', campaignName: 'Brand', spend: 10,
      impressions: 100, clicks: 5, platformLeads: 1, sessions: null, users: null, conversions: null,
      raw: { providerBreakdowns: [{ dimension: 'age', value: '', spend: 'bad' }] },
    }];
    assert.deepEqual(aggregateProviderBreakdowns(rows), { age: [], device: [], area: [] });
  });

  it('marks an attempted empty cache and rejects non-finite provider metrics', () => {
    const daily = [{
      platform: 'meta_ads' as const, date: '2026-07-01', campaignId: 'c1', campaignName: 'EOFY', spend: 10,
      impressions: 100, clicks: 5, platformLeads: 1, sessions: null, users: null, conversions: null, raw: {},
    }];
    const [cached] = attachProviderBreakdowns(daily, [
      { dimension: 'age', value: '25-34', date: '2026-07-01', campaignId: 'c1', spend: Number.NaN, impressions: 20, clicks: 2 },
    ]);
    assert.deepEqual(cached?.raw, { providerBreakdowns: [] });
  });
});

describe('normalizeMetaInsights', () => {
  const insight = {
    campaign_id: '238461',
    campaign_name: 'July i30 Runout',
    date_start: '2026-07-02',
    date_stop: '2026-07-02',
    spend: '142.57',
    impressions: '9021',
    clicks: '311',
    actions: [
      { action_type: 'lead', value: '4' },
      { action_type: 'offsite_conversion.fb_pixel_lead', value: '2' },
      { action_type: 'leads_retrieval', value: '1' },
      { action_type: 'link_click', value: '250' },
    ],
  };

  it('maps campaign-day insights and sums only lead action types', () => {
    const rows = normalizeMetaInsights([insight]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      platform: 'meta_ads',
      date: '2026-07-02',
      campaignId: '238461',
      campaignName: 'July i30 Runout',
      spend: 142.57,
      impressions: 9021,
      clicks: 311,
      platformLeads: 7,
      sessions: null,
      users: null,
      conversions: null,
      raw: insight,
    });
  });

  it('handles missing actions and empty input', () => {
    const rows = normalizeMetaInsights([{ ...insight, actions: undefined }]);
    assert.equal(rows[0]!.platformLeads, 0);
    assert.deepEqual(normalizeMetaInsights([]), []);
  });
});

describe('normalizeMetaCreatives', () => {
  it('extracts the real image or video thumbnail and campaign identity', () => {
    const result = normalizeMetaCreatives([{ id: 'ad-1', name: 'EOFY video', campaign_id: 'campaign-1', campaign: { name: 'EOFY' }, creative: {
      id: 'creative-1', name: 'IONIQ 5 video', image_url: 'https://scontent.example/direct.jpg',
      thumbnail_url: 'https://external-ord5-2.xx.fbcdn.net/emg1/v/t13/2898335607006425892', video_id: 'video-1',
    } }]);

    assert.deepEqual(result, [{
      id: 'meta:ad-1:creative-1', platform: 'meta_ads', campaignId: 'campaign-1', campaignName: 'EOFY',
      title: 'EOFY video', mediaType: 'video', imageUrl: 'https://scontent.example/direct.jpg', videoUrl: null,
      performanceLabel: null,
    }]);
  });

  it('uses the durable original URL inside a Meta thumbnail proxy', () => {
    const durableUrl = 'https://www.facebook.com/ads/image/?d=AQIEgXXZ1cWrf';
    const thumbnailUrl = `https://external-ord5-2.xx.fbcdn.net/emg1/v/t13/2898335607006425892?url=${encodeURIComponent(durableUrl)}&ccb=13`;
    const [result] = normalizeMetaCreatives([{ id: 'ad-2', campaign_id: 'campaign-2', creative: {
      id: 'creative-2', thumbnail_url: thumbnailUrl,
    } }]);

    assert.equal(result?.imageUrl, durableUrl);
  });
});

describe('normalizeMetaBreakdownInsights', () => {
  it('maps Meta age, device and region rows to the shared cache contract', () => {
    assert.deepEqual(normalizeMetaBreakdownInsights('age', [{
      campaign_id: 'c1', date_start: '2026-07-02', age: '25-34', spend: '12.40', impressions: '800', clicks: '21',
    }]), [{ dimension: 'age', value: '25-34', date: '2026-07-02', campaignId: 'c1', spend: 12.4, impressions: 800, clicks: 21 }]);
    assert.equal(normalizeMetaBreakdownInsights('device', [{ impression_device: 'mobile_app' }])[0]?.value, 'Mobile App');
    assert.equal(normalizeMetaBreakdownInsights('area', [{ region: 'Victoria' }])[0]?.value, 'Victoria');
  });
});

describe('googleAds helpers', () => {
  // REST searchStream returns camelCase (costMicros), NOT GAQL snake_case.
  const result = {
    campaign: { id: '99887', name: 'Brand - Werribee' },
    metrics: { costMicros: '84213000', impressions: '4100', clicks: '190', conversions: 5.0 },
    segments: { date: '2026-07-03' },
  };

  it('normalizes searchStream results (costMicros -> AUD spend)', () => {
    const rows = normalizeGoogleAdsResults([result]);
    assert.deepEqual(rows[0], {
      platform: 'google_ads',
      date: '2026-07-03',
      campaignId: '99887',
      campaignName: 'Brand - Werribee',
      spend: 84.21,
      impressions: 4100,
      clicks: 190,
      platformLeads: 5,
      sessions: null,
      users: null,
      conversions: null,
      raw: result,
    });
  });

  it('flattens searchStream batch arrays', () => {
    assert.deepEqual(
      flattenSearchStream([{ results: [1, 2] }, { results: [3] }, {}]),
      [1, 2, 3],
    );
    assert.deepEqual(flattenSearchStream(undefined), []);
  });

  it('builds a campaign GAQL query for the range', () => {
    const q = buildCampaignGaql({ from: '2026-07-01', to: '2026-07-09' });
    assert.match(q, /FROM campaign/);
    assert.match(q, /segments\.date BETWEEN '2026-07-01' AND '2026-07-09'/);
    assert.match(q, /metrics\.cost_micros/);
    assert.match(q, /metrics\.average_cpc/);
    assert.match(q, /metrics\.cost_per_conversion/);
    assert.match(q, /metrics\.search_impression_share/);
  });

  it('builds and normalizes Google age and device breakdowns', () => {
    assert.match(buildAgeBreakdownGaql({ from: '2026-07-01', to: '2026-07-09' }), /FROM age_range_view/);
    assert.match(buildDeviceBreakdownGaql({ from: '2026-07-01', to: '2026-07-09' }), /segments\.device/);
    assert.deepEqual(normalizeGoogleBreakdownResults('device', [{
      campaign: { id: '99887' }, segments: { date: '2026-07-03', device: 'MOBILE' },
      metrics: { costMicros: '2500000', impressions: '200', clicks: '9' },
    }]), [{ dimension: 'device', value: 'Mobile', date: '2026-07-03', campaignId: '99887', spend: 2.5, impressions: 200, clicks: 9 }]);
  });

  it('builds and normalizes Google region breakdowns using resolved geo names', () => {
    assert.match(buildAreaBreakdownGaql({ from: '2026-07-01', to: '2026-07-09' }), /FROM user_location_view/);
    assert.deepEqual(normalizeGoogleAreaBreakdownResults([{
      campaign: { id: '99887' }, segments: { date: '2026-07-03', geoTargetRegion: 'geoTargetConstants/2036' },
      metrics: { costMicros: '3750000', impressions: '320', clicks: '12' },
    }], [{ geoTargetConstant: { resourceName: 'geoTargetConstants/2036', canonicalName: 'Victoria, Australia' } }]), [{
      dimension: 'area', value: 'Victoria, Australia', date: '2026-07-03', campaignId: '99887', spend: 3.75, impressions: 320, clicks: 12,
    }]);
  });

  it('builds and normalizes the Performance Max image asset query', () => {
    const q = buildAssetGroupGaql();
    assert.match(q, /FROM asset_group_asset/);
    assert.match(q, /asset\.image_asset\.full_size\.url/);
    assert.match(q, /asset_group_asset\.status != 'REMOVED'/);

    const assets = normalizeGoogleCreativeAssets([{ campaign: { id: '99887', name: 'PMax' }, asset: {
      id: 'asset-1', name: 'Venue image', type: 'IMAGE', imageAsset: { fullSize: { url: 'https://googleusercontent.example/venue.jpg' } },
    }, assetGroupAsset: { fieldType: 'MARKETING_IMAGE', performanceLabel: 'BEST' } }]);
    assert.deepEqual(assets, [{
      id: 'google:99887:asset-1', platform: 'google_ads', campaignId: '99887', campaignName: 'PMax',
      title: 'Venue image', mediaType: 'image', imageUrl: 'https://googleusercontent.example/venue.jpg', videoUrl: null,
      performanceLabel: 'BEST',
    }]);
  });
});
