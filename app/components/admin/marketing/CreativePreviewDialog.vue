<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto rounded-xl p-0 [&>button]:bg-background [&>button]:p-1.5 [&>button]:text-foreground [&>button]:opacity-100 [&>button]:shadow-sm">
      <div v-if="creative" class="grid md:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
        <div class="flex h-[min(42svh,22rem)] min-h-52 items-center justify-center bg-slate-950 p-3 sm:p-4 md:h-auto md:min-h-[520px]">
          <img
            :src="creative.imageUrl"
            :alt="creative.title"
            class="max-h-full max-w-full object-contain md:max-h-[78vh]"
            referrerpolicy="no-referrer"
          >
        </div>

        <div class="flex min-w-0 flex-col gap-4 p-4 sm:p-6 md:gap-6">
          <DialogHeader class="min-w-0 pr-8 text-left">
            <span class="mb-1 w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {{ platformLabel }}
            </span>
            <DialogTitle class="break-words text-lg leading-snug [overflow-wrap:anywhere] sm:text-xl">
              {{ formatLabel(creative.title) }}
            </DialogTitle>
            <DialogDescription class="break-words leading-relaxed [overflow-wrap:anywhere]">
              {{ creative.campaignName ? formatLabel(creative.campaignName) : 'Campaign name unavailable' }}
            </DialogDescription>
          </DialogHeader>

          <dl class="grid grid-cols-2 gap-3 text-sm tabular-nums">
            <div class="rounded-lg border bg-muted/40 p-3">
              <dt class="text-xs text-muted-foreground">Spend</dt>
              <dd class="mt-1 font-semibold text-foreground">{{ spendLabel }}</dd>
            </div>
            <div class="rounded-lg border bg-muted/40 p-3">
              <dt class="text-xs text-muted-foreground">CTR</dt>
              <dd class="mt-1 font-semibold text-foreground">{{ ctrLabel }}</dd>
            </div>
            <div class="col-span-2 rounded-lg border bg-muted/40 p-3">
              <dt class="text-xs text-muted-foreground">Asset</dt>
              <dd class="mt-1 font-medium text-foreground">
                {{ creative.performanceLabel ? `${formatLabel(creative.performanceLabel)} · ` : '' }}{{ formatLabel(creative.mediaType) }}
              </dd>
            </div>
          </dl>

          <a
            v-if="creative.videoUrl"
            :href="creative.videoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Open video <ExternalLink class="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';

interface CreativePreview {
  title: string;
  campaignName: string | null;
  mediaType: 'image' | 'video';
  imageUrl: string;
  videoUrl: string | null;
  performanceLabel: string | null;
}

defineProps<{
  open: boolean;
  creative: CreativePreview | null;
  platformLabel: string;
  spendLabel: string;
  ctrLabel: string;
}>();

const emit = defineEmits<{ 'update:open': [value: boolean] }>();

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
}
</script>
