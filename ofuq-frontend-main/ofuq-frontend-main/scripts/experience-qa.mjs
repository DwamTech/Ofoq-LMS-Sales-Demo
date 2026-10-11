import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { request as requestHTTP } from 'node:http'

// Fully consume local API responses. Avoid the installed Node 24 Undici parser
// assertion on large, unread responses from PHP's single-process dev server.
const completeHTTP=(url,options={})=>new Promise((accept,reject)=>{
  const request=requestHTTP(url,{method:options.method||'GET',headers:options.headers},response=>{
    const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>{
      const body=Buffer.concat(chunks).toString('utf8');const status=response.statusCode;
      accept({status,ok:status>=200&&status<300,json:async()=>JSON.parse(body),text:async()=>body});
    });response.on('error',reject);
  });request.on('error',reject);request.setTimeout(15000,()=>request.destroy(new Error('Local API timed out')));if(options.body)request.write(options.body);request.end();
})

const base = process.env.OFOQ_QA_URL || 'http://127.0.0.1:3004'
const debugPort = Number(process.env.OFOQ_QA_PORT || 9240)
const output = resolve('artifacts/phase04')
await mkdir(output, { recursive: true })
const profile = await mkdtemp(resolve(tmpdir(), 'ofoq-experience-qa-'))
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
  const recording=[];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if(message.method==='Page.screencastFrame'){
      recording.push({time:message.params.metadata.timestamp,image:message.params.data});
      socket.send(JSON.stringify({id:++id,method:'Page.screencastFrameAck',params:{sessionId:message.params.sessionId}}));
    }
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

  const check=(test,passed,details={})=>{reports.push({test,status:passed?'PASS':'FAIL',...details});console.log((passed?'PASS ':'FAIL ')+test)}
  const waitFor=async(expression)=>{for(let i=0;i<120;i++){if(await evaluate(`Boolean(${expression})`))return true;await pause(100)}return false}
  const api=process.env.OFOQ_QA_API || 'http://127.0.0.1:8000/api'
  const pressEnter=async()=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})}
  const gateway=async()=>{await send('Page.navigate',{url:base+'/experience'});await waitFor('document.querySelector("[data-experience-ready=true][data-session-checked=true]")');await evaluate('document.fonts.ready.then(()=>true)');await pause(100)}
  await viewport(1440)
  await navigate('/')
  check('marketing navigation CTA',await evaluate('document.querySelector("header a[class*=navAction]").getAttribute("href")==="/experience"'))
  await send('Page.startScreencast',{format:'jpeg',quality:65,maxWidth:1440,maxHeight:900,everyNthFrame:2});
  await send('Page.navigate',{url:base+'/experience'})
  await waitFor('Boolean(document.querySelector("[data-intro]"))')
  const initial=await evaluate('document.querySelector("[data-intro]").dataset.intro')
  await capture('intro-initial')
  reports.push({test:'captured intro initial phase',phase:initial,status:initial==='initial'?'PASS':'NOT TESTED'})
  await pause(300);await capture('intro-transition')
  await waitFor('document.querySelector("[data-intro]").dataset.intro==="ready"')
  check('intro completes without blocking choices',await evaluate('document.querySelectorAll("#experience-worlds button").length===2'))
  await pause(400);await send('Page.stopScreencast');
  if(recording.length>1){
    const start=recording[0].time;
    const frames=recording.map(frame=>({...frame,time:Math.round((frame.time-start)*1000)}));
    await writeFile(resolve(output,'intro-browser-recording.html'),'<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>أُفُق — تسجيل Chrome الفعلي</title><body style="margin:0;background:#29233b;color:#f6f4ed;font-family:Tahoma"><p style="padding:16px">تسجيل إطارات Chrome الفعلية — ليس نموذجًا مولدًا ولا فيديو MP4. <button id="play">إعادة العرض</button></p><img id="frame" alt="إطار مسجل من تجربة أُفُق" style="width:100%;max-width:1440px"><script>const frames='+JSON.stringify(frames)+';let timers=[];function play(){timers.forEach(clearTimeout);timers=frames.map(frame=>setTimeout(()=>document.getElementById("frame").src="data:image/jpeg;base64,"+frame.image,frame.time))}document.getElementById("play").onclick=play;play();</script></body></html>');
    check('real Chrome frame recording captured',true,{frames:frames.length,durationMs:frames.at(-1).time,format:'HTML player of actual CDP frames; not MP4'});
  }
  for(const width of [1920,1440,1280,768,390,360]){
    await viewport(width);await gateway();await pause(300)
    const size=await dimensions()
    check('experience responsive '+width,size.scrollWidth<=width,size)
    await capture('selection-'+width,true)
    if(width===1440){
      const metrics=await evaluate('({metrics:window.ofoqQAMetrics,heading:getComputedStyle(document.querySelector("h1")).fontFamily,body:getComputedStyle(document.querySelector("main")).fontFamily,rtl:getComputedStyle(document.querySelector("main")).direction})');
      const documentNode=(await send('DOM.getDocument')).root.nodeId;
      const fontEvidence=[];
      for(const selector of ['h1','main p']){
        const nodeId=(await send('DOM.querySelector',{nodeId:documentNode,selector})).nodeId;
        fontEvidence.push({selector,fonts:(await send('CSS.getPlatformFontsForNode',{nodeId})).fonts});
      }
      check('gateway fonts and RTL actually rendered',fontEvidence.every(item=>item.fonts.some(font=>font.isCustomFont&&font.glyphCount>0))&&metrics.rtl==='rtl',{...metrics,fontEvidence});
      check('gateway measured layout shift',metrics.metrics.layoutShift<=0.01,{layoutShift:metrics.metrics.layoutShift,lcpMs:metrics.metrics.lcpMs});
    }
    check('persona buttons touch target '+width,await evaluate('Array.from(document.querySelectorAll("#experience-worlds button")).every(e=>e.getBoundingClientRect().height>=44)'))
  }
  await viewport(1440);await gateway()
  check('session intro replay is intentional',await evaluate('document.querySelector("[data-intro]").dataset.intro==="ready"'))
  await evaluate('document.getElementById("enter-student").focus()');await capture('student-focus')
  await evaluate('document.getElementById("enter-admin").focus()');await capture('admin-focus')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await gateway()
  check('reduced motion ready',await evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches && document.querySelector("[data-intro]").dataset.intro==="ready"'))
  await capture('reduced-motion',true)
  await send('Emulation.setEmulatedMedia',{features:[]})
  for(const [route,tab] of [['/login_old','login'],['/register_old','signup']]){
    await send('Page.navigate',{url:base+route})
    check('legacy route '+route,await waitFor('location.pathname==="/auth" && location.search.includes('+JSON.stringify('tab='+tab)+') && Boolean(document.querySelector("form"))'))
    await pause(400);await capture('legacy-'+tab,true)
    check('legacy '+tab+' fields retained',await evaluate(tab==='signup'?'document.querySelectorAll("input[type=password]").length===2':'document.querySelectorAll("input[type=password]").length===1'))
  }
  await send('Page.navigate',{url:base+'/admin'})
  check('direct admin URL requires authentication',await waitFor('location.pathname==="/auth"'))
  await send('Page.navigate',{url:base+'/user'})
  check('direct student URL requires authentication',await waitFor('location.pathname==="/auth"'))
  await gateway()
  const forbidden=await completeHTTP(base+'/api/demo-entry',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({persona:'admin'})})
  check('cross-origin proxy denied',forbidden.status===403,{statusCode:forbidden.status})
  const invalid=await completeHTTP(base+'/api/demo-entry',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({persona:'supervisor'})})
  check('unknown persona proxy denied',invalid.status===422,{statusCode:invalid.status})
  const unsigned=await completeHTTP(api+'/demo/session',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({persona:'admin'})})
  check('unsigned Laravel request denied',unsigned.status===403,{statusCode:unsigned.status})
  await send('Network.enable')
  await send('Network.emulateNetworkConditions',{offline:false,latency:180,downloadThroughput:1500000,uploadThroughput:750000})
  await evaluate('document.getElementById("enter-student").focus()')
  await pressEnter()
  await waitFor('document.querySelector("[aria-busy=true]")!==null')
  await capture('student-login-transition')
  const studentReached=await waitFor('location.pathname==="/user" && Boolean(document.querySelector(".dashboard-container"))')
  check('student reaches protected destination',studentReached)
  if(!studentReached) throw new Error('Student authentication did not reach the authorized dashboard; screenshot is not authenticated evidence.')
  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1})
  await pause(1500);await capture('authenticated-student',true)
  const studentToken=await evaluate('localStorage.getItem("auth_token")')
  const studentResponse=await completeHTTP(api+'/profile',{headers:{Authorization:'Bearer '+studentToken}})
  const student=(await studentResponse.json()).user
  check('real authenticated student identity',studentResponse.ok&&student.role==='student'&&student.email==='student.demo@demo.ofoq.local',{identity:{name:student.name,role:student.role,id:student.id}})
  const denied=await completeHTTP(api+'/admin/courses',{headers:{Authorization:'Bearer '+studentToken,Accept:'application/json'}})
  check('student cannot read admin API',denied.status===403,{statusCode:denied.status})
  const myCourses=await completeHTTP(api+'/my-enrollments',{headers:{Authorization:'Bearer '+studentToken,Accept:'application/json'}})
  check('authenticated student enrollment GET',myCourses.ok,{statusCode:myCourses.status})
  await send('Page.reload',{ignoreCache:true})
  check('student refresh preserves valid session',await waitFor('Boolean(document.querySelector(".dashboard-container"))'))
  await gateway()
  const history=await send('Page.getNavigationHistory');
  const previousEntry=history.entries[history.currentIndex-1];
  await send('Page.navigateToHistoryEntry',{entryId:previousEntry.id});
  check('browser back restores verified student destination',await waitFor('location.pathname==="/user" && Boolean(document.querySelector(".dashboard-container"))'));
  await gateway()
  await evaluate('document.getElementById("enter-admin").click()')
  check('persona change requires confirmation',await waitFor('Boolean(document.querySelector("[aria-label=\\"تأكيد تغيير الجلسة\\"]"))'))
  await send('Network.emulateNetworkConditions',{offline:false,latency:180,downloadThroughput:1500000,uploadThroughput:750000})
  await evaluate('Array.from(document.querySelectorAll("button")).find(e=>e.textContent==="تأكيد تغيير الجلسة").click()')
  await waitFor('document.querySelector("[aria-busy=true]")!==null')
  await capture('admin-login-transition')
  const adminReached=await waitFor('location.pathname==="/admin" && document.body.innerText.includes("لوحة التحكم الإدارية")')
  check('admin reaches protected destination',adminReached)
  if(!adminReached) throw new Error('Admin authentication did not reach the authorized dashboard.')
  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1})
  await pause(1500);await capture('authenticated-admin',true)
  const adminToken=await evaluate('localStorage.getItem("auth_token")')
  const adminResponse=await completeHTTP(api+'/profile',{headers:{Authorization:'Bearer '+adminToken}})
  const admin=(await adminResponse.json()).user
  check('real authenticated admin identity',adminResponse.ok&&admin.role==='admin'&&admin.email==='admin.demo@demo.ofoq.local',{identity:{name:admin.name,role:admin.role,id:admin.id}})
  const previous=await completeHTTP(api+'/profile',{headers:{Authorization:'Bearer '+studentToken,Accept:'application/json'}})
  check('switch revoked previous student token',previous.status===401,{statusCode:previous.status})
  for(const path of ['/admin/courses','/admin/categories','/admin/stats/students']){
    const response=await completeHTTP(api+path,{headers:{Authorization:'Bearer '+adminToken,Accept:'application/json'}})
    check('authorized admin GET '+path,response.ok,{statusCode:response.status})
  }
  for(const path of ['/admin/backups','/admin/backups/private.sql/download','/admin/bunny/sync-logs','/external/certificates/pending']){
    const response=await completeHTTP(api+path,{headers:{Authorization:'Bearer '+adminToken,Accept:'application/json'}})
    check('sensitive demo API blocked '+path,response.status===403,{statusCode:response.status})
  }
  // Nonexistent resources: even a faulty guard cannot mutate real educational records.
  for(const [method,path] of [['POST','/courses/2147483647/enroll'],['POST','/lessons/2147483647/complete'],['POST','/quiz/2147483647/submit'],['PUT','/admin/courses/2147483647'],['DELETE','/admin/courses/2147483647']]){
    const response=await completeHTTP(api+path,{method,headers:{Authorization:'Bearer '+adminToken,Accept:'application/json','Content-Type':'application/json'},...(method==='DELETE'?{}:{body:'{}'})})
    const body=await response.json()
    check('actual demo mutation blocked '+method+' '+path,response.status===403&&body.code==='DEMO_READ_ONLY',{statusCode:response.status,code:body.code})
  }
  await send('Page.reload',{ignoreCache:true})
  check('admin refresh preserves valid session',await waitFor('document.body.innerText.includes("لوحة التحكم الإدارية")'))
  const adminProfile=await waitFor('document.querySelector(".profile-info")');
  if(!adminProfile) throw new Error('Existing admin profile control unavailable after refresh.');
  await evaluate('document.querySelector(".profile-info").click()')
  await waitFor('Boolean(document.querySelector(".profile-dropdown-item.logout"))')
  await evaluate('document.querySelector(".profile-dropdown-item.logout").click()')
  check('existing admin logout clears browser auth',await waitFor('!localStorage.getItem("auth_token") && !localStorage.getItem("user_data") && !localStorage.getItem("ofoq_demo_session")'))
  const revoked=await completeHTTP(api+'/profile',{headers:{Authorization:'Bearer '+adminToken,Accept:'application/json'}})
  check('logout revoked Sanctum token',revoked.status===401,{statusCode:revoked.status})
  await viewport(390);await gateway();
  await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await evaluate('document.getElementById("enter-student").scrollIntoView({block:"center"})');
  const touchPoint=await evaluate('(()=>{const r=document.getElementById("enter-student").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  check('mobile touch reaches real student dashboard',await waitFor('location.pathname==="/user" && Boolean(document.querySelector(".dashboard-container"))'));
  const touchToken=await evaluate('localStorage.getItem("auth_token")');
  const touchIdentity=await completeHTTP(api+'/profile',{headers:{Authorization:'Bearer '+touchToken,Accept:'application/json'}});
  check('mobile touch authenticated identity',touchIdentity.ok&&(await touchIdentity.json()).user.role==='student');
  await viewport(1440);
  await waitFor('document.querySelector(".sidebar-bottom button.bottom-link")');
  await evaluate('document.querySelector(".sidebar-bottom button.bottom-link").click()');
  check('existing student logout clears browser auth',await waitFor('location.pathname==="/auth" && !localStorage.getItem("auth_token") && !localStorage.getItem("ofoq_demo_session")'));
  const touchRevoked=await completeHTTP(api+'/profile',{headers:{Authorization:'Bearer '+touchToken,Accept:'application/json'}});
  check('student logout revoked Sanctum token',touchRevoked.status===401,{statusCode:touchRevoked.status});
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await gateway()
  await evaluate('localStorage.setItem("auth_token","expired-invalid-test-token");localStorage.setItem("user_data",JSON.stringify({id:1,role:"admin",name:"Forged local state"}))')
  await send('Page.navigate',{url:base+'/admin'})
  check('forged localStorage cannot authorize admin',await waitFor('location.pathname==="/auth" && !localStorage.getItem("auth_token")'))
  // A genuine request failure: intercept only this endpoint, not fake login success.
  await gateway()
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/demo-entry',requestStage:'Request'}]})
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Fetch.requestPaused')void send('Fetch.failRequest',{requestId:message.params.requestId,errorReason:'ConnectionFailed'})})
  await evaluate('document.getElementById("enter-student").click()')
  check('network failure has honest legacy fallback',await waitFor('Boolean(document.querySelector("[role=alert] a[href=\\"/login_old\\"]"))'))
  check('failed auth never navigates or stores token',await evaluate('location.pathname==="/experience" && !localStorage.getItem("auth_token")'))
  await capture('entry-network-failure',true)
  await send('Fetch.disable')
  await evaluate('sessionStorage.removeItem("ofoq_experience_intro")')
  await gateway()
  await evaluate('document.querySelector("button[class*=skip]")?.click()')
  await pause(300)
  check('intro skip stays complete',await evaluate('document.querySelector("[data-intro]").dataset.intro==="ready"'))
  check('runtime exceptions',errors.length===0,{errors})
  await writeFile(resolve(output,'browser-results.json'),JSON.stringify(reports,null,2))
  console.log(JSON.stringify(reports,null,2))
  if(reports.some(result=>result.status==='FAIL'))process.exitCode=1
  await send('Browser.close')
} catch(error) {
  reports.push({test:'QA run completion',status:'FAIL',reason:error.message})
  await writeFile(resolve(output,'browser-results.json'),JSON.stringify(reports,null,2))
  console.log(JSON.stringify(reports,null,2));process.exitCode=1
} finally {
  socket?.close();browser.kill()
  console.log('Actual screenshots: '+output)
}

