<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
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
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Image, FileText, Upload, Trash2, Check, Loader2 } from 'lucide-vue-next';

interface MediaFile {
  key: string;
  url: string;
  filename: string;
  size: number;
  lastModified: string;
  category: 'logos' | 'images' | 'documents' | 'unknown';
  contentType?: string;
}

const props = defineProps<{
  open: boolean;
  selectMode?: boolean;
  allowedTypes?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'select', file: MediaFile): void;
}>();

const { toast } = useToast();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const activeTab = ref<'all' | 'logos' | 'images' | 'documents'>('all');
const files = ref<MediaFile[]>([]);
const loading = ref(false);
const uploading = ref(false);
const selectedFile = ref<MediaFile | null>(null);
const deleteDialogOpen = ref(false);
const fileToDelete = ref<MediaFile | null>(null);
const deleting = ref(false);

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null);

// Fetch media files
async function fetchMedia() {
  loading.value = true;
  try {
    const category = activeTab.value === 'all' ? undefined : activeTab.value;
    const response = await $fetch('/api/admin/media', {
      query: { category },
    });
    files.value = (response as any).files || [];
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.data?.message || 'Failed to load media files',
      variant: 'destructive',
    });
  } finally {
    loading.value = false;
  }
}

// Watch for tab changes
watch(activeTab, () => {
  fetchMedia();
});

// Watch for dialog open
watch(isOpen, (open) => {
  if (open) {
    fetchMedia();
  }
});

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
  });
}

// Upload file
async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  uploading.value = true;
  const file = input.files[0];

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', activeTab.value === 'all' ? 'images' : activeTab.value);

    const response = await $fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });

    toast({
      title: 'Success',
      description: 'File uploaded successfully',
    });

    // Refresh the list
    fetchMedia();
  } catch (error: any) {
    toast({
      title: 'Upload Failed',
      description: error.data?.message || 'Failed to upload file',
      variant: 'destructive',
    });
  } finally {
    uploading.value = false;
    // Reset input
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
}

// Confirm delete - opens the dialog
function confirmDelete(file: MediaFile) {
  fileToDelete.value = file;
  deleteDialogOpen.value = true;
}

// Delete file - executes after confirmation
async function handleDelete() {
  if (!fileToDelete.value) return;

  deleting.value = true;
  try {
    await $fetch(`/api/admin/media/${encodeURIComponent(fileToDelete.value.key)}`, {
      method: 'DELETE',
    });

    toast({
      title: 'Success',
      description: 'File deleted successfully',
    });

    // Remove from list
    files.value = files.value.filter((f) => f.key !== fileToDelete.value?.key);

    // Clear selection if deleted file was selected
    if (selectedFile.value?.key === fileToDelete.value.key) {
      selectedFile.value = null;
    }
  } catch (error: any) {
    toast({
      title: 'Delete Failed',
      description: error.data?.message || 'Failed to delete file',
      variant: 'destructive',
    });
  } finally {
    deleting.value = false;
    deleteDialogOpen.value = false;
    fileToDelete.value = null;
  }
}

// Select file
function handleSelect(file: MediaFile) {
  if (props.selectMode) {
    selectedFile.value = file;
  }
}

// Confirm selection
function confirmSelection() {
  if (selectedFile.value) {
    emit('select', selectedFile.value);
    isOpen.value = false;
  }
}

// Get file icon
function getFileIcon(file: MediaFile) {
  if (file.contentType?.startsWith('image/')) return Image;
  return FileText;
}

// Check if file is an image
function isImage(file: MediaFile): boolean {
  return file.contentType?.startsWith('image/') || false;
}

// Get accept string for file input
const acceptTypes = computed(() => {
  if (props.allowedTypes?.length) {
    return props.allowedTypes.join(',');
  }
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
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Media Library</DialogTitle>
        <DialogDescription>
          {{ selectMode ? 'Select a file from your media library' : 'Manage your uploaded media files' }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 flex flex-col min-h-0">
        <!-- Tabs and Upload Button -->
        <div class="flex items-center justify-between mb-4">
          <Tabs v-model="activeTab" class="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="logos">Logos</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
          </Tabs>

          <div class="flex items-center gap-2">
            <input
              ref="fileInputRef"
              type="file"
              :accept="acceptTypes"
              class="hidden"
              @change="handleUpload"
            />
            <Button
              variant="outline"
              size="sm"
              :disabled="uploading"
              @click="fileInputRef?.click()"
            >
              <Loader2 v-if="uploading" class="w-4 h-4 mr-2 animate-spin" />
              <Upload v-else class="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <!-- Files Grid -->
        <div class="flex-1 overflow-y-auto border rounded-lg bg-muted/30 p-4">
          <div v-if="loading" class="flex items-center justify-center h-48">
            <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
          </div>

          <div v-else-if="files.length === 0" class="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Image class="w-12 h-12 mb-2 opacity-50" />
            <p>No files found</p>
            <Button variant="link" size="sm" @click="fileInputRef?.click()">
              Upload your first file
            </Button>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div
              v-for="file in files"
              :key="file.key"
              class="group relative bg-background rounded-lg border overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary"
              :class="{
                'ring-2 ring-primary': selectedFile?.key === file.key,
              }"
              @click="handleSelect(file)"
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
                  loading="lazy"
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
              <div class="p-2">
                <p class="text-xs font-medium truncate" :title="file.filename">
                  {{ file.filename }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatSize(file.size) }}
                </p>
              </div>

              <!-- Selected Indicator -->
              <div
                v-if="selectedFile?.key === file.key"
                class="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"
              >
                <Check class="w-3 h-3" />
              </div>

              <!-- Delete Button -->
              <div
                v-if="!selectMode"
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button
                  variant="destructive"
                  size="icon"
                  class="h-7 w-7"
                  :disabled="deleting"
                  @click.stop="confirmDelete(file)"
                >
                  <Trash2 class="w-3 h-3" />
                </Button>
              </div>

              <!-- Category Badge -->
              <div class="absolute bottom-12 left-2">
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {{ file.category }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Select Button -->
        <div v-if="selectMode" class="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" @click="isOpen = false">
            Cancel
          </Button>
          <Button :disabled="!selectedFile" @click="confirmSelection">
            Select File
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

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
</template>
