<template>
  <div class="mx-auto w-full max-w-[1200px] space-y-6 text-foreground">
    <AdminPageHeader title="Vehicle Descriptions" description="Choose how dealer comments and descriptions appear on vehicle listings.">
      <template #actions>
        <Button variant="ghost" size="sm" as-child><NuxtLink to="/admin/settings"><ChevronLeft class="mr-2 h-4 w-4" /> Settings</NuxtLink></Button>
      </template>
    </AdminPageHeader>

    <p v-if="pending" role="status" class="py-8 text-sm text-muted-foreground">Loading description settings…</p>
    <Alert v-else-if="error" variant="destructive">
      <AlertTitle>Unable to load description settings</AlertTitle>
      <AlertDescription><Button variant="outline" size="sm" class="mt-2" @click="refresh()">Retry</Button></AlertDescription>
    </Alert>
    <form v-else class="space-y-6" @submit.prevent="save">
      <Card>
        <CardHeader>
          <CardTitle>Listing descriptions</CardTitle>
          <CardDescription>Dealer comments keep their original wording and appear first.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset :disabled="saving || !canEdit" class="space-y-3">
            <legend class="mb-3 text-sm font-medium">Description display</legend>
            <label v-for="option in options" :key="option.value" :for="option.value" class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-ring" :class="mode === option.value ? 'border-primary bg-primary/5' : 'border-border'">
              <input :id="option.value" v-model="mode" type="radio" name="description-mode" :value="option.value" :aria-describedby="`${option.value}-help`" class="mt-1 h-4 w-4 accent-primary" />
              <span class="min-w-0">
                <span class="block text-sm font-medium">{{ option.label }}</span>
                <span :id="`${option.value}-help`" class="mt-1 block text-sm text-muted-foreground">{{ option.help }}</span>
              </span>
            </label>
          </fieldset>
          <p class="mt-4 text-sm text-muted-foreground">Specifications, safety ratings and features continue to work independently of this setting.</p>
          <p v-if="!canEdit" class="mt-3 text-sm text-muted-foreground">An administrator or manager can change this setting.</p>
        </CardContent>
        <CardFooter class="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <p role="status" aria-live="polite" class="text-sm text-muted-foreground">{{ saved ? 'Description settings saved.' : 'Applies to vehicle listings for this dealership.' }}</p>
          <Button type="submit" :disabled="saving || !canEdit || mode === savedMode"><Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />{{ saving ? 'Saving…' : 'Save Changes' }}</Button>
        </CardFooter>
      </Card>
      <Alert v-if="saveError" variant="destructive" role="alert"><AlertTitle>Unable to save</AlertTitle><AlertDescription>{{ saveError }}</AlertDescription></Alert>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Loader2 } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import type { VehicleDescriptionMode } from '~~/shared/vehicleDescriptions';

definePageMeta({ layout: 'admin', middleware: 'auth' });
const { data: auth } = await useFetch('/api/auth/me');
const canEdit = computed(() => ['admin', 'dealer_admin', 'manager'].includes(auth.value?.user?.role || ''));
const { data, pending, error, refresh } = await useFetch('/api/admin/settings/vehicle-descriptions');
const mode = ref<VehicleDescriptionMode>('both');
const savedMode = ref<VehicleDescriptionMode>('both');
const saving = ref(false);
const saved = ref(false);
const saveError = ref('');
const options: { value: VehicleDescriptionMode; label: string; help: string }[] = [
  { value: 'dealer_only', label: 'Dealer comments only', help: 'Show only the comments supplied in your inventory feed.' },
  { value: 'both', label: 'Dealer comments + description', help: 'Show dealer comments first, followed by a separate description. This is the default.' },
  { value: 'ai_fallback', label: 'Description only when dealer comments are blank', help: 'Show dealer comments when available. Use a description only if no dealer comments were supplied.' },
];
watch(data, (value) => {
  if (value?.settings) mode.value = savedMode.value = value.settings.mode;
}, { immediate: true });
watch(mode, () => { saved.value = false; saveError.value = ''; });

async function save() {
  if (!canEdit.value || saving.value) return;
  saving.value = true;
  saved.value = false;
  saveError.value = '';
  try {
    const result = await $fetch('/api/admin/settings/vehicle-descriptions', { method: 'PUT', body: { mode: mode.value } });
    savedMode.value = result.settings.mode;
    // Keep Nuxt's settings cache aligned with the saved value on return navigation.
    if (data.value) data.value.settings.mode = result.settings.mode;
    saved.value = true;
  } catch (err: any) {
    saveError.value = err.data?.message || 'Please try again.';
  } finally {
    saving.value = false;
  }
}
</script>
