import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { request } from "node:http";
const out = resolve("artifacts/phase06");
await mkdir(out, { recursive: true });
const backend = resolve(
  "../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main",
);
const audit = spawnSync("php", ["artisan", "demo:admin-read-audit"], {
  cwd: backend,
  env: { ...process.env, DEMO_ENTRY_DATABASE: "ofoq_demo" },
  encoding: "utf8",
  windowsHide: true,
});
if (audit.status !== 0) throw Error("Demo isolation failed: " + audit.stdout);
await writeFile(resolve(out, "baseline-domain.json"), audit.stdout);
const tsc = spawnSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "--noEmit", "--pretty", "false"],
  { encoding: "utf8", windowsHide: true, maxBuffer: 10_000_000 },
);
await writeFile(
  resolve(out, "baseline-typescript.json"),
  JSON.stringify(
    tsc.stdout.split(/\r?\n/).filter((l) => l.includes("error TS")),
    null,
    2,
  ),
);
const call = (url, options = {}) =>
  new Promise((done, fail) => {
    const req = request(url, options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        done({
          status: res.statusCode,
          data: JSON.parse(Buffer.concat(chunks).toString()),
        }),
      );
    });
    req.on("error", fail);
    if (options.body) req.write(options.body);
    req.end();
  });
const entry = await call("http://127.0.0.1:3004/api/demo-entry", {
  method: "POST",
  headers: {
    Origin: "http://127.0.0.1:3004",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ persona: "admin" }),
});
if (!entry.data.token) throw Error("Gateway status " + entry.status);
const paths = [
  "/admin/categories",
  "/admin/courses?per_page=50",
  "/admin/reports/overview?limit=5",
  "/admin/reports/beneficiaries",
  "/admin/showcase/students?search=" + encodeURIComponent("ليان"),
  "/admin/instructors?per_page=50",
];
const result = {};
for (const path of paths) {
  const r = await call("http://127.0.0.1:8000/api" + path, {
    headers: {
      Authorization: "Bearer " + entry.data.token,
      Accept: "application/json",
    },
  });
  result[path] = r;
  console.log(path.split("?")[0], r.status);
}
const student = result[paths[4]].data.data?.[0];
if (student) {
  const path = "/admin/showcase/students/" + student.id;
  result[path] = await call("http://127.0.0.1:8000/api" + path, {
    headers: {
      Authorization: "Bearer " + entry.data.token,
      Accept: "application/json",
    },
  });
  console.log("Student detail", result[path].status);
}
await writeFile(
  resolve(out, "inspection.json"),
  JSON.stringify(result, null, 2),
);
await call("http://127.0.0.1:8000/api/auth/logout", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + entry.data.token,
    Accept: "application/json",
  },
});
console.log(
  "Inspection saved without credentials. Baseline TypeScript:",
  tsc.stdout.match(/error TS/g)?.length ?? 0,
);
