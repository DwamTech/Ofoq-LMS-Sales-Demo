"use client";
import { useState } from "react";
import Link from "next/link";
import { readFrontend, submitLocalExam } from "@/lib/frontendStore";
import { useStudent } from "./StudentProvider";
import { BackLink, PageIntro } from "./LearningPrimitives";
import styles from "./Student.module.css";

export default function LocalExam({ courseId }: { courseId: number }) {
  const { courses } = useStudent(),
    course = courses.find((c) => c.id === courseId);
  const questions = readFrontend().questions.filter(
    (q) => !q.course_id || q.course_id === courseId,
  );
  const key = `mansatak-exam-${courseId}`;
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "{}");
    } catch {
      return {};
    }
  });
  const [score, setScore] = useState<number | null>(
    readFrontend().results[courseId]?.score ?? null,
  );
  const [error, setError] = useState("");
  if (!course) return <p className={styles.empty}>المقرر غير موجود.</p>;
  return (
    <div data-student-page="final-exam">
      <BackLink href="/user/my_exams">اختباراتي</BackLink>
      <PageIntro eyebrow="التقييم النهائي" title={`اختبار: ${course.title}`}>
        أجب عن الأسئلة ثم أرسل إجاباتك. النجاح من 60٪، وبعد النجاح تصدر شهادتك
        تلقائيًا.
      </PageIntro>
      {score !== null && (
        <section className={styles.milestone} role="status">
          <div>
            <h2>نتيجتك: {score}٪</h2>
            <p>
              {score >= 60
                ? "أحسنت! اجتزت الاختبار وأصبحت شهادتك جاهزة."
                : "يمكنك مراجعة الدروس وإعادة المحاولة."}
            </p>
          </div>
          {score >= 60 && (
            <Link href={`/user/my-certificates?course=${courseId}`}>
              عرض الشهادة
            </Link>
          )}
        </section>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            setScore(submitLocalExam(courseId, answers));
            setError("");
            localStorage.removeItem(key);
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "تعذر حفظ النتيجة",
            );
          }
        }}
      >
        {questions.map((q, index) => (
          <section className={styles.question} key={q.id}>
            <span className={styles.kicker}>
              السؤال {index + 1} / {questions.length}
            </span>
            <h2>{q.question}</h2>
            <div className={styles.options}>
              {(q.options ?? []).map((option: string, i: number) => (
                <label className={styles.localOption} key={i}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={i}
                    checked={answers[q.id] === i}
                    onChange={() => {
                      const next = { ...answers, [q.id]: i };
                      setAnswers(next);
                      localStorage.setItem(key, JSON.stringify(next));
                    }}
                    required
                  />
                  {option}
                </label>
              ))}
            </div>
          </section>
        ))}
        {error && <p role="alert">{error}</p>}
        <button className={styles.primaryAction} type="submit">
          إرسال الإجابات وعرض النتيجة
        </button>
      </form>
    </div>
  );
}
