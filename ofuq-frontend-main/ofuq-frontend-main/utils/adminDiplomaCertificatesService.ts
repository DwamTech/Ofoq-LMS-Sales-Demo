// خدمة إدارة شهادات الدبلومات للأدمن - Admin Diploma Certificates Service
import apiClient from './apiClient';
import { getDownloadUrl } from './certificateService';

// ---------------------------------------------------------------- //
// 1. الواجهات الأساسية (Interfaces)
// ---------------------------------------------------------------- //

/**
 * الطالب المستحق للشهادة
 */
export interface EligibleStudent {
  id: number;
  name: string;
  email: string;
  progress_percentage: number;
  final_exam_score?: number;
  completed_courses: number;
  total_courses: number;
  enrolled_at: string;
}

/**
 * الشهادة الصادرة
 */
export interface IssuedCertificate {
  id: number;
  uuid: string;
  student_name: string;
  student_email: string;
  serial_number: string;
  issued_at: string;
  file_url?: string;
  file_path?: string;
  diploma_name: string;
}

/**
 * استجابة جلب الطلاب المستحقين
 */
export interface EligibleStudentsResponse {
  data: EligibleStudent[];
  message?: string;
}

/**
 * استجابة جلب الشهادات الصادرة
 */
export interface IssuedCertificatesResponse {
  data: IssuedCertificate[];
  message?: string;
}

/**
 * استجابة إصدار الشهادة
 */
export interface IssueCertificateResponse {
  success: boolean;
  message: string;
  certificate?: IssuedCertificate;
}

// ------------------------------ //
// واجهة صف الطالب في صفحة خريجي الدبلومة (Endpoints الجديدة)
// ------------------------------ //
export interface AdminDiplomaStudent {
  id: number; // معرف المستخدم/الطالب
  name: string;
  email: string;
  progress: number; // نسبة الإنجاز 0-100
  certificate_status: 'not_generated' | 'processing' | 'generated';
  is_eligible: boolean;
  file_url?: string | null; // رابط/مسار ملف الشهادة بعد التوليد
}

// ---------------------------------------------------------------- //
// 2. دوال إدارة شهادات الدبلومات
// ---------------------------------------------------------------- //

/**
 * [Admin] جلب الطلاب المستحقين للشهادة في دبلومة معينة
 */
export const getEligibleStudents = async (diplomaId: number): Promise<EligibleStudent[]> => {
  try {
    console.log(`[GetEligibleStudents] Sending request to /admin/diplomas/${diplomaId}/eligible-students`);
    const response = await apiClient.get(`/admin/diplomas/${diplomaId}/eligible-students`);
    const result = response.data;
    
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      return result;
    }
    console.warn('[GetEligibleStudents] Unexpected response structure:', result);
    return [];
  } catch (error: any) {
    console.error('[GetEligibleStudents] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب الطلاب المستحقين';
    throw new Error(message);
  }
};

/**
 * [Admin] جلب الشهادات الصادرة لدبلومة معينة
 */
export const getIssuedCertificates = async (diplomaId: number): Promise<IssuedCertificate[]> => {
  try {
    console.log(`[GetIssuedCertificates] Sending request to /admin/diplomas/${diplomaId}/certificates`);
    const response = await apiClient.get(`/admin/diplomas/${diplomaId}/certificates`);
    const result = response.data;
    
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      return result;
    }
    console.warn('[GetIssuedCertificates] Unexpected response structure:', result);
    return [];
  } catch (error: any) {
    console.error('[GetIssuedCertificates] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب الشهادات الصادرة';
    throw new Error(message);
  }
};

/**
 * [Admin] إصدار شهادة دبلومة لطالب معين
 */
