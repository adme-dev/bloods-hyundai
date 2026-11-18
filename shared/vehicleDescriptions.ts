export const VEHICLE_DESCRIPTION_MODES = ['dealer_only', 'both', 'ai_fallback'] as const;
export type VehicleDescriptionMode = typeof VEHICLE_DESCRIPTION_MODES[number];
export interface VehicleDescriptionSettings { mode: VehicleDescriptionMode }
export interface VehicleDescriptionSection { title: string; text: string }

export function isVehicleDescriptionMode(value: unknown): value is VehicleDescriptionMode {
  return typeof value === 'string' && VEHICLE_DESCRIPTION_MODES.includes(value as VehicleDescriptionMode);
}

export function readVehicleDescriptionSettings(settings: unknown): VehicleDescriptionSettings {
  const mode = (settings as { vehicleDescriptions?: { mode?: unknown } } | null)?.vehicleDescriptions?.mode;
  return { mode: isVehicleDescriptionMode(mode) ? mode : 'both' };
}

function nonBlankText(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : '';
}

/** Preserve the dealer's wording and line breaks; AI is always supplemental. */
export function resolveVehicleDescriptionSections(
  vehicle: { Comments?: unknown; description?: unknown } | null | undefined,
  aiDescription: unknown,
  mode: VehicleDescriptionMode,
): VehicleDescriptionSection[] {
  const comments = nonBlankText(vehicle?.Comments) || nonBlankText(vehicle?.description);
  const ai = nonBlankText(aiDescription);
  const sections: VehicleDescriptionSection[] = [];
  if (comments) sections.push({ title: 'Dealer Comments', text: comments });
  const normalized = (text: string) => text.trim().replace(/\s+/g, ' ');
  if (ai && mode !== 'dealer_only' && (mode === 'both' || !comments) && normalized(ai) !== normalized(comments)) {
    sections.push({ title: 'Vehicle Description', text: ai });
  }
  return sections;
}
