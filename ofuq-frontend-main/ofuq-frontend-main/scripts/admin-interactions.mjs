import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { request } from "node:http";
const base = "http://127.0.0.1:3004",
  api = "http://127.0.0.1:8000/api",
  out = resolve("artifacts/phase06");
await mkdir(out, { recursive: true });
const call = (url, options = {}) =>
  new Promise((done, fail) => {
    const req = request(url, options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        done({
          status: res.statusCode,
          json: () => JSON.parse(Buffer.concat(chunks).toString()),
        }),
      );
    });
    req.on("error", fail);
    if (options.body) {
      req.setHeader("Content-Length", Buffer.byteLength(options.body));
      req.write(options.body);
    }
    req.end();
  });
const audit = () => {
  const r = spawnSync("php", ["artisan", "demo:admin-read-audit"], {
    cwd: resolve("../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main"),
    env: { ...process.env, DEMO_ENTRY_DATABASE: "ofoq_demo" },
    windowsHide: true,
    encoding: "utf8",
  });
  if (r.status !== 0) throw Error("Isolation audit failed");
  return JSON.parse(r.stdout).domain_tables;
};
const before = audit();
const entry = await call(base + "/api/demo-entry", {
  method: "POST",
  headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ persona: "admin" }),
});
if (entry.status !== 201 && entry.status !== 200)
  throw Error("Authenticated gateway unavailable");
