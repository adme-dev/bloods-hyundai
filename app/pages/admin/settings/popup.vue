<template>
  <div class="space-y-6">
    <AdminPageHeader title="Popup Settings" description="Configure an auto-popup to display site-wide or on specific pages">
      <template #actions><Button variant="ghost" size="sm" as-child><NuxtLink to="/admin/settings"><ChevronLeft class="mr-2 h-4 w-4" /> Settings</NuxtLink></Button></template>
    </AdminPageHeader>

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
                placeholder="Special Offer"
              />
            </div>

            <!-- Content Type Selection -->
            <div class="space-y-3">
              <Label>Content Type</Label>
              <div class="grid grid-cols-2 gap-4">
                <label
                  class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                  :class="form.contentType === 'custom' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'"
                >
                  <input
                    type="radio"
                    v-model="form.contentType"
                    value="custom"
                    class="sr-only"
                  />
                  <FileText class="h-8 w-8" :class="form.contentType === 'custom' ? 'text-primary' : 'text-muted-foreground'" />
                  <div class="text-center">
                    <span class="font-medium block">Custom Content</span>
                    <span class="text-xs text-muted-foreground">HTML with images</span>
                  </div>
                </label>
                <label
                  class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                  :class="form.contentType === 'iframe' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'"
                >
                  <input
                    type="radio"
                    v-model="form.contentType"
                    value="iframe"
                    class="sr-only"
                  />
                  <Globe class="h-8 w-8" :class="form.contentType === 'iframe' ? 'text-primary' : 'text-muted-foreground'" />
                  <div class="text-center">
                    <span class="font-medium block">External Iframe</span>
                    <span class="text-xs text-muted-foreground">Finance widget URL</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Custom Content Editor -->
            <div v-if="form.contentType === 'custom'" class="space-y-4">
              <!-- Image Upload -->
              <div class="space-y-2">
                <Label>Popup Image (Optional)</Label>
                <div class="border-2 border-dashed rounded-lg p-4">
                  <div v-if="form.imageUrl" class="relative">
                    <img :src="form.imageUrl" alt="Popup image" class="max-h-48 mx-auto rounded" />
                    <Button
                      variant="destructive"
                      size="sm"
                      class="absolute top-2 right-2"
                      @click="removeImage"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                  <div v-else class="text-center py-4">
                    <ImageIcon class="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p class="text-sm text-muted-foreground mb-2">Upload an image for your popup</p>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      ref="imageInput"
                      @change="handleImageUpload"
                    />
                    <Button variant="outline" size="sm" @click="imageInput?.click()" :disabled="uploading">
                      <Upload v-if="!uploading" class="mr-2 h-4 w-4" />
                      <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
                      {{ uploading ? 'Uploading...' : 'Upload Image' }}
                    </Button>
                  </div>
                </div>
              </div>

              <!-- HTML Content -->
              <div class="space-y-2">
                <Label for="htmlContent">Content (HTML)</Label>
                <Textarea
                  id="htmlContent"
                  v-model="form.htmlContent"
                  placeholder="<h2>Special Offer!</h2>
<p>Get approved for finance today with our exclusive rates.</p>
<a href='/finance' class='btn'>Apply Now</a>"
                  :rows="8"
                  class="font-mono text-sm"
                />
                <p class="text-xs text-muted-foreground">
                  Enter HTML content. You can use basic HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;a&gt;, &lt;ul&gt;, etc.
                </p>
              </div>

              <!-- Button Configuration -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    v-model="form.buttonText"
                    placeholder="Apply Now"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="buttonUrl">Button Link</Label>
                  <Input
                    id="buttonUrl"
                    v-model="form.buttonUrl"
                    placeholder="/finance"
                  />
                </div>
              </div>
            </div>

            <!-- Iframe URL (when iframe mode) -->
            <div v-else class="space-y-2">
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
            <div class="space-y-3 pt-4 border-t">
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
            <div class="space-y-4 pt-4 border-t">
              <Label class="text-base">Schedule (Optional)</Label>
              <p class="text-sm text-muted-foreground -mt-2">Set start and end dates to automatically enable/disable the popup</p>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="startDate">Start Date</Label>
                  <AdminDateTimePicker
                    id="startDate"
                    v-model="form.startDate"
                    label="Schedule start"
                    :max="form.endDate || undefined"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="endDate">End Date</Label>
                  <AdminDateTimePicker
                    id="endDate"
                    v-model="form.endDate"
                    label="Schedule end"
                    :min="form.startDate || undefined"
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
                    Only show the popup once per browser session
                  </p>
                </div>
                <Switch v-model="form.showOncePerSession" />
              </div>

              <!-- Cooldown Minutes (when not using session-once) -->
              <div v-if="!form.showOncePerSession" class="space-y-2">
                <Label for="cooldownMinutes">Re-show after (minutes)</Label>
                <Input
                  id="cooldownMinutes"
                  type="number"
                  v-model.number="form.cooldownMinutes"
                  min="1"
                  max="1440"
                  class="w-32"
                />
                <p class="text-xs text-muted-foreground">
                  If the user closes the popup, show it again after this many minutes (e.g., 5 = every 5 minutes)
                </p>
              </div>

              <div class="space-y-2">
                <Label for="delaySeconds">Initial delay (seconds)</Label>
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
            <div class="space-y-2 pt-4 border-t">
              <Label>Preview</Label>
              <div class="border rounded-lg overflow-hidden bg-muted/40">
                <div class="p-3 bg-muted border-b flex items-center justify-between">
                  <span class="font-medium">{{ form.title }}</span>
                  <Badge variant="outline" class="text-xs">Preview</Badge>
                </div>
                <div class="p-4">
                  <!-- Custom Content Preview -->
                  <div v-if="form.contentType === 'custom'" class="space-y-4">
                    <img v-if="form.imageUrl" :src="form.imageUrl" alt="Popup image" class="max-h-48 mx-auto rounded" />
                    <div v-if="form.htmlContent" v-html="form.htmlContent" class="prose prose-sm max-w-none"></div>
                    <div v-if="form.buttonText" class="text-center">
                      <span class="inline-block px-6 py-2 bg-primary text-primary-foreground rounded font-medium">
                        {{ form.buttonText }}
                      </span>
                    </div>
                    <p v-if="!form.imageUrl && !form.htmlContent && !form.buttonText" class="text-center text-muted-foreground py-8">
                      Add content above to see preview
                    </p>
                  </div>
                  <!-- Iframe Preview -->
                  <div v-else class="aspect-video max-h-[300px]">
                    <iframe
                      v-if="safeIframeUrl"
                      :src="safeIframeUrl"
                      class="w-full h-full border-0 rounded"
                      title="Popup Preview"
                      sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                    />
                    <p v-else class="text-center text-muted-foreground py-8">
                      Enter an iframe URL to see preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Disabled info -->
          <div v-else class="rounded-lg bg-muted/40 p-4 border">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <Info class="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-foreground">Popup Disabled</h4>
                <p class="text-sm text-muted-foreground mt-1">
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
              Content type: {{ form.contentType === 'custom' ? 'Custom HTML' : 'External Iframe' }}
            </p>
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
  FileText,
  Globe,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { extractSafeIframeUrl } from '~/utils/iframe';

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

