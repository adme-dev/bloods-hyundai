<template>
  <div class="space-y-6">
    <AdminPageHeader title="Branding & Social Media" description="Customise your dealer branding and social presence" />

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
        {{ error.message || 'Failed to load branding settings. Please try again.' }}
        <Button variant="outline" size="sm" class="mt-2" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Retry
        </Button>
      </AlertDescription>
    </Alert>

    <form v-else @submit.prevent="saveBranding" class="space-y-6">
      <!-- Logo & Primary Color -->
      <Card>
        <CardHeader>
          <CardTitle>Logo & Colors</CardTitle>
          <CardDescription>
            Your logo and brand color appear in email templates and customer communications.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Logo Upload Section -->
          <div class="space-y-4">
            <Label>Dealer Logo</Label>

            <!-- Current Logo Preview -->
            <div v-if="form.logoUrl" class="space-y-2">
              <div class="rounded-lg border bg-muted/30 p-6 text-center">
                <NuxtImg
                  :src="form.logoUrl"
                  :alt="dealer?.name"
                  class="mx-auto max-h-16 max-w-[200px] object-contain"
                  width="200"
                  height="64"
                  @error="logoError = true"
                  @load="logoError = false"
                />
                <p v-if="logoError" class="mt-2 text-sm text-destructive">
                  Unable to load logo from this URL
                </p>
              </div>
            </div>

            <!-- Upload Zone -->
            <div class="flex gap-4">
              <div
                class="relative flex-1 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                :class="{
                  'border-primary bg-primary/5': isDragging,
                  'border-muted-foreground/25 hover:border-muted-foreground/50': !isDragging,
                }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  class="absolute inset-0 cursor-pointer opacity-0"
                  @change="handleFileSelect"
                />

                <div v-if="uploading" class="flex flex-col items-center gap-2">
                  <Loader2 class="h-8 w-8 animate-spin text-primary" />
                  <p class="text-sm text-muted-foreground">Uploading...</p>
                </div>

                <div v-else class="flex flex-col items-center gap-2">
                  <Upload class="h-8 w-8 text-muted-foreground" />
                  <p class="text-sm font-medium">Drop your logo here or click to browse</p>
                  <p class="text-xs text-muted-foreground">PNG, JPG, WebP, SVG or GIF (max 2MB)</p>
                </div>
              </div>

              <!-- Media Library Button -->
              <div class="flex flex-col justify-center">
                <Button
                  type="button"
                  variant="outline"
                  class="h-full min-h-[100px] flex-col gap-2 px-6"
                  @click="mediaLibraryOpen = true"
                >
                  <Image class="h-6 w-6 text-muted-foreground" />
                  <span class="text-xs">Media Library</span>
                </Button>
              </div>
            </div>

            <!-- Or use URL -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-muted-foreground">Or enter URL</span>
              </div>
            </div>

            <div class="space-y-2">
              <Input
                id="logoUrl"
                v-model="form.logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
              />
              <p class="text-xs text-muted-foreground">
                Recommended size: 200x60px, PNG or SVG format.
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="primaryColor">Primary Brand Color</Label>
              <div class="flex gap-2">
                <Input
                  id="primaryColor"
                  v-model="form.primaryColor"
                  type="text"
                  placeholder="#001E50"
                  class="flex-1"
                  maxlength="7"
                />
                <input
                  type="color"
                  :value="form.primaryColor || '#001E50'"
                  @input="form.primaryColor = ($event.target as HTMLInputElement).value"
                  class="h-10 w-14 cursor-pointer rounded border p-1"
                />
              </div>
              <p class="text-xs text-muted-foreground">
                Hex color code (e.g., #001E50). Used for buttons and accents in emails.
              </p>
            </div>

            <div class="space-y-2">
              <Label for="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                v-model="form.websiteUrl"
                type="url"
                placeholder="https://example-hyundai.com.au"
              />
              <p class="text-xs text-muted-foreground">
                Your dealership website URL.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Social Media Links -->
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Add your social media profiles. These will appear in email footers to help customers connect with you.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="facebookUrl" class="flex items-center gap-2">
                <Facebook class="h-4 w-4 text-[#1877F2]" />
                Facebook
              </Label>
              <Input
                id="facebookUrl"
                v-model="form.facebookUrl"
                type="url"
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div class="space-y-2">
              <Label for="instagramUrl" class="flex items-center gap-2">
                <Instagram class="h-4 w-4 text-[#E4405F]" />
                Instagram
              </Label>
              <Input
                id="instagramUrl"
                v-model="form.instagramUrl"
                type="url"
                placeholder="https://instagram.com/yourpage"
              />
            </div>

            <div class="space-y-2">
              <Label for="linkedinUrl" class="flex items-center gap-2">
                <Linkedin class="h-4 w-4 text-[#0A66C2]" />
                LinkedIn
              </Label>
              <Input
                id="linkedinUrl"
                v-model="form.linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div class="space-y-2">
              <Label for="youtubeUrl" class="flex items-center gap-2">
                <Youtube class="h-4 w-4 text-[#FF0000]" />
                YouTube
              </Label>
              <Input
                id="youtubeUrl"
                v-model="form.youtubeUrl"
                type="url"
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>

            <div class="space-y-2">
              <Label for="twitterUrl" class="flex items-center gap-2">
                <Twitter class="h-4 w-4 text-[#1DA1F2]" />
                Twitter / X
              </Label>
              <Input
                id="twitterUrl"
                v-model="form.twitterUrl"
                type="url"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Email Preview -->
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
          <CardDescription>
            Preview how your branding will appear in customer emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="rounded-lg border bg-white overflow-hidden">
            <!-- Email Header Preview -->
            <div
              class="p-6 text-center"
              :style="{ backgroundColor: form.primaryColor || '#001E50' }"
            >
              <NuxtImg
                v-if="form.logoUrl && !logoError"
                :src="form.logoUrl"
                :alt="dealer?.name"
                class="mx-auto max-h-12 max-w-[180px] object-contain"
                width="180"
                height="48"
              />
              <h2 v-else class="text-xl font-semibold text-white">{{ dealer?.name }}</h2>
              <p class="mt-2 text-sm text-white/90">Thank You For Your Enquiry</p>
            </div>

            <!-- Email Body Preview -->
            <div class="p-6">
              <p class="text-gray-600">Hi Customer,</p>
              <p class="mt-4 text-gray-600">
                Thank you for contacting {{ dealer?.name }}. We've received your enquiry...
              </p>
            </div>

            <!-- Email Footer Preview -->
            <div class="border-t bg-gray-50 p-6">
              <div class="text-center">
                <NuxtImg
                  v-if="form.logoUrl && !logoError"
                  :src="form.logoUrl"
                  :alt="dealer?.name"
                  class="mx-auto mb-4 max-h-10 max-w-[140px] object-contain opacity-75"
                  width="140"
                  height="40"
                />
                <p v-else class="mb-4 font-semibold" :style="{ color: form.primaryColor || '#001E50' }">
                  {{ dealer?.name }}
                </p>

                <!-- Social Icons Preview -->
                <div v-if="hasSocialLinks" class="mb-4">
                  <p class="mb-2 text-xs uppercase tracking-wide text-gray-500">Connect With Us</p>
                  <div class="flex justify-center gap-3">
                    <Facebook v-if="form.facebookUrl" class="h-6 w-6 text-gray-400" />
                    <Instagram v-if="form.instagramUrl" class="h-6 w-6 text-gray-400" />
                    <Linkedin v-if="form.linkedinUrl" class="h-6 w-6 text-gray-400" />
                    <Youtube v-if="form.youtubeUrl" class="h-6 w-6 text-gray-400" />
                    <Twitter v-if="form.twitterUrl" class="h-6 w-6 text-gray-400" />
                  </div>
                </div>

                <p class="text-xs text-gray-400">
                  &copy; {{ new Date().getFullYear() }} {{ dealer?.name }}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Save Button -->
      <div class="flex justify-end gap-3">
        <Button type="button" variant="outline" @click="resetForm" :disabled="saving">
          Reset
        </Button>
        <Button type="submit" :disabled="saving || !hasChanges">
          <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </div>
    </form>

    <!-- Media Library Dialog -->
    <MediaLibraryDialog
      v-model:open="mediaLibraryOpen"
      :select-mode="true"
      :allowed-types="['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']"
      @select="handleMediaSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Upload,
  Image,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import MediaLibraryDialog from '~/components/media/MediaLibraryDialog.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const { toast } = useToast();
const saving = ref(false);
const logoError = ref(false);
const uploading = ref(false);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const mediaLibraryOpen = ref(false);

const { data, pending, error, refresh } = await useFetch('/api/admin/settings');
const dealer = computed(() => data.value?.dealer);

// Form state
const form = ref({
  logoUrl: '',
  primaryColor: '',
  websiteUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  twitterUrl: '',
});

// Original values for change detection
const originalForm = ref({ ...form.value });

// Initialize form when data loads
watch(
  dealer,
  (newDealer) => {
    if (newDealer) {
      form.value = {
        logoUrl: newDealer.logoUrl || '',
        primaryColor: newDealer.primaryColor || '',
        websiteUrl: newDealer.websiteUrl || '',
        facebookUrl: newDealer.facebookUrl || '',
        instagramUrl: newDealer.instagramUrl || '',
        linkedinUrl: newDealer.linkedinUrl || '',
        youtubeUrl: newDealer.youtubeUrl || '',
        twitterUrl: newDealer.twitterUrl || '',
      };
      originalForm.value = { ...form.value };
    }
  },
  { immediate: true }
);

// Check if form has changes
const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalForm.value);
});

