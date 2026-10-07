// وظائف مساعدة عامة

/**
 * تنسيق التاريخ للعرض باللغة العربية
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Riyadh',
    calendar: 'gregory'
  }
  
  switch (format) {
    case 'short':
      options.year = 'numeric'
      options.month = '2-digit'
      options.day = '2-digit'
      break
    case 'long':
      options.year = 'numeric'
      options.month = 'long'
      options.day = 'numeric'
      options.weekday = 'long'
      break
    case 'time':
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.hour12 = true
      break
  }
  
  return dateObj.toLocaleDateString('ar-SA', options)
}

/**
 * تحويل النص إلى رابط آمن (slug)
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // السماح بالأحرف العربية
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * اختصار النص مع إضافة نقاط
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * التحقق من صحة رقم الهاتف السعودي
 */
export function validateSaudiPhone(phone: string): boolean {
  const phoneRegex = /^(\+966|0)?5[0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('966')) {
    return `+966 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  } else if (cleaned.startsWith('05')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

/**
 * إنشاء كلمة مرور عشوائية
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * تحويل الرقم إلى تنسيق عربي
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ar-SA')
}

/**
 * حساب النسبة المئوية
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * تأخير التنفيذ (للاستخدام مع async/await)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * نسخ النص إلى الحافظة
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('فشل في نسخ النص:', error)
    return false
  }
}

/**
 * تحويل اللون من HEX إلى RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * إنشاء لون عشوائي
 */
export function generateRandomColor(): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * تنظيف البيانات من HTML
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * تحويل الكائن إلى query string
 */
export function objectToQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams()
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, String(value))
    }
  })
  
  return params.toString()
}

/**
 * تحويل query string إلى كائن
 */
export function queryStringToObject(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const obj: Record<string, string> = {}
  
  params.forEach((value, key) => {
    obj[key] = value
  })
  
  return obj
}

/**
 * التحقق من كون القيمة فارغة
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * دمج الكائنات بعمق
 */
export function deepMerge(target: any, source: any): any {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

/**
 * إنشاء معرف فريد
 */
export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * تحويل البايتات إلى تنسيق مقروء
 */
export function bytesToSize(bytes: number): string {
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت']
  if (bytes === 0) return '0 بايت'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}