"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, ClipboardList, Check } from "lucide-react";
import { useStudent } from "./StudentProvider";
import { PageIntro, BackLink, ReadError } from "./LearningPrimitives";
import {
  loadActiveExam,
  examHref,
  courseHref,
  type ActiveExam,
} from "@/utils/studentJourney";
import styles from "./Student.module.css";

export function StudentExams() {
  const { exams } = useStudent();
  return (
    <div data-student-page="exams">
      <PageIntro
        eyebrow="LEARN / REFLECT / ACHIEVE"
        title="اختباراتي. مساحة للتقييم."
      >
        حالة التقييم مستقلة عن نسبة إنجاز الدروس. في العرض لا نبدأ محاولات جديدة
        ولا نرسل إجابات.
      </PageIntro>
      <div className={styles.examGrid}>
        {exams
          .filter((item) => item.has_final_exam)
          .sort(
            (a, b) =>
              Number(b.active_attempt_status === "in_progress") -
              Number(a.active_attempt_status === "in_progress"),
          )
          .map((exam) => (
            <article
              key={exam.course_id}
              className={styles.examCard}
              data-exam-course={exam.course_id}
            >
              <ClipboardList size={27} />
              <span
                className={styles.badge}
                data-complete={exam.exam_status === "passed"}
              >
                {exam.exam_status === "passed"
                  ? "تم اجتياز التقييم"
                  : exam.active_attempt_status === "in_progress"
                    ? "محاولة قيد التقدم"
                    : "تقييم لم يُنجز"}
              </span>
              <h2>{exam.course_title}</h2>
              {exam.last_score !== null && (
                <p>
                  آخر درجة مسجلة: <bdi>{exam.last_score}%</bdi>
                </p>
              )}
              <p>
                {exam.active_attempt_status === "in_progress"
                  ? "استرجع أسئلة المحاولة الموجودة للقراءة فقط."
                  : "تابع سياق المقرر ومتطلبات التقييم من سجلاتك."}
              </p>
              <div className={styles.cardActions}>
                {exam.active_attempt_status === "in_progress" ? (
                  <Link href={examHref(exam.course_id)} data-active-exam>
                    عرض أسئلة المحاولة <ArrowUpLeft size={17} />
                  </Link>
                ) : (
                  <Link href={courseHref(exam.course_id)}>
                    سياق المقرر <ArrowUpLeft size={17} />
                  </Link>
                )}
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
export function StudentExamShowcase({ courseId }: { courseId: number }) {
  const { courses, exams } = useStudent();
  const course = courses.find((item) => item.id === courseId);
  const exam = exams.find((item) => item.course_id === courseId);
  const [attempt, setAttempt] = useState<ActiveExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!course) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    void loadActiveExam(
      courseId,
      AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
    )
      .then((value) => {
        if (!controller.signal.aborted) setAttempt(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [courseId, course]);
  if (!course || failed)
    return (
      <ReadError>
        لا يمكن عرض اختبار غير مرتبط بتسجيلاتك، أو تعذر الاتصال بالخادم.
      </ReadError>
    );
  if (loading)
    return (
      <p role="status">جارٍ استرجاع المحاولة الموجودة دون إنشاء محاولة…</p>
    );
  return (
    <div data-student-page="final-exam">
      <BackLink href="/user/my_exams">اختباراتي</BackLink>
      <PageIntro
        eyebrow="FINAL EXAM / READ-ONLY SHOWCASE"
        title={`الاختبار النهائي: ${course.title}`}
      >
        نستعرض الأسئلة الفعلية المرتبطة بمحاولتك الحالية. لا توجد إجابات صحيحة
        مكشوفة أو نتائج مصطنعة.
      </PageIntro>
      <div className={styles.examNotice} id="exam-readonly-notice" role="note">
        <Check size={20} />
        <span>
          للقراءة فقط — لا اختيار إجابات أو إرسال أو تصحيح أو إصدار شهادة. حالة
          التقييم:{" "}
          {exam?.active_attempt_status === "in_progress"
            ? "قيد التقدم"
            : "لا محاولة نشطة"}
          .
        </span>
      </div>
      {!attempt ? (
        <div className={styles.empty}>
          <h2>لا توجد محاولة نشطة لهذا المقرر.</h2>
          <p>لن نبدأ محاولة أو نختلق أسئلة في وضع العرض.</p>
        </div>
      ) : (
        <>
          <nav
            className={styles.questionNavigation}
            aria-label="انتقل إلى سؤال"
          >
            <span>{attempt.questions.length} أسئلة فعلية</span>
            {attempt.questions.map((question, index) => (
              <a
                key={question.id}
                href={`#exam-question-${question.id}`}
                aria-label={`السؤال ${index + 1}`}
              >
                {index + 1}
              </a>
            ))}
          </nav>
          <div className={styles.questions}>
            {attempt.questions.map((question, index) => (
              <section
                key={question.id}
                id={`exam-question-${question.id}`}
                className={styles.question}
                data-exam-question={question.id}
                aria-labelledby={`question-title-${question.id}`}
              >
                <span className={styles.kicker}>
                  السؤال {index + 1} / {attempt.questions.length}
                </span>
                <h2 id={`question-title-${question.id}`}>
                  <bdi>{question.question}</bdi>
                </h2>
                <ol
                  className={styles.options}
                  aria-label="خيارات السؤال للعرض فقط"
                >
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex}>
                      <span aria-hidden="true">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <bdi>{option}</bdi>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          <button
            className={styles.disabledAction}
            type="button"
            disabled
            aria-describedby="exam-readonly-notice"
          >
            إرسال الإجابات غير متاح في العرض
          </button>
        </>
      )}
    </div>
  );
}
