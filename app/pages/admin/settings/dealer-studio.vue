<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="Dealer Studio LMS"
      description="Send every valid website and inbound lead to Dealer Studio, with delivery tracking and safe retries."
      eyebrow="Integrations"
    >
      <template #actions>
        <Button variant="outline" :disabled="pending" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Refresh
        </Button>
      </template>
    </AdminPageHeader>

    <div v-if="pending" class="flex min-h-64 items-center justify-center rounded-xl border bg-card">
      <div class="text-center">
        <Loader2 class="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
        <p class="mt-3 text-sm text-muted-foreground">Loading integration status…</p>
      </div>
    </div>

    <Alert v-else-if="error" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Could not load Dealer Studio</AlertTitle>
      <AlertDescription class="space-y-3">
        <p>{{ error.message || 'The integration status is unavailable.' }}</p>
        <Button variant="outline" size="sm" @click="refresh">Try again</Button>
      </AlertDescription>
    </Alert>

    <template v-else>
      <Alert v-if="!integration?.credentialConfigured" variant="destructive">
        <KeyRound class="h-4 w-4" />
        <AlertTitle>API credential required</AlertTitle>
        <AlertDescription>
          Add <code>DEALER_STUDIO_API_KEY</code> to the server environment, then redeploy before enabling lead delivery.
          The credential is server-only and is never displayed or stored in dealer settings.
        </AlertDescription>
      </Alert>

      <Alert v-else-if="integration?.settings.enabled" class="border-emerald-500/30 bg-emerald-500/5">
        <CircleCheckBig class="h-4 w-4 text-emerald-600" />
        <AlertTitle>Lead delivery is active</AlertTitle>
        <AlertDescription>
          New leads are queued automatically for {{ integration.settings.dealershipName }} · {{ integration.settings.locationName }}.
        </AlertDescription>
      </Alert>

      <Alert v-else>
        <CirclePause class="h-4 w-4" />
        <AlertTitle>Lead delivery is paused</AlertTitle>
        <AlertDescription>Test the credential, choose the authorised destination, then enable delivery.</AlertDescription>
      </Alert>

      <section aria-label="Dealer Studio delivery summary" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent class="p-5">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total queued</p>
            <p class="mt-2 text-3xl font-semibold tabular-nums">{{ integration?.summary.total ?? 0 }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Synced</p>
                <p class="mt-2 text-3xl font-semibold tabular-nums">{{ integration?.summary.synced ?? 0 }}</p>
              </div>
              <CircleCheckBig class="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending</p>
                <p class="mt-2 text-3xl font-semibold tabular-nums">{{ integration?.summary.pending ?? 0 }}</p>
              </div>
              <Clock3 class="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Needs attention</p>
                <p class="mt-2 text-3xl font-semibold tabular-nums">{{ integration?.summary.failed ?? 0 }}</p>
              </div>
              <TriangleAlert class="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Connection setup</CardTitle>
                <CardDescription>Only dealerships, locations and users authorised for this API key can be selected.</CardDescription>
              </div>
              <Badge :variant="integration?.settings.enabled ? 'default' : 'secondary'">
                {{ integration?.settings.enabled ? 'Enabled' : 'Disabled' }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm font-medium">Verify API access</p>
                <p class="mt-1 text-xs text-muted-foreground">Checks authentication, <code>create:lead</code> permission and authorised dealerships.</p>
              </div>
              <Button
                variant="outline"
                :disabled="testing || !integration?.credentialConfigured"
                @click="testConnection"
              >
                <Loader2 v-if="testing" class="mr-2 h-4 w-4 animate-spin" />
                <PlugZap v-else class="mr-2 h-4 w-4" />
                {{ testing ? 'Testing…' : 'Test connection' }}
              </Button>
            </div>

            <Alert v-if="connectionMessage" :variant="connectionSucceeded ? 'default' : 'destructive'">
              <CircleCheckBig v-if="connectionSucceeded" class="h-4 w-4" />
              <AlertTriangle v-else class="h-4 w-4" />
              <AlertDescription>{{ connectionMessage }}</AlertDescription>
            </Alert>

            <div class="grid gap-5 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="dealership">Authorised dealership</Label>
                <Select
                  :model-value="form.dealershipId"
                  :disabled="!authorisedDealerships.length"
                  @update:model-value="selectDealership"
                >
                  <SelectTrigger id="dealership">
                    <SelectValue :placeholder="storedDealershipLabel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="dealership in authorisedDealerships" :key="dealership.id" :value="String(dealership.id)">
                      {{ dealership.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground">Run the connection test to refresh authorised choices.</p>
              </div>

              <div class="space-y-2">
                <Label for="location">Default location</Label>
                <Select v-model="form.locationId" :disabled="!selectedDealership">
                  <SelectTrigger id="location">
                    <SelectValue :placeholder="storedLocationLabel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="location in availableLocations" :key="location.id" :value="String(location.id)">
                      {{ location.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground">Every lead is delivered to this Dealer Studio location.</p>
              </div>

              <div class="space-y-2 md:col-span-2">
                <Label for="salesperson">Default salesperson (optional)</Label>
                <Select v-model="form.defaultUserEmail" :disabled="!selectedDealership">
                  <SelectTrigger id="salesperson">
                    <SelectValue placeholder="Leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Leave unassigned</SelectItem>
                    <SelectItem v-for="person in availableUsers" :key="person.id" :value="person.email">
                      {{ person.name }} · {{ person.email }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <Label for="delivery-enabled">Automatic lead delivery</Label>
                <p class="text-xs text-muted-foreground">When enabled, every new valid lead is queued immediately.</p>
              </div>
              <Switch
                id="delivery-enabled"
                :model-value="form.enabled"
                :disabled="!integration?.credentialConfigured"
                @update:model-value="(value) => (form.enabled = value)"
              />
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <p class="text-xs text-muted-foreground">
                Last verified: {{ formatDate(integration?.settings.lastTestedAt) }}
              </p>
              <Button :disabled="saving || !canSave" @click="saveSettings">
                <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
                <Save v-else class="mr-2 h-4 w-4" />
                {{ saving ? 'Saving…' : 'Save connection' }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card class="h-fit">
          <CardHeader>
            <CardTitle>Delivery rules</CardTitle>
            <CardDescription>Controls that prevent silent lead loss and accidental duplicates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul class="space-y-4 text-sm">
              <li class="flex gap-3">
                <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>API credentials remain server-only and are never returned to this dashboard.</span>
              </li>
              <li class="flex gap-3">
                <DatabaseZap class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Leads are stored locally before export, so Dealer Studio downtime cannot lose the enquiry.</span>
              </li>
              <li class="flex gap-3">
                <RefreshCw class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Rate limits and server errors retry automatically. Ambiguous timeouts stop for manual review.</span>
              </li>
              <li class="flex gap-3">
                <CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Email and phone are required by Dealer Studio; invalid leads appear below with the exact issue.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery activity</CardTitle>
          <CardDescription>The latest 25 Dealer Studio deliveries. Failed items remain visible until resolved.</CardDescription>
        </CardHeader>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Enquiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Dealer Studio ID</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead class="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="delivery in integration?.recent || []" :key="delivery.id">
                  <TableCell>
                    <NuxtLink :to="`/admin/enquiries/${delivery.enquiryId}`" class="font-medium hover:underline">
                      {{ customerName(delivery) }}
                    </NuxtLink>
                    <p v-if="delivery.lastError" class="mt-1 max-w-72 text-xs text-destructive" :title="delivery.lastError">
                      {{ delivery.lastError }}
                    </p>
                  </TableCell>
                  <TableCell class="capitalize">{{ formatEnquiryType(delivery.enquiryType) }}</TableCell>
                  <TableCell>
                    <Badge :variant="deliveryVariant(delivery.status)">{{ deliveryLabel(delivery.status) }}</Badge>
                  </TableCell>
                  <TableCell class="tabular-nums">{{ delivery.attempts }}</TableCell>
                  <TableCell class="font-mono text-xs">{{ delivery.providerLeadId || '—' }}</TableCell>
                  <TableCell class="whitespace-nowrap text-muted-foreground">{{ formatDate(delivery.updatedAt) }}</TableCell>
                  <TableCell class="text-right">
                    <Button
                      v-if="isRetryableByOperator(delivery.status)"
                      variant="outline"
                      size="sm"
                      :disabled="retryingId === delivery.enquiryId"
                      @click="retryDelivery(delivery.enquiryId)"
                    >
                      <Loader2 v-if="retryingId === delivery.enquiryId" class="mr-2 h-3.5 w-3.5 animate-spin" />
                      <RotateCcw v-else class="mr-2 h-3.5 w-3.5" />
                      Retry
                    </Button>
                    <span v-else class="text-xs text-muted-foreground">—</span>
                  </TableCell>
                </TableRow>
                <TableRow v-if="!(integration?.recent?.length)">
                  <TableCell colspan="7" class="h-28 text-center text-muted-foreground">
                    No delivery attempts yet. New leads will appear here after the integration is enabled.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  AlertTriangle,
  CircleAlert,
  CircleCheckBig,
  CirclePause,
  Clock3,
  DatabaseZap,
  KeyRound,
  Loader2,
  PlugZap,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-vue-next';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Separator } from '~/components/ui/separator';
import { Switch } from '~/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { useToast } from '~/composables/useToast';

definePageMeta({ layout: 'admin', middleware: 'auth' });

type Dealership = {
  id: number;
  name: string;
  slug: string;
  locations: Array<{ id: number; name: string; locationType: string | null }>;
  users: Array<{ id: number; name: string; email: string }>;
};

type Delivery = {
  id: string;
  enquiryId: string;
  status: string;
  attempts: number;
  providerLeadId: string | null;
  lastError: string | null;
  updatedAt: string;
  customerFirstName: string | null;
  customerLastName: string | null;
  enquiryType: string;
};

type IntegrationResponse = {
  credentialConfigured: boolean;
  settings: {
    enabled: boolean;
    dealershipId: number | null;
    dealershipName: string | null;
    locationId: number | null;
    locationName: string | null;
    defaultUserEmail: string | null;
    lastTestedAt: string | null;
  };
  summary: { total: number; pending: number; synced: number; failed: number };
  recent: Delivery[];
};

const { toast } = useToast();
const { data: integration, pending, error, refresh } = await useFetch<IntegrationResponse>('/api/admin/integrations/dealer-studio');

const form = reactive({
  enabled: false,
  dealershipId: '',
  locationId: '',
  defaultUserEmail: '__none__',
});
const authorisedDealerships = ref<Dealership[]>([]);
const testing = ref(false);
const saving = ref(false);
const retryingId = ref('');
const connectionMessage = ref('');
const connectionSucceeded = ref(false);

watch(() => integration.value?.settings, (settings) => {
  if (!settings) return;
  form.enabled = settings.enabled;
  form.dealershipId = settings.dealershipId ? String(settings.dealershipId) : '';
  form.locationId = settings.locationId ? String(settings.locationId) : '';
  form.defaultUserEmail = settings.defaultUserEmail || '__none__';
}, { immediate: true });

const selectedDealership = computed(() =>
  authorisedDealerships.value.find(item => item.id === Number(form.dealershipId)) || null,
);
const availableLocations = computed(() => selectedDealership.value?.locations || []);
const availableUsers = computed(() => selectedDealership.value?.users || []);
const storedDealershipLabel = computed(() => integration.value?.settings.dealershipName || 'Test connection to choose');
const storedLocationLabel = computed(() => integration.value?.settings.locationName || 'Choose a location');
const canSave = computed(() => {
  if (!form.enabled) return true;
  return Boolean(integration.value?.credentialConfigured && form.dealershipId && form.locationId);
});

const selectDealership = (value: unknown) => {
  form.dealershipId = typeof value === 'string' ? value : '';
  const dealership = authorisedDealerships.value.find(item => item.id === Number(form.dealershipId));
  if (!dealership?.locations.some(item => item.id === Number(form.locationId))) {
    const onlyLocation = dealership?.locations.length === 1 ? dealership.locations.at(0) : null;
    form.locationId = onlyLocation ? String(onlyLocation.id) : '';
  }
  if (form.defaultUserEmail !== '__none__' && !dealership?.users.some(item => item.email === form.defaultUserEmail)) {
    form.defaultUserEmail = '__none__';
  }
};

const testConnection = async () => {
  testing.value = true;
  connectionMessage.value = '';
  try {
    const result = await $fetch<{ permissions: string[]; dealerships: Dealership[] }>('/api/admin/integrations/dealer-studio/test', {
      method: 'POST',
    });
    authorisedDealerships.value = result.dealerships;
    const onlyDealership = result.dealerships.length === 1 ? result.dealerships.at(0) : null;
    if (onlyDealership && !form.dealershipId) selectDealership(String(onlyDealership.id));
    connectionSucceeded.value = true;
    connectionMessage.value = `Connection verified. ${result.dealerships.length} authorised dealership${result.dealerships.length === 1 ? '' : 's'} available.`;
  } catch (err: any) {
    connectionSucceeded.value = false;
    connectionMessage.value = err?.data?.message || err?.message || 'Dealer Studio rejected the connection test.';
  } finally {
    testing.value = false;
  }
};

const saveSettings = async () => {
  saving.value = true;
  try {
    await $fetch('/api/admin/integrations/dealer-studio', {
      method: 'PUT',
      body: {
        enabled: form.enabled,
        dealershipId: form.dealershipId ? Number(form.dealershipId) : null,
        locationId: form.locationId ? Number(form.locationId) : null,
        defaultUserEmail: form.defaultUserEmail === '__none__' ? null : form.defaultUserEmail,
      },
    });
    toast.success(form.enabled ? 'Dealer Studio delivery enabled' : 'Dealer Studio delivery paused');
    await refresh();
  } catch (err: any) {
    toast.error(err?.data?.message || err?.message || 'Unable to save Dealer Studio settings');
  } finally {
    saving.value = false;
  }
};

const retryDelivery = async (enquiryId: string) => {
  retryingId.value = enquiryId;
  try {
    await $fetch(`/api/admin/integrations/dealer-studio/${enquiryId}/retry`, { method: 'POST' });
    toast.success('Dealer Studio delivery retried');
    await refresh();
  } catch (err: any) {
    toast.error(err?.data?.message || err?.message || 'Unable to retry this delivery');
  } finally {
    retryingId.value = '';
  }
};

const isRetryableByOperator = (status: string) => [
  'failed_validation',
  'failed_retryable',
  'failed_permanent',
].includes(status);

const deliveryLabel = (status: string) => ({
  pending: 'Pending',
  sending: 'Sending',
  synced: 'Synced',
  failed_validation: 'Invalid lead',
  failed_retryable: 'Retry scheduled',
  failed_permanent: 'Manual review',
}[status] || status.replaceAll('_', ' '));

const deliveryVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'synced') return 'default';
  if (status.startsWith('failed_')) return 'destructive';
  if (status === 'pending' || status === 'sending') return 'secondary';
  return 'outline';
};

const customerName = (delivery: Delivery) =>
  [delivery.customerFirstName, delivery.customerLastName].filter(Boolean).join(' ') || 'Unnamed customer';
const formatEnquiryType = (value: string) => value.replaceAll('_', ' ');
const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Not yet';
</script>
