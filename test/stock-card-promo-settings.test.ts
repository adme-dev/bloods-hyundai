import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  defaultStockCardPromoSettings,
  isPromoWindowActive,
  parseStockCardPromoInput,
  readStockCardPromoSettings,
  resolveCardPromo,
  resolveCardScroller,
} from '../shared/stockCardPromo.ts';

const allowedImageHosts = new Set([
  'assets.bloodhyundai.com.au',
  'driveagentmedia.b-cdn.net',
]);

const validInput = {
  wasNowEnabled: true,
  commentsEnabled: true,
  badgesEnabled: true,
  scroller: { enabled: true, text: 'EOFY SALE ON NOW*', color: '#E11D48' },
  offers: [
    {
      stockNumber: 'U12345',
      wasPrice: 39990,
      comment: 'One owner, full service history',
      badgeText: 'HOT DEAL',
      badgeColor: '#0EA5E9',
    },
  ],
  graphics: {
    enabled: true,
    interval: 3,
    items: [
      {
        id: 'graphic-1',
        enabled: true,
        image: 'https://assets.bloodhyundai.com.au/blood-hyundai/images/promo.webp',
        mobileImage: '',
        link: '/special-offers',
        heading: 'Massive savings',
        subheading: 'This weekend only',
      },
    ],
  },
};

describe('parseStockCardPromoInput', () => {
  it('accepts a valid payload and normalises values', () => {
    const result = parseStockCardPromoInput(validInput, { allowedImageHosts });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.wasNowEnabled, true);
    assert.equal(result.value.scroller.color, '#e11d48');
    assert.equal(result.value.offers[0]?.wasPrice, 39990);
    assert.equal(result.value.graphics.items[0]?.id, 'graphic-1');
    assert.equal(result.value.graphics.interval, 3);
  });

  it('rejects images on unapproved hosts', () => {
    const result = parseStockCardPromoInput({
      ...validInput,
      graphics: {
        ...validInput.graphics,
        items: [{ ...validInput.graphics.items[0], image: 'https://evil.example.com/x.png' }],
      },
    }, { allowedImageHosts });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.some((message) => message.includes('approved media host')));
  });

  it('rejects an enabled scroller without text', () => {
    const result = parseStockCardPromoInput({
      ...validInput,
      scroller: { enabled: true, text: '', color: '#e11d48' },
    }, { allowedImageHosts });
    assert.equal(result.ok, false);
  });

  it('rejects invalid colours, prices and intervals', () => {
    const result = parseStockCardPromoInput({
      ...validInput,
      scroller: { enabled: true, text: 'SALE', color: 'red' },
      offers: [{ stockNumber: 'U1', wasPrice: -5, comment: '', badgeText: '', badgeColor: '#fff' }],
      graphics: { ...validInput.graphics, interval: 1 },
    }, { allowedImageHosts });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errors.length >= 3, true);
  });

  it('deduplicates offers on the same stock number, keeping the last entry', () => {
    const result = parseStockCardPromoInput({
      ...validInput,
      offers: [
        { ...validInput.offers[0], wasPrice: 39990 },
        { ...validInput.offers[0], stockNumber: 'u12345', wasPrice: 37990 },
      ],
    }, { allowedImageHosts });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.offers.length, 1);
    assert.equal(result.value.offers[0]?.wasPrice, 37990);
  });

  it('drops offers without a stock number but flags ones with content', () => {
    const result = parseStockCardPromoInput({
      ...validInput,
      offers: [{ stockNumber: '', wasPrice: 1000, comment: '', badgeText: '', badgeColor: '#e11d48' }],
    }, { allowedImageHosts });
    assert.equal(result.ok, false);
  });

  it('normalises ISO dates to DD-MM-YYYY and rejects inverted ranges', () => {
    const ok = parseStockCardPromoInput({
      ...validInput,
      offers: [{ ...validInput.offers[0], start: '2026-07-01', end: '31-07-2026' }],
    }, { allowedImageHosts });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.value.offers[0]?.start, '01-07-2026');
    assert.equal(ok.value.offers[0]?.end, '31-07-2026');

    const inverted = parseStockCardPromoInput({
      ...validInput,
      graphics: {
        ...validInput.graphics,
        items: [{ ...validInput.graphics.items[0], start: '2026-08-01', end: '2026-07-01' }],
      },
    }, { allowedImageHosts });
    assert.equal(inverted.ok, false);

    const invalid = parseStockCardPromoInput({
      ...validInput,
      offers: [{ ...validInput.offers[0], start: '2026-02-30' }],
    }, { allowedImageHosts });
    assert.equal(invalid.ok, false);
  });

  it('allows a hidden graphic to be saved as an imageless draft, but not a visible one', () => {
    const draft = parseStockCardPromoInput({
      ...validInput,
      graphics: {
        enabled: true,
        interval: 3,
        items: [
          validInput.graphics.items[0],
          { id: 'graphic-2', enabled: false, image: '', link: '', heading: 'Draft', subheading: '' },
        ],
      },
    }, { allowedImageHosts });
    assert.equal(draft.ok, true);

    const visible = parseStockCardPromoInput({
      ...validInput,
      graphics: {
        enabled: false,
        interval: 3,
        items: [{ id: 'graphic-1', enabled: true, image: '', link: '', heading: '', subheading: '' }],
      },
    }, { allowedImageHosts });
    assert.equal(visible.ok, false);
  });

  it('rejects HTML in text fields', () => {
    const result = parseStockCardPromoInput({
      ...validInput,
      offers: [{ ...validInput.offers[0], comment: '<script>alert(1)</script>' }],
    }, { allowedImageHosts });
    assert.equal(result.ok, false);
  });
});

