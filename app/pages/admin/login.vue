<template>
  <main class="grid min-h-screen bg-background text-foreground min-[900px]:grid-cols-[minmax(360px,.9fr)_minmax(480px,1.1fr)]">
    <section class="hidden flex-col justify-between border-r bg-card p-12 text-card-foreground min-[900px]:flex" aria-labelledby="login-product-title">
      <div class="flex items-center gap-2.5 text-[13px] font-bold">
        <span class="grid size-9 place-items-center rounded-lg bg-foreground text-[11px] tracking-[.06em] text-background">BH</span>{{ siteName }}
      </div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Dealer operations</p>
        <h1 id="login-product-title" class="my-4 max-w-[560px] text-balance text-[clamp(36px,4vw,58px)] font-bold leading-[1.02] tracking-[-.04em]">One workspace for every customer conversation.</h1>
        <p class="max-w-[520px] leading-relaxed text-muted-foreground">Manage enquiries, follow-ups, customer activity and dealership operations from the secure admin console.</p>
      </div>
      <p class="text-xs text-muted-foreground">Authorised staff access only</p>
    </section>

    <section class="grid min-w-0 place-items-center p-6" aria-labelledby="login-title">
      <Card class="w-[min(430px,calc(100vw-48px))] min-w-0 shadow-xl">
        <CardHeader>
          <div class="mb-[22px] flex items-center gap-2.5 text-[13px] font-bold min-[900px]:hidden">
            <span class="grid size-9 place-items-center rounded-lg bg-foreground text-[11px] tracking-[.06em] text-background">BH</span>{{ siteName }}
          </div>
          <CardTitle id="login-title" class="text-[25px]">Welcome back</CardTitle>
          <CardDescription>Sign in to your dealership CRM workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-5" @submit.prevent="handleLogin">
            <Alert v-if="error" variant="destructive" role="alert">
              <CircleAlert class="h-4 w-4" />
              <AlertTitle>Unable to sign in</AlertTitle>
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <div class="space-y-2">
              <Label for="email">Email address</Label>
              <Input id="email" v-model="email" name="email" type="email" autocomplete="email" required placeholder="name@dealership.com.au" />
            </div>
            <div class="space-y-2">
              <Label for="password">Password</Label>
              <Input id="password" v-model="password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password" />
            </div>

            <Button type="submit" class="w-full" :disabled="loading">
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<script setup lang="ts">
import { CircleAlert, Loader2 } from 'lucide-vue-next';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

definePageMeta({
  layout: false,
});

useHead({
  htmlAttrs: {
    'data-admin-theme': 'true',
  },
});

const email = ref('');
const password = ref('');
const { siteName } = useSiteIdentity();
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
    });
    
    if (response.success) {
      // Redirect to admin dashboard
      await navigateTo('/admin');
    }
  } catch (err: any) {
    console.error('Login error:', err);
    error.value = err.data?.message || 'Invalid email or password';
  } finally {
    loading.value = false;
  }
};
</script>




