interface DeferThirdPartyOptions {
  timeout?: number;
}

export function runWhenIdleOrInteraction(
  callback: () => void,
  options: DeferThirdPartyOptions = {}
) {
  if (!import.meta.client) return;

  const timeout = options.timeout ?? 3500;
  const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
  let hasRun = false;

  const run = () => {
    if (hasRun) return;
    hasRun = true;
    cleanup();
    callback();
  };

  const listenerOptions = { once: true, passive: true };
  const cleanup = () => {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, run);
    });
  };

  events.forEach((eventName) => {
    window.addEventListener(eventName, run, listenerOptions);
  });

  const scheduleIdle = () => {
    const requestIdleCallback = (window as any).requestIdleCallback;
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout });
      return;
    }

    window.setTimeout(run, timeout);
  };

  if (document.readyState === 'complete') {
    scheduleIdle();
  } else {
    window.addEventListener('load', scheduleIdle, { once: true });
  }
}
