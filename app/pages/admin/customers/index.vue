<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Customers</h1>
        <p class="text-sm text-muted-foreground">Manage customer relationships and retention</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="refresh">
          <RotateCcw class="mr-2 h-4 w-4" /> Refresh
        </Button>
        <Button variant="outline" size="sm" @click="clearFilters">
          <Filter class="mr-2 h-4 w-4" /> Clear filters
        </Button>
        <Button size="sm" @click="showAddCustomer = true">
          <Plus class="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Customers</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.total || 0 }}</div>
          <p class="text-xs text-muted-foreground">Active in your database</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">At Risk</CardTitle>
          <AlertTriangle class="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-red-600">{{ stats?.atRisk || 0 }}</div>
          <p class="text-xs text-muted-foreground">Need immediate attention</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Due Follow-ups</CardTitle>
          <Clock class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-amber-600">{{ stats?.dueFollowups || 0 }}</div>
          <p class="text-xs text-muted-foreground">Tasks due today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">New This Month</CardTitle>
          <TrendingUp class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-600">{{ stats?.newThisMonth || 0 }}</div>
          <p class="text-xs text-muted-foreground">Customers added</p>
        </CardContent>
      </Card>
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
        <CardTitle class="text-base">Filter customers</CardTitle>
        <CardDescription>Segment your customer base for targeted engagement</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-5">
        <div class="space-y-2">
          <Label for="search">Search</Label>
          <Input
            id="search"
            v-model="filters.search"
            type="text"
            placeholder="Name, email or phone"
          />
        </div>
        <div class="space-y-2">
          <Label>Lifecycle Stage</Label>
          <Select v-model="filters.lifecycleStage">
            <SelectTrigger>
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All stages</SelectItem>
              <SelectItem v-for="opt in lifecycleOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Risk Level</Label>
          <Select v-model="filters.riskLevel">
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Last Contact</Label>
          <Select v-model="filters.lastContact">
            <SelectTrigger>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="overdue">Overdue (30+ days)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Has Vehicle</Label>
          <Select v-model="filters.hasVehicle">
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="yes">Has vehicle</SelectItem>
              <SelectItem value="no">No vehicle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- Customer Table -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">
          {{ viewTitle }}
        </CardTitle>
        <CardDescription>{{ customers.length }} customers match current filters</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[40px]">
                <Checkbox
                  :checked="allSelected"
                  @update:checked="toggleSelectAll"
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="customer in customers" :key="customer.id" class="group">
              <TableCell>
                <Checkbox
                  :checked="selectedCustomers.includes(customer.id)"
                  @update:checked="(checked) => toggleSelect(customer.id, checked)"
                />
              </TableCell>
              <TableCell>
                <div class="flex items-start gap-3">
                  <Avatar size="sm" class="mt-0.5">
                    <AvatarImage :src="getGravatarUrl(customer.email)" :alt="`${customer.firstName} ${customer.lastName}`" />
                    <AvatarFallback>{{ getInitials(customer.firstName, customer.lastName) }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="font-medium">{{ customer.firstName }} {{ customer.lastName }}</div>
                    <p class="text-sm text-muted-foreground">{{ customer.email }}</p>
                    <p v-if="customer.phone" class="text-xs text-muted-foreground">{{ customer.phone }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getLifecycleBadgeVariant(customer.retentionProfile?.lifecycleStage)">
                  {{ formatLifecycleStage(customer.retentionProfile?.lifecycleStage) }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <div
                    class="h-2 w-2 rounded-full"
                    :class="getRiskDotClass(customer.retentionProfile?.riskLevel)"
                  />
                  <span class="text-sm" :class="getRiskTextClass(customer.retentionProfile?.riskLevel)">
                    {{ formatRiskLevel(customer.retentionProfile?.riskLevel) }}
                  </span>
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  Score: {{ customer.retentionProfile?.riskScore || 0 }}/100
                </div>
              </TableCell>
              <TableCell>
                <div v-if="customer.retentionProfile?.lastContactDate">
                  <div class="text-sm">{{ formatDate(customer.retentionProfile.lastContactDate) }}</div>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDistanceToNow(customer.retentionProfile.lastContactDate) }} ago
                  </p>
                </div>
                <span v-else class="text-sm text-muted-foreground italic">Never contacted</span>
              </TableCell>
              <TableCell>
                <div v-if="customer.vehicles && customer.vehicles.length > 0">
                  <div class="text-sm font-medium">{{ customer.vehicles[0].year }} {{ customer.vehicles[0].model }}</div>
                  <p class="text-xs text-muted-foreground">{{ customer.vehicles[0].registration }}</p>
                  <Badge v-if="customer.vehicles.length > 1" variant="outline" class="mt-1 text-xs">
                    +{{ customer.vehicles.length - 1 }} more
                  </Badge>
                </div>
                <span v-else class="text-sm text-muted-foreground italic">No vehicle</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" title="Call" @click="logCall(customer)">
                    <Phone class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Email" @click="sendEmail(customer)">
                    <Mail class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Add Task" @click="addTask(customer)">
                    <ListTodo class="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="navigateTo(`/admin/customers/${customer.id}`)">
                        <Eye class="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="editCustomer(customer)">
                        <Pencil class="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="addNote(customer)">
                        <StickyNote class="mr-2 h-4 w-4" /> Add Note
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="scheduleFollowup(customer)">
                        <CalendarPlus class="mr-2 h-4 w-4" /> Schedule Follow-up
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive" @click="archiveCustomer(customer)">
                        <Archive class="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button variant="ghost" size="sm" class="group-hover:hidden" as-child>
                  <NuxtLink :to="`/admin/customers/${customer.id}`">
                    View <ArrowRight class="ml-2 h-4 w-4" />
                  </NuxtLink>
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="!pending && customers.length === 0">
              <TableCell colspan="7">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  <Users class="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  No customers found matching your filters.
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="pending">
              <TableCell colspan="7">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  Loading customers...
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
          customers
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

    <!-- Bulk Actions Bar -->
    <div
      v-if="selectedCustomers.length > 0"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <Card class="shadow-lg border-2">
        <CardContent class="flex items-center gap-4 py-3 px-4">
          <span class="text-sm font-medium">{{ selectedCustomers.length }} selected</span>
          <Separator orientation="vertical" class="h-6" />
          <Button variant="outline" size="sm" @click="bulkEmail">
            <Mail class="mr-2 h-4 w-4" /> Email
          </Button>
          <Button variant="outline" size="sm" :disabled="bulkBusy" @click="bulkAddTask">
            <ListTodo class="mr-2 h-4 w-4" /> Add Task
          </Button>
          <Select :model-value="''" @update:model-value="(v: any) => bulkUpdateStage(String(v))">
            <SelectTrigger class="h-9 w-[150px]">
              <SelectValue placeholder="Update Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in lifecycleOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" @click="clearSelection">
            <X class="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Add Customer Dialog -->
    <Dialog v-model:open="showAddCustomer">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Add a customer to your CRM database for retention tracking.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="createCustomer">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="firstName">First Name</Label>
                <Input id="firstName" v-model="newCustomer.firstName" required />
              </div>
              <div class="space-y-2">
                <Label for="lastName">Last Name</Label>
                <Input id="lastName" v-model="newCustomer.lastName" required />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input id="email" v-model="newCustomer.email" type="email" required />
            </div>
            <div class="space-y-2">
              <Label for="phone">Phone</Label>
              <Input id="phone" v-model="newCustomer.phone" type="tel" />
            </div>
            <div class="space-y-2">
              <Label for="stage">Lifecycle Stage</Label>
              <Select v-model="newCustomer.lifecycleStage">
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in lifecycleOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="notes">Notes</Label>
              <Textarea id="notes" v-model="newCustomer.notes" placeholder="Any additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showAddCustomer = false">Cancel</Button>
            <Button type="submit" :disabled="creatingCustomer">
              <span v-if="creatingCustomer">Creating...</span>
              <span v-else>Create Customer</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Add Task Dialog -->
    <Dialog v-model:open="showAddTask">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Follow-up Task</DialogTitle>
          <DialogDescription>
            Schedule a task for {{ taskCustomer?.firstName }} {{ taskCustomer?.lastName }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitTask">
          <div class="grid gap-4 py-4">
            <div class="space-y-2">
              <Label for="taskTitle">Task Title</Label>
              <Input id="taskTitle" v-model="newTask.title" placeholder="e.g., Follow up on test drive" required />
            </div>
            <div class="space-y-2">
              <Label for="taskType">Task Type</Label>
              <Select v-model="newTask.taskType">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Send Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="service_reminder">Service Reminder</SelectItem>
                  <SelectItem value="trade_in_offer">Trade-in Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="dueDate">Due Date</Label>
                <Input id="dueDate" v-model="newTask.dueDate" type="date" required />
              </div>
              <div class="space-y-2">
                <Label for="priority">Priority</Label>
                <Select v-model="newTask.priority">
                  <SelectTrigger>
                    <SelectValue placeholder="Normal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="taskDescription">Description</Label>
              <Textarea id="taskDescription" v-model="newTask.description" placeholder="Additional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showAddTask = false">Cancel</Button>
            <Button type="submit" :disabled="creatingTask">
              <span v-if="creatingTask">Creating...</span>
              <span v-else>Create Task</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch, onMounted } from 'vue';
import {
  RotateCcw, Filter, Plus, ArrowRight, Users, AlertTriangle, Clock, TrendingUp,
  Phone, Mail, ListTodo, MoreHorizontal, Eye, Pencil, StickyNote, CalendarPlus,
  Archive, X, Tag
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Checkbox } from '~/components/ui/checkbox';
import { Separator } from '~/components/ui/separator';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { getGravatarUrl, getInitials } from '~/utils/gravatar';
import { LIFECYCLE_STAGE_CONFIG, type LifecycleStage } from '~~/shared/constants/salesFunnel';

// Canonical lifecycle stages for dropdowns, ordered.
const lifecycleOptions = Object.values(LIFECYCLE_STAGE_CONFIG).sort((a, b) => a.order - b.order);

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

// Get query parameters from URL
const route = useRoute();

// Initialize filters from URL query parameters
const filters = reactive({
  search: (route.query.search as string) || '',
  lifecycleStage: (route.query.lifecycleStage as string) || '__all__',
  riskLevel: (route.query.riskLevel as string) || '__all__',
  lastContact: (route.query.lastContact as string) || '__all__',
  hasVehicle: (route.query.hasVehicle as string) || '__all__',
  view: (route.query.view as string) || 'all',
  page: parseInt(route.query.page as string) || 1,
});

// Sync filter changes back to URL (optional but good UX)
watch(
  () => ({ ...filters }),
  (newFilters) => {
    const query: Record<string, string> = {};
    if (newFilters.search) query.search = newFilters.search;
    if (newFilters.lifecycleStage !== '__all__') query.lifecycleStage = newFilters.lifecycleStage;
    if (newFilters.riskLevel !== '__all__') query.riskLevel = newFilters.riskLevel;
    if (newFilters.lastContact !== '__all__') query.lastContact = newFilters.lastContact;
    if (newFilters.hasVehicle !== '__all__') query.hasVehicle = newFilters.hasVehicle;
    if (newFilters.view !== 'all') query.view = newFilters.view;
    if (newFilters.page > 1) query.page = String(newFilters.page);

    // Update URL without navigation
    navigateTo({ query }, { replace: true });
  },
  { deep: true }
);

// View tabs
const viewTabs = computed(() => [
  { value: 'all', label: 'All Customers', icon: Users, count: stats.value?.total || 0 },
  { value: 'at_risk', label: 'At Risk', icon: AlertTriangle, count: stats.value?.atRisk || 0 },
  { value: 'due_followup', label: 'Due Follow-up', icon: Clock, count: stats.value?.dueFollowups || 0 },
]);

const viewTitle = computed(() => {
  switch (filters.view) {
    case 'at_risk': return 'At-Risk Customers';
    case 'due_followup': return 'Customers Due for Follow-up';
    default: return 'All Customers';
  }
});

// API filters
const apiFilters = computed(() => ({
  search: filters.search,
  lifecycleStage: filters.lifecycleStage === '__all__' ? '' : filters.lifecycleStage,
  riskLevel: filters.riskLevel === '__all__' ? '' : filters.riskLevel,
  lastContact: filters.lastContact === '__all__' ? '' : filters.lastContact,
  hasVehicle: filters.hasVehicle === '__all__' ? '' : filters.hasVehicle,
  view: filters.view,
  page: filters.page,
}));

// Fetch customers
const { data, pending, refresh } = await useFetch('/api/admin/customers', {
  query: apiFilters,
  watch: [apiFilters],
});

const customers = computed(() => data.value?.customers || []);
const pagination = computed(() => data.value?.pagination);
const stats = computed(() => data.value?.stats);

// Selection state
const selectedCustomers = ref<string[]>([]);
const allSelected = computed(() =>
  customers.value.length > 0 && selectedCustomers.value.length === customers.value.length
);

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedCustomers.value = customers.value.map((c: any) => c.id);
  } else {
    selectedCustomers.value = [];
  }
};

