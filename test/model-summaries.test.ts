import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toModelSummaries } from '../server/utils/modelSummaries.ts';

describe('toModelSummaries', () => {
  it('keeps homepage model fields and drops heavy variant details', () => {
    const result = toModelSummaries({
      success: true,
      vehicleCategories: ['Electric'],
      variants: [
        {
          id: 'model-1',
          modelId: 'model-1',
          name: 'IONIQ 5',
          slug: 'ioniq-5',
          category: 'Electric',
          categoryDescription: 'Electric vehicles',
          image: 'https://example.com/ioniq-5.png',
          features: [{ title: 'Heavy details' }],
          offers: [{ title: 'Offer payload' }],
          order: 2,
        },
      ],
    });

    assert.equal(result.success, true);
    assert.equal(result.models.length, 1);
    assert.deepEqual(result.vehicleCategories, ['Electric']);
    assert.equal(result.models[0].title.rendered, 'IONIQ 5');
    assert.equal(result.models[0].model_image, 'https://example.com/ioniq-5.png');
    assert.equal(result.models[0].caption, 'Electric vehicles');
    assert.equal(result.models[0].vehiclecat, 'Electric');
    assert.equal('features' in result.models[0], false);
    assert.equal('offers' in result.models[0], false);
  });
});
