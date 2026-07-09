import { defineStore } from 'pinia';
import { slugify } from '~/utils';
import hyundaiModelsData from '~/data/hyundai-models.json';
import { pushAccessoryCommerceEvent } from '~/utils/accessoriesCommerceTracking';

/**
 * Accessories store - handles Hyundai Genuine Accessories data and cart functionality
 * For the R&D accessories shop feature
 */

export interface Accessory {
  id: string;
  name: string;
  description: string;
  price: number;
  rrp: number;
  category: string;
  categoryName: string;
  image: string | null;
  thumbnail: string | null;
  partNumber: string;
  isPopular: boolean;
  isFitted: boolean;
  fittingPrice: number | null;
  features: string[];
  disclaimer: string;
  variants: any[];
}

export interface AccessoryPack {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  rrp?: number;
  savingsAmount: number;
  image: string | null;
  imageHero?: string | null;
  imageCloseUp1?: string | null;
  imageCloseUp2?: string | null;
  category?: string;
  categoryName?: string;
  partNumber?: string;
  isFitted?: boolean;
  isPopular?: boolean;
  disclaimer: string;
  includedAccessories: {
    id: string;
    quantity: number;
    citation: string;
    order?: number;
  }[];
}

export interface CartItem {
  accessory: Accessory | AccessoryPack;
  quantity: number;
  type: 'accessory' | 'pack';
}

export interface HyundaiModel {
  name: string;
  slug: string;
  groupId: string;
  image?: string;
  category: 'SUV' | 'Electric' | 'Hatch' | 'Sedan' | 'Performance' | 'Van' | 'Hybrid';
}

// OEM CDN base URL for model images
const OEM_CDN_URL = 'https://hyundaioem.b-cdn.net';

// Known Hyundai models with their accessories group IDs
// Load models from JSON data and ensure slugs are generated from titles
export const HYUNDAI_MODELS: HyundaiModel[] = (hyundaiModelsData.models as HyundaiModel[]).map(model => ({
  ...model,
  // Ensure slug is generated from model name/title for consistent routing
  slug: slugify(model.name),
}));

// OEM model data from CDN
interface OEMModel {
  slug: string;
  model_image?: string;
  model_front?: string;
  title?: { rendered: string };
}

