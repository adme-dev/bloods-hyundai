<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">External provider lead capture</p>
        <h1 class="text-3xl font-semibold tracking-tight">Lead Sources</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/admin/settings">
            <ArrowLeft class="h-4 w-4" />
            Settings
          </NuxtLink>
        </Button>
        <Button variant="outline" size="sm" :disabled="pending" @click="refresh()">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': pending }" />
          Refresh
        </Button>
      </div>
    </div>

    <div v-if="pending" class="rounded-md border bg-background py-12 text-center text-sm text-muted-foreground">
      Loading lead sources...
    </div>

    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Lead sources could not be loaded</AlertTitle>
      <AlertDescription>{{ error.message || 'Refresh the page and try again.' }}</AlertDescription>
    </Alert>

    <template v-else>
      <div class="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent class="p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase text-muted-foreground">Inbound domain</span>
              <MailPlus class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="break-all text-lg font-semibold">{{ inboundEmailData?.domain || '-' }}</div>
            <p class="mt-1 text-xs text-muted-foreground">{{ inboundEmailData?.configured ? 'Cloudflare email route is configured.' : 'Runtime email domain is not configured.' }}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase text-muted-foreground">Active sources</span>
              <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-2xl font-semibold">{{ activeAddressCount }} / {{ inboundLeadSources.length }}</div>
            <p class="mt-1 text-xs text-muted-foreground">Enabled provider inboxes.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase text-muted-foreground">CRM destination</span>
              <Inbox class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-lg font-semibold">Admin enquiries</div>
            <p class="mt-1 text-xs text-muted-foreground">Matched emails create vehicle enquiries in this CRM.</p>
          </CardContent>
        </Card>
      </div>

      <Alert v-if="!inboundEmailData?.configured">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Inbound email domain is not configured</AlertTitle>
        <AlertDescription>
          Set <code>INBOUND_LEAD_EMAIL_DOMAIN</code> and <code>INBOUND_LEAD_WEBHOOK_SECRET</code> before giving these addresses to providers.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader class="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Provider inboxes</CardTitle>
            <CardDescription>Give these addresses to external lead providers so incoming emails can be converted into CRM enquiries.</CardDescription>
          </div>
          <Button :disabled="creatingAll || !inboundEmailData?.configured" @click="createAllSources">
            <MailPlus class="h-4 w-4" :class="{ 'animate-pulse': creatingAll }" />
            Create all missing
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div
              v-for="source in inboundLeadSources"
              :key="source.source"
              class="rounded-md border p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold">{{ source.label }}</div>
                  <div class="text-xs text-muted-foreground">{{ source.caption }}</div>
                </div>
                <Badge :variant="existingInboundAddress(source.source)?.enabled ? 'default' : 'secondary'">
                  {{ existingInboundAddress(source.source)?.enabled ? 'Active' : 'Not set' }}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                class="mt-3 w-full"
                :disabled="creatingInboundSource === source.source || !inboundEmailData?.configured"
                @click="createInboundAddress(source.source, source.label)"
              >
                <MailPlus class="h-4 w-4" />
                {{ existingInboundAddress(source.source) ? 'Update address' : 'Create address' }}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Provider email address</TableHead>
                <TableHead>CRM enquiry type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="address in sortedAddresses" :key="address.id">
                <TableCell>
                  <div class="font-medium">{{ address.label }}</div>
                  <div class="text-xs text-muted-foreground">{{ sourceLabel(address.source) }}</div>
                </TableCell>
                <TableCell>
                  <div class="break-all font-mono text-xs">{{ address.email || address.localPart }}</div>
                  <div v-if="!address.email" class="text-xs text-muted-foreground">Local part ready; email domain not configured.</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" class="capitalize">{{ address.enquiryType.replaceAll('_', ' ') }}</Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="address.enabled ? 'default' : 'secondary'">{{ address.enabled ? 'Active' : 'Disabled' }}</Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Button size="sm" variant="outline" :disabled="!address.email" @click="copyInboundAddress(address.email)">
                    <Copy class="h-4 w-4" />
                    {{ copiedEmail === address.email ? 'Copied' : 'Copy' }}
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="!sortedAddresses.length">
                <TableCell colspan="5" class="py-8 text-center text-muted-foreground">No lead source inboxes have been created yet.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How this connects to enquiries</CardTitle>
          <CardDescription>Inbound emails are converted into normal CRM enquiries after they match one of the registered recipient addresses.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 md:grid-cols-3">
          <div class="rounded-md border p-3">
            <div class="text-sm font-semibold">1. Provider sends email</div>
            <p class="mt-1 text-xs text-muted-foreground">Carsales, Autotrader, Hyundai OEM, Meta or another provider sends to the assigned inbox.</p>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-sm font-semibold">2. Worker posts to CRM</div>
            <p class="mt-1 text-xs text-muted-foreground">Cloudflare routes the raw email to the secure inbound webhook.</p>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-sm font-semibold">3. Enquiry is created</div>
            <p class="mt-1 text-xs text-muted-foreground">The lead appears in <NuxtLink to="/admin/enquiries" class="font-medium underline">Admin enquiries</NuxtLink> with source attribution.</p>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Inbox,
  MailPlus,
  RefreshCw,
} from 'lucide-vue-next';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

