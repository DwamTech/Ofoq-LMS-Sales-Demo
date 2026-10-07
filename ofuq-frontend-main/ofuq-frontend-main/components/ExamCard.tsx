'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyEnrolledCourses,
  Course,
  getEnrollmentFilters,
  getMyTestStatuses,
  MyTestStatus,
  getCourseDetails,
  getCourseProgressDetails
} from '../utils/courseService';
import styles from './ExamCard.module.css';
import FilterBar from './FilterBar';

interface ExamCardProps {
  showAll?: boolean;
  exams?: Course[];
  onExamSelect?: (exam: Course) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ showAll = false, exams, onExamSelect }) => {
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [testStatuses, setTestStatuses] = useState<Record<number, MyTestStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter State
  const [filters, setFilters] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | number>('all');

  const fetchExams = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const [response, statuses, filterData] = await Promise.all([
        getMyEnrolledCourses(page, 100),
        getMyTestStatuses(),
        getEnrollmentFilters(),
      ]);
      const byCourse = Object.fromEntries(statuses.map(item => [item.course_id, item]));
      setTestStatuses(byCourse);
      setFilters([
        { id: 'all', label: 'الكل', count: statuses.length },
        { id: 'completed', label: 'مكتملة', count: statuses.filter(item => item.course_status === 'completed').length },
        { id: 'in_progress', label: 'قيد الدراسة', count: statuses.filter(item => item.course_status !== 'completed').length },
        ...filterData.categories.map(cat => ({ id: cat.id, label: cat.title || cat.name, count: undefined })),
      ]);

      if (response && response.data) {
        setEnrolledCourses(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.last_page);
        }
      } else {
        setEnrolledCourses([]);
      }
    } catch (err) {
      setError('فشل في تحميل المقررات الدراسية');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!exams) {
      fetchExams(currentPage);
    } else {
      setEnrolledCourses(exams);
      setLoading(false);
    }
  }, [exams, currentPage, fetchExams]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (id: string | number) => {
    setActiveFilter(id);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleCardClick = (courseId: number) => {
    if (onExamSelect) {
      const course = enrolledCourses.find(c => c.id === courseId);
      if (course) onExamSelect(course);
    } else {
      router.push(`/user/my_exams/${courseId}`);
    }
  };

  // متابعة الدراسة: نحدد آخر درس غير مكتمل ونذهب إليه
  const handleContinueStudyClick = async (exam: Course, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const [courseDetails, progressDetails] = await Promise.all([
        getCourseDetails(exam.id),
        getCourseProgressDetails(exam.id)
      ]);

      const chapters = (courseDetails?.chapters || []).slice().sort((a: any, b: any) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
      const flatLessons: Array<{ id: number; chapterId: number }> = [];
      chapters.forEach((ch: any) => {
        const lessons = (ch.lessons || []).slice().sort((a: any, b: any) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
        lessons.forEach((ls: any) => {
          if (ls && ls.id != null) flatLessons.push({ id: Number(ls.id), chapterId: Number(ch.id) });
        });
      });

      // إذا لم نجد دروسًا، نعود لعرض التفاصيل
      if (!flatLessons.length) {
        if (onExamSelect) onExamSelect(exam); else router.push(`/user/my_exams/${exam.id}`);
        return;
      }

      const completedIds = new Set(
        (progressDetails?.lessons || [])
          .filter((l: any) => String(l.status).toLowerCase() === 'completed')
          .map((l: any) => Number(l.lesson_id))
      );

      const nextLesson = flatLessons.find((l) => !completedIds.has(l.id)) || flatLessons[0];

      router.push(`/watch?lessonId=${nextLesson.id}&chapterId=${nextLesson.chapterId}&courseId=${exam.id}`);
    } catch (err) {
      console.error('Failed to navigate to continue study:', err);
      // في حالة الفشل، نسقط لعرض تفاصيل الامتحان بدلًا من تعطيل التجربة
      if (onExamSelect) onExamSelect(exam); else router.push(`/user/my_exams/${exam.id}`);
    }
  };

  // دخول الامتحان النهائي
  const handleFinalExamClick = (exam: Course, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    router.push(`/user/final-exam/${exam.id}`);
  };

  // عرض النتيجة وطلب الشهادة (يفتح صفحة تفاصيل الاختبار)
  const handleResultAndCertificateClick = (exam: Course, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onExamSelect) {
      onExamSelect(exam);
    } else {
      router.push(`/user/my_exams/${exam.id}`);
    }
  };

  if (loading && enrolledCourses.length === 0) {
    return <div className={styles.loading}>جاري التحميل...</div>;
  }

  if (error && !exams) {
    return <div className={styles.error}>{error}</div>;
  }

  const filteredCourses = enrolledCourses.filter(course => {
    if (activeFilter === 'completed') return testStatuses[course.id]?.course_status === 'completed';
    if (activeFilter === 'in_progress') return testStatuses[course.id]?.course_status !== 'completed';
    if (typeof activeFilter === 'number') return course.category_id === activeFilter;
    return true;
  });
  const displayCourses = showAll ? filteredCourses : filteredCourses.slice(0, 6);

  return (
    <div className={styles.container}>
      {!exams && (
        <FilterBar
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      )}

      {displayCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>لا توجد مقررات دراسية في هذا القسم.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayCourses.map((exam) => (
            <div
              key={exam.id}
              className={styles.card}
              onClick={() => handleCardClick(exam.id)}
            >
              <div className={styles.imageWrapper}>
                {exam.category && (
                  <span className={styles.diplomaBadge}>
                    {exam.category.title || exam.category.label || exam.category.name}
                  </span>
                )}
                <img
                  src={exam.cover_image || '/images/ofuq-logo.png'}
                  alt={exam.title}
                  className={styles.image}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/ofuq-logo.png';
                  }}
                />
                <div className={styles.overlay}>
                  <span className={styles.viewButton}>عرض التفاصيل</span>
                </div>
              </div>

              <div className={styles.content}>
                <h3 className={styles.title}>{exam.title}</h3>
                <span className={styles.courseStatus}>
                  {testStatuses[exam.id]?.course_status === 'completed'
                    ? 'مكتملة'
                    : testStatuses[exam.id]?.active_attempt_status === 'in_progress'
                      ? 'الامتحان قيد التنفيذ'
                      : exam.has_final_exam && Number(exam.progress_percentage) >= 100
                        ? 'جاهز للامتحان'
                        : 'قيد الدراسة'}
                </span>

                {/* Progress Bar */}
                <div className={styles.progressContainer}>
                  <div className={styles.progressInfo}>
                    <span className={styles.progressLabel}>نسبة الإنجاز</span>
                    <span className={styles.progressPercentage}>
                      {Math.round(Number(exam.progress_percentage || 0))}%
                    </span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${Math.round(Number(exam.progress_percentage || 0))}%` }}
                    />
                  </div>
                </div>

                <div className={styles.actionButtons}>
                  {/* استكمال الدراسة */}
                  <button
                    className={styles.actionButton}
                    onClick={(e) => handleContinueStudyClick(exam, e)}
                    disabled={Math.round(Number(exam.progress_percentage || 0)) >= 100}
                  >
                    استكمال الدراسة
                  </button>

                  {/* دخول الامتحان النهائي - يظهر فقط إذا كان هناك اختبار نهائي */}
                  {exam.has_final_exam && (
                    <button
                      className={styles.actionButton}
                      onClick={(e) => handleFinalExamClick(exam, e)}
                      disabled={Math.round(Number(exam.progress_percentage || 0)) < 100}
                    >
                      دخول الامتحان النهائي
                    </button>
                  )}

                  {/* عرض رسالة إذا لم يكن هناك اختبار نهائي */}
                  {exam.has_final_exam === false && Math.round(Number(exam.progress_percentage || 0)) >= 100 && (
                    <div className={styles.noExamMessage}>
                      📚 هذا المقرر لا يحتوي على اختبار نهائي
                    </div>
                  )}

                  {/* طلب النتيجة والشهادة */}
                  {testStatuses[exam.id]?.course_status === 'completed' && (
                    <button
                      className={styles.actionButton}
                      onClick={(e) => handleResultAndCertificateClick(exam, e)}
                    >
                      طلب النتيجة والشهادة
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!exams && totalPages > 1 && (
        <div className={styles.paginationControls}>
          <button
            onClick={(e) => { e.stopPropagation(); handlePageChange(currentPage - 1); }}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            السابق
          </button>

          <span className={styles.pageInfo}>
            صفحة {currentPage} من {totalPages}
          </span>

          <button
            onClick={(e) => { e.stopPropagation(); handlePageChange(currentPage + 1); }}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamCard;
