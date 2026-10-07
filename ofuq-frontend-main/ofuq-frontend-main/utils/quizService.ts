'use client';

import apiClient from './apiClient';
import { Question } from './questionService';

// Interfaces
export interface Quiz {
  id: number;
  title: string;
  description?: string | null;
}

export interface QuizData {
  title: string;
  description?: string;
  passing_score?: number;
}

export interface CourseFinalExamMetaData {
  quiz_id: number;
  questions_pool_count: number;
  has_sufficient_question_bank: boolean;
  // الحقول السابقة لأغراض التوافق
  attempts_count?: number;
  // حقول سياسة التهدئة والحدود وفق الباك إند الجديد
  attempts_total?: number;
  attempts_today?: number;
  last_attempt_at?: string | null;
  next_allowed_at?: string | null;
  remaining_cooldown_seconds?: number;
  retake_cooldown_seconds?: number;
  max_attempts_per_day?: number;
  max_attempts_total?: number;
  eligible_to_start?: boolean; // شرط إكمال المقرر
  is_allowed_now?: boolean; // جاهزية البدء حسب السياسة + الإكمال
}

export interface DiplomaFinalExamMetaData {
  quiz_id: number;
  questions_pool_count: number;
  prerequisites_met: boolean;
  attempts_count: number;
}

// Add type alias for backward compatibility
export type FinalExamMetaData = CourseFinalExamMetaData;

export interface StartExamResponse {
  attempt_id: number;
  quiz_id: number;
  // نحافظ على شكل مبسط متوافق مع مكونات العرض (id, question, options)
  questions: Array<{ id: number; question: string; options: string[] }>;
}

export interface QuizAttempt {
  id: number;
  score: number;
  total_questions?: number;
  correct_answers?: number;
  passed?: boolean;
  time_taken?: number;
  created_at?: string;
}

// Admin Functions
export const createCourseQuiz = async (
  courseId: number | string,
  data: QuizData
): Promise<Quiz> => {
  try {
    const response = await apiClient.post(`/admin/courses/${courseId}/quizzes`, data);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('Error creating/updating course quiz:', error);
    throw new Error(error.response?.data?.message || 'فشل في إنشاء اختبار الكورس');
  }
};

export const createLessonQuiz = async (
  lessonId: number | string,
  data: QuizData = { title: 'اختبار الدرس' }
): Promise<Quiz> => {
  try {
    const response = await apiClient.post(`/admin/lessons/${lessonId}/quiz`, data);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('Error creating lesson quiz:', error);
    throw new Error(error.response?.data?.message || 'فشل في إنشاء اختبار الدرس');
  }
};

export const getOrCreateLessonQuiz = async (
  lessonId: number | string,
  defaultTitle = 'اختبار الدرس'
): Promise<Quiz> => {
  try {
    // استخدم مسار المستخدم لقراءة كويز الدرس (متاح للمشرف أيضًا)
    const response = await apiClient.get(`/lessons/${lessonId}/quiz`);
    const payload = response.data?.data ?? response.data;
    const quizObj = payload?.quiz ?? payload;

    return {
      id: Number(quizObj.id),
      title: String(quizObj.title),
      description: quizObj.description ?? null,
    };
  } catch (error: any) {
    const status = error?.response?.status;
    // إذا لم يوجد الكويز (404) أو كان المسار غير مدعوم GET (405)، أنشئ الكويز
    if (status === 404 || status === 405) {
      return await createLessonQuiz(lessonId, { title: defaultTitle });
    }
    // لأخطاء أخرى، سجل وأعد رمي الخطأ
    console.error('Error in getOrCreateLessonQuiz:', error);
    throw new Error(error.response?.data?.message || 'فشل في جلب أو إنشاء اختبار الدرس');
  }
};

export const createDiplomaFinalExam = async (
  categoryId: number | string,
  data: QuizData
): Promise<Quiz> => {
  try {
    const response = await apiClient.post(`/admin/categories/${categoryId}/final-exam`, data);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('Error creating/updating diploma final exam:', error);
    throw new Error(error.response?.data?.message || 'فشل في إنشاء امتحان الدبلومة');
  }
};

export const getOrCreateDiplomaFinalExam = async (
  categoryId: number | string,
  defaultTitle = 'امتحان نهائي الدبلومة'
): Promise<Quiz> => {
  try {
    const res = await apiClient.get(`/admin/categories/${categoryId}/final-exam`);
    return res.data?.data ?? res.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404) {
      return await createDiplomaFinalExam(categoryId, { title: defaultTitle });
    }
    console.error('Error fetching diploma final exam:', error);
    throw new Error(error.response?.data?.message || 'فشل في جلب/إنشاء امتحان الدبلومة');
  }
};

