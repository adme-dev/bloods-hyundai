<template>
  <div class="admin-layout min-h-screen" data-layout="admin">
    <!-- Top Navigation -->
    <header class="admin-topbar">
      <div class="admin-topbar__inner">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <!-- Mobile Nav -->
          <Sheet v-model:open="mobileNavOpen">
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon" class="admin-menu-trigger xl:hidden">
                <Menu class="h-5 w-5" />
                <span class="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-64 p-0">
              <SheetHeader class="border-b px-6 py-4 text-left">
                <SheetTitle class="text-lg font-semibold">{{ siteName }} Admin</SheetTitle>
                <SheetDescription class="sr-only">Navigate between admin tools.</SheetDescription>
                <div class="admin-mobile-profile">
                  <Avatar class="h-9 w-9 border border-border bg-primary/10 text-primary">
                    <AvatarImage v-if="userState?.avatarUrl" :src="userState.avatarUrl" :alt="avatarAlt" />
                    <AvatarFallback class="text-xs font-semibold">{{ userInitials }}</AvatarFallback>
                  </Avatar>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-foreground">{{ displayName }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ userRoleLabel }}</p>
                  </div>
                </div>
              </SheetHeader>
              <nav class="admin-mobile-nav space-y-1 px-4 py-4">
                <SheetClose
                  v-for="link in navItems"
                  :key="link.href"
                  as-child
                >
                  <NuxtLink
                    :to="link.href"
                    class="admin-mobile-nav__link"
                    :class="{ 'is-active': isActive(link.href) }"
                    :aria-current="isActive(link.href) ? 'page' : undefined"
                  >
                    <component :is="link.icon" class="mr-2 h-4 w-4" />
                    {{ link.label }}
                  </NuxtLink>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>

          <div class="admin-mobile-user sm:hidden" aria-label="Signed-in user">
            <span class="truncate">{{ displayName }}</span>
            <small class="truncate">{{ currentSectionLabel }}</small>
          </div>

          <div class="admin-brand hidden sm:flex">
            <span class="admin-brand__mark" aria-hidden="true">BH</span>
            <div class="min-w-0">
            <p class="admin-brand__name">{{ siteName }}</p>
            <div class="admin-brand__context">
              <span>Admin Console</span>
              <span class="hidden lg:inline">/</span>
              <span class="hidden lg:inline">{{ currentSectionLabel }}</span>
            </div>
            </div>
          </div>

          <Separator orientation="vertical" class="hidden h-8 xl:block" />

          <nav class="admin-primary-nav hidden min-w-0 items-center xl:flex" aria-label="Admin navigation">
            <NuxtLink
              v-for="link in navItems"
              :key="link.href"
              :to="link.href"
              class="admin-primary-nav__link"
              :class="{ 'is-active': isActive(link.href) }"
              :aria-current="isActive(link.href) ? 'page' : undefined"
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
                class="admin-account h-10 px-2.5 text-left"
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
    <main
      class="admin-content mx-auto px-4 py-8 sm:px-6 lg:px-8"
      :class="{ 'admin-content--marketing': route.path === '/admin/marketing-report' }"
    >
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
  SheetClose,
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
const mobileNavOpen = ref(false);

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

<style>
.admin-layout {
  --admin-ground: #eaeef3;
  --admin-surface: #fff;
  --admin-surface-2: #f5f8fb;
  --admin-ink: #0b1a2b;
  --admin-ink-2: #39506a;
  --admin-muted: #6b7d90;
  --admin-line: #dfe6ee;
  --admin-line-2: #edf1f5;
  --admin-brand: #001e50;
  --admin-accent: #0091b8;
  --admin-shadow: 0 1px 2px rgb(11 26 43 / 5%), 0 8px 24px -14px rgb(11 26 43 / 18%);
  background: var(--admin-ground);
  color: var(--admin-ink);
}

