'use client';

import React, { useState } from 'react';
import { updateLessonAdmin } from '../../utils/lessonService';
import Toast from '../Toast';
import '../../styles/lesson-questions.css';
import '../../styles/toast.css';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface LessonQuestionManagerProps {
  lessonId: string;
  quizId?: number;
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  onQuizCreated?: (quizId: number) => void;
}

const LessonQuestionManager: React.FC<LessonQuestionManagerProps> = ({
  lessonId,
  quizId,
  questions,
  onQuestionsChange,
  onQuizCreated,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const generateId = () => `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddNewQuestion = () => {
    if (questions.length >= 1) {
      showToast('يمكن إضافة سؤال واحد فقط لهذا الدرس', 'error');
      return;
    }
    setFormData({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
    setEditingQuestion(null);
    setIsEditing(true);
  };

  const handleEditQuestion = (index: number) => {
    const question = questions[index];
    setFormData({
      text: question.text,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || ''
    });
    setEditingQuestion(question);
    setCurrentQuestionIndex(index);
    setIsEditing(true);
  };

  const toApiQuestions = (list: Question[]) =>
    list.map(q => ({
      question: q.text.trim(),
      options: q.options.map(o => o.trim()),
      correct_answer: String(q.correctAnswer),
      explanation: q.explanation?.trim() || undefined,
    }));

  const mapServerQuestionsToUI = (serverQuestions: any[]): Question[] => {
    if (!Array.isArray(serverQuestions)) return [];
    return serverQuestions.map((sq: any) => {
      const correctRaw = sq.correct_answer;
      const correctIndex = Array.isArray(correctRaw)
        ? Number(correctRaw[0])
        : Number(correctRaw);
      return {
        id: String(sq.id ?? generateId()),
        text: sq.question ?? '',
        options: Array.isArray(sq.options) ? sq.options : [],
        correctAnswer: Number.isNaN(correctIndex) ? 0 : correctIndex,
        explanation: sq.explanation ?? undefined,
      } as Question;
    });
  };

  const handleSaveQuestion = async () => {
    if (!formData.text.trim() || formData.options.some(opt => !opt.trim())) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    try {
      let updatedQuestions: Question[];

      if (editingQuestion) {
        // Update an existing question in local state
        setIsUpdating(true);
        updatedQuestions = questions.map(q =>
          q.id === editingQuestion.id
            ? {
                id: editingQuestion.id,
                text: formData.text.trim(),
                options: formData.options.map(o => o.trim()),
                correctAnswer: formData.correctAnswer,
                explanation: formData.explanation.trim() || undefined,
              }
            : q
        );
      } else {
        // Add a new question in local state
        if (questions.length >= 1) {
          showToast('لا يمكن إضافة أكثر من سؤال واحد لهذا الدرس', 'error');
          return;
        }
        setIsCreating(true);
        const tempQuestionId = `temp-question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const questionForState: Question = {
          id: tempQuestionId,
          text: formData.text.trim(),
          options: formData.options.map(o => o.trim()),
          correctAnswer: formData.correctAnswer,
          explanation: formData.explanation.trim() || undefined,
        };
        updatedQuestions = [...questions, questionForState];
        setCurrentQuestionIndex(questions.length);
      }

      if (lessonId.startsWith('temp-')) {
        // For temporary lessons, update only local state
        onQuestionsChange(updatedQuestions);
        showToast(editingQuestion ? 'تم تحديث السؤال محلياً' : 'تم إضافة السؤال محلياً', 'success');
        setIsEditing(false);
        setEditingQuestion(null);
      } else {
        // For existing lessons, persist entire quiz with all questions via lesson update
        const numericLessonId = parseInt(lessonId);
        if (!Number.isFinite(numericLessonId)) {
          showToast('معرف الدرس غير صالح', 'error');
          return;
        }

        const quizTitle = 'اختبار الدرس';
        const payload = {
          quiz: {
            title: quizTitle,
            questions: toApiQuestions(updatedQuestions),
          },
        };

        const updatedLesson = await updateLessonAdmin(numericLessonId, payload);
        const serverQuestions = updatedLesson?.quiz?.questions ?? [];
        const normalized = mapServerQuestionsToUI(serverQuestions);

        // Update parent state with normalized questions
        onQuestionsChange(normalized);

        // Notify parent if quiz was created or its id changed
        const newQuizId = updatedLesson?.quiz?.id;
        if (newQuizId && typeof onQuizCreated === 'function') {
          onQuizCreated(newQuizId);
        }

        showToast(editingQuestion ? 'تم تحديث السؤال بنجاح' : 'تم إضافة السؤال بنجاح', 'success');
        setIsEditing(false);
        setEditingQuestion(null);
      }
    } catch (error: any) {
      console.error('Error saving question:', error);
      showToast(error.message || 'حدث خطأ أثناء حفظ السؤال', 'error');
    } finally {
      setIsCreating(false);
      setIsUpdating(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      return;
    }

    try {
      setIsDeleting(true);
      const remaining = questions.filter(q => q.id !== questionId);

      if (lessonId.startsWith('temp-')) {
        onQuestionsChange(remaining);
        showToast('تم حذف السؤال محلياً', 'success');
      } else {
        const numericLessonId = parseInt(lessonId);
        if (!Number.isFinite(numericLessonId)) {
          showToast('معرف الدرس غير صالح', 'error');
          return;
        }

        const quizTitle = 'اختبار الدرس';
        const payload = {
          quiz: {
            title: quizTitle,
            questions: toApiQuestions(remaining),
          },
        };

        const updatedLesson = await updateLessonAdmin(numericLessonId, payload);
        const serverQuestions = updatedLesson?.quiz?.questions ?? [];
        const normalized = mapServerQuestionsToUI(serverQuestions);
        onQuestionsChange(normalized);

        const newQuizId = updatedLesson?.quiz?.id;
        if (newQuizId && typeof onQuizCreated === 'function') {
          onQuizCreated(newQuizId);
        }

        showToast('تم حذف السؤال بنجاح', 'success');
      }

      if (currentQuestionIndex >= remaining.length && remaining.length > 0) {
        setCurrentQuestionIndex(remaining.length - 1);
      }
    } catch (error: any) {
      console.error('Error deleting question:', error);
      showToast(error.message || 'حدث خطأ أثناء حذف السؤال', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  const getVisibleQuestionIndicators = () => {
    const totalQuestions = questions.length;
    
    // إذا كان عدد الأسئلة 7 أو أقل، اعرض جميع الأرقام
    if (totalQuestions <= 7) {
      return questions.map((_, index) => index);
    }
    
    // إذا كان عدد الأسئلة أكثر من 7، اعرض أول رقمين و ... و آخر رقم
    const visibleIndices = [];
    
    // أول رقمين
    visibleIndices.push(0, 1);
    
    // إضافة علامة ... (سنستخدم -1 كمؤشر للنقاط)
    visibleIndices.push(-1);
    
    // آخر رقم
    visibleIndices.push(totalQuestions - 1);
    
    return visibleIndices;
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="lesson-question-manager">
      <div className="question-manager-header">
        <h3 className="question-manager-title">
          <span className="question-icon">❓</span>
          أسئلة الدرس ({questions.length})
        </h3>
        <button 
          onClick={handleAddNewQuestion}
          className="add-question-btn"
        >
          <span className="btn-icon">➕</span>
          إضافة سؤال جديد
        </button>
      </div>

      {questions.length === 0 && !isEditing ? (
        <div className="empty-questions-state">
          <div className="empty-questions-icon">📝</div>
          <h4 className="empty-questions-title">لا توجد أسئلة بعد</h4>
          <p className="empty-questions-text">ابدأ بإضافة أسئلة تفاعلية لهذا الدرس</p>
          <button 
            onClick={handleAddNewQuestion}
            className="empty-add-question-btn"
          >
            إضافة أول سؤال
          </button>
        </div>
      ) : (
        <>
          {!isEditing && questions.length > 0 && (
            <div className="question-slider">
              <div className="question-card">
                <div className="question-card-header">
                  <div className="question-number">
                    السؤال {currentQuestionIndex + 1} من {questions.length}
                  </div>
                  <div className="question-actions">
                    <button 
                      onClick={() => handleEditQuestion(currentQuestionIndex)}
                      className="edit-question-btn"
                      title="تعديل السؤال"
                    >
                      تعديل
                    </button>
                    <button 
                      onClick={() => handleDeleteQuestion(currentQuestion.id)}
                      className="delete-question-btn"
                      title="حذف السؤال"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'جاري الحذف...' : 'حذف'}
                    </button>
                  </div>
                </div>
                
                <div className="question-content">
                  <div className="question-text">{currentQuestion.text}</div>
                  <div className="question-options">
                    {currentQuestion.options.map((option, index) => (
                      <div 
                        key={index} 
                        className={`question-option ${index === currentQuestion.correctAnswer ? 'correct-option' : ''}`}
                      >
                        <span className="option-letter">{getOptionLetter(index)}</span>
                        <span className="option-text">{option}</span>
                        {index === currentQuestion.correctAnswer && <span className="correct-indicator">✓</span>}
                      </div>
                    ))}
                  </div>
                  
                  {currentQuestion.explanation && (
                    <div className="question-explanation">
                      <strong>الشرح:</strong> {currentQuestion.explanation}
                    </div>
                  )}
                </div>
              </div>

              <div className="question-navigation">
                <button 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="nav-btn prev-btn"
                >
                  <span className="nav-icon">⬅️</span>
                  السابق
                </button>
                
                <div className="question-indicators">
                  {getVisibleQuestionIndicators().map((index, arrayIndex) => {
                    if (index === -1) {
                      // عرض النقاط
                      return (
                        <span key="dots" className="question-dots">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`question-indicator ${index === currentQuestionIndex ? 'active' : ''}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="nav-btn next-btn"
                >
                  التالي
                  <span className="nav-icon">➡️</span>
                </button>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="question-editor">
              <div className="editor-header">
                <h4 className="editor-title">
                  {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                </h4>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="close-editor-btn"
                >
                  ✕
                </button>
              </div>

              <div className="editor-form">
                <div className="form-group">
                  <label className="form-label">نص السؤال</label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => updateFormField('text', e.target.value)}
                    placeholder="اكتب السؤال هنا..."
                    className="question-input"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">الخيارات</label>
                  <div className="options-list">
                    {formData.options.map((option, index) => (
                      <div key={index} className="option-input-group">
                        <div className="option-header">
                          <span className="option-letter">{getOptionLetter(index)}</span>
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formData.correctAnswer === index}
                            onChange={() => updateFormField('correctAnswer', index)}
                            className="correct-radio"
                          />
                          <label className="correct-label">الإجابة الصحيحة</label>
                        </div>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`الخيار ${getOptionLetter(index)}`}
                          className="option-text-input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">الشرح (اختياري)</label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => updateFormField('explanation', e.target.value)}
                    placeholder="اكتب شرحاً للإجابة الصحيحة..."
                    className="explanation-input"
                    rows={2}
                  />
                </div>

                <div className="editor-actions">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="cancel-btn"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={handleSaveQuestion}
                    className="save-question-btn"
                    disabled={isCreating || isUpdating}
                  >
                    {(isCreating || isUpdating) && <span className="loading-spinner">⏳</span>}
                    {editingQuestion ? 
                      (isUpdating ? 'جاري الحفظ...' : 'حفظ التعديلات') : 
                      (isCreating ? 'جاري الإضافة...' : 'إضافة السؤال')
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LessonQuestionManager;