'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import InstructorProfile from './InstructorProfile';
import '../styles/student-reviews.css';
import { LessonWatchStatus } from '@/utils/lessonService';
import { getCourseProgressDetails, type CourseStats } from '@/utils/courseService';
import { FaCheckCircle } from 'react-icons/fa';
import { BookOpen, Clock3, Users } from 'lucide-react';
import { publicDescription } from './brand/publicContent';

interface CourseContentProps {
  publicView?: boolean;
  courseTitle: string;
  lecturesCount: number;
  studentsCount: number;
  hoursCount: number;
  courseStats?: CourseStats;
  courseDescription?: string;
  hideOverview?: boolean;
  hideStats?: boolean;
  courseId?: string;
  isEnrolled?: boolean;
  defaultExpandedChapterId?: number;
  activeLessonId?: number;
  currentLessonId?: number | null;
  currentChapterId?: number | null;
  courseProgress?: any;
  onLessonClick?: (lessonId: number, chapterId: number) => void;
  chapters?: Array<{
    id: number;
    title: string;
    lessons?: Array<{
      id: number;
      title: string;
      video_url?: string | null;
    }>;
  }>;
  instructorName?: string;
  instructorImage?: string;
  instructorCoursesCount?: number;
  instructorStudentsCount?: number;
  instructorTitle?: string;
  instructorBio?: string;
}

