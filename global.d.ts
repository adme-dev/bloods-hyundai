export {};

type UIkitElementApi = {
  show: (...args: unknown[]) => unknown;
  hide: (...args: unknown[]) => unknown;
};

type UIkitNotificationOptions = {
  message: string;
  status?: 'primary' | 'success' | 'warning' | 'danger';
  pos?: string;
  timeout?: number;
};

type UIkitModalApi = {
  (selector: string | Element): UIkitElementApi | undefined;
  confirm: (message: string, options?: Record<string, unknown>) => Promise<unknown>;
};

type UIkitApi = {
  modal: UIkitModalApi;
  offcanvas: (selector: string | Element) => UIkitElementApi | undefined;
  switcher: (selector: string | Element) => UIkitElementApi;
  notification: (options: UIkitNotificationOptions | string) => unknown;
  drop?: (selector: string | Element) => UIkitElementApi | undefined;
  dropdown?: (selector: string | Element) => UIkitElementApi | undefined;
  slider?: (selector: string | Element) => UIkitElementApi | undefined;
  slideshow?: (selector: string | Element) => UIkitElementApi | undefined;
  icon?: unknown;
};

declare global {
  interface Window {
    UIkit?: UIkitApi;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

declare module '#app' {
  interface NuxtApp {
    $uikit?: UIkitApi;
  }
}
