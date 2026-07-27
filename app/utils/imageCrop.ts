/**
 * Export sizes for admin-managed artwork. The crop dialog frames to exact
 * pixel dimensions so banners stay a consistent shape whatever the dealer
 * uploads.
 */
export interface CropSize {
  width: number;
  height: number;
}

/** Defaults offered per slot; every one can be overridden in the dialog. */
export const CROP_TARGETS = {
  desktop: { width: 1920, height: 720 },
  /** Square, per the slider's mobile treatment. */
  mobile: { width: 1080, height: 1080 },
  /** Stock page header — a wider, shorter strip than a hero slide. */
  headerDesktop: { width: 1920, height: 480 },
  headerMobile: { width: 1080, height: 540 },
} as const;

export type CropVariant = keyof typeof CROP_TARGETS;

/** Guard rails for a hand-entered size: big enough to matter, small enough to encode. */
export const CROP_MIN_DIMENSION = 64;
export const CROP_MAX_DIMENSION = 5000;

/** "1920 × 720 px" — shared by field hints and the crop dialog copy. */
export function cropSizeLabel(size: CropSize) {
  return `${size.width} × ${size.height} px`;
}

export function cropTargetLabel(variant: CropVariant) {
  return cropSizeLabel(CROP_TARGETS[variant]);
}

/**
 * Clamps a hand-entered dimension to something the canvas can actually
 * export. Non-numeric input falls back to the slot's default.
 */
export function normalizeCropDimension(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(CROP_MAX_DIMENSION, Math.max(CROP_MIN_DIMENSION, Math.round(numeric)));
}

/** Common presets offered alongside the free-form width/height inputs. */
export const CROP_PRESETS: ReadonlyArray<{ label: string; size: CropSize }> = [
  { label: 'Hero 1920 × 720', size: { width: 1920, height: 720 } },
  { label: 'Wide banner 1920 × 480', size: { width: 1920, height: 480 } },
  { label: 'Square 1080 × 1080', size: { width: 1080, height: 1080 } },
  { label: 'Mobile 1080 × 540', size: { width: 1080, height: 540 } },
  { label: 'Portrait 767 × 975', size: { width: 767, height: 975 } },
];
