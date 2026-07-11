<template>
  <main class="admin-login">
    <section class="admin-login__intro" aria-labelledby="login-product-title">
      <div class="admin-login__brand"><span>BH</span>{{ siteName }}</div>
      <div>
        <p class="admin-login__eyebrow">Dealer operations</p>
        <h1 id="login-product-title">One workspace for every customer conversation.</h1>
        <p>Manage enquiries, follow-ups, customer activity and dealership operations from the secure admin console.</p>
      </div>
      <p class="admin-login__foot">Authorised staff access only</p>
    </section>

    <section class="admin-login__form-wrap" aria-labelledby="login-title">
      <Card class="admin-login__card">
        <CardHeader>
          <div class="admin-login__mobile-brand"><span>BH</span>{{ siteName }}</div>
          <CardTitle id="login-title">Welcome back</CardTitle>
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

<style scoped>
.admin-login { display: grid; min-height: 100vh; background: #eaeef3; color: #0b1a2b; }
.admin-login__intro { display: none; }
.admin-login__form-wrap { display: grid; min-width: 0; place-items: center; padding: 24px; }
.admin-login__card { width: min(430px, calc(100vw - 48px)); min-width: 0; border-color: #dfe6ee; background: #fff; box-shadow: 0 18px 50px -28px rgb(11 26 43 / 35%); }
.admin-login__card :deep([data-slot="input"]), .admin-login__card :deep([data-slot="button"]) { box-sizing: border-box; max-width: 100%; }
.admin-login__card :deep([data-slot="card-title"]) { font-size: 25px; color: #0b1a2b; }
.admin-login__mobile-brand, .admin-login__brand { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 750; }
.admin-login__mobile-brand { margin-bottom: 22px; }
.admin-login__mobile-brand span, .admin-login__brand span { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 9px; background: #001e50; color: #fff; font-size: 11px; letter-spacing: .06em; }
@media (min-width: 900px) {
  .admin-login { grid-template-columns: minmax(360px, .9fr) minmax(480px, 1.1fr); }
  .admin-login__intro { display: flex; flex-direction: column; justify-content: space-between; padding: 48px; background: #001e50; color: #fff; }
  .admin-login__intro h1 { max-width: 560px; margin: 10px 0 16px; font-size: clamp(36px, 4vw, 58px); line-height: 1.02; letter-spacing: -.04em; }
  .admin-login__intro p { max-width: 520px; color: #b9c9df; line-height: 1.6; }
  .admin-login__eyebrow { margin: 0; color: #6ed2ea !important; font-size: 11px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
  .admin-login__brand span { background: #fff; color: #001e50; }
  .admin-login__foot { margin: 0; font-size: 12px; }
  .admin-login__mobile-brand { display: none; }
}
</style>





