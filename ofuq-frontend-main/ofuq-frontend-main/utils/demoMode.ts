export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_READ_ONLY_MESSAGE = 'هذه العملية غير متاحة في النسخة التجريبية.';

export const isDemoAllowedRequest = (method?: string, url?: string): boolean => {
  if (!isDemoMode) return true;

  const normalizedMethod = (method || 'get').toLowerCase();
  if (['get', 'head', 'options'].includes(normalizedMethod)) return true;

  // Authentication is deliberately the only stateful exception in demo mode.
  return normalizedMethod === 'post' && ['/login', '/auth/logout'].includes(url || '');
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