describe('readStockCardPromoSettings', () => {
  it('returns null when nothing is stored', () => {
    assert.equal(readStockCardPromoSettings({}), null);
    assert.equal(readStockCardPromoSettings(null), null);
  });

  it('round-trips parsed settings', () => {
    const parsed = parseStockCardPromoInput(validInput, { allowedImageHosts });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const read = readStockCardPromoSettings({ stockCardPromo: parsed.value });
    assert.deepEqual(read, parsed.value);
  });

  it('normalises corrupt stored data safely', () => {
    const read = readStockCardPromoSettings({
      stockCardPromo: {
        version: 1,
        wasNowEnabled: 'yes',
        scroller: { enabled: true, text: 'SALE', color: 'not-a-colour' },
        offers: [{ stockNumber: 'U1', wasPrice: 'abc', badgeColor: 123 }, 'junk', null],
        graphics: { enabled: true, interval: 99, items: [{ image: 'x' }] },
      },
    });
    assert.ok(read);
    assert.equal(read?.wasNowEnabled, false);
    assert.equal(read?.scroller.color, '#e11d48');
    assert.equal(read?.offers.length, 1);
    assert.equal(read?.offers[0]?.wasPrice, null);
    assert.equal(read?.graphics.interval, 3);
  });
});

describe('group offers and stock header parsing', () => {
  it('accepts a valid group rule and normalises the condition', () => {
    const result = parseStockCardPromoInput({
      ...validInput,
      groups: [{
        id: 'group-1', enabled: true, make: 'Hyundai', model: 'Tucson', variant: '',
        condition: 'Demonstrator', discountType: 'amount', discountValue: 3000,
        comment: '', badgeText: 'EOFY', badgeColor: '#0EA5E9',
      }],
    }, { allowedImageHosts });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.groups[0]?.condition, 'demo');
    assert.equal(result.value.groups[0]?.discountValue, 3000);
  });

  it('rejects a group rule with no target and out-of-range discounts', () => {
    const noTarget = parseStockCardPromoInput({
      ...validInput,
      groups: [{ make: '', model: '', variant: '', condition: '' }],
    }, { allowedImageHosts });
    assert.equal(noTarget.ok, false);

    const badPercent = parseStockCardPromoInput({
      ...validInput,
      groups: [{ make: 'Hyundai', discountType: 'percent', discountValue: 90 }],
    }, { allowedImageHosts });
    assert.equal(badPercent.ok, false);
  });

  it('requires a desktop image only when the stock header is enabled', () => {
    const disabledDraft = parseStockCardPromoInput({
      ...validInput,
      stockHeader: { enabled: false, desktop: '', mobile: '', link: '' },
    }, { allowedImageHosts });
    assert.equal(disabledDraft.ok, true);

    const enabledEmpty = parseStockCardPromoInput({
      ...validInput,
      stockHeader: { enabled: true, desktop: '', mobile: '', link: '' },
    }, { allowedImageHosts });
    assert.equal(enabledEmpty.ok, false);

    const enabledValid = parseStockCardPromoInput({
      ...validInput,
      stockHeader: {
        enabled: true,
        desktop: 'https://assets.bloodhyundai.com.au/blood-hyundai/images/header.webp',
        mobile: '',
        link: '/special-offers',
      },
    }, { allowedImageHosts });
    assert.equal(enabledValid.ok, true);
  });

  it('reads legacy stored settings without groups or header safely', () => {
    const read = readStockCardPromoSettings({
      stockCardPromo: { version: 1, wasNowEnabled: true, offers: [], graphics: { items: [] } },
    });
    assert.ok(read);
    assert.deepEqual(read?.groups, []);
    assert.equal(read?.stockHeader.enabled, false);
  });
});

