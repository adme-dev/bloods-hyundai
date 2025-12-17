<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-block">
          <NuxtImg
            src="/assets/logos/logo-black-sm.svg"
            alt="Sale Hyundai"
            class="h-12 mx-auto"
            width="120"
            height="48"
          />
        </NuxtLink>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          Customer Portal
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Sign in to view your service history and manage appointments
        </p>
      </div>

      <!-- Login Form -->
      <Card>
        <CardContent class="pt-6">
          <Tabs v-model="activeTab" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>

            <!-- Login Tab -->
            <TabsContent value="login" class="mt-6">
              <form @submit.prevent="handleLogin" class="space-y-4">
                <div class="space-y-2">
                  <Label for="login-email">Email</Label>
                  <Input
                    id="login-email"
                    v-model="loginForm.email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div class="space-y-2">
                  <Label for="login-password">Password</Label>
                  <Input
                    id="login-password"
                    v-model="loginForm.password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div class="flex items-center justify-between">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" class="rounded border-gray-300" />
                    Remember me
                  </label>
                  <NuxtLink to="/portal/forgot-password" class="text-sm text-primary hover:underline">
                    Forgot password?
                  </NuxtLink>
                </div>

                <Button type="submit" class="w-full" :disabled="isLoading">
                  <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <!-- Register Tab -->
            <TabsContent value="register" class="mt-6">
              <form @submit.prevent="handleRegister" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label for="register-first-name">First Name</Label>
                    <Input
                      id="register-first-name"
                      v-model="registerForm.firstName"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="register-last-name">Last Name</Label>
                    <Input
                      id="register-last-name"
                      v-model="registerForm.lastName"
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="register-email">Email</Label>
                  <Input
                    id="register-email"
                    v-model="registerForm.email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div class="space-y-2">
                  <Label for="register-phone">Phone</Label>
                  <Input
                    id="register-phone"
                    v-model="registerForm.phone"
                    type="tel"
                    placeholder="0400 000 000"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="register-password">Password</Label>
                  <Input
                    id="register-password"
                    v-model="registerForm.password"
                    type="password"
                    placeholder="Min 8 characters"
                    required
                  />
                </div>

                <div class="space-y-2">
                  <Label for="register-confirm">Confirm Password</Label>
                  <Input
                    id="register-confirm"
                    v-model="registerForm.confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <p class="text-xs text-gray-500">
                  By creating an account, you agree to our
                  <NuxtLink to="/privacy-policy" class="text-primary hover:underline">Privacy Policy</NuxtLink>
                  and
                  <NuxtLink to="/terms" class="text-primary hover:underline">Terms of Service</NuxtLink>.
                </p>

                <Button type="submit" class="w-full" :disabled="isLoading">
                  <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <!-- Error Message -->
          <Alert v-if="error" variant="destructive" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <!-- Back to website -->
      <p class="text-center text-sm text-gray-600">
        <NuxtLink to="/" class="text-primary hover:underline flex items-center justify-center gap-1">
          <ArrowLeft class="h-4 w-4" />
          Back to website
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-vue-next'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Alert, AlertDescription } from '~/components/ui/alert'

definePageMeta({
  layout: false,
})

const activeTab = ref('login')
const isLoading = ref(false)
const error = ref('')

const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''

  try {
    await $fetch('/api/customer/auth/login', {
      method: 'POST',
      body: {
        email: loginForm.email,
        password: loginForm.password,
      },
    })
    navigateTo('/portal')
  } catch (e: any) {
    error.value = e.data?.message || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  if (registerForm.password !== registerForm.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (registerForm.password.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await $fetch('/api/customer/auth/register', {
      method: 'POST',
      body: {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      },
    })
    navigateTo('/portal')
  } catch (e: any) {
    error.value = e.data?.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
