<template>
  <nav class="accessories-breadcrumb" aria-label="Breadcrumb">
    <div class="breadcrumb-container">
      <ol class="breadcrumb-list" itemscope itemtype="https://schema.org/BreadcrumbList">
        <!-- Home -->
        <li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <NuxtLink to="/" class="breadcrumb-link" itemprop="item">
            <svg class="home-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span itemprop="name" class="sr-only">Home</span>
          </NuxtLink>
          <meta itemprop="position" content="1" />
          <span class="breadcrumb-separator">/</span>
        </li>

        <!-- Accessories -->
        <li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <NuxtLink
            v-if="model"
            to="/accessories"
            class="breadcrumb-link"
            itemprop="item"
          >
            <span itemprop="name">Accessories</span>
          </NuxtLink>
          <span v-else class="breadcrumb-current" aria-current="page" itemprop="name">
            Accessories
          </span>
          <meta itemprop="position" content="2" />
          <span v-if="model" class="breadcrumb-separator">/</span>
        </li>

        <!-- Model (if present) -->
        <li
          v-if="model"
          class="breadcrumb-item breadcrumb-current"
          aria-current="page"
          itemprop="itemListElement"
          itemscope
          itemtype="https://schema.org/ListItem"
        >
          <span itemprop="name">{{ model }}</span>
          <meta itemprop="position" content="3" />
        </li>
      </ol>
    </div>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  model?: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.accessories-breadcrumb {
  background: white;
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
}

.breadcrumb-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 8px 16px;

  @media (min-width: 1024px) {
    padding: 8px 32px;
  }
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
  flex-wrap: wrap;
  gap: 2px 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: #002c5f;
  }
}

.home-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.breadcrumb-separator {
  margin: 0 6px;
  color: #d1d5db;
  user-select: none;
  font-size: 11px;
}

.breadcrumb-current {
  color: #374151;
  font-weight: 500;
}

@media (max-width: 640px) {
  .breadcrumb-list {
    font-size: 12px;
  }

  .breadcrumb-separator {
    margin: 0 4px;
  }
}
</style>