describe('resolveCardPromo', () => {
  const tucson = {
    stockNumber: 'U100', make: 'Hyundai', model: 'Tucson', variant: 'Elite', condition: 'Used', price: 40000,
  };
  const baseGroup = {
    id: 'g1', enabled: true, make: 'Hyundai', model: 'Tucson', variant: '', condition: '' as const,
    discountType: 'amount' as const, discountValue: 3000,
    comment: 'Group comment', badgeText: 'SALE', badgeColor: '#e11d48', start: '', end: '',
  };

  it('lets a per-vehicle offer beat a matching group rule', () => {
    const resolved = resolveCardPromo({
      offers: [{ stockNumber: 'u100', wasPrice: 44990, comment: 'Stock comment', badgeText: 'HOT', badgeColor: '#000000', start: '', end: '' }],
      groups: [baseGroup],
    }, tucson);
    assert.equal(resolved?.source, 'stock');
    assert.equal(resolved?.wasPrice, 44990);
  });

  it('computes group was-prices from $-off and %-off', () => {
    const amount = resolveCardPromo({ offers: [], groups: [baseGroup] }, tucson);
    assert.equal(amount?.wasPrice, 43000);

    const percent = resolveCardPromo({
      offers: [],
      groups: [{ ...baseGroup, discountType: 'percent', discountValue: 10 }],
    }, tucson);
    assert.equal(percent?.wasPrice, Math.round(40000 / 0.9));
  });

  it('matches make/model/variant/condition case-insensitively and respects windows', () => {
    const conditionMiss = resolveCardPromo({
      offers: [],
      groups: [{ ...baseGroup, condition: 'new' }],
    }, tucson);
    assert.equal(conditionMiss, null);

    const variantHit = resolveCardPromo({
      offers: [],
      groups: [{ ...baseGroup, variant: 'ELITE' }],
    }, tucson);
    assert.equal(variantHit?.source, 'group');

    const expired = resolveCardPromo({
      offers: [],
      groups: [{ ...baseGroup, end: '01-01-2020' }],
    }, tucson);
    assert.equal(expired, null);
  });

  it('matches slugged feed values against display-string rules', () => {
    const resolved = resolveCardPromo({
      offers: [],
      groups: [{ ...baseGroup, make: 'Alfa Romeo', model: 'i30 Sedan' }],
    }, { ...tucson, make: 'alfa-romeo', model: 'i30-sedan' });
    assert.equal(resolved?.source, 'group');
  });

  it('returns no was-price for POA vehicles but keeps badge and comment', () => {
    const resolved = resolveCardPromo({ offers: [], groups: [baseGroup] }, { ...tucson, price: 0 });
    assert.equal(resolved?.wasPrice, null);
    assert.equal(resolved?.badgeText, 'SALE');
  });
});

