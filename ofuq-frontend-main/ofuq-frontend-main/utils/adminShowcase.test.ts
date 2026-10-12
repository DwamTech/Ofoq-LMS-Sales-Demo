import {
  adminNavigationActive,
  academicCourseComplete,
  certificateIssued,
  publicationCounts,
  plainDescription,
  loadAdminData,
  adminRead,
  type StudentCourse,
  type AdminCertificate,
} from "./adminShowcase";
import { http } from "@/lib/http";
import { getAuthToken } from "@/utils/authService";
jest.mock("@/lib/http", () => ({ http: { get: jest.fn() } }));
jest.mock("@/utils/authService", () => ({ getAuthToken: jest.fn() }));
const course: StudentCourse = {
  course_id: 91,
  title: "Demo",
  category_id: 83,
  status: "completed",
  progress_percentage: 100,
  has_final_exam: true,
  exam_status: "in_progress",
  exam_score: null,
};
const certificate: AdminCertificate = {
  id: 77,
  source: "course",
  program: "Demo",
  status: "pending",
  serial_number: null,
  record_created_at: "2026-08-01",
  issued_at: null,
};
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getAuthToken).mockReturnValue("fixture-only");
});
test("deep links preserve exactly the appropriate active admin module", () => {
  expect(
    adminNavigationActive(
      "/admin/courses/97/chapters/61/lessons",
      "/admin/course-management",
    ),
  ).toBe(true);
  expect(
    adminNavigationActive("/admin/courses/97/question-bank", "/admin/exams"),
  ).toBe(true);
  expect(
    adminNavigationActive(
      "/admin/courses/97/question-bank",
      "/admin/course-management",
    ),
  ).toBe(false);
  expect(adminNavigationActive("/admin/reports/bunny", "/admin/reports")).toBe(
    false,
  );
  expect(adminNavigationActive("/admin/diplomas/73", "/admin/diplomas")).toBe(
    true,
  );
});
test("100% lessons plus unfinished mandatory final is not academic completion", () =>
  expect(academicCourseComplete(course)).toBe(false));
test("authoritative persisted academic outcome is separate from latest attempt", () => {
  expect(academicCourseComplete({ ...course, academic_completed: true })).toBe(
    true,
  );
  expect(
    academicCourseComplete({
      ...course,
      exam_status: "submitted",
      exam_score: 90,
      academic_completed: false,
    }),
  ).toBe(false);
});
test("completed course and submitted passing attempt form a real achievement", () =>
  expect(
    academicCourseComplete({
      ...course,
      exam_status: "submitted",
      exam_score: 83.33,
    }),
  ).toBe(true));
test("submitted failing attempt is not academic completion", () =>
  expect(
    academicCourseComplete({
      ...course,
      exam_status: "submitted",
      exam_score: 40,
    }),
  ).toBe(false));
test("course without mandatory final still requires completed status", () => {
  expect(academicCourseComplete({ ...course, has_final_exam: false })).toBe(
    true,
  );
  expect(
    academicCourseComplete({
      ...course,
      has_final_exam: false,
      status: "in_progress",
    }),
  ).toBe(false);
});
test("pending certificate is never presented as issued", () =>
  expect(certificateIssued(certificate)).toBe(false));
test("completed and issued record conventions require an actual serial", () => {
  expect(
    certificateIssued({
      ...certificate,
      status: "completed",
      serial_number: "DEMO-C",
    }),
  ).toBe(true);
  expect(
    certificateIssued({
      ...certificate,
      status: "issued",
      serial_number: "DEMO-D",
    }),
  ).toBe(true);
  expect(certificateIssued({ ...certificate, status: "completed" })).toBe(
    false,
  );
});
test("publication totals are not page sizes or all stored records", () =>
  expect(
    publicationCounts({
      courses: [{ is_published: true }, { is_published: false }] as never,
      diplomas: [
        { is_published: false },
        { is_published: true },
        { is_published: true },
      ] as never,
    }),
  ).toEqual({ courses: 1, diplomas: 2 }));
test("untrusted description is displayed as text without seed technical marker", () =>
  expect(plainDescription("<p>وصف تعليمي</p> OFOQ Sales Demo dataset")).toBe(
    "وصف تعليمي",
  ));
test("admin data loads without authentication or backend requests", async () => {
  localStorage.clear();
  jest.mocked(getAuthToken).mockReturnValue(null);
  const data = await loadAdminData(new AbortController().signal);
  expect(data.user.id).toBe(99002);
  expect(data.courses).toHaveLength(12);
  expect(http.get).not.toHaveBeenCalled();
});
test("admin reports read the local state", async () => {
  const report = await adminRead<any>("/admin/reports/overview");
  expect(report.data.summary.total_courses).toBe(12);
  expect(http.get).not.toHaveBeenCalled();
});
