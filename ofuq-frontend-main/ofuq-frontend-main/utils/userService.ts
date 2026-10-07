import apiClient from './apiClient';

export interface EnrollmentProfile {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  profile_picture?: string | null;
  qualification?: string | null;
  media_work_sector?: string | null;
  date_of_birth?: string | null; // YYYY-MM-DD
  previous_field?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EnrollmentUpdatePayload {
  qualification: string;
  media_work_sector: string;
  date_of_birth: string; // YYYY-MM-DD
  previous_field: string;
}

export const getUserProfile = async (): Promise<EnrollmentProfile> => {
  const res = await apiClient.get('/user/profile');
  return res.data.user;
};

export const updateUserProfile = async (
  payload: Partial<EnrollmentUpdatePayload> & { name?: string; profile_picture?: string }
): Promise<EnrollmentProfile> => {
  const res = await apiClient.put('/user/profile', payload);
  return res.data.user ?? res.data;
};