export const getQuizDetails = async (quizId: number | string): Promise<Quiz> => {
  try {
    const response = await apiClient.get(`/admin/quizzes/${quizId}`);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('Error fetching quiz details:', error);
    throw new Error(error.response?.data?.message || 'فشل في جلب تفاصيل الاختبار');
  }
};

// User Functions
export async function getCourseFinalExamMeta(
  courseId: number | string
): Promise<CourseFinalExamMetaData> {
  try {
    const res = await apiClient.get(`/courses/${courseId}/final-exam/meta`);
    const meta = res?.data?.data ?? res?.data;
    // دعم كلا الشكلين من الردود (القديم والجديد)
    const mapped: CourseFinalExamMetaData = {
      quiz_id: Number(meta?.quiz_id ?? 0),
      questions_pool_count: Number(meta?.questions_pool_count ?? 0),
      has_sufficient_question_bank: Boolean(meta?.has_sufficient_question_bank ?? false),
      attempts_count: meta?.attempts_count !== undefined ? Number(meta?.attempts_count) : undefined,
      attempts_total: meta?.attempts_total !== undefined ? Number(meta?.attempts_total) : undefined,
      attempts_today: meta?.attempts_today !== undefined ? Number(meta?.attempts_today) : undefined,
      last_attempt_at: meta?.last_attempt_at ?? null,
      next_allowed_at: meta?.next_allowed_at ?? null,
      remaining_cooldown_seconds: meta?.remaining_cooldown_seconds !== undefined ? Number(meta?.remaining_cooldown_seconds) : undefined,
      retake_cooldown_seconds: meta?.retake_cooldown_seconds !== undefined ? Number(meta?.retake_cooldown_seconds) : undefined,
      max_attempts_per_day: meta?.max_attempts_per_day !== undefined ? Number(meta?.max_attempts_per_day) : undefined,
      max_attempts_total: meta?.max_attempts_total !== undefined ? Number(meta?.max_attempts_total) : undefined,
      eligible_to_start: meta?.eligible_to_start !== undefined ? Boolean(meta?.eligible_to_start) : undefined,
      is_allowed_now: meta?.is_allowed_now !== undefined ? Boolean(meta?.is_allowed_now) : undefined,
    };

    // إن لم يتوفر attempts_count، احسبه من الإجمالي لأغراض التوافق
    if (mapped.attempts_count === undefined && mapped.attempts_total !== undefined) {
      mapped.attempts_count = mapped.attempts_total;
    }
    return mapped;
  } catch (error: any) {
    console.error('Error fetching course final exam meta:', error);
    throw new Error(error.response?.data?.message || 'فشل في جلب بيانات امتحان الكورس');
  }
}

// محاولة نشطة للامتحان النهائي للمقرر (استئناف بأمان)
export async function getActiveCourseFinalExamAttempt(
  courseId: number | string
): Promise<StartExamResponse | null> {
  try {
    const res = await apiClient.get(`/courses/${courseId}/final-exam/attempt/active`);
    const data = res?.data?.data ?? res?.data;

    // Handle success: false response (no active attempt) - backend returns 200 with success: false
    if (data?.success === false || data?.error_type === 'no_active_attempt') {
      return null;
    }

    // دعم أشكال متعددة للأسئلة كما في startCourseFinalExam
    let rawQuestions: any = undefined;
    if (Array.isArray(data?.questions)) {
      rawQuestions = data.questions;
    } else if (Array.isArray(data?.quiz?.questions)) {
      rawQuestions = data.quiz.questions;
    } else if (Array.isArray(data?.selected_questions)) {
      rawQuestions = data.selected_questions;
    } else if (Array.isArray(data?.exam?.questions)) {
      rawQuestions = data.exam.questions;
    } else if (Array.isArray(data?.questions?.data)) {
      rawQuestions = data.questions.data;
    }

    const mappedQuestions: Array<{ id: number; question: string; options: string[] }> = Array.isArray(rawQuestions)
      ? rawQuestions.map((q: any) => ({
        id: Number(q?.id ?? q?.question_id ?? 0),
        question: String(q?.question ?? q?.text ?? ''),
        options: Array.isArray(q?.options) ? q.options.map((opt: any) => String(opt)) : [],
      }))
      : [];

    return {
      attempt_id: Number(data?.attempt_id ?? data?.attempt?.id ?? 0),
      quiz_id: Number(data?.quiz_id ?? data?.quiz?.id ?? 0),
      questions: mappedQuestions,
    };
  } catch (error: any) {
    const status = error?.response?.status;
    const errorType = error?.response?.data?.error_type;
    const message = error?.response?.data?.message;

    // Handle 401 authentication errors separately
    if (status === 401) {
      console.error('Authentication error fetching active final exam attempt:', error);
      throw new Error('يجب تسجيل الدخول للوصول إلى الامتحان');
    }

    // Handle different types of 404 errors
    if (status === 404) {
      // Distinguish between different 404 scenarios based on error_type
      if (errorType === 'no_active_attempt') {
        // This is the expected case - no active attempt exists
        return null;
      } else if (errorType === 'course_not_found') {
        console.error(`Course not found (ID: ${courseId}):`, error);
        throw new Error(`الدورة غير موجودة (معرف: ${courseId})`);
      } else if (errorType === 'no_final_exam') {
        console.error(`No final exam configured for course ${courseId}:`, error);
        throw new Error('لا يوجد امتحان نهائي لهذه الدورة');
      } else {
        // Generic 404 - treat as no active attempt for backward compatibility
        return null;
      }
    }

    // Handle other errors with context
    console.error(`Error fetching active final exam attempt (Course: ${courseId}, Status: ${status}):`, error);
    throw new Error(message || 'فشل في جلب المحاولة النشطة');
  }
}

