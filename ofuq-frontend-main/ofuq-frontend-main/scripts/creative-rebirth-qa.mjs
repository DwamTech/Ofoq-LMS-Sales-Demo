import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const base = process.env.OFOQ_QA_URL || 'http://127.0.0.1:3004'
const debugPort = Number(process.env.OFOQ_QA_PORT || 9240)
const output = resolve(process.env.OFOQ_QA_OUTPUT || 'artifacts/creative-rebirth')
await mkdir(output, { recursive: true })
const profile = await mkdtemp(resolve(tmpdir(), 'ofoq-creative-qa-'))
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--disable-extensions', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const pause = (ms) => new Promise((done) => setTimeout(done, ms))
const reports = []
let socket
try {
  let target
  for (let i = 0; i < 30; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find((item) => item.type === 'page'); if (target) break } catch {}
    await pause(200)
  }
  if (!target) throw new Error('Chrome debugging target unavailable')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  const pending = new Map()
  const errors = []
  let id = 0
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    const task = pending.get(message.id)
    if (task) { pending.delete(message.id); message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result) }
  }
  await new Promise((done) => { socket.onopen = done })
  const send = (method, params = {}) => new Promise((accept, reject) => { const messageId = ++id; pending.set(messageId, { resolve: accept, reject }); socket.send(JSON.stringify({ id: messageId, method, params })) })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  await send('Page.enable')
  await send('Runtime.enable')
  await send('DOM.enable')
  await send('CSS.enable')
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.ofoqQAMetrics={layoutShift:0,lcpMs:null}; try {new PerformanceObserver(list=>{for(const e of list.getEntries()) if(!e.hadRecentInput) window.ofoqQAMetrics.layoutShift+=e.value}).observe({type:'layout-shift',buffered:true}); new PerformanceObserver(list=>{for(const e of list.getEntries())window.ofoqQAMetrics.lcpMs=Math.round(e.startTime)}).observe({type:'largest-contentful-paint',buffered:true})}catch{}`})
  const viewport = async (width, height = 900) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640, screenWidth: width, screenHeight: height })
  const navigate = async (path) => {
    await send('Page.navigate', { url: base + path })
    for (let i = 0; i < 70; i++) { if (await evaluate(`document.readyState === 'complete' && decodeURI(location.pathname) === ${JSON.stringify(path === '/search' ? '/diploms' : path.split('?')[0])}`)) break; await pause(200) }
    for (let i = 0; i < 50; i++) { if (await evaluate('Boolean(document.querySelector("[data-public-hydrated=true]"))')) break; await pause(200) }
    await evaluate('document.fonts.ready.then(() => true)')
    await pause(1100)
  }
  const capture = async (name, full = false, selector) => {
    const params = { format: 'png', captureBeyondViewport: full }
    if (selector) {
      const box = await evaluate(`(() => {const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:Math.max(0,r.x + scrollX),y:r.y + scrollY,width:r.width,height:r.height,scale:1}})()`)
      params.clip = box; params.captureBeyondViewport = true
    } else if (full) {
      const dimensions = await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})')
      params.clip = { x: 0, y: 0, ...dimensions, scale: 1 }
    }
    const shot = await send('Page.captureScreenshot', params)
    await writeFile(resolve(output, name + '.png'), Buffer.from(shot.data, 'base64'))
  }
  const dimensions = async () => evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})')
  if (process.env.OFOQ_QA_KEYBOARD) {
    for(const width of [1440,768,390,360]) {
      await viewport(width)
      await navigate('/courses')
      const href=await evaluate(`document.querySelector(${JSON.stringify('a[href^="/course-details/"]')})?.getAttribute('href')`)
      await navigate(href)
      await send('Page.bringToFront')
      await evaluate('document.querySelector(".dropdown-header").focus()')
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13})
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
      await pause(200)
      const state=await evaluate('({expanded:document.querySelector(".dropdown-header").getAttribute("aria-expanded"),focus:document.activeElement.className})')
      reports.push({test:'native keyboard collapse '+width,...state,status:state.expanded==='false'?'PASS':'FAIL'})
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13})
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
      await pause(200)
      reports.push({test:'native keyboard expand '+width,status:await evaluate('document.querySelector(".dropdown-header").getAttribute("aria-expanded")==="true"')?'PASS':'FAIL'})
    }
  } else if (process.env.OFOQ_QA_QUICK) {
    await viewport(1440)
    await navigate('/courses')
    const href = await evaluate(`document.querySelector(${JSON.stringify('a[href^="/course-details/"]')})?.getAttribute('href')`)
    if (href) {
      await navigate(href)
      await capture('page-course-detail',true)
      await viewport(390)
      await navigate(href)
      const metrics=await dimensions()
      reports.push({test:'course detail mobile',...metrics,status:metrics.scrollWidth<=390?'PASS':'FAIL'})
      await capture('page-course-detail-mobile',true)
    } else reports.push({test:'course detail link',status:'FAIL'})
    await viewport(1440)
    await navigate('/search')
    reports.push({test:'existing search browser redirect',status:await evaluate('location.pathname==="/diploms"')?'PASS':'FAIL'})
    await navigate('/')
    await evaluate(`document.querySelector(${JSON.stringify('header nav a[href="/about"]')}).click()`)
    for(let i=0;i<40;i++){if(await evaluate('location.pathname==="/about"'))break;await pause(100)}
    reports.push({test:'Next client navigation about',status:await evaluate('location.pathname==="/about"')?'PASS':'FAIL'})
    await evaluate(`document.querySelector(${JSON.stringify('header a[href="/"]')}).click()`)
    for(let i=0;i<40;i++){if(await evaluate('Boolean(document.getElementById("journey"))'))break;await pause(100)}
    await evaluate('document.getElementById("journey").scrollIntoView()')
    await pause(600)
    reports.push({test:'sticky after client navigation',status:await evaluate('document.querySelectorAll("[data-story-state]").length===1&&Math.abs(document.querySelector("[data-story-state]").getBoundingClientRect().top)<2')?'PASS':'FAIL'})
    await capture('client-navigation-story')
  } else {
  for (const width of [1920, 1440, 1280, 768, 390, 360]) {
    await viewport(width)
    await navigate('/')
    const metrics = await dimensions()
    reports.push({ test: 'responsive', width, ...metrics, status: metrics.scrollWidth <= width ? 'PASS' : 'FAIL' })
    if ([1440, 768, 390].includes(width)) {
      await evaluate('document.getElementById("product").scrollIntoView()')
      await pause(800)
      await evaluate('window.scrollTo(0,0)')
      await pause(700)
      await capture(`home-${width}-full`, true); await capture(`home-${width}-hero`)
      reports.push({test:'observed browser performance (local, cached, not Lighthouse)',width,...await evaluate('window.ofoqQAMetrics')})
    }
    if (width === 390) {
      await evaluate('document.querySelector("button[aria-controls=public-mobile-navigation]").click()')
      await pause(250)
      const visible = await evaluate('Boolean(document.getElementById("public-mobile-navigation"))')
      reports.push({ test: 'mobile navigation', status: visible ? 'PASS' : 'FAIL' })
      await capture('mobile-navigation')
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
      await pause(100)
      reports.push({test:'mobile Escape',status:await evaluate('!document.getElementById("public-mobile-navigation")')?'PASS':'FAIL'})
    }
    if (width < 860) reports.push({test:'mobile story fallback',width,status:await evaluate('getComputedStyle(document.querySelector("[class*=mobileJourney]")).display !== "none" && document.querySelectorAll("[class*=mobileJourney] article").length === 5')?'PASS':'FAIL'})
  }
  await viewport(1440)
  await navigate('/')
  const documentNode = (await send('DOM.getDocument')).root.nodeId
  for (const [selector, expected] of [['#hero-title','Alexandria'], ['[class*=heroCopy] > p','IBM Plex Sans Arabic']]) {
    const node = await send('DOM.querySelector',{nodeId:documentNode,selector})
    const fonts = (await send('CSS.getPlatformFontsForNode',{nodeId:node.nodeId})).fonts
    reports.push({test:'actual rendered font',selector,fonts,status:fonts.some(font=>font.familyName.includes(expected)&&font.isCustomFont&&font.glyphCount>0)?'PASS':'FAIL'})
  }
  reports.push({test:'resource observations (local browser, not benchmark)',resources:await evaluate('performance.getEntriesByType("resource").filter(r=>/woff2/.test(r.name)).map(r=>({name:r.name.split("/").pop(),transferSize:r.transferSize,durationMs:Math.round(r.duration)}))')})
  const storyBounds = await evaluate('(() => { const e=document.getElementById("journey"); return {top:e.getBoundingClientRect().top+scrollY,range:e.offsetHeight-innerHeight} })()')
  for (const [name, progress, expected] of [['start', .02, 0], ['middle', .45, 2], ['final', .95, 4], ['reverse', .23, 1], ['fast-end', .98, 4], ['fast-start', .02, 0]]) {
    await evaluate(`window.scrollTo(0,${storyBounds.top + storyBounds.range * progress})`)
    await pause(650)
    const actual = await evaluate('Number(document.querySelector("[data-story-state]").dataset.storyState)')
    const top = await evaluate('document.querySelector("[data-story-state]").getBoundingClientRect().top')
    reports.push({ test: 'scroll ' + name, actual, expected, canvasTop: top, status: actual === expected && Math.abs(top) < 2 ? 'PASS' : 'FAIL' })
    await capture('scroll-' + name)
  }
  await evaluate('document.getElementById("product").scrollIntoView()')
  await pause(400)
  await capture('product-admin', false, '#product')
  await evaluate('document.getElementById("preview-student").click()')
  await pause(600)
  const student = await evaluate('document.getElementById("product-preview").querySelector("[data-perspective]").dataset.perspective')
  reports.push({ test: 'student tab', status: student === 'student' ? 'PASS' : 'FAIL' })
  await capture('product-student', false, '#product')
  await evaluate('document.getElementById("preview-student").focus()')
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home'})
  await pause(600)
  reports.push({test:'product tabs keyboard',status:await evaluate('document.getElementById("preview-admin").getAttribute("aria-selected")==="true" && document.activeElement.id === "preview-admin"')?'PASS':'FAIL'})
  await evaluate('document.querySelector("#capabilities details:nth-child(2) summary").click()')
  reports.push({test:'capability disclosure',status:await evaluate('document.querySelector("#capabilities details:nth-child(2)").open')?'PASS':'FAIL'})
  await capture('real-programs', false, '#programs')
  await capture('final-cta', false, 'section[class*=closing]')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await navigate('/')
  const reduced = await evaluate('({reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,position:getComputedStyle(document.querySelector("[data-story-state]")).position})')
  reports.push({ test: 'reduced motion', ...reduced, status: reduced.reduced && reduced.position !== 'sticky' ? 'PASS' : 'FAIL' })
  await evaluate('document.querySelector("[class*=storySteps] li:last-child button").click()')
  await pause(500)
  reports.push({test:'reduced story selector',status:await evaluate('document.querySelector("[data-story-state]").dataset.storyState === "4"')?'PASS':'FAIL'})
  await capture('reduced-motion-full', true)
  await send('Emulation.setEmulatedMedia', { features: [] })
  for (const route of ['/about', '/courses', '/diploms', '/community', '/verify-certificate']) {
    await navigate(route)
    reports.push({ test: 'public page ' + route, ...(await dimensions()), title: await evaluate('document.title') })
    await capture('page-' + route.slice(1), true)
    await viewport(390)
    await navigate(route)
    const mobileMetrics = await dimensions()
    reports.push({test:'supporting page mobile '+route,...mobileMetrics,status:mobileMetrics.scrollWidth<=390?'PASS':'FAIL'})
    await capture('page-'+route.slice(1)+'-mobile',true)
    await viewport(1440)
  }
  await navigate('/diploms')
  await evaluate('document.getElementById("catalog-search").focus()')
  await send('Input.insertText',{text:'Python'})
  await pause(1000)
  const matched = await evaluate('Array.from(document.querySelectorAll("a[data-id]")).map(e=>e.textContent)')
  reports.push({test:'catalog live search',matchedCount:matched.length,status:matched.length===1&&matched[0].includes('Python')?'PASS':'FAIL'})
  await navigate('/diploms')
  const detail = await evaluate(`document.querySelector(${JSON.stringify('a[href^="/diplomas/"]')})?.getAttribute("href")`)
  reports.push({test:'genuine catalog detail link',detail,status:detail?'PASS':'FAIL'})
  if (detail) {
    await navigate(detail)
    await capture('page-diploma-detail',true)
    await viewport(390)
    await navigate(detail)
    const metrics=await dimensions()
    reports.push({test:'diploma detail mobile',...metrics,status:metrics.scrollWidth<=390?'PASS':'FAIL'})
    await capture('page-diploma-detail-mobile',true)
  }
  await viewport(1440)
  await navigate('/')
  await evaluate('document.getElementById("journey").scrollIntoView()')
  await pause(500)
  reports.push({test:'story navigation lifecycle',status:await evaluate('document.querySelectorAll("[data-story-state]").length===1 && Math.abs(document.querySelector("[data-story-state]").getBoundingClientRect().top)<2')?'PASS':'FAIL'})
  }
  if (process.env.OFOQ_QA_POLISH) {
    await viewport(1440)
    await navigate('/courses')
    const courseHref = await evaluate(`document.querySelector(${JSON.stringify('a[href^="/course-details/"]')})?.getAttribute('href')`)
    await navigate('/diploms')
    const diplomaHref = await evaluate(`document.querySelector(${JSON.stringify('a[href^="/diplomas/"]')})?.getAttribute('href')`)
    for (const width of [1440, 768, 390, 360]) {
      await viewport(width)
      for (const [name, route] of [['course',courseHref],['diploma',diplomaHref],['courses','/courses'],['diploms','/diploms'],['community','/community']]) {
        if (!route) { reports.push({test:name+' route exists',status:'FAIL'}); continue }
        await navigate(route)
        const metrics=await dimensions()
        const copy=await evaluate('document.querySelector("main")?.innerText || document.body.innerText')
        reports.push({test:`polish ${name} ${width} overflow`,...metrics,status:metrics.scrollWidth<=width?'PASS':'FAIL'})
        reports.push({test:`polish ${name} ${width} claims`,status:/OFOQ Sales Demo dataset|Seeder|Test data|Placeholder|Mock data|شهادة معتمدة|ضمان استرداد المال/i.test(copy)?'FAIL':'PASS'})
        reports.push({test:`polish ${name} ${width} contact`,status:await evaluate(`Boolean(document.querySelector(${JSON.stringify('footer a[href^="https://wa.me/201555855857"]')})) && !document.querySelector('[class*=SocialMediaFloat]')`)?'PASS':'FAIL'})
        await capture(`final-${name}-${width}`,true)
        if(name==='course') {
          reports.push({test:`course ${width} honest media`,status:await evaluate('!document.querySelector("video[src*=sample-video]")')?'PASS':'FAIL'})
          const label=await evaluate('document.querySelector(".register-button")?.textContent')
          reports.push({test:`course ${width} anonymous CTA`,label,status:label?.includes('سجّل الدخول')?'PASS':'FAIL'})
          await evaluate('document.querySelector(".dropdown-header")?.click()')
          reports.push({test:`course ${width} accordion collapse`,status:await evaluate('document.querySelector(".dropdown-header")?.getAttribute("aria-expanded")==="false"')?'PASS':'FAIL'})
          await evaluate('document.querySelector(".dropdown-header")?.focus()')
          await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13})
          await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
          await pause(150)
          reports.push({test:`course ${width} accordion keyboard`,status:await evaluate('document.querySelector(".dropdown-header")?.getAttribute("aria-expanded")==="true"')?'PASS':'FAIL'})
        }
        if(name==='community') {
          reports.push({test:`community ${width} unavailable`,status:copy.includes('الفيديو غير متاح حاليًا')?'PASS':'FAIL'})
        }
      }
    }
    await viewport(1440)
    await navigate(courseHref)
    await evaluate('document.querySelector(".register-button").click()')
    await pause(1200)
    reports.push({test:'actual anonymous course CTA destination',status:await evaluate('location.pathname==="/auth"')?'PASS':'FAIL'})
    await navigate(diplomaHref)
    await evaluate('document.querySelector("button[class*=enrollButtonSecondary]").click()')
    await pause(1200)
    reports.push({test:'actual anonymous diploma CTA destination',status:await evaluate('location.pathname==="/auth"')?'PASS':'FAIL'})
    const catalogJSON=await (await fetch((process.env.OFOQ_QA_API || 'http://127.0.0.1:8000/api')+'/allCourses')).json()
    const catalog=Array.isArray(catalogJSON)?catalogJSON:(catalogJSON.data?.data || catalogJSON.data || [])
    for (const [kind,record] of [['free',catalog.find(c=>c.is_free || Number(c.price)===0)],['paid',catalog.find(c=>!c.is_free && Number(c.price)>0)]]) {
      if(!record) {reports.push({test:kind+' course available',status:'FAIL'});continue}
      await navigate('/course-details/'+record.id)
      reports.push({test:kind+' course truthful price and refund',status:await evaluate(`document.querySelector('.current-price')?.textContent.includes(${JSON.stringify(kind==='free'?'مجاني':new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(record.price)))}) && !document.body.innerText.includes('ضمان استرداد المال')`)?'PASS':'FAIL'})
      await capture('final-course-'+kind+'-desktop',true)
    }
    await navigate('/')
    const bounds=await evaluate('(()=>{const e=document.getElementById("journey");return {top:e.offsetTop,range:e.offsetHeight-innerHeight}})()')
    for(let step=0;step<=20;step++) { await evaluate(`scrollTo(0,${bounds.top+bounds.range*step/20})`);await pause(80) }
    await pause(500)
    reports.push({test:'slow scroll story final',status:await evaluate('document.querySelector("[data-story-state]").dataset.storyState==="4"')?'PASS':'FAIL'})
    await evaluate('scrollTo(0,0)');await pause(250)
    await evaluate(`scrollTo(0,${bounds.top+bounds.range*.45})`);await pause(500)
    reports.push({test:'story re-entry',status:await evaluate('document.querySelector("[data-story-state]").dataset.storyState==="2"')?'PASS':'FAIL'})
    await viewport(390);await pause(300);await viewport(1440);await pause(600)
    reports.push({test:'story resize visibility',status:await evaluate('document.querySelector("[data-story-state]").getBoundingClientRect().height>0')?'PASS':'FAIL'})
    const history=await send('Page.getNavigationHistory')
    const homeHistoryId=history.entries[history.currentIndex].id
    await evaluate(`document.querySelector(${JSON.stringify('header nav a[href="/about"]')}).click()`)
    await pause(1200)
    await send('Page.navigateToHistoryEntry',{entryId:homeHistoryId})
    await pause(1500)
    reports.push({test:'browser back homepage remount',status:await evaluate('location.pathname==="/" && document.querySelectorAll("[data-story-state]").length===1')?'PASS':'FAIL'})
    await evaluate('document.getElementById("product").scrollIntoView()')
    await pause(300)
    const tabY=await evaluate('scrollY')
    await evaluate('document.getElementById("preview-student").click()')
    await pause(500)
    reports.push({test:'tab switch retains scroll position',status:await evaluate(`Math.abs(scrollY-${tabY})<3 && document.getElementById('preview-student').getAttribute('aria-selected')==='true'`)?'PASS':'FAIL'})
    await viewport(390)
    await navigate('/')
    await evaluate('document.getElementById("journey").scrollIntoView()')
    await pause(300)
    reports.push({test:'mobile scroll narrative visibility',status:await evaluate('Array.from(document.querySelectorAll("[class*=mobileJourney] article")).every(e=>getComputedStyle(e).opacity!=="0"&&e.getBoundingClientRect().height>0)')?'PASS':'FAIL'})
    await capture('final-home-mobile-story',true)
  }
  reports.push({ test: 'runtime exceptions', errors, status: errors.length ? 'FAIL' : 'PASS' })
  await writeFile(resolve(output, process.env.OFOQ_QA_KEYBOARD ? 'keyboard-browser-results.json' : process.env.OFOQ_QA_QUICK ? 'additional-browser-results.json' : 'browser-results.json'), JSON.stringify(reports, null, 2))
  if(reports.some(report=>report.status==='FAIL')) process.exitCode=1
  console.log(JSON.stringify(reports, null, 2))
  await send('Browser.close')
} finally {
  socket?.close()
  browser.kill()
  console.log('Screenshots: ' + output)
  console.log('Temporary browser profile: ' + profile)
}
