import { defineStore } from 'pinia';

/**
 * Offers store - handles Hyundai offers data
 * Replaces: Vuex hyundaiOffers module
 */

interface Offer {
  id: string | number;
  model: string;
  variantName?: string;
  image: string;
  heroImage?: string;
  imageAltText?: string;
  hasValueOffer: boolean;
  offerType?: string;
  offerAmount?: string;
  offerCode?: string;
  offerDescription?: string;
  engineType?: string;
  transmission?: string;
  specifications?: string;
  [key: string]: any;
}

export const useOffersStore = defineStore('offers', () => {
  // State
  const offers = ref<Offer[]>([]);
  const currentOffer = ref<Offer | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const offersWithValue = computed(() =>
    offers.value.filter((offer) => offer.hasValueOffer)
  );

  const offersByModel = computed(() => {
    const grouped: Record<string, Offer[]> = {};
    offers.value.forEach((offer) => {
      if (!grouped[offer.model]) {
        grouped[offer.model] = [];
      }
      const group = grouped[offer.model];
      if (group) group.push(offer);
    });
    return grouped;
  });

  // Actions
  const fetchOffers = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<Offer[]>('/api/hyundai-offers');
      offers.value = data;
      return data;
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch offers';
      return [];
    } finally {
      loading.value = false;
    }
  };

  const fetchOfferById = async (id: string | number) => {
    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<Offer>(`/api/hyundai-offers/${id}`);
      currentOffer.value = data;
      return data;
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch offer';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const clearCurrentOffer = () => {
    currentOffer.value = null;
  };

  return {
    // State
    offers,
    currentOffer,
    loading,
    error,

    // Getters
    offersWithValue,
    offersByModel,

    // Actions
    fetchOffers,
    fetchOfferById,
    clearCurrentOffer,
  };
});
