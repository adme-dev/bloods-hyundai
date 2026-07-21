<template>
  <div class="min-h-screen bg-background text-foreground" data-layout="admin">
    <header class="sticky top-0 z-30 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div class="mx-auto flex h-[58px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 min-[701px]:h-16 min-[701px]:px-6">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <Sheet v-model:open="mobileNavOpen">
            <SheetTrigger as-child>
              <Button variant="outline" size="icon" class="xl:hidden">
                <Menu class="h-5 w-5" />
                <span class="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-64 p-0">
              <SheetHeader class="border-b px-6 py-4 text-left">
                <SheetTitle class="text-lg font-semibold">{{ siteName }} Admin</SheetTitle>
                <SheetDescription class="sr-only">Navigate between admin tools.</SheetDescription>
                <div class="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-lg bg-muted p-2.5">
                  <Avatar class="h-9 w-9 border bg-primary/10 text-primary">
                    <AvatarImage v-if="userState?.avatarUrl" :src="userState.avatarUrl" :alt="avatarAlt" />
                    <AvatarFallback class="text-xs font-semibold">{{ userInitials }}</AvatarFallback>
                  </Avatar>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold">{{ displayName }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ userRoleLabel }}</p>
                  </div>
                </div>
              </SheetHeader>
              <nav class="space-y-1 px-4 py-4" aria-label="Mobile admin navigation">
                <SheetClose v-for="link in navItems" :key="link.href" as-child>
                  <NuxtLink
                    :to="link.href"
                    class="flex items-center rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors"
                    :class="isActive(link.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
                    :aria-current="isActive(link.href) ? 'page' : undefined"
                  >
                    <component :is="link.icon" class="mr-2 h-4 w-4" />
                    {{ link.label }}
                  </NuxtLink>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>

          <div class="flex min-w-0 max-w-36 flex-col leading-[1.1] sm:hidden" aria-label="Signed-in user">
            <span class="truncate text-[12.5px] font-bold">{{ displayName }}</span>
            <small class="mt-[3px] truncate text-[10.5px] text-muted-foreground">{{ currentSectionLabel }}</small>
          </div>

          <div class="hidden min-w-[190px] flex-none items-center gap-2.5 sm:flex max-[1450px]:min-w-0">
            <span class="grid size-[34px] flex-none place-items-center rounded-lg bg-primary text-[11px] font-extrabold tracking-[.06em] text-primary-foreground" aria-hidden="true">BH</span>
            <div class="min-w-0">
              <p class="truncate text-[13px] font-bold leading-[1.2]">{{ siteName }}</p>
              <div class="mt-[3px] flex items-center gap-[5px] whitespace-nowrap text-[10.5px] leading-none text-muted-foreground max-[1450px]:hidden">
                <span>Admin Console</span>
                <span class="hidden lg:inline">/</span>
                <span class="hidden lg:inline">{{ currentSectionLabel }}</span>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" class="hidden h-8 xl:block" />

          <nav class="hidden min-w-0 items-center gap-0.5 xl:flex" aria-label="Admin navigation">
            <NuxtLink
              v-for="link in navItems"
              :key="link.href"
              :to="link.href"
              class="whitespace-nowrap rounded-md px-2 py-2 text-xs font-semibold leading-none transition-colors max-[1450px]:px-[7px] max-[1450px]:text-[11.5px]"
              :class="isActive(link.href) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
              :aria-current="isActive(link.href) ? 'page' : undefined"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="flex shrink-0 items-center gap-1 rounded-xl border bg-card p-1 shadow-sm">
          <NotificationBell />
          <Separator orientation="vertical" class="h-6" />
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="h-10 gap-2 px-2.5 text-left" aria-label="Open account menu">
                <div class="hidden min-w-0 flex-col leading-none lg:flex">
                  <span class="max-w-36 truncate text-sm font-semibold leading-4">{{ displayName }}</span>
                  <span class="mt-0.5 max-w-36 truncate text-[11px] leading-3 text-muted-foreground">{{ userRoleLabel }}</span>
                </div>
                <Avatar class="h-8 w-8 border bg-primary/10 text-primary">
                  <AvatarImage v-if="userState?.avatarUrl" :src="userState.avatarUrl" :alt="avatarAlt" />
                  <AvatarFallback class="text-xs font-semibold">{{ userInitials }}</AvatarFallback>
                </Avatar>
                <ChevronDown class="hidden h-4 w-4 text-muted-foreground lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" :side-offset="8" :collision-padding="8" class="w-64 p-1.5">
              <div class="rounded-md bg-muted/60 px-2.5 py-2">
                <div class="truncate text-sm font-semibold">{{ displayName }}</div>
                <div class="mt-0.5 truncate text-xs text-muted-foreground">{{ userEmail }}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel class="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Colour mode</DropdownMenuLabel>
              <DropdownMenuRadioGroup :model-value="themePreference" aria-label="Colour mode" @update:model-value="setThemePreference">
                <DropdownMenuRadioItem value="system"><Monitor class="mr-2 h-4 w-4" /> System <span class="ml-auto text-xs text-muted-foreground">Device</span></DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light"><Sun class="mr-2 h-4 w-4" /> Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark"><Moon class="mr-2 h-4 w-4" /> Dark</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="navigateTo('/admin/settings')"><Settings class="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/branding')"><Palette class="mr-2 h-4 w-4" /> Branding &amp; Social</DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/media')"><Image class="mr-2 h-4 w-4" /> Media Library</DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/email')"><Mail class="mr-2 h-4 w-4" /> Email Settings</DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/lead-sources')"><MailPlus class="mr-2 h-4 w-4" /> Lead Sources</DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/admin/settings/routing')"><GitBranch class="mr-2 h-4 w-4" /> Routing rules</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout"><LogOut class="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    <main
      class="mx-auto w-full px-4 py-5 tabular-nums sm:px-6 sm:py-8 lg:px-8"
      :class="route.path === '/admin/marketing-report' ? 'max-w-[1600px]' : 'max-w-[1244px]'"
    >
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  ChartNoAxesCombined,
  ChevronDown,
  FileText,
  GitBranch,
  Image,
  Inbox,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  MailPlus,
  Menu,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-vue-next';
