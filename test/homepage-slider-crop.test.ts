import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { CROP_TARGETS, cropTargetLabel } from '../app/utils/imageCrop';

describe('homepage slider crop targets', () => {
  it('exports desktop slides at 1920 × 720 and mobile at a square', () => {
    assert.deepEqual(CROP_TARGETS.desktop, { width: 1920, height: 720 });
    assert.equal(CROP_TARGETS.mobile.width, CROP_TARGETS.mobile.height);
  });

  it('describes each target for the field hints', () => {
    assert.equal(cropTargetLabel('desktop'), '1920 × 720 px');
    assert.equal(cropTargetLabel('mobile'), '1080 × 1080 px');
  });
});

describe('crop framing maths', () => {
  // Mirrors ImageCropDialog: the image is scaled to at least cover the frame,
  // then clamped so dragging can never expose empty space at an edge.
  function frame(variant: keyof typeof CROP_TARGETS, natural: { w: number; h: number }, stageWidth: number, zoomMultiplier: number, drag: { x: number; y: number }) {
    const target = CROP_TARGETS[variant];
    const stageHeight = stageWidth * (target.height / target.width);
    const minZoom = Math.max(stageWidth / natural.w, stageHeight / natural.h);
    const zoom = minZoom * zoomMultiplier;
    const scaledWidth = natural.w * zoom;
    const scaledHeight = natural.h * zoom;

    const clamp = (next: { x: number; y: number }) => ({
      x: Math.min(0, Math.max(stageWidth - scaledWidth, next.x)),
      y: Math.min(0, Math.max(stageHeight - scaledHeight, next.y)),
    });

    const centred = clamp({ x: (stageWidth - scaledWidth) / 2, y: (stageHeight - scaledHeight) / 2 });
    const offset = clamp({ x: centred.x + drag.x, y: centred.y + drag.y });
    const toExport = target.width / stageWidth;

    return {
      target,
      dx: offset.x * toExport,
      dy: offset.y * toExport,
      dw: scaledWidth * toExport,
      dh: scaledHeight * toExport,
    };
  }

  const sources = [
    { w: 4000, h: 2000 },  // wide
    { w: 800, h: 4000 },   // tall
    { w: 1920, h: 720 },   // already exact
    { w: 300, h: 300 },    // smaller than the export
  ];
  const drags = [{ x: 0, y: 0 }, { x: -9999, y: -9999 }, { x: 9999, y: 9999 }];

  for (const variant of ['desktop', 'mobile'] as const) {
    it(`always fills the ${variant} frame, whatever the source or drag`, () => {
      for (const source of sources) {
        for (const drag of drags) {
          for (const zoom of [1, 2.5]) {
            const { target, dx, dy, dw, dh } = frame(variant, source, 800, zoom, drag);
            const slack = 0.001;
            assert.ok(dx <= slack && dy <= slack, `${variant} ${source.w}x${source.h} left a gap at the top/left`);
            assert.ok(dx + dw >= target.width - slack, `${variant} ${source.w}x${source.h} left a gap at the right`);
            assert.ok(dy + dh >= target.height - slack, `${variant} ${source.w}x${source.h} left a gap at the bottom`);
          }
        }
      }
    });
  }
});

describe('homepage slider crop UI', () => {
  const dialog = () => readFileSync('app/components/admin/settings/ImageCropDialog.vue', 'utf8');
  const field = () => readFileSync('app/components/admin/settings/HomepageSliderImageField.vue', 'utf8');
  const page = () => readFileSync('app/pages/admin/settings/homepage-slider.vue', 'utf8');

  it('offers a crop action once an image is chosen', () => {
    assert.match(field(), /v-if="src"/);
    assert.match(field(), /\$emit\('crop'\)/);
  });

  it('renders the mobile preview as a square, matching the export', () => {
    assert.match(field(), /aspect-square/);
    assert.doesNotMatch(field(), /aspect-\[767\/975\]/);
  });

  it('exports at the target pixel size rather than the on-screen size', () => {
    assert.match(dialog(), /canvas\.width = target\.value\.width/);
    assert.match(dialog(), /canvas\.height = target\.value\.height/);
  });

  // The dialog animates in, so the stage reads 0px on the first frames. Framing
  // against 0 pinned zoom to the fallback of 1 and exported a mis-framed crop.
  it('waits for the stage to be measured before framing', () => {
    assert.match(dialog(), /await measureStage\(\)/);
    assert.match(dialog(), /requestAnimationFrame/);
  });

  it('reframes instead of breaking when the viewport resizes', () => {
    assert.match(dialog(), /new ResizeObserver/);
    assert.match(dialog(), /stageObserver\?\.disconnect\(\)/);
  });

  it('rejects a file that decodes with no dimensions', () => {
    assert.match(dialog(), /!image\.naturalWidth \|\| !image\.naturalHeight/);
  });

  it('wires the dialog into the slider page', () => {
    assert.match(page(), /<ImageCropDialog/);
    assert.match(page(), /@cropped="applyCrop"/);
    assert.match(page(), /function cropImage\(/);
  });

  // The CDN and R2 buckets send no Access-Control-Allow-Origin, so reading the
  // source directly in the browser fails CORS and taints the canvas.
  it('reads the source through the same-origin proxy, not the remote host', () => {
    assert.match(dialog(), /\$fetch<Blob>\('\/api\/admin\/media\/proxy'/);
    assert.doesNotMatch(dialog(), /\$fetch<Blob>\(props\.src/);
  });
});

describe('media proxy endpoint', () => {
  const proxy = () => readFileSync('server/api/admin/media/proxy.get.ts', 'utf8');

  it('requires an authenticated admin', () => {
    assert.match(proxy(), /statusCode: 401/);
    assert.match(proxy(), /\['admin', 'dealer_admin', 'manager'\]/);
  });

  it('only fetches allow-listed HTTPS hosts', () => {
    assert.match(proxy(), /target\.protocol !== 'https:'/);
    assert.match(proxy(), /getAllowedImageHosts\(\)\.has\(target\.hostname\.toLowerCase\(\)\)/);
    assert.match(proxy(), /target\.username \|\| target\.password/);
  });

  it('refuses non-images and oversized payloads', () => {
    assert.match(proxy(), /ALLOWED_CONTENT_TYPES\.has\(contentType\)/);
    assert.match(proxy(), /MAX_IMAGE_BYTES/);
  });
});
