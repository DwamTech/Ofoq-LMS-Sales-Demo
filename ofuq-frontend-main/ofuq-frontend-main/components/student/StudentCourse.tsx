"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, Check, Play, LockKeyhole } from "lucide-react";
import { useStudent } from "./StudentProvider";
import { PageIntro, Progress, BackLink, ReadError } from "./LearningPrimitives";
import {
  loadCourseContext,
  nextLesson,
  lessonHref,
  courseState,
  stateLabel,
  examHref,
  visibleLessons,
  type StudentCourse,
  type CourseProgress,
} from "@/utils/studentJourney";
import styles from "./Student.module.css";

export default function StudentCourseView({ courseId }: { courseId: number }) {
  const { courses, exams, diplomas } = useStudent();
  const enrolled = courses.find((item) => item.id === courseId);
  const [context, setContext] = useState<{
    course: StudentCourse;
    progress: CourseProgress;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enrolled) return;
    const controller = new AbortController();
    setContext(null);
    setFailed(false);
    void loadCourseContext(
      courseId,
      AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    )
      .then((value) => {
        if (!controller.signal.aborted) setContext(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [courseId, enrolled]);
  if (!enrolled)
    return (
      <ReadError>
        المقرر غير موجود في تسجيلاتك. تصفح البرامج العامة دون تجاوز صلاحيات
        الدروس.
      </ReadError>
    );
  if (failed)
    return (
      <ReadError>تعذر جلب الدروس والتقدم؛ لم نستخدم قيمًا افتراضية.</ReadError>
    );
  if (!context)
    return (
      <p role="status" className={styles.loading}>
        جارٍ جلب الدروس وتقدمك المسجل…
      </p>
    );
  const exam = exams.find((item) => item.course_id === courseId);
  const state = courseState(enrolled, exam);
  const next = nextLesson(context.course, context.progress);
  const parent = diplomas.find(
    (item) => item.category.id === enrolled.category_id,
  );
  const lessons = visibleLessons(context.course);
  return (
    <div data-student-page="course" data-course-id={courseId}>
      <BackLink href="/user/my_courses?view=courses">مقرراتي</BackLink>
      <PageIntro
        eyebrow="YOUR COURSE / ONE STEP AT A TIME"
        title={enrolled.title}
      >
        {parent?.category.name}
      </PageIntro>
      <section className={styles.courseSummary}>
        <div>
          <span className={styles.badge} data-complete={state === "completed"}>
            {stateLabel[state]}
          </span>
          <h2>من المعرفة، إلى التطبيق.</h2>
          <p>
            {
              context.progress.lessons.filter(
                (item) => item.status === "completed",
              ).length
            }{" "}
            دروس مكتملة من {context.course.lessons_count}. التقدم مسترجع من
            سجلات المنصة.
          </p>
          <Progress
            value={context.progress.overall_progress}
            label="إنجاز دروس المقرر"
          />
          <div className={styles.cardActions}>
            {next && (
              <Link
                className={styles.primaryAction}
                href={lessonHref(context.course, next)}
                data-continue-lesson
              >
                متابعة التعلّم <ArrowUpLeft size={17} />
              </Link>
            )}
            <Link href={`/course-details/${enrolled.id}`}>
              تفاصيل المقرر العامة ↗
            </Link>
            {enrolled.has_final_exam && (
              <Link href={examHref(courseId)}>ابدأ الاختبار النهائي ←</Link>
            )}
            {state === "completed" && (
              <Link href={`/user/my-certificates?course=${courseId}`}>
                سياق الشهادة ←
              </Link>
            )}
          </div>
        </div>
        <div className={styles.lessonTotals}>
          <strong>{lessons.length}</strong>
          <span>دروس متاحة للاستكشاف</span>
          <small>أكمل الدروس لتحفظ تقدمك، ثم حل الاختبار للحصول على الشهادة.</small>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>مسار المقرر</h2>
          <span>دروس مرتبة داخل فصولها</span>
        </div>
        {context.course.chapters?.map((chapter) => (
          <section key={chapter.id} className={styles.chapter}>
            <h3>{chapter.title}</h3>
            <ol className={styles.lessonList}>
              {chapter.lessons.map((lesson) => {
                const record = context.progress.lessons.find(
                  (item) => item.lesson_id === lesson.id,
                );
                const available = lesson.can_access === true;
                return (
                  <li
                    key={lesson.id}
                    data-lesson-completed={record?.status === "completed"}
                  >
                    <span className={styles.lessonMark}>
                      {record?.status === "completed" ? (
                        <Check size={17} />
                      ) : available ? (
                        <Play size={15} />
                      ) : (
                        <LockKeyhole size={15} />
                      )}
                    </span>
                    <div>
                      <strong>{lesson.title}</strong>
                      <small>
                        {record?.status === "completed"
                          ? "مكتمل"
                          : record?.status === "in_progress"
                            ? "قيد التعلّم"
                            : "لم تبدأ بعد"}{" "}
                        ·{" "}
                        {lesson.duration_seconds
                          ? `${Math.round(lesson.duration_seconds / 60)} دقيقة`
                          : "المدة غير متاحة"}
                      </small>
                    </div>
                    {available ? (
                      <Link
                        href={lessonHref(context.course, {
                          ...lesson,
                          chapter_id: chapter.id,
                        })}
                        aria-label={`عرض الدرس: ${lesson.title}`}
                      >
                        <ArrowUpLeft size={20} />
                      </Link>
                    ) : (
                      <span>غير متاح</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </section>
    </div>
  );
}
