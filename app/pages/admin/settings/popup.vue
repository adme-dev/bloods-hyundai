<template>
  <div class="space-y-6">
    <div>
      <NuxtLink to="/admin/settings" class="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
        <ChevronLeft class="h-4 w-4" />
        Back to Settings
      </NuxtLink>
      <h1 class="text-3xl font-semibold tracking-tight">Popup Settings</h1>
      <p class="text-sm text-muted-foreground">Configure an auto-popup to display site-wide or on specific pages</p>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Error loading settings</AlertTitle>
      <AlertDescription>
        {{ error.message || 'Failed to load popup settings. Please try again.' }}
        <Button variant="outline" size="sm" class="mt-2" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Retry
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Settings Form -->
    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle>Auto-Popup Configuration</CardTitle>
          <CardDescription>
            When enabled, the popup will automatically appear to visitors based on your settings
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Enable Toggle -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label class="text-base">Enable Auto-Popup</Label>
              <p class="text-sm text-muted-foreground">
                Show the popup automatically when visitors land on your site
              </p>
            </div>
            <Switch v-model="form.enabled" />
          </div>

          <!-- Popup Configuration (when enabled) -->
          <div v-if="form.enabled" class="space-y-6 pt-4 border-t">
            <!-- Title -->
            <div class="space-y-2">
              <Label for="title">Popup Title</Label>
              <Input
                id="title"
                v-model="form.title"
                placeholder="Apply for Finance"
              />
            </div>

            <!-- Iframe URL -->
            <div class="space-y-2">
              <Label for="iframeUrl">Iframe URL</Label>
              <Textarea
                id="iframeUrl"
                v-model="form.iframeUrl"
                placeholder="https://apply.youxpowered.com.au/m5287"
                :rows="2"
                class="font-mono text-sm"
              />
              <p class="text-xs text-muted-foreground">
                Enter the URL for the iframe content to display in the popup
              </p>
            </div>

            <!-- Display Mode -->
            <div class="space-y-3">
              <Label>Display On</Label>
              <div class="flex flex-col gap-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    v-model="form.displayMode"
                    value="all"
                    class="h-4 w-4 text-primary"
                  />
                  <div>
                    <span class="font-medium">All Pages</span>
                    <p class="text-sm text-muted-foreground">Show the popup on every page of your site</p>
                  </div>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    v-model="form.displayMode"
                    value="specific"
                    class="h-4 w-4 text-primary"
                  />
                  <div>
                    <span class="font-medium">Specific Pages Only</span>
                    <p class="text-sm text-muted-foreground">Choose which pages show the popup</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Specific Pages Selection -->
            <div v-if="form.displayMode === 'specific'" class="space-y-3 pl-7">
              <Label>Select Pages</Label>
              <div class="grid grid-cols-2 gap-2">
                <label v-for="page in availablePages" :key="page.path" class="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-muted/50">
                  <input
                    type="checkbox"
                    :value="page.path"
                    v-model="form.specificPages"
                    class="h-4 w-4 text-primary rounded"
                  />
                  <span class="text-sm">{{ page.label }}</span>
                </label>
              </div>
            </div>

            <!-- Date Range -->
            <div class="space-y-4">
              <Label class="text-base">Schedule (Optional)</Label>
              <p class="text-sm text-muted-foreground -mt-2">Set start and end dates to automatically enable/disable the popup</p>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    v-model="form.startDate"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    v-model="form.endDate"
                  />
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                Leave empty for no date restrictions
              </p>
            </div>

            <!-- Display Options -->
            <div class="space-y-4 pt-4 border-t">
              <Label class="text-base">Display Options</Label>

              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label>Show Once Per Session</Label>
                  <p class="text-sm text-muted-foreground">
                    Only show the popup once per browser session (recommended)
                  </p>
                </div>
                <Switch v-model="form.showOncePerSession" />
              </div>

              <div class="space-y-2">
                <Label for="delaySeconds">Delay (seconds)</Label>
                <Input
                  id="delaySeconds"
                  type="number"
                  v-model.number="form.delaySeconds"
                  min="0"
                  max="60"
                  class="w-24"
                />
                <p class="text-xs text-muted-foreground">
                  How long to wait before showing the popup (0 = immediately)
                </p>
              </div>
            </div>

            <!-- Preview -->
            <div v-if="form.iframeUrl" class="space-y-2 pt-4 border-t">
              <Label>Preview</Label>
              <div class="border rounded-lg overflow-hidden bg-gray-50">
                <div class="p-2 bg-gray-100 border-b flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">{{ form.title }}</span>
                  <Badge variant="outline" class="text-xs">Preview</Badge>
                </div>
                <div class="p-4">
                  <div class="aspect-video max-h-[300px]">
                    <iframe
                      :src="form.iframeUrl"
                      class="w-full h-full border-0 rounded"
                      title="Popup Preview"
                      sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Disabled info -->
          <div v-else class="rounded-lg bg-gray-50 p-4 border">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <Info class="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900">Popup Disabled</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Enable the popup above to configure auto-display settings.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pt-6">
          <div class="flex items-center justify-between w-full">
            <p v-if="saveSuccess" class="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4" />
              Settings saved successfully
            </p>
            <div v-else></div>
            <Button @click="saveSettings" :disabled="saving">
              <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <!-- Status Summary -->
      <Card v-if="form.enabled">
        <CardHeader>
          <CardTitle class="text-base">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="isCurrentlyActive ? 'bg-green-500' : 'bg-yellow-500'"></div>
              <span>{{ isCurrentlyActive ? 'Active' : 'Scheduled' }}</span>
            </div>
            <p class="text-muted-foreground">
              <template v-if="form.displayMode === 'all'">
                Displaying on all pages
              </template>
              <template v-else>
                Displaying on {{ form.specificPages.length }} selected page(s)
              </template>
            </p>
            <p v-if="form.startDate || form.endDate" class="text-muted-foreground">
              <template v-if="form.startDate && form.endDate">
                Scheduled: {{ formatDate(form.startDate) }} - {{ formatDate(form.endDate) }}
              </template>
              <template v-else-if="form.startDate">
                Starts: {{ formatDate(form.startDate) }}
              </template>
              <template v-else-if="form.endDate">
                Ends: {{ formatDate(form.endDate) }}
              </template>
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Error Alert -->
      <Alert v-if="saveError" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Error saving settings</AlertTitle>
        <AlertDescription>{{ saveError }}</AlertDescription>
      </Alert>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Info,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