type InboundLeadSource = 'carsales' | 'autotrader' | 'hyundai_oem' | 'meta_lead_ads' | 'other';

type InboundLeadEmailAddress = {
  id: string;
  source: InboundLeadSource;
  label: string;
  localPart: string;
  email: string | null;
  enabled: boolean;
  enquiryType: string;
  createdAt: string;
};

type InboundLeadEmailResponse = {
  configured: boolean;
  domain: string | null;
  addresses: InboundLeadEmailAddress[];
};

const inboundLeadSources: Array<{ source: InboundLeadSource; label: string; caption: string }> = [
  { source: 'carsales', label: 'Carsales', caption: 'Marketplace leads' },
  { source: 'autotrader', label: 'Autotrader', caption: 'Marketplace leads' },
  { source: 'hyundai_oem', label: 'Hyundai OEM', caption: 'OEM lead feed' },
  { source: 'meta_lead_ads', label: 'Meta Lead Ads', caption: 'Social lead forms' },
  { source: 'other', label: 'Other Source', caption: 'Fallback inbox' },
];

const { data: inboundEmailData, pending, error, refresh } = await useFetch<InboundLeadEmailResponse>('/api/admin/lead-ingestion/email-addresses');
const creatingInboundSource = ref<InboundLeadSource | null>(null);
const creatingAll = ref(false);
const copiedEmail = ref<string | null>(null);

const sortedAddresses = computed(() =>
  [...(inboundEmailData.value?.addresses || [])].sort((a, b) => a.label.localeCompare(b.label)),
);

const activeAddressCount = computed(() => sortedAddresses.value.filter(address => address.enabled).length);

function existingInboundAddress(source: InboundLeadSource) {
  return inboundEmailData.value?.addresses.find(address => address.source === source) || null;
}

function sourceLabel(source: InboundLeadSource) {
  return inboundLeadSources.find(item => item.source === source)?.caption || source.replaceAll('_', ' ');
}

async function createInboundAddress(source: InboundLeadSource, label: string) {
  if (creatingInboundSource.value) return;
  creatingInboundSource.value = source;
  try {
    await $fetch('/api/admin/lead-ingestion/email-addresses', {
      method: 'POST',
      body: { source, label },
    });
    await refresh();
  } finally {
    creatingInboundSource.value = null;
  }
}

async function createAllSources() {
  if (creatingAll.value) return;
  creatingAll.value = true;
  try {
    for (const source of inboundLeadSources) {
      if (!existingInboundAddress(source.source)) {
        await $fetch('/api/admin/lead-ingestion/email-addresses', {
          method: 'POST',
          body: { source: source.source, label: source.label },
        });
      }
    }
    await refresh();
  } finally {
    creatingAll.value = false;
  }
}

async function copyInboundAddress(email: string | null) {
  if (!email || typeof navigator === 'undefined' || !navigator.clipboard) return;
  await navigator.clipboard.writeText(email);
  copiedEmail.value = email;
  window.setTimeout(() => {
    if (copiedEmail.value === email) copiedEmail.value = null;
  }, 1600);
}
</script>
