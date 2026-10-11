'use client';
import { brand } from '@/lib/brand'

const SIMULATION_ENABLED = false;

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomeHeader from '../../components/HomeHeader';
import Footer from '../../components/Footer';
import VideoSection from '../../components/VideoSection';
import CourseContent from '../../components/CourseContent';
import ScrollToTop from '../../components/ScrollToTop';
import { WatchPageSkeleton, SkeletonVideo, SkeletonBreadcrumb, SkeletonNavigation, SkeletonCourseContent } from '../../components/Skeleton';
import styles from './watch.module.css'; // تأكد من أن هذا المسار صحيح
import FinalExam from '../../components/FinalExam';
import Certificate from '../../components/Certificate';
import {
  getUserLesson,
  completeLesson,
  getLessonNavigation,
  startLessonWatchSession,
  recordWatchEvent,
  sendWatchHeartbeat,
  type LessonNavigation,
  type Lesson,
  type VideoWatchEventType,
} from '../../utils/lessonService';

import { getLessonQuiz } from '../../utils/quizService';
import { getBackendAssetUrl } from '../../utils/url';
import { isAuthenticated, getAuthToken } from '../../utils/authService';
import { Course, getCourseDetails, getCourseProgress, getCourseProgressDetails, checkCourseAccess } from '../../utils/courseService';
import Toast from '../../components/Toast';
import { isDemoMode } from '../../utils/demoMode';
import StudentWorkspace from '@/components/student/StudentWorkspace';
import StudentLessonView from '@/components/student/StudentLesson';
import '@/styles/toast.css';

const watchSessionStartCache = new Map<string, {
  promise: ReturnType<typeof startLessonWatchSession>;
  createdAt: number;
}>();

// تعريف أنواع البيانات
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

// تعريف نوع البيانات للكويز
interface LessonQuiz {
  id: number;
  title: string;
  description?: string | null;
  max_attempts?: number;
  passing_score?: number;
  time_limit?: number;
  attempts_used?: number;
  attempts_remaining?: number;
  quiz?: {
    id: number;
    [key: string]: any;
  };
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    type: 'single' | 'multiple';
    correctAnswer: number | number[] | null;
    [key: string]: any;
  }>;
  [key: string]: any;
}

function WatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // استخراج المعاملات من URL
  const lessonId = searchParams.get('lessonId') ? parseInt(searchParams.get('lessonId')!) : null;
  const chapterId = searchParams.get('chapterId') ? parseInt(searchParams.get('chapterId')!) : null;
  const courseId = searchParams.get('courseId') ? parseInt(searchParams.get('courseId')!) : null;
  const completeOnOpen = searchParams.get('completeOnOpen') === '1';

  // الحالات المحلية
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ألغينا نافذة الكويز بين الدروس
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [courseProgress, setCourseProgress] = useState<any>(null);
  const [simulationMode, setSimulationMode] = useState(SIMULATION_ENABLED);
  const [lessonNav, setLessonNav] = useState<LessonNavigation | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('warning');
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [watchSessionId, setWatchSessionId] = useState<number | null>(null);
  const [heartbeatActive, setHeartbeatActive] = useState(false);

  const watchSessionIdRef = useRef<number | null>(null);
  const trackingLessonIdRef = useRef<number | null>(null);
  const heartbeatSecondsRef = useRef(20);
  const lastProgressEventAtRef = useRef(0);
  const lastPositionSecondsRef = useRef(0);
  const durationSecondsRef = useRef(0);
  const isPlayingRef = useRef(false);
  const completedEventSentRef = useRef(false);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // حالات الكويز
  const [quizData, setQuizData] = useState<LessonQuiz | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  // المتغيرات المحسوبة
  const sequenceBlocked = false; // يمكن تحديد منطق منع التسلسل هنا
  const thumbnailUrl = lesson?.thumbnail ? getBackendAssetUrl(lesson.thumbnail) : '';
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const isQuizRequired = quizData && quizData.questions && quizData.questions.length > 0;
  const isLocked = false; // يمكن تحديد منطق القفل هنا
  const lockMessage = '';

  const completeLessonWithTracking = useCallback(async (targetLessonId: number | string) => {
    if (isDemoMode) return;
    await completeLesson(targetLessonId, watchSessionIdRef.current
      ? { session_id: watchSessionIdRef.current, completion_source: 'manual' }
      : undefined
    );
  }, []);

  const getVideoSnapshot = (video?: HTMLVideoElement | null) => {
    const position = Number.isFinite(video?.currentTime)
      ? Math.max(0, Math.floor(video?.currentTime ?? 0))
      : lastPositionSecondsRef.current;
    const duration = Number.isFinite(video?.duration)
      ? Math.max(0, Math.floor(video?.duration ?? 0))
      : durationSecondsRef.current;

    lastPositionSecondsRef.current = position;
    if (duration > 0) durationSecondsRef.current = duration;

    return { position, duration };
  };

  const sendTrackingEvent = useCallback((
    eventType: VideoWatchEventType,
    video?: HTMLVideoElement | null,
    metadata?: Record<string, unknown>
  ) => {
    if (isDemoMode) return;
    const sessionId = watchSessionIdRef.current;
    if (!sessionId) return;

    const { position, duration } = getVideoSnapshot(video);
    recordWatchEvent(sessionId, {
      event_type: eventType,
      position_seconds: position,
      duration_seconds: duration || undefined,
      playback_rate: video?.playbackRate,
      metadata,
    }).catch(() => undefined);
  }, []);

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // التحقق من وجود المعاملات المطلوبة
        if (!lessonId || !chapterId || !courseId) {
          setError('معاملات غير صحيحة في الرابط');
          return;
        }

        // حارس الوصول: استخدم GET /api/courses/{courseId}/progress للتحقق النهائي
        try {
          const access = await checkCourseAccess(courseId);
          if (!access.allowed) {
            showToast('غير مسموح بالدخول، يرجى الاشتراك في الدبلومة', 'warning');
            setTimeout(() => {
              router.push(`/course-details/${courseId}`);
            }, 1500);
            return;
          }
          // استخدام بيانات التقدم المضمنة لتفادي اتصال إضافي لنفس المسار
          if (access?.data?.course_progress) {
            setCourseProgress(access.data.course_progress);
          }
        } catch (guardErr) {
          console.warn('تعذر تنفيذ حارس الوصول للكورس:', guardErr);
          showToast('تعذر التحقق من الوصول للمحتوى', 'error');
          setTimeout(() => {
            router.push(`/course-details/${courseId}`);
          }, 1500);
          return;
        }

        // الاعتماد فقط على التوكن بدون أي مزامنة كوكيز
        // لا يوجد أي تعامل مع الكوكيز هنا حسب طلبك

        // تحميل بيانات الكورس والدرس بالتوازي لتسريع التحميل
        const [courseData, lessonData] = await Promise.all([
          // تحميل الكورس إذا لم يكن موجوداً
          (!course || Number(course.id) !== Number(courseId))
            ? getCourseDetails(courseId)
            : Promise.resolve(course),
          // تحميل الدرس
          getUserLesson(lessonId)
        ]);

        if (courseData && (!course || Number(course.id) !== Number(courseId))) {
          setCourse(courseData);
        }
        setLesson(lessonData.lesson);

        // استخدام الرابط المباشر فقط مع تحويله لمسار كامل من الباك إند
        const rawUrl = lessonData?.lesson?.video_url || '';
        const direct = rawUrl
          ? (/^https?:\/\//.test(rawUrl) ? rawUrl : getBackendAssetUrl(rawUrl))
          : '';
        setResolvedVideoUrl(direct);

        // إيقاف loading بعد تحميل البيانات الأساسية (الفيديو جاهز للعرض)
        setLoading(false);

        // العمليات الثانوية تتم في الخلفية بعد عرض المحتوى
        // إكمال الدرس تلقائياً
        if (!isDemoMode) completeLesson(lessonId)
          .then(() => {
            console.log('[Watch] Auto-completed lesson:', lessonId);
            setAutoCompleted(true);
          })
          .catch((err) => console.warn('[Watch] Failed to auto-complete:', err));

        // تحديث التقدم وجلب الكويز والتنقل بالتوازي
        Promise.all([
          getCourseProgressDetails(courseId).catch(() => null),
          getLessonQuiz(lessonId).catch(() => null),
          getLessonNavigation(lessonId).catch(() => null)
        ]).then(([progressDetails, quiz, nav]) => {
          if (progressDetails) setCourseProgress(progressDetails as any);
          if (quiz) {
            setQuizData(quiz);
            if (progressDetails) {
              const lessons = (progressDetails as any).lessons;
              const lessonProgress = lessons?.find((l: any) => l.lesson_id === lessonId);
              setQuizFinished(lessonProgress?.quiz_completed || false);
            }
          }
          if (nav) setLessonNav(nav);
        });

      } catch (err) {
        console.error('خطأ في تحميل البيانات:', err);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lessonId, chapterId, courseId, router]);

  useEffect(() => {
    watchSessionIdRef.current = null;
    setWatchSessionId(null);
    setHeartbeatActive(false);
    trackingLessonIdRef.current = null;
    heartbeatSecondsRef.current = 20;
    lastProgressEventAtRef.current = 0;
    lastPositionSecondsRef.current = 0;
    durationSecondsRef.current = 0;
    isPlayingRef.current = false;
    completedEventSentRef.current = false;
  }, [lessonId]);

  useEffect(() => {
    if (isDemoMode || !lesson?.id || !resolvedVideoUrl || trackingLessonIdRef.current === Number(lesson.id)) {
      return;
    }

    trackingLessonIdRef.current = Number(lesson.id);
    let cancelled = false;
    const cacheKey = `${lesson.id}:${lesson.video_guid || ''}:${resolvedVideoUrl}`;
    const cachedStart = watchSessionStartCache.get(cacheKey);
    const now = Date.now();

    watchSessionStartCache.forEach((entry, key) => {
      if (now - entry.createdAt > 60000) {
        watchSessionStartCache.delete(key);
      }
    });

    const startPromise = cachedStart && now - cachedStart.createdAt < 10000
      ? cachedStart.promise
      : startLessonWatchSession(lesson.id, {
        video_guid: lesson.video_guid || undefined,
        position_seconds: 0,
        duration_seconds: 0,
      });

    if (!cachedStart || now - cachedStart.createdAt >= 10000) {
      watchSessionStartCache.set(cacheKey, { promise: startPromise, createdAt: now });
    }

    startPromise.then((session) => {
      if (cancelled) return;
      const sessionId = session?.session_id ?? null;
      if (!sessionId) {
        return;
      }

      watchSessionIdRef.current = sessionId;
      setWatchSessionId(sessionId);
      heartbeatSecondsRef.current = Math.max(5, Number(session?.heartbeat_interval ?? 20));
      setHeartbeatActive(isPlayingRef.current);
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [lesson?.id, lesson?.video_guid, resolvedVideoUrl]);

  useEffect(() => {
    if (isDemoMode || !watchSessionId || !heartbeatActive) return;

    const tick = () => {
      const sessionId = watchSessionIdRef.current;
      if (!sessionId) return;

      sendWatchHeartbeat(sessionId, {
        position_seconds: lastPositionSecondsRef.current,
        duration_seconds: durationSecondsRef.current || undefined,
        is_playing: isPlayingRef.current,
      }).catch(() => undefined);
    };

    const intervalMs = Math.max(5, heartbeatSecondsRef.current) * 1000;
    const intervalId = window.setInterval(tick, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [heartbeatActive, watchSessionId]);

  const handleVideoLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    getVideoSnapshot(video);
    sendTrackingEvent('started', video, { source: 'loaded_metadata' });
  }, [sendTrackingEvent]);

  const handleVideoPlay = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    isPlayingRef.current = true;
    if (watchSessionIdRef.current) {
      setHeartbeatActive(true);
    }
    sendTrackingEvent('play', event.currentTarget);
  }, [sendTrackingEvent]);

  const handleVideoPause = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    isPlayingRef.current = false;
    setHeartbeatActive(false);
    if (!event.currentTarget.ended) {
      sendTrackingEvent('pause', event.currentTarget);
    }
  }, [sendTrackingEvent]);

  const handleVideoSeeked = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    sendTrackingEvent('seek', event.currentTarget);
  }, [sendTrackingEvent]);

  const handleVideoTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    getVideoSnapshot(event.currentTarget);
    const now = Date.now();
    if (now - lastProgressEventAtRef.current < 15000) {
      return;
    }

    lastProgressEventAtRef.current = now;
    sendTrackingEvent('progress', event.currentTarget);
  }, [sendTrackingEvent]);

  // بناء تسلسل الدروس اعتمادًا على بيانات الكورس كـ fallback آمن
  const flatLessons = useMemo(() => {
    if (!course) return [] as Array<{ id: number; chapterId: number }>;
    const items: Array<{ id: number; chapterId: number }> = [];
    (course.chapters || []).forEach((ch: any) => {
      const lessons = Array.isArray(ch.lessons) ? ch.lessons : [];
      // نستخدم ترتيب الدروس كما هو مرسل من الباك إند
      lessons.forEach((ls: any) => {
        if (ls && ls.id != null) {
          items.push({ id: Number(ls.id), chapterId: Number(ch.id) });
        }
      });
    });
    return items;
  }, [course]);

  const currentIndex = useMemo(() => {
    if (!lessonId) return -1;
    return flatLessons.findIndex((l) => Number(l.id) === Number(lessonId));
  }, [flatLessons, lessonId]);

  // حساب الدروس السابقة والتالية اعتمادًا على تسلسل الكورس (بدلاً من الاعتماد فقط على واجهة التنقل)
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!course || currentIndex < 0) return { prevLesson: null, nextLesson: null };
    const prev = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
    return { prevLesson: prev, nextLesson: next };
  }, [course, flatLessons, currentIndex]);

  // مؤشرات الحالة اعتمادًا على تسلسل الكورس لضمان عدم اعتبار كل درس كالأخير
  const isLastLesson = useMemo(() => {
    if (currentIndex < 0) return false;
    return currentIndex === flatLessons.length - 1;
  }, [flatLessons, currentIndex]);

  const isNextLast = useMemo(() => {
    if (currentIndex < 0) return false;
    return currentIndex === flatLessons.length - 2;
  }, [flatLessons, currentIndex]);

  // دالة إنهاء الدبلومة
  const handleDiplomaCompletion = async () => {
    if (!course || !lesson) return;

    try {
      // إكمال الدرس الحالي أولاً
      await completeLessonWithTracking(lesson.id);

      // عرض alert مبروك
      alert('🎉 مبروك! لقد أتممت المقرر بنجاح 🎉\n\nسيتم تحويلك الآن إلى صفحة تفاصيل الدبلومة');

      // التحويل لصفحة تفاصيل الدبلومة
      if (course.category?.name) {
        // استخدام اسم الدبلومة كـ slug (يمكن تحسينه لاحقاً)
        const diplomaSlug = course.category.name.toLowerCase().replace(/\s+/g, '-');
        router.push(`/diplomas/${diplomaSlug}`);
      } else {
        // fallback إلى صفحة الدبلومات العامة
        router.push('/diplomas');
      }
    } catch (error) {
      console.error('خطأ في إنهاء الدبلومة:', error);
      alert('حدث خطأ أثناء إنهاء الدبلومة. يرجى المحاولة مرة أخرى.');
    }
  };

  // دوال معالجة الأحداث
  const handleCertificateClose = () => {
    setShowCertificate(false);
  };

  const handleFinalExamComplete = () => {
    setShowFinalExam(false);
    setShowCertificate(true);
  };

  const navigateToLesson = useCallback(async (target: { id: number; chapterId: number } | null) => {
    console.log("--- Inside navigateToLesson ---");
    console.log("Target Lesson:", target);
    console.log("Current Lesson ID:", lessonId);
    console.log("Is Moving Forward:", target && target.id > (lessonId || 0));
    console.log("Simulation Mode:", simulationMode);
    console.log("Is Quiz Required for CURRENT lesson?", isQuizRequired);
    console.log("Is Quiz Finished for CURRENT lesson?", quizFinished);
    console.log("--- End navigateToLesson Check ---");

    if (!target || !courseId) return;

    // إذا كان الانتقال للأمام: أكمِل الدرس الحالي دائمًا ثم انتقل
    if (target.id > (lessonId || 0)) {
      if (lessonId) {
        console.log('[Watch] completing current lesson before moving forward');
        try { await completeLessonWithTracking(lessonId); } catch (e) { console.warn('تعذر إكمال الدرس قبل الانتقال:', e); }
        // تحديث شريط التقدم
        try { const progress = await getCourseProgress(courseId); setCourseProgress(progress); } catch { }
      }
    }

    // التأكد من تمرير كل المعرفات اللازمة
    router.push(`/watch?lessonId=${target.id}&chapterId=${target.chapterId}&courseId=${courseId}`);
  }, [completeLessonWithTracking, courseId, isQuizRequired, lessonId, quizFinished, router, simulationMode]);

  const handleVideoEnded = useCallback(async () => {
    isPlayingRef.current = false;
    setHeartbeatActive(false);

    if (!completedEventSentRef.current) {
      completedEventSentRef.current = true;
      sendTrackingEvent('completed', null, { source: 'video_ended' });
    }

    await navigateToLesson(nextLesson);
  }, [navigateToLesson, nextLesson, sendTrackingEvent]);

  const goToMyExams = async () => {
    if (!lessonId) return;
    try {
      await completeLessonWithTracking(lessonId);
    } catch (e) {
      console.warn('تعذر إكمال الدرس الأخير قبل التحويل:', e);
    }
    router.push('/user/my_exams');
  };

  // عرض الشهادة
  if (showCertificate && course) {
    return (
      <Certificate
        courseName={course.title}
        instructorName={course.instructor?.name || "المدرب"}
        studentName="الطالب"
        completionDate={new Date().toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
        onClose={handleCertificateClose}
      />
    );
  }

  // عرض الامتحان النهائي
  if (showFinalExam && course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">الامتحان النهائي</h1>
              <p className="text-gray-600 mb-4">كورس: {course.title}</p>
            </div>
            <FinalExam onComplete={handleFinalExamComplete} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['watch-page']} style={{ width: '100%', minHeight: '100vh' }}>
      <HomeHeader />
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={2500}
      />

      <main className={styles['watch-main']} style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
        {/* Video Section */}
        <div className={styles['video-container']} style={{ width: '100%' }}>
          {loading ? (
            <SkeletonVideo />
          ) : error ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px', color: '#e74c3c' }}>
              {error}
            </div>
          ) : (
            <VideoSection
              thumbnailUrl={thumbnailUrl}
              videoUrl={resolvedVideoUrl}
              alt={lesson?.title || 'Course Video'}
              isLocked={isLocked}
              lockMessage={lockMessage}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onSeeked={handleVideoSeeked}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          )}

          {/* Breadcrumb Navigation - تحت الفيديو */}
          {loading ? (
            <SkeletonBreadcrumb items={4} />
          ) : lesson && course && (
            <nav className={styles['breadcrumb']}>
              <a href="/" className={styles['breadcrumb-item']}>
                <svg className={styles['breadcrumb-home-icon']} viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                الرئيسية
              </a>
              <a href="/diploms" className={styles['breadcrumb-item']}>
                دبلومات {brand.name}
              </a>
              <a
                href={`/diplomas/${(course.category as any)?.name?.slug || (course.category as any)?.slug || (course.category as any)?.id || ''}`}
                className={styles['breadcrumb-item']}
              >
                {(() => {
                  const cat = course.category as any;
                  if (!cat) return 'الدبلومة';
                  // البيانات تأتي بصيغة: category.name = { id, name, slug, ... }
                  // اسم الدبلومة الفعلي هو category.name.name
                  if (cat.name && typeof cat.name === 'object' && cat.name.name) {
                    return cat.name.name;
                  }
                  if (typeof cat.name === 'string') return cat.name;
                  return cat.title || 'الدبلومة';
                })()}
              </a>
              <a
                href={`/course-details/${course.id}`}
                className={styles['breadcrumb-item']}
              >
                {course.title || 'المقرر'}
              </a>
              <span className={`${styles['breadcrumb-item']} ${styles['active']}`}>
                {typeof lesson.title === 'string' ? lesson.title : ((lesson.title as any)?.ar || (lesson.title as any)?.en || 'الدرس')}
              </span>
            </nav>
          )}

          {/* Previous / Next lesson navigation */}
          <div className={styles['lesson-navigation']}>
            {/* زر السابق - على اليمين دائماً */}
            <button
              className={styles['lesson-nav-btn']}
              onClick={() => navigateToLesson(prevLesson)}
              disabled={!prevLesson}
            >
              <svg className={styles['lesson-nav-icon']} viewBox="0 0 24 24" style={{ transform: 'scaleX(-1)' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>السابق</span>
            </button>

            {/* الملاحظة - في المنتصف */}
            {isNextLast && (
              <div className={styles['last-lesson-note']} role="status" aria-live="polite">
                <svg className={styles['note-icon']} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" />
                </svg>
                <span>ملاحظة: الدرس القادم هو الأخير</span>
              </div>
            )}
            {/* placeholder للحفاظ على المسافات عند عدم وجود ملاحظة */}
            {!isNextLast && <div className={styles['nav-spacer']}></div>}

            {/* زر التالي/اختباراتي - على اليسار دائماً */}
            {isLastLesson ? (
              <button
                className={styles['lesson-nav-btn']}
                onClick={goToMyExams}
              >
                <span>اختباراتي</span>
                <svg className={styles['lesson-nav-icon']} viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                className={styles['lesson-nav-btn']}
                onClick={() => navigateToLesson(nextLesson)}
                disabled={!nextLesson || sequenceBlocked}
              >
                <span>التالي</span>
                {isNextLast && (
                  <span className={styles['final-badge']}>الأخير</span>
                )}
                <svg className={styles['lesson-nav-icon']} viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Course Content Section */}
        <div className={styles['course-content-section']} style={{ width: '100%', maxWidth: '100%', margin: 0 }}>
          {loading ? (
            <SkeletonCourseContent chapters={2} lessonsPerChapter={4} />
          ) : course && (
            <CourseContent
              courseTitle={lesson?.title || 'عنوان الدرس'}
              lecturesCount={(course.chapters || []).reduce((acc, ch) => acc + ((ch.lessons || []).length), 0)}
              studentsCount={Number(course.students_count ?? 0)}
              hoursCount={Number(course.duration ?? 0)}
              courseDescription={course.description || ''}
              hideOverview={true}
              hideStats={true}
              courseId={String(course.id)}
              isEnrolled={true}
              chapters={course.chapters || []}
              currentLessonId={lessonId}
              currentChapterId={chapterId}
              courseProgress={courseProgress}
              onLessonClick={(lsId, chId) => {
                navigateToLesson({ id: lsId, chapterId: chId });
              }}
            />
          )}
        </div>

        {/* تم إلغاء نافذة الكويز بين الدروس */}
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

// المكون الأساسي الذي يُصدّر
function DemoWatchPage() {
  const params = useSearchParams();
  return <StudentWorkspace><StudentLessonView courseId={Number(params.get('courseId'))} chapterId={Number(params.get('chapterId'))} lessonId={Number(params.get('lessonId'))}/></StudentWorkspace>;
}
export default function WatchPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>جاري التحميل...</div>}>
      {isDemoMode ? <DemoWatchPage/> : <WatchPageContent />}
    </Suspense>
  );
}
