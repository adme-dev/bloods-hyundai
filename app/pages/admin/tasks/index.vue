<template>
  <div class="space-y-6">
    <!-- Header -->
    <AdminPageHeader title="Tasks" description="Follow-ups and reminders across your pipeline">
      <template #actions>
      <Button variant="outline" size="sm" @click="refresh">
        <RotateCcw class="mr-2 h-4 w-4" /> Refresh
      </Button>
      </template>
    </AdminPageHeader>

    <!-- Stat cards -->
    <div class="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent class="p-4">
          <p class="text-xs uppercase tracking-wide text-muted-foreground">Overdue</p>
          <p class="mt-1 text-3xl font-bold text-red-600">{{ data?.stats?.overdue ?? 0 }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs uppercase tracking-wide text-muted-foreground">Due Today</p>
          <p class="mt-1 text-3xl font-bold text-amber-600">{{ data?.stats?.dueToday ?? 0 }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs uppercase tracking-wide text-muted-foreground">My Open Tasks</p>
          <p class="mt-1 text-3xl font-bold">{{ data?.stats?.myTasks ?? 0 }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="grid gap-4 p-4 sm:grid-cols-4">
        <div class="space-y-2">
          <Label>Status</Label>
          <Select v-model="filters.status">
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Assigned</Label>
          <Select v-model="filters.assignedTo">
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="me">Me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Type</Label>
          <Select v-model="filters.taskType">
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="follow_up">Follow Up</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="service_reminder">Service Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Due</Label>
          <Select v-model="filters.dueDate">
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any time</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="pending">
              <TableCell colspan="7" class="py-8 text-center text-muted-foreground">Loading…</TableCell>
            </TableRow>
            <TableRow v-else-if="tasks.length === 0">
              <TableCell colspan="7" class="py-8 text-center text-muted-foreground">No tasks match these filters.</TableCell>
            </TableRow>
            <TableRow v-for="task in tasks" v-else :key="task.id">
              <TableCell>
                <div class="font-medium">{{ task.title }}</div>
                <div v-if="task.description" class="text-xs text-muted-foreground">{{ task.description }}</div>
              </TableCell>
              <TableCell>
                <NuxtLink v-if="task.customer" :to="`/admin/customers/${task.customer.id}`" class="text-primary hover:underline">
                  {{ task.customer.firstName }} {{ task.customer.lastName }}
                </NuxtLink>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell :class="isOverdue(task) ? 'text-red-600 font-medium' : ''">
                {{ formatDate(task.dueDate) }}
              </TableCell>
              <TableCell>
                <Badge :variant="priorityVariant(task.priority)">{{ task.priority }}</Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="statusVariant(task.status)">{{ formatStatus(task.status) }}</Badge>
              </TableCell>
              <TableCell>
                <span v-if="task.assignedUser">{{ task.assignedUser.firstName }} {{ task.assignedUser.lastName }}</span>
                <span v-else class="text-muted-foreground">Unassigned</span>
              </TableCell>
              <TableCell class="text-right">
                <Button
                  v-if="task.status !== 'completed' && task.status !== 'cancelled'"
                  variant="ghost"
                  size="sm"
                  :disabled="completingId === task.id"
                  @click="completeTask(task)"
                >
                  <CheckCircle2 class="mr-1 h-4 w-4" /> Complete
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Pagination -->
    <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Page {{ pagination.page }} of {{ pagination.totalPages }} · {{ pagination.total }} tasks
      </p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" :disabled="pagination.page <= 1" @click="filters.page--">Previous</Button>
        <Button variant="outline" size="sm" :disabled="pagination.page >= pagination.totalPages" @click="filters.page++">Next</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue';
import { RotateCcw, CheckCircle2 } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Badge } from '~/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '~/components/ui/table';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const filters = reactive({
  status: 'active',
  assignedTo: 'all',
  taskType: 'all',
  dueDate: 'any',
  page: 1,
});

const apiQuery = computed(() => ({
  status: filters.status,
  assignedTo: filters.assignedTo,
  taskType: filters.taskType === 'all' ? '' : filters.taskType,
  dueDate: filters.dueDate === 'any' ? '' : filters.dueDate,
  page: filters.page,
}));

const { data, pending, refresh } = await useFetch('/api/admin/tasks', {
  query: apiQuery,
  watch: [apiQuery],
});

const tasks = computed(() => data.value?.tasks ?? []);
const pagination = computed(() => data.value?.pagination);

// Reset to page 1 when a filter changes.
watch(
  () => [filters.status, filters.assignedTo, filters.taskType, filters.dueDate],
  () => { filters.page = 1; },
);

const completingId = ref<string | null>(null);
const completeTask = async (task: any) => {
  completingId.value = task.id;
  try {
    await $fetch(`/api/admin/tasks/${task.id}`, {
      method: 'PATCH',
      body: { status: 'completed' },
    });
    refresh();
  } catch (error) {
    console.error('Failed to complete task:', error);
  } finally {
    completingId.value = null;
  }
};

const isOverdue = (task: any) => {
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < midnight;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const priorityVariant = (p: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    low: 'outline', normal: 'secondary', high: 'default', urgent: 'destructive',
  };
  return map[p] || 'secondary';
};

const statusVariant = (s: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    pending: 'secondary', in_progress: 'default', completed: 'outline',
    cancelled: 'outline', overdue: 'destructive',
  };
  return map[s] || 'secondary';
};
</script>
