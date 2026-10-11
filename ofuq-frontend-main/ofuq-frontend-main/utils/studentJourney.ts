import { http } from "@/lib/http";
import type { User } from "./authService";

export interface StudentLesson {
  id: number;
  title: string;
  order: number;
  is_visible: boolean;
  can_access?: boolean;
  content?: string;
  video_url?: string | null;
  chapter_id?: number;
  duration_seconds?: number;
}
export interface StudentChapter {
  id: number;
  title: string;
  order: number;
  lessons: StudentLesson[];
}
export interface StudentCourse {
  id: number;
  title: string;
  category_id: number;
  progress_percentage: number;
  enrollment_status: string;
  has_final_exam: boolean;
  lessons_count: number;
  chapters?: StudentChapter[];
}
export interface StudentDiploma {
  id: number;
  status: string;
  progress: number;
  enrolled_at: string;
  category: {
    id: number;
    name: string;
    slug: string;
    courses_count: number;
    is_published: boolean;
  };
  certificate?: { status: string; serial_number: string } | null;
  can_download_certificate: boolean;
}
export interface StudentExam {
  course_id: number;
  course_title: string;
  exam_status: string;
  active_attempt_status: string | null;
  has_final_exam: boolean;
  last_score: string | null;
  eligible_to_start: boolean;
  status: string;
}
export interface StudentCertificate {
  id: number;
  type: "course" | "diploma";
  source: "course" | "legacy-course" | "diploma";
  status: string;
  course_title: string;
  diploma_name?: string;
  user_name: string;
  issued_at: string;
  serial_number: string;
  course_id?: number;
  category_id?: number;
  file_path: string | null;
  verification_token: string;
}
export interface StudentJourney {
  user: User;
  diplomas: StudentDiploma[];
  courses: StudentCourse[];
  exams: StudentExam[];
  certificates: StudentCertificate[];
}
export interface LessonProgress {
  lesson_id: number;
  status: string;
  quiz_passed: boolean;
}
export interface CourseProgress {
  overall_progress: number;
  status: string;
  lessons: LessonProgress[];
}
export interface ExamQuestion {
  id: number;
  question: string;
  options: string[];
}
export interface ActiveExam {
  attempt_id: number;
  quiz_id: number;
  questions: ExamQuestion[];
}

// Existing authorized GET contracts, using the established HTTP client but no
// auth-boolean cache: each new workspace loads its current backend identity/data.
export async function loadStudentJourney(
  signal: AbortSignal,
): Promise<StudentJourney> {
  const { data: profile } = await http.get<{ user: User }>("/profile", {
    signal,
  });
  if (profile.user.role !== "student") throw new Error("STUDENT_ROLE_REQUIRED");
  const [diplomas, enrollments, exams, certificates] = await Promise.all([
    http.get<{ data: StudentDiploma[] }>("/my-diplomas", { signal }),
    http.get<{ data: StudentCourse[]; pagination: { last_page: number } }>(
      "/my-enrollments?per_page=100",
      { signal },
    ),
    http.get<{ data: StudentExam[] }>("/my-tests", { signal }),
    http.get<{ certificates: StudentCertificate[] }>("/my-certificates", {
      signal,
    }),
  ]);
  const courses = [...enrollments.data.data];
  for (let page = 2; page <= enrollments.data.pagination.last_page; page++) {
    const next = await http.get<{ data: StudentCourse[] }>(
      `/my-enrollments?per_page=100&page=${page}`,
      { signal },
    );
    courses.push(...next.data.data);
  }
  return {
    user: profile.user,
    diplomas: diplomas.data.data,
    courses,
    exams: exams.data.data,
    certificates: certificates.data.certificates,
  };
}
export type CourseState =
  | "not-started"
  | "learning"
  | "exam-pending"
  | "exam-active"
  | "completed";
export function courseState(
  course: StudentCourse,
  exam?: StudentExam,
): CourseState {
  if (exam?.active_attempt_status === "in_progress") return "exam-active";
  if (
    course.progress_percentage === 100 &&
    course.enrollment_status === "completed"
  ) {
    if (exam?.has_final_exam || course.has_final_exam)
      return exam?.exam_status === "passed" ? "completed" : "exam-pending";
    return "completed";
  }
  return course.progress_percentage === 0 ? "not-started" : "learning";
}
export const stateLabel: Record<CourseState, string> = {
  "not-started": "لم تبدأ بعد",
  learning: "قيد التعلّم",
  "exam-pending": "الدروس مكتملة · التقييم مطلوب",
  "exam-active": "اختبار قيد التقدم",
  completed: "اكتمل المقرر",
};
export const diplomaComplete = (diploma: StudentDiploma) =>
  diploma.progress === 100 && diploma.category.courses_count > 0;
export const issuedCertificate = (certificate: StudentCertificate) =>
  certificate.type === "diploma"
    ? certificate.status === "completed"
    : certificate.status === "completed" || certificate.status === "issued";
export const courseHref = (id: number) => `/user/courses/${id}`;
export const diplomaHref = (slug: string) =>
  `/user/diplomas/${encodeURIComponent(slug)}`;
export const examHref = (id: number) => `/user/final-exam/${id}`;
export function visibleLessons(course: StudentCourse) {
  return [...(course.chapters || [])]
    .sort((a, b) => a.order - b.order)
    .flatMap((chapter) =>
      [...chapter.lessons]
        .sort((a, b) => a.order - b.order)
        .filter((lesson) => lesson.can_access === true)
        .map((lesson) => ({ ...lesson, chapter_id: chapter.id })),
    );
}
export function nextLesson(course: StudentCourse, progress: CourseProgress) {
  return (
    visibleLessons(course).find(
      (lesson) =>
        !progress.lessons.some(
          (record) =>
            record.lesson_id === lesson.id && record.status === "completed",
        ),
    ) || visibleLessons(course)[0]
  );
}
export const lessonHref = (course: StudentCourse, lesson: StudentLesson) =>
  `/watch?courseId=${course.id}&chapterId=${lesson.chapter_id}&lessonId=${lesson.id}`;
export const certificateHref = (certificate: StudentCertificate) =>
  `/student/certificates/${certificate.source}/${certificate.id}/download`;
export const certificateVerificationHref = (certificate: StudentCertificate) =>
  `/verify-certificate?s=${encodeURIComponent(certificate.serial_number)}`;
export async function loadCourseContext(id: number, signal: AbortSignal) {
  const [course, progress] = await Promise.all([
    http.get<{ data: StudentCourse }>(`/courseEnroll/${id}`, { signal }),
    http.get<{ course_progress: CourseProgress }>(`/courses/${id}/progress`, {
      signal,
    }),
  ]);
  return { course: course.data.data, progress: progress.data.course_progress };
}
export async function loadActiveExam(id: number, signal: AbortSignal) {
  return (
    await http.get<{ data: ActiveExam | null }>(
      `/courses/${id}/final-exam/attempt/active`,
      { signal },
    )
  ).data.data;
}
export async function downloadStudentCertificate(
  certificate: StudentCertificate,
): Promise<Blob> {
  if (!issuedCertificate(certificate) || !certificate.file_path)
    throw new Error("ملف الشهادة غير متاح.");
  const response = await http.get<Blob>(certificateHref(certificate), {
    responseType: "blob",
    timeout: 15000,
  });
  if (
    !response.headers["content-type"]?.includes("application/pdf") ||
    response.data.size < 5 ||
    (await response.data.slice(0, 5).text()) !== "%PDF-"
  )
    throw new Error("لم نتلقَّ ملف PDF صالحًا.");
  return response.data;
}
