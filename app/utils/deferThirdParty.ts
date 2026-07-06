interface DeferThirdPartyOptions {
  timeout?: number;
  delay?: number;
  events?: string[];
}

export function runWhenIdleOrInteraction(
  callback: () => void,
  options: DeferThirdPartyOptions = {}
) {
  if (!import.meta.client) return;

  const timeout = options.timeout ?? 3500;
  const delay = options.delay ?? 0;
  const events = options.events ?? ['pointerdown', 'keydown', 'touchstart'];
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
    const schedule = () => {
      const requestIdleCallback = (window as any).requestIdleCallback;
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(run, { timeout });
        return;
      }

      window.setTimeout(run, timeout);
    };

    if (delay > 0) {
      window.setTimeout(schedule, delay);
      return;
    }

    schedule();
  };

  if (document.readyState === 'complete') {
    scheduleIdle();
  } else {
    window.addEventListener('load', scheduleIdle, { once: true });
  }
}