// إلغاء محاولة الامتحان النهائي (طالب)
export async function cancelCourseFinalExam(
  courseId: number | string,
  attemptId: number | string
): Promise<any> {
  try {
    const res = await apiClient.post(`/courses/${courseId}/final-exam/cancel/${attemptId}`);
    return res?.data?.data ?? res?.data;
  } catch (error: any) {
    console.error('Error canceling final exam attempt:', error);
    throw new Error(error?.response?.data?.message || 'فشل في إلغاء المحاولة');
  }
}

// بدء الامتحان النهائي للمقرر (طالب)
export async function startCourseFinalExam(
  courseId: number | string
): Promise<StartExamResponse> {
  try {
    const res = await apiClient.post(`/courses/${courseId}/final-exam/start`);
    const data = res.data?.data ?? res.data;

    // حاول استخراج الأسئلة من عدة أشكال محتملة من رد الباك إند
    // الأولوية: data.questions → data.quiz.questions → data.selected_questions → data.exam.questions → data.questions.data
    let rawQuestions: any = undefined;
    if (Array.isArray(data?.questions)) {
      rawQuestions = data.questions;
    } else if (Array.isArray(data?.quiz?.questions)) {
      rawQuestions = data.quiz.questions;
    } else if (Array.isArray(data?.selected_questions)) {
      rawQuestions = data.selected_questions;
    } else if (Array.isArray(data?.exam?.questions)) {
      rawQuestions = data.exam.questions;
    } else if (Array.isArray(data?.questions?.data)) {
      rawQuestions = data.questions.data;
    }

    // حوّل الأسئلة لشكل موحّد يناسب المكونات (id, question, options)
    const mappedQuestions: Array<{ id: number; question: string; options: string[] }> = Array.isArray(rawQuestions)
      ? rawQuestions.map((q: any) => ({
        id: Number(q?.id ?? q?.question_id ?? 0),
        question: String(q?.question ?? q?.text ?? ''),
        options: Array.isArray(q?.options) ? q.options.map((opt: any) => String(opt)) : [],
      }))
      : [];

    return {
      attempt_id: Number(data?.attempt_id ?? data?.attempt?.id ?? 0),
      quiz_id: Number(data?.quiz_id ?? data?.quiz?.id ?? 0),
      questions: mappedQuestions,
    };
  } catch (error: any) {
    console.error('Error starting course final exam:', error);
    // أنشئ خطأً يحافظ على رسالة مفهومة ويحتفظ بـ response لقراءة status/code في الواجهة
    const message = error?.response?.data?.message || error?.message || 'فشل في بدء الامتحان';
    const errObj: any = new Error(message);
    errObj.response = error?.response;
    throw errObj;
  }
}

