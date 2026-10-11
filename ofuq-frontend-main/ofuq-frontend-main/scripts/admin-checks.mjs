import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const out = resolve("artifacts/phase06");
await mkdir(out, { recursive: true });
const files = [
  ...(await readdir("components/admin/showcase"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => "components/admin/showcase/" + f),
  "utils/adminShowcase.ts",
  "utils/adminShowcase.test.ts",
  "app/admin/layout.tsx",
  "app/admin/exams/page.tsx",
  "app/admin/certificates/page.tsx",
  "app/admin/students/[id]/page.tsx",
];
const run = (file, args, extra = {}) =>
  spawnSync(file, args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20_000_000,
    ...extra,
  });
const lint = run(process.execPath, [
  "node_modules/eslint/bin/eslint.js",
  ...files,
  "-f",
  "json",
]);
const ts = run(process.execPath, [
  "node_modules/typescript/bin/tsc",
  "--noEmit",
  "--pretty",
  "false",
]);
const final = ts.stdout.split(/\r?\n/).filter((l) => l.includes("error TS"));
const baseline = JSON.parse(
  await readFile(resolve(out, "baseline-typescript.json"), "utf8"),
);
const normalize = (l) => l.replace(/\(\d+,\d+\)/, "");
const old = new Set(baseline.map(normalize));
const added = final.filter((l) => !old.has(normalize(l)));
const focused = run(process.execPath, [
  "node_modules/jest/bin/jest.js",
  "--runInBand",
  "utils/adminShowcase.test.ts",
  "utils/studentJourney.test.ts",
  "utils/demoGateway.test.ts",
  "app/api/demo-entry/route.test.ts",
  "__tests__/preservation/admin-routes.preservation.test.ts",
]);
const all = run(process.execPath, [
  "node_modules/jest/bin/jest.js",
  "--runInBand",
]);
const backend = resolve(
  "../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main",
);
const php = run(
  "php",
  [
    "vendor/phpunit/phpunit/phpunit",
    "tests/Feature/AdminShowcaseReadOnlyTest.php",
    "tests/Feature/StudentLearningReadOnlyTest.php",
    "tests/Feature/DemoModeReadOnlyTest.php",
  ],
  { cwd: backend },
);
const pint = run(
  "php",
  [
    "vendor/bin/pint",
    "--test",
    "app/Http/Controllers/Admin/ShowcaseReadController.php",
    "app/Console/Commands/AuditAdminReadOnly.php",
    "tests/Feature/AdminShowcaseReadOnlyTest.php",
  ],
  { cwd: backend },
);
const fullLint = run(process.execPath, [
  "node_modules/eslint/bin/eslint.js",
  "app",
  "components",
  "utils",
  "-f",
  "json",
]);
const lintData = JSON.parse(lint.stdout),
  allLint = JSON.parse(fullLint.stdout);
const result = {
  focusedLint: {
    status: lint.status === 0 ? "PASS" : "FAIL",
    errors: lintData.reduce((n, f) => n + f.errorCount, 0),
    warnings: lintData.reduce((n, f) => n + f.warningCount, 0),
    files: lintData.map((f) => ({
      file: f.filePath,
      errors: f.errorCount,
      warnings: f.warningCount,
    })),
  },
  typescript: {
    status: ts.status === 0 ? "PASS" : "FAIL",
    baseline: baseline.length,
    final: final.length,
    newDiagnostics: added,
    diagnostics: final,
  },
  focusedJest: {
    status: focused.status === 0 ? "PASS" : "FAIL",
    output: focused.stdout + focused.stderr,
  },
  allJest: {
    status: all.status === 0 ? "PASS" : "FAIL",
    output: all.stdout + all.stderr,
  },
  backend: {
    status: php.status === 0 ? "PASS" : "FAIL",
    output: php.stdout + php.stderr,
  },
  pint: {
    status: pint.status === 0 ? "PASS" : "FAIL",
    output: pint.stdout + pint.stderr,
  },
  legacyLint: {
    status: fullLint.status === 0 ? "PASS" : "FAIL",
    errors: allLint.reduce((n, f) => n + f.errorCount, 0),
    warnings: allLint.reduce((n, f) => n + f.warningCount, 0),
    prePhaseBaseline:
      "NOT TESTED globally; existing Phase05 watch baseline 25 errors / 1 warning, untouched",
    newFiles: lintData.reduce((n, f) => n + f.errorCount, 0),
  },
  buildConfig: {
    ignoreBuildErrors: true,
    ignoreDuringBuilds: true,
    preexisting: true,
    modified: false,
  },
};
await writeFile(
  resolve(out, "technical-results.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    {
      ...result,
      focusedLint: { ...result.focusedLint, files: undefined },
      typescript: { ...result.typescript, diagnostics: undefined },
      focusedJest: {
        status: result.focusedJest.status,
        summary: result.focusedJest.output.match(/Tests:.*|Test Suites:.*/g),
      },
      allJest: {
        status: result.allJest.status,
        summary: result.allJest.output.match(/Tests:.*|Test Suites:.*/g),
      },
    },
    null,
    2,
  ),
);
if (lint.status || focused.status || php.status || pint.status || added.length)
  process.exitCode = 1;
