<template>
  <div class="min-h-screen bg-muted/20" data-layout="admin">
    <!-- Top Navigation -->
    <header class="border-b bg-background">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-4">
          <!-- Mobile Nav -->
          <Sheet>
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon" class="sm:hidden">
                <Menu class="h-5 w-5" />
                <span class="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-64 p-0">
              <SheetHeader class="border-b px-6 py-4 text-left">
                <SheetTitle class="text-lg font-semibold">Sale Hyundai Admin</SheetTitle>
                <SheetDescription>Navigate between admin tools.</SheetDescription>
              </SheetHeader>
              <nav class="space-y-1 px-4 py-4">
                <NuxtLink
                  v-for="link in navItems"
                  :key="link.href"
                  :to="link.href"
                  class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition"
                  :class="isActive(link.href) ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                >
                  <component :is="link.icon" class="mr-2 h-4 w-4" />
                  {{ link.label }}
                </NuxtLink>
              </nav>
            </SheetContent>
          </Sheet>

          <div class="flex items-center gap-2">
            <Badge variant="outline" class="hidden sm:inline-flex">Sale Hyundai</Badge>
            <div>
              <p class="text-sm font-semibold leading-tight">Admin Console</p>
              <p class="text-xs text-muted-foreground">Operations &amp; enquiries</p>
            </div>
          </div>

          <Separator orientation="vertical" class="hidden h-8 sm:block" />

          <nav class="hidden items-center gap-2 sm:flex">
            <NuxtLink
              v-for="link in navItems"
              :key="link.href"
              :to="link.href"
              class="rounded-md px-3 py-2 text-sm font-medium transition"
              :class="isActive(link.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <!-- Real-time notification bell -->
          <Button 
            variant="ghost" 
            size="icon" 
            class="relative"
            @click="handleNotificationClick"
          >
            <Bell class="h-5 w-5" />
            <span 
              v-if="newEnquiryCount > 0"
              class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse"
            >
              {{ newEnquiryCount > 9 ? '9+' : newEnquiryCount }}
            </span>
            <span 
              v-if="isConnected"
              class="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500"
              title="Real-time updates active"
            />
          </Button>

          <Button variant="outline" size="sm" @click="refreshUser" class="hidden sm:inline-flex">
            <RefreshCw class="mr-2 h-4 w-4" />
            Sync
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="flex items-center gap-3">
                <div class="text-left">
                  <p class="text-sm font-semibold leading-tight">
                    {{ userState?.firstName || 'Admin' }} {{ userState?.lastName || '' }}
                  </p>
                  <p class="text-xs text-muted-foreground">dealer_admin</p>
                </div>
                <Avatar class="h-8 w-8">
                  <AvatarImage src="https://www.gravatar.com/avatar?d=mp" alt="Avatar" />
                  <AvatarFallback>{{ userInitials }}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuLabel class="text-xs text-muted-foreground">Signed in as</DropdownMenuLabel>
              <DropdownMenuLabel class="truncate text-sm font-semibold">{{ userEmail }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="navigateTo('/admin/settings')">
                <Settings class="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/email')">
                <Mail class="mr-2 h-4 w-4" /> Email Settings
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/routing')">
                <GitBranch class="mr-2 h-4 w-4" /> Routing rules
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive" @click="handleLogout">
                <LogOut class="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from '#imports';
import { Menu, LogOut, Settings, GitBranch, RefreshCw, Bell, Mail } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
const route = useRoute();

// Real-time enquiry updates - state
const newEnquiryCount = ref(0);
const isConnected = ref(false);
let clearNewCountFn: () => void = () => {};
let requestNotificationPermissionFn: () => Promise<boolean> = async () => false;

// Initialize real-time updates only on client after mount
onMounted(async () => {
  if (process.client) {
    try {
      const { useRealtimeEnquiries } = await import('~/composables/useRealtimeEnquiries');
      const realtime = useRealtimeEnquiries({
        pollInterval: 5000,
        onNewEnquiry: (enquiry) => {
          console.log('🔔 New enquiry:', enquiry.firstName, enquiry.lastName);
          newEnquiryCount.value = realtime.newCount.value;
        },
      });
      
      // Sync initial state
      isConnected.value = realtime.isConnected.value;
      newEnquiryCount.value = realtime.newCount.value;
      
      // Store functions
      clearNewCountFn = realtime.clearNewCount;
      requestNotificationPermissionFn = realtime.requestNotificationPermission;
      
      // Watch for changes
      watch(() => realtime.newCount.value, (val) => { newEnquiryCount.value = val; });
      watch(() => realtime.isConnected.value, (val) => { isConnected.value = val; });
    } catch (e) {
      console.error('Failed to initialize real-time updates:', e);
    }
  }
});

const handleNotificationClick = async () => {
  if (newEnquiryCount.value > 0) {
    clearNewCountFn();
    newEnquiryCount.value = 0;
    await navigateTo('/admin/enquiries');
  } else {
    // Request notification permission if not granted
    await requestNotificationPermissionFn();
  }
};
const navLinks = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Enquiries', href: '/admin/enquiries', icon: 'Inbox' },
  { label: 'Service', href: '/admin/service', icon: 'Wrench' },
  { label: 'Forms', href: '/admin/forms', icon: 'FileText' },
  { label: 'Staff', href: '/admin/staff', icon: 'Users' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

const iconMap: Record<string, any> = await import('lucide-vue-next');

const navItems = navLinks.map(link => ({
  ...link,
  icon: iconMap[link.icon] || iconMap.LayoutDashboard,
}));

const userState = useState<any>('auth-user', () => null);

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === path;
  }
  return route.path.startsWith(path);
};

const userInitials = computed(() => {
  if (!userState.value) return 'SH';
  const { firstName = '', lastName = '' } = userState.value;
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
});

const userEmail = computed(() => userState.value?.email || 'admin@salehyundai.com');

const refreshUser = async () => {
  await fetchUser();
};

const fetchUser = async () => {
  try {
    const { data } = await useFetch('/api/auth/me');
    if (data.value?.user) {
      userState.value = data.value.user;
    }
  } catch (err) {
    console.error('Failed to get user:', err);
  }
};

onMounted(fetchUser);

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' });
    await navigateTo('/admin/login');
  } catch (err) {
    console.error('Logout error:', err);
  }
};
</script>


