export interface EnrolledDiplomaItem {
  id: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  status: string;
  enrolled_at: string;
  courses_count: number;
  is_free: boolean;
  price: number;
}

export interface DiplomaCertificateItem {
  courseName: string;
  completionDate: string;
  certificateId?: string;
  certificateImage?: string;
  downloadUrl?: string;
  verificationUrl?: string;
}

export interface StudentCourse {
  id: number;
  title: string;
  instructor: string;
  category: string;
  cover_image_url: string;
  status: string;
  progress_percentage: number;
  completed_at: string | null;
  final_exam_score: number | null;
  certificate_id: string | null;
}

import http from './apiClient';

export interface StudentItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  qualification?: string;
  media_work_sector?: string;
  date_of_birth?: string;
  previous_field?: string;
  created_at?: string;
  email_verified_at?: string | null;
  is_blocked?: boolean;
  total_courses?: number;
  total_diplomas?: number;
  completed_courses?: number;
  active_diplomas?: number;
  courses?: Array<any>;
  diplomas?: Array<any>;
}

export interface StudentsPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StudentsStats {
  total_students: number;
  active_students: number;
  blocked_students: number;
}

export interface StudentsResponse {
  data: StudentItem[];
  pagination: StudentsPagination;
  stats?: StudentsStats;
}

// Updated: support page/per_page and return pagination + global stats
export async function getStudentsStatus(page: number = 1, perPage: number = 10): Promise<StudentsResponse> {
  try {
    const response = await http.get('/admin/students', {
      params: { page, per_page: perPage },
    });
    const raw = response?.data ?? {};
    const data: StudentItem[] = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
      ? raw.data.data
      : [];
    const pagination: StudentsPagination = raw?.pagination ?? {
      current_page: page,
      last_page: 1,
      per_page: perPage,
      total: data.length,
    };
    const stats: StudentsStats | undefined = raw?.stats ?? undefined;
    return { data, pagination, stats };
  } catch (error) {
    console.error('Error fetching students status:', error);
    throw error;
  }
}

export async function deleteUser(userId: number): Promise<void> {
  try {
    await http.delete(`/admin/users/${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function blockUser(userId: number): Promise<void> {
  try {
    await http.post('/admin/blocked-users', { user_id: userId });
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
}

export async function unblockUser(userId: number): Promise<void> {
  try {
    await http.delete(`/admin/blocked-users/${userId}`);
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
}

export async function getUserCertificates(userId: number): Promise<DiplomaCertificateItem[]> {
  try {
    const response = await http.get(`/admin/users/${userId}/certificates`);
    const raw = response.data;
    const list = Array.isArray(raw?.certificates)
      ? raw.certificates
      : Array.isArray(raw?.data?.certificates)
      ? raw.data.certificates
      : [];
    return list.map((c: any) => ({
      courseName: c.course_title,
      completionDate: c.completion_date || '',
      certificateId: c.id?.toString(),
      certificateImage: undefined,
      downloadUrl: c.download_url,
      verificationUrl: c.verification_url,
    }));
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    throw error;
  }
}