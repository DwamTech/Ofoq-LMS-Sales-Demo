import apiClient from './apiClient';

/**
 * Lesson Type Definition
 */
export interface Lesson {
  id: number;
  title: string;
  content?: string;
  order: number;
  video_url?: string;
  video_guid?: string;
  video_status?: string;
  thumbnail?: string;
  is_visible: boolean;
  attachments?: any[];
  resources?: any[];
  views?: number;
  chapter_id: number;
  created_at?: string;
  updated_at?: string;
}

interface LessonResponse {
  data: Lesson;
  message: string;
}

interface LessonsListResponse {
  data: Lesson[];
  message?: string;
}

const videoTrackingWarningAt: Record<string, number> = {};

const warnVideoTrackingFailure = (key: string, message: string, error: unknown) => {
  const now = Date.now();
  if (now - (videoTrackingWarningAt[key] ?? 0) < 60000) {
    return;
  }

  videoTrackingWarningAt[key] = now;
  console.warn(message, error);
};

/**
 * [Admin] جلب قائمة الدروس لفصل معين
 */
export const getChapterLessons = async (chapterId: number | string): Promise<Lesson[]> => {
  try {
    const response = await apiClient.get<LessonsListResponse>(
      `/admin/chapters/${chapterId}/lessons`
    );

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    console.error('Unexpected API response structure:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw new Error('Failed to fetch lessons');
  }
};

/**
 * [Admin] إنشاء درس جديد
 */
export const createLesson = async (
  chapterId: number | string,
  lessonData: {
    title: string;
    content?: string;
    order: number;
    video_url?: string;
    video_guid?: string;
    is_visible?: boolean;
  }
): Promise<Lesson> => {
  try {
    const response = await apiClient.post<LessonResponse>(
      `/admin/chapters/${chapterId}/lessons`,
      lessonData
    );

    if (response.data) {
      if (response.data.data) {
        return response.data.data;
      }
      if ((response.data as any).lesson) {
        return (response.data as any).lesson;
      }
    }

    throw new Error('API response was successful but improperly formatted.');
  } catch (error: any) {
    console.error('Error creating lesson:', error);

    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors;
      const errorMessages = Object.values(errors).flat().join('\n');
      throw new Error(`خطأ في البيانات:\n${errorMessages}`);
    }

    throw new Error('Failed to create lesson');
  }
};

/**
 * [Admin] تحديث درس موجود
 */
export const updateLesson = async (
  lessonId: number | string,
  lessonData: {
    title?: string;
    content?: string;
    order?: number;
    video_url?: string;
    video_guid?: string;
    is_visible?: boolean;
  }
): Promise<Lesson> => {
  try {
    const response = await apiClient.put<LessonResponse>(
      `/admin/lessons/${lessonId}`,
      lessonData
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('API response was successful but improperly formatted.');
  } catch (error: any) {
    console.error('Error updating lesson:', error);

    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors;
      const errorMessages = Object.values(errors).flat().join('\n');
      throw new Error(`خطأ في البيانات:\n${errorMessages}`);
    }

    throw new Error('Failed to update lesson');
  }
};

/**
 * [Admin] حذف درس
 */
export const deleteLesson = async (lessonId: number | string): Promise<void> => {
  try {
    await apiClient.delete(`/admin/lessons/${lessonId}`);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw new Error('Failed to delete lesson');
  }
};

/**
 * [Admin] تبديل حالة ظهور الدرس
 */