const toggleSelect = (id: string, checked: boolean) => {
  if (checked) {
    selectedCustomers.value.push(id);
  } else {
    selectedCustomers.value = selectedCustomers.value.filter(cid => cid !== id);
  }
};

const clearSelection = () => {
  selectedCustomers.value = [];
};

// Clear filters
const clearFilters = () => {
  filters.search = '';
  filters.lifecycleStage = '__all__';
  filters.riskLevel = '__all__';
  filters.lastContact = '__all__';
  filters.hasVehicle = '__all__';
  filters.view = 'all';
  filters.page = 1;
};

// Pagination
const goToPage = (page: number) => {
  filters.page = page;
};

const fromResult = computed(() => {
  if (!pagination.value) return 0;
  return (pagination.value.page - 1) * pagination.value.limit + 1;
});

const toResult = computed(() => {
  if (!pagination.value) return 0;
  return Math.min(pagination.value.page * pagination.value.limit, pagination.value.total);
});

// Add Customer Dialog
const showAddCustomer = ref(false);
const creatingCustomer = ref(false);
const newCustomer = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  lifecycleStage: 'prospect',
  notes: '',
});

const createCustomer = async () => {
  creatingCustomer.value = true;
  try {
    await $fetch('/api/admin/customers', {
      method: 'POST',
      body: newCustomer,
    });
    showAddCustomer.value = false;
    Object.assign(newCustomer, { firstName: '', lastName: '', email: '', phone: '', lifecycleStage: 'prospect', notes: '' });
    refresh();
  } catch (error) {
    console.error('Failed to create customer:', error);
  } finally {
    creatingCustomer.value = false;
  }
};

