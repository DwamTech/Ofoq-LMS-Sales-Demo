'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './AdminQuestionBank.module.css';
import { getOrCreateDiplomaFinalExam } from '@/utils/quizService';
import { createQuestion, deleteQuestion, getQuizQuestions, Question, QuestionData, updateQuestion } from '@/utils/questionService';
import { getAdminCategory, type Diploma } from '@/utils/categoryService';
import Toast from '@/components/Toast';

interface EditableQuestion {
  id: number; // < 0 يعني مؤقت/جديد
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  isNew?: boolean;
  isDirty?: boolean;
  collapsed?: boolean;
}

// تحديث جلب المعرف لدعم كلٍ من [id] و [diplomaId]
const useDiplomaId = (): number => {
  const params = useParams() as { id?: string; diplomaId?: string };
  return useMemo(() => Number(params?.id ?? params?.diplomaId ?? 0), [params]);
};

export default function DiplomaQuestionBankPage() {
  const diplomaId = useDiplomaId();
  const [quizId, setQuizId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingAll, setSavingAll] = useState<boolean>(false);
  const [diploma, setDiploma] = useState<Diploma | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');

  // جلب اسم الدبلومة لعرضه في العنوان
  useEffect(() => {
    if (!diplomaId) return;
    getAdminCategory(diplomaId)
      .then(setDiploma)
      .catch(() => { /* تجاهل الخطأ ولا نمنع تهيئة بنك الأسئلة */ });
  }, [diplomaId]);

  useEffect(() => {
    const init = async () => {
      if (!diplomaId) { setLoading(false); return; }
      setLoading(true);
      showToast('جاري تحميل بنك الأسئلة...', 'info');
      try {
        const exam = await getOrCreateDiplomaFinalExam(diplomaId, 'امتحان نهائي الدبلومة');
        const qId = Number(exam?.id);
        setQuizId(qId);
        const qs = await getQuizQuestions(qId);
        const mapped: EditableQuestion[] = (qs || []).map(mapToEditable);
        setQuestions(mapped);
        showToast('تم تحميل بنك الأسئلة بنجاح', 'success');
      } catch (err: any) {
        const msg = err?.message || 'تعذر تهيئة بنك الأسئلة لهذه الدبلومة';
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [diplomaId]);

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const closeToast = () => {
    setToastVisible(false);
  };

  const mapToEditable = (q: Question): EditableQuestion => {
    return {
      id: Number(q.id),
      text: String(q.text ?? q.question ?? ''),
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: Number(q.correctAnswer ?? 0),
      explanation: q.explanation ?? '',
      isNew: false,
      isDirty: false,
      collapsed: true,
    };
  };

  const addNewQuestion = () => {
    const tempId = -Date.now();
    setQuestions((prev) => [
      ...prev,
      {
        id: tempId,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        isNew: true,
        isDirty: true,
        collapsed: false,
      },
    ]);
    showToast('تم إضافة سؤال جديد', 'info');
  };

  const markDirty = (id: number, updater: (q: EditableQuestion) => EditableQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...updater(q), isDirty: true } : q)));
  };

  const removeOption = (qid: number, index: number) => {
    markDirty(qid, (q) => ({ ...q, options: q.options.filter((_, i) => i !== index) }));
  };

  const addOption = (qid: number) => {
    markDirty(qid, (q) => ({ ...q, options: [...q.options, ''] }));
  };

  const toggleCollapsed = (qid: number) => {
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, collapsed: !q.collapsed } : q)));
  };

  const saveQuestion = async (q: EditableQuestion) => {
    if (!quizId) return;
    try {
      const payload: QuestionData = {
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
      if (q.isNew || q.id < 0) {
        const created = await createQuestion(quizId, payload);
        const updated = mapToEditable(created);
        setQuestions((prev) => prev.map((x) => (x.id === q.id ? updated : x)));
        showToast('تم إنشاء السؤال بنجاح', 'success');
      } else {
        const updatedQ = await updateQuestion(q.id, payload);
        const updated = mapToEditable(updatedQ);
        setQuestions((prev) => prev.map((x) => (x.id === q.id ? updated : x)));
        showToast('تم حفظ التعديلات', 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'تعذر حفظ السؤال', 'error');
    }
  };

  const deleteQuestionNow = async (qid: number) => {
    if (qid < 0) {
      // لم يُحفَظ بعد؛ فقط احذف من الحالة
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
      showToast('تم حذف السؤال', 'success');
      return;
    }
    try {
      await deleteQuestion(qid);
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
      showToast('تم حذف السؤال', 'success');
    } catch (err: any) {
      showToast(err?.message || 'تعذر حذف السؤال', 'error');
    }
  };

  const saveAll = async () => {
    if (!quizId) return;
    setSavingAll(true);
    showToast('جاري حفظ جميع التغييرات...', 'info');
    
    try {
      const dirtyQuestions = questions.filter(q => q.isNew || q.isDirty);
      if (dirtyQuestions.length === 0) {
        showToast('لا توجد تغييرات للحفظ', 'warning');
        return;
      }

      for (const q of dirtyQuestions) {
        await saveQuestion(q);
      }
      showToast(`تم حفظ ${dirtyQuestions.length} سؤال بنجاح`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء حفظ الكل', 'error');
    } finally {
      setSavingAll(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = questions.some(q => q.isNew || q.isDirty);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>بنك أسئلة الدبلومة</h1>
            <p className={styles.subtitle}>{diploma?.name ?? `دبلومة #${diplomaId}`}</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.addBtn} 
              onClick={addNewQuestion}
              disabled={loading}
            >
              <span className={styles.btnIcon}>+</span>
              إضافة سؤال جديد
            </button>
            <button 
              className={`${styles.saveAllBtn} ${hasUnsavedChanges ? styles.hasChanges : ''}`} 
              onClick={saveAll} 
              disabled={savingAll || loading || !hasUnsavedChanges}
            >
              {savingAll ? (
                <>
                  <span className={styles.spinner}></span>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <span className={styles.btnIcon}>💾</span>
                  حفظ كل التغييرات
                  {hasUnsavedChanges && <span className={styles.changesBadge}>{questions.filter(q => q.isNew || q.isDirty).length}</span>}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>جاري التحميل...</p>
        </div>
      )}

      {!loading && (
        <div className={styles.questionsContainer}>
          {questions.map((q, idx) => (
            <div className={`${styles.questionCard} ${q.isDirty || q.isNew ? styles.hasChanges : ''}`} key={q.id}>
              <div className={styles.questionHeader}>
                <div className={styles.questionInfo}>
                  <div className={styles.questionNumber}>
                    <span className={styles.questionNumberText}>سؤال #{idx + 1}</span>
                    {q.isNew && <span className={styles.newBadge}>جديد</span>}
                    {q.isDirty && !q.isNew && <span className={styles.modifiedBadge}>معدل</span>}
                  </div>
                </div>
                <div className={styles.questionActions}>
                  <button 
                    className={styles.toggleBtn} 
                    onClick={() => toggleCollapsed(q.id)}
                    title={q.collapsed ? 'فتح السؤال' : 'إغلاق السؤال'}
                  >
                    <span className={`${styles.toggleIcon} ${q.collapsed ? styles.collapsed : ''}`}>▼</span>
                  </button>
                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => deleteQuestionNow(q.id)}
                    title="حذف السؤال"
                  >
                    <span className={styles.deleteIcon}>🗑️</span>
                  </button>
                </div>
              </div>

              {!q.collapsed && (
                <div className={styles.questionContent}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>نص السؤال</label>
                    <textarea
                      className={styles.questionTextarea}
                      value={q.text}
                      onChange={(e) => markDirty(q.id, (x) => ({ ...x, text: e.target.value }))}
                      placeholder="اكتب نص السؤال هنا..."
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>الخيارات</label>
                    <div className={styles.optionsContainer}>
                      {q.options.map((opt, i) => (
                        <div className={styles.optionRow} key={i}>
                          <div className={styles.optionRadio}>
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswer === i}
                              onChange={() => markDirty(q.id, (x) => ({ ...x, correctAnswer: i }))}
                              id={`option-${q.id}-${i}`}
                            />
                            <label htmlFor={`option-${q.id}-${i}`} className={styles.radioLabel}>
                              {q.correctAnswer === i ? '✓' : ''}
                            </label>
                          </div>
                          <input
                            className={styles.optionInput}
                            value={opt}
                            onChange={(e) => markDirty(q.id, (x) => {
                              const next = [...x.options];
                              next[i] = e.target.value;
                              return { ...x, options: next };
                            })}
                            placeholder={`الخيار ${i + 1}`}
                          />
                          <button 
                            className={styles.removeOptionBtn} 
                            onClick={() => removeOption(q.id, i)}
                            title="حذف الخيار"
                            disabled={q.options.length <= 2}
                          >
                            <span className={styles.removeIcon}>−</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      className={styles.addOptionBtn} 
                      onClick={() => addOption(q.id)}
                      disabled={q.options.length >= 6}
                    >
                      <span className={styles.addIcon}>+</span>
                      إضافة خيار
                    </button>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>توضيح/شرح (اختياري)</label>
                    <textarea
                      className={styles.explanationTextarea}
                      value={q.explanation ?? ''}
                      onChange={(e) => markDirty(q.id, (x) => ({ ...x, explanation: e.target.value }))}
                      placeholder="اكتب شرحاً أو توضيحاً للإجابة الصحيحة..."
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3>لا توجد أسئلة حالياً</h3>
              <p>ابدأ بإضافة أول سؤال لبنك الأسئلة</p>
              <button className={styles.addBtn} onClick={addNewQuestion}>
                <span className={styles.btnIcon}>+</span>
                إضافة سؤال جديد
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast Component */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={closeToast}
      />
    </div>
  );
}