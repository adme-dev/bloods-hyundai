<template>
  <div class="mx-auto max-w-[1200px] space-y-6 text-foreground">
    <AdminPageHeader
      eyebrow="Website content"
      title="Homepage slider"
      description="Own the homepage hero artwork, responsive images, campaign copy and publishing schedule."
    >
      <template #actions>
        <Button variant="outline" :disabled="loading || saving" @click="reloadFromServer">
          <RefreshCw class="mr-2 h-4 w-4" /> Refresh data
        </Button>
        <Button variant="outline" @click="previewHomepage">
          <ExternalLink class="mr-2 h-4 w-4" /> Preview homepage
        </Button>
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="flex min-h-64 items-center justify-center rounded-xl border bg-card">
      <div class="text-center" role="status">
        <Loader2 class="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
        <p class="mt-3 text-sm text-muted-foreground">Loading homepage slides…</p>
      </div>
    </div>

    <Alert v-else-if="loadError" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Could not load the homepage slider</AlertTitle>
      <AlertDescription class="space-y-3">
        <p>{{ loadError }}</p>
        <Button variant="outline" size="sm" @click="reloadFromServer">Try again</Button>
      </AlertDescription>
    </Alert>

    <template v-else>
      <Alert class="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 border-emerald-500/30 bg-emerald-500/5 p-4">
        <!-- Keep the icon wrapped: Alert's base styles absolutely position direct-child SVGs. -->
        <div class="grid size-10 place-items-center rounded-full bg-emerald-500/10" aria-hidden="true">
          <CircleCheckBig class="h-6 w-6 text-emerald-600" />
        </div>
        <div class="min-w-0">
          <AlertTitle>This dashboard controls the live homepage slider</AlertTitle>
          <AlertDescription>
            Saving replaces only the hero slides. Existing homepage tiles, footer banners and other promotional content remain untouched.
          </AlertDescription>
        </div>
      </Alert>

      <section aria-label="Homepage slider summary" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card v-for="item in summary" :key="item.label">
          <CardContent class="p-5">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</p>
            <p class="mt-2 text-3xl font-semibold tabular-nums">{{ item.value }}</p>
            <p class="mt-1 text-xs text-muted-foreground">{{ item.caption }}</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="slides-heading" class="space-y-4">
        <div class="flex flex-col items-stretch gap-4 min-[701px]:flex-row min-[701px]:items-end min-[701px]:justify-between">
          <div>
            <h2 id="slides-heading" class="text-[15px] font-bold tracking-[-.01em]">Slides</h2>
            <p class="mt-1 text-xs text-muted-foreground">Order from first to last. Date ranges are inclusive in Australia/Melbourne time.</p>
          </div>
          <Button :disabled="saving || slides.length >= maxSlides" @click="addSlide">
            <Plus class="mr-2 h-4 w-4" /> Add slide
          </Button>
        </div>

        <div v-if="!slides.length" class="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <Images class="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 class="mt-3 text-sm font-semibold">No slides configured</h3>
          <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Leave the list empty to hide the homepage slider, or add a slide with desktop and mobile artwork.
          </p>
          <Button class="mt-4" @click="addSlide"><Plus class="mr-2 h-4 w-4" /> Add first slide</Button>
        </div>

        <HomepageSlideEditor
          v-for="(slide, index) in slides"
          :key="slide.id"
          :slide="slide"
          :index="index"
          :total="slides.length"
          :disabled="saving"
          @update:slide="updateSlide(index, $event)"
          @choose-image="chooseImage(index, $event)"
          @move="moveSlide(index, $event)"
          @remove="removeSlide(index)"
        />
      </section>

      <Alert v-if="saveErrors.length" variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>Review the slider settings</AlertTitle>
        <AlertDescription>
          <ul class="list-disc space-y-1 pl-5">
            <li v-for="message in saveErrors" :key="message">{{ message }}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div class="sticky bottom-2 z-20 flex flex-col items-stretch gap-5 rounded-xl border bg-card/95 px-4 py-3.5 shadow-xl backdrop-blur-xl min-[701px]:bottom-4 min-[701px]:flex-row min-[701px]:items-center min-[701px]:justify-between">
        <div>
          <p class="text-sm font-semibold">Ready to publish?</p>
          <p class="text-xs text-muted-foreground">
            Saving refreshes the public site-config cache immediately. No deployment is required for later slide changes.
          </p>
        </div>
        <Button :disabled="saving" @click="saveSettings">
          <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />
          {{ saving ? 'Publishing…' : 'Save slider' }}
        </Button>
      </div>
    </template>

    <MediaLibraryDialog
      v-model:open="mediaLibraryOpen"
      select-mode
      :allowed-types="acceptedImageTypes"
      @select="selectMedia"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertTriangle,
  CircleCheckBig,
  ExternalLink,
  Images,
  Loader2,
  Plus,
  RefreshCw,
  Save,
} from 'lucide-vue-next';
import type { FrontSlide } from '~/utils/frontSlides';
import { getConfiguredFrontSlides } from '~/utils/frontSlides';
import { isDateInRangeAt } from '~/utils/date';
import {
  HOMEPAGE_SLIDE_DEFAULT_DURATION_SECONDS,
  type HomepageSlide,
  type HomepageSliderSettings,
} from '~~/shared/homepageSlider';
import HomepageSlideEditor from '~/components/admin/settings/HomepageSlideEditor.vue';
import MediaLibraryDialog from '~/components/media/MediaLibraryDialog.vue';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';

