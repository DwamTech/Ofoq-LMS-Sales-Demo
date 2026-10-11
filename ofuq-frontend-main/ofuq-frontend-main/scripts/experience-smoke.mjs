import { spawn, spawnSync } from 'node:child_process'
import { request } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
const base='http://127.0.0.1:3004'
const results=[]
const get=(url,options={})=>new Promise((accept,reject)=>{
  const req=request(url,options,response=>{const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>accept({status:response.statusCode,headers:response.headers,text:Buffer.concat(chunks).toString('utf8')}));response.on('error',reject)});
  req.on('error',reject);req.setTimeout(15000,()=>req.destroy(new Error('Smoke request timeout')));if(options.body)req.write(options.body);req.end();
})
const check=(test,passed,details={})=>results.push({test,status:passed?'PASS':'FAIL',...details})
for(const path of ['/','/about','/courses','/diploms','/community','/privacy','/terms','/verify-certificate','/auth','/user','/admin','/experience','/brand-lab','/search','/login_old','/register_old']){
  const response=await get(base+path);
  const expected=path==='/brand-lab'?404:['/search','/login_old','/register_old'].includes(path)?307:200;
  check('production route '+path,response.status===expected,{statusCode:response.status,location:response.headers.location});
}
for(const path of ['/categories','/allCourses']){
  const response=await get('http://127.0.0.1:8000/api'+path);
  const body=JSON.parse(response.text);const records=Array.isArray(body)?body:(body.data?.data||body.data||[]);
  check('public data '+path,response.status===200&&records.length>0,{statusCode:response.status,count:records.length});
}
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3006'],{env:{...process.env,DEMO_ENTRY_ENABLED:'false',DEMO_ENTRY_SIGNING_KEY:'',DEMO_ENTRY_FRONTEND_ORIGIN:'',DEMO_ENTRY_API_URL:''},windowsHide:true,stdio:'ignore'});
try{
  let available=false;
  for(let attempt=0;attempt<30;attempt++){try{await get('http://127.0.0.1:3006/experience');available=true;break}catch{await new Promise(done=>setTimeout(done,200))}}
  if(!available)throw new Error('Default-disabled production test server not ready');
  const disabled=await get('http://127.0.0.1:3006/api/demo-entry',{method:'POST',headers:{Origin:'http://127.0.0.1:3006','Content-Type':'application/json'},body:JSON.stringify({persona:'admin'})});
  check('actual production entry disabled without private enablement',disabled.status===503&&!disabled.text.includes('"token"'),{statusCode:disabled.status});
  const page=await get('http://127.0.0.1:3006/experience');
  check('disabled gateway retains honest legacy fallback',page.status===200&&page.text.includes('الدخول التجريبي غير مفعّل')&&page.text.includes('/login_old'));
}finally{if(server.pid)spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'})}
await mkdir('artifacts/phase04',{recursive:true});
await writeFile('artifacts/phase04/production-smoke.json',JSON.stringify({buildId:(await readFile('.next/BUILD_ID','utf8')).trim(),results},null,2));
console.log(JSON.stringify(results,null,2));if(results.some(item=>item.status==='FAIL'))process.exitCode=1;
