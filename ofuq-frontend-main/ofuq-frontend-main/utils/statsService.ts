import http from './apiClient';

export interface GeneralStats {
  total_students: number;
  happy_students: number;
  total_courses: number;
  positive_reviews: number;
  average_rating: number;
  active_students: number;
}

export interface StudentStats {
  total_students: number;
  active_students: number;
  blocked_students: number;
  students_with_completed_courses: number;
  students_with_active_enrollments: number;
}

export interface StatsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface StudentsByCountryItem {
  country_ar: string;
  students_count: number;
}

export interface StudentsByCountryResponse {
  success: boolean;
  data: StudentsByCountryItem[];
  message?: string;
}

/**
 * جلب الإحصائيات العامة للموقع (للصفحة الرئيسية)
 */
export const getGeneralStats = async (): Promise<GeneralStats> => {
  try {
    const response = await http.get<StatsResponse<GeneralStats>>('/stats/general');
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    console.error('Unexpected API response structure for general stats:', response.data);
    // إرجاع قيم افتراضية في حالة الخطأ
    return {
      total_students: 0,
      happy_students: 0,
      total_courses: 0,
      positive_reviews: 0,
      average_rating: 0,
      active_students: 0,
    };
  } catch (error) {
    console.error('Error fetching general stats:', error);
    // إرجاع قيم افتراضية في حالة الخطأ
    return {
      total_students: 0,
      happy_students: 0,
      total_courses: 0,
      positive_reviews: 0,
      average_rating: 0,
      active_students: 0,
    };
  }
};

/**
 * جلب إحصائيات الطلاب المفصلة (للإدارة فقط)
 */
export const getStudentStats = async (): Promise<StudentStats> => {
  try {
    const response = await http.get<StatsResponse<StudentStats>>('/admin/stats/students');
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    console.error('Unexpected API response structure for student stats:', response.data);
    // إرجاع قيم افتراضية في حالة الخطأ
    return {
      total_students: 0,
      active_students: 0,
      blocked_students: 0,
      students_with_completed_courses: 0,
      students_with_active_enrollments: 0,
    };
  } catch (error) {
    console.error('Error fetching student stats:', error);
    // إرجاع قيم افتراضية في حالة الخطأ
    return {
      total_students: 0,
      active_students: 0,
      blocked_students: 0,
      students_with_completed_courses: 0,
      students_with_active_enrollments: 0,
    };
  }
};

/**
 * جلب توزيع الطلاب حسب الجنسية (للاستخدام في خريطة الصفحة الرئيسية)
 */
export const getStudentsByCountry = async (): Promise<StudentsByCountryItem[]> => {
  try {
    const response = await http.get<StudentsByCountryResponse>('/stats/students-by-country');

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Unexpected API response structure for students-by-country:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching students-by-country stats:', error);
    return [];
  }
};