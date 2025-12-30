<template>
  <div class="contact-details uk-section">
    <div class="uk-container">
      <div class="uk-grid uk-grid-large uk-flex-middle" uk-grid>
        <!-- Left Column - Info -->
        <div class="uk-width-1-2@m">
          <div class="uk-text-meta" v-if="lmct">LMCT: {{ lmct }}</div>
          <h2 class="uk-h1">{{ siteName }} Departments</h2>
          <div v-if="description" v-html="description"></div>
        </div>

        <!-- Right Column - Accordion -->
        <div class="uk-width-1-2@m">
          <ul uk-accordion class="uk-accordion">
            <!-- General Enquiry / Sales -->
            <li v-if="departments.sales" class="uk-open">
              <a class="uk-accordion-title" href="#">General Enquiry</a>
              <div class="uk-accordion-content">
                <DepartmentInfo 
                  :department="departments.sales" 
                  @search="showSearch" 
                />
              </div>
            </li>

            <!-- Service -->
            <li v-if="departments.service">
              <a class="uk-accordion-title" href="#">Service Enquiry</a>
              <div class="uk-accordion-content">
                <DepartmentInfo 
                  :department="departments.service"
                  action-link="/service"
                  action-text="Book a Service"
                />
              </div>
            </li>

            <!-- Parts -->
            <li v-if="departments.parts">
              <a class="uk-accordion-title" href="#">Parts Enquiry</a>
              <div class="uk-accordion-content">
                <DepartmentInfo 
                  :department="departments.parts"
                  action-link="/parts"
                  action-text="Parts Enquiry"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const mainStore = useMainStore();

const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const description = computed(() => mainStore.site?.description || '');
const lmct = computed(() => mainStore.site?.lmct || '');
const departments = computed(() => mainStore.site?.departments || {});

const showSearch = () => {
  // Emit event to show global search
  if (process.client) {
    window.dispatchEvent(new CustomEvent('open-search'));
  }
};
</script>

<script lang="ts">
// Department Info Sub-component
const DepartmentInfo = defineComponent({
  props: {
    department: { type: Object, required: true },
    actionLink: { type: String, default: '' },
    actionText: { type: String, default: '' },
  },
  emits: ['search'],
  setup(props, { emit }) {
    const formatPhone = (phone: string) => {
      if (!phone) return '';
      return phone.replace(/[^0-9+]/g, '');
    };

    const formatTime = (time: string) => {
      if (!time) return '';
      const d = new Date(time);
      const hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'pm' : 'am';
      const hour12 = hours > 12 ? hours - 12 : hours || 12;
      return `${hour12}:${mins}${period}`;
    };

    return { formatPhone, formatTime, emit };
  },
  template: `
    <div class="department-info">
      <!-- Address -->
      <div v-if="department.address" class="uk-margin-small">
        <span uk-icon="location" class="uk-margin-small-right"></span>
        <span>{{ department.address }}</span>
      </div>

      <!-- Directions -->
      <div v-if="department.map_directions" class="uk-margin-small">
        <a :href="department.map_directions" target="_blank" class="uk-link-muted">
          <span uk-icon="forward" class="uk-margin-small-right"></span>
          Get Directions
        </a>
      </div>

      <!-- Phone -->
      <div v-if="department.phone" class="uk-margin-small">
        <a :href="'tel:' + formatPhone(department.phone)" class="uk-link-text">
          <span uk-icon="receiver" class="uk-margin-small-right uk-text-primary"></span>
          {{ department.phone }}
        </a>
      </div>

      <!-- Action Link -->
      <div v-if="actionLink" class="uk-margin-small">
        <NuxtLink :to="actionLink" class="uk-link-text">
          <span uk-icon="cog" class="uk-margin-small-right uk-text-primary"></span>
          {{ actionText }}
        </NuxtLink>
      </div>

      <!-- Search Stock -->
      <div v-if="!actionLink" class="uk-margin-small">
        <a href="#" @click.prevent="emit('search')" class="uk-link-text">
          <span uk-icon="search" class="uk-margin-small-right uk-text-primary"></span>
          Search Our Stock
        </a>
      </div>

      <!-- Trading Hours -->
      <div v-if="department.trading" class="uk-margin-top">
        <div class="uk-text-bold uk-margin-small-bottom">
          <span uk-icon="clock" class="uk-margin-small-right"></span>
          Trading Hours
        </div>
        <ul class="uk-list uk-list-collapse uk-text-small">
          <li class="uk-flex uk-flex-between">
            <span>Monday – Friday</span>
            <span v-if="department.trading.monday?.[0]?.open">
              {{ formatTime(department.trading.monday[0].open) }} – {{ formatTime(department.trading.friday?.[0]?.close) }}
            </span>
          </li>
          <li class="uk-flex uk-flex-between">
            <span>Saturday</span>
            <span v-if="department.trading.saturday?.[0]?.current?.value !== 'open'">
              {{ department.trading.saturday?.[0]?.current?.label || 'Closed' }}
            </span>
            <span v-else>
              {{ formatTime(department.trading.saturday?.[0]?.open) }} – {{ formatTime(department.trading.saturday?.[0]?.close) }}
            </span>
          </li>
          <li class="uk-flex uk-flex-between">
            <span>Sunday</span>
            <span v-if="department.trading.sunday?.[0]?.current?.value !== 'open'">
              {{ department.trading.sunday?.[0]?.current?.label || 'Closed' }}
            </span>
            <span v-else>
              {{ formatTime(department.trading.sunday?.[0]?.open) }} – {{ formatTime(department.trading.sunday?.[0]?.close) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  `,
});
</script>

<style scoped>
.uk-accordion-title {
  font-weight: 600;
}

.uk-accordion > li.uk-open .uk-accordion-title {
  background-color: #fff;
  box-shadow: 0 -7px 8px rgba(0, 0, 0, 0.08);
}

.uk-accordion > li.uk-open .uk-accordion-content {
  background-color: #fff;
  box-shadow: 0 7px 8px rgba(0, 0, 0, 0.08);
  padding: 15px;
  margin-top: 0;
}
</style>









