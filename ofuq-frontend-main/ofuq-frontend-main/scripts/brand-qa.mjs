import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {openBrowser} from './brand-browser.mjs';
const base='http://127.0.0.1:3004',api='http://127.0.0.1:8000/api',out=resolve('artifacts/mansatak');
await mkdir(out,{recursive:true});
const reports=[],screens=[];
const check=(test,pass,details={})=>{reports.push({test,status:pass?'PASS':'FAIL',...details});console.log((pass?'PASS ':'FAIL ')+test);};
const audit=()=>{const r=spawnSync('php',['artisan','demo:admin-read-audit'],{cwd:resolve('../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main'),env:{...process.env,DEMO_ENTRY_DATABASE:'ofoq_demo'},encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error('Demo isolation audit failed');return JSON.parse(r.stdout);};
const before=audit(),browser=await openBrowser(9253);
const visibleAudit=async label=>{
 const data=await browser.evaluate(`(()=>{const visible=e=>!!(e.getClientRects().length)&&getComputedStyle(e).visibility!=='hidden';const text=document.body.innerText;const names=[...document.querySelectorAll('[alt],[aria-label]')].filter(visible).map(e=>e.getAttribute('alt')||e.getAttribute('aria-label')).join(' ');const legacy=/\\b(?:OFOQ|OFUQ)\\b(?!-[A-Z]-\\d)|(?<![\\u0600-\\u06ff])(?:أُفُق|أفق|الأفق|افق)(?![\\u0600-\\u06ff])|Beyond the Horizon|A NEW HORIZON|YOUR LEARNING HORIZON/gi;return {old:(text+' '+names).match(legacy)||[],title:document.title,brand:text.includes('منصتك التعليمية')||names.includes('منصتك التعليمية'),overflow:document.documentElement.scrollWidth>innerWidth+2,logos:[...document.querySelectorAll('[data-brand-logo] svg')].filter(visible).map(e=>({name:e.getAttribute('aria-label'),paths:e.querySelectorAll('path').length,textNodes:e.querySelectorAll('text').length,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))};})()`);
 check(label+' visible brand and alternatives',data.brand&&data.old.length===0,data);
 check(label+' no page overflow',!data.overflow);
};
const capture=async(name,full=true)=>{const path=resolve(out,name+'.png');await browser.screenshot(path,full);screens.push(path);};
try{
 await browser.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.viewport(1440);await browser.go(base+'/');await browser.wait("document.querySelector('[data-public-hydrated=true]')");await visibleAudit('Homepage desktop');await capture('homepage-desktop');
 const rect=await browser.evaluate(`(()=>{const r=document.querySelector('#public-top [data-brand-logo]').getBoundingClientRect();return {x:r.x-10,y:r.y-10,width:r.width+20,height:r.height+20,scale:2};})()`);await browser.screenshot(resolve(out,'header-logo-closeup.png'),true,rect);screens.push(resolve(out,'header-logo-closeup.png'));
 await browser.evaluate('window.scrollTo(0,document.body.scrollHeight)');await browser.pause(200);await capture('footer',false);await browser.evaluate('window.scrollTo(0,0)');
 for(const width of [768,390,360]){await browser.viewport(width);await browser.go(base+'/');await browser.wait("document.querySelector('[data-public-hydrated=true]')");await visibleAudit('Homepage '+width);await capture('homepage-'+width);}
 await browser.evaluate(`document.querySelector('button[aria-controls="public-mobile-navigation"]').click()`);await browser.pause(200);check('Mobile public navigation opens',await browser.evaluate("!!document.querySelector('#public-mobile-navigation')"));await visibleAudit('Mobile navigation');await capture('mobile-navigation',false);await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});check('Mobile public navigation Escape',await browser.evaluate("!document.querySelector('#public-mobile-navigation')"));
 await browser.viewport(1440);
 for(const route of ['/about','/diploms','/courses','/community','/privacy','/terms','/verify-certificate','/auth','/auth?tab=signup']){await browser.go(base+route);await visibleAudit(route);if(route==='/auth')await capture('login');if(route.includes('signup'))await capture('registration');if(route==='/verify-certificate')await capture('certificate-verification');}
 await browser.viewport(390);await browser.go(base+'/auth');await visibleAudit('Login mobile');await capture('login-mobile');
 await browser.viewport(1440);await browser.go(base+'/experience');await browser.wait("document.querySelector('[data-session-checked=true]')");await visibleAudit('Experience gateway');await capture('experience-gateway');
 await browser.evaluate("document.querySelector('#enter-student').click()");await browser.wait("document.querySelector('[data-student-ready=true]')");await visibleAudit('Student dashboard desktop');await capture('student-desktop');
 await browser.viewport(390);await browser.pause(200);await visibleAudit('Student dashboard mobile');await capture('student-mobile');
 await browser.go(base+'/user/my-certificates');await browser.wait("document.querySelector('[data-certificate-type]')");await visibleAudit('Student certificates');await capture('student-certificates');
 const studentToken=await browser.evaluate('localStorage.getItem("auth_token")');
 const headers={Authorization:'Bearer '+studentToken,Accept:'application/json'};
 const certs=await(await fetch(api+'/my-certificates',{headers})).json();
 for(const cert of certs.certificates.filter(c=>['completed','issued'].includes(c.status))){
   const response=await fetch(api+`/student/certificates/${cert.source}/${cert.id}/download`,{headers});const bytes=Buffer.from(await response.arrayBuffer());const previous=await readFile(resolve('artifacts/phase06',`${cert.source}-existing-certificate.pdf`));
   check('Historical '+cert.source+' PDF unchanged and downloadable',response.status===200&&response.headers.get('content-type')?.includes('application/pdf')&&bytes.subarray(0,5).toString()==='%PDF-'&&createHash('sha256').update(bytes).digest('hex')===createHash('sha256').update(previous).digest('hex'),{bytes:bytes.length});
   const verification=await(await fetch(api+'/public/verify-certificate?serial_number='+encodeURIComponent(cert.serial_number))).json();check('Historical '+cert.source+' verification still resolves',verification.valid===true&&verification.data.student_name==='ليان أحمد الكيلاني');
 }
 await browser.go(base+'/experience');await browser.wait("document.querySelector('[data-session-checked=true]')");await browser.evaluate("document.querySelector('#enter-admin').click()");await browser.wait("document.querySelector('[role=group][aria-label]')");await browser.evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('تأكيد تغيير الجلسة')).click()`);await browser.wait("document.querySelector('[data-admin-ready=true]')");check('Secure gateway role switch reaches real admin',true);await visibleAudit('Admin dashboard mobile');await capture('admin-mobile');
 await browser.viewport(1440);await browser.pause(200);await visibleAudit('Admin dashboard desktop');await capture('admin-desktop');
 for(const route of ['/admin/diplomas','/admin/course-management','/admin/students','/admin/exams','/admin/certificates','/admin/reports']){await browser.go(base+route);await browser.wait("document.querySelector('[data-admin-ready=true]')");await browser.pause(500);await visibleAudit(route);await capture(route.replaceAll('/','-').slice(1));}
 await browser.evaluate("document.querySelector('[data-admin-logout]').click()");await browser.wait("location.pathname==='/experience'");check('Actual admin logout clears authentication',await browser.evaluate("!localStorage.getItem('auth_token')&&!localStorage.getItem('user_data')"));
 // Asset review is an actual browser rendering of shipped files, not an application route.
 const assets=async name=>'data:image/svg+xml;base64,'+Buffer.from(await readFile(resolve('public/brand',name),'utf8')).toString('base64');
 const favicon='data:image/x-icon;base64,'+Buffer.from(await readFile('public/favicon.ico')).toString('base64');
 const rows=[];for(const theme of ['light','dark','mono']){const images=[];for(const kind of ['primary','compact','icon'])images.push(`<img alt="منصتك التعليمية" src="${await assets(`mansatak-${kind}-${theme}.svg`)}" style="width:${kind==='primary'?360:kind==='compact'?186:64}px;max-width:100%">`);rows.push(`<section style="display:flex;align-items:center;justify-content:space-around;gap:30px;padding:50px;background:${theme==='dark'?'#29233b':'#f6f4ed'}">${images.join('')}</section>`);}
 rows.push(`<section style="display:flex;gap:40px;padding:45px;background:white">${[16,24,32,48].map(size=>`<figure><img alt="منصتك التعليمية" src="${favicon}" style="width:${size}px;height:${size}px"><figcaption>${size}px</figcaption></figure>`).join('')}</section>`);
 const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>منصتك التعليمية</title></head><body style="margin:0">${rows.join('')}</body></html>`;
 await writeFile(resolve(out,'logo-review.html'),html);await browser.viewport(1200,900);await browser.go('data:text/html;base64,'+Buffer.from(html).toString('base64'));await browser.screenshot(resolve(out,'logo-family.png'),false,{x:0,y:0,width:1200,height:684,scale:1});screens.push(resolve(out,'logo-family.png'));check('Logo variants and favicon assets decode',await browser.evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
 await browser.viewport(900,220);await browser.go('data:text/html;base64,'+Buffer.from(`<!doctype html><body style="margin:0;display:grid;place-items:center;height:220px;background:#f6f4ed"><img alt="منصتك التعليمية" width="600" src="${await assets('mansatak-primary-light.svg')}">`).toString('base64'));await capture('logo-light',false);
 await browser.go('data:text/html;base64,'+Buffer.from(`<!doctype html><body style="margin:0;display:grid;place-items:center;height:220px;background:#29233b"><img alt="منصتك التعليمية" width="600" src="${await assets('mansatak-primary-dark.svg')}">`).toString('base64'));await capture('logo-dark',false);
 await browser.viewport(512,200);await browser.go('data:text/html;base64,'+Buffer.from(`<!doctype html><body style="display:flex;align-items:center;gap:40px;background:#f6f4ed">${[16,24,32,48].map(size=>`<figure><img alt="منصتك التعليمية" src="${favicon}" width="${size}" height="${size}"><figcaption>${size}px</figcaption></figure>`).join('')}`).toString('base64'));await capture('favicon-preview',false);
 check('No runtime or hydration exceptions',browser.errors.length===0,{errors:browser.errors});
 const baseline=JSON.parse(await readFile(resolve(out,'baseline.json'),'utf8'));const after=audit();check('38 domain tables unchanged since branding baseline',JSON.stringify(baseline.domain)===JSON.stringify(after)&&JSON.stringify(before)===JSON.stringify(after));
 await writeFile(resolve(out,'domain-after.json'),JSON.stringify(after,null,2));
}catch(error){check('Brand browser execution',false,{error:error.message});}finally{
 browser.close();await writeFile(resolve(out,'browser-results.json'),JSON.stringify({reports,screens,summary:{pass:reports.filter(r=>r.status==='PASS').length,fail:reports.filter(r=>r.status==='FAIL').length}},null,2));if(reports.some(r=>r.status==='FAIL'))process.exitCode=1;
}
