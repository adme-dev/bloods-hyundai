/**
 * Price Builder Store
 * Manages state for the car configurator/price builder
 */
import { defineStore } from 'pinia';

interface Variant {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  image?: string;
  specifications?: any;
  fuelType?: string;
  transmission?: string;
  engineType?: string;
}

interface Accessory {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  selected: boolean;
}

interface AccessoryPack {
  id: string;
  name: string;
  price: number;
  savingsAmount: number;
  accessories: string[]; // IDs of included accessories
  selected: boolean;
}

interface FinanceOptions {
  deposit: number;
  term: number; // months
  interestRate: number;
  residual: number;
  monthlyPayment: number;
}

export const usePriceBuilderStore = defineStore('priceBuilder', {
  state: () => ({
    // Selected model/variant
    selectedModel: null as string | null,
    selectedVariant: null as Variant | null,
    
    // Available variants for model
    availableVariants: [] as Variant[],
    
    // Accessories
    accessories: [] as Accessory[],
    accessoryPacks: [] as AccessoryPack[],
    
    // Finance options
    financeOptions: {
      deposit: 0,
      term: 60,
      interestRate: 6.99,
      residual: 0,
      monthlyPayment: 0,
    } as FinanceOptions,
    
    // Trade-in
    tradeIn: {
      enabled: false,
      value: 0,
      make: '',
      model: '',
      year: '',
      odometer: 0,
    },
    
    // Loading states
    loadingVariants: false,
    loadingAccessories: false,
    
    // Errors
    error: null as string | null,
  }),

  getters: {
    // Base price
    basePrice: (state) => state.selectedVariant?.price || 0,
    
    // Total accessory price
    accessoriesPrice: (state) => {
      const accessoryTotal = state.accessories
        .filter(a => a.selected)
        .reduce((sum, a) => sum + a.price, 0);
      
      const packTotal = state.accessoryPacks
        .filter(p => p.selected)
        .reduce((sum, p) => sum + p.price, 0);
      
      return accessoryTotal + packTotal;
    },
    
    // Total savings from packs
    packSavings: (state) => {
      return state.accessoryPacks
        .filter(p => p.selected)
        .reduce((sum, p) => sum + p.savingsAmount, 0);
    },
    
    // Selected accessories list
    selectedAccessories: (state) => state.accessories.filter(a => a.selected),
    
    // Selected packs list
    selectedPacks: (state) => state.accessoryPacks.filter(p => p.selected),
    
    // Subtotal (before trade-in)
    subtotal(): number {
      return this.basePrice + this.accessoriesPrice;
    },
    
    // Trade-in adjustment
    tradeInValue: (state) => state.tradeIn.enabled ? state.tradeIn.value : 0,
    
    // Final price (after trade-in)
    finalPrice(): number {
      return this.subtotal - this.tradeInValue;
    },
    
    // Finance amount (final price - deposit)
    financeAmount(): number {
      return this.finalPrice - this.financeOptions.deposit;
    },
    
    // Formatted prices
    formattedBasePrice(): string {
      return `$${this.basePrice.toLocaleString()}`;
    },
    
    formattedAccessoriesPrice(): string {
      return `$${this.accessoriesPrice.toLocaleString()}`;
    },
    
    formattedFinalPrice(): string {
      return `$${this.finalPrice.toLocaleString()}`;
    },
  },

  actions: {
    // Set selected model
    setModel(modelSlug: string) {
      this.selectedModel = modelSlug;
      this.selectedVariant = null;
      this.accessories = [];
      this.accessoryPacks = [];
    },
    
    // Set selected variant
    setVariant(variant: Variant) {
      this.selectedVariant = variant;
    },
    
    // Load variants for model
    async loadVariants(modelSlug: string) {
      this.loadingVariants = true;
      this.error = null;
      
      try {
        const data = await $fetch(`/api/variant-details`, {
          params: { variantId: modelSlug },
        });
        
        // Process variants data
        // This would need to be adapted based on actual API response
        this.availableVariants = []; // Populate from data
        
        if (this.availableVariants.length > 0) {
          this.selectedVariant = this.availableVariants[0];
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to load variants';
        console.error('Error loading variants:', err);
      } finally {
        this.loadingVariants = false;
      }
    },
    
    // Load accessories for model
    async loadAccessories(modelSlug: string) {
      this.loadingAccessories = true;
      
      try {
        const data = await $fetch<any>('/api/accessories', {
          params: { model: modelSlug },
        });
        
        if (data.success) {
          this.accessories = (data.accessories || []).map((a: any) => ({
            ...a,
            selected: false,
          }));
          
          this.accessoryPacks = (data.accessoryPacks || []).map((p: any) => ({
            ...p,
            selected: false,
          }));
        }
      } catch (err) {
        console.error('Error loading accessories:', err);
      } finally {
        this.loadingAccessories = false;
      }
    },
    
    // Toggle accessory selection
    toggleAccessory(id: string) {
      const accessory = this.accessories.find(a => a.id === id);
      if (accessory) {
        accessory.selected = !accessory.selected;
      }
    },
    
    // Toggle pack selection
    togglePack(id: string) {
      const pack = this.accessoryPacks.find(p => p.id === id);
      if (pack) {
        pack.selected = !pack.selected;
        
        // If pack is selected, deselect individual accessories that are in the pack
        if (pack.selected) {
          pack.accessories.forEach(accId => {
            const acc = this.accessories.find(a => a.id === accId);
            if (acc) acc.selected = false;
          });
        }
      }
    },
    
    // Clear all selected accessories
    clearAccessories() {
      this.accessories.forEach(a => a.selected = false);
      this.accessoryPacks.forEach(p => p.selected = false);
    },
    
    // Update finance options
    updateFinanceOptions(options: Partial<FinanceOptions>) {
      this.financeOptions = { ...this.financeOptions, ...options };
      this.calculateMonthlyPayment();
    },
    
    // Calculate monthly payment
    calculateMonthlyPayment() {
      const { deposit, term, interestRate, residual } = this.financeOptions;
      const principal = this.finalPrice - deposit - residual;
      const monthlyRate = interestRate / 100 / 12;
      
      if (monthlyRate === 0) {
        this.financeOptions.monthlyPayment = principal / term;
      } else {
        this.financeOptions.monthlyPayment = 
          (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
          (Math.pow(1 + monthlyRate, term) - 1);
      }
    },
    
    // Update trade-in
    updateTradeIn(tradeIn: Partial<typeof this.tradeIn>) {
      this.tradeIn = { ...this.tradeIn, ...tradeIn };
    },
    
    // Reset everything
    reset() {
      this.selectedModel = null;
      this.selectedVariant = null;
      this.availableVariants = [];
      this.accessories = [];
      this.accessoryPacks = [];
      this.financeOptions = {
        deposit: 0,
        term: 60,
        interestRate: 6.99,
        residual: 0,
        monthlyPayment: 0,
      };
      this.tradeIn = {
        enabled: false,
        value: 0,
        make: '',
        model: '',
        year: '',
        odometer: 0,
      };
      this.error = null;
    },
  },
  persist: {
    // Only persist on client to prevent SSR hydration mismatch
    // Storage is undefined on server, so persist is skipped during SSR
    storage: import.meta.client ? localStorage : undefined,
    paths: [
      'selectedModel',
      'selectedVariant',
      'accessories',
      'accessoryPacks',
      'financeOptions',
      'tradeIn',
    ],
  },
});
