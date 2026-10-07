'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Filter,
  GraduationCap,
  HelpCircle,
  ListRestart,
  Search,
  XCircle,
} from 'lucide-react';
import styles from './AdminDiplomasQuestionBank.module.css';
import apiClient from '@/utils/apiClient';
import { getCourseFinalExamMeta } from '@/utils/quizService';

interface CourseItem {
  id: number;
  title: string;
  is_published: boolean;
  status?: string;
  instructor?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  questionCount?: number | null;
}

interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

type StatusFilter = 'all' | 'published' | 'draft';
type BankFilter = 'all' | 'with_questions' | 'without_questions';
type SortOption = 'newest' | 'oldest' | 'title' | 'questions_desc' | 'questions_asc';

const resolveText = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const item = value as Record<string, unknown>;
    const candidates = [item.name, item.title, item.ar, item.en, item.slug, item.id];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' || typeof candidate === 'number') return String(candidate);
    }
  }
  return '';
};

const asRecord = (value: unknown): Record<string, unknown> => (
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
);

const getQuestionCount = (course: CourseItem): number | null => (
  typeof course.questionCount === 'number' ? course.questionCount : null
);

export default function AdminCoursesQuestionBankPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState<BankFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/admin/courses', {
        params: { page, per_page: perPage },
      });
      const payload = res?.data ?? {};
      const items: unknown[] = Array.isArray(payload?.data) ? payload.data : [];
      const pg: PaginationInfo | null = payload?.pagination ?? null;

      const mapped: CourseItem[] = items.map((item) => {
        const c = asRecord(item);
        const instructor = asRecord(c.instructor);
        const category = asRecord(c.category);
        const stats = asRecord(c.stats);
        return {
          id: Number(c.id),
          title: String(c.title ?? ''),
          is_published: Boolean(
            c.is_published === true ||
            c.is_published === 1 ||
            c.is_published === '1' ||
            String(c.status ?? '').toLowerCase() === 'published'
          ),
          status: String(c.status ?? ''),
          instructor: c.instructor
            ? { id: Number(instructor.id ?? 0), name: resolveText(instructor.name ?? instructor.title ?? c.instructor) }
            : null,
          category: c.category
            ? { id: Number(category.id ?? 0), name: resolveText(category.name ?? category.title ?? c.category) }
            : null,
          questionCount: typeof stats.questions_count === 'number' ? Number(stats.questions_count) : null,
        };
      });

      const withMeta = await Promise.all(
        mapped.map(async (course) => {
          try {
            const meta = await getCourseFinalExamMeta(course.id);
            return { ...course, questionCount: Number(meta.questions_pool_count ?? 0) };
          } catch {
            return course;
          }
        })
      );

      setCourses(withMeta);
      setPagination(pg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب المقررات';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((course) => {
      if (course.category?.id && course.category.name) {
        map.set(String(course.category.id), course.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = courses.filter((course) => {
      const questionCount = getQuestionCount(course);
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        (course.instructor?.name ?? '').toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && course.is_published) ||
        (statusFilter === 'draft' && !course.is_published);
      const matchesCategory = categoryFilter === 'all' || String(course.category?.id ?? '') === categoryFilter;
      const matchesBank =
        bankFilter === 'all' ||
        questionCount == null ||
        (bankFilter === 'with_questions' && questionCount > 0) ||
        (bankFilter === 'without_questions' && questionCount === 0);

      return matchesSearch && matchesStatus && matchesCategory && matchesBank;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ar');
      if (sortBy === 'questions_desc') return (getQuestionCount(b) ?? -1) - (getQuestionCount(a) ?? -1);
      if (sortBy === 'questions_asc') return (getQuestionCount(a) ?? 999999) - (getQuestionCount(b) ?? 999999);
      return b.id - a.id;
    });
  }, [bankFilter, categoryFilter, courses, search, sortBy, statusFilter]);

  const stats = useMemo(() => {
    const knownQuestionCounts = courses.map(getQuestionCount).filter((value): value is number => value !== null);
    return {
      total: pagination?.total ?? courses.length,
      pageTotal: courses.length,
      published: courses.filter((course) => course.is_published).length,
      draft: courses.filter((course) => !course.is_published).length,
      withQuestions: knownQuestionCounts.length ? courses.filter((course) => (getQuestionCount(course) ?? 0) > 0).length : null,
      withoutQuestions: knownQuestionCounts.length ? courses.filter((course) => getQuestionCount(course) === 0).length : null,
      totalQuestions: knownQuestionCounts.length ? knownQuestionCounts.reduce((sum, value) => sum + value, 0) : null,
    };
  }, [courses, pagination?.total]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setBankFilter('all');
    setSortBy('newest');
  };

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => (pagination ? Math.min(pagination.last_page, p + 1) : p + 1));

  const startItem = pagination && courses.length > 0 ? (pagination.current_page - 1) * pagination.per_page + 1 : courses.length ? 1 : 0;
  const endItem = pagination ? Math.min(pagination.current_page * pagination.per_page, pagination.total) : filteredCourses.length;

  return (
    <div className={styles.root} dir="rtl">
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>لوحة التحكم</div>
          <h1 className={styles.title}>إدارة بنك الأسئلة - المقررات</h1>
          <p className={styles.description}>متابعة بنوك الأسئلة المرتبطة بالمقررات وإدارة أسئلة كل مقرر.</p>
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="إحصائيات بنك الأسئلة">
        <div className={styles.statCard}>
          <BookOpen className={styles.statIcon} />
          <span>إجمالي المقررات</span>
          <strong>{stats.total}</strong>
          <small>إجمالي السيرفر</small>
        </div>
        <div className={styles.statCard}>
          <CheckCircle2 className={`${styles.statIcon} ${styles.successIcon}`} />
          <span>منشورة</span>
          <strong>{stats.published}</strong>
          <small>في الصفحة الحالية</small>
        </div>
        <div className={styles.statCard}>
          <XCircle className={`${styles.statIcon} ${styles.warningIcon}`} />
          <span>غير منشورة</span>
          <strong>{stats.draft}</strong>
          <small>في الصفحة الحالية</small>
        </div>
        <div className={styles.statCard}>
          <HelpCircle className={styles.statIcon} />
          <span>إجمالي الأسئلة</span>
          <strong>{stats.totalQuestions ?? 'غير متاح'}</strong>
          <small>للمقررات المعروضة</small>
        </div>
        <div className={styles.statCard}>
          <GraduationCap className={`${styles.statIcon} ${styles.successIcon}`} />
          <span>بها أسئلة</span>
          <strong>{stats.withQuestions ?? 'غير متاح'}</strong>
          <small>للمقررات المعروضة</small>
        </div>
        <div className={styles.statCard}>
          <Filter className={`${styles.statIcon} ${styles.warningIcon}`} />
          <span>بدون أسئلة</span>
          <strong>{stats.withoutQuestions ?? 'غير متاح'}</strong>
          <small>للمقررات المعروضة</small>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.filtersBar}>
          <label className={styles.searchField}>
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المقرر أو المحاضر..."
            />
          </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">كل الحالات</option>
            <option value="published">منشورة</option>
            <option value="draft">غير منشورة</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">كل الدبلومات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value as BankFilter)}>
            <option value="all">كل بنوك الأسئلة</option>
            <option value="with_questions">بها أسئلة</option>
            <option value="without_questions">بدون أسئلة</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
            <option value="title">اسم المقرر</option>
            <option value="questions_desc">الأكثر أسئلة</option>
            <option value="questions_asc">الأقل أسئلة</option>
          </select>
          <button type="button" className={styles.resetButton} onClick={resetFilters}>
            <ListRestart size={16} />
            إعادة ضبط
          </button>
        </div>

        {loading && (
          <div className={styles.skeletonWrap}>
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className={styles.skeletonRow} />)}
          </div>
        )}

        {error && !loading && (
          <div className={styles.stateCard}>
            <strong>تعذر تحميل المقررات</strong>
            <p>{error}</p>
            <button className={styles.primaryBtn} onClick={fetchCourses}>إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && filteredCourses.length === 0 && courses.length > 0 && (
          <div className={styles.stateCard}>
            <strong>لا توجد نتائج مطابقة للفلاتر الحالية.</strong>
            <button className={styles.resetButton} onClick={resetFilters}>إعادة ضبط الفلاتر</button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className={styles.stateCard}>
            <strong>لا توجد مقررات متاحة لإدارة بنك الأسئلة.</strong>
          </div>
        )}

        {!loading && !error && filteredCourses.length > 0 && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>المقرر</th>
                    <th>المحاضر</th>
                    <th>الحالة</th>
                    <th>بنك الأسئلة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => {
                    const questionCount = getQuestionCount(course);
                    return (
                      <tr key={course.id}>
                        <td>
                          <div className={styles.courseCell}>
                            <strong>{course.title || 'بدون عنوان'}</strong>
                            <span>#{course.id}</span>
                            <small>{course.category?.name || 'غير مرتبط بدبلومة'}</small>
                          </div>
                        </td>
                        <td>{course.instructor?.name || 'غير متاح'}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${course.is_published ? styles.statusPublished : styles.statusDraft}`}>
                            {course.is_published ? 'منشورة' : 'غير منشورة'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.bankCell}>
                            <strong>{questionCount == null ? 'غير متاح' : `${questionCount} سؤال`}</strong>
                          </div>
                        </td>
                        <td>
                          <button className={styles.manageButton} onClick={() => router.push(`/admin/courses/${course.id}/question-bank`)}>
                            إدارة الأسئلة
                            <ChevronLeft size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <div>
                {pagination
                  ? `عرض ${startItem} إلى ${endItem} من أصل ${pagination.total} مقرر`
                  : `عرض ${filteredCourses.length} مقرر`}
              </div>
              <div className={styles.paginationControls}>
                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button onClick={goPrev} disabled={page <= 1}>السابق</button>
                <span>صفحة {page}{pagination ? ` من ${pagination.last_page}` : ''}</span>
                <button onClick={goNext} disabled={pagination ? page >= pagination.last_page : true}>التالي</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
