import {request} from 'node:http'
import {mkdir,writeFile} from 'node:fs/promises'
const base='http://127.0.0.1:3004',api='http://127.0.0.1:8000/api';
const call=(url,options={})=>new Promise((resolve,reject)=>{const req=request(url,options,res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const bytes=Buffer.concat(chunks);resolve({status:res.statusCode,headers:res.headers,bytes,json:()=>JSON.parse(bytes.toString())})})});req.on('error',reject);req.setTimeout(15000,()=>req.destroy(new Error('API timeout')));if(options.body)req.write(options.body);req.end()});
const session=await call(base+'/api/demo-entry',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({persona:'student'})});
if(session.status!==201)throw new Error('Verified local entry unavailable: '+session.status);
const token=session.json().token;
const headers={Authorization:'Bearer '+token,Accept:'application/json'};
const results={};
try{
 for(const path of ['/profile','/my-diplomas','/my-enrollments?per_page=100','/my-certificates','/my-tests']){const res=await call(api+path,{headers});results[path]={status:res.status,data:res.json()};}
 const courses=results['/my-enrollments?per_page=100'].data.data;
 for(const course of courses){
  for(const path of [`/courseEnroll/${course.id}`,`/courses/${course.id}/progress`,`/courses/${course.id}/final-exam/meta`,`/courses/${course.id}/final-exam/attempt/active`]){
   const res=await call(api+path,{headers});const data=res.json();
   // Do not persist answer keys if an existing endpoint happens to expose them.
   const exposed=[];JSON.stringify(data,(key,value)=>{if(/correct|answer_key/i.test(key))exposed.push(key);return value});
   results[path]={status:res.status,data:exposed.length?{blocked:'Protected answer fields detected',keys:[...new Set(exposed)]}:data};
  }
 }
 await mkdir('artifacts/phase05',{recursive:true});await writeFile('artifacts/phase05/inspection.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({student:results['/profile'].data.user,diplomas:results['/my-diplomas'],courses:courses.map(c=>({id:c.id,title:c.title,category:c.category,progress:c.progress_percentage,status:c.enrollment_status})),certificates:results['/my-certificates'],tests:results['/my-tests'],contractPaths:Object.fromEntries(Object.entries(results).filter(([k])=>k.startsWith('/courses/')).map(([k,v])=>[k,v]))},null,2));
}finally{await call(api+'/auth/logout',{method:'POST',headers})}
