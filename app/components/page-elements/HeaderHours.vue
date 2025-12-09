<template>
  <div class="trading-hours">
    <div class="trading-title uk-text-center uk-margin-small-bottom">
      <h3 class="uk-h4 uk-text-bold">Trading Hours</h3>
    </div>

    <!-- Tabs -->
    <ul 
      v-if="showTabs"
      :id="switchId"
      class="uk-subnav uk-subnav-pill uk-flex uk-flex-center" 
      uk-switcher
    >
      <li v-for="(department, key) in departments" :key="key" :class="{ 'uk-active': activeTab === key }">
        <a href="#">{{ department.name }}</a>
      </li>
    </ul>

    <!-- Hours content -->
    <ul class="uk-switcher uk-margin">
      <li v-for="(department, key) in departments" :key="key">
        <div class="uk-card uk-card-default uk-card-body uk-card-small">
          <table class="uk-table uk-table-small uk-table-divider uk-margin-remove">
            <tbody>
              <tr v-for="(hours, day) in department.hours" :key="day">
                <td class="uk-text-bold">{{ day }}</td>
                <td class="uk-text-right">{{ hours }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface Props {
  activeTab?: string;
  switchId?: string;
  showTabs?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: 'contact_form',
  switchId: 'hours-switcher',
  showTabs: true,
});

const mainStore = useMainStore();

// Get departments from site config or use defaults
const departments = computed(() => {
  const siteHours = mainStore.site?.trading_hours;
  
  if (siteHours && typeof siteHours === 'object' && !Array.isArray(siteHours)) {
    // If trading_hours is already an object with departments
    if (siteHours.sales || siteHours.service || siteHours.parts) {
      return siteHours;
    }
    
    // If it's just a simple hours object, wrap it
    return {
      sales: {
        name: 'Sales',
        hours: siteHours,
      },
      service: {
        name: 'Service',
        hours: siteHours,
      },
      parts: {
        name: 'Parts',
        hours: siteHours,
      },
    };
  }
  
  // Default hours
  const defaultHours = {
    Monday: '8:30am - 5:30pm',
    Tuesday: '8:30am - 5:30pm',
    Wednesday: '8:30am - 5:30pm',
    Thursday: '8:30am - 5:30pm',
    Friday: '8:30am - 5:30pm',
    Saturday: '8:30am - 4:00pm',
    Sunday: 'Closed',
  };
  
  return {
    sales: {
      name: 'Sales',
      hours: defaultHours,
    },
    service: {
      name: 'Service',
      hours: defaultHours,
    },
    parts: {
      name: 'Parts',
      hours: defaultHours,
    },
  };
});
</script>

<style scoped>
.trading-hours {
  max-width: 400px;
  margin: 0 auto;
}

.uk-subnav-pill > * > a {
  background: #f5f5f5;
  color: #333;
}

.uk-subnav-pill > .uk-active > a {
  background: var(--color-primary);
  color: white;
}

.uk-table-small td {
  padding: 10px;
}
</style>



