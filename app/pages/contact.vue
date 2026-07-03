<template>
  <div class="min-h-screen bg-gray-50">
    <LazyPageSchema />

    <!-- WordPress Page Content (if available) -->
    <PostContent data-allow-mismatch="children" :content="pageContent || ''" />

    <!-- Hero Section -->
    <section class="bg-white border-b">
      <div class="container mx-auto px-4 py-12 md:py-16">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <!-- Left: Dealer Info -->
          <div>
            <p class="text-sm text-gray-500 mb-2" v-if="lmct">LMCT: {{ lmct }}</p>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {{ siteName }} Departments
            </h1>
            <p class="text-gray-600 mb-6">
              We're here to help with all your automotive needs. Contact the right department below.
            </p>
          </div>
          
          <!-- Right: Quick Contact Cards -->
          <div class="space-y-3">
            <Card 
              v-for="(dept, key) in quickContacts" 
              :key="key"
              class="cursor-pointer hover:shadow-md transition-shadow"
              @click="scrollToForm(key)"
            >
              <CardContent class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-[#001E50]/10 flex items-center justify-center">
                    <component :is="dept.icon" class="w-5 h-5 text-[#001E50]" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 m-0">{{ dept.label }}</p>
                    <p class="text-sm text-gray-500 m-0" v-if="dept.phone">{{ dept.phone }}</p>
                  </div>
                </div>
                <ChevronRight class="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Form Section -->
    <section class="py-12 md:py-16" id="contact-form">
      <div class="container mx-auto px-4">
        <div class="text-center mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900">
            Contact {{ siteName }}
          </h2>
          <p class="text-gray-600 mt-2">
            Select a department and send us a message
          </p>
        </div>

        <!-- Department Tabs -->
        <Tabs v-model="activeTab" class="max-w-5xl mx-auto">
          <TabsList class="grid w-full grid-cols-5 mb-8">
            <TabsTrigger 
              v-for="(tab, index) in tabs" 
              :key="tab.value" 
              :value="tab.value"
            >
              <component :is="tab.icon" class="w-4 h-4 mr-2 hidden sm:inline" />
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>

          <div class="grid lg:grid-cols-5 gap-8">
            <!-- Form Column -->
            <div class="lg:col-span-3">
              <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value">
                <template v-if="activeTab === tab.value">
                  <ServiceForm v-if="tab.value === 'service'" />
                  <ContactFormCard
                    v-else
                    :form-type="tab.value"
                    :site-name="siteName"
                    :show-registration="tab.value === 'parts'"
                    :description="tab.description"
                  />
                </template>
              </TabsContent>
            </div>

            <!-- Trading Hours Column -->
            <div class="lg:col-span-2">
              <TradingHoursCard :active-department="activeTab" />
            </div>
          </div>
        </Tabs>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { 
  Phone, 
  Wrench, 
  Package, 
  CreditCard, 
  MessageSquare,
  ChevronRight,
  Car
} from 'lucide-vue-next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import ContactFormCard from '~/components/contact/ContactFormCard.vue';
import TradingHoursCard from '~/components/contact/TradingHoursCard.vue';
import PostContent from '~/components/content/PostContent.vue';
import ServiceForm from '~/components/page-elements/ServiceForm.vue';

// Store
const mainStore = useMainStore();

// SEO composables must be registered before any top-level await in setup.
useSiteMeta({
  title: 'Contact Us',
  description: 'Contact Blood Hyundai for sales, service, parts, and finance enquiries.',
});

// Fetch WordPress page content
const { data: page } = await useAsyncData(
  'contact-page',
  async () => {
    try {
      const response = await $fetch<any>('/api/page/contact')
      return response?.page || response
    } catch {
      return null
    }
  }
)

// Extract page content as a string (handles both {rendered: "..."} and plain string formats)
const pageContent = computed(() => {
  if (!page.value) return null
  const content = page.value.content
  if (!content) return null
  // If content is an object with rendered property, use that
  if (typeof content === 'object' && content.rendered) {
    return content.rendered
  }
  // If content is already a string, use it directly
  if (typeof content === 'string') {
    return content
  }
  return null
})

const siteName = computed(() => mainStore.site?.name || 'Blood Hyundai');
const lmct = computed(() => mainStore.site?.lmct || '6106');
const departments = computed(() => mainStore.site?.departments || {});

// Tab state
const activeTab = ref('general');

// Tab configuration
const tabs = [
  { 
    value: 'sales', 
    label: 'Sales', 
    icon: Car,
    description: 'Looking for a new or used vehicle? Our sales team is ready to help you find the perfect car.'
  },
  { 
    value: 'parts', 
    label: 'Parts', 
    icon: Package,
    description: 'Genuine Hyundai Parts are designed to meet the highest level of quality expected by Hyundai and our customers.'
  },
  { 
    value: 'finance', 
    label: 'Finance', 
    icon: CreditCard,
    description: 'Need assistance sourcing car finance? Our friendly team can help you find the best solution.'
  },
  { 
    value: 'service', 
    label: 'Service', 
    icon: Wrench,
    description: 'Book a service or enquire about repairs and maintenance.'
  },
  { 
    value: 'general', 
    label: 'General', 
    icon: MessageSquare,
    description: 'Have a general question? We\'re here to help.'
  },
];

// Default phone from site config
const defaultPhone = computed(() => mainStore.site?.phone || '');

// Quick contact cards
const quickContacts = computed(() => ({
  sales: {
    label: 'Sales Enquiry',
    phone: departments.value.sales?.phone || defaultPhone.value,
    icon: Car,
  },
  service: {
    label: 'Service Enquiry',
    phone: departments.value.service?.phone || defaultPhone.value,
    icon: Wrench,
  },
  parts: {
    label: 'Parts Enquiry',
    phone: departments.value.parts?.phone || defaultPhone.value,
    icon: Package,
  },
  general: {
    label: 'General Enquiry',
    phone: departments.value.sales?.phone || defaultPhone.value,
    icon: Phone,
  },
}));

// Scroll to form and set active tab
const scrollToForm = (department: string) => {
  activeTab.value = department;
  nextTick(() => {
    const el = document.getElementById('contact-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  });
};
</script>

<style scoped>
.container {
  max-width: 1280px;
}
</style>
