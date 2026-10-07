export type AdminErrorType =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'server'
  | 'network'
  | 'unknown';

export type AdminFieldErrors = Record<string, string[]>;

export interface AdminNormalizedError {
  status?: number;
  type: AdminErrorType;
  message: string;
  details?: string;
  fieldErrors?: AdminFieldErrors;
  canRetry: boolean;
  shouldLogout?: boolean;
  sessionExpired?: boolean;
}

const defaultMessages: Record<AdminErrorType, string> = {
  unauthorized: 'انتهت الجلسة أو غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.',
  forbidden: 'لا تملك صلاحية تنفيذ هذه العملية.',
  notFound: 'لم يتم العثور على البيانات المطلوبة.',
  validation: 'بعض البيانات المدخلة غير صحيحة.',
  server: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقًا.',
  network: 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.',
  unknown: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractStatus = (error: unknown): number | undefined => {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response)) return undefined;
  return typeof response.status === 'number' ? response.status : undefined;
};

const extractResponseData = (error: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response) || !isRecord(response.data)) return undefined;
  return response.data;
};

const extractBackendMessage = (data?: Record<string, unknown>): string | undefined => {
  if (!data) return undefined;
  return typeof data.message === 'string' && data.message.trim() ? data.message : undefined;
};

const extractFieldErrors = (data?: Record<string, unknown>): AdminFieldErrors | undefined => {
  if (!data || !isRecord(data.errors)) return undefined;

  const fieldErrors: AdminFieldErrors = {};
  Object.entries(data.errors).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (messages.length > 0) fieldErrors[field] = messages;
      return;
    }

    if (typeof value === 'string' && value.trim()) {
      fieldErrors[field] = [value];
    }
  });

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
};

const isNetworkError = (error: unknown): boolean => {
  if (!isRecord(error)) return false;
  const hasResponse = isRecord(error.response);
  const code = typeof error.code === 'string' ? error.code : '';
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';

  return !hasResponse && (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || message.includes('network'));
};

const typeFromStatus = (status?: number, network = false): AdminErrorType => {
  if (network) return 'network';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 422) return 'validation';
  if (status && status >= 500) return 'server';
  return 'unknown';
};

export function normalizeApiError(error: unknown, fallbackMessage?: string): AdminNormalizedError {
  const status = extractStatus(error);
  const data = extractResponseData(error);
  const network = isNetworkError(error);
  const type = typeFromStatus(status, network);
  const backendMessage = type === 'validation' ? extractBackendMessage(data) : undefined;
  const message =
    type === 'unknown'
      ? fallbackMessage ?? defaultMessages.unknown
      : backendMessage ?? defaultMessages[type];

  return {
    status,
    type,
    message,
    details: status ? `رمز الخطأ: ${status}` : undefined,
    fieldErrors: extractFieldErrors(data),
    canRetry: type === 'network' || type === 'server' || type === 'unknown',
    shouldLogout: type === 'unauthorized',
    sessionExpired: type === 'unauthorized',
  };
}
