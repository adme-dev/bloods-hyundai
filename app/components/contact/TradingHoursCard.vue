<template>
  <Card class="sticky top-4">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Clock class="w-5 h-5" />
        Trading Hours
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Department Tabs -->
      <Tabs v-model="selectedDepartment" class="w-full">
        <TabsList class="grid w-full grid-cols-3 mb-4">
          <TabsTrigger 
            v-for="dept in departmentList" 
            :key="dept.value"
            :value="dept.value"
            class="text-xs"
          >
            {{ dept.label }}
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          v-for="dept in departmentList" 
          :key="dept.value"
          :value="dept.value"
        >
          <div class="space-y-2">
            <div 
              v-for="(hours, day) in getHours(dept.value)" 
              :key="day"
              class="flex justify-between py-2 border-b border-gray-100 last:border-0"
              :class="{ 'font-medium text-[#001E50]': isToday(day) }"
            >
              <span class="text-gray-600" :class="{ 'text-[#001E50]': isToday(day) }">
                {{ day }}
                <span v-if="isToday(day)" class="text-xs ml-1">(Today)</span>
              </span>
              <span :class="hours === 'Closed' ? 'text-gray-400' : ''">
                {{ hours }}
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <!-- Contact Info -->
      <div class="mt-6 pt-4 border-t space-y-3">
        <a 
          v-if="currentPhone"
          :href="`tel:${currentPhone.replace(/\D/g, '')}`"
          class="flex items-center gap-3 text-gray-600 hover:text-[#001E50] transition-colors"
        >
          <Phone class="w-4 h-4" />
          <span>{{ currentPhone }}</span>
        </a>
        <a 
          v-if="address"
          :href="mapLink"
          target="_blank"
          class="flex items-start gap-3 text-gray-600 hover:text-[#001E50] transition-colors"
        >
          <MapPin class="w-4 h-4 mt-0.5" />
          <span class="text-sm">{{ address }}</span>
        </a>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Clock, Phone, MapPin } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';

interface Props {
  activeDepartment?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeDepartment: 'sales',
});

const mainStore = useMainStore();

// Department state - sync with parent if needed
const selectedDepartment = ref(props.activeDepartment);

watch(() => props.activeDepartment, (newVal) => {
  // Map parent department to hours department
  const mappings: Record<string, string> = {
    'sales': 'sales',
    'parts': 'parts',
    'finance': 'sales',
    'service': 'service',
    'general': 'sales',
  };
  selectedDepartment.value = mappings[newVal] || 'sales';
});

// Department configuration
const departmentList = [
  { value: 'sales', label: 'Sales' },
  { value: 'service', label: 'Service' },
  { value: 'parts', label: 'Parts' },
];

// Get hours for department
const getHours = (dept: string) => {
  const siteHours = mainStore.site?.trading_hours;
  
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

  if (siteHours && typeof siteHours === 'object') {
    if (siteHours[dept]?.hours) {
      return siteHours[dept].hours;
    }
  }

  return defaultHours;
};

// Check if day is today
const isToday = (day: string) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  return days[today] === day;
};

// Contact info
const departments = computed(() => mainStore.site?.departments || {});
const address = computed(() => departments.value.sales?.address || '');
const mapLink = computed(() => departments.value.sales?.map_directions || '#');

const currentPhone = computed(() => {
  const dept = departments.value[selectedDepartment.value];
  return dept?.phone || departments.value.sales?.phone || '(03) 5144 2877';
});
</script>







