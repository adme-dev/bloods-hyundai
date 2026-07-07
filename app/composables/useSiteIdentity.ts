export const useSiteIdentity = () => {
  const config = useRuntimeConfig();
  const mainStore = useMainStore();

  const siteName = computed(() => mainStore.site?.name || config.public.siteName || 'Hyundai Dealer');
  const siteUrl = computed(() => mainStore.site?.siteUrl || mainStore.site?.websiteUrl || config.public.siteUrl || '');
  const dealerLocation = computed(() =>
    mainStore.site?.suburb ||
    mainStore.site?.showroom_address ||
    mainStore.site?.address ||
    'your local area'
  );

  return {
    siteName,
    siteUrl,
    dealerLocation,
  };
};

