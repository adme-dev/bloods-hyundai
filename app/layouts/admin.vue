<template>
  <div class="min-h-screen bg-muted/20" data-layout="admin">
    <!-- Top Navigation -->
    <header class="border-b bg-background">
      <div class="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <!-- Mobile Nav -->
          <Sheet>
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon" class="xl:hidden">
                <Menu class="h-5 w-5" />
                <span class="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-64 p-0">
              <SheetHeader class="border-b px-6 py-4 text-left">
                <SheetTitle class="text-lg font-semibold">{{ siteName }} Admin</SheetTitle>
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

          <div class="hidden min-w-[178px] flex-none flex-col justify-center sm:flex">
            <p class="whitespace-nowrap text-sm font-semibold leading-tight text-foreground">{{ siteName }}</p>
            <div class="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs leading-none text-muted-foreground">
              <span>Admin Console</span>
              <span class="hidden text-muted-foreground/60 lg:inline">/</span>
              <span class="hidden lg:inline">{{ currentSectionLabel }}</span>
            </div>
          </div>

          <Separator orientation="vertical" class="hidden h-8 xl:block" />

          <nav class="hidden min-w-0 items-center gap-1 xl:flex">
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

        <div class="admin-header-controls flex shrink-0 items-center gap-2">
          <!-- Real-time notification bell -->
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                class="h-10 rounded-lg border border-border/80 bg-background px-2.5 text-left shadow-sm hover:bg-muted data-[state=open]:border-primary/30 data-[state=open]:bg-muted data-[state=open]:ring-2 data-[state=open]:ring-primary/10"
                aria-label="Open account menu"
              >
                <div class="hidden min-w-0 flex-col leading-none lg:flex">
                  <span class="max-w-[9rem] truncate text-sm font-semibold leading-4 text-foreground">
                    {{ displayName }}
                  </span>
                  <span class="mt-0.5 max-w-[9rem] truncate text-[11px] leading-3 text-muted-foreground">
                    {{ userRoleLabel }}
                  </span>
                </div>
                <Avatar class="h-8 w-8 border border-border bg-primary/10 text-primary">
                  <AvatarImage v-if="userState?.avatarUrl" :src="userState.avatarUrl" :alt="avatarAlt" />
                  <AvatarFallback class="text-xs font-semibold">{{ userInitials }}</AvatarFallback>
                </Avatar>
                <ChevronDown class="hidden h-4 w-4 text-muted-foreground lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" :side-offset="8" :collision-padding="8" class="w-64 p-1.5">
              <div class="rounded-md bg-muted/60 px-2.5 py-2">
                <div class="truncate text-sm font-semibold text-foreground">{{ displayName }}</div>
                <div class="mt-0.5 truncate text-xs text-muted-foreground">{{ userEmail }}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="navigateTo('/admin/settings')">
                <Settings class="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/branding')">
                <Palette class="mr-2 h-4 w-4" /> Branding & Social
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/media')">
                <Image class="mr-2 h-4 w-4" /> Media Library
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/email')">
                <Mail class="mr-2 h-4 w-4" /> Email Settings
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/lead-sources')">
                <MailPlus class="mr-2 h-4 w-4" /> Lead Sources
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
import { computed, onMounted, ref } from 'vue';
import { useRoute } from '#imports';
import { Menu, LogOut, Settings, GitBranch, Mail, MailPlus, Palette, Image, ChevronDown } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import NotificationBell from '~/components/admin/NotificationBell.vue';
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
const { siteName } = useSiteIdentity();

const navLinks = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Enquiries', href: '/admin/enquiries', icon: 'Inbox' },
  { label: 'Marketing', href: '/admin/marketing-report', icon: 'ChartNoAxesCombined' },
  { label: 'Customers', href: '/admin/customers', icon: 'UserCheck' },
  { label: 'Tasks', href: '/admin/tasks', icon: 'ListTodo' },
  { label: 'Service', href: '/admin/service', icon: 'Wrench' },
  { label: 'Forms', href: '/admin/forms', icon: 'FileText' },
  { label: 'Media', href: '/admin/media', icon: 'Image' },
  { label: 'Staff', href: '/admin/staff', icon: 'Users' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

const iconMap: Record<string, any> = await import('lucide-vue-next');

const navItems = navLinks.map(link => ({
  ...link,
  icon: iconMap[link.icon] || iconMap.LayoutDashboard,
}));

const userState = useState<any>('auth-user', () => null);
useAdminRealtime();

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === path;
  }
  return route.path.startsWith(path);
};

const currentSectionLabel = computed(() => {
  const active = [...navLinks]
    .sort((a, b) => b.href.length - a.href.length)
    .find(link => (link.href === '/admin' ? route.path === link.href : route.path.startsWith(link.href)));

  return active?.label || 'Admin Console';
});

const userInitials = computed(() => {
  const firstName = String(userState.value?.firstName || '').trim();
  const lastName = String(userState.value?.lastName || '').trim();
  const nameInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (nameInitials.trim()) return nameInitials;

  const emailInitial = String(userState.value?.email || '').trim().charAt(0).toUpperCase();
  return emailInitial || 'AD';
});

const userEmail = computed(() => userState.value?.email || 'admin@hyundai-dealer.com.au');

const displayName = computed(() => {
  const firstName = String(userState.value?.firstName || '').trim();
  const lastName = String(userState.value?.lastName || '').trim();
  return [firstName, lastName].filter(Boolean).join(' ') || 'Admin';
});

const userRoleLabel = computed(() =>
  String(userState.value?.role || 'dealer_admin')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
);

const avatarAlt = computed(() => `${displayName.value} avatar`);

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

<style scoped>
:global(.admin-header-controls),
:global(.admin-header-controls *) {
  box-sizing: border-box;
}

:global(.admin-header-controls :where(p, ul, ol, li, dl, dd, h1, h2, h3, h4, h5, h6, figure)) {
  margin: 0;
  padding: 0;
}

:global(.admin-header-controls :where(button, input, textarea, select)) {
  margin: 0;
  font: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-transform: none;
}
</style>
