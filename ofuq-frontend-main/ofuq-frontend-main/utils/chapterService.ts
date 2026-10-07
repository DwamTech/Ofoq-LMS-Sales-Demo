import apiClient from './apiClient';

/**
 * Chapter Type Definition
 */
export interface Chapter {
    id: number;
    title: string;
    description?: string;
    order: number;
    lessons_count: number;
    course_id: number;
    created_at?: string;
    updated_at?: string;
}

interface ChapterResponse {
    data?: Chapter;
    chapter?: Chapter;
    message?: string;
}

interface ChaptersListResponse {
    data: Chapter[];
    message?: string;
}

const unwrapChapterResponse = (payload: ChapterResponse | Chapter): Chapter | null => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    if ('data' in payload && payload.data) {
        return payload.data;
    }

    if ('chapter' in payload && payload.chapter) {
        return payload.chapter;
    }

    if ('id' in payload && 'title' in payload) {
        return payload as Chapter;
    }

    return null;
};

const getValidationMessage = (error: unknown): string | null => {
    const response = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } })?.response;
    if (response?.status !== 422 || !response.data?.errors) {
        return null;
    }

    const errorMessages = Object.values(response.data.errors).flat().join('\n');
    return `خطأ في البيانات:\n${errorMessages}`;
};

/**
 * [Admin] جلب قائمة الفصول لكورس معين
 */
export const getCourseChapters = async (courseId: number | string): Promise<Chapter[]> => {
    try {
        const response = await apiClient.get<ChaptersListResponse>(
            `/admin/courses/${courseId}/chapters`
        );

        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        console.error('Unexpected API response structure:', response.data);
        return [];
    } catch (error) {
        console.error('Error fetching chapters:', error);
        throw new Error('Failed to fetch chapters');
    }
};

/**
 * [Admin] إنشاء فصل جديد
 */
export const createChapter = async (
    courseId: number | string,
    chapterData: {
        title: string;
        description?: string;
        order: number;
    }
): Promise<Chapter> => {
    try {
        const response = await apiClient.post<ChapterResponse>(
            `/admin/courses/${courseId}/chapters`,
            chapterData
        );

        const chapter = unwrapChapterResponse(response.data);
        if (chapter) {
            return { ...chapterData, ...chapter } as Chapter;
        }

        throw new Error('API response was successful but improperly formatted.');
    } catch (error: unknown) {
        console.error('Error creating chapter:', error);

        const validationMessage = getValidationMessage(error);
        if (validationMessage) {
            throw new Error(validationMessage);
        }

        throw new Error('Failed to create chapter');
    }
};

/**
 * [Admin] تحديث فصل موجود
 */
export const updateChapter = async (
    chapterId: number | string,
    chapterData: {
        title?: string;
        description?: string;
        order?: number;
    }
): Promise<Chapter> => {
    try {
        const response = await apiClient.put<ChapterResponse>(
            `/admin/chapters/${chapterId}`,
            chapterData
        );

        const chapter = unwrapChapterResponse(response.data);
        if (chapter) {
            return { ...chapterData, ...chapter } as Chapter;
        }

        throw new Error('API response was successful but improperly formatted.');
    } catch (error: unknown) {
        console.error('Error updating chapter:', error);

        const validationMessage = getValidationMessage(error);
        if (validationMessage) {
            throw new Error(validationMessage);
        }

        throw new Error('Failed to update chapter');
    }
};

/**
 * [Admin] حذف فصل
 */
export const deleteChapter = async (chapterId: number | string): Promise<void> => {
    try {
        await apiClient.delete(`/admin/chapters/${chapterId}`);
    } catch (error) {
        console.error('Error deleting chapter:', error);
        throw new Error('Failed to delete chapter');
    }
};