export const toggleLessonVisibility = async (lessonId: number | string): Promise<Lesson> => {
  try {
    const response = await apiClient.patch<LessonResponse>(
      `/admin/lessons/${lessonId}/toggle-visibility`
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('API response was successful but improperly formatted.');
  } catch (error) {
    console.error('Error toggling lesson visibility:', error);
    throw new Error('Failed to toggle lesson visibility');
  }
};

// ==================== Student/User Functions ====================

export interface LessonNavigation {
  prev: { id: number; chapterId: number } | null;
  next: { id: number; chapterId: number } | null;
  is_next_last: boolean;
}

interface UserLessonResponse {
  lesson: Lesson;
  navigation?: LessonNavigation;
}

/**
 * [Student] جلب درس للطالب
 */
export const getUserLesson = async (lessonId: number | string): Promise<UserLessonResponse> => {
  try {
    const response = await apiClient.get<{ message: string; lesson: Lesson }>(`/lessons/${lessonId}`);

    if (response.data && response.data.lesson) {
      return { lesson: response.data.lesson };
    }

    console.error('Unexpected API response structure:', response.data);
    throw new Error('API response missing lesson data. Expected {message, lesson} structure.');
  } catch (error) {
    console.error('Error fetching user lesson:', error);
    throw new Error('Failed to fetch lesson');
  }
};

/**
 * [Student] إكمال درس
 */
export const completeLesson = async (
  lessonId: number | string,
  data?: {
    session_id?: number | null;
    completion_source?: 'tracking' | 'manual' | 'legacy';
  }
): Promise<void> => {
  try {
    await apiClient.post(`/lessons/${lessonId}/complete`, data);
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw new Error('Failed to complete lesson');
  }
};

export type VideoWatchEventType =
  | 'started'
  | 'play'
  | 'pause'
  | 'seek'
  | 'progress'
  | 'completed';

export interface StartWatchSessionPayload {
  video_guid?: string | null;
  duration_seconds?: number;
  position_seconds?: number;
  device_id?: string;
}

export interface StartWatchSessionResponse {
  session_id: number | null;
  tracking_enabled?: boolean;
  heartbeat_interval?: number;
  completed?: boolean;
  last_position_seconds?: number;
  current_progress?: {
    status?: string;
    progress_percentage?: number;
    watch_duration_seconds?: number;
    last_watched_at?: string | null;
    last_position_seconds?: number;
    completed_at?: string | null;
  };
}

export interface WatchEventPayload {
  event_type: VideoWatchEventType;
  position_seconds: number;
  duration_seconds?: number;
  watched_delta_seconds?: number;
  playback_rate?: number;
  metadata?: Record<string, unknown>;
}

export const startLessonWatchSession = async (
  lessonId: number | string,
  data: StartWatchSessionPayload = {}
): Promise<StartWatchSessionResponse | null> => {
  try {
    const response = await apiClient.post<StartWatchSessionResponse>(
      `/lessons/${lessonId}/watch/start`,
      data
    );

    return response.data ?? null;
  } catch (error) {
    warnVideoTrackingFailure('start', '[VideoTracking] Failed to start watch session:', error);
    return null;
  }
};

export const recordWatchEvent = async (
  sessionId: number | string,
  data: WatchEventPayload
): Promise<boolean> => {
  try {
    await apiClient.post(`/watch-sessions/${sessionId}/events`, data);
    return true;
  } catch (error) {
    warnVideoTrackingFailure('event', '[VideoTracking] Failed to record watch event:', error);
    return false;
  }
};

export const sendWatchHeartbeat = async (
  sessionId: number | string,
  data: {
    position_seconds: number;
    duration_seconds?: number;
    is_playing: boolean;
  }
): Promise<boolean> => {
  try {
    await apiClient.post(`/watch-sessions/${sessionId}/heartbeat`, data);
    return true;
  } catch (error) {
    warnVideoTrackingFailure('heartbeat', '[VideoTracking] Failed to send heartbeat:', error);
    return false;
  }
};

/**
 * [Student] جلب معلومات التنقل للدرس (السابق/التالي)
 */
export const getLessonNavigation = async (lessonId: number | string): Promise<LessonNavigation> => {
  try {
    const response = await apiClient.get<{ data: LessonNavigation }>(`/lessons/${lessonId}/navigation`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('API response was successful but improperly formatted.');
  } catch (error) {
    console.error('Error fetching lesson navigation:', error);
    throw new Error('Failed to fetch lesson navigation');
  }
};