describe('resolveCardScroller', () => {
  const tucson = {
    stockNumber: 'U100', make: 'Hyundai', model: 'Tucson', variant: 'Elite', condition: 'Used', price: 40000,
  };
  const scroller = (overrides = {}) => ({
    scroller: {
      enabled: true, text: 'EOFY SALE*', color: '#e11d48',
      make: '', model: '', variant: '', conditions: [] as ('new' | 'demo' | 'used')[],
      ...overrides,
    },
  });

  it('shows on every card when no filters are set', () => {
    assert.equal(resolveCardScroller(scroller(), tucson)?.text, 'EOFY SALE*');
  });

  it('filters by make/model/variant/condition, slug-insensitively', () => {
    assert.ok(resolveCardScroller(scroller({ make: 'HYUNDAI', model: 'tucson' }), tucson));
    assert.equal(resolveCardScroller(scroller({ model: 'i30 Sedan' }), tucson), null);
    assert.ok(resolveCardScroller(scroller({ conditions: ['used'] }), tucson));
    assert.equal(resolveCardScroller(scroller({ conditions: ['new'] }), tucson), null);
  });

  it('supports multiple conditions at once (e.g. new + demo)', () => {
    assert.equal(resolveCardScroller(scroller({ conditions: ['new', 'demo'] }), tucson), null);
    assert.ok(resolveCardScroller(scroller({ conditions: ['new', 'demo', 'used'] }), tucson));
    assert.ok(resolveCardScroller(scroller({ conditions: ['demo', 'used'] }), tucson));
  });

  it('returns null when disabled or empty', () => {
    assert.equal(resolveCardScroller(scroller({ enabled: false }), tucson), null);
    assert.equal(resolveCardScroller(scroller({ text: '' }), tucson), null);
  });

  it('round-trips targeting through parse and read, accepting legacy single condition', () => {
    const parsed = parseStockCardPromoInput({
      ...validInput,
      scroller: { enabled: true, text: 'SALE', color: '#e11d48', make: 'Hyundai', model: 'Tucson', variant: '', conditions: ['Demonstrator', 'NEW', 'demo'] },
    }, { allowedImageHosts });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(parsed.value.scroller.conditions, ['demo', 'new']);
    const read = readStockCardPromoSettings({ stockCardPromo: parsed.value });
    assert.equal(read?.scroller.make, 'Hyundai');

    // Legacy stored payloads used a single `condition` string.
    const legacy = readStockCardPromoSettings({
      stockCardPromo: { version: 1, scroller: { enabled: true, text: 'SALE', color: '#e11d48', condition: 'used' } },
    });
    assert.deepEqual(legacy?.scroller.conditions, ['used']);
  });
});

describe('isPromoWindowActive', () => {
  const during = new Date(2026, 6, 21);

  it('treats empty bounds as always active', () => {
    assert.equal(isPromoWindowActive('', '', during), true);
  });

  it('is inclusive of the start and end days', () => {
    assert.equal(isPromoWindowActive('21-07-2026', '21-07-2026', during), true);
    assert.equal(isPromoWindowActive('21-07-2026', '21-07-2026', new Date(2026, 6, 21, 23, 59)), true);
  });

  it('hides future and expired windows', () => {
    assert.equal(isPromoWindowActive('22-07-2026', '', during), false);
    assert.equal(isPromoWindowActive('', '20-07-2026', during), false);
  });

  it('ignores malformed stored dates instead of hiding content', () => {
    assert.equal(isPromoWindowActive('not-a-date', 'also-bad', during), true);
  });
});

describe('defaultStockCardPromoSettings', () => {
  it('starts with every feature disabled', () => {
    const defaults = defaultStockCardPromoSettings();
    assert.equal(defaults.wasNowEnabled, false);
    assert.equal(defaults.commentsEnabled, false);
    assert.equal(defaults.badgesEnabled, false);
    assert.equal(defaults.scroller.enabled, false);
    assert.equal(defaults.graphics.enabled, false);
  });
});
