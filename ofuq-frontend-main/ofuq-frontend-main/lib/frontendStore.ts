import programs from "@/data/programs.json";
import courses from "@/data/courses.json";
import sections from "@/data/sections.json";
import experience from "@/data/experience.json";
import settings from "@/data/settings.json";
import type { StudentCertificate } from "@/utils/studentJourney";

export const FRONTEND_STORAGE_KEY = "mansatak-frontend-v1";
export const FRONTEND_CHANGE = "frontend-data-change";
export type LocalEntity = Omit<
  Partial<
    (typeof courses)[number] &
      (typeof programs)[number] &
      (typeof experience.users)[number] &
      (typeof experience.questions)[number] &
      (typeof experience.instructors)[number]
  >,
  "category_id"
> & {
  category_id?: number | null;
  country?: string;
  id: number;
  [key: string]: unknown;
  course_id?: number | null;
  user_id?: number;
  user?: { id: number; name: string; email?: string };
  comment?: string;
  profile_picture?: string;
  lessons?: {
    id: number;
    title: string;
    content?: string;
    duration_seconds?: number;
  }[];
};
export interface FrontendState {
  version: 1;
  programs: LocalEntity[];
  courses: LocalEntity[];
  sections: LocalEntity[];
  users: LocalEntity[];
  instructors: LocalEntity[];
  questions: LocalEntity[];
  favorites: number[];
  enrolled: number[];
  completed: number[];
  results: Record<
    string,
    { score: number; passed: boolean; submitted_at: string }
  >;
  certificates: StudentCertificate[];
  reviews: LocalEntity[];
  settings: typeof settings;
}
function seed(): FrontendState {
  return structuredClone({
    version: 1,
    programs,
    courses,
    sections,
    ...experience,
    settings,
    favorites: [2001, 2003],
    enrolled: [2001, 2002],
    completed: [],
    results: {},
    reviews: [
      {
        id: 1,
        course_id: 2001,
        user_id: 99003,
        rating: 5,
        comment: "شرح منظم وتطبيقات مفيدة.",
        user: experience.users.find((u) => u.id === 99003),
        created_at: "2026-10-10",
        updated_at: "2026-10-10",
      },
    ],
    certificates: [
      {
        id: 1,
        type: "course",
        source: "course",
        status: "issued",
        course_title: "تطوير واجهات الويب الاحترافية",
        user_name: experience.users[0].name,
        issued_at: "2026-10-10",
        serial_number: "DEMO-2026-001",
        file_path: "local:DEMO-2026-001",
        verification_token: "DEMO-2026-001",
      },
    ],
  } as FrontendState);
}
export function readFrontend(): FrontendState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(FRONTEND_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (validFrontendState(data))
        return { ...data, settings: { ...settings, ...data.settings } };
    }
  } catch {}
  return seed();
}
export function validFrontendState(value: unknown): value is FrontendState {
  if (!value || typeof value !== "object") return false;
  const data = value as FrontendState;
  if (
    data.version !== 1 ||
    ![
      "programs",
      "courses",
      "sections",
      "users",
      "instructors",
      "questions",
      "favorites",
      "enrolled",
      "completed",
      "certificates",
      "reviews",
    ].every((key) =>
      Array.isArray((data as unknown as Record<string, unknown[]>)[key]),
    )
  )
    return false;
  for (const key of [
    "programs",
    "courses",
    "sections",
    "users",
    "instructors",
    "questions",
    "certificates",
    "reviews",
  ] as const) {
    const list = data[key];
    if (
      list.some(
        (item) =>
          !item || typeof item !== "object" || !Number.isFinite(item.id),
      ) ||
      new Set(list.map((item) => item.id)).size !== list.length
    )
      return false;
  }
  if (
    !data.users.some((u) => u.id === 99001 && u.role === "student") ||
    !data.users.some((u) => u.id === 99002 && u.role === "admin")
  )
    return false;
  if (
    data.users.some((u) => typeof u.name !== "string") ||
    data.programs.some(
      (p) => typeof p.name !== "string" || typeof p.slug !== "string",
    ) ||
    data.courses.some(
      (c) =>
        typeof c.title !== "string" ||
        (c.chapters && !Array.isArray(c.chapters)),
    )
  )
    return false;
  if (
    data.courses.some((c) =>
      c.chapters?.some(
        (ch: LocalEntity) =>
          !ch ||
          !Number.isFinite(ch.id) ||
          typeof ch.title !== "string" ||
          !Array.isArray(ch.lessons) ||
          ch.lessons.some(
            (l: LocalEntity) =>
              !l || !Number.isFinite(l.id) || typeof l.title !== "string",
          ),
      ),
    )
  )
    return false;
  if (
    data.questions.some(
      (q) =>
        typeof q.question !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        q.options.some((o: unknown) => typeof o !== "string") ||
        !Number.isInteger(Number(q.answer)) ||
        Number(q.answer) < 0 ||
        Number(q.answer) >= q.options.length,
    )
  )
    return false;
  if (
    data.certificates.some(
      (c) =>
        typeof c.serial_number !== "string" ||
        typeof c.course_title !== "string",
    )
  )
    return false;
  if (
    !["favorites", "enrolled", "completed"].every((key) =>
      (data as unknown as Record<string, unknown[]>)[key].every(
        (id: unknown) => typeof id === "number" && Number.isFinite(id),
      ),
    )
  )
    return false;
  if (
    data.settings &&
    (typeof data.settings.privacy !== "string" ||
      typeof data.settings.terms !== "string")
  )
    return false;
  return (
    !!data.results &&
    typeof data.results === "object" &&
    !Array.isArray(data.results) &&
    Object.values(data.results).every(
      (r) =>
        r &&
        typeof r.score === "number" &&
        r.score >= 0 &&
        r.score <= 100 &&
        typeof r.passed === "boolean",
    )
  );
}
export function importFrontend(value: unknown) {
  if (!validFrontendState(value))
    throw Error("الملف ليس نسخة بيانات صالحة لهذا المشروع");
  if (typeof window !== "undefined") {
    localStorage.setItem(FRONTEND_STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new Event(FRONTEND_CHANGE));
  }
}
export function changeFrontend(update: (state: FrontendState) => void) {
  const state = readFrontend();
  update(state);
  // A failed write is surfaced to the caller; never claim an unsaved change succeeded.
  if (typeof window !== "undefined") {
    localStorage.setItem(FRONTEND_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(FRONTEND_CHANGE));
  }
  return state;
}
export function resetFrontend() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(FRONTEND_STORAGE_KEY);
    Object.keys(localStorage)
      .filter((key) => key.startsWith("mansatak-exam-"))
      .forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new Event(FRONTEND_CHANGE));
  }
}
export function saveEntity(
  collection:
    | "programs"
    | "courses"
    | "sections"
    | "users"
    | "instructors"
    | "questions",
  item: Partial<LocalEntity>,
) {
  changeFrontend((s) => {
    const id =
      item.id ?? Math.max(0, ...s[collection].map((x) => Number(x.id))) + 1;
    const index = s[collection].findIndex((x) => x.id === id);
    const value: LocalEntity = { ...item, id };
    const unique =
      collection === "programs"
        ? "slug"
        : collection === "users"
          ? "email"
          : null;
    if (
      unique &&
      value[unique] &&
      s[collection].some(
        (x) =>
          x.id !== id &&
          String(x[unique]).toLowerCase() ===
            String(value[unique]).toLowerCase(),
      )
    )
      throw Error(
        unique === "email"
          ? "البريد الإلكتروني مستخدم بالفعل"
          : "الرابط المختصر مستخدم بالفعل",
      );
    if (index >= 0)
      s[collection][index] = { ...s[collection][index], ...value };
    else s[collection].push(value);
  });
}
export function deleteEntity(
  collection:
    | "programs"
    | "courses"
    | "sections"
    | "users"
    | "instructors"
    | "questions",
  id: number,
) {
  if (collection === "users" && [99001, 99002].includes(id))
    throw Error("حسابا التجربة الأساسيان لا يمكن حذفهما");
  changeFrontend((s) => {
    const course = s.courses.find((c) => c.id === id);
    s[collection] = s[collection].filter((x) => x.id !== id);
    if (collection === "courses") {
      const lessons =
        course?.chapters?.flatMap(
          (ch: LocalEntity) => ch.lessons?.map((l: LocalEntity) => l.id) ?? [],
        ) ?? [];
      s.completed = s.completed.filter((x) => !lessons.includes(x));
      s.enrolled = s.enrolled.filter((x) => x !== id);
      s.favorites = s.favorites.filter((x) => x !== id);
      delete s.results[id];
      s.reviews = s.reviews.filter((r) => r.course_id !== id);
    }
    if (collection === "programs")
      s.courses.forEach((c) => {
        if (c.category_id === id) c.category_id = null;
      });
  });
}
export function courseProgress(id: number) {
  const state = readFrontend(),
    course = state.courses.find((c) => c.id === id);
  const lessons: LocalEntity[] =
    course?.chapters?.flatMap((c: LocalEntity) => c.lessons ?? []) ?? [];
  const done = lessons.filter((l) => state.completed.includes(l.id));
  return {
    overall_progress: lessons.length
      ? Math.round((done.length / lessons.length) * 100)
      : 0,
    status:
      done.length === lessons.length && lessons.length ? "completed" : "active",
    lessons: lessons.map((l) => ({
      lesson_id: l.id,
      status: state.completed.includes(l.id) ? "completed" : "pending",
      quiz_passed: state.completed.includes(l.id),
    })),
  };
}
export function completeLesson(id: number) {
  changeFrontend((s) => {
    const course = s.courses.find((c) =>
      c.chapters?.some((ch: LocalEntity) =>
        ch.lessons?.some((l: LocalEntity) => l.id === id),
      ),
    );
    if (!course || !s.enrolled.includes(course.id))
      throw Error("سجّل في المقرر أولًا");
    if (!s.completed.includes(id)) s.completed.push(id);
  });
}
export function toggleFavorite(id: number) {
  changeFrontend((s) => {
    s.favorites = s.favorites.includes(id)
      ? s.favorites.filter((x) => x !== id)
      : [...s.favorites, id];
  });
}
export function submitLocalExam(
  courseId: number,
  answers: Record<number, number>,
) {
  const state = readFrontend(),
    questions = state.questions.filter(
      (q) => !q.course_id || q.course_id === courseId,
    );
  if (
    !state.courses.some((c) => c.id === courseId) ||
    !state.enrolled.includes(courseId)
  )
    throw Error("سجّل في المقرر أولًا");
  if (!questions.length || questions.some((q) => answers[q.id] === undefined))
    throw new Error("أجب عن جميع الأسئلة أولًا.");
  const score = Math.round(
    (questions.filter((q) => answers[q.id] === Number(q.answer)).length /
      questions.length) *
      100,
  );
  changeFrontend((s) => {
    s.results[courseId] = {
      score,
      passed: score >= 60,
      submitted_at: new Date().toISOString(),
    };
    if (score >= 60) {
      issueCertificateInState(s, courseId);
      const course = s.courses.find((c) => c.id === courseId)!;
      const program = s.programs.find((p) => p.id === course.category_id),
        siblings = s.courses.filter((c) => c.category_id === program?.id);
      if (
        program &&
        siblings.length &&
        siblings.every((c) => s.results[c.id]?.passed) &&
        !s.certificates.some(
          (c) => c.category_id === program.id && c.type === "diploma",
        )
      ) {
        const serial = `PROGRAM-${program.id}-${Date.now()}`;
        s.certificates.push({
          id: Math.max(0, ...s.certificates.map((c) => c.id)) + 1,
          type: "diploma",
          source: "diploma",
          category_id: program.id,
          status: "issued",
          course_title: program.name ?? "",
          user_name: s.users.find((u) => u.id === 99001)!.name ?? "",
          issued_at: new Date().toISOString(),
          serial_number: serial,
          verification_token: serial,
          file_path: `local:${serial}`,
        });
      }
    }
  });
  return score;
}
function issueCertificateInState(s: FrontendState, courseId: number) {
  if (s.certificates.some((c) => c.course_id === courseId)) return;
  const course = s.courses.find((c) => c.id === courseId);
  if (!course) throw new Error("المقرر غير موجود");
  const serial = `LOCAL-${courseId}-${Date.now()}`;
  s.certificates.push({
    id: Math.max(0, ...s.certificates.map((c) => c.id)) + 1,
    course_id: courseId,
    type: "course",
    source: "course",
    status: "issued",
    course_title: course.title ?? "",
    user_name: s.users.find((u) => u.id === 99001)?.name ?? "الطالب",
    issued_at: new Date().toISOString(),
    serial_number: serial,
    verification_token: serial,
    file_path: `local:${serial}`,
    exam_grade: s.results[courseId]?.score ?? 96,
  });
}
export function issueLocalCertificate(courseId: number) {
  changeFrontend((s) => issueCertificateInState(s, courseId));
}
export function verificationData(serial: string) {
  const c = readFrontend().certificates.find(
    (c) => c.serial_number.toLowerCase() === serial.trim().toLowerCase(),
  );
  return c
    ? {
        ...c,
        student_name: c.user_name,
        course_name: c.course_title,
        exam_date: c.issued_at,
        issue_date: c.issued_at,
        exam_grade: `${c.exam_grade ?? 96}%`,
        is_valid: true,
      }
    : null;
}
