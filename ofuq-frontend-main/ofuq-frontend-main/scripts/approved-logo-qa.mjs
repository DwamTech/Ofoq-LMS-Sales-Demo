import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { openBrowser } from './brand-browser.mjs';
const base='http://127.0.0.1:3004', api='http://127.0.0.1:8000/api', out=resolve('artifacts/mansatak-approved');
await mkdir(out,{recursive:true});
const reports=[],screens=[];
const check=(test,pass,details={})=>{reports.push({test,status:pass?'PASS':'FAIL',...details});console.log((pass?'PASS ':'FAIL ')+test);};
const audit=()=>{const r=spawnSync('php',['artisan','demo:admin-read-audit'],{cwd:resolve('../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main'),env:{...process.env,DEMO_ENTRY_DATABASE:'ofoq_demo'},encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error('Verified local/demo audit unavailable');return JSON.parse(r.stdout);};
const before=audit(),browser=await openBrowser(9262);
const visual=async (label,requireLogo=true)=>{
 const data=await browser.evaluate(`(()=>{const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';const names=[...document.querySelectorAll('[alt],[aria-label]')].filter(visible).map(e=>e.getAttribute('alt')||e.getAttribute('aria-label')).join(' ');const old=/\\b(?:OFOQ|OFUQ)\\b(?!-[A-Z]-\\d)|(?<![\\u0600-\\u06ff])(?:أُفُق|أفق|الأفق|افق)(?![\\u0600-\\u06ff])|Beyond the Horizon/gi;const logos=[...document.querySelectorAll('[data-brand-logo]')].filter(visible);return{old:(document.body.innerText+' '+names).match(old)||[],overflow:document.documentElement.scrollWidth>innerWidth+2,logos:logos.map(e=>({theme:e.dataset.brandLogoTheme,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,name:e.getAttribute('aria-label'),filter:getComputedStyle(e.querySelector('img')).filter,ink:getComputedStyle(e).color,loaded:e.querySelector('img').naturalWidth===1958,vector:!!e.querySelector('svg')})),mask:CSS.supports('mask-image','url(x.png)')||CSS.supports('-webkit-mask-image','url(x.png)'),rtl:document.documentElement.dir==='rtl'};})()`);
 check(label+' approved artwork, RTL and alternatives',(!requireLogo||data.logos.length>0)&&data.logos.every(l=>l.loaded&&!l.vector)&&data.mask&&data.rtl&&data.old.length===0,{...data,requireLogo});
 check(label+' no horizontal page overflow',!data.overflow);
 return data;
};
const capture=async(name,full=true)=>{const path=resolve(out,name+'.png');await browser.screenshot(path,full);screens.push(path);};
try{
 await browser.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const width of [1440,768,390,360]){
  await browser.viewport(width);await browser.go(base+'/');await browser.wait("document.querySelector('[data-public-hydrated=true]')");await browser.wait("[...document.querySelectorAll('[data-brand-logo] img')].every(i=>i.complete&&i.naturalWidth)");await visual('Homepage '+width);await capture('homepage-'+width);
  await capture('homepage-'+width+'-viewport',false);
  if(width===1440){const clip=await browser.evaluate(`(()=>{const r=document.querySelector('#public-top [data-brand-logo]').getBoundingClientRect();return{x:r.x-12,y:r.y-12,width:r.width+24,height:r.height+24,scale:3};})()`);await browser.screenshot(resolve(out,'header-logo-closeup.png'),true,clip);await browser.evaluate('window.scrollTo(0,document.body.scrollHeight)');await browser.pause(150);await capture('footer',false);}
 }
 await browser.evaluate(`document.querySelector('button[aria-controls="public-mobile-navigation"]').click()`);await browser.pause(150);check('Mobile menu opens',await browser.evaluate("!!document.querySelector('#public-mobile-navigation')"));await capture('mobile-navigation',false);await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});check('Mobile menu Escape closes',await browser.evaluate("!document.querySelector('#public-mobile-navigation')"));
 await browser.viewport(1440);await browser.go(base+'/auth');await visual('Login');await capture('login');
 await browser.viewport(390);await browser.go(base+'/auth');await visual('Login mobile');await capture('login-mobile');
 await browser.viewport(1440);await browser.go(base+'/experience');await browser.wait("document.querySelector('[data-session-checked=true]')");await visual('Experience gateway');await capture('experience-gateway');
 await browser.evaluate("document.querySelector('#enter-student').click()");await browser.wait("document.querySelector('[data-student-ready=true]')");await visual('Student desktop');await capture('student-desktop');
 await browser.viewport(390);await browser.pause(150);await visual('Student mobile',false);await capture('student-mobile');
 await browser.evaluate(`document.querySelector('button[aria-controls="student-mobile-nav"]').click()`);check('Student mobile navigation opens',await browser.evaluate("!!document.querySelector('#student-mobile-nav')"));await capture('student-mobile-menu',false);await browser.evaluate(`document.querySelector('button[aria-controls="student-mobile-nav"]').click()`);
 await browser.go(base+'/user/my-certificates');await browser.wait("document.querySelector('[data-certificate-type]')");await visual('Certificates interface');await capture('student-certificates');
 const token=await browser.evaluate('localStorage.getItem("auth_token")');
 const headers={Authorization:'Bearer '+token,Accept:'application/json'};
 const certificates=await(await fetch(api+'/my-certificates',{headers})).json();
 for(const certificate of certificates.certificates.filter(c=>['issued','completed'].includes(c.status))){
  const response=await fetch(api+`/student/certificates/${certificate.source}/${certificate.id}/download`,{headers});const bytes=Buffer.from(await response.arrayBuffer());const previous=await readFile(resolve('artifacts/phase06',certificate.source+'-existing-certificate.pdf'));
  check('Historical '+certificate.source+' PDF unchanged',response.ok&&response.headers.get('content-type')?.includes('application/pdf')&&bytes.subarray(0,5).toString()==='%PDF-'&&createHash('sha256').update(bytes).digest('hex')===createHash('sha256').update(previous).digest('hex'),{bytes:bytes.length});
 }
 await browser.go(base+'/experience');await browser.wait("document.querySelector('[data-session-checked=true]')");await browser.evaluate("document.querySelector('#enter-admin').click()");await browser.wait("document.querySelector('[role=group][aria-label]')");await browser.evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('تأكيد تغيير الجلسة')).click()`);await browser.wait("document.querySelector('[data-admin-ready=true]')");await visual('Admin mobile');await capture('admin-mobile');
 await browser.viewport(1440);await browser.pause(150);const admin=await visual('Admin desktop');check('Both dark admin marks are reversed',admin.logos.length>=2&&admin.logos.every(l=>l.filter.includes('invert(1)')));await capture('admin-desktop');
 await browser.evaluate("document.querySelector('[data-admin-logout]').click()");await browser.wait("location.pathname==='/experience'");check('Gateway login, role switch and logout preserve security',await browser.evaluate("!localStorage.getItem('auth_token')&&!localStorage.getItem('user_data')"));
 check('No runtime/hydration exceptions',browser.errors.length===0,{errors:browser.errors});
 const after=audit();check('Demo domain tables unchanged',JSON.stringify(before)===JSON.stringify(after),{tables:Object.keys(before.domain_tables).length});await writeFile(resolve(out,'domain-before-after.json'),JSON.stringify({before,after},null,2));
}catch(error){check('Browser execution',false,{error:error.message});}finally{
 browser.close();await writeFile(resolve(out,'browser-results.json'),JSON.stringify({reports,screens,summary:{pass:reports.filter(r=>r.status==='PASS').length,fail:reports.filter(r=>r.status==='FAIL').length}},null,2));if(reports.some(r=>r.status==='FAIL'))process.exitCode=1;
}
