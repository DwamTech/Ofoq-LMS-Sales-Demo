import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { request } from "node:http";
import { PDFDocument } from "pdf-lib";
const base = "http://127.0.0.1:3004",
  api = "http://127.0.0.1:8000/api",
  output = resolve("artifacts/phase05"),
  backend = resolve(
    "../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main",
  );
await mkdir(output, { recursive: true });
const call = (url, options = {}) =>
  new Promise((accept, reject) => {
    const req = request(url, options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const bytes = Buffer.concat(chunks);
        accept({
          status: res.statusCode,
          headers: res.headers,
          bytes,
          json: () => JSON.parse(bytes.toString()),
        });
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("Local HTTP timeout")));
    if (options.body) req.write(options.body);
    req.end();
  });
const audit = () => {
  const result = spawnSync("php", ["artisan", "demo:student-read-audit"], {
    cwd: backend,
    env: { ...process.env, DEMO_ENTRY_DATABASE: "ofoq_demo" },
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error("Isolation/read audit failed: " + result.stdout);
  return JSON.parse(result.stdout);
};
const before = audit();
await writeFile(
  resolve(output, "read-only-before.json"),
  JSON.stringify(before, null, 2),
);
const browser = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    "--remote-debugging-port=9245",
    `--user-data-dir=${await mkdtemp(resolve(tmpdir(), "ofoq-student-"))}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const reports = [];
const errors = [];
const requests = [];
let socket;
let studentToken;
const check = (test, pass, details = {}) => {
  reports.push({ test, status: pass ? "PASS" : "FAIL", ...details });
  console.log((pass ? "PASS " : "FAIL ") + test);
};
try {
  let target;
  for (let i = 0; i < 40; i++) {
    try {
      target = (await (await fetch("http://127.0.0.1:9245/json")).json()).find(
        (t) => t.type === "page",
      );
      if (target) break;
    } catch {}
    await pause(150);
  }
  if (!target) throw new Error("Chrome CDP unavailable");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown")
      errors.push(message.params.exceptionDetails.text);
    if (message.method === "Network.requestWillBeSent")
      requests.push({
        method: message.params.request.method,
        url: message.params.request.url.split("?")[0],
      });
    const task = pending.get(message.id);
    if (task) {
      pending.delete(message.id);
      message.error
        ? task.reject(new Error(message.error.message))
        : task.resolve(message.result);
    }
  };
  await new Promise((done) => (socket.onopen = done));
  const send = (method, params = {}) =>
    new Promise((accept, reject) => {
      const messageId = ++id;
      pending.set(messageId, { resolve: accept, reject });
      socket.send(JSON.stringify({ id: messageId, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    return result.result.value;
  };
  const wait = async (expression) => {
    for (let i = 0; i < 180; i++) {
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
  const go = async (path, selector) => {
    await send("Page.navigate", { url: base + path });
    if (
      selector &&
      !(await wait(`document.querySelector(${JSON.stringify(selector)})`))
    )
      throw new Error(
        "Page unavailable: " +
          path +
          " " +
          (await evaluate("document.body.innerText.slice(0,450)")),
      );
    await evaluate("document.fonts.ready.then(()=>true)");
    await pause(250);
  };
  const capture = async (name, full = true) => {
    const clip = await evaluate(
      "({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})",
    );
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: full,
      ...(full ? { clip } : {}),
    });
    await writeFile(
      resolve(output, name + ".png"),
      Buffer.from(shot.data, "base64"),
    );
  };
  const click = (selector) =>
    evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const headers = () => ({
    Authorization: "Bearer " + studentToken,
    Accept: "application/json",
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("DOM.enable");
  await send("CSS.enable");
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: output,
    eventsEnabled: true,
  });
  await viewport(1440);
  await go("/user");
  check(
    "unauthenticated student direct URL redirects",
    await wait('location.pathname==="/auth"'),
  );
  await go(
    "/experience",
    "[data-experience-ready=true][data-session-checked=true]",
  );
  await click("#enter-student");
  check(
    "Journey A: gateway reaches real student workspace",
    await wait(
      '[...document.querySelectorAll("[data-student-ready=true]")].length>0',
    ),
  );
  if (
    !(await evaluate(
      'Boolean(document.querySelector("[data-student-ready=true]"))',
    ))
  )
    throw new Error("No authenticated workspace");
  studentToken = await evaluate('localStorage.getItem("auth_token")');
  const profile = (await call(api + "/profile", { headers: headers() })).json()
    .user;
  const diplomaResponse = (
    await call(api + "/my-diplomas", { headers: headers() })
  ).json().data;
  const courses = (
    await call(api + "/my-enrollments?per_page=100", { headers: headers() })
  ).json().data;
  const exams = (await call(api + "/my-tests", { headers: headers() })).json()
    .data;
  const certificates = (
    await call(api + "/my-certificates", { headers: headers() })
  ).json().certificates;
  const primary = diplomaResponse.find(
    (d) => d.progress > 0 && d.progress < 100,
  );
  const secondary = diplomaResponse.find((d) => d.progress === 100);
  const active = exams.find((e) => e.active_attempt_status === "in_progress");
  const partial = courses.find(
    (c) => c.progress_percentage > 0 && c.progress_percentage < 100,
  );
  if (!primary || !secondary || !active || !partial)
    throw new Error("Required real journey missing");
  for (const course of courses) {
    const response = await call(api + "/courses/" + course.id + "/progress", {
      headers: headers(),
    });
    const progress = response.json().course_progress;
    const completed = progress.lessons.filter(
      (lesson) => lesson.status === "completed",
    ).length;
    const persistedPercent =
      Math.round((completed / course.lessons_count) * 10000) / 100;
    check(
      "persisted lesson progress matches enrollment: " + course.title,
      response.status === 200 &&
        Number(progress.overall_progress) ===
          Number(course.progress_percentage) &&
        persistedPercent === Number(course.progress_percentage),
      {
        completedLessons: completed,
        lessons: course.lessons_count,
        progress: course.progress_percentage,
      },
    );
  }
  check(
    "student backend identity is reflected",
    profile.role === "student" &&
      (await evaluate(
        `document.body.innerText.includes(${JSON.stringify(profile.name)})`,
      )),
  );
  for (const width of [1920, 1440, 1280, 768, 390, 360]) {
    await viewport(width);
    await go("/user", "[data-student-page=overview]");
    const size = await evaluate(
      '({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rtl:getComputedStyle(document.getElementById("student-main")).direction})',
    );
    check(
      "overview responsive " + width,
      size.scrollWidth <= width && size.rtl === "rtl",
      size,
    );
    await capture("dashboard-" + width);
  }
  await viewport(390);
  await click('[aria-controls="student-mobile-nav"]');
  check(
    "mobile navigation opens accessibly",
    await wait('document.querySelector("#student-mobile-nav")'),
  );
  await capture("mobile-navigation");
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  check(
    "Escape closes navigation and restores focus",
    await evaluate(
      '!document.querySelector("#student-mobile-nav")&&document.activeElement.getAttribute("aria-controls")==="student-mobile-nav"',
    ),
  );
  await viewport(1440);
  await go("/user", "[data-student-page=overview]");
  const root = (await send("DOM.getDocument")).root.nodeId;
  const fontEvidence = [];
  for (const selector of ["#student-main h1", "#student-main p"]) {
    const nodeId = (await send("DOM.querySelector", { nodeId: root, selector }))
      .nodeId;
    fontEvidence.push({
      selector,
      fonts: (await send("CSS.getPlatformFontsForNode", { nodeId })).fonts,
    });
  }
  check(
    "actual local Arabic display/UI fonts rendered",
    fontEvidence.every((f) =>
      f.fonts.some((font) => font.isCustomFont && font.glyphCount > 0),
    ),
    { fontEvidence },
  );
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await evaluate('document.querySelector("aside nav a").focus()');
  check(
    "keyboard focus has visible outline",
    await evaluate(
      'getComputedStyle(document.activeElement).outlineStyle==="solid"&&parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3',
    ),
  );
  check(
    "student navigation touch targets are at least 44px",
    await evaluate(
      'Array.from(document.querySelectorAll("aside nav a, aside nav button")).every(e=>e.getBoundingClientRect().height>=44)',
    ),
  );
  check(
    "workspace has one main heading and named progress bars",
    await evaluate(
      'document.querySelectorAll("#student-main h1").length===1&&Array.from(document.querySelectorAll("[role=progressbar]")).every(e=>e.hasAttribute("aria-label")&&e.hasAttribute("aria-valuenow"))',
    ),
  );
  await capture("student-keyboard-focus", false);
  await go("/user/my_courses", "[data-student-page]");
  await capture("my-diplomas");
  await go(
    "/user/diplomas/" + encodeURIComponent(primary.category.slug),
    "[data-student-page=diploma]",
  );
  check(
    "Journey B: Python has actual four associated courses",
    await evaluate(
      `document.querySelectorAll('[data-course-id]').length===${courses.filter((c) => c.category_id === primary.category.id).length}`,
    ),
  );
  await capture("python-diploma-progress");
  await click("[data-public-diploma]");
  check(
    "public diploma reflects actual enrollment",
    await wait('document.body.innerText.includes("شاهد المقررات")'),
  );
  await pause(600);
  await capture("public-diploma-enrolled");
  const relatedHref = await evaluate(
    'Array.from(document.querySelectorAll("a")).find(a=>a.getAttribute("href")?.startsWith("/course-details/"))?.getAttribute("href")',
  );
  check("public diploma links existing course", !!relatedHref);
  if (relatedHref) {
    await go(relatedHref, "h1");
    await pause(600);
    check(
      "associated public course page loads",
      await evaluate(
        'Boolean(document.querySelector("h1"))&&!document.body.innerText.includes("لم يتم العثور")',
      ),
    );
    await capture("associated-public-course");
  }
  await go("/user/my_courses?view=courses", "[data-student-page]");
  check(
    "course view matches eight real enrollments",
    await evaluate(
      `document.querySelectorAll('[data-course-id]').length===${courses.length}`,
    ),
  );
  await capture("my-courses");
  await go("/user/courses/" + partial.id, "[data-student-page=course]");
  check(
    "Journey C: actual 50% learning context",
    await evaluate(
      'Array.from(document.querySelectorAll("[role=progressbar]")).some(e=>e.getAttribute("aria-valuenow")==="50")',
    ),
  );
  await capture("continue-learning-course");
  const lessonPath = await evaluate(
    'Array.from(document.querySelectorAll("a")).find(a=>a.getAttribute("href")?.startsWith("/watch?"))?.getAttribute("href")',
  );
  if (!lessonPath) throw new Error("Accessible actual lesson link missing");
  await go(lessonPath, "[data-student-page=lesson]");
  check(
    "authorized real lesson has honest missing-video state",
    await evaluate(
      'document.body.innerText.includes("الفيديو")&&!document.querySelector("video")',
    ),
  );
  await capture("continue-learning-lesson");
  await go("/user/my_exams", "[data-student-page=exams]");
  await capture("my-exams");
  await click("[data-active-exam]");
  check(
    "Journey D: six actual final-exam questions",
    await wait('document.querySelectorAll("[data-exam-question]").length===6'),
  );
  check(
    "exam choices are non-selectable and submit disabled",
    await evaluate(
      '!document.querySelector("input[type=radio]")&&document.querySelectorAll("[data-exam-question] li").length>=12&&Boolean(document.querySelector("button[disabled][aria-describedby=exam-readonly-notice]"))',
    ),
  );
  await capture("final-exam-six-questions");
  const attempt = await call(
    api + `/courses/${active.course_id}/final-exam/attempt/active`,
    { headers: headers() },
  );
  const exposed = [];
  JSON.stringify(attempt.json(), (key, value) => {
    if (/correct|explanation|answer_key|pivot/i.test(key)) exposed.push(key);
    return value;
  });
  check(
    "actual exam HTTP DTO has no protected answer keys",
    attempt.status === 200 && exposed.length === 0,
    { statusCode: attempt.status, protectedKeys: exposed },
  );
  await go(
    "/user/diplomas/" + encodeURIComponent(secondary.category.slug),
    "[data-student-page=diploma]",
  );
  check(
    "Journey F: web diploma uses actual 100% completion",
    await evaluate(
      'Array.from(document.querySelectorAll("[role=progressbar]")).some(e=>e.getAttribute("aria-valuenow")==="100")',
    ),
  );
  await capture("completed-web-diploma");
  await go("/user/my-certificates", "[data-student-page=certificates]");
  await capture("certificate-list");
  for (const certificate of certificates) {
    const type = certificate.type;
    await click(`[data-certificate-download=${type}]`);
    let browserBytes;
    for(let retry=0;retry<60;retry++) {
      try {browserBytes=await readFile(resolve(output, certificate.serial_number+'.pdf'));break;} catch {}
      await pause(100);
    }
    check(type+' browser button saves actual PDF file', Boolean(browserBytes)&&browserBytes.subarray(0,5).toString()==='%PDF-'&&!await evaluate('Boolean(document.querySelector("[role=alert]"))'), {bytes:browserBytes?.length||0,reference:certificate.serial_number});
    const response = await call(
      api +
        `/student/certificates/${certificate.source}/${certificate.id}/download`,
      { headers: headers() },
    );
    let pages = 0;
    try {
      pages = (await PDFDocument.load(response.bytes)).getPageCount();
    } catch {}
    check(
      `Journey ${type === "course" ? "E" : "F"}: real ${type} PDF download`,
      response.status === 200 &&
        response.headers["content-type"]?.includes("application/pdf") &&
        response.bytes.subarray(0, 5).toString() === "%PDF-" &&
        pages > 0,
      {
        statusCode: response.status,
        contentType: response.headers["content-type"],
        bytes: response.bytes.length,
        pages,
        reference: certificate.serial_number,
      },
    );
    await writeFile(
      resolve(output, type + "-certificate-http.pdf"),
      response.bytes,
    );
    await capture(type + "-certificate-download");
    const verified = await call(
      api +
        "/public/verify-certificate?serial_number=" +
        encodeURIComponent(certificate.serial_number),
    );
    const data = verified.json();
    check(
      type + " verification matches actual student and program",
      verified.status === 200 &&
        data.valid &&
        data.data.student_name === profile.name &&
        data.data.course_title === certificate.course_title,
      {
        statusCode: verified.status,
        reference: certificate.serial_number,
        valid: data.valid,
        details: data.data,
      },
    );
    await click(`[data-certificate-verify=${type}]`);
    check(
      type + " public verification browser renders record",
      await wait(
        `document.body.innerText.includes(${JSON.stringify(profile.name)})`,
      ),
    );
    await capture(type + "-certificate-verification");
    await go("/user/my-certificates", "[data-student-page=certificates]");
  }
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("بيانات الشهادة")).click()',
  );
  await capture("certificate-record-preview");
  for (const width of [768, 390, 360]) {
    await viewport(width);
    for (const [path, page] of [
      ["/user/my_courses", "diplomas"],
      ["/user/my_courses?view=courses", "courses"],
      [
        "/user/diplomas/" + encodeURIComponent(primary.category.slug),
        "diploma",
      ],
      ["/user/courses/" + partial.id, "course"],
      [lessonPath, "lesson"],
      ["/user/final-exam/" + active.course_id, "final-exam"],
      ["/user/my-certificates", "certificates"],
    ]) {
      await go(path, "[data-student-page]");
      const size = await evaluate(
        "({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})",
      );
      check(page + " responsive " + width, size.scrollWidth <= width, size);
      await capture(page + "-" + width);
    }
  }
  await viewport(1440);
  await go("/user/settings", "[data-student-ready]");
  check(
    "existing profile route remains reachable",
    await wait('document.querySelector("input[type=email]")'),
  );
  await go("/user/fav", "[data-student-ready]");
  check(
    "existing favorites route remains reachable",
    await wait('document.body.innerText.includes("المفضلة")'),
  );
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await viewport(390);
  await go("/user", "[data-student-page=overview]");
  check(
    "reduced-motion preserves actual progress and navigation",
    await evaluate(
      'matchMedia("(prefers-reduced-motion: reduce)").matches&&document.querySelector("[role=progressbar]").getAttribute("aria-valuenow")==="25"',
    ),
  );
  await capture("reduced-motion-mobile");
  await send("Emulation.setEmulatedMedia", { features: [] });
  check(
    "browser learning exploration sends no educational mutations",
    requests.filter(
      (r) =>
        ["POST", "PUT", "PATCH", "DELETE"].includes(r.method) &&
        r.url.includes(":8000/api/") &&
        !r.url.endsWith("/auth/logout"),
    ).length === 0,
  );
  for (const path of [
    "/courses/2147483647/final-exam/start",
    "/courses/2147483647/final-exam/submit/2147483647",
    "/lessons/2147483647/complete",
  ]) {
    const res = await call(api + path, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: "{}",
    });
    check(
      "actual educational mutation remains 403 " + path,
      res.status === 403 && res.json().code === "DEMO_READ_ONLY",
      { statusCode: res.status },
    );
  }
  const forbidden = await call(api + "/admin/courses", { headers: headers() });
  check("student cannot access admin API", forbidden.status === 403);
  const productionLab = await call(base + "/brand-lab");
  check(
    "production Brand Lab stays server-side 404",
    productionLab.status === 404,
  );
  await viewport(1440);
  await go("/user", "[data-student-page=overview]");
  await send("Page.reload", { ignoreCache: true });
  check(
    "Journey G: authenticated refresh restores student data",
    await wait('document.querySelector("[data-student-page=overview]")'),
  );
  await go(
    "/experience",
    "[data-experience-ready=true][data-session-checked=true]",
  );
  const history = await send("Page.getNavigationHistory");
  await send("Page.navigateToHistoryEntry", {
    entryId: history.entries[history.currentIndex - 1].id,
  });
  check(
    "browser back restores only a verified student session",
    await wait(
      'location.pathname==="/user"&&document.querySelector("[data-student-ready=true]")',
    ),
  );
  await evaluate(
    'Array.from(document.querySelectorAll("aside button")).find(b=>b.textContent.includes("تسجيل الخروج")).click()',
  );
  check(
    "student logout clears actual session",
    await wait(
      '!localStorage.getItem("auth_token")&&location.pathname==="/experience"',
    ),
  );
  check(
    "logout revokes backend student token",
    (await call(api + "/profile", { headers: headers() })).status === 401,
  );
  await go("/diplomas/" + encodeURIComponent(primary.category.slug));
  await pause(1000);
  check(
    "anonymous public diploma remains usable and not falsely enrolled",
    await evaluate(
      'Boolean(document.querySelector("h1"))&&!document.body.innerText.includes("شاهد المقررات")',
    ),
  );
  await go(
    "/experience",
    "[data-experience-ready=true][data-session-checked=true]",
  );
  await click("#enter-student");
  check(
    "Journey G: actual student re-entry",
    await wait('document.querySelector("[data-student-page=overview]")'),
  );
  studentToken = await evaluate('localStorage.getItem("auth_token")');
  await go(
    "/experience",
    "[data-experience-ready=true][data-session-checked=true]",
  );
  await click("#enter-admin");
  check(
    "role switch requires confirmation",
    await wait(
      'Array.from(document.querySelectorAll("[aria-label]")).some(e=>e.getAttribute("aria-label")==="تأكيد تغيير الجلسة")',
    ),
  );
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="تأكيد تغيير الجلسة").click()',
  );
  check(
    "Journey H: real admin destination, no student workspace",
    await wait(
      'location.pathname==="/admin"&&!document.querySelector("[data-student-ready]")&&document.body.innerText.includes("لوحة التحكم الإدارية")',
    ),
  );
  const adminToken = await evaluate('localStorage.getItem("auth_token")');
  const adminHeaders = {
    Authorization: "Bearer " + adminToken,
    Accept: "application/json",
  };
  check(
    "role switch revokes old student token",
    (await call(api + "/profile", { headers: headers() })).status === 401,
  );
  check(
    "admin persona is confirmed by backend",
    (await call(api + "/profile", { headers: adminHeaders })).json().user
      .role === "admin",
  );
  check(
    "admin cannot download student private certificates",
    (
      await call(
        api +
          "/student/certificates/course/" +
          certificates.find((c) => c.type === "course").id +
          "/download",
        { headers: adminHeaders },
      )
    ).status === 403,
  );
  await capture("admin-switch-evidence", false);
  await evaluate(
    'localStorage.setItem("user_data", JSON.stringify({role:"student",name:"Forged student label"}))',
  );
  await go("/user");
  check(
    "forged local student label cannot authorize an admin student workspace",
    await wait(
      'location.pathname==="/experience"&&!document.querySelector("[data-student-ready]")',
    ),
  );
  await call(api + "/auth/logout", { method: "POST", headers: adminHeaders });
  await evaluate(
    'localStorage.setItem("auth_token","invalid-qa-fixture");localStorage.setItem("user_data",JSON.stringify({role:"student",name:"Forged"}))',
  );
  await go("/user");
  check(
    "invalid token cannot mount student workspace",
    await wait(
      'location.pathname==="/auth"&&!document.querySelector("[data-student-ready]")',
    ),
  );
  check("no browser runtime exceptions", errors.length === 0, { errors });
  for (const type of ["course", "diploma"]) {
    await viewport(1440);
    await send("Page.navigate", {
      url:
        "file:///" +
        resolve(output, type + "-certificate-http.pdf").replaceAll("\\", "/"),
    });
    await pause(1800);
    await capture(type + "-certificate-pdf-browser-preview", false);
  }
} catch (error) {
  reports.push({
    test: "browser execution",
    status: "FAIL",
    error: error.message,
  });
  console.error(error.message);
  process.exitCode = 1;
} finally {
  const after = audit();
  check(
    "learning DB records unchanged across all tested read-only journeys",
    JSON.stringify(before.learning_records) ===
      JSON.stringify(after.learning_records),
  );
  await writeFile(
    resolve(output, "read-only-after.json"),
    JSON.stringify(after, null, 2),
  );
  await writeFile(
    resolve(output, "browser-results.json"),
    JSON.stringify(
      {
        reports,
        summary: {
          pass: reports.filter((r) => r.status === "PASS").length,
          fail: reports.filter((r) => r.status === "FAIL").length,
        },
        requests,
        errors,
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
