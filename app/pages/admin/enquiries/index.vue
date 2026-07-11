<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Enquiries</h1>
        <p class="text-sm text-muted-foreground">Monitor and respond to every customer touchpoint</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Real-time indicator -->
        <div v-if="realtimeConnected" class="flex items-center gap-1 text-xs text-green-600">
          <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
        <Button variant="outline" size="sm" @click="refresh">
          <RotateCcw class="mr-2 h-4 w-4" /> Refresh
        </Button>
        <Button variant="outline" size="sm" @click="clearFilters">
          <Filter class="mr-2 h-4 w-4" /> Clear filters
        </Button>
      </div>
    </div>

    <!-- View Tabs -->
    <div class="flex gap-1 border-b">
      <Button 
        v-for="tab in viewTabs" 
        :key="tab.value"
        :variant="filters.view === tab.value ? 'default' : 'ghost'"
        size="sm"
        class="rounded-b-none"
        @click="filters.view = tab.value"
      >
        <component :is="tab.icon" class="mr-2 h-4 w-4" />
        {{ tab.label }}
        <Badge v-if="tab.count > 0" variant="secondary" class="ml-2">{{ tab.count }}</Badge>
      </Button>
    </div>

    <!-- Filters -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base">Filter enquiries</CardTitle>
        <CardDescription>Use any combination to narrow the pipeline</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-4">
        <div class="space-y-2">
          <Label for="search">Search</Label>
          <Input
            id="search"
            v-model="filters.search"
            type="text"
            placeholder="Name, email or keyword"
          />
        </div>
        <div class="space-y-2">
          <Label>Type</Label>
          <Select v-model="filters.type">
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="test_drive">Test Drive</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="parts">Parts</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="sell_car">Sell My Car</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Status</Label>
          <Select v-model="filters.status">
            <SelectTrigger>
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All status</SelectItem>
              <SelectGroup>
                <SelectLabel class="text-xs text-muted-foreground">Cold Leads</SelectLabel>
                <SelectItem value="new_lead">New Lead</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="attempted_contact">Attempted Contact</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel class="text-xs text-muted-foreground">Warm Leads</SelectLabel>
                <SelectItem value="appointment_set">Appointment Set</SelectItem>
                <SelectItem value="showed">Showed</SelectItem>
                <SelectItem value="test_drive">Test Drive</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel class="text-xs text-muted-foreground">Hot Leads</SelectLabel>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="pending_finance">Pending Finance</SelectItem>
                <SelectItem value="pending_trade">Pending Trade</SelectItem>
                <SelectItem value="deposit_taken">Deposit Taken</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel class="text-xs text-muted-foreground">Closed</SelectLabel>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Assigned</Label>
          <Select v-model="filters.assigned">
            <SelectTrigger>
              <SelectValue placeholder="All assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">
          {{ filters.view === 'inbox' ? 'Inbox' : filters.view === 'snoozed' ? 'Snoozed' : 'Archived' }}
        </CardTitle>
        <CardDescription>{{ enquiries.length }} enquiries match current filters</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="enquiry in enquiries" :key="enquiry.id">
              <TableCell class="align-top">
                <div class="font-medium">{{ formatDate(enquiry.createdAt) }}</div>
                <p class="text-xs text-muted-foreground">
                  {{ formatDistanceToNow(enquiry.createdAt) }} ago
                </p>
                <!-- Snoozed indicator -->
                <div v-if="enquiry.snoozedUntil && new Date(enquiry.snoozedUntil) > new Date()" class="flex items-center gap-1 mt-1">
                  <Clock class="h-3 w-3 text-amber-500" />
                  <span class="text-xs text-amber-600">Until {{ formatSnoozeDate(enquiry.snoozedUntil) }}</span>
                </div>
              </TableCell>
              <TableCell class="align-top">
                <div class="flex items-start gap-3">
                  <Avatar size="sm" class="mt-0.5">
                    <AvatarImage :src="getGravatarUrl(enquiry.email)" :alt="`${enquiry.firstName} ${enquiry.lastName}`" />
                    <AvatarFallback>{{ getInitials(enquiry.firstName, enquiry.lastName) }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="font-medium">{{ enquiry.firstName }} {{ enquiry.lastName }}</div>
                    <p class="text-sm text-muted-foreground">{{ enquiry.email }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell class="align-top">
                <Badge variant="secondary">{{ formatType(enquiry.type) }}</Badge>
              </TableCell>
              <TableCell class="align-top">
                <Badge :variant="statusBadgeVariant(enquiry.status)">
                  {{ formatStatus(enquiry.status) }}
                </Badge>
              </TableCell>
              <TableCell class="align-top text-sm text-muted-foreground">
                <span v-if="enquiry.assignedUser">
                  {{ enquiry.assignedUser.firstName }} {{ enquiry.assignedUser.lastName }}
                </span>
                <span v-else class="italic text-muted-foreground">Unassigned</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <!-- Snooze dropdown (for inbox view) -->
                  <DropdownMenu v-if="filters.view === 'inbox'">
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" title="Snooze">
                        <Clock class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Snooze until</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="snoozeEnquiry(enquiry.id, '1h')">
                        <Clock class="mr-2 h-4 w-4" /> 1 hour
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="snoozeEnquiry(enquiry.id, '3h')">
                        <Clock class="mr-2 h-4 w-4" /> 3 hours
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="snoozeEnquiry(enquiry.id, 'tomorrow')">
                        <Calendar class="mr-2 h-4 w-4" /> Tomorrow morning
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="snoozeEnquiry(enquiry.id, 'next_week')">
                        <Calendar class="mr-2 h-4 w-4" /> Next week
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <!-- Unsnooze button (for snoozed view) -->
                  <Button 
                    v-if="filters.view === 'snoozed'" 
                    variant="ghost" 
                    size="icon" 
                    title="Unsnooze"
                    @click="unsnoozeEnquiry(enquiry.id)"
                  >
                    <Bell class="h-4 w-4" />
                  </Button>

                  <!-- Archive button (for inbox/snoozed views) -->
                  <Button 
                    v-if="filters.view !== 'archived'" 
                    variant="ghost" 
                    size="icon" 
                    title="Archive"
                    @click="archiveEnquiry(enquiry.id)"
                  >
                    <Archive class="h-4 w-4" />
                  </Button>

                  <!-- Restore button (for archived view) -->
                  <Button 
                    v-if="filters.view === 'archived'" 
                    variant="ghost" 
                    size="icon" 
                    title="Restore"
                    @click="restoreEnquiry(enquiry.id)"
                  >
                    <ArchiveRestore class="h-4 w-4" />
                  </Button>

                  <!-- View button -->
                  <Button variant="ghost" size="sm" as-child>
                    <NuxtLink :to="`/admin/enquiries/${enquiry.id}`">
                      View <ArrowRight class="ml-2 h-4 w-4" />
                    </NuxtLink>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="!pending && enquiries.length === 0">
              <TableCell colspan="6">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  <component :is="emptyStateIcon" class="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  {{ emptyStateMessage }}
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="pending">
              <TableCell colspan="6">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  Loading latest enquiries…
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter v-if="pagination" class="flex flex-col gap-4 border-t bg-muted/30 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-muted-foreground">
          Showing
          <span class="font-semibold">{{ fromResult }}</span>
          to
          <span class="font-semibold">{{ toResult }}</span>
          of
          <span class="font-semibold">{{ pagination.total }}</span>
          results
        </p>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="goToPage(pagination.page - 1)">
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page >= pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted, watch } from 'vue';
import { RotateCcw, Filter, ArrowRight, Inbox, Clock, Archive, ArchiveRestore, Bell, Calendar } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Badge } from '~/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { ENQUIRY_STATUS_CONFIG, type EnquiryStatus } from '~~/shared/constants/salesFunnel';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const route = useRoute();

