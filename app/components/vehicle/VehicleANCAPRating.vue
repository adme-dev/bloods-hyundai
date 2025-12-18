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
        icon="👤"
      />
      <ScoreBar
        v-if="details?.childOccupantScore"
        label="Child Occupant"
        :score="details.childOccupantScore"
        icon="👶"
      />
      <ScoreBar
        v-if="details?.vulnerableRoadUserScore"
        label="Pedestrian"
        :score="details.vulnerableRoadUserScore"
        icon="🚶"
      />
      <ScoreBar
        v-if="details?.safetyAssistScore"
        label="Safety Assist"
        :score="details.safetyAssistScore"
        icon="🛡️"
      />
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
    icon: { type: String, default: '' },
  },
  setup(props) {
    const barColor = computed(() => {
      if (props.score >= 80) return 'bg-green-500';
      if (props.score >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    });

    return () => h('div', { class: 'space-y-1' }, [
      h('div', { class: 'flex items-center justify-between text-xs' }, [
        h('span', { class: 'text-slate-600 flex items-center gap-1' }, [
          props.icon && h('span', {}, props.icon),
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
