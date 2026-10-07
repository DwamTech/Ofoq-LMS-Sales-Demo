import apiClient from './apiClient';

// Helper to handle localized strings (e.g. { ar: "...", en: "..." })
const getLocalized = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.ar || val.en || val.name || val.title || val.label || '';
  }
  return String(val);
};

// Helper to construct full storage URL
const getStorageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;

  let baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // Remove /api suffix if present to get the root URL
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  // Remove leading slash from path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${baseUrl}/${cleanPath}`;
};

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  instructor_id: number;
  category_id: number; // معرف الدبلومة
  section_id?: number | null;
  cover_image?: string;
  video_url?: string | null;
  is_free: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at?: string;
  updated_at?: string;
  // Optional fields
  duration?: number;
  chapters_count?: number;
  lessons_count?: number;
  rating?: number | string;
  students_count?: number;
  reviews_count?: number;
  average_rating?: number;
  total_views?: number;
  stats?: CourseStats;
  // ترتيب عرض الكورس في القوائم (اختياري)
  rank?: number | null;
  // تمت الإضافة: حالة النشر كقيمة منطقية لاستخدامها في لوحات الإدارة
  is_published?: boolean;
  // تمت الإضافة: نسبة التقدم للمستخدم
  progress_percentage?: number;
  enrollment_status?: string;
  // تمت الإضافة: مؤشر وجود اختبار نهائي
  has_final_exam?: boolean;

  instructor?: {
    id: number;
    name: string;
    title: string;
    bio?: string;
    image?: string;
    rating?: number;
  };
  category?: {
    id: number;
    name: string;
    title?: string;
    label?: string;
  };
  section?: {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
  } | null;
  sections?: Array<{
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
  }>;
  chapters?: Array<{
    id: number;
    title: string;
    // ... (باقي الحقول)
    lessons?: Array<{
      id: number;
      title: string;
      duration_seconds?: number | null;
      resources?: unknown[] | null;
      attachments?: unknown[] | null;
      // ... (باقي الحقول)
    }>;
  }>;
}

export interface CourseStats {
  chapters_count: number;
  lessons_count: number;
  students_count: number;
  duration_seconds: number;
  duration_hours: number;
  views_count: number;
  reviews_count: number;
  average_rating: number;
  attachments_count: number;
  resources_count: number;
  quizzes_count: number;
  questions_count: number;
  level_key: 'beginner' | 'intermediate' | 'advanced' | string;
  level_label: string;
  language: string;
  language_label: string;
  source?: 'calculated' | 'summary' | string;
}

interface CourseResponse {
  data: Course;
  message: string;
}

/**
 * [Admin] إنشاء كورس جديد
 */
export const createCourse = async (courseData: any): Promise<Course> => {
  console.log("Attempting to create course...");

  const token = localStorage.getItem('auth_token');
  console.log("🔍 Auth token exists:", !!token);

  try {
    // If a FormData was provided, use it directly; otherwise, build one
    const formData = courseData instanceof FormData ? courseData : new FormData();

    if (!(courseData instanceof FormData)) {
      Object.keys(courseData).forEach(key => {
        if (key === 'chaptersData') {
          formData.append('chapters', JSON.stringify(courseData[key]));
        } else if (key === 'coverImage' && courseData[key] instanceof File) {
          formData.append('cover_image', courseData[key]);
        } else if (key === 'isFree') {
          formData.append('is_free', courseData[key] ? '1' : '0');
        } else if (courseData[key] !== null && courseData[key] !== undefined) {
          if (key === 'is_published' || key === 'is_free') {
            formData.append(key, courseData[key] ? '1' : '0');
          } else {
            formData.append(key, courseData[key].toString());
          }
        }
      });
    }

    console.log("🔍 FormData contents:");
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });

    const response = await apiClient.post<CourseResponse>('/admin/courses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("✅ API call successful! Raw response:", response);

    if (response.data && response.data.data) {
      console.log("Course created successfully on backend. Returning data:", response.data.data);
      return response.data.data;
    } else {
      console.error("❌ API reported success, but response format is unexpected:", response.data);
      throw new Error('API response was successful but improperly formatted.');
    }

  } catch (error: any) {
    console.error("❌ API call failed! Full error object:", error);

    if (error.response) {
      console.error("Error Response Data:", error.response.data);
      console.error("Error Response Status:", error.response.status);
    }

    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors;
      const errorMessages = Object.values(errors).flat().join('\n');
      throw new Error(`خطأ في البيانات:\n${errorMessages}`);
    }

    throw new Error('Failed to create course. See console for details.');
  }
};

