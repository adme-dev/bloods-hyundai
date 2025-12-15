<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm text-muted-foreground">Manage dealer profile &amp; security</p>
      <h1 class="text-3xl font-semibold tracking-tight">Settings</h1>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Error loading settings</AlertTitle>
      <AlertDescription>
        {{ error.message || 'Failed to load dealer settings. Please try again.' }}
        <Button variant="outline" size="sm" class="mt-2" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Retry
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Content -->
    <template v-else>
    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Dealer information</CardTitle>
          <CardDescription>Core business details visible across your applications</CardDescription>
        </CardHeader>
        <CardContent>
          <dl class="grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted-foreground">Dealer Name</dt>
              <dd class="text-base font-medium">{{ dealer?.name || 'Loading...' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Slug</dt>
              <dd class="text-base font-medium">{{ dealer?.slug || 'Loading...' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Email</dt>
              <dd class="text-base font-medium">{{ dealer?.email || 'N/A' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Phone</dt>
              <dd class="text-base font-medium">{{ dealer?.phone || 'N/A' }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm text-muted-foreground">Address</dt>
              <dd class="text-base font-medium">
                {{ dealer?.address || 'N/A' }}<br v-if="dealer?.suburb" />
                {{ dealer?.suburb }}<span v-if="dealer?.state">, {{ dealer.state }}</span> {{ dealer?.postcode }}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account status</CardTitle>
          <CardDescription>Subscription and operational state</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <dt class="text-sm text-muted-foreground">Subscription tier</dt>
            <dd class="text-base font-semibold capitalize">
              {{ dealer?.subscriptionTier || 'standard' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted-foreground">Status</dt>
            <dd class="mt-2">
              <Badge :variant="dealer?.isActive ? 'default' : 'destructive'">
                {{ dealer?.isActive ? 'Active' : 'Inactive' }}
              </Badge>
            </dd>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Links -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink to="/admin/settings/branding" class="group">
        <Card class="h-full transition-shadow hover:shadow-md">
          <CardContent class="flex items-center gap-4 p-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
              <Palette class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold">Branding & Social</h3>
              <p class="text-sm text-muted-foreground">Logo, colors & social media</p>
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
      <NuxtLink to="/admin/settings/email" class="group">
        <Card class="h-full transition-shadow hover:shadow-md">
          <CardContent class="flex items-center gap-4 p-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
              <Mail class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold">Email Settings</h3>
              <p class="text-sm text-muted-foreground">Verified senders & domains</p>
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
      <NuxtLink to="/admin/settings/routing" class="group">
        <Card class="h-full transition-shadow hover:shadow-md">
          <CardContent class="flex items-center gap-4 p-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
              <GitBranch class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold">Routing Rules</h3>
              <p class="text-sm text-muted-foreground">Enquiry assignment rules</p>
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>API configuration</CardTitle>
        <CardDescription>Credentials and endpoints for dealer website integrations</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="space-y-2">
          <Label>API Key</Label>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              :type="showApiKey ? 'text' : 'password'"
              :value="dealer?.apiKey || ''"
              readonly
              class="sm:flex-1"
            />
            <div class="flex gap-2">
              <Button variant="outline" size="icon" @click="showApiKey = !showApiKey">
                <component :is="showApiKey ? EyeOff : Eye" class="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" @click="copyApiKey" :disabled="!dealer?.apiKey">
                <Copy class="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            Use this key when sending enquiries from embedded website forms.
          </p>
        </div>

        <div class="space-y-2">
          <Label>Enquiry endpoint</Label>
          <ClientOnly>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input :value="enquiryEndpoint" readonly class="sm:flex-1" />
              <Button variant="outline" size="sm" @click="copyEndpoint">
                <Copy class="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
            <template #fallback>
              <Input value="Loading..." readonly />
            </template>
          </ClientOnly>
        </div>
      </CardContent>
    </Card>

    <Card class="border-destructive/50">
      <CardHeader>
        <CardTitle class="text-destructive">Security</CardTitle>
        <CardDescription>Reset your admin password to keep accounts protected</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" @click="showPasswordModal = true">
          <KeyRound class="mr-2 h-4 w-4" /> Change password
        </Button>
      </CardContent>
    </Card>

    <Dialog :open="showPasswordModal" @update:open="showPasswordModal = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Choose a strong password to secure your admin account.</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="changePassword" class="space-y-4">
          <div class="space-y-2">
            <Label>Current password</Label>
            <Input v-model="passwordForm.current" type="password" required />
          </div>
          <div class="space-y-2">
            <Label>New password</Label>
            <Input v-model="passwordForm.new" type="password" required minlength="8" />
          </div>
          <div class="space-y-2">
            <Label>Confirm new password</Label>
            <Input v-model="passwordForm.confirm" type="password" required minlength="8" />
          </div>
          <Alert v-if="passwordError" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ passwordError }}</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showPasswordModal = false">Cancel</Button>
            <Button type="submit" :disabled="changingPassword">
              {{ changingPassword ? 'Changing...' : 'Change Password' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { Copy, Eye, EyeOff, KeyRound, Loader2, AlertCircle, RefreshCw, Palette, Mail, GitBranch } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const { data, pending, error, refresh } = await useFetch('/api/admin/settings');
const dealer = computed(() => data.value?.dealer);

const showApiKey = ref(false);
const showPasswordModal = ref(false);
const changingPassword = ref(false);
const passwordError = ref('');
const passwordForm = ref({
  current: '',
  new: '',
  confirm: '',
});

const enquiryEndpoint = ref('/api/enquiry');
onMounted(() => {
  enquiryEndpoint.value = `${window.location.origin}/api/enquiry`;
});

const copyText = async (value: string) => {
  if (!value || typeof navigator === 'undefined') return;
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    console.error('Clipboard copy failed', err);
  }
};

const copyApiKey = async () => {
  if (dealer.value?.apiKey) {
    await copyText(dealer.value.apiKey);
  }
};

const copyEndpoint = async () => {
  await copyText(enquiryEndpoint.value);
};

const changePassword = async () => {
  passwordError.value = '';
  
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    passwordError.value = 'New passwords do not match';
    return;
  }
  
  changingPassword.value = true;
  try {
    await $fetch('/api/admin/settings/password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.value.current,
        newPassword: passwordForm.value.new,
      },
    });
    
    showPasswordModal.value = false;
    passwordForm.value = { current: '', new: '', confirm: '' };
  } catch (err: any) {
    passwordError.value = err.data?.message || 'Failed to change password';
  } finally {
    changingPassword.value = false;
  }
};
</script>
