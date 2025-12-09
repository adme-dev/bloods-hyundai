<template>
  <div 
    ref="slider"
    class="hero-slider uk-margin-small-top uk-position-relative uk-overflow-hidden uk-visible-toggle" 
    tabindex="-1"
    uk-slider="finite: true; autoplay: true; autoplay-interval: 3500"
  >
    <div class="uk-position-relative uk-visible-toggle">
      <div class="uk-slider-items uk-grid uk-grid-small">
        <div 
          v-for="(slide, index) in homeSlides" 
          :key="index"
          class="uk-width-4-5@s"
          :data-index="index"
        >
          <div class="uk-panel">
            <!-- Overlay for inactive slides -->
            <a 
              href="#" 
              class="slide-overlay uk-position-cover"
              :uk-slider-item="index"
              aria-label="View this slide"
            ></a>

            <component
              v-if="slide.link"
              :is="linkComponent(slide.link)"
              class="uk-height-1-1 uk-width-1-1 uk-position-absolute uk-position-z-index slide-link"
              :to="!isLinkExternal(slide.link) ? slide.link : undefined"
              :href="isLinkExternal(slide.link) ? formatLink(slide.link) : undefined"
              :aria-label="slide.heading_content || formatSlideTitle(slide.link)"
              :target="isLinkExternal(slide.link) ? '_blank' : undefined"
              :rel="isLinkExternal(slide.link) ? 'noopener noreferrer' : undefined"
            ></component>

            <!-- Image slide -->
            <div v-if="slide.desktop">
              <picture>
                <source :srcset="`${slide.desktop}?width=1600`" media="(min-width: 960px)" />
                <source :srcset="`${slide.mobile}?width=566`" media="(max-width: 959px)" />
                <img 
                  :src="index === 0 ? `${slide.desktop}?width=1600` : `${slide.mobile}?width=566`"
                  class="uk-width-1-1 slide-image"
                  width="1800"
                  height="1200"
                  :alt="strippedHeadingContent(slide.heading_content)"
                  :loading="index === 0 ? 'eager' : 'lazy'"
                />
              </picture>

              <div v-if="slide.button_text" class="uk-position-bottom-left uk-width-medium uk-padding uk-text-left">
                <h2 
                  :class="slide.contrast"
                  class="uk-heading-small uk-margin-remove uk-text-normal"
                  uk-slider-parallax="x: 100,-100"
                  v-html="slide.heading_content"
                ></h2>
                <p 
                  :class="slide.contrast"
                  class="uk-heading-small uk-margin-small-top"
                  uk-slider-parallax="x: 200,-200"
                  v-html="slide.sub_heading"
                ></p>
                <div v-if="slide.button_text" class="uk-animation-fade">
                  <div class="uk-margin-small-top">
                    <NuxtLink 
                      v-if="slide.link"
                      :class="[slide.contrast, slide.button_colour]"
                      class="uk-button uk-text-bold uk-border-pill uk-margin-small-top uk-width-auto uk-padding-left"
                      uk-slider-parallax="x: 300,-300"
                      :to="slide.link"
                    >
                      {{ slide.button_text }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>

            <!-- Video slide -->
            <ClientOnly>
              <div v-if="slide.video" class="uk-height-1-1 uk-position-relative">
                <video 
                  :src="slide.video" 
                  loop 
                  muted 
                  playsinline 
                  uk-video="autoplay: inview"
                  :poster="slide.video_poster"
                  uk-cover
                ></video>

                <div class="uk-position-bottom-left uk-padding uk-width-medium uk-text-left">
                  <h2 
                    :class="slide.contrast"
                    class="uk-heading-small uk-margin-remove"
                    uk-slider-parallax="x: 100,-100"
                    v-html="slide.heading_content"
                  ></h2>
                  <p 
                    :class="slide.contrast"
                    class="uk-heading-small uk-margin-remove-top uk-text-bold"
                    uk-slider-parallax="x: 200,-200"
                    v-html="slide.sub_heading"
                  ></p>
                  <div v-if="slide.button_text" class="uk-animation-fade">
                    <div class="uk-margin-small-top">
                      <NuxtLink 
                        v-if="slide.link"
                        :class="[slide.contrast, slide.button_colour]"
                        class="uk-button uk-text-bold uk-border-pill uk-margin-small-top uk-width-auto uk-padding-left"
                        uk-slider-parallax="x: 300,-300"
                        :to="slide.link"
                      >
                        {{ slide.button_text }}
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>

    <ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin"></ul>
  </div>
</template>

<script setup lang="ts">
import { isDateInRange } from '~/utils/date';

const mainStore = useMainStore();
const slider = ref<HTMLElement | null>(null);
const activeSlide = ref(0);

// Site name for fallback
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');

// Filter slides by date range
const homeSlides = computed(() => {
  const slides = mainStore.site?.promotional?.[0]?.slides || [];
  return slides.filter((slide: any) => isDateInRange(slide.start, slide.end));
});

// Methods
const isLinkExternal = (link: string) => {
  return /^(http|https):\/\//.test(link);
};

const linkComponent = (link: string) => {
  return isLinkExternal(link) ? 'a' : resolveComponent('NuxtLink');
};

const formatLink = (link: string) => {
  if (/^https?:\/\//.test(link)) {
    return link;
  }
  return 'https://' + link;
};

const formatSlideTitle = (link: string) => {
  if (!link) return siteName.value;
  const parts = link.replace('-', ' ').split('/');
  return parts[2] || parts[1] || siteName.value;
};

const strippedHeadingContent = (content: string) => {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '');
};