import NotificationBell from '~/components/admin/NotificationBell.vue';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Separator } from '~/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import {
  ADMIN_THEME_STORAGE_KEY,
  normalizeAdminThemePreference,
  resolveAdminTheme,
  type AdminThemePreference,
} from '~/utils/adminTheme';

const route = useRoute();
useHead({ htmlAttrs: { 'data-admin-theme': 'true' } });

const { siteName } = useSiteIdentity();
const mobileNavOpen = ref(false);
const themePreference = ref<AdminThemePreference>('system');
const userState = useState<any>('auth-user', () => null);
let systemThemeQuery: MediaQueryList | null = null;
let rootThemeBeforeAdmin: string | null = null;
let rootWasDarkBeforeAdmin = false;
let rootColourSchemeBeforeAdmin = '';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Enquiries', href: '/admin/enquiries', icon: Inbox },
  { label: 'Marketing', href: '/admin/marketing-report', icon: ChartNoAxesCombined },
  { label: 'Customers', href: '/admin/customers', icon: UserCheck },
  { label: 'Tasks', href: '/admin/tasks', icon: ListTodo },
  { label: 'Service', href: '/admin/service', icon: Wrench },
  { label: 'Forms', href: '/admin/forms', icon: FileText },
  { label: 'Media', href: '/admin/media', icon: Image },
  { label: 'Staff', href: '/admin/staff', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

useAdminRealtime();

const isActive = (path: string) => path === '/admin' ? route.path === path : route.path.startsWith(path);
const currentSectionLabel = computed(() => [...navItems]
  .sort((a, b) => b.href.length - a.href.length)
  .find(link => isActive(link.href))?.label || 'Admin Console');

const displayName = computed(() => {
  const firstName = String(userState.value?.firstName || '').trim();
  const lastName = String(userState.value?.lastName || '').trim();
  return [firstName, lastName].filter(Boolean).join(' ') || 'Admin';
});
const userInitials = computed(() => {
  const nameInitials = `${String(userState.value?.firstName || '').charAt(0)}${String(userState.value?.lastName || '').charAt(0)}`.toUpperCase();
  return nameInitials.trim() || String(userState.value?.email || '').charAt(0).toUpperCase() || 'AD';
});
const userEmail = computed(() => userState.value?.email || 'admin@hyundai-dealer.com.au');
const userRoleLabel = computed(() => String(userState.value?.role || 'dealer_admin').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()));
const avatarAlt = computed(() => `${displayName.value} avatar`);

const applyThemePreference = () => {
  if (!import.meta.client) return;
  const resolvedTheme = resolveAdminTheme(
    themePreference.value,
    systemThemeQuery?.matches ?? window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const root = document.documentElement;
  root.dataset.theme = themePreference.value;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.style.colorScheme = resolvedTheme;
};

const setThemePreference = (value: unknown) => {
  themePreference.value = normalizeAdminThemePreference(value);
  try {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, themePreference.value);
  } catch {
    // The in-memory preference still applies when storage is unavailable.
  }
  applyThemePreference();
};

const handleSystemThemeChange = () => {
  if (themePreference.value === 'system') applyThemePreference();
};

const fetchUser = async () => {
  try {
    const response = await $fetch<{ user?: unknown }>('/api/auth/me');
    if (response.user) userState.value = response.user;
  } catch (error) {
    console.error('Failed to get user:', error);
  }
};

onMounted(() => {
  const root = document.documentElement;
  rootThemeBeforeAdmin = root.getAttribute('data-theme');
  rootWasDarkBeforeAdmin = root.classList.contains('dark');
  rootColourSchemeBeforeAdmin = root.style.colorScheme;
  systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  try {
    themePreference.value = normalizeAdminThemePreference(window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY));
  } catch {
    themePreference.value = 'system';
  }
  applyThemePreference();
  systemThemeQuery.addEventListener('change', handleSystemThemeChange);
  fetchUser();
});

onBeforeUnmount(() => {
  systemThemeQuery?.removeEventListener('change', handleSystemThemeChange);
  const root = document.documentElement;
  if (rootThemeBeforeAdmin === null) delete root.dataset.theme;
  else root.dataset.theme = rootThemeBeforeAdmin;
  root.classList.toggle('dark', rootWasDarkBeforeAdmin);
  root.style.colorScheme = rootColourSchemeBeforeAdmin;
});

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' });
    await navigateTo('/admin/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>
