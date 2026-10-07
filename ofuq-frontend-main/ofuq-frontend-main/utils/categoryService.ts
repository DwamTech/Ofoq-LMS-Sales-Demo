// خدمة إدارة الدبلومات (الأقسام سابقًا) - Diploma Management Service
import apiClient from './apiClient';

// ---------------------------------------------------------------- //
// 1. الواجهات الأساسية (Interfaces)
// ---------------------------------------------------------------- //

/**
 * الواجهة الكاملة للدبلومة (القسم) كما هي في قاعدة البيانات
 */
export interface Diploma {
  id: number;
  name: string; // تم تغيير الاسم في الواجهة إلى name ليتطابق مع name في create
  description: string;
  price: number;
  is_free: boolean;
  cover_image_url: string; // المسار الكامل للصورة
  slug: string;
  is_published: boolean;
  display_order?: number;
  section_id?: number | null;
  section?: {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
  } | null;
  // عدادات (اختياري تحميلها)
  courses_count?: number;
  students_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * البيانات المطلوبة لإنشاء دبلومة جديدة (لوحة الإدارة)
 * ملاحظة: سنستخدم FormData، لذا الحقول اختيارية هنا
 */
export interface CreateDiplomaData {
  name: string;
  description: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
  cover_image?: File; // ملف الصورة
  slug: string;
  display_order?: number;
  section_id?: number | null;
}

/**
 * البيانات المطلوبة لتحديث دبلومة (لوحة الإدارة)
 */
export interface UpdateDiplomaData {
  name: string;
  description: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
  cover_image?: File | null; // قد يتم إرسال صورة جديدة أو لا
  slug: string;
  display_order?: number;
  section_id?: number | null;
}

/**
 * واجهة رد التسجيل في الدبلومة
 */
export interface EnrollmentResponse {
  status: 'active' | 'pending_payment' | 'completed';
  message: string;
  // قد يرجع الباك اند بيانات إضافية
}

/**
 * واجهة الدبلومة في صفحة "دبلوماتي"
 */
export interface MyDiploma {
  id: number; // معرف التسجيل
  status: 'active' | 'pending_payment' | 'completed';
  enrolled_at: string;
  // نسبة إنجاز الطالب للدبلومة (0 - 100)
  progress: number;
  category: Diploma; // تفاصيل الدبلومة
  certificate?: {
    id: number;
    status: string;
    serial_number?: string;
    file_url?: string | null;
  } | null;
  can_download_certificate?: boolean;
}

// ---------------------------------------------------------------- //
// 2. دوال لوحة الإدارة (Admin Functions)
// ---------------------------------------------------------------- //

/**
 * [Admin] جلب جميع الدبلومات (للإدارة)
 */
export const getAdminCategories = async (): Promise<Diploma[]> => {
  try {
    console.log('[GetAdminCategories] Sending request to /admin/categories');
    const response = await apiClient.get('/admin/categories');
    const result = response.data;

    // Log the total count for debugging
    if (result.meta?.total !== undefined) {
      console.log('[GetAdminCategories] Total diplomas from API:', result.meta.total);
    }

    if (result.data && Array.isArray(result.data)) {
      console.log('[GetAdminCategories] Returning', result.data.length, 'diplomas');
      return result.data;
    } else if (Array.isArray(result)) {
      console.log('[GetAdminCategories] Returning', result.length, 'diplomas (array format)');
      return result;
    }
    console.warn('[GetAdminCategories] Unexpected response structure:', result);
    return [];
  } catch (error: any) {
    console.error('[GetAdminCategories] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب الأقسام';
    throw new Error(message);
  }
};

/**
 * [Admin] إنشاء دبلومة جديدة
 * ملاحظة: نستخدم FormData بسبب رفع الصورة
 */
export const createCategory = async (data: CreateDiplomaData | { name: string }): Promise<Diploma> => {
  try {
    console.log('[CreateCategory] Sending request to /admin/categories', data);

    const formData = new FormData();
    formData.append('name', data.name);

    // إذا كانت البيانات كاملة، استخدمها، وإلا استخدم القيم الافتراضية
    if ('description' in data) {
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('is_free', data.is_free ? '1' : '0');
      formData.append('is_published', data.is_published ? '1' : '0');
      formData.append('slug', data.slug);
      if (data.display_order !== undefined) {
        formData.append('display_order', data.display_order.toString());
      }
      if (data.section_id !== undefined) {
        formData.append('section_id', data.section_id === null ? '' : data.section_id.toString());
      }
      if (data.cover_image) {
        formData.append('cover_image', data.cover_image);
      }
    } else {
      // القيم الافتراضية للإنشاء السريع
      formData.append('description', '');
      formData.append('price', '0');
      formData.append('is_free', '1');
      formData.append('is_published', '1');
    }

    const response = await apiClient.post('/admin/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = response.data;
    console.log('[CreateCategory] Response received:', result);
    return result.data || result; // بناءً على الهيكل المعتاد
  } catch (error: any) {
    console.error('[CreateCategory] Error:', error);
    const message = error.response?.data?.message || 'فشل في إنشاء الدبلومة';
    throw new Error(message);
  }
};

/**
 * [Admin] تحديث دبلومة موجودة
 * ملاحظة: يجب استخدام POST مع _method=PUT للتعامل مع FormData
 */
export const updateCategory = async (id: number, data: UpdateDiplomaData | { name: string }): Promise<Diploma> => {
  try {
    console.log(`[UpdateCategory] Sending request to /admin/categories/${id}`, data);

    const formData = new FormData();
    formData.append('name', data.name);

    // إذا كانت البيانات كاملة، استخدمها، وإلا استخدم القيم الافتراضية
    if ('description' in data) {
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('is_free', data.is_free ? '1' : '0');
      formData.append('is_published', data.is_published ? '1' : '0');
      formData.append('slug', data.slug);
      if (data.display_order !== undefined) {
        formData.append('display_order', data.display_order.toString());
      }
      if (data.section_id !== undefined) {
        formData.append('section_id', data.section_id === null ? '' : data.section_id.toString());
      }
      if (data.cover_image) {
        formData.append('cover_image', data.cover_image);
      }
    }
    formData.append('_method', 'PUT'); // خدعة لإرسال FormData مع PUT

    const response = await apiClient.post(`/admin/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = response.data;
    console.log('[UpdateCategory] Response received:', result);
    return result.data || result;
  } catch (error: any) {
    console.error('[UpdateCategory] Error:', error);
    const message = error.response?.data?.message || 'فشل في تحديث الدبلومة';
    throw new Error(message);
  }
};

/**
 * [Admin] حذف دبلومة
 */
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    console.log(`[DeleteCategory] Sending request to /admin/categories/${id}`);
    await apiClient.delete(`/admin/categories/${id}`);
    console.log('[DeleteCategory] Category deleted successfully');
  } catch (error: any) {
    console.error('[DeleteCategory] Error:', error);
    const message = error.response?.data?.message || 'فشل في حذف القسم';
    throw new Error(message);
  }
};

/**
 * [Admin] جلب دبلومة واحدة بالمعرف (للوحة الإدارة)
 */
export const getCategoryById = async (id: number): Promise<Diploma> => {
  try {
    console.log(`[GetCategoryById] Sending request to /admin/categories/${id}`);
    const response = await apiClient.get(`/admin/categories/${id}`);
    const result = response.data;
    console.log('[GetCategoryById] Response received:', result);
    return result.data || result;
  } catch (error: any) {
    console.error('[GetCategoryById] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب بيانات القسم';
    throw new Error(message);
  }
};

/**
 * [Admin] جلب دبلومة واحدة بالمعرف (للوحة الإدارة) - اسم بديل لنفس الدالة
 */
export const getAdminCategory = async (id: number): Promise<Diploma> => {
  return getCategoryById(id);
};

// ---------------------------------------------------------------- //
// 3. دوال عامة (Public Functions) - (جديد)
// ---------------------------------------------------------------- //

/**
 * [Public] جلب الدبلومات المنشورة لعرضها للزوار
 * GET /api/categories
 */
export const getPublicDiplomas = async (params?: { section?: string; section_id?: number; search?: string }): Promise<Diploma[]> => {
  try {
    console.log('[GetPublicDiplomas] Sending request to /api/categories');
    // نفترض أن هذا الـ endpoint لا يتطلب مصادقة، لذا قد نستخدم apiClient أو http مباشر
    const response = await apiClient.get('/categories', { params });
    const result = response.data;

    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    console.warn('[GetPublicDiplomas] Unexpected response structure:', result);
    return [];
  } catch (error: any) {
    console.error('[GetPublicDiplomas] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب الدبلومات';
    throw new Error(message);
  }
};

/**
 * [Public] جلب العدد الإجمالي للدبلومات المنشورة عبر meta.total
 */
export const getPublicDiplomasCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/categories', { params: { per_page: 1 } });
    const result = response.data;
    if (result?.meta?.total !== undefined) {
      return Number(result.meta.total) || 0;
    }
    // إذا لم تكن هناك meta، احتياطيًا نحسب العدد من البيانات إن وجدت
    if (Array.isArray(result?.data)) {
      return result.data.length;
    }
    console.warn('[GetPublicDiplomasCount] Unexpected response structure:', result);
    return 0;
  } catch (error: any) {
    console.error('[GetPublicDiplomasCount] Error:', error);
    return 0;
  }
};

/**
 * [Public] جلب تفاصيل دبلومة واحدة (صفحة تفاصيل الدبلومة)
 * GET /api/categories/{slug}
 */
export const getPublicDiplomaDetails = async (slug: string): Promise<Diploma> => {
  try {
    console.log(`[GetPublicDiplomaDetails] Sending request to /api/categories/${slug}`);
    const response = await apiClient.get(`/categories/${slug}`);
    const result = response.data;
    console.log('[GetPublicDiplomaDetails] Response received:', result);
    return result.data || result;
  } catch (error: any) {
    console.error('[GetPublicDiplomaDetails] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب تفاصيل الدبلومة';
    throw new Error(message);
  }
};

// ---------------------------------------------------------------- //
// 4. دوال تسجيل المستخدم (User Enrollment Functions) - (جديد)
// ---------------------------------------------------------------- //

/**
 * [User] تسجيل المستخدم في دبلومة (يتطلب مصادقة)
 * POST /api/categories/{category}/enroll
 */
export const enrollInDiploma = async (categoryId: number | string): Promise<EnrollmentResponse> => {
  try {
    console.log(`[EnrollInDiploma] Sending request to /api/categories/${categoryId}/enroll`);
    // هذا الطلب يتطلب مصادقة (يستخدم apiClient)
    const response = await apiClient.post(`/categories/${categoryId}/enroll`);
    console.log('[EnrollInDiploma] Response received:', response.data);
    return response.data; // نتوقع { status: '...' }
  } catch (error: any) {
    console.error('[EnrollInDiploma] Error:', error);
    const message = error.response?.data?.message || 'فشل في عملية التسجيل';
    throw new Error(message);
  }
};

/**
 * [User] تفعيل الدبلومة بعد الدفع (يتطلب مصادقة)
 * POST /api/categories/{category}/enroll/activate
 */
export const activateDiploma = async (categoryId: number | string): Promise<any> => {
  try {
    console.log(`[ActivateDiploma] Sending request to /api/categories/${categoryId}/enroll/activate`);
    const response = await apiClient.post(`/categories/${categoryId}/enroll/activate`);
    console.log('[ActivateDiploma] Response received:', response.data);
    return response.data; // نتوقع { enrollment: {...}, enrolled_courses_count: X }
  } catch (error: any) {
    console.error('[ActivateDiploma] Error:', error);
    const message = error.response?.data?.message || 'فشل في تفعيل الدبلومة';
    throw new Error(message);
  }
};

/**
 * [User] جلب الدبلومات الخاصة بالمستخدم (صفحة "دبلوماتي") (يتطلب مصادقة)
 * GET /api/my-diplomas
 */
export const getMyDiplomas = async (): Promise<MyDiploma[]> => {
  try {
    console.log('[GetMyDiplomas] Sending request to /api/my-diplomas');
    const response = await apiClient.get('/my-diplomas');
    const result = response.data;

    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    console.warn('[GetMyDiplomas] Unexpected response structure:', result);
    return [];
  } catch (error: any) {
    console.error('[GetMyDiplomas] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب دبلوماتك';
    throw new Error(message);
  }
};

// Add alias for backward compatibility
export const getCategories = getAdminCategories;
export type Category = Diploma;