definePageMeta({ layout: 'admin', middleware: 'auth' });

type SettingsResponse = {
  source: 'custom' | 'upstream';
  settings: HomepageSliderSettings;
  limits: { maxSlides: number; maxImageBytes: number; acceptedImageTypes: string[] };
};
type SiteConfigResponse = { config?: { promotional?: unknown } };
type MediaFile = { url: string; contentType?: string };
type ImageTarget = { index: number; field: 'desktop' | 'mobile' };

const { toast } = useToast();
const settingsRequest = await useFetch<SettingsResponse>('/api/admin/settings/homepage-slider');
const siteConfigRequest = await useFetch<SiteConfigResponse>('/api/site-config', {
  key: 'homepage-slider-upstream-preview',
});

const loading = computed(() => settingsRequest.pending.value || siteConfigRequest.pending.value);
const loadError = computed(() => {
  const error = settingsRequest.error.value || siteConfigRequest.error.value;
  return error?.message || '';
});
const maxSlides = computed(() => settingsRequest.data.value?.limits.maxSlides || 12);
const acceptedImageTypes = computed(() => settingsRequest.data.value?.limits.acceptedImageTypes || [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]);

const slides = ref<HomepageSlide[]>(initialSlides());
const saving = ref(false);
const saveErrors = ref<string[]>([]);
const mediaLibraryOpen = ref(false);
const imageTarget = ref<ImageTarget | null>(null);

const enabledSlides = computed(() => slides.value.filter((slide) => slide.enabled));
const enabledSlideCount = computed(() => enabledSlides.value.length);
const liveSlideCount = computed(() => enabledSlides.value.filter((slide) =>
  isDateInRangeAt(slide.start, slide.end)
).length);
const scheduledSlideCount = computed(() => enabledSlides.value.filter((slide) => {
  if (!slide.start) return false;
  const start = parseIsoDate(slide.start);
  return Boolean(start && start > new Date());
}).length);
const expiredSlideCount = computed(() => Math.max(0, enabledSlideCount.value - liveSlideCount.value - scheduledSlideCount.value));
const summary = computed(() => [
  { label: 'Total slides', value: slides.value.length, caption: `Maximum ${maxSlides.value}` },
  { label: 'Live now', value: liveSlideCount.value, caption: 'Enabled and in date' },
  { label: 'Scheduled', value: scheduledSlideCount.value, caption: 'Starts in the future' },
  { label: 'Expired', value: expiredSlideCount.value, caption: 'Kept for reference' },
]);

