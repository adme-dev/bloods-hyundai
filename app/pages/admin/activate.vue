<template>
  <main class="grid min-h-screen bg-background text-foreground min-[900px]:grid-cols-[minmax(360px,.9fr)_minmax(480px,1.1fr)]">
    <section class="hidden flex-col justify-between border-r bg-card p-12 text-card-foreground min-[900px]:flex" aria-labelledby="activation-product-title">
      <div class="flex items-center gap-2.5 text-[13px] font-bold">
        <span class="grid size-9 place-items-center rounded-lg bg-foreground text-[11px] tracking-[.06em] text-background">BH</span>{{ dealerName || siteName }}
      </div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Secure staff access</p>
        <h1 id="activation-product-title" class="my-4 max-w-[560px] text-balance text-[clamp(36px,4vw,58px)] font-bold leading-[1.02] tracking-[-.04em]">Join your dealership CRM workspace.</h1>
        <p class="max-w-[520px] leading-relaxed text-muted-foreground">Activate your account to manage enquiries, follow-ups, customer activity and dealership operations.</p>
      </div>
      <p class="text-xs text-muted-foreground">Invitation-only access</p>
    </section>

    <section class="grid min-w-0 place-items-center p-6" aria-labelledby="activation-title">
      <div class="w-[min(448px,calc(100vw-48px))] min-w-0">
        <div class="mb-[22px] flex items-center gap-2.5 text-[13px] font-bold min-[900px]:hidden">
          <span class="grid size-9 place-items-center rounded-lg bg-foreground text-[11px] tracking-[.06em] text-background">BH</span>{{ dealerName || siteName }}
        </div>

      <!-- Loading State -->
      <Card v-if="validating" class="text-center py-12">
        <CardContent>
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-muted-foreground">Validating your invitation...</p>
        </CardContent>
      </Card>

      <!-- Error State -->
      <Card v-else-if="tokenError" class="text-center" role="alert">
        <CardHeader>
          <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle class="h-6 w-6 text-red-600" />
          </div>
          <CardTitle id="activation-title">{{ errorTitle }}</CardTitle>
          <CardDescription>{{ tokenError }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button as="a" href="/admin/login" variant="outline" class="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>

      <!-- Activation Form -->
      <Card v-else-if="tokenValid">
        <CardHeader class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus class="h-6 w-6 text-primary" />
          </div>
          <CardTitle id="activation-title">Activate your account</CardTitle>
          <CardDescription>
            Welcome, {{ userData?.firstName }}! Set your password to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="activateAccount" class="space-y-4">
            <!-- Email (readonly) -->
            <div class="space-y-2">
              <Label for="activation-email">Email</Label>
              <Input 
                id="activation-email"
                :model-value="userData?.email" 
                type="email" 
                disabled 
                class="bg-muted"
              />
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <Label for="password">Password</Label>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your password"
                  required
                  minlength="8"
                  class="pr-10"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
              <p class="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <!-- Confirm Password -->
            <div class="space-y-2">
              <Label for="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Confirm your password"
                required
                minlength="8"
              />
              <p v-if="passwordMismatch" class="text-xs text-red-500">
                Passwords do not match
              </p>
            </div>

            <!-- Password Strength Indicator -->
            <div v-if="password" class="space-y-2">
              <div class="flex gap-1">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  class="h-1 flex-1 rounded-full"
                  :class="i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-muted'"
                />
              </div>
              <p class="text-xs" :class="strengthTextColors[passwordStrength]">
                {{ strengthLabels[passwordStrength] }}
              </p>
            </div>

            <!-- Submit Button -->
            <Button 
              type="submit" 
              class="w-full" 
              :disabled="activating || passwordMismatch || password.length < 8"
            >
              <template v-if="activating">
                <span class="animate-spin mr-2">⏳</span>
                Activating...
              </template>
              <template v-else>
                Activate Account
              </template>
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Success State -->
      <Card v-else-if="activated" class="text-center">
        <CardHeader>
          <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle class="h-6 w-6 text-green-600" />
          </div>
          <CardTitle id="activation-title">Account activated</CardTitle>
          <CardDescription>
            Your account is now ready. You can log in with your email and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button as="a" href="/admin/login" class="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { UserPlus, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

// No auth required for this page
definePageMeta({
  layout: false,
  auth: false,
});

useHead({
  htmlAttrs: {
    'data-admin-theme': 'true',
  },
});

const route = useRoute();
const { siteName } = useSiteIdentity();

// State
const validating = ref(true);
const tokenValid = ref(false);
const tokenError = ref('');
const errorTitle = ref('Invalid Link');
const userData = ref<{ email: string; firstName: string; lastName: string; role: string } | null>(null);
const dealerName = ref('');

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const activating = ref(false);
const activated = ref(false);

// Password validation
const passwordMismatch = computed(() => {
  return confirmPassword.value.length > 0 && password.value !== confirmPassword.value;
});

// Password strength calculation
const passwordStrength = computed(() => {
  const p = password.value;
  if (!p) return 0;
  
  let strength = 0;
  if (p.length >= 8) strength++;
  if (/[A-Z]/.test(p)) strength++;
  if (/[0-9]/.test(p)) strength++;
  if (/[^A-Za-z0-9]/.test(p)) strength++;
  
  return strength;
});

const strengthLabels: Record<number, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

const strengthColors: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
};

const strengthTextColors: Record<number, string> = {
  0: 'text-muted-foreground',
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-600',
  4: 'text-green-600',
};

// Validate token on mount
onMounted(async () => {
  const token = route.query.token as string;
  
  if (!token) {
    validating.value = false;
    tokenError.value = 'No activation token provided. Please use the link from your invitation email.';
    return;
  }

  try {
    const response = await $fetch<{
      valid: boolean;
      error?: string;
      message?: string;
      user?: { email: string; firstName: string; lastName: string; role: string };
      dealerName?: string;
    }>('/api/auth/validate-token', {
      params: { token },
    });

    if (response.valid) {
      tokenValid.value = true;
      userData.value = response.user || null;
      dealerName.value = response.dealerName || '';
    } else {
      tokenError.value = response.message || 'Invalid token';
      if (response.error === 'expired') {
        errorTitle.value = 'Link Expired';
      } else if (response.error === 'already_activated') {
        errorTitle.value = 'Already Activated';
      }
    }
  } catch (error: any) {
    console.error('Token validation error:', error);
    tokenError.value = 'Failed to validate your invitation. Please try again or contact support.';
  } finally {
    validating.value = false;
  }
});

// Activate account
const activateAccount = async () => {
  if (passwordMismatch.value || password.value.length < 8) return;

  const token = route.query.token as string;
  activating.value = true;

  try {
    await $fetch('/api/auth/activate', {
      method: 'POST',
      body: {
        token,
        password: password.value,
        confirmPassword: confirmPassword.value,
      },
    });

    activated.value = true;
    tokenValid.value = false;
  } catch (error: any) {
    console.error('Activation error:', error);
    tokenError.value = error.data?.message || 'Failed to activate account. Please try again.';
    tokenValid.value = false;
  } finally {
    activating.value = false;
  }
};
</script>