const session = entry.json();
const headers = {
  Authorization: "Bearer " + session.token,
  Accept: "application/json",
};
const browser = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--remote-debugging-port=9247",
    `--user-data-dir=${await mkdtemp(resolve(tmpdir(), "ofoq-admin-interaction-"))}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const reports = [];
let socket;
const check = (test, pass, details = {}) => {
  reports.push({ test, status: pass ? "PASS" : "FAIL", ...details });
  console.log(`${pass ? "PASS" : "FAIL"} ${test}`);
};
try {
  let target;
  for (let i = 0; i < 40; i++) {
    try {
      target = (await (await fetch("http://127.0.0.1:9247/json")).json()).find(
        (t) => t.type === "page",
      );
      if (target) break;
    } catch {}
    await pause(150);
  }
  if (!target) throw Error("Chrome unavailable");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;
  socket.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const t = pending.get(m.id);
    if (t) {
      pending.delete(m.id);
      m.error ? t.reject(Error(m.error.message)) : t.resolve(m.result);
    }
  };
  await new Promise((done) => (socket.onopen = done));
  const send = (method, params = {}) =>
    new Promise((done, fail) => {
      const mid = ++id;
      pending.set(mid, { resolve: done, reject: fail });
      socket.send(JSON.stringify({ id: mid, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.text);
    return r.result.value;
  };
  const wait = async (expression) => {
    for (let i = 0; i < 180; i++) {
      if (await evaluate(`Boolean(${expression})`)) return true;
      await pause(100);
    }
    return false;
  };
  const go = async (path, text) => {
    await send("Page.navigate", { url: base + path });
    await pause(100);
    if (
      text &&
      !(await wait(
        `document.querySelector('#admin-main')?.innerText.includes(${JSON.stringify(text)})`,
      ))
    )
      throw Error("Page not ready " + path);
  };
  const shot = async (name) => {
    const clip = await evaluate(
      "({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})",
    );
    const r = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip,
    });
    await writeFile(resolve(out, name + ".png"), Buffer.from(r.data, "base64"));
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Performance.enable");
  await send("Accessibility.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await go("/experience");
  await wait('document.querySelector("#enter-admin")');
  await evaluate(
    `localStorage.setItem('auth_token',${JSON.stringify(session.token)});localStorage.setItem('user_data',${JSON.stringify(JSON.stringify(session.user))})`,
  );
  await go("/admin/diplomas", "برامج تصنع");
  await evaluate(
    'document.querySelector("#admin-main input[type=search]").focus()',
  );
  await send("Input.insertText", { text: "Python" });
  check(
    "Program search filters actual catalog",
    await wait('document.querySelectorAll("#admin-main article").length===1'),
  );
  await shot("program-search-python");
  await evaluate(
    'document.querySelector("#admin-main input[type=search]").select()',
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
  });
  await evaluate(
    '(()=>{const s=document.querySelector("#admin-main select");s.value="draft";s.dispatchEvent(new Event("change",{bubbles:true}));})()',
  );
  check(
    "Unpublished records remain labeled, never republished",
    await wait(
      'document.querySelectorAll("#admin-main article").length===5&&document.querySelector("#admin-main article")?.innerText.includes("غير منشور")',
    ),
  );
  await shot("program-unpublished-state");
  await go("/admin/students", "دليل الطلاب");
  const first = await evaluate(
    'document.querySelector("#admin-main tbody tr td").textContent',
  );
  await evaluate(
    '[...document.querySelectorAll("#admin-main button")].find(b=>b.textContent==="التالي").click()',
  );
  check(
    "Student pagination reads next server page",
    await wait(
      `document.querySelector('#admin-main tbody tr td')?.textContent!==${JSON.stringify(first)}&&document.querySelectorAll('#admin-main tbody tr').length===20`,
    ),
  );
  await evaluate(
    'document.querySelector("#admin-main input[type=search]").focus()',
  );
  await send("Input.insertText", { text: "ليان أحمد الكيلاني" });
  await evaluate('document.querySelector("#admin-main form").requestSubmit()');
  check(
    "Student search finds actual showcase without numeric ID",
    await wait(
      'document.querySelectorAll("#admin-main tbody tr").length===1&&document.querySelector("#admin-main tbody")?.innerText.includes("ليان أحمد الكيلاني")',
    ),
  );
  await shot("student-search-showcase");
  const students = (
    await call(api + "/admin/showcase/students?showcase=1", { headers })
  ).json().data;
  const student = students[0];
  const detail = (
    await call(api + "/admin/showcase/students/" + student.id, { headers })
  ).json().data;
  const catalog = (
    await call(api + "/admin/courses?per_page=50", { headers })
  ).json().data;
  const course = catalog.find((c) =>
    detail.courses.some(
      (s) => s.course_id === c.id && s.progress_percentage === 50,
    ),
  );
  const chapter = course.chapters[0];
  await go(
    `/admin/courses/${course.id}/chapters/${chapter.id}/lessons`,
    "خريطة المحتوى",
  );
  check(
    "Legacy course/chapter/lessons deep link preserves actual context",
    await evaluate(
      `document.querySelector('#admin-main').innerText.includes(${JSON.stringify(chapter.lessons[0].title)})`,
    ),
  );
  await shot("legacy-course-chapter-deep-link");
  check('Content deep link has the correct active sidebar module',await evaluate('document.querySelector("aside [aria-current=page]")?.getAttribute("href")==="/admin/course-management"'));
  await go(`/admin/courses/${course.id}/question-bank`,'بنك الأسئلة');
  check('Exam deep link has the correct active sidebar module',await evaluate('document.querySelector("aside [aria-current=page]")?.getAttribute("href")==="/admin/exams"'));
  await go(`/admin/reports/courses/${course.id}`, "الطلاب المرتبطون");
  check(
    "Existing course report deep link remains readable",
    await evaluate(
      'document.querySelector("#admin-main").innerText.includes("التقدم")',
    ),
  );
  const lesson = chapter.lessons[0];
  await go(`/admin/reports/lessons/${lesson.id}`, "الطلاب المرتبطون");
  check(
    "Existing lesson report deep link remains readable",
    await evaluate(
      `document.querySelector('#admin-main h1').textContent===${JSON.stringify(lesson.title)}`,
    ),
  );
  await shot("lesson-report-deep-link");
  for (const cert of detail.certificates) {
    const r = await call(
      api + `/student/certificates/${cert.source}/${cert.id}/download`,
      { headers },
    );
    check(
      "Admin cannot take student-owned download scope " + cert.source,
      r.status === 403,
    );
  }
  await go("/admin/students", "دليل الطلاب");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 900,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await evaluate('document.querySelector("#admin-main [role=region]").focus()');
  const original = await evaluate("document.activeElement.scrollLeft");
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "ArrowLeft",
    code: "ArrowLeft",
    windowsVirtualKeyCode: 37,
  });
  await pause(200);
  const moved = await evaluate("document.activeElement.scrollLeft");
  check("RTL mobile table scrolls using keyboard", moved !== original, {
    before: original,
    after: moved,
  });
  await shot("mobile-table-keyboard-scrolled");
  await evaluate(
    'document.querySelector("[aria-controls=admin-mobile-nav]").click()',
  );
  await wait('document.querySelector("#admin-mobile-nav")');
  const tree = (await send("Accessibility.getFullAXTree")).nodes;
  check(
    "Browser accessibility tree exposes main, open navigation and data table",
    tree.some((n) => n.role?.value === "main") &&
      tree.some((n) => n.role?.value === "navigation" && n.name?.value) &&
      tree.some((n) => n.role?.value === "table"),
  );
  await writeFile(
    resolve(out, "accessibility-tree-summary.json"),
    JSON.stringify(
      tree
        .filter((n) =>
          ["main", "navigation", "table", "heading"].includes(n.role?.value),
        )
        .map((n) => ({ role: n.role.value, name: n.name?.value })),
      null,
      2,
    ),
  );
  const luminance = (hex) => {
    const values = hex
      .match(/[0-9a-f]{2}/gi)
      .map((c) => parseInt(c, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const pairs = [
    ["29233b", "f6f4ed"],
    ["746d7c", "fffdf7"],
    ["746d7c", "f6f4ed"],
    ["29233b", "d8ef73"],
    ["c4becd", "29233b"],
    ["35562d", "e6efdf"],
    ["76500c", "f6e9d2"],
  ].map(([fg, bg]) => ({
    foreground: fg,
    background: bg,
    ratio:
      (Math.max(luminance(fg), luminance(bg)) + 0.05) /
      (Math.min(luminance(fg), luminance(bg)) + 0.05),
  }));
  check(
    "Core text/token contrast pairs meet 4.5:1",
    pairs.every((p) => p.ratio >= 4.5),
    { pairs },
  );
  await writeFile(
    resolve(out, "performance-metrics.json"),
    JSON.stringify((await send("Performance.getMetrics")).metrics, null, 2),
  );
} catch (error) {
  check("Interaction browser execution", false, { error: error.message });
  process.exitCode = 1;
} finally {
  await call(api + "/auth/logout", { method: "POST", headers });
  check(
    "Interaction GETs preserve all domain hashes",
    JSON.stringify(before) === JSON.stringify(audit()),
  );
  await writeFile(
    resolve(out, "interaction-results.json"),
    JSON.stringify(
      {
        reports,
        summary: {
          pass: reports.filter((r) => r.status === "PASS").length,
          fail: reports.filter((r) => r.status === "FAIL").length,
        },
      },
      null,
      2,
    ),
  );
  if (socket) socket.close();
  if (browser.pid)
    spawnSync("taskkill", ["/PID", String(browser.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  if (reports.some((r) => r.status === "FAIL")) process.exitCode = 1;
}
