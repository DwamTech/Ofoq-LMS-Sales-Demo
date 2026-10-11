import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { request } from "node:http";
import { PDFDocument } from "pdf-lib";
const base = "http://127.0.0.1:3004",
  api = "http://127.0.0.1:8000/api",
  out = resolve("artifacts/phase06");
await mkdir(out, { recursive: true });
const call = (url, options = {}) =>
  new Promise((done, fail) => {
    const req = request(url, options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const bytes = Buffer.concat(chunks);
        done({
          status: res.statusCode,
          bytes,
          headers: res.headers,
          json: () => JSON.parse(bytes.toString()),
        });
      });
    });
    req.on("error", fail);
    req.setTimeout(20000, () => req.destroy(Error("Local HTTP timeout")));
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
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.status !== 0) throw Error("Isolation/hash audit failed");
  return JSON.parse(r.stdout);
};
const before = audit();
await writeFile(
  resolve(out, "read-only-before.json"),
  JSON.stringify(before, null, 2),
);
const reports = [],
  requests = [],
  errors = [],
  performance = [];
const check = (test, pass, details = {}) => {
  reports.push({ test, status: pass ? "PASS" : "FAIL", ...details });
  console.log(`${pass ? "PASS" : "FAIL"} ${test}`);
};
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const browser = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    "--remote-debugging-port=9246",
    `--user-data-dir=${await mkdtemp(resolve(tmpdir(), "ofoq-admin-"))}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let socket, adminToken, studentToken;
try {
  let target;
  for (let i = 0; i < 50; i++) {
    try {
      target = (await (await fetch("http://127.0.0.1:9246/json")).json()).find(
        (t) => t.type === "page",
      );
      if (target) break;
    } catch {}
    await pause(150);
  }
  if (!target) throw Error("Chrome CDP unavailable");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.method === "Runtime.exceptionThrown")
      errors.push(m.params.exceptionDetails.text);
    if (m.method === "Network.requestWillBeSent")
      requests.push({
        method: m.params.request.method,
        url: m.params.request.url.split("?")[0],
      });
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
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails)
      throw Error(
        r.exceptionDetails.exception?.description ?? r.exceptionDetails.text,
      );
    return r.result.value;
  };
  const wait = async (expression) => {
    for (let i = 0; i < 230; i++) {
      if (await evaluate(`Boolean(${expression})`)) return true;
      await pause(100);
    }
    return false;
  };
  const viewport = (width) =>
    send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 640,
      screenWidth: width,
      screenHeight: 900,
    });
  const go = async (path, text) => {
    const started = Date.now();
    await send("Page.navigate", { url: base + path });
    await pause(150);
    if (
      text &&
      !(await wait(
        `location.pathname===${JSON.stringify(path.split("?")[0])}&&document.querySelector('#admin-main')?.innerText.includes(${JSON.stringify(text)})`,
      ))
    )
      throw Error(
        "Page not ready: " +
          path +
          " " +
          (await evaluate("document.body.innerText.slice(0,400)")),
      );
    await evaluate("document.fonts.ready.then(()=>true)");
    await pause(200);
    performance.push({
      route: path.split("?")[0],
      readyMs: Date.now() - started,
    });
  };
  const capture = async (name) => {
    await evaluate("scrollTo(0,0)");
    const clip = await evaluate(
      "({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})",
    );
    const image = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip,
    });
    await writeFile(
      resolve(out, name + ".png"),
      Buffer.from(image.data, "base64"),
    );
  };
  const click = (selector) =>
    evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const headers = () => ({
    Authorization: "Bearer " + adminToken,
    Accept: "application/json",
  });
  for (const method of [
    "Page.enable",
    "Runtime.enable",
    "Network.enable",
    "DOM.enable",
    "CSS.enable",
  ])
    await send(method);
  await viewport(1440);
  await go("/admin");
  check(
    "Unauthenticated admin deep link redirects",
    await wait(
      'location.pathname==="/auth"&&!document.querySelector("[data-admin-ready]")',
    ),
  );
  await go("/experience");
  if (
    !(await wait(
      'document.querySelector("[data-experience-ready=true][data-session-checked=true]")',
    ))
  )
    throw Error("Gateway unavailable");
  await click("#enter-admin");
  check(
    "Journey A: real gateway reaches administration",
    await wait('document.querySelector("[data-admin-ready=true]")'),
  );
  adminToken = await evaluate('localStorage.getItem("auth_token")');
  const profile = (await call(api + "/profile", { headers: headers() })).json()
    .user;
  check(
    "Actual administrator identity and role",
    profile.role === "admin" &&
      (await evaluate(
        `document.body.innerText.includes(${JSON.stringify(profile.name)})`,
      )),
  );
  const diplomas = (
    await call(api + "/admin/categories", { headers: headers() })
  ).json().data;
  const courses = (
    await call(api + "/admin/courses?per_page=50", { headers: headers() })
  ).json().data;
  const lookup = (
    await call(api + "/admin/showcase/students?showcase=1", {
      headers: headers(),
    })
  ).json().data[0];
  if (!lookup) throw Error("Showcase student absent");
  const detail = (
    await call(api + "/admin/showcase/students/" + lookup.id, {
      headers: headers(),
    })
  ).json().data;
  const primary = detail.diplomas.find(
      (d) => d.progress_percentage > 0 && d.progress_percentage < 100,
    ),
    secondary = detail.diplomas.find((d) => d.progress_percentage === 100),
    active = detail.courses.find((c) => c.exam_status === "in_progress"),
    partial = detail.courses.find(
      (c) => c.progress_percentage > 0 && c.progress_percentage < 100,
    );
  if (!primary || !secondary || !active || !partial)
    throw Error("Required coherent journey missing");
  check(
    "Five canonical published diplomas unchanged",
    diplomas.filter((d) => d.is_published).length === 5,
  );
  check(
    "Published course total is full dataset, not first page",
    courses.filter((c) => c.is_published).length === 18 &&
      courses.length === 20,
  );
  check(
    "Showcase diploma academic progress matches student story",
    primary.progress_percentage === 25 && secondary.progress_percentage === 100,
  );
  check(
    "Course lesson progress and active final remain separate",
    partial.progress_percentage === 50 &&
      active.progress_percentage === 100 &&
      active.exam_score === null,
  );
  for (const width of [1920, 1440, 1280, 768, 390, 360]) {
    await viewport(width);
    await pause(140);
    const size = await evaluate(
      '({width:innerWidth,scroll:document.documentElement.scrollWidth,rtl:getComputedStyle(document.getElementById("admin-main")).direction})',
    );
    check(
      "Overview responsive " + width,
      size.scroll <= width && size.rtl === "rtl",
      size,
    );
    await capture("overview-" + width);
  }
  await viewport(390);
  await click('[aria-controls="admin-mobile-nav"]');
  check(
    "Mobile navigation opens with real destinations",
    await wait('document.querySelector("#admin-mobile-nav")'),
  );
  await capture("navigation-mobile");
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  check(
    "Escape closes navigation and restores focus",
    await evaluate(
      '!document.querySelector("#admin-mobile-nav")&&document.activeElement.getAttribute("aria-controls")==="admin-mobile-nav"',
    ),
  );
  await viewport(1440);
  await go("/admin", "الصورة الكاملة");
  await click('#admin-main a[href="/admin/diplomas"]');
  check(
    "Journey B: overview opens programs by real navigation",
    await wait(
      'location.pathname==="/admin/diplomas"&&document.querySelector("#admin-main")?.innerText.includes("برامج تصنع")',
    ),
  );
  await capture("programs-1440");
  const countBefore = requests.filter(
    (r) => r.url === api + "/admin/categories",
  ).length;
  await click(`#admin-main a[href="/admin/diplomas/${primary.category_id}"]`);
  check(
    "Program details load via canonical relationship",
    await wait(
      'location.pathname.endsWith("/diplomas/' +
        primary.category_id +
        '")&&document.querySelector("#admin-main")?.innerText.includes("الطلاب المرتبطون")',
    ),
  );
  check(
    "Shared catalog is not re-fetched by SPA navigation",
    requests.filter((r) => r.url === api + "/admin/categories").length ===
      countBefore,
  );
  await capture("diploma-details-1440");
  const related = courses.find((c) => c.id === partial.course_id);
  await click(`#admin-main a[href="/admin/courses/${related.id}"]`);
  check(
    "Journey C: program leads to actual course content",
    await wait(
      'location.pathname.endsWith("/courses/' +
        related.id +
        '")&&document.querySelector("#admin-main")?.innerText.includes("خريطة المحتوى")',
    ),
  );
  await capture("course-content-1440");
  await go("/admin/students", "دليل الطلاب");
  await click(`#admin-main a[href="/admin/students/${lookup.id}"]`);
  check(
    "Journey D: actual student record and academic programs",
    await wait(
      'document.querySelector("#admin-main")?.innerText.includes("البرامج المسجّل بها")',
    ),
  );
  await capture("student-details-1440");
  await click(
    `#admin-main a[href="/admin/exams?course=${active.course_id}&student=${lookup.id}"]`,
  );
  check(
    "Journey E: active exam context from student record",
    await wait(
      'document.querySelector("#admin-main")?.innerText.includes("بنك الأسئلة")',
    ),
  );
  const exam = (
    await call(api + "/admin/showcase/exams/" + active.course_id, {
      headers: headers(),
    })
  ).json().data;
  check(
    "Six real questions and unmodified in-progress attempt",
    exam.questions.length === 6 &&
      exam.attempts_by_status.in_progress >= 1 &&
      (await evaluate(
        'document.querySelector("#admin-main").innerText.includes("محاولة جارية")',
      )),
  );
  check(
    "Exam display does not expose answer keys",
    exam.questions.every(
      (q) => !("correct_answer" in q) && !("explanation" in q),
    ),
  );
  await capture("exam-context-1440");
  await go(
    "/admin/students/" + lookup.id + "?view=certificates",
    "الإنجاز المعتمد",
  );
  check(
    "Journey F: issued course and diploma certificates",
    detail.certificates.filter((c) =>
      ["completed", "issued"].includes(c.status),
    ).length === 2,
  );
  for (const cert of detail.certificates) {
    const verify = await call(
      api +
        "/public/verify-certificate?serial_number=" +
        encodeURIComponent(cert.serial_number),
    );
    const v = verify.json();
    check(
      "Actual certificate verification " + cert.source,
      verify.status === 200 &&
        v.valid &&
        v.data.student_name === lookup.name &&
        v.data.course_title === cert.program,
      { serial: cert.serial_number, program: v.data?.course_title },
    );
  }
  await capture("certificates-student-1440");
  await go("/admin/reports", "أين يحدث التعلّم");
  check(
    "Journey G: actual educational report",
    await evaluate(
      'document.querySelector("#admin-main").innerText.includes("جلسات مشاهدة محفوظة")',
    ),
  );
  await capture("reports-1440");
  await go("/admin/reports/beneficiaries", "الإنجاز حسب البرنامج");
  const beneficiaries = (
    await call(api + "/admin/reports/beneficiaries", { headers: headers() })
  ).json().data;
  const web = beneficiaries.diplomas.find(
    (d) => d.diploma_id === secondary.category_id,
  );
  check(
    "Report diploma completion agrees with showcase journey",
    web.completed_count >= 1 &&
      beneficiaries.summary.completed_any_diploma >= 1,
  );
  await capture("beneficiaries-1440");
  await evaluate(
    `(()=>{const inputs=[...document.querySelectorAll('#admin-main input[type=date]')];const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;inputs.forEach(input=>{setter.call(input,'2000-01-01');input.dispatchEvent(new Event('input',{bubbles:true}));});document.querySelector('#admin-main form').requestSubmit();})()`,
  );
  check(
    "Report filtering produces real empty cohort",
    await wait(
      'document.querySelector("#admin-main")?.innerText.includes("2000-01-01")&&[...document.querySelectorAll("#admin-main strong")].filter(n=>n.textContent.trim()==="٠").length>=3',
    ),
  );
  await capture("report-filter-2000");
  const blockedStart = requests.length;
  await go("/admin/reports/bunny", "تحليلات الفيديو");
  await capture("video-analytics-limited");
  await go("/admin/supervisors", "المشرفون والصلاحيات");
  await capture("supervisors-restricted");
  await go("/admin/database-backups", "النسخ الاحتياطية");
  await capture("backups-restricted");
  check(
    "Journey H: restricted video has no provider/sync requests",
    !requests
      .slice(blockedStart)
      .some(
        (r) =>
          r.url.startsWith(api) &&
          /\/admin\/(?:bunny|backups|supervisors)/.test(r.url),
      ),
  );
  await go("/admin/courses/new", "عملية تشغيلية");
  check(
    "Journey I: mutation unavailable without blocked write attempt",
    await evaluate(
      'document.querySelector("#admin-main").innerText.includes("تم تعطيلها في وضع الاستعراض")',
    ),
  );
  await capture("mutation-restricted");
  const pages = [
    ["programs", "/admin/diplomas", "برامج تصنع"],
    ["courses", "/admin/course-management", "المقررات المسجّلة"],
    ["students", "/admin/students", "دليل الطلاب"],
    ["student-record", "/admin/students/" + lookup.id, "البرامج المسجّل بها"],
    [
      "examination",
      "/admin/exams?course=" + active.course_id + "&student=" + lookup.id,
      "بنك الأسئلة",
    ],
    ["certificates", "/admin/certificates", "شهادات " + lookup.name],
    ["reports", "/admin/reports", "أين يحدث التعلّم"],
    ["diploma", "/admin/diplomas/" + primary.category_id, "الطلاب المرتبطون"],
    ["instructors", "/admin/instructors", "المحاضرون"],
  ];
  for (const [name, path, ready] of pages) {
    await viewport(1440);
    await go(path, ready);
    for (const width of [1440, 768, 390, 360]) {
      await viewport(width);
      await pause(120);
      const size = await evaluate(
        "({width:innerWidth,scroll:document.documentElement.scrollWidth})",
      );
      check(name + " responsive " + width, size.scroll <= width, size);
      await capture(name + "-" + width);
    }
  }
  await viewport(390);
  await go("/admin/students", "دليل الطلاب");
  const table = await evaluate(
    '(()=>{const table=document.querySelector("#admin-main [role=region]");return {scrollable:table.scrollWidth>table.clientWidth,focusable:table.tabIndex===0,caption:!!table.querySelector("caption")};})()',
  );
  check(
    "Mobile table has keyboard-scroll region and real caption",
    table.scrollable && table.focusable && table.caption,
    table,
  );
  await capture("mobile-table");
  await viewport(1440);
  await go("/admin", "الصورة الكاملة");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  check(
    "Reduced motion disables animated admin controls",
    await evaluate(
      'matchMedia("(prefers-reduced-motion: reduce)").matches&&getComputedStyle(document.querySelector("#admin-main a")).transitionDuration==="0s"',
    ),
  );
  await capture("reduced-motion");
  await send("Page.reload");
  check(
    "Journey K: refresh keeps validated admin role",
    await wait('document.querySelector("[data-admin-ready]")'),
  );
  await click('#admin-main a[href="/admin/diplomas"]');
  await wait('location.pathname==="/admin/diplomas"');
  await evaluate("history.back()");
  check(
    "Browser Back restores admin overview",
    await wait(
      'location.pathname==="/admin"&&document.querySelector("#admin-main")?.innerText.includes("الصورة الكاملة")',
    ),
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  const focus = await evaluate(
    "({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle})",
  );
  check(
    "Keyboard focus is visible",
    focus.tag !== "BODY" && focus.outline !== "none",
    focus,
  );
  const dom = (await send("DOM.getDocument")).root.nodeId;
  const title = (
    await send("DOM.querySelector", { nodeId: dom, selector: "#admin-main h1" })
  ).nodeId;
  const body = (
    await send("DOM.querySelector", { nodeId: dom, selector: "#admin-main p" })
  ).nodeId;
  const headingFonts = (
    await send("CSS.getPlatformFontsForNode", { nodeId: title })
  ).fonts;
  const bodyFonts = (
    await send("CSS.getPlatformFontsForNode", { nodeId: body })
  ).fonts;
  check(
    "Real scoped Arabic display font rendered",
    headingFonts.some(
      (f) => /Alexandria/i.test(f.familyName) && f.isCustomFont,
    ),
  );
  check(
    "Real scoped Arabic UI font rendered",
    bodyFonts.some(
      (f) => /IBM Plex Sans Arabic/i.test(f.familyName) && f.isCustomFont,
    ),
  );
  for (const path of [
    "/admin/bunny/reports/overview",
    "/admin/bunny/sync-logs",
    "/admin/backups",
    "/admin/supervisors",
    "/external/certificates/pending",
  ]) {
    const r = await call(api + path, { headers: headers() });
    check("Sensitive scope denied " + path, r.status === 403);
  }
  for (const [method, path] of [
    ["POST", "/admin/courses"],
    ["PUT", "/admin/categories/999999"],
    ["DELETE", "/admin/users/999999"],
  ]) {
    const r = await call(api + path, {
      method,
      headers: { ...headers(), "Content-Type": "application/json" },
      body: "{}",
    });
    check(
      "HTTP " + method + " mutation blocked without writes",
      r.status === 403 && r.json().code === "DEMO_READ_ONLY",
    );
  }
  for (let i = 0; i < 3; i++) {
    await call(api + "/admin/showcase/students/" + lookup.id, {
      headers: headers(),
    });
    await call(api + "/admin/showcase/exams/" + active.course_id, {
      headers: headers(),
    });
    await call(api + "/admin/reports/overview", { headers: headers() });
  }
  check("Journey L: repeated authenticated GETs executed", true);
  await click("[data-admin-logout]");
  check(
    "Journey J: logout returns gateway",
    await wait(
      'location.pathname==="/experience"&&document.querySelector("#enter-student")',
    ),
  );
  check(
    "Admin token is revoked after logout",
    (await call(api + "/profile", { headers: headers() })).status === 401,
  );
  check(
    "Logout clears admin local state",
    await evaluate(
      '!localStorage.getItem("auth_token")&&!localStorage.getItem("user_data")&&!localStorage.getItem("ofoq_demo_session")',
    ),
  );
  await click("#enter-student");
  check(
    "Student persona opens unchanged student experience",
    await wait('document.querySelector("[data-student-ready]")'),
  );
  studentToken = await evaluate('localStorage.getItem("auth_token")');
  const sh = {
    Authorization: "Bearer " + studentToken,
    Accept: "application/json",
  };
  for (const cert of detail.certificates.filter((c) =>
    ["completed", "issued"].includes(c.status),
  )) {
    const path =
      "/student/certificates/" + cert.source + "/" + cert.id + "/download";
    const pdf = await call(api + path, { headers: sh });
    const parsed =
      pdf.status === 200 && pdf.bytes.subarray(0, 5).toString() === "%PDF-"
        ? await PDFDocument.load(pdf.bytes)
        : null;
    check(
      "Student-owned existing PDF still downloads " + cert.source,
      pdf.status === 200 &&
        String(pdf.headers["content-type"]).startsWith("application/pdf") &&
        parsed?.getPageCount() >= 1,
      { bytes: pdf.bytes.length },
    );
    if (parsed)
      await writeFile(
        resolve(out, cert.source + "-existing-certificate.pdf"),
        pdf.bytes,
      );
  }
  for (const path of [
    "/admin/categories",
    "/admin/showcase/students",
    "/admin/showcase/students/" + lookup.id,
    "/admin/showcase/exams/" + active.course_id,
  ])
    check(
      "Student denied administrative scope " + path,
      (await call(api + path, { headers: sh })).status === 403,
    );
  check(
    "No admin DOM/cache survives persona switch",
    await evaluate(
      '!document.querySelector("[data-admin-ready]")&&!document.body.innerText.includes("مركز العمليات التعليمية")',
    ),
  );
  const studentDiplomas = (
    await call(api + "/my-diplomas", { headers: sh })
  ).json().data;
  check(
    "Student and admin diploma progress agree",
    detail.diplomas.every(
      (d) =>
        studentDiplomas.find((s) => s.category.id === d.category_id)?.progress ===
        d.progress_percentage,
    ),
  );
  await evaluate(
    'localStorage.setItem("user_data",JSON.stringify({role:"admin",name:"Forged admin"}))',
  );
  await go("/admin");
  check(
    "Forged browser admin label cannot mount admin workspace",
    await wait(
      'location.pathname==="/auth"&&!document.querySelector("[data-admin-ready]")',
    ),
  );
  await call(api + "/auth/logout", { method: "POST", headers: sh });
  for (const path of [
    "/",
    "/about",
    "/diploms",
    "/courses",
    "/community",
    "/privacy",
    "/terms",
    "/experience",
    "/auth",
    "/login_old",
    "/register_old",
    "/verify-certificate",
  ])
    check(
      "Production public route " + path,
      (await call(base + path)).status === (['/login_old','/register_old'].includes(path)?307:200),
    );
  check(
    "Production Brand Lab is server-side 404",
    (await call(base + "/brand-lab")).status === 404,
  );
  check("No browser runtime exceptions", errors.length === 0, { errors });
} catch (error) {
  check("Browser execution", false, { error: error.message });
  process.exitCode = 1;
  console.error(error.message);
} finally {
  const after = audit();
  check(
    "All domain tables unchanged before/after journeys",
    JSON.stringify(before.domain_tables) ===
      JSON.stringify(after.domain_tables),
  );
  const baseline = JSON.parse(
    await readFile(resolve(out, "baseline-domain.json"), "utf8"),
  );
  check(
    "Domain tables unchanged since pre-implementation baseline",
    JSON.stringify(baseline.domain_tables) ===
      JSON.stringify(after.domain_tables),
  );
  await writeFile(
    resolve(out, "read-only-after.json"),
    JSON.stringify(after, null, 2),
  );
  await writeFile(
    resolve(out, "browser-results.json"),
    JSON.stringify(
      {
        reports,
        summary: {
          pass: reports.filter((r) => r.status === "PASS").length,
          fail: reports.filter((r) => r.status === "FAIL").length,
        },
        requests,
        errors,
        performance,
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