.admin-topbar {
  position: sticky;
  z-index: 30;
  top: 0;
  border-bottom: 1px solid var(--admin-line);
  background: color-mix(in srgb, var(--admin-surface) 96%, transparent);
  box-shadow: 0 1px 3px rgb(11 26 43 / 4%);
  backdrop-filter: blur(10px);
}

.admin-topbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 1600px;
  height: 64px;
  margin-inline: auto;
  padding-inline: 24px;
}

.admin-brand {
  align-items: center;
  flex: 0 0 auto;
  gap: 10px;
  min-width: 190px;
}

.admin-brand__mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 9px;
  background: var(--admin-brand);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .06em;
}

.admin-brand__name {
  overflow: hidden;
  margin: 0;
  color: var(--admin-ink);
  font-size: 13px;
  font-weight: 750;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-brand__context {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 10.5px;
  line-height: 1;
  white-space: nowrap;
}

.admin-primary-nav {
  gap: 2px;
}

.admin-primary-nav__link {
  position: relative;
  border-radius: 7px;
  padding: 8px 9px;
  color: var(--admin-muted);
  font-size: 12px;
  font-weight: 650;
  line-height: 1;
  transition: background-color .15s ease, color .15s ease;
  white-space: nowrap;
}

.admin-primary-nav__link:hover {
  background: var(--admin-surface-2);
  color: var(--admin-ink);
}

.admin-primary-nav__link.is-active {
  background: var(--admin-brand);
  color: #fff !important;
  box-shadow: 0 1px 3px rgb(0 30 80 / 18%);
}

.admin-header-controls {
  gap: 0;
  border: 1px solid var(--admin-line);
  border-radius: 11px;
  padding: 3px;
  background: var(--admin-surface);
  box-shadow: 0 2px 8px rgb(11 26 43 / 7%);
}

.admin-header-controls::before {
  order: 1;
  width: 1px;
  height: 24px;
  margin-inline: 3px;
  background: var(--admin-line);
  content: "";
}

.admin-header-controls > :first-child {
  order: 0;
}

.admin-header-controls > :last-child {
  order: 2;
}

.admin-notification-trigger {
  border: 0 !important;
  border-radius: 8px !important;
  background: transparent !important;
  box-shadow: none !important;
}

.admin-notification-trigger:hover,
.admin-notification-trigger[data-state="open"] {
  background: var(--admin-surface-2) !important;
}

.admin-account {
  border: 0;
  border-radius: 8px;
  background: transparent;
  box-shadow: none;
}

.admin-account:hover,
.admin-account[data-state="open"] {
  background: var(--admin-surface-2);
}

.admin-menu-trigger {
  border: 1px solid var(--admin-line);
  background: var(--admin-surface);
}

.admin-mobile-user {
  display: flex;
  min-width: 0;
  max-width: 9rem;
  flex-direction: column;
  line-height: 1.1;
}

.admin-mobile-user > span {
  color: var(--admin-ink);
  font-size: 12.5px;
  font-weight: 750;
}

.admin-mobile-user > small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 10.5px;
}

