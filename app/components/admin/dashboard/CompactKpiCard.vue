<template>
  <Card class="min-w-0" v-bind="$attrs">
    <CardHeader class="grid auto-rows-min grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-start gap-1.5 px-3.5 min-[701px]:px-6">
      <CardDescription class="text-xs min-[701px]:text-[13px]"><slot name="label" /></CardDescription>
      <CardTitle class="text-[1.65rem] font-bold leading-[1.1] tracking-[-.025em] min-[701px]:text-[1.75rem]"><slot name="value" /></CardTitle>
      <CardAction class="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
        <slot name="action" />
      </CardAction>
    </CardHeader>
    <CardFooter class="mt-auto flex-col items-start gap-1.5 px-3.5 pb-3.5 text-[11.5px] text-muted-foreground min-[701px]:px-6 min-[701px]:pb-6 min-[701px]:text-xs [&_p]:m-0">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'

defineOptions({ inheritAttrs: false })
</script>
