import {
  changeFrontend,
  completeLesson,
  courseProgress,
  deleteEntity,
  readFrontend,
  resetFrontend,
  saveEntity,
  submitLocalExam,
  toggleFavorite,
  verificationData,
  importFrontend,
} from "./frontendStore";

beforeAll(() => {
  if (!global.structuredClone)
    global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
});
beforeEach(() => localStorage.clear());
test("lesson completion persists without duplicates and contributes to course progress", () => {
  completeLesson(200101);
  completeLesson(200101);
  expect(readFrontend().completed).toEqual([200101]);
  expect(courseProgress(2001).overall_progress).toBe(25);
});
test("incomplete answers cannot issue a certificate; a passing exam issues one verifiable certificate", () => {
  expect(() => submitLocalExam(2001, {})).toThrow();
  expect(readFrontend().certificates).toHaveLength(1);
  expect(submitLocalExam(2001, { 1: 0, 2: 0, 3: 0, 4: 0 })).toBe(100);
  const certificate = readFrontend().certificates.find(
    (c) => c.course_id === 2001,
  )!;
  expect(verificationData(certificate.serial_number)?.exam_grade).toBe("100%");
  submitLocalExam(2001, { 1: 0, 2: 0, 3: 0, 4: 0 });
  expect(
    readFrontend().certificates.filter((c) => c.course_id === 2001),
  ).toHaveLength(1);
});
test("failing exam saves a result without issuing a certificate", () => {
  expect(submitLocalExam(2001, { 1: 1, 2: 1, 3: 1, 4: 1 })).toBe(0);
  expect(readFrontend().results[2001].passed).toBe(false);
  expect(readFrontend().certificates.some((c) => c.course_id === 2001)).toBe(
    false,
  );
});
test("passing every course issues exactly one diploma certificate with unique IDs", () => {
  submitLocalExam(2001, { 1: 0, 2: 0, 3: 0, 4: 0 });
  submitLocalExam(2002, { 1: 0, 2: 0, 3: 0, 4: 0 });
  submitLocalExam(2002, { 1: 0, 2: 0, 3: 0, 4: 0 });
  const certs = readFrontend().certificates;
  expect(
    certs.filter((c) => c.type === "diploma" && c.category_id === 1001),
  ).toHaveLength(1);
  expect(new Set(certs.map((c) => c.id)).size).toBe(certs.length);
});
test("duplicate program slugs and malformed backups are rejected without losing data", () => {
  const state = readFrontend();
  expect(() =>
    saveEntity("programs", {
      id: 7000,
      name: "Duplicate",
      slug: state.programs[0].slug,
    }),
  ).toThrow();
  const invalid = structuredClone(state);
  (
    invalid as unknown as { courses: { chapters: { lessons: unknown }[] }[] }
  ).courses[0].chapters[0].lessons = null;
  expect(() => importFrontend(invalid)).toThrow();
  expect(readFrontend().courses).toHaveLength(12);
});
test("local CRUD and favorites survive subsequent reads; deleting a course removes stale references", () => {
  saveEntity("courses", { id: 6000, title: "Local course", chapters: [] });
  changeFrontend((s) => s.enrolled.push(6000));
  toggleFavorite(6000);
  expect(readFrontend().courses.some((c) => c.id === 6000)).toBe(true);
  deleteEntity("courses", 6000);
  expect(readFrontend().enrolled).not.toContain(6000);
  expect(readFrontend().favorites).not.toContain(6000);
});
test("exported state can be restored and reset; invalid import preserves existing state", () => {
  toggleFavorite(2004);
  const backup = readFrontend();
  resetFrontend();
  expect(readFrontend().favorites).not.toContain(2004);
  importFrontend(backup);
  expect(readFrontend().favorites).toContain(2004);
  expect(() => importFrontend({ version: 1 })).toThrow();
  expect(readFrontend().favorites).toContain(2004);
});
