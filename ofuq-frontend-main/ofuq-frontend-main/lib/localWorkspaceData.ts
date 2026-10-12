import { localCourses, localPrograms } from "./localCatalog";
import { localPreviewUser } from "./localPreview";
import type { StudentJourney } from "@/utils/studentJourney";
import type { AdminData } from "@/utils/adminShowcase";
import { readFrontend, courseProgress } from "./frontendStore";

export function localStudentJourney(): StudentJourney {
  const state = readFrontend();
  const courses = localCourses()
    .filter((c) => state.enrolled.includes(c.id))
    .map((course) => ({
      ...course,
      progress_percentage: courseProgress(course.id).overall_progress,
      enrollment_status: state.results[course.id]?.passed
        ? "completed"
        : "active",
      has_final_exam: true,
      lessons_count: course.lessons_count ?? 0,
      chapters: course.chapters?.map((chapter, i) => ({
        ...chapter,
        order: i + 1,
        lessons:
          chapter.lessons?.map((lesson, j) => ({
            ...lesson,
            content:
              lesson.content ||
              "في هذا الدرس، تعرّف على الفكرة الأساسية ثم طبّقها في مثال عملي. دوّن ما تعلمته وجرّب تنفيذه في مشروعك.",
            duration_seconds: lesson.duration_seconds ?? 0,
            order: j + 1,
            chapter_id: chapter.id,
            is_visible: true,
            can_access: true,
          })) ?? [],
      })),
    }));
  return {
    user: localPreviewUser("student"),
    diplomas: localPrograms()
      .filter((program) => courses.some((c) => c.category_id === program.id))
      .map((program) => {
        const items = courses.filter((c) => c.category_id === program.id),
          cert = state.certificates.find(
            (c) => c.type === "diploma" && c.category_id === program.id,
          );
        return {
          id: program.id,
          status: cert ? "completed" : "active",
          progress: cert
            ? 100
            : items.length
              ? Math.round(
                  items.reduce((sum, c) => sum + c.progress_percentage, 0) /
                    items.length,
                )
              : 0,
          enrolled_at: "2026-10-01",
          category: { ...program, courses_count: program.courses_count ?? 0 },
          can_download_certificate: !!cert,
        };
      }),
    courses,
    exams: courses.map((c) => ({
      course_id: c.id,
      course_title: c.title,
      exam_status: state.results[c.id]?.passed ? "passed" : "not_started",
      active_attempt_status: null,
      has_final_exam: true,
      last_score: state.results[c.id]
        ? String(state.results[c.id].score)
        : null,
      eligible_to_start: true,
      status: state.results[c.id]?.passed ? "completed" : "available",
    })),
    certificates: state.certificates,
  };
}
export function localAdminData(): AdminData {
  const courses = localCourses().map((course) => ({
    ...course,
    is_published: course.is_published !== false,
    lessons_count: course.lessons_count ?? 0,
    students_count: course.students_count ?? 0,
    chapters:
      course.chapters?.map((chapter, i) => ({
        ...chapter,
        order: i + 1,
        lessons:
          chapter.lessons?.map((lesson) => ({
            ...lesson,
            duration_seconds: lesson.duration_seconds ?? 0,
          })) ?? [],
      })) ?? [],
  }));
  return {
    user: localPreviewUser("admin"),
    diplomas: localPrograms().map((program) => ({
      ...program,
      section: program.section ?? undefined,
      courses_count: program.courses_count ?? 0,
    })),
    courses,
    overview: {
      summary: {
        total_students: readFrontend().users.filter((u) => u.role === "student")
          .length,
        active_students: readFrontend().users.filter(
          (u) => u.role === "student" && u.status !== "blocked",
        ).length,
        inactive_students: 0,
        total_diplomas: localPrograms().length,
        total_courses: courses.length,
        total_lessons: courses.reduce(
          (sum, course) => sum + course.lessons_count,
          0,
        ),
        total_watch_sessions: readFrontend().completed.length,
        total_watch_duration_seconds: readFrontend().completed.length * 600,
        completed_lessons_count: readFrontend().completed.length,
      },
      top_courses: [],
      recent_activity: [],
    },
  };
}