type PopupSettings = {
  enabled: boolean;
  contentType: 'custom' | 'iframe';
  iframeUrl: string;
  title: string;
  htmlContent: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  displayMode: 'all' | 'specific';
  specificPages: string[];
  startDate: string | null;
  endDate: string | null;
  showOncePerSession: boolean;
  cooldownMinutes: number;
  delaySeconds: number;
};

type PopupSettingsResponse = {
  success: boolean;
  settings: PopupSettings;
};

// Fetch current settings
const { data, pending, error, refresh } = await useFetch<PopupSettingsResponse>('/api/admin/settings/popup');

// Form state
const form = reactive({
  enabled: false,
  contentType: 'custom' as 'custom' | 'iframe',
  iframeUrl: '',
  title: 'Special Offer',
  htmlContent: '',
  imageUrl: '',
  buttonText: '',
  buttonUrl: '',
  displayMode: 'all' as 'all' | 'specific',
  specificPages: [] as string[],
  startDate: '',
  endDate: '',
  showOncePerSession: true,
  cooldownMinutes: 5,
  delaySeconds: 3,
});

// Image upload state
const uploading = ref(false);
const imageInput = ref<HTMLInputElement | null>(null);

// Initialize form when data loads
watch(data, (newData) => {
  if (newData?.settings) {
    form.enabled = newData.settings.enabled ?? false;
    form.contentType = newData.settings.contentType ?? 'custom';
    form.iframeUrl = newData.settings.iframeUrl ?? '';
    form.title = newData.settings.title ?? 'Special Offer';
    form.htmlContent = newData.settings.htmlContent ?? '';
    form.imageUrl = newData.settings.imageUrl ?? '';
    form.buttonText = newData.settings.buttonText ?? '';
    form.buttonUrl = newData.settings.buttonUrl ?? '';
    form.displayMode = newData.settings.displayMode ?? 'all';
    form.specificPages = newData.settings.specificPages ?? [];
    form.startDate = newData.settings.startDate ? formatDateForInput(newData.settings.startDate) : '';
    form.endDate = newData.settings.endDate ? formatDateForInput(newData.settings.endDate) : '';
    form.showOncePerSession = newData.settings.showOncePerSession ?? true;
    form.cooldownMinutes = newData.settings.cooldownMinutes ?? 5;
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

const safeIframeUrl = computed(() => extractSafeIframeUrl(form.iframeUrl));

// Check if currently active
const isCurrentlyActive = computed(() => {
  if (!form.enabled) return false;
  const now = new Date();
  if (form.startDate && new Date(form.startDate) > now) return false;
  if (form.endDate && new Date(form.endDate) < now) return false;
  return true;
});

// Image upload handler
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;

  try {
    // Get presigned URL
    const presignResponse = await $fetch<{ url: string; key: string }>('/api/admin/upload/presign', {
      method: 'POST',
      body: {
        filename: file.name,
        contentType: file.type,
        folder: 'popup',
      },
    });

    // Upload to R2
    await fetch(presignResponse.url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    // Set the image URL
    const baseUrl = presignResponse.url.split('?')[0] ?? '';
    form.imageUrl = baseUrl;
  } catch (err) {
    console.error('Image upload failed:', err);
  } finally {
    uploading.value = false;
    if (target) target.value = '';
  }
};

// Remove image
const removeImage = () => {
  form.imageUrl = '';
};

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
    await $fetch('/api/admin/settings/popup' as string, {
      method: 'PUT',
      body: {
        enabled: form.enabled,
        contentType: form.contentType,
        iframeUrl: form.iframeUrl || null,
        title: form.title || 'Special Offer',
        htmlContent: form.htmlContent || null,
        imageUrl: form.imageUrl || null,
        buttonText: form.buttonText || null,
        buttonUrl: form.buttonUrl || null,
        displayMode: form.displayMode,
        specificPages: form.specificPages,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        showOncePerSession: form.showOncePerSession,
        cooldownMinutes: form.cooldownMinutes,
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
