<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {
  Image,
  FileText,
  Upload,
  Trash2,
  Download,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Grid3X3,
  List,
  ExternalLink,
} from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

interface MediaFile {
  key: string;
  url: string;
  filename: string;
  size: number;
  lastModified: string;
  category: 'logos' | 'images' | 'documents' | 'unknown';
  contentType?: string;
}

const { toast } = useToast();

const activeTab = ref<'all' | 'logos' | 'images' | 'documents'>('all');
const viewMode = ref<'grid' | 'list'>('grid');
const files = ref<MediaFile[]>([]);
const loading = ref(false);
const uploading = ref(false);
const selectedFiles = ref<Set<string>>(new Set());
const deleteDialogOpen = ref(false);
const fileToDelete = ref<MediaFile | null>(null);
const deleting = ref(false);
const copiedUrl = ref<string | null>(null);

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null);

// Computed
const selectedCount = computed(() => selectedFiles.value.size);

const filteredFiles = computed(() => {
  if (activeTab.value === 'all') return files.value;
  return files.value.filter((f) => f.category === activeTab.value);
});

const totalSize = computed(() => {
  return files.value.reduce((sum, f) => sum + f.size, 0);
});

// Fetch media files
async function fetchMedia() {
  loading.value = true;
  try {
    const response = await $fetch('/api/admin/media');
    files.value = (response as any).files || [];
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to load media files', 'Error');
  } finally {
    loading.value = false;
  }
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Upload file
async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  uploading.value = true;
  const uploadedCount = { success: 0, failed: 0 };

  for (const file of input.files) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Determine category from file type
      let category = 'images';
      if (file.type === 'application/pdf') {
        category = 'documents';
      } else if (file.name.toLowerCase().includes('logo')) {
        category = 'logos';
      }
      formData.append('category', category);

      await $fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      uploadedCount.success++;
    } catch (error) {
      uploadedCount.failed++;
    }
  }

  uploading.value = false;

  if (uploadedCount.success > 0) {
    toast.success(`${uploadedCount.success} file(s) uploaded successfully${uploadedCount.failed > 0 ? `, ${uploadedCount.failed} failed` : ''}`, 'Upload Complete');
    fetchMedia();
  } else {
    toast.error('All files failed to upload', 'Upload Failed');
  }

  // Reset input
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

// Confirm delete
function confirmDelete(file: MediaFile) {
  fileToDelete.value = file;
  deleteDialogOpen.value = true;
}

// Delete file
async function handleDelete() {
  if (!fileToDelete.value) return;

  deleting.value = true;
  try {
    await $fetch(`/api/admin/media/${encodeURIComponent(fileToDelete.value.key)}`, {
      method: 'DELETE',
    });

    toast.success('File deleted successfully', 'Success');

    files.value = files.value.filter((f) => f.key !== fileToDelete.value?.key);
    selectedFiles.value.delete(fileToDelete.value.key);
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to delete file', 'Delete Failed');
  } finally {
    deleting.value = false;
    deleteDialogOpen.value = false;
    fileToDelete.value = null;
  }
}

// Copy URL to clipboard
async function copyUrl(file: MediaFile) {
  try {
    await navigator.clipboard.writeText(file.url);
    copiedUrl.value = file.key;
    toast.success('URL copied to clipboard', 'Copied');
    setTimeout(() => {
      copiedUrl.value = null;
    }, 2000);
  } catch {
    toast.error('Failed to copy URL to clipboard', 'Copy Failed');
  }
}

// Toggle file selection
function toggleSelect(file: MediaFile) {
  if (selectedFiles.value.has(file.key)) {
    selectedFiles.value.delete(file.key);
  } else {
    selectedFiles.value.add(file.key);
  }
}

// Check if file is an image
function isImage(file: MediaFile): boolean {
  return file.contentType?.startsWith('image/') || false;
}

// Get file icon
function getFileIcon(file: MediaFile) {
  if (file.contentType?.startsWith('image/')) return Image;
  return FileText;
}

// Get accept string for file input
const acceptTypes = computed(() => {
  switch (activeTab.value) {
    case 'logos':
      return 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif';
    case 'images':
      return 'image/png,image/jpeg,image/webp,image/gif';
    case 'documents':
      return 'application/pdf,image/png,image/jpeg';
    default:
      return 'image/*,application/pdf';
  }
});

