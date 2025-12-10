<template>
  <div v-if="pending" class="flex items-center justify-center py-16 text-muted-foreground">
    <RefreshCcw class="mr-2 h-5 w-5 animate-spin" />
    Loading enquiry details…
  </div>
  
  <div v-else-if="error" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
    <p class="flex items-center gap-2 text-destructive">
      <AlertTriangle class="h-4 w-4" />
      We couldn't load this enquiry. Please try again.
    </p>
    <Button variant="outline" size="sm" class="mt-4" @click="refresh">
      Retry
    </Button>
  </div>
  
  <div v-else-if="enquiry" class="space-y-6">
    <!-- Header -->
    <Card class="shadow-sm">
      <CardContent class="space-y-4 p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <NuxtLink to="/admin/enquiries" class="flex items-center gap-1 hover:text-foreground">
                <ChevronLeft class="h-4 w-4" /> Back to enquiries
              </NuxtLink>
              <span>/</span>
              <span>{{ shortId }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-3xl font-semibold tracking-tight">
                {{ enquiry.firstName }} {{ enquiry.lastName }}
              </h1>
              <Badge variant="secondary">{{ formatType(enquiry.type) }}</Badge>
              <Badge v-if="enquiry.department" variant="outline">{{ enquiry.department }}</Badge>
            </div>
            <p class="text-sm text-muted-foreground">
              Submitted {{ formatDate(enquiry.createdAt) }}
              <span v-if="submittedRelative"> · {{ submittedRelative }} ago</span>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <Select :model-value="statusDraft" @update:model-value="onStatusSelect">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" @click="refresh">
              <RefreshCcw class="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <Button v-if="enquiry.email" variant="secondary" size="sm" :href="`mailto:${enquiry.email}`">
            <Mail class="mr-2 h-4 w-4" /> Email customer
          </Button>
          <Button v-if="enquiry.phone" variant="outline" size="sm" :href="`tel:${enquiry.phone}`">
            <Phone class="mr-2 h-4 w-4" /> Call {{ enquiry.firstName }}
          </Button>
          <Button variant="ghost" size="sm" @click="copyValue(enquiry.id, 'Enquiry ID')">
            <Copy class="mr-2 h-4 w-4" /> Copy ID
          </Button>
          <Badge v-if="enquiry.snoozedUntil && isFuture(enquiry.snoozedUntil)" class="gap-1 bg-amber-100 text-amber-900">
            <Clock class="h-3 w-3" /> Snoozed until {{ formatDate(enquiry.snoozedUntil) }}
          </Badge>
        </div>
      </CardContent>
    </Card>

    <!-- Main grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Left column -->
      <div class="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer overview</CardTitle>
            <CardDescription>Key details to personalize your follow up.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl class="grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm">
                  <a v-if="enquiry.email" :href="`mailto:${enquiry.email}`" class="text-primary hover:underline">
                    {{ enquiry.email }}
                  </a>
                  <span v-else class="text-muted-foreground">Not provided</span>
                  <Button
                    v-if="enquiry.email"
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6"
                    @click="copyValue(enquiry.email, 'Email')"
                  >
                    <Copy class="h-3 w-3" />
                  </Button>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm">
                  <a v-if="enquiry.phone" :href="`tel:${enquiry.phone}`" class="text-primary hover:underline">
                    {{ enquiry.phone }}
                  </a>
                  <span v-else class="text-muted-foreground">Not provided</span>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin class="h-4 w-4" />
                  <span>
                    <span v-if="enquiry.suburb">{{ enquiry.suburb }}</span>
                    <span v-if="enquiry.state">{{ enquiry.suburb ? ', ' : '' }}{{ enquiry.state }}</span>
                    <span v-if="enquiry.postcode"> {{ enquiry.postcode }}</span>
                    <span v-if="!enquiry.suburb && !enquiry.state && !enquiry.postcode">Not provided</span>
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Source URL</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm">
                  <a
                    v-if="enquiry.source"
                    :href="enquiry.source"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe class="h-4 w-4" />
                    {{ sourceDomain || 'View page' }}
                    <ExternalLink class="h-3.5 w-3.5" />
                  </a>
                  <span v-else class="text-muted-foreground">Not captured</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enquiry details</CardTitle>
            <CardDescription>Context around the customer's request.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
                <dd class="mt-1">
                  <Badge :variant="statusBadgeVariant(enquiry.status)">
                    {{ formatStatus(enquiry.status) }}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority</dt>
                <dd class="mt-1 text-sm capitalize">{{ enquiry.priority }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned to</dt>
                <dd class="mt-1 text-sm text-muted-foreground">
                  <span v-if="enquiry.assignedUser">
                    {{ enquiry.assignedUser.firstName }} {{ enquiry.assignedUser.lastName }}
                  </span>
                  <span v-else class="italic">Unassigned</span>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preferred contact</dt>
                <dd class="mt-1 text-sm text-muted-foreground">
                  {{ enquiry.preferredContactMethod || 'Not specified' }}
                </dd>
              </div>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer message</dt>
              <dd class="mt-2 whitespace-pre-line rounded-lg bg-muted/50 p-4 text-sm">
                {{ enquiry.message || 'This customer did not leave a message.' }}
              </dd>
            </div>
          </CardContent>
        </Card>

        <Card v-if="vehicleFields.length || tradeInFields.length || financeFields.length">
          <CardHeader>
            <CardTitle>Vehicle & interest</CardTitle>
            <CardDescription>Everything the customer shared about their vehicle journey.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div v-if="vehicleFields.length" class="space-y-3">
              <h4 class="text-sm font-semibold">Vehicle of interest</h4>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="item in vehicleFields" :key="item.label">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</dt>
                  <dd class="mt-1 text-sm">{{ item.value }}</dd>
                </div>
              </div>
            </div>
            <div v-if="tradeInFields.length" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold">Trade-in vehicle</h4>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="item in tradeInFields" :key="item.label">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</dt>
                  <dd class="mt-1 text-sm">{{ item.value }}</dd>
                </div>
              </div>
            </div>
            <div v-if="financeFields.length" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold">Finance preferences</h4>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="item in financeFields" :key="item.label">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</dt>
                  <dd class="mt-1 text-sm">{{ item.value }}</dd>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="accessoriesItems.length">
          <CardHeader>
            <CardTitle>Accessories cart</CardTitle>
            <CardDescription>Items the customer pre-selected.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div
              v-for="item in accessoriesItems"
              :key="item.id + item.name"
              class="rounded-lg border p-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ item.partNumber }}</p>
                </div>
                <div class="text-right text-sm">
                  <p class="font-semibold">
                    {{ item.quantity }} × {{ formatCurrency(item.price) }}
                  </p>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between border-t pt-4 text-sm">
              <span class="text-muted-foreground">Estimated total</span>
              <span class="font-semibold">{{ formatCurrency(enquiry.accessoriesCart?.total || 0) }}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Capture every follow-up so teammates stay in sync.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label class="text-xs uppercase tracking-wide text-muted-foreground">Add note</Label>
              <Textarea
                v-model="newNote"
                rows="3"
                placeholder="Summarise your conversation, next steps, or commitments."
              />
              <div class="flex justify-end">
                <Button
                  size="sm"
                  :disabled="!newNote.trim() || addingNote"
                  @click="addNote"
                >
                  {{ addingNote ? 'Saving…' : 'Add note' }}
                </Button>
              </div>
            </div>
            <Separator />
            <div class="space-y-3">
              <div
                v-for="note in notes"
                :key="note.id"
                class="rounded-lg border bg-muted/40 p-4"
              >
                <p class="text-sm text-foreground">{{ note.content }}</p>
                <p class="mt-2 text-xs text-muted-foreground">
                  <span v-if="note.user">{{ note.user.firstName }} {{ note.user.lastName }}</span>
                  <span v-else>System</span>
                  · {{ formatDate(note.createdAt) }}
                </p>
              </div>
              <p v-if="!notes.length" class="text-center text-sm text-muted-foreground">No notes yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <Card>
          <CardHeader class="space-y-1">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>CRM sync</CardTitle>
                <CardDescription>Push to the dealer CRM when ready.</CardDescription>
              </div>
              <Badge :class="crmBadgeClass" class="gap-1 text-xs">
                <component :is="enquiry.syncedToCrm ? CheckCircle2 : AlertTriangle" class="h-3.5 w-3.5" />
                {{ enquiry.syncedToCrm ? 'Synced' : 'Not synced' }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <dl class="space-y-3 text-sm">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">CRM record</dt>
                  <dd class="mt-1 font-medium">
                    {{ enquiry.crmRef || 'Not linked' }}
                  </dd>
                </div>
                <Button
                  v-if="enquiry.crmRef"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  @click="copyValue(enquiry.crmRef, 'CRM record ID')"
                >
                  <Copy class="h-3.5 w-3.5" />
                </Button>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">External reference</dt>
                <dd class="mt-1">{{ enquiry.externalRef || 'Not set' }}</dd>
              </div>
            </dl>
            <Button class="w-full" variant="default" @click="openCrmModal">
              {{ enquiry.syncedToCrm ? 'Update CRM link' : 'Sync to CRM' }}
            </Button>
            <p class="text-xs text-muted-foreground">
              Tip: once synced, you can paste the CRM deal link here for quick access.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source & tracking</CardTitle>
            <CardDescription>How this lead reached your team.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 text-sm">
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">UTM tags</p>
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <span>Source</span>
                  <span class="text-muted-foreground">{{ enquiry.utmSource || '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Medium</span>
                  <span class="text-muted-foreground">{{ enquiry.utmMedium || '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Campaign</span>
                  <span class="text-muted-foreground">{{ enquiry.utmCampaign || '—' }}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Technical</p>
              <div class="flex items-center justify-between">
                <span>IP address</span>
                <span class="text-muted-foreground">{{ enquiry.ipAddress || '—' }}</span>
              </div>
              <div>
                <span class="text-muted-foreground text-xs">{{ enquiry.userAgent }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity log</CardTitle>
            <CardDescription>Automatic audit trail for this enquiry.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="activity in activityLog" :key="activity.id" class="relative pl-5 text-sm">
                <span class="absolute left-0 top-1 h-2 w-2 rounded-full bg-primary"></span>
                <p class="font-medium text-foreground">{{ activity.action }}</p>
                <p class="text-xs text-muted-foreground">
                  <span v-if="activity.user">{{ activity.user.firstName }} {{ activity.user.lastName }}</span>
                  <span v-else>System</span>
                  · {{ formatDate(activity.createdAt) }}
                </p>
              </div>
              <p v-if="!activityLog.length" class="text-center text-sm text-muted-foreground">
                No activity recorded yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- CRM modal -->
    <Dialog :open="crmDialogOpen" @update:open="(val) => (crmDialogOpen = val)">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ enquiry.syncedToCrm ? 'Update CRM link' : 'Sync enquiry to CRM' }}</DialogTitle>
          <DialogDescription>
            Store the CRM record reference so everyone can jump back into the same deal.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-2">
            <Label for="crmRef">CRM record ID</Label>
            <Input id="crmRef" v-model="crmForm.crmRef" placeholder="e.g. DEAL-001234" />
          </div>
          <div class="space-y-2">
            <Label for="externalRef">External reference</Label>
            <Input id="externalRef" v-model="crmForm.externalRef" placeholder="Optional - DMS, DQC, etc." />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="crmForm.synced" class="h-4 w-4 rounded border" />
            Mark as synced in CRM
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="crmDialogOpen = false">Cancel</Button>
          <Button :disabled="savingCrm" @click="submitCrmSync">
            {{ savingCrm ? 'Saving…' : 'Save changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { AlertTriangle, CheckCircle2, ChevronLeft, Clock, Copy, ExternalLink, Globe, Mail, MapPin, Phone, RefreshCcw } from 'lucide-vue-next';

import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { useToast } from '~/composables/useToast';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const { toast } = useToast();
const route = useRoute();
const enquiryId = route.params.id as string;

const { data, pending, error, refresh } = await useFetch(`/api/admin/enquiries/${enquiryId}`);

const enquiry = computed(() => data.value?.enquiry);
const notes = computed(() => data.value?.notes ?? []);
const activityLog = computed(() => data.value?.activityLog ?? []);

const isClient = ref(false);
onMounted(() => {
  isClient.value = true;
});

const submittedRelative = computed(() => {
  if (!isClient.value || !enquiry.value?.createdAt) {
    return '';
  }
  return formatRelativeTime(enquiry.value.createdAt);
});

const statusDraft = ref('new');
watch(enquiry, (value) => {
  if (value?.status) {
    statusDraft.value = value.status;
  }
}, { immediate: true });

const statusUpdating = ref(false);
const onStatusSelect = async (nextStatus: string) => {
  if (!enquiry.value || !nextStatus || statusUpdating.value) return;
  const previousStatus = statusDraft.value;
  statusDraft.value = nextStatus;
  statusUpdating.value = true;
  try {
    await $fetch(`/api/admin/enquiries/${enquiryId}/status`, {
      method: 'PATCH',
      body: { status: nextStatus, oldStatus: enquiry.value.status },
    });
    toast.success('Status updated');
    await refresh();
  } catch (err) {
    console.error('Failed to update status:', err);
    toast.error('Unable to update status');
    statusDraft.value = previousStatus;
  } finally {
    statusUpdating.value = false;
  }
};

const newNote = ref('');
const addingNote = ref(false);

const addNote = async () => {
  if (!newNote.value.trim() || addingNote.value) return;
  addingNote.value = true;
  try {
    await $fetch(`/api/admin/enquiries/${enquiryId}/notes`, {
      method: 'POST',
      body: { content: newNote.value },
    });
    newNote.value = '';
    toast.success('Note added');
    await refresh();
  } catch (err) {
    console.error('Failed to add note:', err);
    toast.error('Unable to add note');
  } finally {
    addingNote.value = false;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const formatType = (type: string) => {
  const types: Record<string, string> = {
    contact: 'Contact',
    vehicle: 'Vehicle',
    finance: 'Finance',
    test_drive: 'Test Drive',
    service: 'Service',
    parts: 'Parts',
    accessories: 'Accessories',
    sell_car: 'Sell My Car',
  };
  return types[type] || type;
};

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    new: 'New',
    in_progress: 'In Progress',
    contacted: 'Contacted',
    closed: 'Closed',
  };
  return statuses[status] || status;
};

const statusBadgeVariant = (status: string) => {
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    new: 'default',
    in_progress: 'secondary',
    contacted: 'default',
    closed: 'outline',
  };
  return map[status] || 'outline';
};

const isFuture = (date: string) => new Date(date) > new Date();

const shortId = computed(() => enquiry.value?.id?.slice(0, 8)?.toUpperCase() ?? '—');

const parseFields = (input?: Record<string, unknown> | null) => {
  if (!input || typeof input !== 'object') return [] as { label: string; value: string }[];
  return Object.entries(input)
    .filter(([, value]) => value !== null && value !== '' && typeof value !== 'object')
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: String(value),
    }));
};

const formatLabel = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

const vehicleFields = computed(() => parseFields(enquiry.value?.vehicleInfo));
const tradeInFields = computed(() => parseFields(enquiry.value?.tradeInInfo));
const financeFields = computed(() => parseFields(enquiry.value?.financeDetails));

const accessoriesItems = computed(() => {
  const items = enquiry.value?.accessoriesCart?.items;
  if (!Array.isArray(items)) return [] as any[];
  return items;
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value || 0);
};

const copyValue = async (value?: string, label?: string) => {
  if (!value || !process.client) return;
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label ?? 'Value'} copied to clipboard`);
  } catch (err) {
    console.error('Clipboard error', err);
    toast.error('Unable to copy to clipboard');
  }
};

const sourceDomain = computed(() => {
  if (!enquiry.value?.source) return '';
  try {
    return new URL(enquiry.value.source).hostname.replace('www.', '');
  } catch {
    return '';
  }
});

const crmBadgeClass = computed(() =>
  enquiry.value?.syncedToCrm
    ? 'bg-green-100 text-green-900'
    : 'bg-amber-100 text-amber-900'
);

const crmDialogOpen = ref(false);
const savingCrm = ref(false);
const crmForm = reactive({
  crmRef: '',
  externalRef: '',
  synced: true,
});

const openCrmModal = () => {
  if (enquiry.value) {
    crmForm.crmRef = enquiry.value.crmRef || '';
    crmForm.externalRef = enquiry.value.externalRef || '';
    crmForm.synced = enquiry.value.syncedToCrm ?? false;
  }
  crmDialogOpen.value = true;
};

const submitCrmSync = async () => {
  savingCrm.value = true;
  try {
    await $fetch(`/api/admin/enquiries/${enquiryId}/crm`, {
      method: 'POST',
      body: {
        crmRef: crmForm.crmRef.trim() || null,
        externalRef: crmForm.externalRef.trim() || null,
        synced: crmForm.synced,
      },
    });
    toast.success('CRM details saved');
    crmDialogOpen.value = false;
    await refresh();
  } catch (err) {
    console.error('CRM sync failed', err);
    toast.error('Unable to save CRM details');
  } finally {
    savingCrm.value = false;
  }
};
</script>
