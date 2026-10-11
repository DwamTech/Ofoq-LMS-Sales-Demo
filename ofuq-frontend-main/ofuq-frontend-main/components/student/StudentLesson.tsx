"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Check, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { http } from "@/lib/http";
import { useStudent } from "./StudentProvider";
import { PageIntro, BackLink, ReadError } from "./LearningPrimitives";
import {
  loadCourseContext,
  courseHref,
  visibleLessons,
  lessonHref,
  type StudentLesson,
  type StudentCourse,
  type CourseProgress,
} from "@/utils/studentJourney";
import styles from "./Student.module.css";

export default function StudentLessonView({
  courseId,
  lessonId,
  chapterId,
}: {
  courseId: number;
  lessonId: number;
  chapterId: number;
}) {
  const { courses } = useStudent();
  const enrolled = courses.find((item) => item.id === courseId);
  const [data, setData] = useState<{
    lesson: StudentLesson;
    course: StudentCourse;
    progress: CourseProgress;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enrolled) return;
    const controller = new AbortController();
    setFailed(false);
    setData(null);
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(12000),
    ]);
    void loadCourseContext(courseId, signal)
      .then(async (context) => {
        const expected = visibleLessons(context.course).find(
          (lesson) => lesson.id === lessonId && lesson.chapter_id === chapterId,
        );
        if (!expected)
          throw new Error("Not an available lesson in the enrolled course");
        const { data: response } = await http.get<{ lesson: StudentLesson }>(
          `/lessons/${lessonId}`,
          { signal },
        );
        if (!controller.signal.aborted)
          setData({
            ...context,
            lesson: { ...response.lesson, chapter_id: chapterId },
          });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [courseId, chapterId, lessonId, enrolled]);
  if (!enrolled || failed)
    return (
      <ReadError>
        الدرس غير متاح في تسجيلك أو لا ينتمي إلى المقرر المختار. لم نتجاوز
        صلاحيات المشاهدة.
      </ReadError>
    );
  if (!data) return <p role="status">جارٍ جلب الدرس المصرح به…</p>;
  const ordered = visibleLessons(data.course);
  const index = ordered.findIndex((lesson) => lesson.id === lessonId);
  const previous = ordered[index - 1];
  const next = ordered[index + 1];
  const done = data.progress.lessons.some(
    (record) => record.lesson_id === lessonId && record.status === "completed",
  );
  return (
    <div data-student-page="lesson">
      <BackLink href={courseHref(courseId)}>مسار المقرر</BackLink>
      <PageIntro eyebrow="LEARNING / IN CONTEXT" title={data.lesson.title}>
        {enrolled.title}
      </PageIntro>
      <div className={styles.examNotice} role="note">
        <Check size={19} />
        {done
          ? "هذا الدرس مكتمل في سجلاتك."
          : "تستكشف هذا الدرس دون تغيير حالة التقدم."}{" "}
        · عرض للقراءة فقط
      </div>
      <section className={styles.lessonWorkspace}>
        <div>
          {data.lesson.video_url ? (
            <video
              controls
              preload="metadata"
              src={data.lesson.video_url}
              aria-label={data.lesson.title}
            />
          ) : (
            <div className={styles.videoUnavailable}>
              <Play size={40} />
              <h2>الفيديو غير متاح في بيانات العرض.</h2>
              <p>
                لا يوجد رابط فيديو مصرح به لهذا الدرس. يمكنك استكشاف المحتوى
                ومسار التعلّم؛ لن نعرض مشغلًا وهميًا.
              </p>
            </div>
          )}
          <article className={styles.lessonContent}>
            <span className={styles.kicker}>LESSON NOTES</span>
            <h2>محتوى الدرس</h2>
            <p>
              {data.lesson.content || "لا يوجد محتوى نصي إضافي لهذا الدرس."}
            </p>
            <button type="button" disabled>
              تحديث التقدم غير متاح في العرض
            </button>
          </article>
        </div>
        <aside className={styles.lessonOutline}>
          <h2>
            <BookOpen size={19} />
            دروس المقرر
          </h2>
          {ordered.map((lesson) => (
            <Link
              key={lesson.id}
              href={lessonHref(data.course, lesson)}
              aria-current={lesson.id === lessonId ? "page" : undefined}
            >
              {data.progress.lessons.some(
                (record) =>
                  record.lesson_id === lesson.id &&
                  record.status === "completed",
              ) ? (
                <Check size={16} />
              ) : (
                <span>{ordered.indexOf(lesson) + 1}</span>
              )}
              <bdi>{lesson.title}</bdi>
            </Link>
          ))}
        </aside>
      </section>
      <nav
        className={styles.lessonNavigation}
        aria-label="الدرس السابق والتالي"
      >
        {previous ? (
          <Link href={lessonHref(data.course, previous)}>
            <ArrowRight size={18} />
            الدرس السابق
          </Link>
        ) : (
          <span>بداية المقرر</span>
        )}
        {next ? (
          <Link href={lessonHref(data.course, next)}>
            الدرس التالي <ArrowLeft size={18} />
          </Link>
        ) : (
          <Link href={courseHref(courseId)}>نهاية الدروس · سياق المقرر</Link>
        )}
      </nav>
    </div>
  );
}