// إرسال إجابات الامتحان النهائي للمقرر (طالب)
export async function submitCourseFinalExam(
  courseId: number | string,
  attemptId: number | string,
  payload: {
    answers: Array<{ question_id: number; selected_indices: number[] }>;
    time_taken?: number;
  }
): Promise<{
  score: number;
  passed: boolean;
  correct_answers?: number;
  total_questions?: number;
  passing_score?: number;
}> {
  try {
    const res = await apiClient.post(`/courses/${courseId}/final-exam/submit/${attemptId}`, payload);
    return res.data?.data ?? res.data;
  } catch (error: any) {
    console.error('Error submitting course final exam:', error);
    const message = error?.response?.data?.message || 'فشل في إرسال الإجابات';
    throw new Error(message);
  }
}

export async function getDiplomaFinalExamMeta(
  categoryId: number | string
): Promise<DiplomaFinalExamMetaData> {
  try {
    const res = await apiClient.get(`/categories/${categoryId}/final-exam/meta`);
    const meta = res?.data?.data ?? res?.data;
    return {
      quiz_id: Number(meta?.quiz_id ?? 0),
      questions_pool_count: Number(meta?.questions_pool_count ?? 0),
      prerequisites_met: Boolean(meta?.prerequisites_met ?? false),
      attempts_count: Number(meta?.attempts_count ?? 0),
    };
  } catch (error: any) {
    console.error('Error fetching diploma final exam meta:', error);
    throw new Error(error.response?.data?.message || 'فشل في جلب بيانات امتحان الدبلومة');
  }
}

export async function startDiplomaFinalExam(
  categoryId: number | string
): Promise<StartExamResponse> {
  try {
    const res = await apiClient.post(`/categories/${categoryId}/final-exam/start`);
    const data = res.data?.data ?? res.data;

    if (!data || !Array.isArray(data.questions)) {
      throw new Error('بيانات بدء الامتحان غير صالحة');
    }

    return {
      attempt_id: Number(data.attempt_id),
      quiz_id: Number(data.quiz_id),
      questions: data.questions,
    };
  } catch (error: any) {
    console.error('Error starting diploma final exam:', error);
    throw new Error(error.response?.data?.message || 'فشل في بدء الامتحان');
  }
}

export async function getQuizAttempts(
  quizId: number | string
): Promise<QuizAttempt[]> {
  const res = await apiClient.get(`/quiz/${quizId}/attempts`);
  const payload = res?.data;
  const items = Array.isArray(payload?.attempts)
    ? payload.attempts
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  return items.map((a: any) => ({
    id: Number(a.id ?? a.attempt_id ?? 0),
    score: Number(a.score ?? 0),
    total_questions: Number(a.total_questions ?? 0),
    correct_answers: Number(a.correct_answers ?? 0),
    passed: Boolean(a.passed ?? false),
    time_taken: Number(a.time_taken ?? 0),
    created_at: a.created_at ?? undefined,
  }));
}

export async function submitQuizAnswers(
  quizId: number | string,
  answers: Array<{ question_id: number; selected_indices: number[] | number }>,
  timeTaken?: number
): Promise<QuizAttempt> {
  try {
    const response = await apiClient.post(`/quiz/${quizId}/submit`, {
      answers,
      time_taken: timeTaken
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error submitting quiz answers:', error);
    throw new Error(error?.response?.data?.message ?? 'فشل في إرسال إجابات الاختبار');
  }
}




export interface LessonQuiz {
  id: number;
  title: string;
  description?: string | null;
  max_attempts?: number;
  passing_score?: number;
  time_limit?: number;
  attempts_used?: number;
  attempts_remaining?: number;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    type: 'single' | 'multiple';
    correctAnswer: number | number[] | null;
  }>;
}

export async function getLessonQuiz(lessonId: number): Promise<LessonQuiz | null> {
  try {
    const res = await apiClient.get(`/lessons/${lessonId}/quiz`);
    const payload = res?.data?.data ?? res?.data;
    if (!payload) return null;

    const quiz = payload.quiz ?? payload;

    return {
      id: Number(quiz.id),
      title: String(quiz.title),
      description: quiz.description,
      max_attempts: quiz.max_attempts,
      passing_score: quiz.passing_score,
      time_limit: quiz.time_limit,
      attempts_used: quiz.attempts_used,
      attempts_remaining: quiz.attempts_remaining,
      questions: Array.isArray(quiz.questions) ? quiz.questions.map((q: any) => ({
        id: Number(q.id),
        question: String(q.question),
        type: q.type ?? 'single',
        options: Array.isArray(q.options) ? q.options.map((opt: any) => String(opt)) : [],
        correctAnswer: q.correct_answer ?? null,
      })) : [],
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.warn('[QuizService] 404: No quiz found for lesson', lessonId);
      return null;
    }
    throw error;
  }
}