// Initialize filters from URL query parameters
const filters = reactive({
  search: (route.query.search as string) || '',
  type: (route.query.type as string) || '__all__',
  status: (route.query.status as string) || '__all__',
  assigned: (route.query.assigned as string) || '__all__',
  view: (route.query.view as string) || 'inbox',
  page: parseInt(route.query.page as string) || 1,
});

// Reset to page 1 whenever a filter narrows/changes, so results aren't hidden
// on a now-out-of-range page.
watch(
  () => [filters.search, filters.type, filters.status, filters.assigned, filters.view],
  () => {
    filters.page = 1;
  },
);

// View tabs configuration
const viewTabs = computed(() => [
  { value: 'inbox', label: 'Inbox', icon: Inbox, count: data.value?.counts?.inbox ?? 0 },
  { value: 'snoozed', label: 'Snoozed', icon: Clock, count: data.value?.counts?.snoozed ?? 0 },
  { value: 'archived', label: 'Archived', icon: Archive, count: data.value?.counts?.archived ?? 0 },
]);

// Empty state messages
const emptyStateMessage = computed(() => {
  switch (filters.view) {
    case 'snoozed': return 'No snoozed enquiries. Snooze enquiries to follow up later.';
    case 'archived': return 'No archived enquiries. Archive completed or spam enquiries.';
    default: return 'No enquiries found for this filter set.';
  }
});