/**
 * [Admin] جلب جميع الكورسات
 */
export const getCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get<{ data: Course[] }>(
      '/admin/courses',
      { params: { per_page: 1000 } }
    );
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Unexpected API response structure:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new Error('Failed to fetch courses');
  }
};

/**
 * [Admin] تحديث كورس
 */
export const updateCourse = async (id: number, courseData: FormData): Promise<Course> => {
  try {
    courseData.append('_method', 'PUT');

    const response = await apiClient.post<CourseResponse>(`/admin/courses/${id}`, courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw new Error('Failed to update course');
  }
};

/**
 * [Admin] حذف كورس
 */
export const deleteCourse = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/admin/courses/${id}`);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw new Error('Failed to delete course');
  }
};

/**
 * [Public] جلب الكورسات المميزة
 */
export const getFeaturedCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get<{ data: any[] }>('/courses/featured');

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => ({
        id: item.course.id,
        title: getLocalized(item.course.title),
        description: getLocalized(item.course.description),
        price: parseFloat(item.course.price),
        instructor_id: item.course.instructor_id,
        category_id: item.course.category_id,
        cover_image: getStorageUrl(item.course.cover_image),
        is_free: item.course.is_free,
        status: item.course.status,
        created_at: item.course.created_at,
        updated_at: item.course.updated_at,
        instructor: item.course.instructor,
        category: item.course.category,
        rating: item.course.rating || '4.5',
        duration: item.course.duration || 30,
        chapters_count: item.course.chapters_count || 0,
        students_count: item.course.students_count || 0
      }));
    }

    console.error('Unexpected API response structure for featured courses:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    throw new Error('Failed to fetch featured courses');
  }
};

/**
 * [Public] جلب جميع الكورسات
 */
export const getAllCourses = async (params?: {
  search?: string;
  category?: string;
  section?: string;
  section_id?: number;
  sort?: string;
  per_page?: number;
}): Promise<Course[]> => {
  try {
    const response = await apiClient.get<any>('/allCourses', { params: { per_page: 1000, ...(params || {}) } });
    const payload = response?.data?.data?.data
      ?? response?.data?.data
      ?? response?.data
      ?? [];
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

    return items.map((c: any) => ({
      id: Number(c.id),
      title: getLocalized(c.title),
      description: getLocalized(c.description),
      price: Number(c.price ?? 0),
      instructor_id: Number(c.instructor_id ?? c.instructor?.id ?? 0),
      category_id: Number(c.category_id ?? c.category?.id ?? 0),
      section_id: c.section_id !== undefined && c.section_id !== null ? Number(c.section_id) : (c.section?.id ? Number(c.section.id) : null),
      cover_image: getStorageUrl(c.cover_image_url ?? c.cover_image),
      is_free: Boolean(c.is_free),
      status: (c.status ?? 'published') as 'draft' | 'published' | 'archived',
      // تمت الإضافة: اشتقاق is_published من حقول متعددة لضمان الاتساق
      is_published: Boolean(
        c.is_published === true || c.is_published === 1 || c.is_published === '1' || (c.status && String(c.status).toLowerCase() === 'published')
      ),
      created_at: c.created_at,
      updated_at: c.updated_at,
      duration: Number(c.duration ?? 0),
      chapters_count: Number(c.chapters_count ?? 0),
      lessons_count: Number(c.lessons_count ?? 0),
      rating: c.rating ?? c.average_rating ?? undefined,
      students_count: c.students_count ?? undefined,
      reviews_count: c.reviews_count ?? undefined,
      average_rating: c.average_rating ?? undefined,
      instructor: c.instructor
        ? {
          id: Number(c.instructor.id ?? 0),
          name: getLocalized(c.instructor.name),
          title: getLocalized(c.instructor.title),
          bio: getLocalized(c.instructor.bio),
          image: getStorageUrl(c.instructor.image),
          rating: c.instructor.rating ?? c.instructor.avg_rate ?? undefined,
        }
        : undefined,
      category: c.category
        ? { id: Number(c.category.id ?? 0), name: getLocalized(c.category.name) }
        : (c.category || c.category_id)
          ? { id: Number(c.category_id ?? 0), name: getLocalized(c.category) }
          : undefined,
      section: c.section
        ? {
          id: Number(c.section.id ?? 0),
          name: getLocalized(c.section.name),
          slug: getLocalized(c.section.slug),
          icon: c.section.icon ?? null,
        }
        : null,
      sections: Array.isArray(c.sections)
        ? c.sections.map((section: any) => ({
          id: Number(section.id ?? 0),
          name: getLocalized(section.name),
          slug: getLocalized(section.slug),
          icon: section.icon ?? null,
        }))
        : [],
    }));
  } catch (error) {
    console.error('Error fetching all courses:', error);
    throw new Error('Failed to fetch all courses');
  }
};

/**
 * [Public] جلب تفاصيل كورس واحد
 */
export const getCourseDetails = async (courseId: string | number): Promise<Course | null> => {
  try {
    const response = await apiClient.get<{ data: Course }>(`/course/${courseId}`, { cacheTTL: 300 });

    if (response.data && response.data.data) {
      const course = response.data.data;
      // Apply getStorageUrl to cover_image and instructor image
      if (course.cover_image) course.cover_image = getStorageUrl(course.cover_image);
      if (course.instructor?.image) course.instructor.image = getStorageUrl(course.instructor.image);
      return course;
    }

    console.error('Unexpected API response structure for course details:', response.data);
    return null;
  } catch (error) {
    console.error('Error fetching course details:', error);
    throw new Error('Failed to fetch course details');
  }
};

/**
 * [User] جلب نسبة التقدم في الكورس
 */
export const getCourseProgress = async (
  courseId: number | string
): Promise<number> => {
  try {
    const response = await apiClient.get<any>(`/courses/${courseId}/progress`);
    const overall = response?.data?.course_progress?.overall_progress;
    if (typeof overall === 'number') return overall;
    return Number(overall ?? 0);
  } catch (error: any) {
    console.error('Error fetching course progress:', error);
    return 0;
  }
};

/**
 * فحص صلاحية الوصول إلى محتوى الكورس عبر مسار الحماية الرسمي
 * يستخدم نفس المنطق المستخدم داخل عرض الدروس والاختبارات.
 * 200 → مسموح، 403 → غير مسجل بالدبلومة/الكورس، 401 → غير مصرح (غير مسجل دخولًا)
 */
export type CourseAccessResult = {
  allowed: boolean;
  reason?: 'forbidden' | 'unauthenticated';
  statusCode?: number;
  data?: any;
};

export const checkCourseAccess = async (
  courseId: number | string
): Promise<CourseAccessResult> => {
  try {
    const res = await apiClient.get<any>(`/courses/${courseId}/progress`);
    return { allowed: true, statusCode: 200, data: res?.data };
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 403) {
      return { allowed: false, reason: 'forbidden', statusCode: 403 };
    }
    if (status === 401) {
      return { allowed: false, reason: 'unauthenticated', statusCode: 401 };
    }
    throw error;
  }
};

export interface CourseProgressDetails {
  overall_progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | string;
  completed_at?: string | null;
  lessons: Array<{
    lesson_id: number;
    lesson_title: string;
    status: 'not_started' | 'in_progress' | 'completed' | string;
    started_at?: string | null;
    completed_at?: string | null;
    quiz_passed?: boolean;
  }>;
}

/**
 * [User] جلب تفاصيل التقدم في الكورس
 */
export const getCourseProgressDetails = async (
  courseId: number | string
): Promise<CourseProgressDetails | null> => {
  try {
    const response = await apiClient.get<any>(`/courses/${courseId}/progress`);
    const cp = response?.data?.course_progress;
    const details: CourseProgressDetails = {
      overall_progress: Number(cp?.overall_progress ?? 0),
      status: (cp?.status ?? 'not_started') as any,
      completed_at: cp?.completed_at ?? null,
      lessons: Array.isArray(cp?.lessons) ? cp.lessons.map((l: any) => ({
        lesson_id: Number(l.lesson_id),
        lesson_title: getLocalized(l.lesson_title),
        status: String(l.status ?? 'not_started') as any,
        started_at: l.started_at ?? null,
        completed_at: l.completed_at ?? null,
        quiz_passed: Boolean(l.quiz_passed ?? false),
      })) : [],
    };
    return details;
  } catch (error: any) {
    console.error('Error fetching course progress details:', error);
    return null;
  }
};

/**
 * [User] جلب الكورسات المفضلة
 */
export const getMyFavoriteCourses = async (): Promise<Course[]> => {
  try {
    const res = await apiClient.get<any>('/user/favorite-courses');
    const payload = res?.data;

    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    return items.map((c: any) => ({
      id: Number(c.id),
      title: getLocalized(c.title),
      description: getLocalized(c.description),
      price: Number(c.price ?? 0),
      instructor_id: Number(c.instructor_id ?? 0),
      category_id: Number(c.category_id ?? 0),
      cover_image: getStorageUrl(c.cover_image_url ?? c.cover_image),
      is_free: Boolean(c.is_free),
      status: (c.status ?? 'published') as 'draft' | 'published' | 'archived',
      created_at: c.created_at,
      updated_at: c.updated_at,
      instructor: c.instructor
        ? {
          id: Number(c.instructor.id ?? 0),
          name: getLocalized(c.instructor.name),
          title: getLocalized(c.instructor.title),
          bio: getLocalized(c.instructor.bio),
          image: getStorageUrl(c.instructor.image),
          rating: c.instructor.rating ?? c.instructor.avg_rate ?? undefined,
        }
        : (c.name_instructor || c.image_instructor)
          ? {
            id: Number(c.instructor_id ?? 0),
            name: getLocalized(c.name_instructor),
            title: getLocalized(c.title_instructor),
            bio: getLocalized(c.bio_instructor),
            image: getStorageUrl(c.image_instructor),
            rating: c.avg_rate ?? undefined,
          }
          : undefined,
      category: c.category
        ? { id: Number(c.category.id ?? 0), name: getLocalized(c.category.name) }
        : c.category || c.category_id
          ? { id: Number(c.category_id ?? 0), name: getLocalized(c.category) }
          : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching favorite courses:', error);
    throw new Error(error?.response?.data?.message ?? 'فشل في جلب المفضلة');
  }
};

/**
 * [User] إضافة كورس للمفضلة
 */
export const addCourseToFavorites = async (courseId: number | string): Promise<boolean> => {
  try {
    await apiClient.post(`/user/favorite-courses/${courseId}`);
    return true;
  } catch (error: any) {
    console.error('Error adding course to favorites:', error);
    return false;
  }
};

/**
 * [User] إزالة كورس من المفضلة
 */
export const removeCourseFromFavorites = async (courseId: number | string): Promise<boolean> => {
  try {
    await apiClient.delete(`/user/favorite-courses/${courseId}`);
    return true;
  } catch (error: any) {
    console.error('Error removing course from favorites:', error);
    return false;
  }
};

/**
 * [User] جلب IDs الكورسات المفضلة
 */
export const getMyFavoriteCourseIds = async (): Promise<number[]> => {
  try {
    const favorites = await getMyFavoriteCourses();
    return favorites.map((c) => Number(c.id)).filter((id) => !isNaN(id));
  } catch (error) {
    console.error('Error fetching favorite course ids:', error);
    return [];
  }
};

export interface Review {
  id: number;
  course_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email?: string;
  };
}

interface ReviewsResponse {
  success: boolean;
  data: {
    data: Review[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

interface ReviewSubmissionResponse {
  success: boolean;
  message: string;
  data: Review;
}

/**
 * [Public] جلب تقييمات الكورس
 */
export const getCourseReviews = async (courseId: number | string, page: number = 1, perPage: number = 15): Promise<Review[]> => {
  try {
    const response = await apiClient.get<ReviewsResponse>(`/courses/${courseId}/reviews`, {
      params: { page, per_page: perPage }
    });

    if (response.data && response.data.success && response.data.data) {
      return response.data.data.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    return [];
  }
};

/**
 * [User] إرسال تقييم للكورس
 */
export const submitCourseReview = async (courseId: number | string, reviewData: {
  rating: number;
  comment: string;
}): Promise<Review | null> => {
  try {
    const response = await apiClient.post<ReviewSubmissionResponse>(`/courses/${courseId}/reviews`, reviewData);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error submitting review:', error);

    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error('فشل في إرسال التقييم');
  }
};

/**
 * [User] تحديث تقييم
 */
export const updateCourseReview = async (courseId: number | string, reviewId: number, reviewData: {
  comment: string;
}): Promise<Review | null> => {
  try {
    const response = await apiClient.put<ReviewSubmissionResponse>(`/courses/${courseId}/reviews/${reviewId}`, reviewData);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error updating review:', error);

    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error('فشل في تحديث التقييم');
  }
};

/**
 * [User] حذف تقييم
 */
export const deleteCourseReview = async (courseId: number | string, reviewId: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/courses/${courseId}/reviews/${reviewId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return false;
  }
};

/**
 * [Admin] جلب تفاصيل كورس واحد (للإدارة)
 */
export const getAdminCourse = async (courseId: number | string): Promise<Course | null> => {
  try {
    const response = await apiClient.get<CourseResponse>(`/admin/courses/${courseId}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching admin course:', error);
    throw new Error(error?.response?.data?.message ?? 'فشل في جلب بيانات المقرر');
  }
};

