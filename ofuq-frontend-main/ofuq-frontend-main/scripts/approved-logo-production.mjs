import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const out='artifacts/mansatak-approved';await mkdir(out,{recursive:true});
if(process.argv.includes('--build')){
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next','build'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);const exit=await new Promise(r=>child.on('close',r));await writeFile(out+'/build.log',output);
 const result={status:exit===0?'PASS':'FAIL',exitCode:exit,buildId:exit===0?(await readFile('.next/BUILD_ID','utf8')).trim():null,typesSkipped:/Skipping validation of types/.test(output),lintSkipped:/Skipping linting/.test(output)};
 await writeFile(out+'/build-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exitCode=exit??1;
}else{
 const base='http://127.0.0.1:3004',reports=[];
 const check=(test,pass,details={})=>{reports.push({test,status:pass?'PASS':'FAIL',...details});console.log((pass?'PASS ':'FAIL ')+test);};
 for(const [path,status]of [['/',200],['/about',200],['/courses',200],['/diploms',200],['/community',200],['/privacy',200],['/terms',200],['/verify-certificate',200],['/auth',200],['/auth?tab=signup',200],['/experience',200],['/login_old',307],['/register_old',307],['/brand-lab',404]]){
  const response=await fetch(base+path,{redirect:'manual'});check('Production route '+path,response.status===status,{statusCode:response.status});
  if(path==='/'){const html=await response.text();check('Metadata advertises the approved PNG favicon',html.includes('/favicon.png')&&!html.includes('/favicon.svg')&&html.includes('<title>منصتك التعليمية</title>'));}
 }
 const manifestResponse=await fetch(base+'/manifest.webmanifest'),manifest=await manifestResponse.json();check('Arabic manifest uses PNG assets',manifestResponse.ok&&manifest.name==='منصتك التعليمية'&&manifest.dir==='rtl'&&manifest.icons.every(i=>i.type==='image/png'));
 for(const [path,width,height] of [['/favicon.png',64,64],['/brand/mansatak-app-192.png',192,192],['/brand/mansatak-app-512.png',512,512],['/brand/mansatak-og.png',1200,630],['/brand/mansatak-approved-horizontal-light.png',1825,700]]){
  const r=await fetch(base+path),bytes=Buffer.from(await r.arrayBuffer());check(path+' valid PNG dimensions',r.ok&&r.headers.get('content-type')?.includes('image/png')&&bytes.subarray(1,4).toString()==='PNG'&&bytes.readUInt32BE(16)===width&&bytes.readUInt32BE(20)===height,{bytes:bytes.length});
 }
 const response=await fetch(base+'/favicon.ico'),bytes=Buffer.from(await response.arrayBuffer());check('Actual multiframe 16/32/48 ICO',response.ok&&bytes.readUInt16LE(2)===1&&bytes.readUInt16LE(4)===3&&[16,32,48].every((size,i)=>bytes[6+i*16]===size&&bytes[7+i*16]===size));
 await writeFile(out+'/smoke-results.json',JSON.stringify({reports,summary:{pass:reports.filter(r=>r.status==='PASS').length,fail:reports.filter(r=>r.status==='FAIL').length}},null,2));if(reports.some(r=>r.status==='FAIL'))process.exitCode=1;
}