const emptyStateIcon = computed(() => {
  switch (filters.view) {
    case 'snoozed': return Clock;
    case 'archived': return Archive;
    default: return Inbox;
  }
});

// Convert __all__ to empty string for API queries
const apiFilters = computed(() => ({
  search: filters.search,
  type: filters.type === '__all__' ? '' : filters.type,
  status: filters.status === '__all__' ? '' : filters.status,
  assigned: filters.assigned === '__all__' ? '' : filters.assigned,
  view: filters.view,
  page: filters.page,
}));

const { data, pending, refresh } = await useFetch('/api/admin/enquiries', {
  query: apiFilters,
  watch: [apiFilters],
});

const enquiries = computed(() => data.value?.enquiries || []);
const pagination = computed(() => data.value?.pagination);

// Real-time updates - auto-refresh when new enquiries arrive
const realtime = useRealtimeEnquiries({
  onNewEnquiry: () => {
    if (filters.view === 'inbox') refresh();
  },
  onUpdatedEnquiry: () => refresh(),
});
const realtimeConnected = realtime.isConnected;

const clearFilters = () => {
  filters.search = '';
  filters.type = '__all__';
  filters.status = '__all__';
  filters.assigned = '__all__';
  filters.page = 1;
};

// Snooze/Archive actions
const snoozeEnquiry = async (id: string, duration: string) => {
  try {
    await $fetch(`/api/admin/enquiries/${id}/snooze`, {
      method: 'POST',
      body: { duration },
    });
    refresh();
  } catch (error) {
    console.error('Failed to snooze enquiry:', error);
  }
};

const unsnoozeEnquiry = async (id: string) => {
  try {
    await $fetch(`/api/admin/enquiries/${id}/unsnooze`, {
      method: 'POST',
    });
    refresh();
  } catch (error) {
    console.error('Failed to unsnooze enquiry:', error);
  }
};

const archiveEnquiry = async (id: string) => {
  try {
    await $fetch(`/api/admin/enquiries/${id}/archive`, {
      method: 'POST',
    });
    refresh();
  } catch (error) {
    console.error('Failed to archive enquiry:', error);
  }
};

const restoreEnquiry = async (id: string) => {
  try {
    await $fetch(`/api/admin/enquiries/${id}/restore`, {
      method: 'POST',
    });
    refresh();
  } catch (error) {
    console.error('Failed to restore enquiry:', error);
  }
};

const formatSnoozeDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const goToPage = (page: number) => {
  filters.page = page;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  return ENQUIRY_STATUS_CONFIG[status as EnquiryStatus]?.label || status;
};

const statusBadgeVariant = (status: string) => {
  const stage = ENQUIRY_STATUS_CONFIG[status as EnquiryStatus]?.stage;
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    cold: 'secondary',
    warm: 'default',
    hot: 'default',
    closed: status === 'lost' ? 'destructive' : 'outline',
  };
  return (stage && map[stage]) || 'outline';
};

const fromResult = computed(() => {
  if (!pagination.value) return 0;
  return (pagination.value.page - 1) * pagination.value.limit + 1;
});

const toResult = computed(() => {
  if (!pagination.value) return 0;
  return Math.min(pagination.value.page * pagination.value.limit, pagination.value.total);
});

const formatDistanceToNow = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

// Import Gravatar utilities with proper MD5 hashing
import { getGravatarUrl, getInitials } from '~/utils/gravatar';
</script>
