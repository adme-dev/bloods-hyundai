import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  findOptionPackBackfillDetails,
  mergeOptionPackBackfill,
  needsOptionPackBackfill,
} from '../server/utils/enquiries/optionPackBackfill.ts';

const vehicleInfo = {
  make: 'Hyundai',
  model: 'TUCSON',
  configuration: {
    model: 'TUCSON',
    variant: 'TUCSON NX4 Elite SUV 1.6L T-GDi Hybrid 6-Speed Automatic - FWD',
    variantId: 'variant-elite-fwd',
    optionPack: 'N Line Option Pack',
  },
};

const calculatorData = {
  variants: [
    {
      id: 'variant-elite-fwd',
      name: 'TUCSON NX4 Elite SUV 1.6L T-GDi Hybrid 6-Speed Automatic - FWD',
      variantGroup: 'TUCSON Hybrid Elite',
    },
    {
      id: 'variant-premium-awd',
      name: 'TUCSON NX4 Premium SUV 1.6L T-GDi Hybrid 6-Speed Automatic - AWD',
      variantGroup: 'TUCSON Hybrid Premium',
    },
  ],
  variantGroups: [
    {
      name: 'TUCSON Hybrid Premium',
      optionPacks: [
        {
          id: 'premium-pack',
          optionPackId: 'shared-n-line-id',
          title: 'N Line Option Pack',
          features: [{ text: 'Premium N Line wheel' }],
        },
      ],
    },
    {
      name: 'TUCSON Hybrid Elite',
      optionPacks: [
        {
          id: 'elite-pack',
          optionPackId: 'shared-n-line-id',
          title: 'N Line Option Pack',
          modalImage: '/content/dam/hyundai/elite-n-line.png',
          features: [
            { text: '19 inch N Line alloy wheels' },
            { text: 'N Line sports interior' },
          ],
        },
      ],
    },
  ],
};

describe('enquiry option-pack backfill', () => {
  it('detects calculator leads with an option pack and no feature list', () => {
    assert.equal(needsOptionPackBackfill(vehicleInfo), true);
    assert.equal(needsOptionPackBackfill({
      configuration: {
        optionPack: 'N Line Option Pack',
        optionPackFeatures: ['Already present'],
      },
    }), false);
  });

  it('matches the selected option pack through the stored variant ID', () => {
    const details = findOptionPackBackfillDetails(calculatorData, vehicleInfo);

    assert.equal(details?.optionPackId, 'shared-n-line-id');
    assert.deepEqual(details?.optionPackFeatures, [
      '19 inch N Line alloy wheels',
      'N Line sports interior',
    ]);
    assert.equal(details?.optionPackImage, 'https://www.hyundai.com/content/dam/hyundai/elite-n-line.png');
  });

  it('merges backfilled details into the vehicle configuration', () => {
    const details = findOptionPackBackfillDetails(calculatorData, vehicleInfo);
    assert.ok(details);

    const merged = mergeOptionPackBackfill(vehicleInfo, details, new Date('2026-07-09T00:00:00.000Z'));

    assert.deepEqual(merged.configuration.optionPackFeatures, [
      '19 inch N Line alloy wheels',
      'N Line sports interior',
    ]);
    assert.equal(merged.configuration.optionPackBackfilledAt, '2026-07-09T00:00:00.000Z');
  });
});
