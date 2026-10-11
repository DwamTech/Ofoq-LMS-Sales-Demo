import { http } from "@/lib/http";
import { getAuthToken, type User } from "@/utils/authService";

export interface AdminLesson {
  id: number;
  title: string;
  content?: string;
  duration_seconds?: number;
  video_url?: string | null;
  quiz?: { id: number; title: string } | null;
}
export interface AdminChapter {
  id: number;
  title: string;
  order: number;
  lessons: AdminLesson[];
}
export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  category_id: number;
  is_published: boolean;
  lessons_count: number;
  students_count: number;
  instructor?: { id: number; name: string };
  chapters: AdminChapter[];
}
export interface AdminDiploma {
  id: number;
  name: string;
  description: string;
  slug: string;
  is_published: boolean;
  courses_count: number;
  section?: { name: string };
}
export interface Activity {
  student_id: number;
  student_name: string;
  lesson_id: number;
  lesson_title: string;
  last_event_at: string;
  watched_seconds: number;
}
export interface Overview {
  summary: {
    total_students: number;
    active_students: number;
    inactive_students: number;
    total_diplomas: number;
    total_courses: number;
    total_lessons: number;
    total_watch_sessions: number;
    total_watch_duration_seconds: number;
    completed_lessons_count: number;
  };
  top_courses: {
    course_id: number;
    course_title: string;
    watch_duration_seconds: number;
    sessions_count: number;
  }[];
  recent_activity: Activity[];
}
export interface AdminData {
  user: User;
  diplomas: AdminDiploma[];
  courses: AdminCourse[];
  overview: Overview;
}
export interface StudentRow {
  id: number;
  name: string;
  courses_count: number;
  diplomas_count: number;
}
export interface PageMeta {
  current_page: number;
  last_page: number;
  total: number;
}
export interface StudentList {
  data: StudentRow[];
  pagination: PageMeta;
}
export interface StudentCourse {
  academic_completed?: boolean;
  course_id: number;
  title: string;
  category_id: number;
  status: string;
  progress_percentage: number;
  has_final_exam: boolean;
  exam_status: string;
  exam_score: string | number | null;
}
export interface AdminCertificate {
  id: number;
  source: string;
  program: string;
  status: string;
  serial_number: string | null;
  record_created_at: string;
  issued_at: string | null;
}
export interface StudentDetail {
  student: { id: number; name: string };
  diplomas: {
    category_id: number;
    name: string;
    progress_percentage: number;
    status: string;
  }[];
  courses: StudentCourse[];
  certificates: AdminCertificate[];
  activity: {
    completed_lessons_count: number;
    total_watch_duration_seconds: number;
  };
  lessons: {
    data: {
      lesson_id: number;
      lesson_title: string;
      progress_percentage: number;
      status: string;
    }[];
    pagination: PageMeta;
  };
}
export interface ExamDetail {
  course: { id: number; title: string };
  exam: { id: number; title: string; question_count: number };
  questions: { id: number; question: string; options: string[] }[];
  attempts_by_status: Record<string, number>;
}
export interface Beneficiaries {
  filters: {
    from: string | null;
    to: string | null;
    period_definition: string;
  };
  summary: {
    total_beneficiaries: number;
    completed_any_course: number;
    completed_any_diploma: number;
  };
  diplomas: {
    diploma_id: number;
    diploma_name: string;
    beneficiaries_count: number;
    completed_count: number;
    completion_rate: number;
  }[];
}
export interface DetailReport {
  summary?: Record<string, number>;
  activity?: Record<string, number>;
  students?: {
    data: {
      student_id: number;
      student_name: string;
      name?: string;
      progress_percentage: number;
      status: string;
    }[];
    pagination: PageMeta;
  };
  lesson?: { title: string };
  course?: { title: string };
  diploma?: { name: string };
}

// Private reads bypass the legacy boolean-auth cache. No role-shared persistence.
export async function adminRead<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  return (
    await http.get<T>(path, {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    })
  ).data;
}
export async function loadAdminData(signal: AbortSignal): Promise<AdminData> {
  const profile = await adminRead<User | { user: User }>("/profile", signal);
  const user = "user" in profile ? profile.user : profile;
  if (user.role !== "admin") throw new Error("Admin required");
  const [diplomas, courses, report] = await Promise.all([
    adminRead<{ data: AdminDiploma[] }>("/admin/categories", signal),
    adminRead<{ data: AdminCourse[]; pagination: PageMeta }>(
      "/admin/courses?per_page=50",
      signal,
    ),
    adminRead<{ data: Overview }>("/admin/reports/overview?limit=5", signal),
  ]);
  if (courses.pagination.last_page > 1)
    throw new Error(
      "Catalog exceeds showcase page capacity; do not display partial totals",
    );
  return {
    user,
    diplomas: diplomas.data,
    courses: courses.data,
    overview: report.data,
  };
}
export const adminNumber = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value);
export const adminDate = (value: string) => {
  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? "تاريخ غير متاح"
    : new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(date) + " UTC";
};
export const plainDescription = (value = "") =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/OFOQ Sales Demo dataset/g, "")
    .trim();
export const academicCourseComplete = (course: StudentCourse) =>
  typeof course.academic_completed === "boolean"
    ? course.academic_completed
    : course.status === "completed" &&
      (!course.has_final_exam ||
        (course.exam_status === "submitted" &&
          course.exam_score !== null &&
          Number(course.exam_score) >= 60));
export const certificateIssued = (certificate: AdminCertificate) =>
  ["completed", "issued"].includes(certificate.status) &&
  !!certificate.serial_number;
export const publicationCounts = (
  data: Pick<AdminData, "courses" | "diplomas">,
) => ({
  courses: data.courses.filter((c) => c.is_published).length,
  diplomas: data.diplomas.filter((d) => d.is_published).length,
});
export function adminNavigationActive(path: string, href: string) {
  if (href === "/admin") return path === href;
  if (href === "/admin/course-management")
    return (
      path === href ||
      (path.startsWith("/admin/courses/") && !path.endsWith("/question-bank"))
    );
  if (href === "/admin/exams")
    return path === href || /^\/admin\/courses\/\d+\/question-bank$/.test(path);
  if (href === "/admin/reports")
    return path.startsWith(href) && !path.startsWith("/admin/reports/bunny");
  return path === href || path.startsWith(href + "/");
}
