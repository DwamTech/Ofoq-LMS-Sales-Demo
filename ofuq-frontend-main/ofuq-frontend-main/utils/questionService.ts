import apiClient from './apiClient';

// Interface for question data
export interface QuestionData {
  text: string;
  options: string[];
  correctAnswer: number; // نفترض أنه index
  explanation?: string;
}

// Interface for question response
export interface Question {
  id: number;
  text: string; // اسم الحقل في الواجهة
  question: string; // اسم الحقل من الباك اند
  options: string[];
  correctAnswer: number; // نفترض أنه index
  correct_answer: string | string[] | number | null; // الحقل من الباك اند
  explanation?: string;
  quiz_id?: number;
  created_at?: string;
  updated_at?: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const asQuestionRecord = (value: unknown): Record<string, unknown> => (
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
);

const normalizeQuestion = (value: unknown, quizId?: number): Question => {
  const q = asQuestionRecord(value);
  const correctRaw = q.correct_answer;
  const correctIndex = Array.isArray(correctRaw)
    ? Number(correctRaw[0])
    : Number(correctRaw);

  return {
    id: Number(q.id),
    text: String(q.question ?? ''),
    question: String(q.question ?? ''),
    options: Array.isArray(q.options) ? q.options.map((option) => String(option)) : [],
    correctAnswer: Number.isNaN(correctIndex) ? 0 : correctIndex,
    correct_answer: Array.isArray(correctRaw)
      ? correctRaw.map((item) => String(item))
      : typeof correctRaw === 'number' || typeof correctRaw === 'string'
        ? correctRaw
        : null,
    explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
    quiz_id: quizId ?? Number(q.quiz_id ?? 0),
    created_at: typeof q.created_at === 'string' ? q.created_at : undefined,
    updated_at: typeof q.updated_at === 'string' ? q.updated_at : undefined,
  };
};

/**
 * [Admin] إنشاء سؤال جديد لاختبار معين
 */
export const createQuestion = async (
  quizId: number,
  questionData: QuestionData
): Promise<Question> => {
  try {
    // التحويل من واجهة الفرونت إلى الباك اند
    const payload = {
      question: questionData.text,
      options: questionData.options,
      correct_answer: String(questionData.correctAnswer), // الباك اند يتوقع string
      explanation: questionData.explanation,
    };

    // لاحظ أن الباك اند (File 3) يستخدم /admin/quizzes وليس /api/admin/quizzes
    const response = await apiClient.post(`/admin/quizzes/${quizId}/questions`, payload);

    const q = response.data?.data ?? response.data?.question ?? response.data;
    if (!q) {
      throw new Error(response.data?.message || 'Failed to create question');
    }

    // التحويل من الباك اند إلى واجهة الفرونت
    return normalizeQuestion(q, quizId);
  } catch (error: unknown) {
    console.error('Error creating question:', error);
    throw new Error(getErrorMessage(error, 'An error occurred while creating the question'));
  }
};

/**
 * [Admin] تحديث سؤال موجود
 */
export const updateQuestion = async (
  questionId: number,
  questionData: QuestionData
): Promise<Question> => {
  try {
    const payload = {
      question: questionData.text,
      options: questionData.options,
      correct_answer: String(questionData.correctAnswer),
      explanation: questionData.explanation,
    };

    const response = await apiClient.put(`/admin/questions/${questionId}`, payload);

    const q = response.data?.data ?? response.data?.question ?? response.data;
    if (!q) {
      throw new Error(response.data?.message || 'Failed to update question');
    }

    return normalizeQuestion(q);
  } catch (error: unknown) {
    console.error('Error updating question:', error);
  throw new Error(getErrorMessage(error, 'An error occurred while updating the question'));
  }
};

/**
 * [Admin] حذف سؤال
 */
export const deleteQuestion = async (questionId: number): Promise<void> => {
  try {
    await apiClient.delete(`/admin/questions/${questionId}`);
  } catch (error: unknown) {
    console.error('Error deleting question:', error);
    throw new Error(getErrorMessage(error, 'An error occurred while deleting the question'));
  }
};

/**
 * [Admin] جلب جميع أسئلة اختبار معين
 */
export const getQuizQuestions = async (quizId: number): Promise<Question[]> => {
  try {
    // المسار الصحيح من (File 3)
    const response = await apiClient.get(`/admin/quizzes/${quizId}/questions`);
    
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) {
      return data.map((q) => normalizeQuestion(q, quizId));
    } else {
      throw new Error(response.data.message || 'Failed to fetch questions');
    }
  } catch (error: unknown) {
    console.error('Error fetching questions:', error);
    throw new Error(getErrorMessage(error, 'An error occurred while fetching questions'));
  }
};
