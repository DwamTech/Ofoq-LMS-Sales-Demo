import { publicBrandText } from '@/lib/brand'
/** Presentation only. Never writes to or changes API records. */
export function publicDescription(value: unknown): string {
  const raw = typeof value === 'string' ? value : ''
  return publicBrandText(raw.replace(/<[^>]*>/g, ' ')
    .replace(/\bOFOQ\s+Sales\s+Demo\s+dataset\b[.!]?/gi, '')
    .replace(/(?:\[|\()?\b(?:Seeder|Test data|Placeholder|Mock data|Development[- ]only notes?)\b(?:\]|\))?\s*[:.]?/gi, '')
    .replace(/\s+/g, ' ').trim())
}

/** The public API does not define currency. Do not invent EGP/SAR or convert prices. */
export function publicPrice(amount: number | string, free = false): string {
  const number = Number(amount)
  if (free || number === 0) return 'مجاني'
  if (!Number.isFinite(number)) return 'السعر غير متاح'
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(number)
}

export function courseActionLabel(state: { allowed: boolean; authenticated: boolean; parentId: number; parentEnrolled: boolean }): string {
  if (state.allowed) return 'واصل التعلم'
  if (!state.authenticated) return 'سجّل الدخول للمتابعة'
  if (state.parentId && state.parentEnrolled) return 'تحديث حالة الوصول'
  return state.parentId ? 'التسجيل في الدبلومة' : 'التسجيل في المقرر'
}

export function artworkSubject(title: string): 'web' | 'python' | 'design' | 'data' | 'knowledge' {
  if (/python|بايثون/i.test(title)) return 'python'
  if (/بيانات|data|تحليل|ذكاء|ai\b/i.test(title)) return 'data'
  if (/تصميم|واجهات|ui\b|ux\b|تجربة المستخدم/i.test(title)) return 'design'
  if (/ويب|html|css|javascript|react|laravel|api\b/i.test(title)) return 'web'
  return 'knowledge'
}
