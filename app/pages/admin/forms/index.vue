<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Forms</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Manage your enquiry forms, notifications, and confirmations
        </p>
      </div>
      <Button @click="refreshStats">
        <RefreshCw class="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </div>

    <!-- Stats Overview -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Forms</CardTitle>
          <FileText class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ forms.length }}</div>
          <p class="text-xs text-muted-foreground">Active form types</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Entries</CardTitle>
          <Inbox class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalEntries }}</div>
          <p class="text-xs text-muted-foreground">All time submissions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">This Week</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ weeklyEntries }}</div>
          <p class="text-xs text-muted-foreground">New submissions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Notifications</CardTitle>
          <Bell class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ activeNotifications }}</div>
          <p class="text-xs text-muted-foreground">Email notifications</p>
        </CardContent>
      </Card>
    </div>

    <!-- Forms Table -->
    <Card>
      <CardHeader>
        <CardTitle>All Forms</CardTitle>
        <CardDescription>
          Click on a form to manage its settings, notifications, and confirmations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[100px]">Status</TableHead>
              <TableHead>Form Name</TableHead>
              <TableHead class="text-center">ID</TableHead>
              <TableHead class="text-center">Entries</TableHead>
              <TableHead class="text-center">Notifications</TableHead>
              <TableHead class="text-center">This Week</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="form in forms" 
              :key="form.id"
              class="cursor-pointer hover:bg-muted/50"
              @click="navigateTo(`/admin/forms/${form.slug}`)"
            >
              <TableCell>
                <Badge :variant="form.isActive ? 'default' : 'secondary'">
                  {{ form.isActive ? 'Active' : 'Inactive' }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg" :class="form.iconBg">
                    <component :is="form.icon" class="h-5 w-5" :class="form.iconColor" />
                  </div>
                  <div>
                    <p class="font-medium">{{ form.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ form.description }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-center font-mono text-sm">
                {{ form.id }}
              </TableCell>
              <TableCell class="text-center">
                <span class="font-semibold">{{ form.entries.toLocaleString() }}</span>
              </TableCell>
              <TableCell class="text-center">
                <div class="flex items-center justify-center gap-1">
                  <Badge variant="outline" class="text-xs">
                    {{ form.notifications.admin }} admin
                  </Badge>
                  <Badge variant="outline" class="text-xs">
                    {{ form.notifications.customer }} customer
                  </Badge>
                </div>
              </TableCell>
              <TableCell class="text-center">
                <span :class="form.weeklyChange > 0 ? 'text-green-600' : 'text-muted-foreground'">
                  {{ form.weeklyEntries }}
                </span>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" @click.stop>
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click.stop="navigateTo(`/admin/forms/${form.slug}`)">
                      <Settings class="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem @click.stop="navigateTo(`/admin/forms/${form.slug}/notifications`)">
                      <Bell class="mr-2 h-4 w-4" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem @click.stop="navigateTo(`/admin/forms/${form.slug}/confirmations`)">
                      <CheckCircle class="mr-2 h-4 w-4" />
                      Confirmations
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click.stop="navigateTo(`/admin/enquiries?type=${form.slug}`)">
                      <Inbox class="mr-2 h-4 w-4" />
                      View Entries
                    </DropdownMenuItem>
                    <DropdownMenuItem @click.stop="previewForm(form)">
                      <Eye class="mr-2 h-4 w-4" />
                      Preview Form
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Quick Tips -->
    <Alert>
      <Lightbulb class="h-4 w-4" />
      <AlertTitle>Quick Tips</AlertTitle>
      <AlertDescription>
        <ul class="mt-2 list-disc list-inside space-y-1 text-sm">
          <li>Click on any form to configure its notifications and confirmation messages</li>
          <li>Admin notifications alert your team when a new submission arrives</li>
          <li>Customer notifications confirm receipt to the person who submitted</li>
          <li>Use the <NuxtLink to="/admin/settings/routing" class="text-primary underline">Routing Rules</NuxtLink> for advanced conditional routing</li>
        </ul>
      </AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  FileText,
  Inbox,
  TrendingUp,
  Bell,
  RefreshCw,
  MoreHorizontal,
  Settings,
  CheckCircle,
  Eye,
  Lightbulb,
  Car,
  Phone,
  DollarSign,
  Wrench,
  Package,
  ShoppingCart,
  MessageSquare,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

// Fetch form stats from API
const { data: statsData, refresh: refreshStats } = await useFetch('/api/admin/forms/stats');

// Form definitions with icons and colors
const formDefinitions = [
  {
    id: 1,
    slug: 'vehicle',
    name: 'Car Sales',
    description: 'Vehicle enquiries and stock requests',
    icon: Car,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    isActive: true,
  },
  {
    id: 2,
    slug: 'contact',
    name: 'Contact Us',
    description: 'General enquiries and feedback',
    icon: MessageSquare,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    isActive: true,
  },
  {
    id: 3,
    slug: 'finance',
    name: 'Finance Enquiry',
    description: 'Finance applications and pre-approvals',
    icon: DollarSign,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    isActive: true,
  },
  {
    id: 4,
    slug: 'service',
    name: 'Service Enquiry',
    description: 'Service bookings and maintenance',
    icon: Wrench,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    isActive: true,
  },
  {
    id: 5,
    slug: 'sell_car',
    name: 'Sell My Car',
    description: 'Trade-in valuations and appraisals',
    icon: Car,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    isActive: true,
  },
  {
    id: 6,
    slug: 'parts',
    name: 'Parts Enquiry',
    description: 'Parts requests and availability',
    icon: Package,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    isActive: false,
  },
  {
    id: 7,
    slug: 'accessories',
    name: 'Accessories',
    description: 'Accessories orders and enquiries',
    icon: ShoppingCart,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    isActive: true,
  },
  {
    id: 8,
    slug: 'test_drive',
    name: 'Test Drive',
    description: 'Test drive bookings',
    icon: Car,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    isActive: true,
  },
];

// Merge form definitions with stats (including isActive from database)
const forms = computed(() => {
  const stats = statsData.value?.formStats || {};
  return formDefinitions.map(form => ({
    ...form,
    // Override isActive with value from database (stats API fetches from dealer settings)
    isActive: stats[form.slug]?.isActive ?? form.isActive,
    entries: stats[form.slug]?.total || 0,
    weeklyEntries: stats[form.slug]?.weekly || 0,
    weeklyChange: stats[form.slug]?.weeklyChange || 0,
    notifications: stats[form.slug]?.notifications || { admin: 1, customer: 1 },
  }));
});

const totalEntries = computed(() => forms.value.reduce((sum, f) => sum + f.entries, 0));
const weeklyEntries = computed(() => forms.value.reduce((sum, f) => sum + f.weeklyEntries, 0));
const activeNotifications = computed(() => 
  forms.value.reduce((sum, f) => sum + f.notifications.admin + f.notifications.customer, 0)
);

const previewForm = (form: any) => {
  const routes: Record<string, string> = {
    vehicle: '/car-sales',
    contact: '/contact',
    finance: '/finance',
    service: '/service',
    sell_car: '/sell-my-car',
    parts: '/parts',
    accessories: '/accessories',
    test_drive: '/test-drive',
  };
  window.open(routes[form.slug] || '/', '_blank');
};
</script>