// Add missing enrollment functions
export interface PaginatedCourses {
  data: Course[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface EnrollmentFilters {
  counts: {
    all: number;
    completed: number;
    in_progress: number;
  };
  categories: Array<{
    id: number;
    name: string; // localized object or string
    title?: string;
  }>;
}

export interface MyTestStatus {
  course_id: number;
  status: 'completed' | 'in_progress';
  enrollment_status: string; // Completed lessons unlock the final exam.
  course_status: 'completed' | 'in_progress';
  progress_percentage: number;
  has_final_exam: boolean;
  final_exam_id: number | null;
  exam_status: 'not_taken' | 'in_progress' | 'passed' | 'failed';
  active_attempt_status: 'in_progress' | null;
}

export const getMyTestStatuses = async (): Promise<MyTestStatus[]> => {
  const response = await apiClient.get<{ data: MyTestStatus[] }>('/my-tests', { cacheTTL: 0 });
  return response.data.data;
};

export const getEnrollmentFilters = async (): Promise<EnrollmentFilters> => {
  try {
    const response = await apiClient.get<EnrollmentFilters>('/my-enrollments/filters');
    return response.data;
  } catch (error) {
    console.error('Error fetching enrollment filters:', error);
    return {
      counts: { all: 0, completed: 0, in_progress: 0 },
      categories: []
    };
  }
};

export const getMyEnrollments = async (
  page: number = 1,
  perPage: number = 12,
  filters?: { status?: 'completed' | 'in_progress'; category_id?: number }
): Promise<PaginatedCourses> => {
  try {
    const params: any = { page, per_page: perPage };
    if (filters?.status) params.status = filters.status;
    if (filters?.category_id) params.category_id = filters.category_id;

    const response = await apiClient.get<any>('/my-enrollments', { params });

    // Handle new paginated structure
    if (response.data?.pagination) {
      const items = response.data.data || [];
      const mappedItems = items.map((course: any) => ({
        id: Number(course.id),
        title: getLocalized(course.title),
        description: getLocalized(course.description),
        price: Number(course.price ?? 0),
        instructor_id: Number(course.instructor_id ?? 0),
        category_id: Number(course.category_id ?? 0),
        cover_image: getStorageUrl(course.cover_image_url ?? course.cover_image),
        is_free: Boolean(course.is_free),
        status: (course.status ?? 'published') as 'draft' | 'published' | 'archived',
        progress_percentage: Number(course.progress_percentage ?? 0),
        enrollment_status: course.enrollment_status,
        has_final_exam: course.has_final_exam ?? undefined,
        created_at: course.created_at,
        updated_at: course.updated_at,
        instructor: course.instructor
          ? {
            id: Number(course.instructor.id ?? 0),
            name: getLocalized(course.instructor.name),
            title: getLocalized(course.instructor.title),
            bio: getLocalized(course.instructor.bio),
            image: getStorageUrl(course.instructor.image),
            rating: course.instructor.rating ?? course.instructor.avg_rate ?? undefined,
          }
          : undefined,
        category: course.category
          ? { id: Number(course.category.id ?? 0), name: getLocalized(course.category.name) }
          : undefined,
      }));

      return {
        data: mappedItems,
        pagination: response.data.pagination
      };
    }

    // Fallback for legacy structure
    const payload = response?.data;
    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    const mappedItems = items.map((enrollment: any) => {
      const course = enrollment.course || enrollment;
      return {
        id: Number(course.id),
        title: getLocalized(course.title),
        description: getLocalized(course.description),
        price: Number(course.price ?? 0),
        instructor_id: Number(course.instructor_id ?? 0),
        category_id: Number(course.category_id ?? 0),
        cover_image: getStorageUrl(course.cover_image_url ?? course.cover_image),
        is_free: Boolean(course.is_free),
        status: (course.status ?? 'published') as 'draft' | 'published' | 'archived',
        progress_percentage: Number(enrollment.progress_percentage ?? course.progress_percentage ?? 0),
        enrollment_status: enrollment.status ?? course.enrollment_status,
        has_final_exam: course.has_final_exam ?? undefined,
        created_at: course.created_at,
        updated_at: course.updated_at,
        instructor: course.instructor
          ? {
            id: Number(course.instructor.id ?? 0),
            name: getLocalized(course.instructor.name),
            title: getLocalized(course.instructor.title),
            bio: getLocalized(course.instructor.bio),
            image: getStorageUrl(course.instructor.image),
            rating: course.instructor.rating ?? course.instructor.avg_rate ?? undefined,
          }
          : undefined,
        category: course.category
          ? { id: Number(course.category.id ?? 0), name: getLocalized(course.category.name) }
          : undefined,
      };
    });

    return {
      data: mappedItems,
      pagination: {
        total: mappedItems.length,
        per_page: perPage,
        current_page: 1,
        last_page: 1,
        from: 1,
        to: mappedItems.length
      }
    };

  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    throw new Error(error?.response?.data?.message ?? 'فشل في جلب المقررات المسجلة');
  }
};

export const getMyEnrolledCourses = async (
  page: number = 1,
  perPage: number = 12,
  filters?: { status?: 'completed' | 'in_progress'; category_id?: number }
): Promise<PaginatedCourses> => {
  return getMyEnrollments(page, perPage, filters);
};

export const enrollCourse = async (courseId: number | string): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/courses/${courseId}/enroll`);
    return response.data.success ?? true;
  } catch (error: any) {
    console.error('Error enrolling in course:', error);
    throw new Error(error?.response?.data?.message ?? 'فشل في التسجيل في المقرر');
  }
};
