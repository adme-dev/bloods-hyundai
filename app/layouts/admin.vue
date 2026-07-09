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

          <div class="hidden min-w-0 flex-none items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 sm:flex">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background text-[11px] font-semibold leading-none text-foreground">
              {{ siteInitials }}
            </div>
            <div class="min-w-0">
              <div class="flex min-w-0 items-center gap-2">
                <p class="max-w-36 truncate text-sm font-semibold leading-tight text-foreground lg:max-w-44">{{ siteName }}</p>
                <span class="hidden h-3 w-px bg-border lg:block" />
                <p class="hidden whitespace-nowrap text-sm font-medium leading-tight text-muted-foreground lg:block">{{ currentSectionLabel }}</p>
              </div>
              <p class="hidden whitespace-nowrap text-xs leading-tight text-muted-foreground 2xl:block">Operations &amp; enquiries</p>
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

        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <!-- Real-time notification bell -->
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="flex items-center gap-3">
                <div class="hidden text-left lg:block">
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
import { Menu, LogOut, Settings, GitBranch, Mail, MailPlus, Palette, Image } from 'lucide-vue-next';
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

const siteInitials = computed(() => siteName.value
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(word => word.charAt(0))
  .join('')
  .toUpperCase() || 'HD');

const userInitials = computed(() => {
  if (!userState.value) return 'HD';
  const { firstName = '', lastName = '' } = userState.value;
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
});

const userEmail = computed(() => userState.value?.email || 'admin@hyundai-dealer.com.au');

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






