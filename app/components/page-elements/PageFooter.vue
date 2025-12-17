<template>
  <footer class="page-footer uk-section uk-section-secondary uk-light">
    <div class="uk-container">
      <div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-4@m" uk-grid>
        <!-- Logo & Contact -->
        <div>
          <div class="footer-logo uk-margin-bottom">
            <img :src="logo" :alt="siteName" />
          </div>
          <div class="footer-address uk-margin-bottom">
            <p v-if="address">{{ address }}</p>
          </div>
          <div class="footer-contact">
            <a v-if="phone" :href="`tel:${phone}`" class="footer-phone">
              <span uk-icon="phone"></span>
              {{ phone }}
            </a>
            <a v-if="email" :href="`mailto:${email}`" class="footer-email">
              <span uk-icon="mail"></span>
              {{ email }}
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="footer-heading">Quick Links</h4>
          <ul class="uk-nav uk-nav-default">
            <li><NuxtLink to="/build-and-price">New Cars</NuxtLink></li>
            <li><NuxtLink to="/car-sales">Used Cars</NuxtLink></li>
            <li><NuxtLink to="/special-offers">Special Offers</NuxtLink></li>
            <li><NuxtLink to="/service">Service</NuxtLink></li>
            <li><NuxtLink to="/parts">Parts</NuxtLink></li>
            <li><NuxtLink to="/contact">Contact</NuxtLink></li>
          </ul>
        </div>

        <!-- Services -->
        <div>
          <h4 class="footer-heading">Services</h4>
          <ul class="uk-nav uk-nav-default">
            <li><NuxtLink to="/test-drive">Book a Test Drive</NuxtLink></li>
            <li><NuxtLink to="/service-booking">Service Booking</NuxtLink></li>
            <li><NuxtLink to="/finance">Finance</NuxtLink></li>
            <li><NuxtLink to="/insurance">Insurance</NuxtLink></li>
            <li><NuxtLink to="/sell-my-car">Sell My Car</NuxtLink></li>
          </ul>
        </div>

        <!-- Trading Hours -->
        <div>
          <h4 class="footer-heading">Trading Hours</h4>
          <ul class="trading-hours-list">
            <li v-for="(hours, day) in tradingHours" :key="day">
              <span class="day">{{ day }}</span>
              <span class="hours">{{ hours }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Social & Copyright -->
      <div class="footer-bottom uk-margin-large-top uk-padding-small-top" style="border-top: 1px solid rgba(255,255,255,0.1)">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-flex-wrap">
          <div class="footer-social uk-margin-small-bottom">
            <a v-if="social?.facebook" :href="social.facebook" target="_blank" rel="noopener" uk-icon="facebook"></a>
            <a v-if="social?.instagram" :href="social.instagram" target="_blank" rel="noopener" uk-icon="instagram"></a>
            <a v-if="social?.youtube" :href="social.youtube" target="_blank" rel="noopener" uk-icon="youtube"></a>
            <a v-if="social?.linkedin" :href="social.linkedin" target="_blank" rel="noopener" uk-icon="linkedin"></a>
          </div>
          <div class="footer-legal uk-text-small uk-margin-small-bottom">
            <NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink>
            <span class="uk-margin-small-left uk-margin-small-right">|</span>
            <NuxtLink to="/terms-conditions">Terms & Conditions</NuxtLink>
          </div>
        </div>
        <div class="uk-text-center uk-text-small uk-margin-small-top">
          <p class="uk-margin-remove">
            &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const mainStore = useMainStore();

// Site config
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const logo = computed(() => mainStore.site?.footer_logo || mainStore.site?.logo || '/images/logo-white.png');
const address = computed(() => mainStore.site?.address || '');
const phone = computed(() => mainStore.site?.phone || '');
const email = computed(() => mainStore.site?.email || '');
const social = computed(() => mainStore.site?.social || {});

// Trading hours
const tradingHours = computed(() => {
  return mainStore.site?.trading_hours || {
    'Monday - Friday': '8:30am - 5:30pm',
    'Saturday': '8:30am - 4:00pm',
    'Sunday': 'Closed',
  };
});

// Current year
const currentYear = new Date().getFullYear();
</script>

<style lang="scss" scoped>
.page-footer {
  background: #002c5f;
}

.footer-logo img {
  max-height: 50px;
  width: auto;
}

.footer-heading {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 20px;
  letter-spacing: 0.02em;
}

.footer-contact {
  a {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    margin-bottom: 8px;

    &:hover {
      color: white;
    }
  }
}

.uk-nav-default > li > a {
  color: rgba(255, 255, 255, 0.8);
  padding: 5px 0;

  &:hover {
    color: white;
  }
}

.trading-hours-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;

    .day {
      font-weight: 500;
    }
  }
}

.footer-social {
  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-right: 8px;
    color: rgba(255, 255, 255, 0.8);
    transition: color 0.2s;

    &:hover {
      color: white;
    }
  }
}

.footer-legal a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;

  &:hover {
    color: white;
  }
}
</style>








