import apiClient from './apiClient';
import type {
  CourseReportResponse,
  BeneficiaryReportData,
  BeneficiaryReportResponse,
  DiplomaReportResponse,
  LessonReportResponse,
  ReportDetailData,
  ReportFilters,
  ReportsOverviewData,
  ReportsOverviewResponse,
  StudentReportResponse,
} from '@/types/reports';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const buildParams = (filters?: ReportFilters) => ({
  ...(filters?.from ? { from: filters.from } : {}),
  ...(filters?.to ? { to: filters.to } : {}),
  ...(filters?.limit ? { limit: filters.limit } : {}),
  ...(filters?.course_id ? { course_id: filters.course_id } : {}),
  ...(filters?.category_id ? { category_id: filters.category_id } : {}),
  ...(filters?.diploma_id ? { diploma_id: filters.diploma_id } : {}),
  ...(filters?.status ? { status: filters.status } : {}),
  ...(filters?.page ? { page: filters.page } : {}),
  ...(filters?.per_page ? { per_page: filters.per_page } : {}),
  ...(filters?.lessons_page ? { lessons_page: filters.lessons_page } : {}),
  ...(filters?.students_page ? { students_page: filters.students_page } : {}),
  ...(filters?.courses_page ? { courses_page: filters.courses_page } : {}),
});

const unwrapData = <T extends Record<string, unknown>>(payload: unknown): T => {
  if (isRecord(payload) && isRecord(payload.data)) {
    return payload.data as T;
  }

  return isRecord(payload) ? (payload as T) : ({} as T);
};

const detailError = (error: unknown, fallback: string): never => {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
      ? (error as { response: { data: { message: string } } }).response.data.message
      : fallback;
  throw new Error(message);
};

export async function getReportsOverview(filters?: ReportFilters): Promise<ReportsOverviewData> {
  try {
    const response = await apiClient.get<ReportsOverviewResponse | ReportsOverviewData>(
      '/admin/reports/overview',
      { params: buildParams(filters), cacheTTL: 30 }
    );

    return unwrapData<ReportsOverviewData>(response.data);
  } catch (error: unknown) {
    throw error;
  }
}

export async function getBeneficiaryReport(filters?: Pick<ReportFilters, 'from' | 'to'>): Promise<BeneficiaryReportData> {
  try {
    const response = await apiClient.get<BeneficiaryReportResponse | BeneficiaryReportData>(
      '/admin/reports/beneficiaries',
      { params: buildParams(filters), cacheTTL: 30 }
    );

    return unwrapData<BeneficiaryReportData>(response.data);
  } catch (error: unknown) {
    return detailError(error, 'فشل تحميل تقرير المستفيدين');
  }
}

export async function downloadBeneficiaryPdf(filters?: Pick<ReportFilters, 'from' | 'to'>): Promise<Blob> {
  const response = await apiClient.get<Blob>('/admin/reports/beneficiaries/pdf', {
    params: buildParams(filters),
    responseType: 'blob',
    cacheTTL: 0,
  });

  return response.data;
}

export async function getStudentReport(
  studentId: number | string,
  filters?: ReportFilters
): Promise<ReportDetailData> {
  try {
    const response = await apiClient.get<StudentReportResponse | ReportDetailData>(
      `/admin/reports/students/${studentId}`,
      { params: buildParams(filters), cacheTTL: 30 }
    );

    return unwrapData<ReportDetailData>(response.data);
  } catch (error: unknown) {
    return detailError(error, 'فشل تحميل تقرير الطالب');
  }
}

export async function getLessonReport(
  lessonId: number | string,
  filters?: ReportFilters
): Promise<ReportDetailData> {
  try {
    const response = await apiClient.get<LessonReportResponse | ReportDetailData>(
      `/admin/reports/lessons/${lessonId}`,
      { params: buildParams(filters), cacheTTL: 30 }
    );

    return unwrapData<ReportDetailData>(response.data);
  } catch (error: unknown) {
    return detailError(error, 'فشل تحميل تقرير الدرس');
  }
}

export async function getCourseReport(
  courseId: number | string,
  filters?: ReportFilters
): Promise<ReportDetailData> {
  try {
    const response = await apiClient.get<CourseReportResponse | ReportDetailData>(
      `/admin/reports/courses/${courseId}`,
      { params: buildParams(filters), cacheTTL: 30 }
    );

    return unwrapData<ReportDetailData>(response.data);
  } catch (error: unknown) {
    return detailError(error, 'فشل تحميل تقرير المقرر');
  }
}

export async function getDiplomaReport(
  categoryId: number | string,
  filters?: ReportFilters
): Promise<ReportDetailData> {
  try {
    const response = await apiClient.get<DiplomaReportResponse | ReportDetailData>(
      `/admin/reports/diplomas/${categoryId}`,
      { params: buildParams(filters), cacheTTL: 30 }
    );

    return unwrapData<ReportDetailData>(response.data);
  } catch (error: unknown) {
    return detailError(error, 'فشل تحميل تقرير الدبلومة');
  }
}
