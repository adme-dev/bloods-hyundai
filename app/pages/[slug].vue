<template>
  <div v-if="page" class="uk-background-muted">
    <LazyPageSchema />

    <!-- Page with template (form pages) -->
    <div v-if="page.template">
      <div class="uk-grid-collapse" uk-grid>
        <div class="uk-width-1-1">
          <!-- WordPress Content -->
          <div>
            <PostContent :content="page.content?.rendered || page.content" />
          </div>

          <!-- Dynamic Form Component -->
          <div class="uk-background-muted">
            <div
              class="uk-container form-wrap"
              :class="formContainerClass"
            >
              <component
                :is="dynamicComponent"
                :active-hours-tab="page.template"
                :id="page.template"
                class="uk-margin-large-bottom"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Regular page (no form template) -->
    <div v-else>
      <PostContent :content="page.content?.rendered || page.content" />
    </div>
  </div>

  <!-- Loading -->
  <div v-else-if="pending" class="uk-section uk-text-center">
    <div uk-spinner="ratio: 2"></div>
  </div>

  <!-- Not Found -->
  <div v-else class="uk-section uk-text-center">
    <h2>Page Not Found</h2>
    <p class="uk-text-muted">The page you're looking for doesn't exist.</p>
    <NuxtLink to="/" class="uk-button uk-button-primary">Return Home</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import PostContent from '~/components/content/PostContent.vue';

// Component mapping for templates
const ContactFormSection = defineAsyncComponent(() => import('~/components/contact/ContactFormSection.vue'));
const ServiceForm = defineAsyncComponent(() => import('~/components/page-elements/ServiceForm.vue'));
const FleetForm = defineAsyncComponent(() => import('~/components/page-elements/FleetForm.vue'));
const FinanceForm = defineAsyncComponent(() => import('~/components/page-elements/FinanceForm.vue'));
const PartsForm = defineAsyncComponent(() => import('~/components/page-elements/PartsForm.vue'));

const ComponentMapping: Record<string, any> = {
  contact_form: ContactFormSection,
  service_form: ServiceForm,
  fleet_form: FleetForm,
  finance_form: FinanceForm,
  parts_form: PartsForm,
};

const route = useRoute();
const config = useRuntimeConfig();

const slug = computed(() => route.params.slug as string);

// Fetch page data from CDN
const { data: page, pending, error } = await useAsyncData(
  `page-${slug.value}`,
  async () => {
    if (!config.public.cdnUrl) {
      // Fallback to API if CDN not configured
      try {
        const response = await $fetch<any>(`/api/page/${slug.value}`);
        return response?.page || response;
      } catch {
        return null;
      }
    }

    try {
      const response = await $fetch<any[]>(`${config.public.cdnUrl}/pages/${slug.value}.json`);
      return response?.[0] || null;
    } catch {
      // Fallback to API
      try {
        const response = await $fetch<any>(`/api/page/${slug.value}`);
        return response?.page || response;
      } catch {
        return null;
      }
    }
  },
  {
    watch: [slug],
  }
);

// Dynamic component based on template
const dynamicComponent = computed(() => {
  if (!page.value?.template) return null;
  return ComponentMapping[page.value.template] || null;
});

// Form container class based on template type
const formContainerClass = computed(() => {
  const template = page.value?.template;
  const largeFormTemplates = ['finance_form', 'contact_form', 'parts_form', 'fleet_form'];
  return largeFormTemplates.includes(template) ? 'uk-container-large' : 'uk-container-xsmall';
});

// SEO - use computed values for compatibility with nuxt-og-image
const siteName = config.public.siteName || 'Sale Hyundai';
const siteUrl = config.public.siteUrl || 'https://salehyundai.com.au';
const defaultOgImage = `${siteUrl}/og-image.jpg`;

const seoTitle = computed(() => page.value?.yoast_head_json?.title || page.value?.title?.rendered || page.value?.title || slug.value);
const seoDescription = computed(() => page.value?.yoast_head_json?.description || page.value?.excerpt?.rendered || `${siteName} - Your trusted Hyundai dealer in Sale, Victoria.`);
const seoOgTitle = computed(() => page.value?.yoast_head_json?.og_title || page.value?.title?.rendered || page.value?.title || '');
const seoOgDescription = computed(() => page.value?.yoast_head_json?.og_description || page.value?.excerpt?.rendered || seoDescription.value);
const seoOgImage = computed(() => page.value?.yoast_head_json?.og_image?.[0]?.url || defaultOgImage);
const canonicalUrl = computed(() => `${siteUrl}/${slug.value}`);

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  // Open Graph
  ogTitle: seoOgTitle,
  ogDescription: seoOgDescription,
  ogImage: seoOgImage,
  ogType: 'website',
  ogUrl: canonicalUrl,
  ogSiteName: siteName,
  // Twitter Card
  twitterCard: 'summary_large_image',
  twitterTitle: seoOgTitle,
  twitterDescription: seoOgDescription,
  twitterImage: seoOgImage,
});

// Canonical URL for SEO
useHead({
  link: [
    { rel: 'canonical', href: canonicalUrl },
  ],
});
</script>

<style lang="scss" scoped>
.form-wrap {
  :deep(.trading-title) {
    display: none;
  }
}
</style>







