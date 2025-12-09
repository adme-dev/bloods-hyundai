import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const allVariants = defineEventHandler(async (event) => {
  try {
    const modelsData = await $fetch(
      "https://www.hyundai.com/content/api/au/hyundai/pcm1/v1/modeladditional",
      { timeout: 2e4 }
    );
    if (!modelsData || !Array.isArray(modelsData)) {
      return {
        success: false,
        error: "Unexpected API response format",
        variants: [],
        groupedByCategory: {}
      };
    }
    const groupedByCategory = {};
    const allModels = [];
    modelsData.forEach((modelData) => {
      var _a, _b, _c;
      const modelName = ((_a = modelData.model) == null ? void 0 : _a.model) || "Unknown";
      if (modelName === "Merchandise" || modelName === "Unknown") return;
      const categoryName = ((_b = modelData.primaryCategory) == null ? void 0 : _b.name) || "All";
      const categoryDescription = ((_c = modelData.primaryCategory) == null ? void 0 : _c.description) || "";
      const model = {
        id: modelData.id,
        modelId: modelData.modelId,
        name: modelName,
        slug: modelName.toLowerCase().replace(/\s+/g, "-"),
        category: categoryName,
        categoryDescription,
        image: modelData.desktopImageUrl ? `https://www.hyundai.com${modelData.desktopImageUrl}` : modelData.mobileImageUrl ? `https://www.hyundai.com${modelData.mobileImageUrl}` : null,
        mobileImage: modelData.mobileImageUrl ? `https://www.hyundai.com${modelData.mobileImageUrl}` : null,
        desktopImage: modelData.desktopImageUrl ? `https://www.hyundai.com${modelData.desktopImageUrl}` : null,
        lowPrice: modelData.lowPrice,
        highPrice: modelData.highPrice,
        priceEnabled: modelData.priceEnabled,
        priceDisclaimer: modelData.priceDisclaimer,
        modelUrl: modelData.modelUrl ? `https://www.hyundai.com${modelData.modelUrl}` : null,
        calculatorUrl: modelData.calculatorUrl ? `https://www.hyundai.com${modelData.calculatorUrl}` : null,
        isNPerformance: modelData.isNPerformance || false,
        order: modelData.order || 999,
        variantId: modelData.modelId,
        fuelType: categoryName === "Electric" ? "Electric" : categoryName === "Hybrid" ? "Hybrid" : "Petrol",
        hasOffer: false,
        isNew: modelName.includes("2025") || modelName.includes("INSTER")
      };
      if (!groupedByCategory[categoryName]) {
        groupedByCategory[categoryName] = {
          name: categoryName,
          description: categoryDescription,
          models: []
        };
      }
      groupedByCategory[categoryName].models.push(model);
      allModels.push(model);
    });
    Object.values(groupedByCategory).forEach((category) => {
      category.models.sort((a, b) => a.order - b.order);
    });
    allModels.sort((a, b) => a.order - b.order);
    const categoryOrder = ["Electric", "Hybrid", "SUVs and People Movers", "Performance", "Hatch & Sedans", "Runout", "All"];
    const categories = Object.keys(groupedByCategory).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return {
      success: true,
      totalModels: allModels.length,
      vehicleCategories: categories,
      groupedByCategory,
      variants: allModels
    };
  } catch (error) {
    console.error("[API] all-variants error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch variants",
      variants: [],
      groupedByCategory: {}
    };
  }
});

export { allVariants as default };
//# sourceMappingURL=all-variants.mjs.map
