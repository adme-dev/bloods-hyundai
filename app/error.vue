<template>
  <div class="error-page">
    <main class="error-content">
      <!-- Error Code -->
      <p class="error-code">{{ error.statusCode || 500 }}</p>
      
      <!-- Heading -->
      <h1 class="error-heading">
        {{ is404 ? 'Page not found' : 'Something went wrong' }}
      </h1>
      
      <!-- Description -->
      <p class="error-description">
        {{ is404 
          ? "Sorry, we couldn't find the page you're looking for." 
          : "An unexpected error occurred. Please try again later." 
        }}
      </p>
      
      <!-- Action Buttons -->
      <div class="error-actions">
        <NuxtLink to="/" class="btn-primary">
          Go back home
        </NuxtLink>
        <NuxtLink to="/contact" class="btn-secondary">
          Contact support <span aria-hidden="true">&rarr;</span>
        </NuxtLink>
      </div>

      <!-- Quick Links for 404 -->
      <div v-if="is404" class="quick-links">
        <h2 class="quick-links-title">Popular pages</h2>
        <ul class="quick-links-list">
          <li>
            <NuxtLink to="/car-sales" class="quick-link">
              <span class="quick-link-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </span>
              <span class="quick-link-content">
                <span class="quick-link-name">Browse Vehicles</span>
                <span class="quick-link-desc">Explore our full range of new and used cars</span>
              </span>
              <span class="quick-link-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/sell-my-car" class="quick-link">
              <span class="quick-link-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              <span class="quick-link-content">
                <span class="quick-link-name">Sell Your Car</span>
                <span class="quick-link-desc">Get a free valuation for your vehicle</span>
              </span>
              <span class="quick-link-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/service" class="quick-link">
              <span class="quick-link-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
                </svg>
              </span>
              <span class="quick-link-content">
                <span class="quick-link-name">Book a Service</span>
                <span class="quick-link-desc">Schedule your next vehicle service</span>
              </span>
              <span class="quick-link-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Retry button for non-404 errors -->
      <div v-if="!is404" class="retry-section">
        <button @click="handleRetry" class="btn-retry">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="retry-icon">
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
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
  padding: 3rem 1.5rem;
}

.error-content {
  max-width: 32rem;
  text-align: center;
}

.error-code {
  font-size: 0.875rem;
  font-weight: 600;
  color: #002c5f; // Hyundai blue
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.error-heading {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
}

.error-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.75;
  margin: 0 0 2.5rem 0;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  
  @media (min-width: 640px) {
    flex-direction: row;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #002c5f;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: #00407a;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #002c5f;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: #00407a;
  }
}

.quick-links {
  margin-top: 4rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 2.5rem;
  text-align: center;
}

.quick-links-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.quick-links-list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 24rem;
  
  li {
    border-bottom: 1px solid #e5e7eb;
    
    &:first-child {
      border-top: 1px solid #e5e7eb;
    }
  }
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    .quick-link-name {
      color: #002c5f;
    }
    
    .quick-link-arrow {
      transform: translateX(4px);
    }
  }
}

.quick-link-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  color: #002c5f;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.quick-link-content {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.quick-link-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  transition: color 0.2s ease;
}

.quick-link-desc {
  font-size: 0.75rem;
  color: #6b7280;
}

.quick-link-arrow {
  flex-shrink: 0;
  color: #9ca3af;
  transition: transform 0.2s ease;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.retry-section {
  margin-top: 2rem;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
  
  .retry-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.dev-details {
  margin-top: 3rem;
  text-align: left;
  
  details {
    background-color: #1f2937;
    border-radius: 0.75rem;
    overflow: hidden;
    
    summary {
      padding: 1rem 1.25rem;
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
      padding: 1.25rem;
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








