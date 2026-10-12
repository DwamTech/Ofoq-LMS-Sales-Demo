/** @jest-environment node */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
test.each([
  "courses/[id]",
  "courses/[id]/chapters",
  "courses/[id]/chapters/[chapterId]/lessons",
  "course-management",
  "courses/new",
  "students/[id]",
  "diplomas/[id]",
  "reports",
  "certificates",
  "profile-management",
  "database-backups",
  "policies/privacy",
])("admin route stays available: %s", (route) => {
  expect(existsSync(resolve("app/admin", route, "page.tsx"))).toBe(true);
});
test("admin routes share one workspace rather than mounting old backend forms", () => {
  const layout = readFileSync(resolve("app/admin/layout.tsx"), "utf8");
  expect(layout).toContain("<AdminWorkspace");
  expect(layout).not.toContain("UploadProvider");
  const route = readFileSync(
    resolve("app/admin/courses/[id]/page.tsx"),
    "utf8",
  );
  expect(route).not.toContain("useEffect");
});