function initialSlides() {
  const stored = settingsRequest.data.value?.settings.slides || [];
  if (stored.length) return stored.map(toEditorSlide);
  const current = getConfiguredFrontSlides(siteConfigRequest.data.value?.config?.promotional);
  return current.map((slide, index) => toEditorSlide({
    ...slide,
    id: `imported-${index + 1}`,
    enabled: true,
  } as HomepageSlide));
}

function toEditorSlide(slide: HomepageSlide | FrontSlide): HomepageSlide {
  return {
    id: typeof slide.id === 'string' ? slide.id : `slide-${Date.now()}`,
    enabled: slide.enabled !== false,
    desktop: slide.desktop || '',
    tablet: slide.tablet || slide.mobile || '',
    mobile: slide.mobile || slide.tablet || '',
    video: '',
    video_poster: '',
    contrast: slide.contrast === 'uk-dark' ? 'uk-dark' : slide.contrast === 'uk-light' ? 'uk-light' : '',
    postion: slide.postion === 'uk-position-center' ? 'uk-position-center' : 'uk-position-cover',
    heading_content: slide.heading_content || '',
    sub_heading: slide.sub_heading || '',
    link: slide.link || '',
    button_text: slide.button_text || '',
    button_colour: slide.button_colour === 'uk-dark' ? 'uk-dark' : slide.button_colour === 'uk-light' ? 'uk-light' : '',
    duration_seconds: typeof slide.duration_seconds === 'number'
      ? slide.duration_seconds
      : HOMEPAGE_SLIDE_DEFAULT_DURATION_SECONDS,
    start: toIsoDate(slide.start || ''),
    end: toIsoDate(slide.end || ''),
  };
}

function addSlide() {
  if (slides.value.length >= maxSlides.value) return;
  slides.value.push(toEditorSlide({
    id: `slide-${Date.now()}-${slides.value.length + 1}`,
    enabled: true,
    desktop: '',
    mobile: '',
  } as HomepageSlide));
}

function updateSlide(index: number, slide: HomepageSlide) {
  slides.value[index] = slide;
}

function moveSlide(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= slides.value.length) return;
  const next = [...slides.value];
  [next[index], next[target]] = [next[target]!, next[index]!];
  slides.value = next;
}

function removeSlide(index: number) {
  if (!window.confirm(`Remove slide ${index + 1}? The image remains available in the media library.`)) return;
  slides.value.splice(index, 1);
}

function chooseImage(index: number, field: 'desktop' | 'mobile') {
  imageTarget.value = { index, field };
  mediaLibraryOpen.value = true;
}

function selectMedia(file: MediaFile) {
  const target = imageTarget.value;
  const slide = target ? slides.value[target.index] : null;
  if (!target || !slide || !file.url) return;
  const next = { ...slide, [target.field]: file.url };
  if (target.field === 'mobile') next.tablet = file.url;
  slides.value[target.index] = next;
  imageTarget.value = null;
}

async function saveSettings() {
  saving.value = true;
  saveErrors.value = [];
  try {
    const response = await $fetch<{ settings: HomepageSliderSettings; message: string }>(
      '/api/admin/settings/homepage-slider',
      { method: 'PUT', body: { enabled: true, slides: slides.value } },
    );
    slides.value = response.settings.slides.map(toEditorSlide);
    toast.success(response.message);
  } catch (error: any) {
    saveErrors.value = Array.isArray(error?.data?.data?.errors)
      ? error.data.data.errors
      : [error?.data?.message || error?.message || 'Unable to save homepage slider settings'];
  } finally {
    saving.value = false;
  }
}

async function reloadFromServer() {
  await Promise.all([settingsRequest.refresh(), siteConfigRequest.refresh()]);
  slides.value = initialSlides();
  saveErrors.value = [];
}

function previewHomepage() {
  window.open('/?refresh=true', '_blank', 'noopener,noreferrer');
}

function toIsoDate(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}
</script>
