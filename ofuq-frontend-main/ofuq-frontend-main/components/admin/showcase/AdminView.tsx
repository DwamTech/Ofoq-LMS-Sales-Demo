"use client";
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
import { Intro } from "./AdminPrimitives";
import LocalAdminExtras from "./LocalAdminExtras";
import LocalAdminManager from "./LocalAdminManager";
const positiveId = (value: string | null | undefined) =>
  value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : undefined;
export default function AdminView() {
  const path = usePathname();
  const settings = [
    "/admin/supervisors",
    "/admin/profile-management",
    "/admin/database-backups",
  ].some((route) => path.startsWith(route));
  return (
    <>
      {(settings || path.includes("/new")) && (
        <Intro
          title={
            path.includes("supervisors")
              ? "المشرفون"
              : path.includes("/new")
                ? "إضافة مقرر"
                : "إعدادات التجربة المحلية"
          }
          description="إدارة البيانات وحفظها في المتصفح."
        />
      )}
      <LocalAdminManager key={path} />
      {!settings && <AdminViewContent />}
    </>
  );
}
function AdminViewContent() {
  const path = usePathname(),
    query = useSearchParams();
  if (path === "/admin") return <AdminOverview />;
  if (path.includes("/new")) return null;
  if (
    path.startsWith("/admin/policies") ||
    path.startsWith("/admin/reports/bunny") ||
    [
      "/admin/reports/financial",
      "/admin/reports/visits",
      "/admin/reports/lessons",
    ].includes(path)
  )
    return <LocalAdminExtras key={path} />;
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
  if (path.includes("question-bank")) return null;
  return <LocalAdminExtras key={path} />;
}