const CourseContent: React.FC<CourseContentProps> = ({
  publicView = false,
  courseTitle,
  lecturesCount,
  studentsCount,
  hoursCount,
  courseStats,
  courseDescription = '',
  hideOverview = false,
  hideStats = false,
  courseId,
  isEnrolled = false,
  defaultExpandedChapterId,
  activeLessonId,
  currentLessonId,
  currentChapterId,
  courseProgress,
  onLessonClick,
  chapters = [],
  instructorName = "",
  instructorImage = "/profile.jpg",
  instructorCoursesCount = 0,
  instructorStudentsCount = 0,
  instructorTitle = "",
  instructorBio = ""
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>(() => {
    // فتح جميع الأقسام افتراضياً عند التحميل الأول
    const initial: Record<string, boolean> = {};
    if (Array.isArray(chapters) && chapters.length > 0) {
      chapters.forEach((ch, index) => {
        initial[`chapter-${ch.id}`] = !publicView || index === 0;
      });
    }
    return initial;
  });
  const [lessonStatuses, setLessonStatuses] = useState<Record<number, LessonWatchStatus>>({});
  // مفتاح لإعادة جلب حالة الدروس عند العودة للصفحة
  const [refreshKey, setRefreshKey] = useState(0);
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat('ar-EG'), []);
  const stats = React.useMemo(() => ({
    lessons: Number(courseStats?.lessons_count ?? lecturesCount ?? 0),
    chapters: Number(courseStats?.chapters_count ?? chapters?.length ?? 0),
    students: Number(courseStats?.students_count ?? studentsCount ?? 0),
    durationSeconds: Number(courseStats?.duration_seconds ?? (Number(hoursCount ?? 0) * 3600)),
  }), [courseStats, lecturesCount, chapters, studentsCount, hoursCount]);

  const formatNumber = React.useCallback((value: number) => numberFormatter.format(Math.max(0, Math.round(value || 0))), [numberFormatter]);
  const formatDuration = React.useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, Math.round(seconds || 0));
    if (safeSeconds < 3600) {
      return `${numberFormatter.format(Math.ceil(safeSeconds / 60))} دقيقة`;
    }

    const hours = safeSeconds / 3600;
    const value = Number.isInteger(hours) ? hours : Number(hours.toFixed(1));
    return `${numberFormatter.format(value)} ساعة`;
  }, [numberFormatter]);

  // إعادة جلب حالة الدروس عند العودة للصفحة (من صفحة المشاهدة مثلاً)
  // نستخدم pathname + visibilitychange لضمان التحديث مع client-side navigation
  React.useEffect(() => {
    // تحديث فوري عند mount أو تغير الـ pathname (client-side navigation)
    console.log('[CourseContent] Component mounted/pathname changed, refreshing...');
    setRefreshKey((prev) => prev + 1);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[CourseContent] Page became visible, refreshing lesson statuses...');
        setRefreshKey((prev) => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  // Detect if we have real backend content (with numeric lesson IDs)
  const hasRealContent = Array.isArray(chapters) && chapters.length > 0 && chapters.some(ch => Array.isArray(ch.lessons) && ch.lessons.some(l => typeof l.id === 'number' && l.id > 0));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Expand default chapter if provided
  React.useEffect(() => {
    if (typeof defaultExpandedChapterId === 'number') {
      setExpandedSections(prev => ({
        ...prev,
        [`chapter-${defaultExpandedChapterId}`]: true
      }));
    }
  }, [defaultExpandedChapterId]);

  // إذا وصلت فصول من الـ API نستخدمها، وإلا fallback لبيانات توضيحية
  const contentSections =
    chapters && chapters.length > 0
      ? chapters.map((ch) => ({
        id: `chapter-${ch.id}`,
        title: ch.title,
        lessons: (ch.lessons || []).map((l) => ({
          id: l.id,
          title: l.title,
          video_url: l.video_url ?? null,
        })),
      }))
      : publicView ? [] : [
        {
          id: 'sample-1',
          title: 'محتوى تجريبي',
          lessons: ['درس تمهيدي', 'مقدمة عامة', 'التعرف على المحتوى'].map((t, i) => ({
            id: i + 1,
            title: t,
            video_url: null,
          })),
        },
      ];

  // فتح جميع الأقسام افتراضياً بعد توفر المحتوى، إذا لم تكن مهيأة بعد
  React.useEffect(() => {
    if (Object.keys(expandedSections).length > 0) return;
    const openMap: Record<string, boolean> = {};
    contentSections.forEach((s, index) => {
      openMap[s.id] = !publicView || index === 0;
    });
    if (Object.keys(openMap).length > 0) {
      setExpandedSections(openMap);
    }
  }, [chapters]);

  // جلب حالة مشاهدة كل درس للمستخدم الحالي (إن كان مشتركًا ومحتوى حقيقي)
  React.useEffect(() => {
    console.log('[CourseContent][LessonStatusEffect][start]', { isEnrolled, hasRealContent, chaptersCount: (chapters || []).length });
    if (!isEnrolled || !courseId) return;

    console.log('[CourseContent] Fetching lesson statuses via getCourseProgressDetails...');
    getCourseProgressDetails(courseId).then((details) => {
      if (!details?.lessons || !Array.isArray(details.lessons)) {
        console.log('[CourseContent] No lessons in progress details');
        return;
      }
      const map: Record<number, LessonWatchStatus> = {};
      details.lessons.forEach((l) => {
        const lessonId = Number(l.lesson_id);
        if (lessonId > 0) {
          map[lessonId] = l.status === 'completed' ? 'completed' : 'in_progress';
        }
      });
      if (Object.keys(map).length > 0) {
        console.log('[CourseContent] Lesson statuses fetched:', map);
        setLessonStatuses((prev) => ({ ...prev, ...map }));
      }
    }).catch((err) => {
      console.warn('[CourseContent] Error fetching lesson statuses:', err?.message || err);
    });
  }, [isEnrolled, courseId, refreshKey]);

  // تتبع تغيّر الحالات بعد التحديث
  React.useEffect(() => {
    if (!isEnrolled || !hasRealContent) return;
    const keys = Object.keys(lessonStatuses);
    console.log('[CourseContent][LessonStatusEffect][stateUpdated]', { count: keys.length, keys });
  }, [lessonStatuses, isEnrolled, hasRealContent]);

  // تحديث حالة الدروس من courseProgress prop مباشرة (عند التنقل بين الدروس في صفحة المشاهدة)
  React.useEffect(() => {
    if (!courseProgress?.lessons || !Array.isArray(courseProgress.lessons)) return;
    const map: Record<number, LessonWatchStatus> = {};
    courseProgress.lessons.forEach((lp: any) => {
      const lessonId = Number(lp.lesson_id);
      if (lessonId > 0 && lp.status) {
        map[lessonId] = lp.status === 'completed' ? 'completed' : 'in_progress';
      }
    });
    if (Object.keys(map).length > 0) {
      console.log('[CourseContent] Updating lesson statuses from courseProgress prop', map);
      setLessonStatuses((prev) => ({ ...prev, ...map }));
    }
  }, [courseProgress]);

  const handleLessonNavigate = (lessonId: number, chapterId?: number, canWatch?: boolean, isPreview?: boolean) => {
    // Prevent navigating for sample/fallback content
    if (!hasRealContent) {
      // محتوى تجريبي فقط، لا توجد دروس حقيقية للتشغيل
      return;
    }
    // لو المستخدم غير مشترك لكن فيه فيديو معاينة، نعرض المعاينة بدلاً من صفحة المشاهدة المحمية
    if (isPreview && !canWatch) {
      try {
        // تمرير المستخدم إلى أعلى الصفحة حيث قسم الفيديو (VideoSection)
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // في حال عدم توفر window لأي سبب
      }
      return;
    }
    if (!canWatch && courseId) {
      // إن لم يكن الطالب مشتركاً ولا توجد معاينة، نحوله للدفع
      router.push(`/checkout/${courseId}`);
      return;
    }

    // ملاحظة: الدرس يُكمل تلقائياً عند فتح صفحة /watch
    const query = `lessonId=${lessonId}` + (chapterId ? `&chapterId=${chapterId}` : '') + (courseId ? `&courseId=${courseId}` : '');
    router.push(`/watch?${query}`);
  };



  const getTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content">
            {!hideOverview && (
              <>
                <h2>وصف الكورس :</h2>
                {courseDescription ? (
                  <p className="course-overview">{publicView ? publicDescription(courseDescription) : courseDescription}</p>
                ) : null}
              </>
            )}
            {/* إزالة النص التجريبي واستبداله بالوصف الحقيقي فقط */}

            <h2>محتوى الكورس :</h2>
            <p className="course-content-subtitle">{publicView ? 'استكشف الفصول والدروس. عرض المحتوى الكامل يخضع لصلاحيات التسجيل.' : 'نحن هنا لمساعدتك والإجابة على أسئلتك'}</p>
            {publicView && contentSections.length === 0 && <p role="status">لا توجد فصول منشورة لهذا المقرر حاليًا.</p>}

            <div id={publicView ? 'course-curriculum' : undefined} className="course-content-dropdowns">
              {contentSections.map((section, index) => (
                <div key={section.id} className="dropdown-section">
                  <button
                    className={`dropdown-header ${expandedSections[section.id] ? 'expanded' : ''}`}
                    aria-expanded={!!expandedSections[section.id]}
                    aria-controls={`content-${section.id}`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="dropdown-title-container">
                      <span className="dropdown-title">{publicView ? section.title.replace(` في ${courseTitle}`, '') : section.title}</span>
                      {publicView && <small>{section.lessons.length} دروس</small>}
                    </div>
                    <svg
                      className={`dropdown-arrow ${expandedSections[section.id] ? 'rotated' : ''}`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </button>

                  {expandedSections[section.id] && (
                    <div id={`content-${section.id}`} className="dropdown-content">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={`lesson-${lesson.id}-${lessonIndex}`}
                          className={`lesson-item ${activeLessonId === lesson.id ? 'active' : ''}`}
                          data-lesson-id={lesson.id}
                          data-status={lessonStatuses[lesson.id] || 'unknown'}
                        >
                          <div className="lesson-info">
                            {lessonStatuses[lesson.id] === 'completed' && (
                              <span
                                className="lesson-completed"
                                title="تم مشاهدة هذا الدرس"
                                aria-label="تم مشاهدة هذا الدرس"
                              >
                                <FaCheckCircle className="completed-icon" size={18} />
                              </span>
                            )}
                            <span className="lesson-title">{publicView ? lesson.title.replace(` — ${courseTitle}`, '') : lesson.title}</span>
                          </div>
                          <button
                            className="play-lesson-btn"
                            disabled={!hasRealContent}
                            onClick={() =>
                              handleLessonNavigate(
                                lesson.id,
                                Number(section.id.replace('chapter-', '')),
                                isEnrolled,
                                !isEnrolled && !!lesson.video_url
                              )
                            }
                          >
                            <svg viewBox="0 0 24 24" className="play-icon-small">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>{
                              hasRealContent
                                ? (isEnrolled
                                  ? 'مشاهدة'
                                  : (lesson.video_url ? 'معاينة' : publicView ? 'يتطلب التسجيل' : 'اشترِ الآن'))
                                : 'قريباً'
                            }</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        );
      case 'instructor':
        return (
          <InstructorProfile
            instructorName={instructorName}
            instructorImage={instructorImage}
            coursesCount={instructorCoursesCount}
            studentsCount={instructorStudentsCount}
            title={instructorTitle}
            bio={instructorBio}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="left-content">
      {/* Course Title */}
      {!publicView && <h1 className="course-title">{courseTitle}</h1>}

      {/* Course Stats */}
      {!hideStats && (
        <div className="course-stats">
          <div className="stat-card">
            <BookOpen className="stat-icon" />
            <div className="stat-copy">
              <strong>{formatNumber(stats.lessons)} درس</strong>
              <span>{formatNumber(stats.chapters)} فصل</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock3 className="stat-icon" />
            <div className="stat-copy">
              <strong>{formatDuration(stats.durationSeconds)}</strong>
              <span>مدة المحتوى</span>
            </div>
          </div>
          <div className="stat-card">
            <Users className="stat-icon" />
            <div className="stat-copy">
              <strong>{formatNumber(stats.students)} طالب</strong>
              <span>{publicView ? 'تسجيلات ضمن العرض' : 'مسجل فعليًا'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            نظرة عامة
          </button>
          {/* <button 
            className={`tab-button ${activeTab === 'instructor' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructor')}
          >
            المحاضر
          </button> */}
        </div>
        {getTabContent()}
      </div>

      <style jsx>{`
        .left-content {
          width: 100%;
          padding: 0 16px;
        }

        .course-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 8px 0 16px;
          text-align: right;
        }

        .course-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 18px 0 20px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 74px;
          padding: 12px;
          border: 1px solid #e7e8f3;
          border-radius: 8px;
          background: #fff;
          color: #1f2333;
          box-shadow: 0 8px 20px rgba(20, 28, 60, 0.05);
        }

        .stat-icon {
          width: 22px;
          height: 22px;
          color: #4142D0;
          flex: 0 0 auto;
        }

        .stat-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          text-align: right;
        }

        .stat-copy strong {
          color: #171923;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.35;
        }

        .stat-copy span {
          color: #6a7084;
          font-size: 12px;
          line-height: 1.35;
        }

        .tabs-container {
          margin-top: 16px;
        }

        .tabs-nav {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }

        .tab-button {
          padding: 8px 12px;
          border: none;
          background: #f5f5f5;
          color: #333;
          border-radius: 6px;
          cursor: pointer;
        }

        .tab-button.active {
          background: #4142D0;
          color: #fff;
        }

        .tab-content {
          margin-top: 16px;
        }

        .course-overview {
          line-height: 1.8;
          color: #333;
          margin: 8px 0 16px;
          text-align: right;
          direction: rtl;
        }

        .course-content-subtitle {
          color: #666;
          margin-bottom: 12px;
        }

        .course-content-dropdowns {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dropdown-section {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }

        .dropdown-header {
          background-color: #f8f9fa;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .dropdown-title-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-number {
          background-color: #eef1ff;
          color: #4142D0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          min-width: 48px;
          text-align: center;
        }

        .dropdown-title {
          color: #333;
          font-weight: 600;
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        .dropdown-content {
          position: static;
          padding: 8px 0;
        }

        .review-item {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .instructor-details h4 {
          color: #4142D0;
          margin: 20px 0 10px 0;
        }
        
        .instructor-details ul {
          padding-right: 20px;
          margin-bottom: 15px;
        }
        
        .instructor-details li {
          margin-bottom: 5px;
          color: #666;
        }

        .course-content-sections {
          margin-top: 20px;
        }

        .content-section {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 10px;
          overflow: hidden;
        }

        .section-header {
          background-color: #f8f9fa;
          padding: 15px 20px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color 0.2s;
        }

        .section-header:hover {
          background-color: #e9ecef;
        }

        .section-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .dropdown-arrow {
          width: 20px;
          height: 20px;
          fill: #666;
          transition: transform 0.2s;
        }

        .dropdown-arrow.expanded {
          transform: rotate(180deg);
        }

        .section-content {
          padding: 0;
        }

        .lesson-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid #f0f0f0;
          background-color: white;
        }

        .lesson-item.active {
          background-color: #f0f7ff;
          border-right: 3px solid #4142D0;
        }

        .lesson-item:last-child {
          border-bottom: none;
        }

        .lesson-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

       

        .lesson-duration {
          background-color: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          min-width: 40px;
          text-align: center;
        }

        .lesson-type {
          color: #4142D0;
          font-size: 14px;
          text-decoration: underline;
        }

        .play-icon {
          width: 16px;
          height: 16px;
          fill: #4142D0;
        }

        .play-lesson-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #eef1ff;
          color: #4142D0;
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
        }

        .play-lesson-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .play-icon-small {
          width: 16px;
          height: 16px;
          fill: #4142D0;
        }

        .lesson-title {
          color: #333;
          font-size: 14px;
          text-align: right;
          flex: 1;
          min-width: 0; /* يمنع دفع الأيقونة خارج الحاوية */
        }

        .lesson-item.active .lesson-title {
          color: #1a237e;
          font-weight: 600;
        }

        .lesson-completed {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 6px; /* وضع الأيقونة قبل العنوان */
          flex: 0 0 auto;
        }

        .completed-icon {
          width: 18px;
          height: 18px;
          color: #2ecc71; /* لون الأيقونة عبر react-icons */
        }

        @media (max-width: 768px) {
          .course-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 420px) {
          .course-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseContent;
