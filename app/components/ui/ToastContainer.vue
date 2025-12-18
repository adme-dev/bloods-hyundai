<template>
  <Teleport to="body">
    <div class="fixed top-0 right-0 z-[9999] flex max-h-screen w-full flex-col-reverse gap-3 p-4 sm:right-0 sm:top-0 sm:flex-col sm:items-end md:max-w-[420px]">
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex w-full flex-col gap-3"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border-2 bg-white p-4 pr-10 shadow-lg transition-all hover:shadow-xl"
          :class="toastClasses(toast.type)"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 pt-0.5">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full"
              :class="iconBgClasses(toast.type)"
            >
              <svg
                v-if="toast.type === 'success'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <svg
                v-else-if="toast.type === 'error'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <svg
                v-else-if="toast.type === 'warning'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
              <svg
                v-else
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 space-y-0.5 pt-0.5">
            <p v-if="toast.title" class="text-sm font-semibold leading-tight text-slate-900">
              {{ toast.title }}
            </p>
            <p class="text-sm leading-snug text-slate-600" :class="{ 'font-medium text-slate-900': !toast.title }">
              {{ toast.description }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
            @click="removeToast(toast.id)"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, removeToast } = useToast();

const toastClasses = (type?: string) => {
  switch (type) {
    case 'success':
      return 'border-green-200';
    case 'error':
      return 'border-red-200';
    case 'warning':
      return 'border-amber-200';
    case 'info':
    default:
      return 'border-blue-200';
  }
};

const iconBgClasses = (type?: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-600';
    case 'error':
      return 'bg-red-100 text-red-600';
    case 'warning':
      return 'bg-amber-100 text-amber-600';
    case 'info':
    default:
      return 'bg-blue-100 text-blue-600';
  }
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>








