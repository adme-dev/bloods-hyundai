<template>
  <div class="space-y-6">
    <!-- Header -->
    <AdminPageHeader :title="customerName" :description="customer?.email || 'Customer record'" eyebrow="Customer CRM record">
      <div class="mt-3 flex items-center gap-3">
        <Avatar class="h-16 w-16">
          <AvatarImage :src="getGravatarUrl(customer?.email || '')" :alt="customerName" />
          <AvatarFallback class="text-xl">{{ getInitials(customer?.firstName || undefined, customer?.lastName || undefined) }}</AvatarFallback>
        </Avatar>
        <div class="min-w-0">
          <p v-if="customer?.phone" class="text-sm text-muted-foreground">{{ customer?.phone }}</p>
          <div class="flex items-center gap-2 mt-2">
            <Badge :variant="getLifecycleBadgeVariant(customer?.retentionProfile?.lifecycleStage)">
              {{ formatLifecycleStage(customer?.retentionProfile?.lifecycleStage) }}
            </Badge>
            <div class="flex items-center gap-1">
              <div
                class="h-2 w-2 rounded-full"
                :class="getRiskDotClass(customer?.retentionProfile?.riskLevel)"
              />
              <span class="text-xs" :class="getRiskTextClass(customer?.retentionProfile?.riskLevel)">
                {{ formatRiskLevel(customer?.retentionProfile?.riskLevel) }} Risk
              </span>
            </div>
          </div>
      </div>
      </div>
      <template #actions>
        <Button variant="ghost" size="sm" @click="navigateTo('/admin/customers')">
          <ArrowLeft class="mr-2 h-4 w-4" /> Customers
        </Button>
        <Button variant="outline" size="sm" @click="logCall">
          <Phone class="mr-2 h-4 w-4" /> Log Call
        </Button>
        <Button variant="outline" size="sm" @click="sendEmail">
          <Mail class="mr-2 h-4 w-4" /> Send Email
        </Button>
        <Button size="sm" @click="showAddTask = true">
          <Plus class="mr-2 h-4 w-4" /> Add Task
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" aria-label="Open customer actions">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="openEdit">
              <Pencil class="mr-2 h-4 w-4" /> Edit Customer
            </DropdownMenuItem>
            <DropdownMenuItem @click="showAddVehicle = true">
              <Car class="mr-2 h-4 w-4" /> Add Vehicle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @click="archiveCustomer">
              <Archive class="mr-2 h-4 w-4" /> Archive Customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </AdminPageHeader>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Left Column - Main Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Retention Score Card -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Retention Score</CardTitle>
            <CardDescription>Customer engagement and risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-6 md:grid-cols-3">
              <div class="space-y-2">
                <Label class="text-xs text-muted-foreground">Risk Score</Label>
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all"
                      :class="getRiskBarClass(customer?.retentionProfile?.riskScore)"
                      :style="{ width: `${customer?.retentionProfile?.riskScore || 0}%` }"
                    />
                  </div>
                  <span class="text-sm font-medium">{{ customer?.retentionProfile?.riskScore || 0 }}/100</span>
                </div>
              </div>
              <div class="space-y-2">
                <Label class="text-xs text-muted-foreground">Engagement Score</Label>
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500 transition-all"
                      :style="{ width: `${customer?.retentionProfile?.engagementScore || 50}%` }"
                    />
                  </div>
                  <span class="text-sm font-medium">{{ customer?.retentionProfile?.engagementScore || 50 }}/100</span>
                </div>
              </div>
              <div class="space-y-2">
                <Label class="text-xs text-muted-foreground">Last Contact</Label>
                <p class="text-sm font-medium">
                  {{ customer?.retentionProfile?.lastContactDate
                    ? formatDistanceToNow(customer.retentionProfile.lastContactDate) + ' ago'
                    : 'Never contacted' }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Vehicles -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle class="text-base">Vehicles</CardTitle>
              <CardDescription>Registered vehicles for this customer</CardDescription>
            </div>
            <Button variant="outline" size="sm" @click="showAddVehicle = true">
              <Plus class="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            <div v-if="customer?.vehicles?.length" class="space-y-3">
              <div
                v-for="vehicle in customer.vehicles"
                :key="vehicle.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-muted rounded-lg">
                    <Car class="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p class="font-medium">{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}</p>
                    <p class="text-sm text-muted-foreground">{{ vehicle.registration || 'No rego' }}</p>
                  </div>
                </div>
                <div class="text-right text-sm">
                  <p v-if="vehicle.nextServiceDue" class="text-muted-foreground">
                    Service due: {{ formatDate(vehicle.nextServiceDue) }}
                  </p>
                  <p v-if="vehicle.currentOdometer" class="text-xs text-muted-foreground">
                    {{ vehicle.currentOdometer }} km
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="py-8 text-center text-muted-foreground">
              <Car class="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p class="text-sm">No vehicles registered</p>
              <Button variant="link" size="sm" @click="showAddVehicle = true">Add a vehicle</Button>
            </div>
          </CardContent>
        </Card>

        <!-- Activity Timeline -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Activity Timeline</CardTitle>
            <CardDescription>Recent interactions and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="customer?.activities?.length" class="space-y-4">
              <div
                v-for="activity in customer.activities"
                :key="activity.id"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full"
                    :class="getActivityIconClass(activity.activityType)"
                  >
                    <component :is="getActivityIcon(activity.activityType)" class="h-4 w-4" />
                  </div>
                  <div class="flex-1 w-px bg-border mt-2" />
                </div>
                <div class="flex-1 pb-4">
                  <div class="flex items-center justify-between">
                    <p class="font-medium text-sm">{{ activity.subject || formatActivityType(activity.activityType) }}</p>
                    <span class="text-xs text-muted-foreground">{{ formatDateTime(activity.activityDate) }}</span>
                  </div>
                  <p v-if="activity.description" class="text-sm text-muted-foreground mt-1">
                    {{ activity.description }}
                  </p>
                  <p v-if="activity.notes" class="text-xs text-muted-foreground mt-1 italic">
                    {{ activity.notes }}
                  </p>
                  <p v-if="activity.creator" class="text-xs text-muted-foreground mt-1">
                    by {{ activity.creator.firstName }} {{ activity.creator.lastName }}
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="py-8 text-center text-muted-foreground">
              <Clock class="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p class="text-sm">No activity recorded yet</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Column - Sidebar -->
      <div class="space-y-6">
        <!-- Customer Details -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">Email</Label>
              <p class="text-sm">{{ customer?.email }}</p>
            </div>
            <div v-if="customer?.phone" class="space-y-1">
              <Label class="text-xs text-muted-foreground">Phone</Label>
              <p class="text-sm">{{ customer?.phone }}</p>
            </div>
            <div v-if="customer?.address || customer?.suburb" class="space-y-1">
              <Label class="text-xs text-muted-foreground">Address</Label>
              <p class="text-sm">
                {{ customer?.address }}
                <span v-if="customer?.suburb">, {{ customer?.suburb }}</span>
                <span v-if="customer?.state"> {{ customer?.state }}</span>
                <span v-if="customer?.postcode"> {{ customer?.postcode }}</span>
              </p>
            </div>
            <Separator />
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">Preferred Contact</Label>
              <p class="text-sm capitalize">{{ customer?.retentionProfile?.preferredContactMethod || 'Email' }}</p>
            </div>
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">Marketing Consent</Label>
              <p class="text-sm">{{ customer?.retentionProfile?.marketingConsent ? 'Yes' : 'No' }}</p>
            </div>
            <div v-if="customerTags.length" class="space-y-1">
              <Label class="text-xs text-muted-foreground">Tags</Label>
              <div class="flex flex-wrap gap-1">
                <Badge v-for="tag in customerTags" :key="tag" variant="outline" class="text-xs">
                  {{ tag }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Pending Tasks -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle class="text-base">Pending Tasks</CardTitle>
              <CardDescription>{{ customer?.tasks?.length || 0 }} tasks</CardDescription>
            </div>
            <Button variant="ghost" size="sm" @click="showAddTask = true">
              <Plus class="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div v-if="customer?.tasks?.length" class="space-y-3">
              <div
                v-for="task in customer.tasks"
                :key="task.id"
                class="p-3 border rounded-lg space-y-2"
              >
                <div class="flex items-start justify-between">
                  <p class="font-medium text-sm">{{ task.title }}</p>
                  <Badge :variant="getPriorityBadgeVariant(task.priority)" class="text-xs">
                    {{ task.priority }}
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground">
                  Due: {{ formatDate(task.dueDate) }}
                </p>
                <div class="flex items-center gap-2">
                  <Button variant="outline" size="sm" class="h-7 text-xs" @click="completeTask(task)">
                    <Check class="mr-1 h-3 w-3" /> Complete
                  </Button>
                </div>
              </div>
            </div>
            <div v-else class="py-4 text-center text-muted-foreground">
              <p class="text-sm">No pending tasks</p>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Stats -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Total Activities</span>
              <span class="font-medium">{{ customer?.metrics?.totalActivities || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Emails Sent</span>
              <span class="font-medium">{{ customer?.metrics?.emailActivities || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Calls Made</span>
              <span class="font-medium">{{ customer?.metrics?.callActivities || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Service Visits</span>
              <span class="font-medium">{{ customer?.metrics?.serviceCount || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Vehicles</span>
              <span class="font-medium">{{ customer?.metrics?.vehicleCount || 0 }}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Add Task Dialog -->
    <Dialog v-model:open="showAddTask">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Follow-up Task</DialogTitle>
          <DialogDescription>
            Schedule a task for {{ customerName }}
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
                <AdminDatePicker v-model="newTask.dueDate" label="Task due date" placeholder="Choose due date" />
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

    <!-- Log Call Dialog -->
    <Dialog v-model:open="showLogCall">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Phone Call</DialogTitle>
          <DialogDescription>
            Record a call with {{ customerName }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitCall">
          <div class="grid gap-4 py-4">
            <div class="space-y-2">
              <Label>Call Direction</Label>
              <Select v-model="newCall.direction">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound (I called them)</SelectItem>
                  <SelectItem value="inbound">Inbound (They called me)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="callDuration">Duration (minutes)</Label>
                <Input id="callDuration" v-model="newCall.duration" type="number" min="0" />
              </div>
              <div class="space-y-2">
                <Label>Outcome</Label>
                <Select v-model="newCall.outcome">
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="voicemail">Left Voicemail</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="wrong_number">Wrong Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="callNotes">Notes</Label>
              <Textarea id="callNotes" v-model="newCall.notes" placeholder="What was discussed..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showLogCall = false">Cancel</Button>
            <Button type="submit" :disabled="loggingCall">
              <span v-if="loggingCall">Saving...</span>
              <span v-else>Log Call</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Add Vehicle Dialog -->
    <Dialog v-model:open="showAddVehicle">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Vehicle</DialogTitle>
          <DialogDescription>
            Register a vehicle for {{ customerName }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitVehicle">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="vMake">Make</Label>
                <Input id="vMake" v-model="newVehicle.make" placeholder="e.g., Hyundai" required />
              </div>
              <div class="space-y-2">
                <Label for="vModel">Model</Label>
                <Input id="vModel" v-model="newVehicle.model" placeholder="e.g., Tucson" required />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="vYear">Year</Label>
                <Input id="vYear" v-model="newVehicle.year" placeholder="e.g., 2024" />
              </div>
              <div class="space-y-2">
                <Label for="vRego">Registration</Label>
                <Input id="vRego" v-model="newVehicle.registration" placeholder="e.g., ABC123" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="vVin">VIN</Label>
                <Input id="vVin" v-model="newVehicle.vin" placeholder="Optional" />
              </div>
              <div class="space-y-2">
                <Label for="vColor">Colour</Label>
                <Input id="vColor" v-model="newVehicle.color" placeholder="Optional" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="vNotes">Notes</Label>
              <Textarea id="vNotes" v-model="newVehicle.notes" placeholder="Optional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showAddVehicle = false">Cancel</Button>
            <Button type="submit" :disabled="creatingVehicle">
              <span v-if="creatingVehicle">Saving...</span>
              <span v-else>Add Vehicle</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Edit Customer Dialog -->
    <Dialog v-model:open="editMode">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update {{ customerName }}'s details
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitEdit">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="eFirst">First Name</Label>
                <Input id="eFirst" v-model="editCustomer.firstName" required />
              </div>
              <div class="space-y-2">
                <Label for="eLast">Last Name</Label>
                <Input id="eLast" v-model="editCustomer.lastName" required />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="eEmail">Email</Label>
              <Input id="eEmail" v-model="editCustomer.email" type="email" required />
            </div>
            <div class="space-y-2">
              <Label for="ePhone">Phone</Label>
              <Input id="ePhone" v-model="editCustomer.phone" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="eSuburb">Suburb</Label>
                <Input id="eSuburb" v-model="editCustomer.suburb" />
              </div>
              <div class="space-y-2">
                <Label for="eState">State</Label>
                <Input id="eState" v-model="editCustomer.state" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="ePostcode">Postcode</Label>
              <Input id="ePostcode" v-model="editCustomer.postcode" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="editMode = false">Cancel</Button>
            <Button type="submit" :disabled="savingEdit">
              <span v-if="savingEdit">Saving...</span>
              <span v-else>Save Changes</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import {
  ArrowLeft, Phone, Mail, Plus, MoreHorizontal, Pencil, Car, Archive,
  Clock, Check, MessageSquare, FileText, Calendar, UserPlus, StickyNote
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Separator } from '~/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
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

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const route = useRoute();
const customerId = route.params.id as string;

// Fetch customer data
const { data, pending, refresh } = await useFetch(`/api/admin/customers/${customerId}`);
const customer = computed(() => data.value?.customer);
const customerName = computed(() =>
  customer.value ? `${customer.value.firstName} ${customer.value.lastName}` : 'Customer'
);
const customerTags = computed<string[]>(() => {
  const tags = (customer.value?.retentionProfile as { tags?: unknown } | null | undefined)?.tags;
  return Array.isArray(tags) ? tags.map(String) : [];
});

// Edit mode
const editMode = ref(false);

// Add Task Dialog
const showAddTask = ref(false);
const creatingTask = ref(false);
const newTask = reactive({
  title: '',
  taskType: 'follow_up',
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
  priority: 'normal',
  description: '',
});

const submitTask = async () => {
  creatingTask.value = true;
  try {
    await $fetch('/api/admin/tasks', {
      method: 'POST',
      body: {
        ...newTask,
        customerId,
      },
    });
    showAddTask.value = false;
    newTask.title = '';
    newTask.description = '';
    refresh();
  } catch (error) {
    console.error('Failed to create task:', error);
  } finally {
    creatingTask.value = false;
  }
};

// Log Call Dialog
const showLogCall = ref(false);
const loggingCall = ref(false);
const newCall = reactive({
  direction: 'outbound',
  duration: '',
  outcome: 'connected',
  notes: '',
});

const logCall = () => {
  newCall.direction = 'outbound';
  newCall.duration = '';
  newCall.outcome = 'connected';
  newCall.notes = '';
  showLogCall.value = true;
};

const submitCall = async () => {
  loggingCall.value = true;
  try {
    await $fetch(`/api/admin/customers/${customerId}/activities`, {
      method: 'POST',
      body: {
        activityType: newCall.direction === 'outbound' ? 'call_outbound' : 'call_inbound',
        subject: `Phone Call (${newCall.outcome})`,
        description: newCall.notes || null,
        callDuration: newCall.duration || null,
        callOutcome: newCall.outcome,
      },
    });
    showLogCall.value = false;
    refresh();
  } catch (error) {
    console.error('Failed to log call:', error);
  } finally {
    loggingCall.value = false;
  }
};

// Send Email
const sendEmail = () => {
  if (customer.value?.email) {
    window.open(`mailto:${customer.value.email}`, '_blank');
  }
};

// Complete Task
const completeTask = async (task: any) => {
  try {
    await $fetch(`/api/admin/tasks/${task.id}`, {
      method: 'PATCH',
      body: { status: 'completed' },
    });
    refresh();
  } catch (error) {
    console.error('Failed to complete task:', error);
  }
};

// Archive Customer
const archiveCustomer = async () => {
  if (!confirm(`Are you sure you want to archive ${customerName.value}?`)) return;
  try {
    await $fetch(`/api/admin/customers/${customerId}`, {
      method: 'DELETE',
    });
    navigateTo('/admin/customers');
  } catch (error) {
    console.error('Failed to archive customer:', error);
  }
};

// Add Vehicle Dialog
const showAddVehicle = ref(false);
const creatingVehicle = ref(false);
const newVehicle = reactive({
  make: '',
  model: '',
  year: '',
  registration: '',
  vin: '',
  color: '',
  notes: '',
});

const submitVehicle = async () => {
  creatingVehicle.value = true;
  try {
    await $fetch(`/api/admin/customers/${customerId}/vehicles`, {
      method: 'POST',
      body: { ...newVehicle },
    });
    showAddVehicle.value = false;
    Object.assign(newVehicle, { make: '', model: '', year: '', registration: '', vin: '', color: '', notes: '' });
    refresh();
  } catch (error) {
    console.error('Failed to add vehicle:', error);
  } finally {
    creatingVehicle.value = false;
  }
};

// Edit Customer Dialog
const savingEdit = ref(false);
const editCustomer = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  suburb: '',
  state: '',
  postcode: '',
});

const openEdit = () => {
  const c = customer.value;
  if (!c) return;
  Object.assign(editCustomer, {
    firstName: c.firstName ?? '',
    lastName: c.lastName ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    suburb: c.suburb ?? '',
    state: c.state ?? '',
    postcode: c.postcode ?? '',
  });
  editMode.value = true;
};

const submitEdit = async () => {
  savingEdit.value = true;
  try {
    await $fetch(`/api/admin/customers/${customerId}`, {
      method: 'PATCH',
      body: { ...editCustomer },
    });
    editMode.value = false;
    refresh();
  } catch (error) {
    console.error('Failed to update customer:', error);
  } finally {
    savingEdit.value = false;
  }
};

// Open the edit dialog automatically when arrived at via ?edit=true.
onMounted(() => {
  if (route.query.edit === 'true') {
    openEdit();
  }
});

// Formatting helpers
const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDistanceToNow = (date: string | Date | null | undefined) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month' : `${months} months`;
};

const formatLifecycleStage = (stage?: string | null) => {
  if (!stage) return 'Prospect';
  return LIFECYCLE_STAGE_CONFIG[stage as LifecycleStage]?.label || stage;
};

const getLifecycleBadgeVariant = (stage?: string | null): 'default' | 'secondary' | 'outline' | 'destructive' => {
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

const formatRiskLevel = (level?: string | null) => {
  const levels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return levels[level || 'low'] || 'Low';
};

const getRiskDotClass = (level?: string | null) => {
  const classes: Record<string, string> = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  return classes[level || 'low'] || 'bg-green-500';
};

const getRiskTextClass = (level?: string | null) => {
  const classes: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return classes[level || 'low'] || 'text-green-600';
};

const getRiskBarClass = (score?: string | number | null) => {
  const numScore = typeof score === 'number' ? score : parseInt(score || '0');
  if (numScore < 30) return 'bg-green-500';
  if (numScore < 60) return 'bg-yellow-500';
  if (numScore < 80) return 'bg-orange-500';
  return 'bg-red-500';
};

const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    low: 'outline',
    normal: 'secondary',
    high: 'default',
    urgent: 'destructive',
  };
  return variants[priority] || 'secondary';
};

const formatActivityType = (type: string) => {
  const types: Record<string, string> = {
    email_sent: 'Email Sent',
    email_received: 'Email Received',
    call_outbound: 'Outbound Call',
    call_inbound: 'Inbound Call',
    sms_sent: 'SMS Sent',
    sms_received: 'SMS Received',
    meeting: 'Meeting',
    note: 'Note Added',
    status_change: 'Status Changed',
    task_completed: 'Task Completed',
    form_submission: 'Form Submitted',
    service_completed: 'Service Completed',
    purchase: 'Purchase',
    vehicle_added: 'Vehicle Added',
  };
  return types[type] || type;
};

const getActivityIcon = (type: string) => {
  const icons: Record<string, any> = {
    email_sent: Mail,
    email_received: Mail,
    call_outbound: Phone,
    call_inbound: Phone,
    sms_sent: MessageSquare,
    sms_received: MessageSquare,
    meeting: Calendar,
    note: StickyNote,
    status_change: FileText,
    task_completed: Check,
    form_submission: FileText,
    service_completed: Car,
    purchase: Car,
    vehicle_added: Car,
  };
  return icons[type] || FileText;
};

const getActivityIconClass = (type: string) => {
  const classes: Record<string, string> = {
    email_sent: 'bg-blue-100 text-blue-600',
    email_received: 'bg-blue-100 text-blue-600',
    call_outbound: 'bg-green-100 text-green-600',
    call_inbound: 'bg-green-100 text-green-600',
    sms_sent: 'bg-purple-100 text-purple-600',
    sms_received: 'bg-purple-100 text-purple-600',
    meeting: 'bg-orange-100 text-orange-600',
    note: 'bg-muted text-muted-foreground',
    status_change: 'bg-yellow-100 text-yellow-600',
    task_completed: 'bg-green-100 text-green-600',
    service_completed: 'bg-blue-100 text-blue-600',
    purchase: 'bg-green-100 text-green-600',
    vehicle_added: 'bg-blue-100 text-blue-600',
  };
  return classes[type] || 'bg-muted text-muted-foreground';
};
</script>
