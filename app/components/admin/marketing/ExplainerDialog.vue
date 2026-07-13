<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="max-w-xl">
      <DialogHeader>
        <DialogTitle>Understanding this report</DialogTitle>
        <DialogDescription>
          Plain-English notes on every number, plus an optional AI summary of this period.
        </DialogDescription>
      </DialogHeader>

      <section class="rounded-lg border bg-muted/40 p-4">
        <h3 class="text-sm font-semibold">Explain this period</h3>
        <p class="mt-1 text-xs text-muted-foreground">
          Generates a client-ready summary from this period's actual figures.
        </p>
        <div v-if="aiState === 'idle'" class="mt-3">
          <Button size="sm" @click="generate">Explain this period</Button>
        </div>
        <div v-else-if="aiState === 'loading'" class="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw class="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Generating summary…
        </div>
        <p v-else-if="aiState === 'unavailable'" class="mt-3 text-xs text-muted-foreground">
          AI summary not configured for this environment.
        </p>
        <p v-else-if="aiState === 'error'" class="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Couldn't generate a summary — the notes below still apply.
          <button type="button" class="underline" @click="generate">Try again</button>
        </p>
        <div v-else class="mt-3 space-y-2">
          <p class="text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
            AI-generated — review before sending
          </p>
          <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ narrative }}</p>
          <div class="flex gap-2">
            <Button size="sm" variant="outline" @click="copyNarrative">{{ copied ? 'Copied' : 'Copy' }}</Button>
            <Button size="sm" variant="ghost" @click="generate">Regenerate</Button>
          </div>
          <p v-if="copyFailed" class="text-xs text-muted-foreground">Copy failed — select the text manually.</p>
        </div>
      </section>

      <section
        v-for="t in explainerTopics"
        :key="t.key"
        :ref="el => setSectionEl(t.key, el)"
        class="-mx-3 space-y-2 rounded-lg p-3 transition-colors"
        :class="{ 'bg-primary/5 ring-1 ring-primary/30': highlighted === t.key }"
      >
        <h3 class="text-sm font-semibold">{{ t.title }}</h3>
        <p class="text-sm text-muted-foreground">
          <strong class="font-medium text-foreground">What it measures: </strong>{{ t.measures }}
        </p>
        <p class="text-sm text-muted-foreground">
          <strong class="font-medium text-foreground">Why it can look alarming: </strong>{{ t.whyAlarming }}
        </p>
        <p class="text-sm text-muted-foreground">
          <strong class="font-medium text-foreground">What good looks like: </strong>{{ t.whatGoodLooksLike }}
        </p>
        <div>
          <p class="text-sm font-medium">What to check</p>
          <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li v-for="c in t.whatToCheck" :key="c">{{ c }}</li>
          </ul>
        </div>
      </section>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import { Dialog, DialogDescription, DialogHeader, DialogScrollContent, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { explainerTopics, type ExplainerTopicKey } from './explainerContent';

const props = defineProps<{
  open: boolean;
  topic: ExplainerTopicKey | null;
  from: string;
  to: string;
}>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

type AiState = 'idle' | 'loading' | 'success' | 'error' | 'unavailable';
const aiState = ref<AiState>('idle');
const narrative = ref('');
const copied = ref(false);
const copyFailed = ref(false);
const highlighted = ref<ExplainerTopicKey | null>(null);

const sectionEls = new Map<ExplainerTopicKey, HTMLElement>();
function setSectionEl(key: ExplainerTopicKey, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) sectionEls.set(key, el);
  else sectionEls.delete(key);
}

watch(() => props.open, async (open) => {
  if (!open) { highlighted.value = null; return; }
  if (!props.topic) return;
  highlighted.value = props.topic;
  await nextTick();
  sectionEls.get(props.topic)?.scrollIntoView({ block: 'start' });
});

async function generate() {
  aiState.value = 'loading';
  copied.value = false;
  copyFailed.value = false;
  try {
    const res = await $fetch<{ available: boolean; narrative?: string }>(
      '/api/admin/analytics/marketing-explain',
      { method: 'POST', body: { from: props.from, to: props.to } },
    );
    if (!res.available) { aiState.value = 'unavailable'; return; }
    narrative.value = res.narrative || '';
    aiState.value = narrative.value ? 'success' : 'error';
  }
  catch {
    aiState.value = 'error';
  }
}

async function copyNarrative() {
  copyFailed.value = false;
  try {
    await navigator.clipboard.writeText(narrative.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
  catch {
    copyFailed.value = true;
  }
}
</script>
