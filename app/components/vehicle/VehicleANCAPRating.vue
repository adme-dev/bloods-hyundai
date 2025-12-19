<template>
  <div v-if="rating && rating > 0" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">Safety Rating</h2>
        <p class="text-sm text-slate-500 mt-1">ANCAP {{ year ? `(${year})` : '' }}</p>
      </div>

      <!-- Star Rating -->
      <div class="flex items-center gap-1">
        <template v-for="i in 5" :key="i">
          <svg
            class="h-6 w-6"
            :class="i <= rating ? 'text-yellow-400' : 'text-slate-200'"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </template>
      </div>
    </div>

    <!-- Score Breakdown -->
    <div v-if="hasDetailedScores" class="mt-4 grid grid-cols-2 gap-3">
      <ScoreBar
        v-if="details?.adultOccupantScore"
        label="Adult Occupant"
        :score="details.adultOccupantScore"
      >
        <template #icon>
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </template>
      </ScoreBar>
      <ScoreBar
        v-if="details?.childOccupantScore"
        label="Child Occupant"
        :score="details.childOccupantScore"
      >
        <template #icon>
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </template>
      </ScoreBar>
      <ScoreBar
        v-if="details?.vulnerableRoadUserScore"
        label="Pedestrian"
        :score="details.vulnerableRoadUserScore"
      >
        <template #icon>
          <svg class="h-3.5 w-3.5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
          </svg>
        </template>
      </ScoreBar>
      <ScoreBar
        v-if="details?.safetyAssistScore"
        label="Safety Assist"
        :score="details.safetyAssistScore"
      >
        <template #icon>
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </template>
      </ScoreBar>
    </div>

    <!-- Collision Avoidance Badge -->
    <div v-if="details?.collisionAvoidance" class="mt-4 flex items-center gap-2">
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        :class="collisionAvoidanceBadgeClass"
      >
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {{ details.collisionAvoidance }} Collision Avoidance
      </span>
    </div>

    <!-- Technical Report Link -->
    <div v-if="details?.technicalReportUrl" class="mt-4 pt-3 border-t border-slate-100">
      <a
        :href="details.technicalReportUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        View Full ANCAP Report
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AustralianData } from '~/composables/useVehicleEnrichment';

interface Props {
  rating?: number;
  year?: string;
  details?: AustralianData['ancapDetails'];
}

const props = defineProps<Props>();

const hasDetailedScores = computed(() => {
  const d = props.details;
  return d && (
    d.adultOccupantScore ||
    d.childOccupantScore ||
    d.vulnerableRoadUserScore ||
    d.safetyAssistScore
  );
});

const collisionAvoidanceBadgeClass = computed(() => {
  switch (props.details?.collisionAvoidance) {
    case 'Platinum':
      return 'bg-slate-800 text-white';
    case 'Gold':
      return 'bg-yellow-100 text-yellow-800';
    case 'Silver':
      return 'bg-slate-100 text-slate-700';
    case 'Bronze':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
});
</script>

<script lang="ts">
// Inline ScoreBar component
const ScoreBar = defineComponent({
  props: {
    label: { type: String, required: true },
    score: { type: Number, required: true },
  },
  setup(props, { slots }) {
    const barColor = computed(() => {
      if (props.score >= 80) return 'bg-green-500';
      if (props.score >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    });

    return () => h('div', { class: 'space-y-1' }, [
      h('div', { class: 'flex items-center justify-between text-xs' }, [
        h('span', { class: 'text-slate-600 flex items-center gap-1' }, [
          slots.icon && slots.icon(),
          props.label,
        ]),
        h('span', { class: 'font-semibold text-slate-900' }, `${props.score}%`),
      ]),
      h('div', { class: 'h-2 w-full rounded-full bg-slate-100 overflow-hidden' }, [
        h('div', {
          class: ['h-full rounded-full transition-all', barColor.value],
          style: { width: `${props.score}%` },
        }),
      ]),
    ]);
  },
});
</script>