// Initialize
onMounted(() => {
  fetchMedia();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AdminPageHeader title="Media Library" description="Manage your uploaded images, logos, and documents">
      <template #actions>
        <input
          ref="fileInputRef"
          type="file"
          :accept="acceptTypes"
          multiple
          class="hidden"
          @change="handleUpload"
        />
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="fetchMedia"
        >
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
        <Button
          :disabled="uploading"
          @click="fileInputRef?.click()"
        >
          <Loader2 v-if="uploading" class="w-4 h-4 mr-2 animate-spin" />
          <Upload v-else class="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </template>
    </AdminPageHeader>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Total Files</CardDescription>
          <CardTitle class="text-2xl">{{ files.length }}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Images</CardDescription>
          <CardTitle class="text-2xl">
            {{ files.filter((f) => f.category === 'images').length }}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Logos</CardDescription>
          <CardTitle class="text-2xl">
            {{ files.filter((f) => f.category === 'logos').length }}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Total Size</CardDescription>
          <CardTitle class="text-2xl">{{ formatSize(totalSize) }}</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <!-- Main Content -->
    <Card>
      <CardHeader class="pb-4">
        <div class="flex items-center justify-between">
          <Tabs v-model="activeTab">
            <TabsList>
              <TabsTrigger value="all">
                All ({{ files.length }})
              </TabsTrigger>
              <TabsTrigger value="logos">
                Logos ({{ files.filter((f) => f.category === 'logos').length }})
              </TabsTrigger>
              <TabsTrigger value="images">
                Images ({{ files.filter((f) => f.category === 'images').length }})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({{ files.filter((f) => f.category === 'documents').length }})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              :class="{ 'bg-muted': viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <Grid3X3 class="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              :class="{ 'bg-muted': viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <List class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center h-64">
          <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredFiles.length === 0"
          class="flex flex-col items-center justify-center h-64 text-muted-foreground"
        >
          <Image class="w-16 h-16 mb-4 opacity-50" />
          <p class="text-lg font-medium">No files found</p>
          <p class="text-sm mb-4">Upload your first file to get started</p>
          <Button variant="outline" @click="fileInputRef?.click()">
            <Upload class="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>

        <!-- Grid View -->
        <div
          v-else-if="viewMode === 'grid'"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <div
            v-for="file in filteredFiles"
            :key="file.key"
            class="group relative bg-muted/30 rounded-lg border overflow-hidden"
          >
            <!-- Image Preview -->
            <div class="aspect-square bg-muted flex items-center justify-center">
              <NuxtImg
                v-if="isImage(file)"
                :src="file.url"
                :alt="file.filename"
                class="w-full h-full object-contain"
                width="200"
                height="200"
                format="webp"
                quality="80"
              />
              <component
                v-else
                :is="getFileIcon(file)"
                class="w-12 h-12 text-muted-foreground"
              />
            </div>

            <!-- File Info -->
            <div class="p-2 border-t">
              <p class="text-xs font-medium truncate" :title="file.filename">
                {{ file.filename }}
              </p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-muted-foreground">
                  {{ formatSize(file.size) }}
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {{ file.category }}
                </span>
              </div>
            </div>

            <!-- Hover Actions -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                class="h-8 w-8"
                @click="copyUrl(file)"
                :title="copiedUrl === file.key ? 'Copied!' : 'Copy URL'"
              >
                <Check v-if="copiedUrl === file.key" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
              </Button>
              <a :href="file.url" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="icon" class="h-8 w-8" title="Open in new tab">
                  <ExternalLink class="w-4 h-4" />
                </Button>
              </a>
              <Button
                variant="destructive"
                size="icon"
                class="h-8 w-8"
                @click="confirmDelete(file)"
                title="Delete"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="space-y-2">
          <div
            v-for="file in filteredFiles"
            :key="file.key"
            class="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <!-- Thumbnail -->
            <div class="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <NuxtImg
                v-if="isImage(file)"
                :src="file.url"
                :alt="file.filename"
                class="w-full h-full object-contain rounded"
                width="48"
                height="48"
                format="webp"
                quality="80"
              />
              <component
                v-else
                :is="getFileIcon(file)"
                class="w-6 h-6 text-muted-foreground"
              />
            </div>

            <!-- File Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ file.filename }}</p>
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{{ formatSize(file.size) }}</span>
                <span>{{ formatDate(file.lastModified) }}</span>
                <span class="px-1.5 py-0.5 rounded bg-muted text-xs">
                  {{ file.category }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="copyUrl(file)"
              >
                <Check v-if="copiedUrl === file.key" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
              </Button>
              <a :href="file.url" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <ExternalLink class="w-4 h-4" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-destructive hover:text-destructive"
                @click="confirmDelete(file)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="text-destructive">Permanently Delete File?</AlertDialogTitle>
          <AlertDialogDescription class="space-y-2">
            <p>
              You are about to delete <strong>"{{ fileToDelete?.filename }}"</strong>.
            </p>
            <p class="text-destructive font-medium">
              This file will be gone forever and cannot be recovered.
            </p>
            <p class="text-sm">
              Any pages or components using this file will display a broken image or link.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleting">Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="deleting"
            @click="handleDelete"
          >
            <Loader2 v-if="deleting" class="w-4 h-4 mr-2 animate-spin" />
            Delete Forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
