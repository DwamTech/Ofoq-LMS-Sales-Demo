export const isDemoMode = true;

export const DEMO_READ_ONLY_MESSAGE = 'هذه العملية غير متاحة في النسخة التجريبية.';

export const isDemoAllowedRequest = (method?: string, url?: string): boolean => {
  return true;
};

export class DemoReadOnlyError extends Error {
  code = 'DEMO_READ_ONLY';

  constructor() {
    super(DEMO_READ_ONLY_MESSAGE);
    this.name = 'DemoReadOnlyError';
  }
}

export const notifyDemoReadOnly = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('demo-read-only'));
  }
};
