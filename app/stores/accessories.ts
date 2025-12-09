import { defineStore } from 'pinia';

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
export const HYUNDAI_MODELS: HyundaiModel[] = [
  // SUVs
  { name: 'Tucson', slug: 'tucson', groupId: '990EEC2C-4AFE-4AD2-B016-73BCD2EB5B44', category: 'SUV' },
  { name: 'Kona', slug: 'kona', groupId: '9F6AA9F2-17C6-4148-B47B-1054467C933B', category: 'SUV' },
  { name: 'Venue', slug: 'venue', groupId: '4AEAFF7A-088F-4686-AE85-CEF84E83D8EE', category: 'SUV' },
  { name: 'Santa Fe', slug: 'santa-fe', groupId: 'B58EB7A1-CD96-435C-A728-8E7748FE7520', category: 'SUV' },
  { name: 'Palisade', slug: 'palisade', groupId: 'A15B22F2-30DE-4B8C-8A95-9E814662ECDD', category: 'SUV' },
  
  // Electric
  { name: 'IONIQ 5', slug: 'ioniq5', groupId: 'IONIQ5_GROUP_ID', category: 'Electric' },
  { name: 'IONIQ 6', slug: 'ioniq6', groupId: 'IONIQ6_GROUP_ID', category: 'Electric' },
  { name: 'IONIQ 5 N', slug: 'ioniq5n', groupId: 'IONIQ5N_GROUP_ID', category: 'Electric' },
  { name: 'INSTER', slug: 'inster', groupId: 'INSTER_GROUP_ID', category: 'Electric' },
  
  // Hatch & Sedan
  { name: 'i30', slug: 'i30', groupId: 'C4994B0D-A89D-4113-B6CD-B5D9352512C3', category: 'Hatch' },
  { name: 'i30 Sedan', slug: 'i30-sedan', groupId: 'I30_SEDAN_GROUP_ID', category: 'Sedan' },
  
  // Performance
  { name: 'i30 N', slug: 'i30n', groupId: 'I30N_GROUP_ID', category: 'Performance' },
  { name: 'i30 Sedan N', slug: 'i30-sedan-n', groupId: 'I30_SEDAN_N_GROUP_ID', category: 'Performance' },
  { name: 'i20 N', slug: 'i20n', groupId: 'I20N_GROUP_ID', category: 'Performance' },
  
  // Vans
  { name: 'Staria', slug: 'staria', groupId: 'E14E5076-A170-4F6C-86EF-AEF77027B46A', category: 'Van' },
  { name: 'Staria Load', slug: 'staria-load', groupId: 'E14E5076-A170-4F6C-86EF-AEF77027B46A', category: 'Van' },
];

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
    
    // Show cart notification
    if (process.client) {
      const { toast } = useToast();
      toast.success(`${accessory.name} added to cart`);
    }
  };
  
  const removeFromCart = (accessoryId: string) => {
    const index = cartItems.value.findIndex(item => item.accessory.id === accessoryId);
    if (index !== -1) {
      cartItems.value.splice(index, 1);
    }
  };
  
  const updateCartQuantity = (accessoryId: string, quantity: number) => {
    const item = cartItems.value.find(item => item.accessory.id === accessoryId);
    if (item) {
      if (quantity <= 0) {
        removeFromCart(accessoryId);
      } else {
        item.quantity = quantity;
      }
    }
  };
  
  const clearCart = () => {
    cartItems.value = [];
  };
  
  const toggleCart = (show?: boolean) => {
    showCart.value = show !== undefined ? show : !showCart.value;
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
    setCategory,
    setSearchQuery,
    setSortBy,
    togglePopularFilter,
    resetFilters,
  };
}, {
  persist: {
    paths: ['cartItems', 'selectedModel'],
  },
});

