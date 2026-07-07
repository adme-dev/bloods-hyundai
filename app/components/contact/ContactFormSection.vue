<template>
  <section class="py-12 md:py-16">
    <div class="container mx-auto px-4">
      <div class="text-center mb-8">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">
          Contact {{ siteName }}
        </h2>
        <p class="text-gray-600 mt-2">
          Send us a message and we'll get back to you
        </p>
      </div>

      <div class="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
        <!-- Form Column -->
        <div class="lg:col-span-3">
          <ContactFormCard
            form-type="general"
            :site-name="siteName"
            description="Have a question? We're here to help."
          />
        </div>

        <!-- Trading Hours Column -->
        <div class="lg:col-span-2">
          <TradingHoursCard active-department="general" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import ContactFormCard from '~/components/contact/ContactFormCard.vue';
import TradingHoursCard from '~/components/contact/TradingHoursCard.vue';

interface Props {
  activeHoursTab?: string;
  id?: string;
}

defineProps<Props>();

const mainStore = useMainStore();
const { siteName } = useSiteIdentity();
</script>

<style scoped>
.container {
  max-width: 1280px;
}
</style>
