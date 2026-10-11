import apiClient from './apiClient';
import { useLocalCatalog, localSections } from '@/lib/localCatalog';

export interface Section {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  is_published: boolean;
  display_order?: number | null;
  diplomas_count?: number;
  courses_count?: number;
}

export interface CreateSectionData {
  name: string;
  slug?: string;
  icon?: string;
  is_published?: boolean;
  display_order?: number;
}

export const defaultDiplomaSections: Section[] = [
  { id: 0, name: 'التربوية', slug: 'educational', icon: 'PiChalkboardTeacher', is_published: true, display_order: 1 },
  { id: 0, name: 'الدعوية', slug: 'dawah', icon: 'PiMosque', is_published: true, display_order: 2 },
  { id: 0, name: 'الإعلامية', slug: 'media', icon: 'PiMegaphone', is_published: true, display_order: 3 },
  { id: 0, name: 'الإدارية', slug: 'management', icon: 'PiBriefcase', is_published: true, display_order: 4 },
  { id: 0, name: 'الشرعية', slug: 'sharia', icon: 'PiScroll', is_published: true, display_order: 5 },
  { id: 0, name: 'تطوير الذات', slug: 'self-development', icon: 'PiHeart', is_published: true, display_order: 6 },
  { id: 0, name: 'التقنية', slug: 'tech', icon: 'PiCode', is_published: true, display_order: 7 },
  { id: 0, name: 'السلوكية', slug: 'behavioral', icon: 'PiBrain', is_published: true, display_order: 8 },
  { id: 0, name: 'المهنية', slug: 'professional', icon: 'PiWrench', is_published: true, display_order: 9 },
  { id: 0, name: 'خدمة المجتمع', slug: 'community-service', icon: 'PiHandHeart', is_published: true, display_order: 10 },
];

type ApiListResponse<T> = {
  data?: T[];
};

const normalizeSectionsResponse = (result: ApiListResponse<Section> | Section[]): Section[] => {
  if (!Array.isArray(result) && Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
};

export const getPublicSections = async (): Promise<Section[]> => {
  if (useLocalCatalog) return localSections();
  const response = await apiClient.get('/sections');
  return normalizeSectionsResponse(response.data);
};

export const getPublicSectionsSafe = async (): Promise<Section[]> => {
  try {
    const sections = await getPublicSections();
    return sections;
  } catch (error) {
    console.error('[GetPublicSectionsSafe] Error:', error);
    return [];
  }
};

export const getAdminSections = async (): Promise<Section[]> => {
  const response = await apiClient.get('/admin/sections');
  return normalizeSectionsResponse(response.data);
};

export const createSection = async (data: CreateSectionData): Promise<Section> => {
  const response = await apiClient.post('/admin/sections', data);
  return response.data?.data || response.data;
};

export const updateSection = async (id: number, data: Partial<CreateSectionData>): Promise<Section> => {
  const response = await apiClient.put(`/admin/sections/${id}`, data);
  return response.data?.data || response.data;
};

export const deleteSection = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/sections/${id}`);
};
