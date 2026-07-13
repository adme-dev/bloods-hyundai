<template>
  <Card class="compact-metric-card" v-bind="$attrs">
    <CardHeader class="grid auto-rows-min grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-start gap-1.5">
      <CardDescription class="compact-metric-card__label"><slot name="label" /></CardDescription>
      <CardTitle class="compact-metric-card__value"><slot name="value" /></CardTitle>
      <CardAction class="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
        <slot name="action" />
      </CardAction>
    </CardHeader>
    <CardFooter class="compact-metric-card__footer mt-auto flex-col items-start gap-1.5">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'

defineOptions({ inheritAttrs: false })
</script>

<style scoped>
.compact-metric-card { min-width: 0; }
.compact-metric-card__label { font-size: 13px; }
.compact-metric-card__value { font-size: 1.75rem; font-weight: 700; letter-spacing: -.025em; line-height: 1.1; }
.compact-metric-card__footer { color: var(--dashboard-muted, hsl(var(--muted-foreground))); font-size: 12px; }
.compact-metric-card__footer :deep(p) { margin: 0; }
@media (max-width: 700px) {
  .compact-metric-card :deep([data-slot="card-header"]), .compact-metric-card :deep([data-slot="card-footer"]) { padding-inline: 14px; }
  .compact-metric-card__label { font-size: 12px; }
  .compact-metric-card__value { font-size: 1.65rem; }
  .compact-metric-card__footer { padding-bottom: 14px; font-size: 11.5px; }
}
</style>