// Check if any social links are set
const hasSocialLinks = computed(() => {
  return !!(
    form.value.facebookUrl ||
    form.value.instagramUrl ||
    form.value.linkedinUrl ||
    form.value.youtubeUrl ||
    form.value.twitterUrl
  );
});

// Reset form to original values
const resetForm = () => {
  form.value = { ...originalForm.value };
  logoError.value = false;
};

// Save branding settings
const saveBranding = async () => {
  saving.value = true;

  try {
    await $fetch('/api/admin/settings/branding', {
      method: 'PUT',
      body: form.value,
    });

    toast.success('Branding settings saved successfully');
    originalForm.value = { ...form.value };
    await refresh();
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to save branding settings');
  } finally {
    saving.value = false;
  }
};

// File upload handlers
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    uploadLogo(file);
  }
  // Reset input so same file can be selected again
  input.value = '';
};

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    uploadLogo(file);
  }
};

const uploadLogo = async (file: File) => {
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    toast.error('Invalid file type. Please upload PNG, JPG, WebP, SVG, or GIF.');
    return;
  }

  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    toast.error(`File too large. Maximum size is 2MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    return;
  }

  uploading.value = true;
  logoError.value = false;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const result = await $fetch<{ success: boolean; logoUrl: string; message?: string }>('/api/admin/upload/logo', {
      method: 'POST',
      body: formData,
    });

    if (result.success && result.logoUrl) {
      form.value.logoUrl = result.logoUrl;
      originalForm.value.logoUrl = result.logoUrl; // Update original since it's already saved
      toast.success('Logo uploaded successfully');
      await refresh();
    }
  } catch (err: any) {
    const message = err.data?.message || 'Failed to upload logo';
    toast.error(message);

    // If storage not configured, show helpful message
    if (err.statusCode === 503) {
      toast.info('You can still use a URL to set your logo.');
    }
  } finally {
    uploading.value = false;
  }
};

// Handle media library selection
const handleMediaSelect = (file: { url: string; filename: string }) => {
  form.value.logoUrl = file.url;
  logoError.value = false;
  toast.success(`Selected: ${file.filename}`);
};
</script>
