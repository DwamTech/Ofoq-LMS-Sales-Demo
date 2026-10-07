"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  startCourseFinalExam,
  submitCourseFinalExam,
  StartExamResponse,
  getActiveCourseFinalExamAttempt,
  getCourseFinalExamMeta,
} from "@/utils/quizService";
import { getCourseDetails } from "@/utils/courseService";
import Toast from "@/components/Toast";
import "@/styles/toast.css";
import styles from "./FinalExam.module.css";

export default function CourseFinalExamPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = useMemo(() => Number(params?.courseId), [params]);

  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState<string>("");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Array<{
    id: number;
    question: string;
    options: string[];
  }>>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info" | "confirm">("info");

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" | "confirm" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!courseId || Number.isNaN(courseId)) {
        showToast("معرف المقرر غير صالح", "error");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // جلب اسم المقرر
        getCourseDetails(courseId).then((course) => {
          if (course?.title) setCourseName(course.title);
        }).catch(() => { });

        // 1) حاول استرجاع المحاولة النشطة أولاً
        const active = await getActiveCourseFinalExamAttempt(courseId);
        if (!mounted) return;
        if (active && active.attempt_id) {
          setAttemptId(Number(active.attempt_id));
          setQuestions(active.questions || []);
          setStartTime(Date.now());
          return;
        }

        // 2) إن لم توجد محاولة نشطة، افحص الميتاداتا لتحديد السماحية
        const meta = await getCourseFinalExamMeta(courseId);
        if (!mounted) return;
        const allowed = meta?.is_allowed_now === true;
        const eligible = meta?.eligible_to_start !== false; // افتراض السماحية ما لم يذكر خلاف ذلك
        if (allowed && eligible) {
          // 3) البدء عند السماح الآن
          const data: StartExamResponse = await startCourseFinalExam(courseId);
          if (!mounted) return;
          setAttemptId(data.attempt_id);
          setQuestions(data.questions);
          setStartTime(Date.now());
          return;
        }

        // 4) غير مسموح الآن → اعرض رسالة تهدئة/منع وارجع لاختباراتي
        const remaining = Number(meta?.remaining_cooldown_seconds ?? 0);
        const msg = remaining > 0
          ? `محاولة جديدة غير متاحة الآن. يمكنك إعادة المحاولة بعد ${remaining} ثانية.`
          : (meta?.next_allowed_at
            ? `محاولة جديدة غير متاحة الآن. متاح بعد ${new Date(meta.next_allowed_at).toLocaleString()}`
            : "محاولة جديدة غير متاحة الآن");
        showToast(msg, "warning");
        try {
          sessionStorage.setItem("exam-block-message", msg);
          sessionStorage.setItem("flash-toast", JSON.stringify({ message: msg, type: "warning" }));
        } catch { }
        router.replace("/user/my_exams");
      } catch (err: any) {
        // 422 بنك أسئلة غير كافٍ أو أخطاء أخرى
        const message = err?.response?.status === 422
          ? (err?.response?.data?.message || "بنك الأسئلة غير كافٍ")
          : (err?.message || "تعذر بدء الامتحان");
        showToast(message, "error");
        try {
          sessionStorage.setItem("exam-block-message", message);
          sessionStorage.setItem("flash-toast", JSON.stringify({ message, type: "error" }));
        } catch { }
        router.replace("/user/my_exams");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, [courseId]);

  function handleSelect(questionId: number, optionIndex: number) {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function handleSubmit() {
    if (!attemptId) {
      showToast("لا يوجد محاولة نشطة لهذا الامتحان", "error");
      return;
    }

    // Ensure all questions are answered
    const unanswered = questions.filter((q) => !(q.id in selectedAnswers));
    if (unanswered.length > 0) {
      showToast("من فضلك أجب على كل الأسئلة قبل الإرسال", "warning");
      return;
    }

    const answers = questions.map((q) => ({
      question_id: q.id,
      selected_indices: [selectedAnswers[q.id]],
    }));

    const time_taken = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    setSubmitting(true);
    try {
      await submitCourseFinalExam(courseId, attemptId, { answers, time_taken });
      setSubmitted(true);
      showToast("تم إرسال الإجابات بنجاح", "success");
      try {
        sessionStorage.setItem(
          "flash-toast",
          JSON.stringify({ message: "تم إرسال الإجابات بنجاح", type: "success" })
        );
        // احفظ معرف المقرر لفتح تفاصيل النتائج تلقائيًا في صفحة اختباراتي
        sessionStorage.setItem("last-exam-course-id", String(courseId));
      } catch { }
      // اخرج فورًا إلى صفحة اختباراتي بدون إمكانية الرجوع لهذه الصفحة
      router.replace("/user/my_exams");
    } catch (err: any) {
      const message = err?.message || "فشل إرسال الإجابات";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // إذا حاول المستخدم الرجوع لهذه الصفحة بعد الإرسال (مثل back)، أعد التوجيه
  useEffect(() => {
    function handlePageShow() {
      if (submitted) {
        router.replace("/user/my_exams");
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pageshow", handlePageShow);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pageshow", handlePageShow);
      }
    };
  }, [submitted, router]);

  return (
    <div className={`quiz-container ${styles.finalExamPage}`}>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
      <h1 className="question-number" style={{ marginBottom: 10 }}>
        الامتحان النهائي للمقرر{courseName ? `: ${courseName}` : ""}
      </h1>

      {loading && <p>جارِ تحميل الأسئلة...</p>}

      {!loading && questions.length === 0 && (
        <div className="question-box">
          <p>لا توجد أسئلة متاحة أو غير مؤهل لبدء الامتحان.</p>
          <div className="navigation-buttons">
            <button className="nav-button" onClick={() => router.replace("/user/my_exams")}>العودة إلى اختباراتي</button>
          </div>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <>
          <div className="quiz-progress">
            تم اختيار {Object.keys(selectedAnswers).length} من {questions.length} أسئلة
          </div>
          {questions.map((q, idx) => (
            <div key={q.id} className="question-box">
              <div className="question-number">سؤال {idx + 1}</div>
              <div className="question-text">{q.question}</div>
              <div className="options-container">
                {q.options.map((opt, i) => {
                  const selected = selectedAnswers[q.id] === i;
                  return (
                    <label key={i} className={`option-item ${selected ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={i}
                        className="option-radio"
                        checked={selected}
                        onChange={() => handleSelect(q.id, i)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="navigation-buttons">
            <button className="finish-button" data-demo-mutation onClick={handleSubmit} disabled={submitting}>
              {submitting ? "جارِ الإرسال..." : "إرسال جميع الإجابات"}
              <span className="finish-arrow">›</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
