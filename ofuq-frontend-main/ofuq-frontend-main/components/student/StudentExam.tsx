"use client";
import Link from "next/link";
import { ArrowUpLeft, ClipboardList } from "lucide-react";
import { useStudent } from "./StudentProvider";
import { PageIntro } from "./LearningPrimitives";
import { examHref, courseHref } from "@/utils/studentJourney";
import styles from "./Student.module.css";
import LocalExam from "./LocalExam";

export function StudentExams() {
  const { exams } = useStudent();
  return (
    <div data-student-page="exams">
      <PageIntro
        eyebrow="LEARN / REFLECT / ACHIEVE"
        title="اختباراتي. مساحة للتقييم."
      >
        اختبر ما تعلمته، واحفظ نتيجتك، واحصل على شهادتك بعد النجاح.
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
                  ? "تابع إجاباتك المحفوظة وأكمل الاختبار."
                  : "تابع سياق المقرر ومتطلبات التقييم من سجلاتك."}
              </p>
              <div className={styles.cardActions}>
                {exam.has_final_exam ? (
                  <Link href={examHref(exam.course_id)} data-active-exam>
                    {exam.exam_status === "passed"
                      ? "إعادة الاختبار"
                      : "بدء الاختبار"}{" "}
                    <ArrowUpLeft size={17} />
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
  return <LocalExam courseId={courseId} />;
}
