const XEROFLOW_TRACKER_SRC = 'https://app.xeroflow.io/track.js';

interface InstallXeroflowTrackingOptions {
  writeKey: string;
  window: Window & { __xeroflowGtmLoaded?: boolean };
  document: Document;
}

export function installXeroflowTracking({
  writeKey,
  window,
  document,
}: InstallXeroflowTrackingOptions) {
  if (!writeKey) return;

  // The GTM fallback uses this guard. The site-owned loader is authoritative
  // because it preserves the external script origin needed by the collector.
  window.__xeroflowGtmLoaded = true;

  if (document.querySelector(`script[src="${XEROFLOW_TRACKER_SRC}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = XEROFLOW_TRACKER_SRC;
  script.dataset.key = writeKey;
  script.dataset.spa = 'true';
  document.head.appendChild(script);
}