.admin-mobile-profile {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  border-radius: 10px;
  padding: 10px;
  background: var(--admin-surface-2, #f5f8fb);
}

.admin-mobile-profile p {
  margin: 0;
}

.admin-mobile-nav__link {
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--admin-muted, #6b7d90);
  font-size: 13px;
  font-weight: 650;
  transition: background-color .15s ease, color .15s ease;
}

.admin-mobile-nav__link:hover {
  background: var(--admin-surface-2, #f5f8fb);
  color: var(--admin-ink, #0b1a2b);
}

.admin-mobile-nav__link.is-active {
  background: var(--admin-brand, #001e50);
  color: #fff;
}

.admin-content {
  width: 100%;
  max-width: 1244px;
  font-variant-numeric: tabular-nums;
}

.admin-content:not(.admin-content--marketing) > :first-child {
  color: var(--admin-ink);
}

.admin-content:not(.admin-content--marketing) > .space-y-6 {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.admin-content:not(.admin-content--marketing) > .space-y-6 > * + * {
  margin-top: 0;
}

.admin-content:not(.admin-content--marketing) h2,
.admin-content:not(.admin-content--marketing) h3 {
  color: var(--admin-ink);
  letter-spacing: -.01em;
}

.admin-content:not(.admin-content--marketing) .text-muted-foreground {
  color: var(--admin-muted);
}

.admin-content:not(.admin-content--marketing) [data-slot="card"] {
  border-color: var(--admin-line);
  border-radius: 14px;
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow);
}

.admin-content:not(.admin-content--marketing) [data-slot="tabs-list"] {
  height: auto;
  gap: 3px;
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  padding: 4px;
  background: var(--admin-surface-2);
}

.admin-content:not(.admin-content--marketing) [data-slot="tabs-trigger"] {
  min-height: 36px;
  border-radius: 7px;
  color: var(--admin-muted);
  font-size: 12px;
  font-weight: 650;
}

.admin-content:not(.admin-content--marketing) [data-slot="tabs-trigger"][data-state="active"] {
  background: var(--admin-brand);
  color: #fff;
  box-shadow: 0 1px 3px rgb(11 26 43 / 14%);
}

.admin-content:not(.admin-content--marketing) [data-slot="table"] {
  width: 100%;
  font-size: 12.5px;
}

.admin-content:not(.admin-content--marketing) .overflow-x-auto {
  overscroll-behavior-inline: contain;
}

.admin-content:not(.admin-content--marketing) [data-slot="table-header"] [data-slot="table-row"] {
  border-color: var(--admin-line);
  background: var(--admin-surface-2);
}

.admin-content:not(.admin-content--marketing) [data-slot="table-head"] {
  color: var(--admin-muted);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .03em;
  text-transform: uppercase;
  white-space: nowrap;
}

.admin-content:not(.admin-content--marketing) [data-slot="table-body"] [data-slot="table-row"] {
  border-color: var(--admin-line-2);
}

.admin-content:not(.admin-content--marketing) [data-slot="input"],
.admin-content:not(.admin-content--marketing) [data-slot="textarea"],
.admin-content:not(.admin-content--marketing) [data-slot="select-trigger"] {
  border-color: var(--admin-line);
}

.admin-content:not(.admin-content--marketing) :focus-visible {
  outline: 2px solid var(--admin-accent);
  outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
  .admin-layout {
    --admin-ground: #080f18;
    --admin-surface: #101b28;
    --admin-surface-2: #152232;
    --admin-ink: #e7eef6;
    --admin-ink-2: #aebdce;
    --admin-muted: #7c8ea0;
    --admin-line: #213042;
    --admin-line-2: #192738;
    --admin-brand: #4d88cc;
    --admin-accent: #37c4e6;
    --admin-shadow: 0 1px 2px rgb(0 0 0 / 22%), 0 8px 24px -14px rgb(0 0 0 / 65%);
  }
}

.dark .admin-layout {
  --admin-ground: #080f18;
  --admin-surface: #101b28;
  --admin-surface-2: #152232;
  --admin-ink: #e7eef6;
  --admin-ink-2: #aebdce;
  --admin-muted: #7c8ea0;
  --admin-line: #213042;
  --admin-line-2: #192738;
  --admin-brand: #4d88cc;
  --admin-accent: #37c4e6;
}

@media (max-width: 700px) {
  .admin-topbar__inner {
    height: 58px;
    padding-inline: 16px;
  }

  .admin-content {
    padding: 20px 16px 48px;
  }

  .admin-content:not(.admin-content--marketing) [data-slot="tabs-list"] {
    overflow-x: auto;
  }

  .admin-content:not(.admin-content--marketing) [data-slot="tabs-trigger"] {
    flex: 0 0 auto;
  }
}

@media (min-width: 1280px) and (max-width: 1450px) {
  .admin-brand {
    min-width: auto;
  }

  .admin-brand__context {
    display: none;
  }

  .admin-primary-nav__link {
    padding-inline: 7px;
    font-size: 11.5px;
  }
}
</style>
