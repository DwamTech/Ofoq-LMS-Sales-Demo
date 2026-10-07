import { http } from '@/lib/http';
/**
 * Helper function to construct proper backend asset URLs
 * @param relativePath - The relative path to the asset from Laravel's storage
 * @returns The complete URL to the backend asset or a placeholder if invalid
 */
export function getBackendAssetUrl(relativePath: string | null | undefined): string {
  if (!relativePath || relativePath.trim() === '') {
    return '/banner.jpg';
  }
  const assetsBase = ((http?.defaults?.baseURL)
    || process.env.NEXT_PUBLIC_ASSETS_BASE_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_API_URL
    || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
  let raw = relativePath.trim();

  // 1) لو يحتوي السلسلة على رابط http/https في أي مكان، نستخرج وننظّفه
  const embeddedUrlMatch = raw.match(/https?:\/\/[^\s]+/i);
  if (embeddedUrlMatch) {
    // رابط كامل داخل النص
    let url = embeddedUrlMatch[0];

    // إزالة حالات مثل /storage/https://... (تم تكرار /storage قبل الرابط الكامل)
    url = url.replace(/\/storage\/(https?:\/\/)/gi, '$1');

    // دمج أي تكرار لـ /storage/storage/ إلى /storage/ واحدة
    url = url.replace(/\/storage\/(?:storage\/)+/gi, '/storage/');

    // توحيد الدومين على assetsBase إن وجد
    if (assetsBase) {
      const idx = url.indexOf('/storage/');
      if (idx !== -1) {
        const suffix = url.substring(idx);
        return `${assetsBase}${suffix}`;
      }
    }
    return url;
  }

  // 2) لو يبدأ بـ / (مسار نسبي يبدأ من الجذر)
  if (raw.startsWith('/')) {
    // طبّع أي تكرار في بداية السلسلة مثل /storage/storage/ إلى /storage/
    raw = raw.replace(/^\/storage\/(?:storage\/)+/i, '/storage/');
    return assetsBase ? `${assetsBase}${raw}` : raw;
  }

  // 3) مسار نسبي بدون سلاش: أزل أي تكرار لـ storage/ في البداية ثم ابنِ /storage/<path>
  const path = raw.replace(/^(?:storage\/)+/i, '');
  return assetsBase ? `${assetsBase}/storage/${path}` : `/storage/${path}`;
}