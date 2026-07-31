import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { installXeroflowTracking } from '../app/utils/xeroflowTracking.ts';

class FakeScript {
  async = false;
  src = '';
  dataset: Record<string, string> = {};
}

class FakeDocument {
  scripts: FakeScript[] = [];
  head = {
    appendChild: (script: FakeScript) => {
      this.scripts.push(script);
      return script;
    },
  };

  createElement(tagName: string) {
    assert.equal(tagName, 'script');
    return new FakeScript();
  }

  querySelector(selector: string) {
    const src = selector.match(/script\[src="([^"]+)"\]/)?.[1];
    return this.scripts.find((script) => script.src === src) ?? null;
  }
}

describe('XeroFlow tracking bootstrap', () => {
  it('loads the dashboard tracker once and prevents the GTM fallback from duplicating it', () => {
    const document = new FakeDocument();
    const window = {} as Record<string, unknown>;

    installXeroflowTracking({
      writeKey: 'xf_public_test_key',
      window: window as unknown as Window & { __xeroflowGtmLoaded?: boolean },
      document: document as unknown as Document,
    });
    installXeroflowTracking({
      writeKey: 'xf_public_test_key',
      window: window as unknown as Window & { __xeroflowGtmLoaded?: boolean },
      document: document as unknown as Document,
    });

    assert.equal(window.__xeroflowGtmLoaded, true);
    assert.equal(document.scripts.length, 1);
    assert.equal(document.scripts[0]?.src, 'https://app.xeroflow.io/track.js');
    assert.equal(document.scripts[0]?.async, true);
    assert.equal(document.scripts[0]?.dataset.key, 'xf_public_test_key');
    assert.equal(document.scripts[0]?.dataset.spa, 'true');
  });

  it('does nothing when the site has no configured write key', () => {
    const document = new FakeDocument();
    const window = {} as Record<string, unknown>;

    installXeroflowTracking({
      writeKey: '',
      window: window as unknown as Window & { __xeroflowGtmLoaded?: boolean },
      document: document as unknown as Document,
    });

    assert.equal(window.__xeroflowGtmLoaded, undefined);
    assert.equal(document.scripts.length, 0);
  });
});
