"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import AdminOverview from "./AdminOverview";
import { Catalog, CourseContent, DiplomaDetail } from "./AdminCatalog";
import {
  CertificateOverview,
  Exams,
  StudentRecord,
  Students,
} from "./AdminStudents";
import { EntityReport, Instructors, Reports } from "./AdminReports";
import { Intro, Panel, Restricted } from "./AdminPrimitives";
const positiveId = (value: string | null | undefined) =>
  value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : undefined;
export default function AdminView() {
  const path = usePathname(),
    query = useSearchParams();
  if (path === "/admin") return <AdminOverview />;
  if (path.startsWith("/admin/reports/bunny"))
    return (
      <Restricted
        title="تحليلات الفيديو"
        reason="تكامل Bunny موجود، لكن تحليلاته وسجلات مزامنته ليست ضمن صلاحيات بوابة العرض. اللقطات التجريبية لا تُعرض كاستخدام مزوّد فعلي أو فواتير."
      />
    );
  if (path.startsWith("/admin/database-backups"))
    return (
      <Restricted
        title="النسخ الاحتياطية"
        reason="ملفات قواعد البيانات وأدوات الاستعادة مقيّدة، ولا يُسمح بتنزيلها عبر حساب العرض."
      />
    );
  if (path.startsWith("/admin/supervisors"))
    return (
      <Restricted
        title="المشرفون والصلاحيات"
        reason="حساب الاستعراض لا يملك نطاق قراءة قوائم المشرفين أو تعديل الصلاحيات."
      />
    );
  if (path === "/admin/profile-management")
    return (
      <>
        <Restricted
          title="الإعدادات التشغيلية"
          reason="الهوية الفعلية معروضة في مساحة الإدارة؛ تعديل الملف وكلمة المرور معطّل، ولا نقرأ إعدادات حساسة."
          mutation
        />
        <Panel
          title="الأدوات المحمية"
          description="وجهات حقيقية، مع توضيح حدود العرض قبل أي طلب"
        >
          <Link href="/admin/database-backups">النسخ الاحتياطية ←</Link>
          <br />
          <Link href="/admin/supervisors">المشرفون والصلاحيات ←</Link>
        </Panel>
      </>
    );
  if (path.includes("/new") || path.startsWith("/admin/policies"))
    return (
      <Restricted
        title="عملية تشغيلية"
        reason="أدوات إنشاء المحتوى وتحريره وإعداد السياسات متاحة في التشغيل، ومغلقة خلال الاستعراض."
        mutation
      />
    );
  if (path === "/admin/students" || path === "/admin/reports/students")
    return <Students />;
  const student = path.match(/^\/admin\/(?:reports\/)?students\/(\d+)$/);
  if (student)
    return (
      <StudentRecord
        id={Number(student[1])}
        view={query.get("view") ?? "journey"}
      />
    );
  if (path === "/admin/certificates") return <CertificateOverview />;
  if (path === "/admin/exams")
    return (
      <Exams
        courseId={positiveId(query.get("course"))}
        studentId={positiveId(query.get("student"))}
      />
    );
  if (path === "/admin/instructors") return <Instructors />;
  if (path === "/admin/diplomas" || path === "/admin/reports/diplomas")
    return <Catalog kind="diplomas" />;
  if (
    path === "/admin/course-management" ||
    path === "/admin/reports/courses" ||
    path === "/admin/courses"
  )
    return <Catalog kind="courses" />;
  if (path === "/admin/reports" || path === "/admin/reports/beneficiaries")
    return <Reports beneficiaries={path.endsWith("/beneficiaries")} />;
  const report = path.match(
    /^\/admin\/reports\/(courses|diplomas|lessons)\/(\d+)$/,
  );
  if (report)
    return (
      <EntityReport
        kind={report[1] as "courses" | "diplomas" | "lessons"}
        id={Number(report[2])}
      />
    );
  const questionBank = path.match(/^\/admin\/courses\/(\d+)\/question-bank$/);
  if (questionBank)
    return (
      <Exams
        courseId={Number(questionBank[1])}
        quizId={positiveId(query.get("quiz"))}
      />
    );
  const nestedCourse = path.match(
    /^\/admin\/diplomas\/(\d+)\/courses\/(\d+)\/chapters(?:\/(\d+)\/lessons)?$/,
  );
  if (nestedCourse)
    return (
      <CourseContent
        id={Number(nestedCourse[2])}
        chapterId={positiveId(nestedCourse[3])}
      />
    );
  const course = path.match(
    /^\/admin\/courses\/(\d+)(?:\/chapters(?:\/(\d+)\/lessons)?)?$/,
  );
  if (course)
    return (
      <CourseContent id={Number(course[1])} chapterId={positiveId(course[2])} />
    );
  const diploma = path.match(/^\/admin\/diplomas\/(\d+)(?:\/students)?$/);
  if (diploma) return <DiplomaDetail id={Number(diploma[1])} />;
  if (path.includes("question-bank"))
    return (
      <Restricted
        title="اختبارات الدبلومات"
        reason="إدارة بنك أسئلة الدبلومات تعتمد مسارات تشغيلية غير مكتملة في الاستعراض. يمكن فحص اختبارات المقررات من وحدة التقييم."
      />
    );
  if (path === "/admin/reports/financial" || path === "/admin/reports/visits")
    return (
      <Restricted
        title="تقرير غير متاح للاستعراض"
        reason="لا نعرض أسعار التسجيل كإيراد محصّل، أو جلسات التعليم كزيارات موقع؛ لا توجد بيانات مصرح بها لإثبات ذلك."
      />
    );
  if (path === "/admin/reports/lessons")
    return (
      <Intro
        title="تقارير الدروس"
        description="افتح المقرر ثم الدرس للوصول إلى تقريره الحقيقي."
      />
    );
  return (
    <Restricted
      title="وجهة تشغيلية خارج نطاق العرض"
      reason="لم تُحذف الوجهة القديمة. لا نطلب بيانات غير مصرح بها أو نستبدلها بمعلومات افتراضية."
    />
  );
}
