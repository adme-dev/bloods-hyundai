import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readVehicleDescriptionSettings, resolveVehicleDescriptionSections, isVehicleDescriptionMode } from '../shared/vehicleDescriptions.ts';

describe('vehicle description display', () => {
  const comments = 'RUNOUT BONUS APPLIES\r\n\n';
  const ai = 'The Hyundai i30 is a hybrid sedan.';

  it('keeps verbatim dealer comments first when AI arrives', () => {
    const before = resolveVehicleDescriptionSections({ Comments: comments }, undefined, 'both');
    const after = resolveVehicleDescriptionSections({ Comments: comments }, ai, 'both');
    assert.deepEqual(before, [{ title: 'Dealer Comments', text: comments }]);
    assert.deepEqual(after, [...before, { title: 'Description', text: ai }]);
  });

  it('never shows AI in dealer-only mode', () => {
    assert.deepEqual(resolveVehicleDescriptionSections({ Comments: comments }, ai, 'dealer_only'), [{ title: 'Dealer Comments', text: comments }]);
    assert.deepEqual(resolveVehicleDescriptionSections({}, ai, 'dealer_only'), []);
  });

  it('uses AI only for missing or whitespace-only dealer content in fallback mode', () => {
    assert.equal(resolveVehicleDescriptionSections({ Comments: comments }, ai, 'ai_fallback').length, 1);
    assert.deepEqual(resolveVehicleDescriptionSections({ Comments: ' \r\n', description: ' ' }, ai, 'ai_fallback'), [{ title: 'Description', text: ai }]);
    assert.deepEqual(resolveVehicleDescriptionSections({ Comments: ' ', description: 'Feed description' }, ai, 'ai_fallback'), [{ title: 'Dealer Comments', text: 'Feed description' }]);
  });

  it('ignores malformed and blank input and suppresses duplicate descriptions', () => {
    assert.deepEqual(resolveVehicleDescriptionSections(null, ' ', 'both'), []);
    assert.deepEqual(resolveVehicleDescriptionSections({ Comments: {} }, null, 'both'), []);
    assert.deepEqual(resolveVehicleDescriptionSections({ Comments: comments }, 'RUNOUT BONUS APPLIES', 'both'), [{ title: 'Dealer Comments', text: comments }]);
  });

  it('defaults to both and validates only known modes', () => {
    for (const settings of [undefined, null, {}, { vehicleDescriptions: { mode: 'invalid' } }]) {
      assert.deepEqual(readVehicleDescriptionSettings(settings), { mode: 'both' });
    }
    for (const mode of ['dealer_only', 'both', 'ai_fallback']) {
      assert.equal(isVehicleDescriptionMode(mode), true);
      assert.deepEqual(readVehicleDescriptionSettings({ vehicleDescriptions: { mode } }), { mode });
    }
    for (const mode of [null, undefined, [], {}, 'ai_only', '']) assert.equal(isVehicleDescriptionMode(mode), false);
  });
});
