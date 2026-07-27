/**
 * Export sizes for homepage slider artwork. The crop dialog frames to these
 * exact pixel dimensions, so slides stay a consistent shape no matter what
 * the dealer uploads.
 */
export const CROP_TARGETS = {
  desktop: { width: 1920, height: 720 },
  /** Square, per the slider's mobile treatment. */
  mobile: { width: 1080, height: 1080 },
} as const;

export type CropVariant = keyof typeof CROP_TARGETS;

/** "1920 × 720 px" — shared by the field hints and the crop dialog copy. */
export function cropTargetLabel(variant: CropVariant) {
  const { width, height } = CROP_TARGETS[variant];
  return `${width} × ${height} px`;
}