// Add Task Dialog
const showAddTask = ref(false);
const creatingTask = ref(false);
const taskCustomer = ref<any>(null);
const newTask = reactive({
  title: '',
  taskType: 'follow_up',
  dueDate: '',
  priority: 'normal',
  description: '',
});

const addTask = (customer: any) => {
  taskCustomer.value = customer;
  newTask.title = '';
  newTask.taskType = 'follow_up';
  newTask.dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow
  newTask.priority = 'normal';
  newTask.description = '';
  showAddTask.value = true;
};

const submitTask = async () => {
  if (!taskCustomer.value) return;
  creatingTask.value = true;
  try {
    await $fetch('/api/admin/tasks', {
      method: 'POST',
      body: {
        ...newTask,
        customerId: taskCustomer.value.id,
      },
    });
    showAddTask.value = false;
    refresh();
  } catch (error) {
    console.error('Failed to create task:', error);
  } finally {
    creatingTask.value = false;
  }
};

// Quick Actions
const logCall = (customer: any) => {
  // The full call-logging dialog lives on the customer detail page.
  navigateTo(`/admin/customers/${customer.id}`);
};

const sendEmail = (customer: any) => {
  // TODO: Implement email dialog
  window.open(`mailto:${customer.email}`, '_blank');
};

const addNote = (customer: any) => {
  // Notes/activities are managed on the customer detail page.
  navigateTo(`/admin/customers/${customer.id}`);
};

