import { and, eq, sql } from 'drizzle-orm';

type JsonRecord = Record<string, any>;

export interface OptionPackBackfillDetails {
  optionPackId?: string;
  optionPackName: string;
  optionPackFeatures: string[];
  optionPackImage?: string | null;
  source: 'calculator-feed';
}

export function needsOptionPackBackfill(vehicleInfo: unknown) {
  const configuration = getVehicleConfiguration(vehicleInfo);
  if (!configuration?.optionPack) return false;

  const existingFeatures = configuration.optionPackFeatures;
  return !Array.isArray(existingFeatures) || existingFeatures.filter(Boolean).length === 0;
}

export function findOptionPackBackfillDetails(calculatorData: unknown, vehicleInfo: unknown): OptionPackBackfillDetails | null {
  const configuration = getVehicleConfiguration(vehicleInfo);
  if (!configuration?.optionPack) return null;

  const data = asRecord(calculatorData);
  const variantGroups = asArray(data?.variantGroups);
  const variants = asArray(data?.variants);
  if (!variantGroups.length) return null;

  const variantId = normalizeId(configuration.variantId);
  const selectedVariant = variantId
    ? variants.find((variant) => normalizeId(variant.id) === variantId)
    : null;

  const candidateGroups = selectedVariant?.variantGroup
    ? variantGroups.filter((group) => normalizeText(group.name) === normalizeText(selectedVariant.variantGroup))
    : [];

  if (!candidateGroups.length && configuration.variant) {
    const variantText = normalizeText(configuration.variant);
    candidateGroups.push(
      ...variantGroups.filter((group) => variantText.includes(normalizeText(group.name)) || normalizeText(group.name).includes(variantText))
    );
  }

  const groupsToSearch = [...candidateGroups, ...variantGroups.filter((group) => !candidateGroups.includes(group))];
  const optionPackName = normalizeText(configuration.optionPack);
  const optionPackId = normalizeId(configuration.optionPackId);

  for (const group of groupsToSearch) {
    const optionPacks = asArray(group.optionPacks);
    const pack = optionPacks.find((candidate) => {
      const candidateIds = [
        normalizeId(candidate.id),
        normalizeId(candidate.optionPackId),
        normalizeId(candidate.packId),
      ].filter(Boolean);

      if (optionPackId && candidateIds.includes(optionPackId)) return true;

      const candidateNames = [
        candidate.title,
        candidate.name,
        candidate.packName,
      ].map(normalizeText).filter(Boolean);

      return candidateNames.includes(optionPackName);
    });

    if (!pack) continue;

    const features = normalizeFeatureList(pack.features);
    if (!features.length) return null;

    return {
      optionPackId: String(pack.optionPackId || pack.id || pack.packId || ''),
      optionPackName: String(pack.title || pack.name || configuration.optionPack),
      optionPackFeatures: features,
      optionPackImage: normalizeAssetUrl(pack.modalImage || pack.image || pack.imageHero),
      source: 'calculator-feed',
    };
  }

  return null;
}

export function mergeOptionPackBackfill(vehicleInfo: unknown, details: OptionPackBackfillDetails, now = new Date()) {
  const info = asRecord(vehicleInfo);
  const configuration = asRecord(info.configuration);

  return {
    ...info,
    configuration: {
      ...configuration,
      optionPack: configuration.optionPack || details.optionPackName,
      optionPackId: details.optionPackId || configuration.optionPackId,
      optionPackFeatures: details.optionPackFeatures,
      optionPackImage: details.optionPackImage || configuration.optionPackImage,
      optionPackBackfilledAt: now.toISOString(),
    },
  };
}

export async function autoBackfillEnquiryOptionPack(enquiry: any) {
  if (!enquiry?.id || !enquiry?.dealerId || !needsOptionPackBackfill(enquiry.vehicleInfo)) {
    return enquiry;
  }

  const calculatorModel = getCalculatorModelName(enquiry.vehicleInfo);
  if (!calculatorModel) return enquiry;

  let calculatorData: unknown;

  try {
    calculatorData = await $fetch('/api/car-calculator', {
      query: {
        modelname: calculatorModel,
        postcode: '3000',
        displaypowertrain: 'true',
      },
      timeout: 20000,
    });
  } catch (error: any) {
    console.warn('[Enquiry Option Pack Backfill] Calculator fetch failed', {
      enquiryId: enquiry.id,
      model: calculatorModel,
      message: error?.message,
    });
    return enquiry;
  }

  const details = findOptionPackBackfillDetails(calculatorData, enquiry.vehicleInfo);
  if (!details) return enquiry;

  const updatedVehicleInfo = mergeOptionPackBackfill(enquiry.vehicleInfo, details);
  const [{ db }, { enquiries }, { logEnquiryActivity }] = await Promise.all([
    import('../db'),
    import('../../database/schema'),
    import('../enquiryActivity'),
  ]);

  const [updated] = await db
    .update(enquiries)
    .set({
      vehicleInfo: updatedVehicleInfo,
      updatedAt: new Date(),
    })
    .where(and(
      eq(enquiries.id, enquiry.id),
      eq(enquiries.dealerId, enquiry.dealerId),
      sql`(
        ${enquiries.vehicleInfo}->'configuration'->'optionPackFeatures' IS NULL
        OR jsonb_typeof(${enquiries.vehicleInfo}->'configuration'->'optionPackFeatures') <> 'array'
        OR jsonb_array_length(${enquiries.vehicleInfo}->'configuration'->'optionPackFeatures') = 0
      )`
    ))
    .returning();

  if (!updated) return enquiry;

  try {
    await logEnquiryActivity({
      dealerId: enquiry.dealerId,
      enquiryId: enquiry.id,
      userId: null,
      action: 'backfill_option_pack_features',
      entityType: 'enquiry',
      oldValue: {
        optionPackFeatures: getVehicleConfiguration(enquiry.vehicleInfo)?.optionPackFeatures ?? null,
      },
      newValue: {
        optionPackId: details.optionPackId,
        optionPackFeatures: details.optionPackFeatures,
        source: details.source,
      },
    });
  } catch (error: any) {
    console.warn('[Enquiry Option Pack Backfill] Activity log insert failed', {
      enquiryId: enquiry.id,
      message: error?.message,
    });
  }

  return {
    ...enquiry,
    vehicleInfo: updated.vehicleInfo,
    updatedAt: updated.updatedAt,
  };
}

function getVehicleConfiguration(vehicleInfo: unknown): JsonRecord | null {
  const info = asRecord(vehicleInfo);
  return asRecord(info.configuration);
}

function getCalculatorModelName(vehicleInfo: unknown) {
  const info = asRecord(vehicleInfo);
  const configuration = asRecord(info.configuration);
  const model = String(configuration.model || info.model || '').trim();
  if (!model) return '';

  return model
    .replace(/^20\d{2}\s+/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeFeatureList(features: unknown) {
  return (Array.isArray(features) ? features : [])
    .map((feature) => {
      if (typeof feature === 'string') return feature.trim();
      if (feature && typeof feature === 'object') {
        return String((feature as JsonRecord).text || (feature as JsonRecord).name || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function normalizeAssetUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const url = value.trim();
  return url.startsWith('http') ? url : `https://www.hyundai.com${url}`;
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeId(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => item && typeof item === 'object') : [];
}
