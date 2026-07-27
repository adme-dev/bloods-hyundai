<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Crop {{ variantLabel }} image</DialogTitle>
        <DialogDescription>
          Drag to reposition and use the zoom slider to frame the shot. The exported image is
          {{ target.width }} × {{ target.height }} px — change the size below to crop to any
          dimensions you need.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Crop stage. The frame is fixed to the target ratio; the image moves behind it. -->
        <div
          ref="stageRef"
          class="relative mx-auto w-full select-none overflow-hidden rounded-md border bg-muted/40"
          :style="{ aspectRatio: `${target.width} / ${target.height}`, maxHeight: '60vh' }"
          @pointerdown="startDrag"
          @pointermove="onDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <img
            v-if="objectUrl"
            :src="objectUrl"
            alt=""
            draggable="false"
            class="pointer-events-none absolute left-0 top-0 origin-top-left"
            :style="imageStyle"
          >
          <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Loading image…
          </div>

          <!-- Rule-of-thirds guides, purely visual. -->
          <div class="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            <div v-for="cell in 9" :key="cell" class="border border-white/20" />
          </div>
        </div>

        <!-- Export size. The frame follows these numbers, so the preview above
             always shows exactly what will be produced. -->
        <div class="space-y-2">
          <Label>Export size</Label>
          <div class="flex flex-wrap items-end gap-2">
            <div class="space-y-1">
              <Label :for="`${zoomId}-w`" class="text-xs font-normal text-muted-foreground">Width</Label>
              <Input
                :id="`${zoomId}-w`"
                :model-value="target.width"
                type="number"
                inputmode="numeric"
                :min="CROP_MIN_DIMENSION"
                :max="CROP_MAX_DIMENSION"
                class="w-28"
                :disabled="working"
                @update:model-value="setSize('width', $event)"
              />
            </div>
            <span class="pb-2 text-muted-foreground">×</span>
            <div class="space-y-1">
              <Label :for="`${zoomId}-h`" class="text-xs font-normal text-muted-foreground">Height</Label>
              <Input
                :id="`${zoomId}-h`"
                :model-value="target.height"
                type="number"
                inputmode="numeric"
                :min="CROP_MIN_DIMENSION"
                :max="CROP_MAX_DIMENSION"
                class="w-28"
                :disabled="working"
                @update:model-value="setSize('height', $event)"
              />
            </div>
            <span class="pb-2 text-xs text-muted-foreground">px</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <Button
              v-for="preset in CROP_PRESETS"
              :key="preset.label"
              type="button"
              variant="outline"
              size="sm"
              class="h-7 text-xs"
              :class="{ 'border-primary text-primary': isCurrentSize(preset.size) }"
              :disabled="working"
              @click="applyPreset(preset.size)"
            >
              {{ preset.label }}
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label :for="zoomId">Zoom</Label>
            <span class="text-xs text-muted-foreground">{{ Math.round(zoom * 100) }}%</span>
          </div>
          <input
            :id="zoomId"
            v-model.number="zoom"
            type="range"
            :min="minZoom"
            :max="minZoom * 4"
            :step="0.01"
            class="w-full accent-primary"
            :disabled="!naturalWidth"
          >
        </div>

        <p v-if="tooSmall" class="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
          <AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This image is {{ naturalWidth }} × {{ naturalHeight }} px, smaller than the
          {{ target.width }} × {{ target.height }} px export. It will be upscaled and may look soft.
        </p>
        <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" :disabled="working" @click="isOpen = false">Cancel</Button>
        <Button type="button" :disabled="working || !naturalWidth" @click="apply">
          <Loader2 v-if="working" class="mr-2 h-4 w-4 animate-spin" />
          {{ working ? 'Uploading…' : 'Crop & use image' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import { AlertTriangle, Loader2 } from 'lucide-vue-next';
import {
  CROP_MAX_DIMENSION,
  CROP_MIN_DIMENSION,
  CROP_PRESETS,
  CROP_TARGETS,
  normalizeCropDimension,
  type CropSize,
  type CropVariant,
} from '~/utils/imageCrop';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { useToast } from '~/composables/useToast';

const props = defineProps<{
  open: boolean;
  /** Source image to crop. Must be same-origin or CORS-readable, else the canvas taints. */
  src: string;
  variant: CropVariant;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  cropped: [url: string];
}>();

const { toast } = useToast();
const zoomId = useId();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

/**
 * Export size, seeded from the slot's default but freely editable so a dealer
 * can crop to whatever the placement needs.
 */
const target = ref<CropSize>({ ...CROP_TARGETS[props.variant] });

const variantLabel = computed(() => (props.variant.toLowerCase().includes('mobile') ? 'mobile' : 'desktop'));

function isCurrentSize(size: CropSize) {
  return target.value.width === size.width && target.value.height === size.height;
}

function setSize(axis: 'width' | 'height', value: unknown) {
  target.value = {
    ...target.value,
    [axis]: normalizeCropDimension(value, CROP_TARGETS[props.variant][axis]),
  };
}

function applyPreset(size: CropSize) {
  target.value = { ...size };
}

// Changing the export size changes the frame, so re-fit the image to it.
watch(target, async () => {
  if (!naturalWidth.value) return;
  await measureStage();
  zoom.value = Math.max(minZoom.value, zoom.value);
  offset.value = clamp(offset.value);
}, { deep: true });

const objectUrl = ref('');
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const stageRef = ref<HTMLElement | null>(null);
const stageWidth = ref(0);
const zoom = ref(1);
const offset = ref({ x: 0, y: 0 });
const working = ref(false);
const error = ref('');

/** Scale at which the image exactly covers the frame — the floor for zoom. */
const minZoom = computed(() => {
  if (!naturalWidth.value || !stageWidth.value) return 1;
  const stageHeight = stageWidth.value * (target.value.height / target.value.width);
  return Math.max(stageWidth.value / naturalWidth.value, stageHeight / naturalHeight.value);
});

const tooSmall = computed(() =>
  Boolean(naturalWidth.value)
  && (naturalWidth.value < target.value.width || naturalHeight.value < target.value.height));

const imageStyle = computed(() => ({
  width: `${naturalWidth.value * zoom.value}px`,
  height: `${naturalHeight.value * zoom.value}px`,
  transform: `translate(${offset.value.x}px, ${offset.value.y}px)`,
}));

watch(() => [props.open, props.src] as const, ([open]) => {
  if (!open || !props.src) return;
  // Reopening starts from the slot's default rather than the last size used.
  target.value = { ...CROP_TARGETS[props.variant] };
  void loadImage();
}, { immediate: true });

async function loadImage() {
  error.value = '';
  objectUrl.value = '';
  naturalWidth.value = 0;

  try {
    // Routed through our own origin: the CDN and R2 buckets send no
    // Access-Control-Allow-Origin, so a direct fetch fails CORS and a direct
    // <img> load taints the canvas, leaving toBlob() unable to export.
    const blob = await $fetch<Blob>('/api/admin/media/proxy', {
      params: { url: props.src },
      responseType: 'blob',
    });
    objectUrl.value = URL.createObjectURL(blob);

    const image = new Image();
    image.src = objectUrl.value;
    await image.decode();

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('That file does not appear to be a usable image.');
    }

    naturalWidth.value = image.naturalWidth;
    naturalHeight.value = image.naturalHeight;

    // The dialog animates in, so the stage can still be unmeasured (or mid
    // transition) on the first frame. Measuring too early leaves stageWidth at
    // 0, which pins zoom to the fallback of 1 and exports a mis-framed crop.
    await measureStage();

    zoom.value = minZoom.value;
    centreImage();
  } catch (cause: any) {
    error.value = cause?.data?.message
      || 'Could not load this image for cropping. Try re-uploading it to the media library.';
  }
}

/**
 * Waits for the stage to have a real width before the framing maths runs.
 * Polls a few animation frames because the dialog fades/scales in, so the
 * first frames report 0 or an intermediate width.
 */
async function measureStage() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const width = stageRef.value?.clientWidth || 0;
    if (width > 0 && width === stageWidth.value) break;
    stageWidth.value = width;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

// Keep the framing correct when the viewport changes under an open dialog.
let stageObserver: ResizeObserver | null = null;

watch(stageRef, (stage) => {
  stageObserver?.disconnect();
  if (!stage || typeof ResizeObserver === 'undefined') return;

  stageObserver = new ResizeObserver(() => {
    const width = stage.clientWidth || 0;
    if (!width || width === stageWidth.value) return;
    // Preserve the framing proportionally rather than snapping back to centre.
    const scale = width / (stageWidth.value || width);
    stageWidth.value = width;
    zoom.value = Math.max(minZoom.value, zoom.value * scale);
    offset.value = clamp({ x: offset.value.x * scale, y: offset.value.y * scale });
  });
  stageObserver.observe(stage);
});

onBeforeUnmount(() => stageObserver?.disconnect());

// The blob URL is only needed while the dialog is open.
watch(isOpen, (open) => {
  if (open || !objectUrl.value) return;
  URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = '';
});

function centreImage() {
  const stageHeight = stageWidth.value * (target.value.height / target.value.width);
  offset.value = {
    x: (stageWidth.value - naturalWidth.value * zoom.value) / 2,
    y: (stageHeight - naturalHeight.value * zoom.value) / 2,
  };
}

// Re-clamp whenever zoom changes so the frame can never show empty space.
watch(zoom, () => { offset.value = clamp(offset.value); });

/** Keeps the scaled image covering the frame on both axes. */
function clamp(next: { x: number; y: number }) {
  const stageHeight = stageWidth.value * (target.value.height / target.value.width);
  const scaledWidth = naturalWidth.value * zoom.value;
  const scaledHeight = naturalHeight.value * zoom.value;
  return {
    x: Math.min(0, Math.max(stageWidth.value - scaledWidth, next.x)),
    y: Math.min(0, Math.max(stageHeight - scaledHeight, next.y)),
  };
}

let dragFrom: { x: number; y: number } | null = null;

function startDrag(event: PointerEvent) {
  if (!naturalWidth.value) return;
  dragFrom = { x: event.clientX - offset.value.x, y: event.clientY - offset.value.y };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onDrag(event: PointerEvent) {
  if (!dragFrom) return;
  offset.value = clamp({ x: event.clientX - dragFrom.x, y: event.clientY - dragFrom.y });
}

function endDrag(event: PointerEvent) {
  dragFrom = null;
  (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
}

async function apply() {
  if (!naturalWidth.value) return;
  working.value = true;
  error.value = '';

  try {
    // Stage coordinates scale up to export pixels by this factor.
    const stageToExport = target.value.width / stageWidth.value;
    const canvas = document.createElement('canvas');
    canvas.width = target.value.width;
    canvas.height = target.value.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable in this browser.');
    context.imageSmoothingQuality = 'high';

    const image = new Image();
    image.src = objectUrl.value;
    await image.decode();

    context.drawImage(
      image,
      offset.value.x * stageToExport,
      offset.value.y * stageToExport,
      naturalWidth.value * zoom.value * stageToExport,
      naturalHeight.value * zoom.value * stageToExport,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.9));
    if (!blob) throw new Error('Could not encode the cropped image.');

    const form = new FormData();
    form.append('file', new File([blob], cropFilename(), { type: 'image/webp' }));
    form.append('category', 'images');

    const response = await $fetch<{ file?: { url?: string }; url?: string }>(
      '/api/admin/media/upload',
      { method: 'POST', body: form },
    );

    const url = response.file?.url || response.url;
    if (!url) throw new Error('Upload succeeded but returned no URL.');

    emit('cropped', url);
    isOpen.value = false;
    toast.success(`Cropped to ${target.value.width} × ${target.value.height}`, 'Image ready');
  } catch (cause: any) {
    error.value = cause?.data?.message || cause?.message || 'Could not crop this image.';
  } finally {
    working.value = false;
  }
}

function cropFilename() {
  const base = (props.src.split('/').pop() || 'slide').replace(/\.[^.]+$/, '').slice(0, 60);
  return `${base}-${props.variant}-${target.value.width}x${target.value.height}.webp`;
}
</script>
