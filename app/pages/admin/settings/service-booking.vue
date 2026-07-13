<template>
  <div class="space-y-6">
    <AdminPageHeader title="Service Booking" description="Configure how customers book service appointments">
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
        {{ error.message || 'Failed to load service booking settings. Please try again.' }}
        <Button variant="outline" size="sm" class="mt-2" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Retry
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Settings Form -->
    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle>Booking Method</CardTitle>
          <CardDescription>
            Choose between the built-in service booking form or an external booking system like X-Time
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Toggle between internal and external -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label class="text-base">Use External Booking System</Label>
              <p class="text-sm text-muted-foreground">
                Enable this to display an external booking iframe instead of the built-in form
              </p>
            </div>
            <Switch v-model="form.useExternalBooking" />
          </div>

          <!-- External booking configuration -->
          <div v-if="form.useExternalBooking" class="space-y-4 pt-4 border-t">
            <div class="space-y-2">
              <Label for="provider">Booking Provider (Optional)</Label>
              <Select v-model="form.externalBookingProvider">
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xtime">X-Time</SelectItem>
                  <SelectItem value="dealer-socket">DealerSocket</SelectItem>
                  <SelectItem value="cdk">CDK Global</SelectItem>
                  <SelectItem value="reynolds">Reynolds & Reynolds</SelectItem>
                  <SelectItem value="custom">Custom / Other</SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">
                Select your booking provider for tracking purposes (optional)
              </p>
            </div>

            <div class="space-y-2">
              <Label for="iframe">Iframe URL or Embed Code</Label>
              <Textarea
                id="iframe"
                v-model="form.externalBookingIframe"
                placeholder="https://booking.example.com/dealer/12345 or paste full iframe HTML code"
                :rows="4"
                class="font-mono text-sm"
              />
              <p class="text-xs text-muted-foreground">
                Enter either:
              </p>
              <ul class="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>A direct URL (e.g., <code class="bg-muted px-1 rounded">https://xtime.com/booking/12345</code>)</li>
                <li>Full iframe embed code from your booking provider</li>
              </ul>
            </div>

            <!-- Preview -->
            <div v-if="form.externalBookingIframe" class="space-y-2">
              <Label>Preview</Label>
              <div class="border rounded-lg overflow-hidden bg-gray-50">
                <div class="p-2 bg-gray-100 border-b flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">External Booking Preview</span>
                  <Badge variant="outline" class="text-xs">
                    {{ form.externalBookingProvider || 'Custom' }}
                  </Badge>
                </div>
                <div class="p-4">
                  <div v-if="iframeUrl" class="aspect-video">
                    <iframe
                      :src="iframeUrl"
                      class="w-full h-full border-0 rounded"
                      title="Service Booking Preview"
                      sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                    />
                  </div>
                  <div v-else class="aspect-video flex items-center justify-center text-muted-foreground text-sm">
                    <AlertCircle class="h-4 w-4 mr-2" />
                    Unable to preview - check your iframe URL or code
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Internal form info -->
          <div v-else class="rounded-lg bg-blue-50 p-4 border border-blue-100">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <ClipboardList class="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-blue-900">Built-in Service Booking Form</h4>
                <p class="text-sm text-blue-700 mt-1">
                  Customers will use the integrated multi-step service booking form. All enquiries are captured in the CRM and you'll receive email notifications.
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
  ClipboardList,
  CheckCircle2,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { extractSafeIframeUrl } from '~/utils/iframe';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

// Fetch current settings
const { data, pending, error, refresh } = await useFetch('/api/admin/settings/service-booking');

// Form state - using reactive for better v-model compatibility
const form = reactive({
  useExternalBooking: false,
  externalBookingIframe: '',
  externalBookingProvider: '',
});

// Initialize form when data loads
watch(data, (newData) => {
  if (newData?.settings) {
    form.useExternalBooking = newData.settings.useExternalBooking ?? false;
    form.externalBookingIframe = newData.settings.externalBookingIframe ?? '';
    form.externalBookingProvider = newData.settings.externalBookingProvider ?? '';
  }
}, { immediate: true });

// Extract iframe URL from input (handles both URL and HTML)
const iframeUrl = computed(() => {
  return extractSafeIframeUrl(form.externalBookingIframe);
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
    await $fetch('/api/admin/settings/service-booking', {
      method: 'PUT',
      body: {
        useExternalBooking: form.useExternalBooking,
        externalBookingIframe: form.externalBookingIframe || null,
        externalBookingProvider: form.externalBookingProvider || null,
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