const scheduleFollowup = (customer: any) => {
  addTask(customer);
};

const editCustomer = (customer: any) => {
  navigateTo(`/admin/customers/${customer.id}?edit=true`);
};

const archiveCustomer = async (customer: any) => {
  if (!confirm(`Are you sure you want to archive ${customer.firstName} ${customer.lastName}?`)) return;
  try {
    await $fetch(`/api/admin/customers/${customer.id}`, {
      method: 'DELETE',
    });
    refresh();
  } catch (error) {
    console.error('Failed to archive customer:', error);
  }
};

// Bulk Actions
const bulkEmail = () => {
  const selectedEmails = customers.value
    .filter((c: any) => selectedCustomers.value.includes(c.id))
    .map((c: any) => c.email);
  window.open(`mailto:${selectedEmails.join(',')}`, '_blank');
};

const bulkBusy = ref(false);

const bulkAddTask = async () => {
  if (selectedCustomers.value.length === 0 || bulkBusy.value) return;
  bulkBusy.value = true;
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  try {
    await Promise.all(
      selectedCustomers.value.map((id) =>
        $fetch('/api/admin/tasks', {
          method: 'POST',
          body: { title: 'Follow up', taskType: 'follow_up', dueDate, priority: 'normal', customerId: id },
        }),
      ),
    );
    clearSelection();
    refresh();
  } catch (error) {
    console.error('Bulk add task failed:', error);
  } finally {
    bulkBusy.value = false;
  }
};

