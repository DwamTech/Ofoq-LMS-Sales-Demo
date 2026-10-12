import { http } from "@/lib/http";
import {
  courseState,
  diplomaComplete,
  issuedCertificate,
  loadStudentJourney,
  nextLesson,
  visibleLessons,
  lessonHref,
  certificateHref,
  type StudentCourse,
  type StudentDiploma,
  type StudentCertificate,
  type StudentExam,
} from "./studentJourney";
jest.mock("@/lib/http", () => ({ http: { get: jest.fn() } }));
const course: StudentCourse = {
  id: 41,
  title: "مقرر اختباري",
  category_id: 12,
  progress_percentage: 100,
  enrollment_status: "completed",
  has_final_exam: true,
  lessons_count: 2,
};
const exam: StudentExam = {
  course_id: 41,
  course_title: course.title,
  has_final_exam: true,
  exam_status: "not_taken",
  active_attempt_status: null,
  last_score: null,
  eligible_to_start: true,
  status: "in_progress",
};
describe("persisted student journey, not presentation flags", () => {
  beforeEach(() => jest.clearAllMocks());
  test("100% lessons without a passed final is not educational completion", () =>
    expect(courseState(course, exam)).toBe("exam-pending"));
  test("existing active final takes precedence over lesson-complete status", () =>
    expect(
      courseState(course, { ...exam, active_attempt_status: "in_progress" }),
    ).toBe("exam-active"));
  test("uses backend pass state without inventing a grade threshold", () =>
    expect(
      courseState(course, {
        ...exam,
        exam_status: "passed",
        last_score: "83.33",
      }),
    ).toBe("completed"));
  test("missing exam state is not assumed passed", () =>
    expect(courseState(course)).toBe("exam-pending"));
  test("no-exam course may complete according to enrollment", () =>
    expect(courseState({ ...course, has_final_exam: false })).toBe(
      "completed",
    ));
  test("partial progress and unstarted enrollment are distinct", () => {
    expect(
      courseState({
        ...course,
        progress_percentage: 50,
        enrollment_status: "in_progress",
      }),
    ).toBe("learning");
    expect(
      courseState({
        ...course,
        progress_percentage: 0,
        enrollment_status: "in_progress",
      }),
    ).toBe("not-started");
  });
  test("diploma completion uses API rule-derived progress, not course average", () => {
    const diploma = {
      progress: 25,
      category: { courses_count: 4 },
    } as StudentDiploma;
    expect(diplomaComplete(diploma)).toBe(false);
    expect(diplomaComplete({ ...diploma, progress: 100 })).toBe(true);
    expect(
      diplomaComplete({
        progress: 100,
        category: { courses_count: 0 },
      } as StudentDiploma),
    ).toBe(false);
  });
  test("pending certificate cannot masquerade as issued; completed matches existing PDF generator", () => {
    expect(
      issuedCertificate({
        type: "course",
        status: "pending",
      } as StudentCertificate),
    ).toBe(false);
    expect(
      issuedCertificate({
        type: "course",
        status: "completed",
      } as StudentCertificate),
    ).toBe(true);
    expect(
      issuedCertificate({
        type: "diploma",
        status: "completed",
      } as StudentCertificate),
    ).toBe(true);
  });
  test("lesson navigation uses authorized relationships, not public preview flags", () => {
    const related = {
      ...course,
      chapters: [
        {
          id: 19,
          title: "فصل",
          order: 1,
          lessons: [
            {
              id: 22,
              title: "التالي",
              order: 2,
              is_visible: false,
              can_access: true,
            },
            {
              id: 21,
              title: "الأول",
              order: 1,
              is_visible: true,
              can_access: true,
            },
            {
              id: 23,
              title: "مخفي",
              order: 3,
              is_visible: false,
              can_access: false,
            },
          ],
        },
      ],
    };
    expect(visibleLessons(related).map((l) => l.id)).toEqual([21, 22]);
    const next = nextLesson(related, {
      overall_progress: 50,
      status: "in_progress",
      lessons: [{ lesson_id: 21, status: "completed", quiz_passed: false }],
    });
    expect(next?.id).toBe(22);
    expect(lessonHref(related, next!)).toBe(
      "/watch?courseId=41&chapterId=19&lessonId=22",
    );
  });
  test("download context distinguishes legacy/new certificates with same numeric id", () =>
    expect(
      certificateHref({ source: "legacy-course", id: 2 } as StudentCertificate),
    ).toBe("/student/certificates/legacy-course/2/download"));
  test("student journey uses local enrollment and never requests a backend", async () => {
    localStorage.clear();
    const data = await loadStudentJourney(new AbortController().signal);
    expect(data.user.id).toBe(99001);
    expect(data.courses.map((c) => c.id)).toEqual([2001, 2002]);
    expect(http.get).not.toHaveBeenCalled();
  });
});