// Preload first slide image for LCP
useHead(() => {
  if (!homeSlides.value?.length) return {};
  
  return {
    link: [{
      rel: 'preload',
      fetchpriority: 'high',
      as: 'image',
      href: homeSlides.value[0].desktop,
      type: 'image/jpg',
    }],
  };
});

// UIkit slider event listener (client-only)
if (process.client) {
  onMounted(() => {
    nextTick(() => {
      const { $uikit } = useNuxtApp();
      if ($uikit && slider.value) {
        $uikit.util.on(slider.value, 'itemshow', () => {
          const slideItems = document.querySelectorAll('.uk-slider-items > div');
          slideItems.forEach((slide, index) => {
            if (slide.classList.contains('uk-active')) {
              activeSlide.value = index;
            }
          });
        });
      }
    });
  });
}
</script>

<style>
.hero-slider h2,
.hero-slider h1,
.hero-slider h3,
.hero-slider h4,
.hero-slider p {
  margin: 0;
}

.hero-slider .uk-light {
  color: #fff;
}
</style>

<style scoped>
.uk-slider-items {
  margin-left: 0;
}

.uk-slider-items > div {
  padding: 10px;
  transition: transform 0.3s ease;
}

.uk-panel {
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.uk-panel:hover {
  transform: translateY(-5px);
}

.uk-dotnav {
  margin-top: 20px;
  position: relative;
  z-index: 5;
}

.hero-slider .uk-slider-nav li a {
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
  width: 12px;
  height: 12px;
  transition: all 0.3s;
}

.hero-slider .uk-slider-nav li.uk-active a {
  background-color: #fff;
  transform: scale(1.2);
}

.slide-image {
  object-fit: cover;
  height: 100%;
  border-radius: 0;
}

.uk-position-bottom-left {
  padding: 2rem 2rem 4rem 4rem;
  width: 400px;
  z-index: 5;
}

.uk-heading-small {
  font-size: 1.85rem;
  letter-spacing: -0.0525rem;
  line-height: 2.2rem;
}

@media (max-width: 960px) {
  .uk-position-bottom-left {
    padding: 1rem 1rem 2rem 2rem;
    width: 70%;
  }
}

.slide-overlay {
  opacity: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  z-index: 10;
  text-decoration: none;
  display: block;
}

.uk-slider-items > div:not(.uk-active) .slide-overlay {
  opacity: 1;
}

.uk-slider-items > div:not(.uk-active) .uk-panel {
  filter: brightness(0.7);
  transition: all 0.3s ease;
}

.uk-slider-items > div:not(.uk-active) .uk-panel:hover {
  filter: brightness(0.9);
}

.uk-slider-items > div.uk-active .uk-panel {
  transform: scale(1);
  z-index: 1;
  box-shadow: 0 14px 25px rgba(0, 0, 0, 0.16);
}

.uk-slider-items > div.uk-active .slide-overlay {
  opacity: 0;
  pointer-events: none;
}

.slide-link {
  z-index: 1;
}
</style>



