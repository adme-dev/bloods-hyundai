<template>
  <div class="space-y-6">
    <div>
      <NuxtLink to="/admin/settings" class="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
        <ChevronLeft class="h-4 w-4" />
        Back to Settings
      </NuxtLink>
      <h1 class="text-3xl font-semibold tracking-tight">Finance Widget</h1>
      <p class="text-sm text-muted-foreground">Configure an external finance application widget to replace the enquiry form</p>
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
        {{ error.message || 'Failed to load finance widget settings. Please try again.' }}
        <Button variant="outline" size="sm" class="mt-2" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Retry
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Settings Form -->
    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle>Finance Application Widget</CardTitle>
          <CardDescription>
            When enabled, the finance widget will replace the standard enquiry form on vehicle pages and the finance page
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Toggle between internal and external -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label class="text-base">Use External Finance Widget</Label>
              <p class="text-sm text-muted-foreground">
                Enable this to display an external finance application iframe instead of the built-in enquiry form
              </p>
            </div>
            <Switch v-model="form.useFinanceWidget" />
          </div>

          <!-- External widget configuration -->
          <div v-if="form.useFinanceWidget" class="space-y-4 pt-4 border-t">
            <div class="space-y-2">
              <Label for="provider">Finance Provider (Optional)</Label>
              <Select v-model="form.financeWidgetProvider">
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youxpowered">YouX Powered</SelectItem>
                  <SelectItem value="stratton">Stratton Finance</SelectItem>
                  <SelectItem value="driveline">Driveline Finance</SelectItem>
                  <SelectItem value="plenti">Plenti</SelectItem>
                  <SelectItem value="angle">Angle Finance</SelectItem>
                  <SelectItem value="nowfinance">Now Finance</SelectItem>
                  <SelectItem value="custom">Custom / Other</SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">
                Select your finance provider for tracking purposes (optional)
              </p>
            </div>

            <div class="space-y-2">
              <Label for="iframe">Base Iframe URL</Label>
              <Textarea
                id="iframe"
                v-model="form.financeWidgetIframe"
                placeholder="https://apply.youxpowered.com.au/m5287"
                :rows="2"
                class="font-mono text-sm"
              />
              <p class="text-xs text-muted-foreground">
                Enter the base URL from your finance provider. Vehicle data will be automatically appended as URL parameters:
              </p>
              <ul class="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li><code class="bg-muted px-1 rounded">condition</code> - Vehicle condition (New/Used/Demo)</li>
                <li><code class="bg-muted px-1 rounded">amount</code> - Vehicle price</li>
                <li><code class="bg-muted px-1 rounded">buildyear</code> - Year of manufacture</li>
                <li><code class="bg-muted px-1 rounded">make</code> - Vehicle make (e.g., Hyundai)</li>
                <li><code class="bg-muted px-1 rounded">model</code> - Vehicle model</li>
                <li><code class="bg-muted px-1 rounded">kilometers</code> - Odometer reading</li>
                <li><code class="bg-muted px-1 rounded">vin</code> - Vehicle VIN</li>
              </ul>
            </div>

            <!-- Preview -->
            <div v-if="form.financeWidgetIframe" class="space-y-2">
              <Label>Preview</Label>
              <div class="border rounded-lg overflow-hidden bg-gray-50">
                <div class="p-2 bg-gray-100 border-b flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">Finance Widget Preview</span>
                  <Badge variant="outline" class="text-xs">
                    {{ form.financeWidgetProvider || 'Custom' }}
                  </Badge>
                </div>
                <div class="p-4">
                  <div v-if="iframeUrl" class="aspect-video">
                    <iframe
                      :src="iframeUrl"
                      class="w-full h-full border-0 rounded"
                      title="Finance Widget Preview"
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
                <FileText class="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-blue-900">Built-in Enquiry Form</h4>
                <p class="text-sm text-blue-700 mt-1">
                  Customers will use the standard vehicle enquiry form. All enquiries are captured in the CRM and you'll receive email notifications.
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

      <!-- Info about where the widget appears -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Where the Finance Widget Appears</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-semibold text-primary">1</span>
              </div>
              <div>
                <span class="font-medium text-foreground">Vehicle Enquiry Form</span>
                <p>When customers view a vehicle, they'll see the finance widget instead of the contact form</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-semibold text-primary">2</span>
              </div>
              <div>
                <span class="font-medium text-foreground">Finance Page</span>
                <p>The dedicated finance page (/finance/[vehicle]) will display the widget instead of the calculator and form</p>
              </div>
            </div>
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
  FileText,
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

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

// Fetch current settings
const { data, pending, error, refresh } = await useFetch('/api/admin/settings/finance-widget');

// Form state - using reactive for better v-model compatibility
const form = reactive({
  useFinanceWidget: false,
  financeWidgetIframe: '',
  financeWidgetProvider: '',
});

// Initialize form when data loads
watch(data, (newData) => {
  if (newData?.settings) {
    form.useFinanceWidget = newData.settings.useFinanceWidget ?? false;
    form.financeWidgetIframe = newData.settings.financeWidgetIframe ?? '';
    form.financeWidgetProvider = newData.settings.financeWidgetProvider ?? '';
  }
}, { immediate: true });

// Extract iframe URL from input (handles both URL and HTML)
const iframeUrl = computed(() => {
  const input = form.financeWidgetIframe?.trim();
  if (!input) return null;

  // If it's already a URL
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  // Try to extract src from iframe HTML
  const srcMatch = input.match(/<iframe[^>]*src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) {
    return srcMatch[1];
  }

  return null;
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
    await $fetch('/api/admin/settings/finance-widget', {
      method: 'PUT',
      body: {
        useFinanceWidget: form.useFinanceWidget,
        financeWidgetIframe: form.financeWidgetIframe || null,
        financeWidgetProvider: form.financeWidgetProvider || null,
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