// Available pages for selection
const availablePages = [
  { path: '/', label: 'Home' },
  { path: '/car-sales', label: 'Used Cars' },
  { path: '/new-cars', label: 'New Cars' },
  { path: '/special-offers', label: 'Special Offers' },
  { path: '/service', label: 'Service' },
  { path: '/parts', label: 'Parts' },
  { path: '/contact', label: 'Contact' },
  { path: '/about', label: 'About' },
  { path: '/finance', label: 'Finance' },
  { path: '/accessories', label: 'Accessories' },
];

// Fetch current settings
const { data, pending, error, refresh } = await useFetch('/api/admin/settings/popup');

// Form state
const form = reactive({
  enabled: false,
  iframeUrl: '',
  title: 'Apply for Finance',
  displayMode: 'all' as 'all' | 'specific',
  specificPages: [] as string[],
  startDate: '',
  endDate: '',
  showOncePerSession: true,
  delaySeconds: 3,
});

// Initialize form when data loads
watch(data, (newData) => {
  if (newData?.settings) {
    form.enabled = newData.settings.enabled ?? false;
    form.iframeUrl = newData.settings.iframeUrl ?? '';
    form.title = newData.settings.title ?? 'Apply for Finance';
    form.displayMode = newData.settings.displayMode ?? 'all';
    form.specificPages = newData.settings.specificPages ?? [];
    form.startDate = newData.settings.startDate ? formatDateForInput(newData.settings.startDate) : '';
    form.endDate = newData.settings.endDate ? formatDateForInput(newData.settings.endDate) : '';
    form.showOncePerSession = newData.settings.showOncePerSession ?? true;
    form.delaySeconds = newData.settings.delaySeconds ?? 3;
  }
}, { immediate: true });

// Helper to format date for datetime-local input
const formatDateForInput = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
};

// Helper to format date for display
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Check if currently active
const isCurrentlyActive = computed(() => {
  if (!form.enabled) return false;
  const now = new Date();
  if (form.startDate && new Date(form.startDate) > now) return false;
  if (form.endDate && new Date(form.endDate) < now) return false;
  return true;
});

// Save state
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref(false);

// Save settings
const saveSettings = async () => {
  saving.value = true;
  saveError.value = '';
  saveSuccess.value = false;

  try {
    await $fetch('/api/admin/settings/popup', {
      method: 'PUT',
      body: {
        enabled: form.enabled,
        iframeUrl: form.iframeUrl || null,
        title: form.title || 'Apply for Finance',
        displayMode: form.displayMode,
        specificPages: form.specificPages,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        showOncePerSession: form.showOncePerSession,
        delaySeconds: form.delaySeconds,
      },
    });

    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err: any) {
    saveError.value = err.data?.message || 'Failed to save settings';
  } finally {
    saving.value = false;
  }
};
</script>
