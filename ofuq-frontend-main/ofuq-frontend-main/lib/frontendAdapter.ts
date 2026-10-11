import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { changeFrontend, courseProgress, readFrontend, saveEntity, deleteEntity, verificationData, type LocalEntity } from './frontendStore';
import { localCourse, localCourses, localPrograms, localSections } from './localCatalog';
import { localPreviewUser } from './localPreview';
import { localStudentJourney } from './localWorkspaceData';

async function payload(config:InternalAxiosRequestConfig){
  if(config.data instanceof FormData){const data:LocalEntity={};for(const [key,value] of Array.from(config.data.entries())){if(value instanceof File){data[key]=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('تعذر قراءة الملف'));reader.readAsDataURL(value);});}else data[key]=value;}return data;}
  if(typeof config.data==='string'){try{return JSON.parse(config.data);}catch{return {};}}return config.data??{};
}
function notFound(config:InternalAxiosRequestConfig,message='لا توجد بيانات محلية لهذا المسار'):never {throw new AxiosError(message,'LOCAL_NOT_FOUND',config,undefined,{data:{message},status:404,statusText:'Not Found',headers:{},config});}
export const frontendAdapter:AxiosAdapter=async config=>{
  const url=new URL(config.url??'/', 'http://frontend.local'),path=url.pathname.replace(/^\/api(?=\/)/,'');
  Object.entries(config.params??{}).forEach(([key,value])=>url.searchParams.set(key,String(value)));
  const method=(config.method??'get').toLowerCase(),input=await payload(config),state=readFrontend();
  const list=(items:LocalEntity[])=>({data:items,pagination:{current_page:1,last_page:1,total:items.length},meta:{current_page:1,last_page:1,total:items.length},total:items.length});
  let data:any;
  if(path==='/profile'){
    if(method!=='get')changeFrontend(s=>{const id=localPreviewUser().id;const index=s.users.findIndex(u=>u.id===id);s.users[index]={...s.users[index],...input};});
    const user=localPreviewUser();data=method==='get'?{...user,user}:user;
  }else if(path==='/profile/picture') {changeFrontend(s=>{s.users[0].profile_picture=input.profile_picture??input.picture??input.image;});data={user:localPreviewUser(),profile_picture:localPreviewUser().profile_picture};
  }else if(['/login','/signup'].includes(path))data={user:localPreviewUser(),token:'frontend-local-session',access_token:'frontend-local-session'};
  else if(path==='/profile/password'){if(input.password!==input.password_confirmation||String(input.password??'').length<8)throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل ومتطابقة مع التأكيد.');data={success:true,message:'تم تحديث الإعدادات المحلية'};}
  else if(['/auth/logout','/forgot-password','/reset-password'].includes(path))data={success:true,message:'تم تحديث الإعدادات المحلية'};
  else if(path==='/public/verify-certificate'||path.startsWith('/diploma-certificate/verify/')){data={data:verificationData(url.searchParams.get('serial_number')??path.split('/').pop()??'')};if(!data.data)notFound(config,'رقم الشهادة غير موجود.');}
  else if(path==='/categories')data=list(localPrograms(Object.fromEntries(url.searchParams)));
  else if(path==='/allCourses'||path==='/courses/featured')data=list(localCourses(Object.fromEntries(url.searchParams)));
  else if(path==='/sections'||path==='/sections/public')data=list(localSections());
  else if(/^\/categories\/[^/]+$/.test(path)){const p=localPrograms().find(p=>p.slug===path.split('/').pop()||p.id===Number(path.split('/').pop()));if(!p)notFound(config);data={data:{...p,courses:localCourses({category:String(p.id)})}};}
  else if(/^\/(course|courseEnroll)\/\d+$/.test(path)){const c=localCourse(path.split('/').pop()!);if(!c)notFound(config);data={data:c};}
  else if(/^\/courses\/\d+\/progress$/.test(path)){const progress=courseProgress(Number(path.split('/')[2]));data={...progress,course_progress:progress};}
  else if(path==='/my-enrollments')data=list(localStudentJourney().courses);
  else if(path==='/my-diplomas')data=list(localStudentJourney().diplomas.filter(d=>localStudentJourney().courses.some(c=>c.category_id===d.category.id)));
  else if(path==='/my-tests')data=list(localStudentJourney().exams);
  else if(path==='/my-certificates')data={data:state.certificates,certificates:state.certificates};
  else if(path==='/my-enrollments/filters')data={data:{categories:localPrograms(),sections:localSections()},categories:localPrograms(),sections:localSections()};
  else if(path==='/user/favorite-courses')data=list(localCourses().filter(c=>state.favorites.includes(c.id)));
  else if(/^\/user\/favorite-courses\/\d+$/.test(path)){const id=Number(path.split('/').pop());changeFrontend(s=>{s.favorites=method==='delete'?s.favorites.filter(x=>x!==id):Array.from(new Set([...s.favorites,id]));});data={success:true};}
  else if(/^\/(courses|categories)\/\d+\/enroll(?:\/activate)?$/.test(path)){const id=Number(path.split('/')[2]),ids=path.startsWith('/categories')?state.courses.filter(c=>c.category_id===id).map(c=>c.id):[id];changeFrontend(s=>{s.enrolled=Array.from(new Set([...s.enrolled,...ids]));});data={success:true,data:{status:'active'},message:'تم التسجيل بنجاح'};}
  else if(/^\/courses\/\d+\/reviews(?:\/\d+)?$/.test(path)){const id=Number(path.split('/')[2]);if(method==='get')data={...list(state.reviews.filter(r=>r.course_id===id)),average_rating:4.8};else{changeFrontend(s=>{const reviewId=Number(path.split('/')[4]);if(method==='delete')s.reviews=s.reviews.filter(r=>r.id!==reviewId);else{const review={...input,id:reviewId||Date.now(),course_id:id,user:localPreviewUser('student'),created_at:new Date().toISOString()};s.reviews=s.reviews.filter(r=>r.id!==review.id);s.reviews.push(review);}});data={success:true,message:'تم حفظ التقييم'};}}
  else if(path.startsWith('/admin/')){
    const collectionMap:Record<string,'programs'|'courses'|'sections'|'users'|'instructors'|'questions'>={categories:'programs',courses:'courses',sections:'sections',students:'users',instructors:'instructors',supervisors:'users','question-bank':'questions'};
    const [, ,entity,rawId]=path.split('/'),collection=collectionMap[entity],id=Number(rawId);
    if(collection){if(method!=='get'){if(method==='delete')deleteEntity(collection,id);else saveEntity(collection,{...input,...(id?{id}:{}),is_published:input.is_published!=='false',created_at:new Date().toISOString()});data={success:true,message:'تم حفظ البيانات محليًا'};}else{let items=readFrontend()[collection];if(entity==='students')items=items.filter(u=>u.role==='student');if(entity==='supervisors')items=items.filter(u=>u.role==='admin');const item=items.find(i=>i.id===id);data=id?{data:item,...item}:entity==='instructors'?{data:{data:items,current_page:1,last_page:1,total:items.length}}:list(items);}}
    else notFound(config);
  }else notFound(config);
  return {data,status:200,statusText:'OK',headers:{'content-type':'application/json'},config};
};