export const useAccessoriesStore = defineStore('accessories', () => {
  // State
  const selectedModel = ref<HyundaiModel | null>(null);
  const accessories = ref<Accessory[]>([]);
  const accessoryPacks = ref<AccessoryPack[]>([]);
  const categories = ref<string[]>([]);
  const categorizedAccessories = ref<Record<string, Accessory[]>>({});
  
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // OEM model images
  const oemModels = ref<OEMModel[]>([]);
  const modelsWithImages = ref<HyundaiModel[]>([]);

  // Cart state (persisted via pinia-plugin-persistedstate)
  const cartItems = ref<CartItem[]>([]);
  const showCart = ref(false);
  
  // Filters
  const selectedCategory = ref<string | null>(null);
  const searchQuery = ref('');
  const showOnlyPopular = ref(false);
  const sortBy = ref<'name' | 'price-asc' | 'price-desc' | 'popular'>('name');
  
  // Fetch OEM models data for images
  const fetchOEMModels = async () => {
    try {
      const data = await $fetch<OEMModel[]>(`${OEM_CDN_URL}/data/models.json`);
      oemModels.value = data || [];
      
      // Merge images into HYUNDAI_MODELS
      modelsWithImages.value = HYUNDAI_MODELS.map(model => {
        // Try to find matching OEM model by slug variations
        const slugVariations = [
          model.slug,
          model.slug.replace(/-/g, ''),
          model.name.toLowerCase().replace(/\s+/g, '-'),
          model.name.toLowerCase().replace(/\s+/g, ''),
        ];
        
        const oemModel = oemModels.value.find(oem => {
          const oemSlug = oem.slug?.toLowerCase() || '';
          return slugVariations.some(slug => 
            oemSlug.includes(slug) || slug.includes(oemSlug.replace(/^20\d{2}-/, ''))
          );
        });
        
        return {
          ...model,
          image: oemModel?.model_image || oemModel?.model_front || model.image,
        };
      });
    } catch (e) {
      console.error('Failed to fetch OEM models:', e);
      modelsWithImages.value = HYUNDAI_MODELS;
    }
  };
  
  // Getters
  const availableModels = computed(() => {
    return modelsWithImages.value.length > 0 ? modelsWithImages.value : HYUNDAI_MODELS;
  });
  
  const modelsByCategory = computed(() => {
    const grouped: Record<string, HyundaiModel[]> = {};
    HYUNDAI_MODELS.forEach(model => {
      if (!grouped[model.category]) {
        grouped[model.category] = [];
      }
      grouped[model.category].push(model);
    });
    return grouped;
  });
  
  const filteredAccessories = computed(() => {
    let result = [...accessories.value];
    
    // Filter by category
    if (selectedCategory.value) {
      result = result.filter(acc => 
        acc.category === selectedCategory.value || 
        acc.categoryName === selectedCategory.value
      );
    }
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(acc => 
        acc.name.toLowerCase().includes(query) ||
        acc.description?.toLowerCase().includes(query) ||
        acc.partNumber?.toLowerCase().includes(query)
      );
    }
    
    // Filter by popular
    if (showOnlyPopular.value) {
      result = result.filter(acc => acc.isPopular);
    }
    
    // Sort
    switch (sortBy.value) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
        break;
    }
    
    return result;
  });
  
  const cartTotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
      return total + (item.accessory.price * item.quantity);
    }, 0);
  });
  
  const cartItemCount = computed(() => {
    return cartItems.value.reduce((count, item) => count + item.quantity, 0);
  });
  
  const isInCart = (accessoryId: string) => {
    return cartItems.value.some(item => item.accessory.id === accessoryId);
  };
  
  const getAccessoryById = (accessoryId: string): Accessory | undefined => {
    return accessories.value.find(acc => acc.id === accessoryId);
  };

  const trackCartEvent = (
    event: Parameters<typeof pushAccessoryCommerceEvent>[0],
    items: CartItem[],
    options: { source?: string; reason?: string } = {},
  ) => {
    pushAccessoryCommerceEvent(event, {
      items,
      selectedModel: selectedModel.value,
      source: options.source,
      reason: options.reason,
    });
  };
  
  // Actions
  const selectModel = async (model: HyundaiModel) => {
    selectedModel.value = model;
    await fetchAccessories(model.groupId, model.name);
  };
  
  const fetchAccessories = async (groupId?: string, modelName?: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const params: Record<string, string> = {};
      if (groupId) params.groupId = groupId;
      if (modelName) params.model = modelName;
      
      const response = await $fetch<{
        success: boolean;
        accessories: Accessory[];
        accessoryPacks: AccessoryPack[];
        categories: string[];
        categorizedAccessories: Record<string, Accessory[]>;
        error?: string;
      }>('/api/accessories', { params });
      
      if (response.success) {
        accessories.value = response.accessories || [];
        accessoryPacks.value = response.accessoryPacks || [];
        categories.value = response.categories || [];
        categorizedAccessories.value = response.categorizedAccessories || {};
      } else {
        error.value = response.error || 'Failed to load accessories';
        accessories.value = [];
        accessoryPacks.value = [];
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch accessories';
      console.error('Error fetching accessories:', e);
    } finally {
      isLoading.value = false;
    }
  };
  
  const addToCart = (accessory: Accessory | AccessoryPack, type: 'accessory' | 'pack' = 'accessory') => {
    const existingItem = cartItems.value.find(item => item.accessory.id === accessory.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.value.push({
        accessory,
        quantity: 1,
        type,
      });
    }

    trackCartEvent('add_to_cart', [{ accessory, quantity: 1, type }], { source: 'accessories_store' });
    
    // Show cart notification
    if (process.client) {
      const { toast } = useToast();
      toast.success(`${accessory.name} added to cart`);
    }
  };
  
  const removeFromCart = (accessoryId: string) => {
    const index = cartItems.value.findIndex(item => item.accessory.id === accessoryId);
    if (index !== -1) {
      const removedItem = { ...cartItems.value[index] };
      cartItems.value.splice(index, 1);
      trackCartEvent('remove_from_cart', [removedItem], { source: 'accessories_cart' });
    }
  };
  
  const updateCartQuantity = (accessoryId: string, quantity: number) => {
    const item = cartItems.value.find(item => item.accessory.id === accessoryId);
    if (item) {
      if (quantity <= 0) {
        removeFromCart(accessoryId);
      } else {
        const previousQuantity = item.quantity;
        item.quantity = quantity;

        const quantityDelta = quantity - previousQuantity;
        if (quantityDelta > 0) {
          trackCartEvent('add_to_cart', [{ ...item, quantity: quantityDelta }], { source: 'accessories_cart' });
        } else if (quantityDelta < 0) {
          trackCartEvent('remove_from_cart', [{ ...item, quantity: Math.abs(quantityDelta) }], { source: 'accessories_cart' });
        }
      }
    }
  };
  
  const clearCart = (options: { track?: boolean; reason?: string } = {}) => {
    const shouldTrack = options.track !== false;
    const removedItems = [...cartItems.value];
    cartItems.value = [];

    if (shouldTrack && removedItems.length > 0) {
      trackCartEvent('clear_cart', removedItems, {
        source: 'accessories_cart',
        reason: options.reason || 'user_clear',
      });
    }
  };
  
  const toggleCart = (show?: boolean) => {
    const nextShow = show !== undefined ? show : !showCart.value;
    const wasShown = showCart.value;
    showCart.value = nextShow;

    if (nextShow && !wasShown) {
      trackCartEvent('view_cart', cartItems.value, { source: 'accessories_cart' });
    }
  };

  const trackQuoteRequest = (source = 'accessories_cart') => {
    if (cartItems.value.length === 0) return;

    trackCartEvent('accessories_quote_start', cartItems.value, { source });
  };
  
  const setCategory = (category: string | null) => {
    selectedCategory.value = category;
  };
  
  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };
  
  const setSortBy = (sort: 'name' | 'price-asc' | 'price-desc' | 'popular') => {
    sortBy.value = sort;
  };
  
  const togglePopularFilter = () => {
    showOnlyPopular.value = !showOnlyPopular.value;
  };
  
  const resetFilters = () => {
    selectedCategory.value = null;
    searchQuery.value = '';
    showOnlyPopular.value = false;
    sortBy.value = 'name';
  };
  
  return {
    // State
    selectedModel,
    accessories,
    accessoryPacks,
    categories,
    categorizedAccessories,
    isLoading,
    error,
    cartItems,
    showCart,
    selectedCategory,
    searchQuery,
    showOnlyPopular,
    sortBy,

    // Getters
    availableModels,
    modelsByCategory,
    filteredAccessories,
    cartTotal,
    cartItemCount,
    isInCart,
    getAccessoryById,

    // Actions
    selectModel,
    fetchAccessories,
    fetchOEMModels,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    toggleCart,
    trackQuoteRequest,
    setCategory,
    setSearchQuery,
    setSortBy,
    togglePopularFilter,
    resetFilters,
  };
}, {
  persist: {
    // Only persist on client to prevent SSR hydration mismatch
    // Storage is undefined on server, so persist is skipped during SSR
    storage: import.meta.client ? localStorage : undefined,
    paths: ['cartItems', 'selectedModel'],
  },
});
