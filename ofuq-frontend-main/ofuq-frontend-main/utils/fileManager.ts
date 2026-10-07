// وظائف إدارة الملفات

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  uploadDate: Date
  path: string
  category: 'image' | 'document' | 'video' | 'audio' | 'other'
}

/**
 * تحديد نوع الملف بناءً على امتداده
 */
export function getFileCategory(fileName: string): FileInfo['category'] {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac']
  
  if (extension && imageExtensions.includes(extension)) {
    return 'image'
  } else if (extension && documentExtensions.includes(extension)) {
    return 'document'
  } else if (extension && videoExtensions.includes(extension)) {
    return 'video'
  } else if (extension && audioExtensions.includes(extension)) {
    return 'audio'
  }
  
  return 'other'
}

/**
 * تنسيق حجم الملف لعرضه بشكل مقروء
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت'
  
  const k = 1024
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * التحقق من صحة نوع الملف
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    }
    return file.type.match(type)
  })
}

/**
 * التحقق من حجم الملف
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * إنشاء معرف فريد للملف
 */
export function generateFileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * تنظيف اسم الملف من الأحرف غير المسموحة
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * إنشاء مسار آمن للملف
 */
export function createSafeFilePath(originalName: string, category: string): string {
  const sanitizedName = sanitizeFileName(originalName)
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substr(2, 9)
  
  return `${category}/${timestamp}_${randomId}_${sanitizedName}`
}

/**
 * تحويل الملف إلى Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

/**
 * ضغط الصورة قبل الرفع
 */
export function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(compressedFile)
        } else {
          resolve(file)
        }
      }, file.type, quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * فلترة الملفات حسب النوع
 */
export function filterFilesByCategory(files: FileInfo[], category: FileInfo['category']): FileInfo[] {
  return files.filter(file => file.category === category)
}

/**
 * ترتيب الملفات حسب التاريخ
 */
export function sortFilesByDate(files: FileInfo[], order: 'asc' | 'desc' = 'desc'): FileInfo[] {
  return [...files].sort((a, b) => {
    const dateA = new Date(a.uploadDate).getTime()
    const dateB = new Date(b.uploadDate).getTime()
    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}

/**
 * البحث في الملفات
 */
export function searchFiles(files: FileInfo[], query: string): FileInfo[] {
  const searchTerm = query.toLowerCase().trim()
  if (!searchTerm) return files
  
  return files.filter(file => 
    file.name.toLowerCase().includes(searchTerm) ||
    file.type.toLowerCase().includes(searchTerm)
  )
}

/**
 * حساب إجمالي حجم الملفات
 */
export function calculateTotalSize(files: FileInfo[]): number {
  return files.reduce((total, file) => total + file.size, 0)
}

/**
 * تجميع الملفات حسب النوع مع الإحصائيات
 */
export function getFileStatistics(files: FileInfo[]) {
  const stats = {
    total: files.length,
    totalSize: calculateTotalSize(files),
    byCategory: {
      image: 0,
      document: 0,
      video: 0,
      audio: 0,
      other: 0
    }
  }
  
  files.forEach(file => {
    stats.byCategory[file.category]++
  })
  
  return stats
}