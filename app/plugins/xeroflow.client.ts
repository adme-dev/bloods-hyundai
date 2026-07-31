import { installXeroflowTracking } from '~/utils/xeroflowTracking';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  installXeroflowTracking({
    writeKey: config.public.xeroflowWriteKey as string,
    window,
    document,
  });
});
