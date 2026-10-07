'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileQuestion,
  HelpCircle,
  ListRestart,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import styles from './AdminCourseQuestionBank.module.css';

import { createCourseQuiz, getCourseFinalExamMeta } from '@/utils/quizService';
import { createQuestion, deleteQuestion, getQuizQuestions, updateQuestion, type Question, type QuestionData } from '@/utils/questionService';
import apiClient from '@/utils/apiClient';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

type QuestionFormState = {
  text: string;
  options: string[];
  correctIndex: number | null;
  explanation: string;
};

type OptionFilter = 'all' | '2' | '3' | '4plus';
type ExplanationFilter = 'all' | 'without_explanation';
type SortOption = 'newest' | 'oldest' | 'number' | 'options_desc' | 'options_asc';

interface CourseDetails {
  id: number;
  title: string;
  isPublished: boolean | null;
  instructorName?: string;
  categoryName?: string;
}

const emptyForm = (): QuestionFormState => ({
  text: '',
  options: ['', ''],
  correctIndex: null,
  explanation: '',
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const normalizeCorrectIndex = (question: Question): number | null => {
  const raw = question.correctAnswer ?? question.correct_answer;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const index = Number(value);
  return Number.isFinite(index) ? index : null;
};

const getQuestionText = (question: Question) => question.text || question.question || '';

const formatDate = (value?: string) => {
  if (!value) return 'غير متاح';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير متاح';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(date);
};

const validateQuestionForm = (form: QuestionFormState): string | null => {
  if (!form.text.trim()) return 'نص السؤال مطلوب.';
  const trimmed = form.options.map((option) => option.trim());
  if (trimmed.length < MIN_OPTIONS) return 'يجب إدخال اختيارين على الأقل.';
  if (trimmed.length > MAX_OPTIONS) return 'لا يمكن إضافة أكثر من 6 اختيارات.';
  if (trimmed.some((option) => option.length === 0)) return 'لا يمكن ترك اختيار فارغ.';
  if (form.correctIndex == null) return 'يجب تحديد الإجابة الصحيحة.';
  if (form.correctIndex < 0 || form.correctIndex >= trimmed.length) return 'الإجابة الصحيحة يجب أن تكون ضمن الاختيارات الموجودة.';
  return null;
};

const toPayload = (form: QuestionFormState): QuestionData => ({
  text: form.text.trim(),
  options: form.options.map((option) => option.trim()),
  correctAnswer: Number(form.correctIndex),
  explanation: form.explanation.trim() || undefined,
});

export default function AdminCourseQuestionBankPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = useMemo(() => Number(params?.id), [params]);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [questionsPoolCount, setQuestionsPoolCount] = useState(0);
  const [hasSufficientBank, setHasSufficientBank] = useState(false);

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qError, setQError] = useState<string | null>(null);

  const [form, setForm] = useState<QuestionFormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [optionFilter, setOptionFilter] = useState<OptionFilter>('all');
  const [explanationFilter, setExplanationFilter] = useState<ExplanationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openActionsId, setOpenActionsId] = useState<number | null>(null);

  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState<QuestionFormState>(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const loadMeta = useCallback(async () => {
    if (!courseId || Number.isNaN(courseId)) return;
    try {
      setLoadingMeta(true);
      setMetaError(null);
      const [meta, courseResponse] = await Promise.all([
        getCourseFinalExamMeta(courseId),
        apiClient.get(`/admin/courses/${courseId}`),
      ]);
      const payload = courseResponse?.data?.data ?? courseResponse?.data ?? {};
      const instructor = payload?.instructor;
      const category = payload?.category;
      setCourse({
        id: Number(payload.id ?? courseId),
        title: String(payload.title ?? `مقرر #${courseId}`),
        isPublished: payload.is_published === undefined && payload.status === undefined
          ? null
          : Boolean(payload.is_published === true || payload.is_published === 1 || payload.status === 'published'),
        instructorName: typeof instructor?.name === 'string' ? instructor.name : undefined,
        categoryName: typeof category?.name === 'string' ? category.name : undefined,
      });
      const id = Number(meta.quiz_id || 0);
      setQuizId(id > 0 ? id : null);
      setQuestionsPoolCount(Number(meta.questions_pool_count || 0));
      setHasSufficientBank(Boolean(meta.has_sufficient_question_bank || false));
    } catch (error: unknown) {
      setMetaError(getErrorMessage(error, 'تعذر جلب بيانات الامتحان النهائي للمقرر'));
    } finally {
      setLoadingMeta(false);
    }
  }, [courseId]);

  const loadQuestions = useCallback(async (qid: number) => {
    try {
      setLoadingQuestions(true);
      setQError(null);
      const items = await getQuizQuestions(qid);
      setQuestions(items);
    } catch (error: unknown) {
      setQError(getErrorMessage(error, 'تعذر جلب قائمة الأسئلة'));
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (quizId) {
      loadQuestions(quizId);
    }
  }, [loadQuestions, quizId]);

  const updateOption = (target: 'create' | 'edit', index: number, value: string) => {
    const setter = target === 'create' ? setForm : setEditForm;
    setter((current) => {
      const next = [...current.options];
      next[index] = value;
      return { ...current, options: next };
    });
  };

  const addOption = (target: 'create' | 'edit') => {
    const setter = target === 'create' ? setForm : setEditForm;
    const setError = target === 'create' ? setFormError : setEditError;
    setter((current) => {
      if (current.options.length >= MAX_OPTIONS) {
        setError('لا يمكن إضافة أكثر من 6 اختيارات.');
        return current;
      }
      setError(null);
      return { ...current, options: [...current.options, ''] };
    });
  };

  const removeOption = (target: 'create' | 'edit', index: number) => {
    const setter = target === 'create' ? setForm : setEditForm;
    setter((current) => {
      if (current.options.length <= MIN_OPTIONS) return current;
      const next = current.options.filter((_, optionIndex) => optionIndex !== index);
      let correctIndex = current.correctIndex;
      if (correctIndex === index) {
        correctIndex = null;
      } else if (correctIndex != null && correctIndex > index) {
        correctIndex -= 1;
      }
      return { ...current, options: next, correctIndex };
    });
  };

  const handleCreateFinalExam = async () => {
    try {
      setSubmitting(true);
      const quiz = await createCourseQuiz(courseId, { title: 'الامتحان النهائي للمقرر' });
      setQuizId(Number(quiz.id));
      await loadMeta();
    } catch (error: unknown) {
      setMetaError(getErrorMessage(error, 'تعذر إنشاء الامتحان النهائي'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quizId) {
      setFormError('يرجى إنشاء الامتحان النهائي أولًا.');
      return;
    }
    const validation = validateQuestionForm(form);
    if (validation) {
      setFormError(validation);
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await createQuestion(quizId, toPayload(form));
      setForm(emptyForm());
      await loadQuestions(quizId);
      await loadMeta();
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, 'تعذر إنشاء السؤال'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (question: Question) => {
    const options = Array.isArray(question.options) && question.options.length >= MIN_OPTIONS
      ? question.options.slice(0, MAX_OPTIONS)
      : ['', ''];
    const correctIndex = normalizeCorrectIndex(question);
    setEditingQuestion(question);
    setEditForm({
      text: getQuestionText(question),
      options,
      correctIndex: correctIndex != null && correctIndex < options.length ? correctIndex : null,
      explanation: question.explanation || '',
    });
    setEditError(null);
    setOpenActionsId(null);
  };

  const handleUpdateQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingQuestion) return;
    const validation = validateQuestionForm(editForm);
    if (validation) {
      setEditError(validation);
      return;
    }
    try {
      setSubmitting(true);
      setEditError(null);
      await updateQuestion(Number(editingQuestion.id), toPayload(editForm));
      if (quizId) await loadQuestions(quizId);
      setEditingQuestion(null);
    } catch (error: unknown) {
      setEditError(getErrorMessage(error, 'تعذر تحديث السؤال'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteQuestion(Number(deleteTarget.id));
      setDeleteTarget(null);
      if (quizId) {
        await loadQuestions(quizId);
        await loadMeta();
      }
    } catch (error: unknown) {
      setQError(getErrorMessage(error, 'تعذر حذف السؤال'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = questions.filter((question) => {
      const optionCount = Array.isArray(question.options) ? question.options.length : 0;
      const hasExplanation = Boolean(question.explanation?.trim());
      const correctIndex = normalizeCorrectIndex(question);
      const correctText = correctIndex != null ? question.options?.[correctIndex] ?? '' : '';
      const matchesSearch =
        !query ||
        getQuestionText(question).toLowerCase().includes(query) ||
        correctText.toLowerCase().includes(query);
      const matchesOptions =
        optionFilter === 'all' ||
        (optionFilter === '2' && optionCount === 2) ||
        (optionFilter === '3' && optionCount === 3) ||
        (optionFilter === '4plus' && optionCount >= 4);
      const matchesExplanation = explanationFilter === 'all' || !hasExplanation;
      return matchesSearch && matchesOptions && matchesExplanation;
    });

    return [...list].sort((a, b) => {
      const aOptions = a.options?.length ?? 0;
      const bOptions = b.options?.length ?? 0;
      if (sortBy === 'oldest' || sortBy === 'number') return Number(a.id) - Number(b.id);
      if (sortBy === 'options_desc') return bOptions - aOptions;
      if (sortBy === 'options_asc') return aOptions - bOptions;
      return Number(b.id) - Number(a.id);
    });
  }, [explanationFilter, optionFilter, questions, search, sortBy]);

  const pagedQuestions = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredQuestions.slice(start, start + perPage);
  }, [filteredQuestions, page, perPage]);

  const stats = useMemo(() => {
    const optionCounts = questions.map((question) => question.options?.length ?? 0);
    const averageOptions = optionCounts.length
      ? (optionCounts.reduce((sum, count) => sum + count, 0) / optionCounts.length).toFixed(1)
      : 'غير متاح';
    const withoutExplanation = questions.filter((question) => !question.explanation?.trim()).length;
    const latestUpdate = questions
      .map((question) => question.updated_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);
    return { averageOptions, withoutExplanation, latestUpdate };
  }, [questions]);

  const resetQuestionFilters = () => {
    setSearch('');
    setOptionFilter('all');
    setExplanationFilter('all');
    setSortBy('newest');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / perPage));
  const startItem = filteredQuestions.length ? (page - 1) * perPage + 1 : 0;
  const endItem = Math.min(page * perPage, filteredQuestions.length);

  useEffect(() => {
    setPage(1);
  }, [explanationFilter, optionFilter, search, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const renderOptionsEditor = (target: 'create' | 'edit', state: QuestionFormState) => (
    <div className={styles.optionsEditor}>
      {state.options.map((option, index) => (
        <div key={index} className={styles.optionRow}>
          <label className={styles.correctRadio}>
            <input
              type="radio"
              name={`${target}-correct-answer`}
              checked={state.correctIndex === index}
              onChange={() => {
                const setter = target === 'create' ? setForm : setEditForm;
                setter((current) => ({ ...current, correctIndex: index }));
              }}
            />
            <span>الإجابة الصحيحة</span>
          </label>
          <input
            type="text"
            value={option}
            onChange={(event) => updateOption(target, index, event.target.value)}
            placeholder={`الاختيار ${index + 1}`}
          />
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => removeOption(target, index)}
            disabled={state.options.length <= MIN_OPTIONS}
            title="حذف الاختيار"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button type="button" className={styles.addOptionButton} onClick={() => addOption(target)} disabled={state.options.length >= MAX_OPTIONS}>
        <Plus size={16} />
        إضافة اختيار
      </button>
      <small>الحد الأدنى اختياران، والحد الأقصى 6 اختيارات.</small>
    </div>
  );

  return (
    <div className={styles.root} dir="rtl">
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>بنك الأسئلة</div>
          <h1 className={styles.title}>إدارة بنك الأسئلة</h1>
          <p className={styles.description}>{course?.title || `مقرر #${courseId}`}</p>
        </div>
        <button className={styles.secondaryBtn} onClick={() => router.push('/admin/diplomas/question-bank')}>
          <ArrowRight size={16} />
          عودة لقائمة المقررات
        </button>
      </header>

      {loadingMeta && (
        <div className={styles.skeletonWrap}>
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className={styles.skeletonRow} />)}
        </div>
      )}

      {metaError && !loadingMeta && (
        <div className={styles.stateCard}>
          <strong>تعذر تحميل بيانات بنك الأسئلة</strong>
          <p>{metaError}</p>
          <button className={styles.primaryBtn} onClick={loadMeta}>إعادة المحاولة</button>
        </div>
      )}

      {!loadingMeta && !metaError && (
        <>
          <section className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span>حالة بنك الأسئلة</span>
              <strong className={hasSufficientBank ? styles.goodText : styles.warnText}>
                {hasSufficientBank ? 'جاهز للاستخدام' : 'بحاجة إلى المزيد من الأسئلة'}
              </strong>
            </div>
            <div className={styles.metaCard}>
              <span>عدد الأسئلة المتاحة</span>
              <strong>{questionsPoolCount}</strong>
            </div>
            <div className={styles.metaCard}>
              <span>حالة المقرر</span>
              <strong>{course?.isPublished == null ? 'غير متاح' : course.isPublished ? 'منشور' : 'غير منشور'}</strong>
            </div>
            <div className={styles.metaCard}>
              <span>الدبلومة</span>
              <strong>{course?.categoryName || 'غير متاح'}</strong>
            </div>
            <div className={styles.metaCard}>
              <span>المحاضر</span>
              <strong>{course?.instructorName || 'غير متاح'}</strong>
            </div>
            <div className={styles.metaCard}>
              <span>رقم الامتحان</span>
              <strong>{quizId ?? 'غير متاح'}</strong>
            </div>
          </section>

          <section className={styles.statsGrid}>
            <div className={styles.statCard}>
              <FileQuestion className={styles.statIcon} />
              <span>إجمالي الأسئلة</span>
              <strong>{questions.length}</strong>
            </div>
            <div className={styles.statCard}>
              <CheckCircle2 className={`${styles.statIcon} ${styles.successIcon}`} />
              <span>أسئلة نشطة</span>
              <strong>{questions.length}</strong>
            </div>
            <div className={styles.statCard}>
              <XCircle className={`${styles.statIcon} ${styles.warningIcon}`} />
              <span>غير نشطة</span>
              <strong>غير متاح</strong>
            </div>
            <div className={styles.statCard}>
              <HelpCircle className={styles.statIcon} />
              <span>متوسط الاختيارات</span>
              <strong>{stats.averageOptions}</strong>
            </div>
            <div className={styles.statCard}>
              <Pencil className={`${styles.statIcon} ${styles.warningIcon}`} />
              <span>بدون شرح</span>
              <strong>{stats.withoutExplanation}</strong>
            </div>
            <div className={styles.statCard}>
              <Save className={styles.statIcon} />
              <span>آخر تحديث</span>
              <strong>{formatDate(stats.latestUpdate)}</strong>
            </div>
          </section>

          {!quizId && (
            <div className={styles.stateCard}>
              <strong>لا يوجد امتحان نهائي لهذا المقرر بعد.</strong>
              <p>يجب إنشاء الامتحان النهائي أولًا قبل إضافة الأسئلة.</p>
              <button className={styles.primaryBtn} onClick={handleCreateFinalExam} disabled={submitting}>
                إنشاء الامتحان النهائي للمقرر
              </button>
            </div>
          )}

          <section className={styles.formCard}>
            <button className={styles.formHeader} onClick={() => setIsFormOpen((current) => !current)} type="button">
              <span>إضافة سؤال جديد</span>
              <ChevronDown className={isFormOpen ? styles.chevronOpen : ''} size={18} />
            </button>
            {isFormOpen && (
              <form className={styles.form} onSubmit={handleAddQuestion}>
                {formError && <div className={styles.validationError}>{formError}</div>}
                <label className={styles.formGroup}>
                  <span>نص السؤال</span>
                  <textarea
                    value={form.text}
                    onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                    placeholder="اكتب نص السؤال هنا"
                    rows={3}
                  />
                </label>
                <div className={styles.formGroup}>
                  <span>الاختيارات</span>
                  {renderOptionsEditor('create', form)}
                </div>
                <label className={styles.formGroup}>
                  <span>الشرح أو سبب الإجابة، اختياري</span>
                  <textarea
                    value={form.explanation}
                    onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))}
                    placeholder="يمكن إضافة شرح يظهر عند مراجعة السؤال"
                    rows={2}
                  />
                </label>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.primaryBtn} disabled={submitting || !quizId}>
                    إضافة السؤال
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.filtersBar}>
              <label className={styles.searchField}>
                <Search size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث في نص السؤال أو الإجابة..." />
              </label>
              <select value={optionFilter} onChange={(event) => setOptionFilter(event.target.value as OptionFilter)}>
                <option value="all">كل أعداد الاختيارات</option>
                <option value="2">اختياران</option>
                <option value="3">3 اختيارات</option>
                <option value="4plus">4 اختيارات فأكثر</option>
              </select>
              <select value={explanationFilter} onChange={(event) => setExplanationFilter(event.target.value as ExplanationFilter)}>
                <option value="all">كل الأسئلة</option>
                <option value="without_explanation">بدون شرح</option>
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
                <option value="newest">الأحدث</option>
                <option value="oldest">الأقدم</option>
                <option value="number">رقم السؤال</option>
                <option value="options_desc">الأكثر اختيارات</option>
                <option value="options_asc">الأقل اختيارات</option>
              </select>
              <button className={styles.resetButton} onClick={resetQuestionFilters} type="button">
                <ListRestart size={16} />
                إعادة ضبط
              </button>
            </div>

            {loadingQuestions && (
              <div className={styles.skeletonWrap}>
                {Array.from({ length: 5 }).map((_, index) => <div key={index} className={styles.skeletonRow} />)}
              </div>
            )}

            {qError && !loadingQuestions && (
              <div className={styles.stateCard}>
                <strong>تعذر تحميل الأسئلة</strong>
                <p>{qError}</p>
                {quizId && <button className={styles.primaryBtn} onClick={() => loadQuestions(quizId)}>إعادة المحاولة</button>}
              </div>
            )}

            {!loadingQuestions && !qError && questions.length === 0 && (
              <div className={styles.stateCard}>
                <strong>لا توجد أسئلة في هذا المقرر بعد.</strong>
                <button className={styles.primaryBtn} onClick={() => setIsFormOpen(true)}>إضافة أول سؤال</button>
              </div>
            )}

            {!loadingQuestions && !qError && questions.length > 0 && filteredQuestions.length === 0 && (
              <div className={styles.stateCard}>
                <strong>لا توجد نتائج مطابقة للفلاتر الحالية.</strong>
                <button className={styles.resetButton} onClick={resetQuestionFilters}>إعادة ضبط الفلاتر</button>
              </div>
            )}

            {!loadingQuestions && !qError && pagedQuestions.length > 0 && (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>رقم السؤال</th>
                        <th>السؤال</th>
                        <th>عدد الاختيارات</th>
                        <th>الإجابة الصحيحة</th>
                        <th>الحالة</th>
                        <th>آخر تحديث</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedQuestions.map((question, index) => {
                        const correctIndex = normalizeCorrectIndex(question);
                        const correctLabel = correctIndex != null ? question.options?.[correctIndex] ?? 'غير متاح' : 'غير متاح';
                        return (
                          <tr key={question.id}>
                            <td>#{(page - 1) * perPage + index + 1}</td>
                            <td>
                              <div className={styles.questionCell}>
                                <strong title={getQuestionText(question)}>{getQuestionText(question)}</strong>
                                <span>{question.explanation ? 'بها شرح' : 'بدون شرح'}</span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.countBadge}>{question.options?.length ?? 0}</span>
                            </td>
                            <td>{correctLabel}</td>
                            <td><span className={styles.statusBadge}>نشط</span></td>
                            <td>{formatDate(question.updated_at)}</td>
                            <td>
                              <div className={styles.actionsMenu}>
                                <button className={styles.manageButton} onClick={() => setOpenActionsId(openActionsId === question.id ? null : question.id)}>
                                  إدارة
                                  <MoreVertical size={16} />
                                </button>
                                {openActionsId === question.id && (
                                  <div className={styles.dropdown}>
                                    <button onClick={() => { setPreviewQuestion(question); setOpenActionsId(null); }}>
                                      <Eye size={15} />
                                      عرض
                                    </button>
                                    <button onClick={() => openEdit(question)}>
                                      <Pencil size={15} />
                                      تعديل
                                    </button>
                                    <button className={styles.dangerItem} onClick={() => { setDeleteTarget(question); setOpenActionsId(null); }}>
                                      <Trash2 size={15} />
                                      حذف
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.pagination}>
                  <span>عرض {startItem} إلى {endItem} من أصل {filteredQuestions.length} سؤال</span>
                  <div className={styles.paginationControls}>
                    <select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>السابق</button>
                    <span>صفحة {page} من {totalPages}</span>
                    <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>التالي</button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {previewQuestion && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>تفاصيل السؤال</h2>
              <button className={styles.iconButton} onClick={() => setPreviewQuestion(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.previewQuestionText}>{getQuestionText(previewQuestion)}</p>
              <div className={styles.previewOptions}>
                {previewQuestion.options?.map((option, index) => {
                  const isCorrect = normalizeCorrectIndex(previewQuestion) === index;
                  return (
                    <div key={index} className={`${styles.previewOption} ${isCorrect ? styles.correctOption : ''}`}>
                      <span>{index + 1}</span>
                      <strong>{option}</strong>
                      {isCorrect && <small>الإجابة الصحيحة</small>}
                    </div>
                  );
                })}
              </div>
              <div className={styles.detailLine}><span>الشرح:</span><strong>{previewQuestion.explanation || 'غير متاح'}</strong></div>
              <div className={styles.detailLine}><span>تاريخ الإنشاء:</span><strong>{formatDate(previewQuestion.created_at)}</strong></div>
              <div className={styles.detailLine}><span>آخر تحديث:</span><strong>{formatDate(previewQuestion.updated_at)}</strong></div>
            </div>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>تعديل السؤال</h2>
              <button className={styles.iconButton} onClick={() => setEditingQuestion(null)}><X size={18} /></button>
            </div>
            <form className={styles.modalBody} onSubmit={handleUpdateQuestion}>
              {editError && <div className={styles.validationError}>{editError}</div>}
              <label className={styles.formGroup}>
                <span>نص السؤال</span>
                <textarea value={editForm.text} onChange={(event) => setEditForm((current) => ({ ...current, text: event.target.value }))} rows={3} />
              </label>
              <div className={styles.formGroup}>
                <span>الاختيارات</span>
                {renderOptionsEditor('edit', editForm)}
              </div>
              <label className={styles.formGroup}>
                <span>الشرح، اختياري</span>
                <textarea value={editForm.explanation} onChange={(event) => setEditForm((current) => ({ ...current, explanation: event.target.value }))} rows={2} />
              </label>
              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setEditingQuestion(null)}>إلغاء</button>
                <button type="submit" className={styles.primaryBtn} disabled={submitting}>حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmModal}>
            <div className={styles.modalHeader}>
              <h2>حذف السؤال</h2>
              <button className={styles.iconButton} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p>هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setDeleteTarget(null)}>إلغاء</button>
                <button type="button" className={styles.dangerBtn} onClick={confirmDeleteQuestion} disabled={submitting}>حذف السؤال</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