export const issueDiplomaCertificate = async (
  diplomaId: number, 
  userId: number
): Promise<IssueCertificateResponse> => {
  try {
    console.log(`[IssueDiplomaCertificate] Sending request to /admin/diplomas/${diplomaId}/issue-certificates`);
    const response = await apiClient.post(`/admin/diplomas/${diplomaId}/issue-certificates`, {
      user_id: userId
    });
    
    const result = response.data;
    
    return {
      success: result.success ?? true,
      message: result.message || 'تم إصدار الشهادة بنجاح',
      certificate: result.certificate
    };
  } catch (error: any) {
    console.error('[IssueDiplomaCertificate] Error:', error);
    const message = error.response?.data?.message || 'فشل في إصدار الشهادة';
    throw new Error(message);
  }
};

// ---------------------------------------------------------------- //
// 3. Endpoints الجديدة المتوافقة مع طلب المستخدم
// ---------------------------------------------------------------- //

/**
 * [Admin] جلب قائمة الطلاب ونِسَب إنجازهم لدبلومة معيّنة
 * GET /admin/diplomas/{id}/students
 */
export const getDiplomaStudentsAdmin = async (diplomaId: number): Promise<AdminDiplomaStudent[]> => {
  try {
    console.log(`[GetDiplomaStudentsAdmin] GET /admin/diplomas/${diplomaId}/students`);
    const response = await apiClient.get(`/admin/diplomas/${diplomaId}/students`);
    const result = response.data;

    const list = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.data?.students)
      ? result.data.students
      : Array.isArray(result?.students)
      ? result.students
      : Array.isArray(result)
      ? result
      : [];
    return (list as any[]).map((s) => {
      const progress = Number(s.progress ?? s.progress_percentage ?? 0);
      const status = (s.certificate_status ?? s.status ?? 'not_generated') as AdminDiplomaStudent['certificate_status'];
      const fileUrl = s.file_url ?? s.certificate_file_url ?? s.file_path ?? null;
      return {
        id: Number(s.student_id ?? s.id ?? s.user_id ?? s.user?.id ?? 0),
        name: String(s.student_name ?? s.name ?? s.user?.name ?? ''),
        email: String(s.email ?? s.user?.email ?? ''),
        progress,
        certificate_status: status,
        is_eligible: Boolean(s.is_eligible ?? progress >= 100),
        file_url: fileUrl ? getDownloadUrl(String(fileUrl)) : null,
      } as AdminDiplomaStudent;
    });
  } catch (error: any) {
    console.error('[GetDiplomaStudentsAdmin] Error:', error);
    const message = error.response?.data?.message || 'فشل في جلب قائمة الطلاب';
    throw new Error(message);
  }
};

/**
 * [Admin] توليد الشهادة لطالب في دبلومة
 * POST /admin/diplomas/{id}/generate-certificate
 */
export const generateDiplomaCertificateForStudent = async (
  diplomaId: number,
  userId: number
): Promise<{ success: boolean; message: string; file_url?: string | null }> => {
  try {
    console.log(`[GenerateDiplomaCertificateForStudent] POST /admin/diplomas/${diplomaId}/students/${userId}/generate-certificate`);
    const response = await apiClient.post(`/admin/diplomas/${diplomaId}/students/${userId}/generate-certificate`);
    const result = response.data;
    return {
      success: Boolean(result?.success ?? true),
      message: String(result?.message || 'تم بدء توليد الشهادة'),
      file_url: result?.file_url ? getDownloadUrl(String(result.file_url)) : undefined,
    };
  } catch (error: any) {
    console.error('[GenerateDiplomaCertificateForStudent] Error:', error);
    const message = error.response?.data?.message || 'فشل في توليد الشهادة';
    throw new Error(message);
  }
};

/**
 * [Admin] تحميل ملف PDF الشهادة
 */
export const downloadCertificatePdf = (fileUrl: string): void => {
  if (!fileUrl) {
    throw new Error('رابط الملف غير متاح');
  }
  
  // إذا كان الرابط نسبيًا، نضيف BASE_URL
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${String(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '')}${fileUrl}`;
  
  // فتح الرابط في نافذة جديدة لتنزيل الملف
  window.open(fullUrl, '_blank');
};

// Types are already exported above with 'export interface' declarations