const bulkUpdateStage = async (stage: string) => {
  if (!stage || selectedCustomers.value.length === 0 || bulkBusy.value) return;
  bulkBusy.value = true;
  try {
    await Promise.all(
      selectedCustomers.value.map((id) =>
        $fetch(`/api/admin/customers/${id}`, {
          method: 'PATCH',
          body: { retentionProfile: { lifecycleStage: stage } },
        }),
      ),
    );
    clearSelection();
    refresh();
  } catch (error) {
    console.error('Bulk update stage failed:', error);
  } finally {
    bulkBusy.value = false;
  }
};

// Formatting helpers
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDistanceToNow = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month' : `${months} months`;
};

const formatLifecycleStage = (stage?: string) => {
  if (!stage) return 'Prospect';
  return LIFECYCLE_STAGE_CONFIG[stage as LifecycleStage]?.label || stage;
};

const getLifecycleBadgeVariant = (stage?: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const category = stage ? LIFECYCLE_STAGE_CONFIG[stage as LifecycleStage]?.category : undefined;
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    acquisition: 'outline',
    conversion: 'secondary',
    customer: 'default',
    risk: 'destructive',
    lost: 'outline',
  };
  return (category && map[category]) || 'outline';
};

const formatRiskLevel = (level?: string) => {
  const levels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return levels[level || 'low'] || 'Low';
};

const getRiskDotClass = (level?: string) => {
  const classes: Record<string, string> = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  return classes[level || 'low'] || 'bg-green-500';
};

const getRiskTextClass = (level?: string) => {
  const classes: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return classes[level || 'low'] || 'text-green-600';
};
</script>
