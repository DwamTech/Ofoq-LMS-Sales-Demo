"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { changeFrontend, readFrontend } from "@/lib/frontendStore";
import { useAdmin } from "./AdminProvider";
import { Intro, Panel, Metric, Table } from "./AdminPrimitives";
import styles from "./AdminShowcase.module.css";
export default function LocalAdminExtras() {
  useAdmin();
  const path = usePathname(),
    state = readFrontend();
  const kind = path.includes("privacy") ? "privacy" : "terms";
  const [content, setContent] = useState(state.settings[kind]),
    [message, setMessage] = useState("");
  const lessons = state.courses.flatMap(
    (course) =>
      course.chapters?.flatMap(
        (chapter) =>
          chapter.lessons?.map((lesson) => ({
            ...lesson,
            course: course.title,
            courseId: course.id,
          })) ?? [],
      ) ?? [],
  );
  if (path.startsWith("/admin/policies"))
    return (
      <>
        <Intro
          title={kind === "privacy" ? "سياسة الخصوصية" : "الشروط والأحكام"}
          description="عدّل محتوى الصفحة العامة واحفظه محليًا."
        />
        <Panel title="محتوى الصفحة">
          <form
            className={styles.localEditor}
            onSubmit={(e) => {
              e.preventDefault();
              try {
                changeFrontend((s) => {
                  s.settings[kind] = content;
                });
                setMessage("تم حفظ محتوى الصفحة");
              } catch {
                setMessage("تعذر الحفظ. تحقق من مساحة التخزين.");
              }
            }}
          >
            <label>
              النص
              <textarea
                rows={10}
                value={content}
                required
                onChange={(e) => setContent(e.target.value)}
              />
            </label>
            <button type="submit" className={styles.primary}>
              حفظ التغييرات
            </button>
            <Link href={`/${kind}`} target="_blank">
              عرض الصفحة العامة ↗
            </Link>
            {message && <p role="status">{message}</p>}
          </form>
        </Panel>
      </>
    );
  if (path.includes("financial"))
    return (
      <>
        <Intro
          title="ملخص التسجيلات والأسعار"
          description="بيانات تجريبية للتسجيلات المحلية؛ لا تتم عملية دفع فعلية."
        />
        <Panel title="المقررات المسجل بها">
          <LocalTable
            headers={["المقرر", "السعر المعروض", "التسجيل"]}
            rows={state.courses
              .filter((c) => state.enrolled.includes(c.id))
              .map((c) => [c.title, String(c.price ?? 0), "نشط"])}
          />
        </Panel>
      </>
    );
  if (path.includes("visits"))
    return (
      <>
        <Intro
          title="النشاط المحلي"
          description="تقدم الطالب ونتائجه المحفوظة داخل هذا المتصفح."
        />
        <div className={styles.metrics}>
          <Metric
            definition="الدروس المحفوظة في المتصفح"
            label="الدروس المكتملة"
            value={state.completed.length}
          />
          <Metric
            definition="نتائج الاختبارات المحلية"
            label="التقييمات المقدمة"
            value={Object.keys(state.results).length}
          />
          <Metric
            definition="شهادات التجربة"
            label="الشهادات الصادرة"
            value={state.certificates.length}
          />
        </div>
      </>
    );
  return (
    <>
      <Intro
        title={
          path.includes("bunny") ? "مكتبة المحتوى التعليمي" : "تقارير الدروس"
        }
        description="الدروس التجريبية ومؤشرات إكمالها من بيانات المتصفح."
      />
      <Panel title="محتوى المقررات">
        <LocalTable
          headers={["الدرس", "المقرر", "الحالة"]}
          rows={lessons.map((lesson) => [
            <Link key={lesson.id} href={`/admin/courses/${lesson.courseId}`}>
              {lesson.title}
            </Link>,
            lesson.course,
            state.completed.includes(lesson.id) ? "مكتمل" : "لم يكتمل",
          ])}
        />
      </Panel>
    </>
  );
}

function LocalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <Table caption="البيانات المحلية" headers={headers}>
      {rows.map((row, index) => (
        <tr key={index}>
          {row.map((cell, col) => (
            <td key={col}>{cell}</td>
          ))}
        </tr>
      ))}
    </Table>
  );
}
