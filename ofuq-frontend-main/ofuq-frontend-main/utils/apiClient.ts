import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { http } from '@/lib/http';
import { getAuthToken } from './authService';
import { isLocalPreview } from '@/lib/localPreview';

// إضافة ترويسة Authorization تلقائيًا كما كان سابقًا
http.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// تخزين مؤقت بسيط + منع تكرار الطلبات لنفس المفتاح
type CacheEntry = { ts: number; ttl: number; response: AxiosResponse };
const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AxiosResponse>>();

// امتداد صغير لإضافة دعم cacheTTL في تهيئة الطلب
type RequestConfig = AxiosRequestConfig & { cacheTTL?: number };

function buildKey(url: string, config?: RequestConfig): string {
  const token = getAuthToken() || '';
  const params = config?.params ? JSON.stringify(config.params) : '';
  // لا نستخدم الترويسات كاملة لتفادي تغيّرها، نكتفي بالتوكن إن وجد
  return `GET|${url}|${params}|auth:${token ? '1' : '0'}`;
}

function defaultTTL(url: string): number {
  // TTL افتراضي 60 ثانية، وبعض نقاط البيانات العامة أطول قليلاً
  if (url.includes('/categories') || url.includes('/allCourses')) return 120;
  if (url.includes('/profile')) return 15;
  return 60;
}

// مُغلف بسيط حول http يُضيف التخزين المؤقت + منع التكرار لطلبات GET
const apiClient = {
  async get<T = any>(url: string, config?: RequestConfig): Promise<AxiosResponse<T>> {
    if (isLocalPreview) return http.get<T>(url, config);
    const ttl = Number(config?.cacheTTL ?? defaultTTL(url));
    const key = buildKey(url, config);

    // إعادة رد مخزّن إذا كان صالحًا
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.ts < cached.ttl * 1000) {
      return Promise.resolve(cached.response as AxiosResponse<T>);
    }

    // منع تكرار نفس الطلب أثناء الطيران
    const existing = inflight.get(key);
    if (existing) {
      return existing as Promise<AxiosResponse<T>>;
    }

    const req = http.get<T>(url, config as AxiosRequestConfig)
      .then((resp) => {
        responseCache.set(key, { ts: Date.now(), ttl, response: resp as AxiosResponse });
        inflight.delete(key);
        return resp as AxiosResponse<T>;
      })
      .catch((err) => {
        inflight.delete(key);
        // عند حدوث 429 أو خطأ شبكة، إن كان لدينا رد مخزّن (حتى لو انتهت صلاحيته) نُعيده كـ fallback
        const status = err?.response?.status;
        const cached = responseCache.get(key);
        if ((status === 429 || status === 503 || status === 0) && cached) {
          return cached.response as AxiosResponse<T>;
        }
        throw err;
      });
    inflight.set(key, req as Promise<AxiosResponse>);
    return req;
  },

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // بعد عمليات الكتابة قم بمسح الكاش لتفادي عرض بيانات قديمة
    responseCache.clear();
    return http.post<T>(url, data, config);
  },
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    responseCache.clear();
    return http.put<T>(url, data, config);
  },
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    responseCache.clear();
    return http.patch<T>(url, data, config);
  },
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    responseCache.clear();
    return http.delete<T>(url, config);
  },
};

export default apiClient;
