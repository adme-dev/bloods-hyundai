<template>
  <div class="error-page">
    <!-- Hero Section with Background Image -->
    <div class="error-hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <p class="error-code">{{ error.statusCode || 500 }}</p>
        <h1 class="error-heading">
          {{ is404 ? "You've hit a dead end." : 'Something went wrong' }}
        </h1>
        <p class="error-subheading">
          {{ is404 ? 'U-turn?' : 'Please try again later.' }}
        </p>
      </div>
    </div>

    <!-- Action Section -->
    <main class="error-actions-section">
      <div class="actions-container">
        <!-- Primary Actions -->
        <div class="primary-actions">
          <NuxtLink to="/" class="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="btn-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Go home
          </NuxtLink>
          <NuxtLink to="/contact" class="btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="btn-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            Customer care
          </NuxtLink>
        </div>

        <!-- Quick Links Grid -->
        <div v-if="is404" class="quick-links-grid">
          <NuxtLink to="/service" class="quick-link-card">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Book a Service</span>
              <span class="card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </div>
          </NuxtLink>

          <NuxtLink to="/test-drive" class="quick-link-card">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Test Drive</span>
              <span class="card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </div>
          </NuxtLink>

          <NuxtLink to="/models" class="quick-link-card">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Browse Models</span>
              <span class="card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </div>
          </NuxtLink>

          <NuxtLink to="/car-sales" class="quick-link-card">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">Special Offers</span>
              <span class="card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </div>
          </NuxtLink>
        </div>

        <!-- Retry button for non-404 errors -->
        <div v-if="!is404" class="retry-section">
          <button @click="handleRetry" class="btn-retry">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="btn-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try again
          </button>
        </div>

        <!-- Dev Error Details -->
        <div v-if="isDev && error.stack" class="dev-details">
          <details>
            <summary>Error Details (Development Only)</summary>
            <pre>{{ error.stack }}</pre>
          </details>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

interface Props {
  error: NuxtError;
}

const props = defineProps<Props>();

const is404 = computed(() => props.error.statusCode === 404);
const isDev = process.dev;

const handleRetry = () => {
  clearError({ redirect: '/' });
};

// Log error in development
if (process.dev) {
  console.error('Error page rendered:', props.error);
}
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

// Hero Section
.error-hero {
  position: relative;
  height: 50vh;
  min-height: 320px;
  max-height: 500px;
  background-image: url('https://hyundaioem.b-cdn.net/raw/corporate/hero-404.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 30, 80, 0.4) 0%,
    rgba(0, 30, 80, 0.6) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
  color: #ffffff;
}

.error-code {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.error-heading {
  font-family: 'Hyundai Sans Head', 'Hyundai Sans', sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem 0;
  line-height: 1.1;
}

.error-subheading {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 400;
  margin: 0;
  opacity: 0.9;
}

// Actions Section
.error-actions-section {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1.5rem;
  background-color: #ffffff;
}

.actions-container {
  width: 100%;
  max-width: 900px;
}

.primary-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 3rem;

  @media (min-width: 640px) {
    flex-direction: row;
    gap: 1.5rem;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #001E50;
  border-radius: 50px;
  text-decoration: none;
  transition: all 0.3s ease;
  min-width: 180px;

  &:hover {
    background-color: #00407a;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 30, 80, 0.3);
  }

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #001E50;
  background-color: transparent;
  border: 2px solid #001E50;
  border-radius: 50px;
  text-decoration: none;
  transition: all 0.3s ease;
  min-width: 180px;

  &:hover {
    background-color: #001E50;
    color: #ffffff;
    transform: translateY(-2px);
  }

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

// Quick Links Grid
.quick-links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
}

.quick-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background-color: #f9fafb;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: #001E50;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 30, 80, 0.2);

    .card-icon {
      background-color: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    .card-title {
      color: #ffffff;
    }

    .card-arrow {
      color: #00aad2;
      transform: translateX(4px);
    }
  }
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  background-color: #e5e7eb;
  border-radius: 50%;
  color: #001E50;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  text-align: center;
  transition: color 0.3s ease;
}

.card-arrow {
  color: #9ca3af;
  transition: all 0.3s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }
}

// Retry Section
.retry-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  background-color: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f9fafb;
    border-color: #001E50;
    color: #001E50;
  }

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

// Dev Details
.dev-details {
  margin-top: 3rem;

  details {
    background-color: #1f2937;
    border-radius: 12px;
    overflow: hidden;

    summary {
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #f9fafb;
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: #374151;
      }
    }

    pre {
      margin: 0;
      padding: 1.5rem;
      font-size: 0.75rem;
      color: #d1d5db;
      background-color: #111827;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow: auto;
    }
  }
}
</style>
