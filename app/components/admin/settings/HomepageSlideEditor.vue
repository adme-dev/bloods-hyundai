<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b bg-muted/20">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <CardTitle>Slide {{ index + 1 }}</CardTitle>
            <Badge :variant="slide.enabled ? 'default' : 'secondary'">
              {{ slide.enabled ? scheduleLabel : 'Hidden' }}
            </Badge>
          </div>
          <CardDescription>Desktop and mobile artwork with optional campaign copy and scheduling.</CardDescription>
        </div>
        <div class="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :disabled="disabled || index === 0"
            :aria-label="`Move slide ${index + 1} up`"
            title="Move slide up"
            @click="$emit('move', -1)"
          >
            <ArrowUp class="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :disabled="disabled || index === total - 1"
            :aria-label="`Move slide ${index + 1} down`"
            title="Move slide down"
            @click="$emit('move', 1)"
          >
            <ArrowDown class="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="text-destructive hover:text-destructive"
            :disabled="disabled"
            :aria-label="`Remove slide ${index + 1}`"
            title="Remove slide"
            @click="$emit('remove')"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-6 p-5 sm:p-6">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(190px,.7fr)]">
        <ImageField
          label="Desktop image"
          help="Recommended 1920 × 720 px · JPG, PNG or WebP · maximum 10 MB"
          :src="slide.desktop"
          variant="desktop"
          :disabled="disabled"
          @choose="$emit('choose-image', 'desktop')"
        />
        <ImageField
          label="Mobile image"
          help="Recommended 767 × 975 px · portrait artwork"
          :src="slide.mobile"
          variant="mobile"
          :disabled="disabled"
          @choose="$emit('choose-image', 'mobile')"
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="space-y-2">
          <Label :for="fieldId('heading')">Heading</Label>
          <Input
            :id="fieldId('heading')"
            :model-value="slide.heading_content"
            maxlength="160"
            placeholder="Optional campaign heading"
            :disabled="disabled"
            @update:model-value="update('heading_content', String($event))"
          />
          <p class="text-xs text-muted-foreground">Plain text only · {{ slide.heading_content.length }}/160</p>
        </div>
        <div class="space-y-2">
          <Label :for="fieldId('button')">Button label</Label>
          <Input
            :id="fieldId('button')"
            :model-value="slide.button_text"
            maxlength="48"
            placeholder="View offer"
            :disabled="disabled"
            @update:model-value="update('button_text', String($event))"
          />
        </div>
        <div class="space-y-2 lg:col-span-2">
          <Label :for="fieldId('subheading')">Supporting copy</Label>
          <Textarea
            :id="fieldId('subheading')"
            :model-value="slide.sub_heading"
            maxlength="320"
            rows="3"
            placeholder="Optional terms or campaign summary"
            :disabled="disabled"
            @update:model-value="update('sub_heading', String($event))"
          />
          <p class="text-xs text-muted-foreground">Plain text only · {{ slide.sub_heading.length }}/320</p>
        </div>
        <div class="space-y-2 lg:col-span-2">
          <Label :for="fieldId('link')">Destination link</Label>
          <Input
            :id="fieldId('link')"
            :model-value="slide.link"
            placeholder="/special-offers or https://…"
            :disabled="disabled"
            @update:model-value="update('link', String($event))"
          />
          <p class="text-xs text-muted-foreground">Use a site path beginning with / or a secure HTTPS URL.</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-2">
          <Label :for="fieldId('start')">Start date</Label>
          <AdminDatePicker
            :id="fieldId('start')"
            :model-value="slide.start"
            label="Slide start date"
            placeholder="Show immediately"
            :max="slide.end || undefined"
            clearable
            :disabled="disabled"
            @update:model-value="update('start', $event)"
          />
        </div>
        <div class="space-y-2">
          <Label :for="fieldId('end')">End date</Label>
          <AdminDatePicker
            :id="fieldId('end')"
            :model-value="slide.end"
            label="Slide end date"
            placeholder="No end date"
            :min="slide.start || undefined"
            clearable
            :disabled="disabled"
            @update:model-value="update('end', $event)"
          />
        </div>
        <div class="space-y-2">
          <Label :for="fieldId('contrast')">Text treatment</Label>
          <select
            :id="fieldId('contrast')"
            class="slider-select"
            :value="slide.contrast"
            :disabled="disabled"
            @change="updateContrast(($event.target as HTMLSelectElement).value)"
          >
            <option value="">Default</option>
            <option value="uk-light">Light text</option>
            <option value="uk-dark">Dark text</option>
          </select>
        </div>
        <div class="flex items-end">
          <div class="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border px-3">
            <div>
              <p class="text-sm font-medium">Visible</p>
              <p class="text-xs text-muted-foreground">Include this slide</p>
            </div>
            <Switch
              :model-value="slide.enabled"
              :disabled="disabled"
              :aria-label="`Show slide ${index + 1}`"
              @update:model-value="update('enabled', $event)"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-vue-next';
import type { HomepageSlide } from '~~/shared/homepageSlider';
import ImageField from './HomepageSliderImageField.vue';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { isDateInRangeAt } from '~/utils/date';

const props = defineProps<{
  slide: HomepageSlide;
  index: number;
  total: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:slide', slide: HomepageSlide): void;
  (event: 'choose-image', field: 'desktop' | 'mobile'): void;
  (event: 'move', direction: -1 | 1): void;
  (event: 'remove'): void;
}>();

const fieldId = (field: string) => `homepage-slide-${props.slide.id}-${field}`;
const update = <K extends keyof HomepageSlide>(field: K, value: HomepageSlide[K]) => {
  emit('update:slide', { ...props.slide, [field]: value });
};
const updateContrast = (value: string) => {
  update('contrast', value === 'uk-light' || value === 'uk-dark' ? value : '');
};

const scheduleLabel = computed(() => {
  if (isDateInRangeAt(props.slide.start, props.slide.end)) return 'Live';
  const start = parseDate(props.slide.start);
  return start && start > new Date() ? 'Scheduled' : 'Expired';
});

function parseDate(value: string) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
</script>

<style scoped>
.slider-select {
  display: flex;
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--admin-line);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--admin-surface);
  color: var(--admin-ink);
  font-size: 14px;
}
.slider-select:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
</style>
