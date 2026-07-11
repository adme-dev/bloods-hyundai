import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  attachCreativeMedia,
  collectCreativeMedia,
  type CreativeMedia,
} from '../server/utils/metrics/creativeMedia.ts';

const image: CreativeMedia = {
  id: 'creative-1',
  platform: 'meta_ads',
  campaignId: 'campaign-1',
  campaignName: 'July offers',
  title: 'i30 offer',
  mediaType: 'image',
  imageUrl: 'https://scontent.example/i30.jpg',
  videoUrl: null,
  performanceLabel: null,
};

describe('creative media cache', () => {
  it('attaches matching assets without replacing provider metrics', () => {
    const rows = [{
      platform: 'meta_ads' as const,
      date: '2026-07-11',
      campaignId: 'campaign-1',
      campaignName: 'July offers',
      spend: 20,
      impressions: 1000,
      clicks: 25,
      platformLeads: 2,
      sessions: null,
      users: null,
      conversions: null,
      raw: { actions: [{ action_type: 'lead', value: '2' }] },
    }];

    const attached = attachCreativeMedia(rows, [image]);

    assert.deepEqual((attached[0]!.raw as any).actions, rows[0]!.raw.actions);
    assert.deepEqual((attached[0]!.raw as any).creativeMedia, [image]);
  });

  it('deduplicates cached assets and joins campaign spend and CTR', () => {
    const rows = [
      { platform: 'meta_ads', campaignId: 'campaign-1', raw: { creativeMedia: [image] } },
      { platform: 'meta_ads', campaignId: 'campaign-1', raw: { creativeMedia: [image] } },
    ];
    const campaigns = [{
      platform: 'meta_ads', campaignId: 'campaign-1', campaignName: 'July offers',
      spend: 42.5, impressions: 2000, clicks: 50, ctr: 2.5,
    }];

    assert.deepEqual(collectCreativeMedia(rows, campaigns), [{ ...image, spend: 42.5, ctr: 2.5 }]);
  });

  it('drops unsafe and malformed media records read from stored JSON', () => {
    const rows = [{
      platform: 'meta_ads', campaignId: 'campaign-1',
      raw: { creativeMedia: [{ ...image, imageUrl: 'javascript:alert(1)' }, { ...image, id: '' }] },
    }];

    assert.deepEqual(collectCreativeMedia(rows, []), []);
  });

  it('caps the cached media attached to each campaign', () => {
    const rows = [{
      platform: 'meta_ads' as const, date: '2026-07-11', campaignId: 'campaign-1', campaignName: 'July offers',
      spend: 20, impressions: 1000, clicks: 25, platformLeads: 2, sessions: null, users: null, conversions: null, raw: {},
    }];
    const media = Array.from({ length: 20 }, (_, index) => ({ ...image, id: `creative-${index}` }));

    const attached = attachCreativeMedia(rows, media);

    assert.equal((attached[0]!.raw as any).creativeMedia.length, 12);
  });
});
