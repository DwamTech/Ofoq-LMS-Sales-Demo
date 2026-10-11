import programs from '@/data/programs.json';
import courses from '@/data/courses.json';
import sections from '@/data/sections.json';
import experience from '@/data/experience.json';
import type { StudentCertificate } from '@/utils/studentJourney';

export const FRONTEND_STORAGE_KEY = 'mansatak-frontend-v1';
export const FRONTEND_CHANGE = 'frontend-data-change';
export type LocalEntity = Record<string, any>;
export interface FrontendState {
  version:1;
  programs:LocalEntity[]; courses:LocalEntity[]; sections:LocalEntity[];
  users:LocalEntity[]; instructors:LocalEntity[]; questions:LocalEntity[];
  favorites:number[]; enrolled:number[]; completed:number[];
  results:Record<string,{score:number;passed:boolean;submitted_at:string}>;
  certificates:StudentCertificate[]; reviews:LocalEntity[];
}
function seed(): FrontendState {
  return structuredClone({version:1,programs,courses,sections,...experience,
    favorites:[2001,2003],enrolled:[2001,2002],completed:[],results:{},reviews:[],
    certificates:[{id:1,type:'course',source:'course',status:'issued',course_title:'تطوير واجهات الويب الاحترافية',user_name:experience.users[0].name,issued_at:'2026-10-10',serial_number:'DEMO-2026-001',file_path:'local:DEMO-2026-001',verification_token:'DEMO-2026-001'}],
  } as FrontendState);
}
export function readFrontend(): FrontendState {
  if(typeof window==='undefined') return seed();
  try { const raw=localStorage.getItem(FRONTEND_STORAGE_KEY);if(raw){const data=JSON.parse(raw);if(validFrontendState(data))return data;} } catch {}
  return seed();
}
export function validFrontendState(value:unknown):value is FrontendState {
  if(!value||typeof value!=='object')return false;
  const data=value as FrontendState;
  return data.version===1&&['programs','courses','sections','users','instructors','questions','favorites','enrolled','completed','certificates','reviews'].every(key=>Array.isArray((data as any)[key]))&&!!data.results&&typeof data.results==='object'&&data.users.some(u=>u.id===99001)&&data.users.some(u=>u.id===99002);
}
export function importFrontend(value:unknown){if(!validFrontendState(value))throw Error('الملف ليس نسخة بيانات صالحة لهذا المشروع');if(typeof window!=='undefined'){localStorage.setItem(FRONTEND_STORAGE_KEY,JSON.stringify(value));window.dispatchEvent(new Event(FRONTEND_CHANGE));}}
export function changeFrontend(update:(state:FrontendState)=>void) {
  const state=readFrontend(); update(state);
  // A failed write is surfaced to the caller; never claim an unsaved change succeeded.
  if(typeof window!=='undefined'){localStorage.setItem(FRONTEND_STORAGE_KEY,JSON.stringify(state));window.dispatchEvent(new Event(FRONTEND_CHANGE));}
  return state;
}
export function resetFrontend(){if(typeof window!=='undefined'){localStorage.removeItem(FRONTEND_STORAGE_KEY);window.dispatchEvent(new Event(FRONTEND_CHANGE));}}
export function saveEntity(collection:'programs'|'courses'|'sections'|'users'|'instructors'|'questions',item:LocalEntity) {
  changeFrontend(s=>{const id=item.id ?? Math.max(0,...s[collection].map(x=>Number(x.id)))+1;const index=s[collection].findIndex(x=>x.id===id);const value={...item,id};if(index>=0)s[collection][index]={...s[collection][index],...value};else s[collection].push(value);});
}
export function deleteEntity(collection:'programs'|'courses'|'sections'|'users'|'instructors'|'questions',id:number) {
  if(collection==='users'&&[99001,99002].includes(id))throw Error('حسابا التجربة الأساسيان لا يمكن حذفهما');
  changeFrontend(s=>{s[collection]=s[collection].filter(x=>x.id!==id);if(collection==='courses'){s.enrolled=s.enrolled.filter(x=>x!==id);s.favorites=s.favorites.filter(x=>x!==id);}if(collection==='programs')s.courses.forEach(c=>{if(c.category_id===id)c.category_id=null;});});
}
export function courseProgress(id:number){const state=readFrontend(),course=state.courses.find(c=>c.id===id);const lessons:LocalEntity[]=course?.chapters?.flatMap((c:LocalEntity)=>c.lessons??[])??[];const done=lessons.filter(l=>state.completed.includes(l.id));return {overall_progress:lessons.length?Math.round(done.length/lessons.length*100):0,status:done.length===lessons.length&&lessons.length?'completed':'active',lessons:lessons.map(l=>({lesson_id:l.id,status:state.completed.includes(l.id)?'completed':'pending',quiz_passed:state.completed.includes(l.id)}))};}
export function completeLesson(id:number){changeFrontend(s=>{if(!s.completed.includes(id))s.completed.push(id);});}
export function toggleFavorite(id:number){changeFrontend(s=>{s.favorites=s.favorites.includes(id)?s.favorites.filter(x=>x!==id):[...s.favorites,id];});}
export function submitLocalExam(courseId:number,answers:Record<number,number>){
  const state=readFrontend(),questions=state.questions.filter(q=>!q.course_id||q.course_id===courseId);
  if(!questions.length||questions.some(q=>answers[q.id]===undefined))throw new Error('أجب عن جميع الأسئلة أولًا.');
  const score=Math.round(questions.filter(q=>answers[q.id]===Number(q.answer)).length/questions.length*100);
  changeFrontend(s=>{s.results[courseId]={score,passed:score>=60,submitted_at:new Date().toISOString()};if(score>=60)issueCertificateInState(s,courseId);});return score;
}
function issueCertificateInState(s:FrontendState,courseId:number){if(s.certificates.some(c=>c.course_id===courseId))return;const course=s.courses.find(c=>c.id===courseId);if(!course)throw new Error('المقرر غير موجود');const serial=`LOCAL-${courseId}-${Date.now()}`;s.certificates.push({id:Date.now(),course_id:courseId,type:'course',source:'course',status:'issued',course_title:course.title,user_name:s.users[0].name,issued_at:new Date().toISOString(),serial_number:serial,verification_token:serial,file_path:`local:${serial}`});}
export function issueLocalCertificate(courseId:number){changeFrontend(s=>issueCertificateInState(s,courseId));}
export function verificationData(serial:string){const c=readFrontend().certificates.find(c=>c.serial_number.toLowerCase()===serial.trim().toLowerCase());return c?{...c,student_name:c.user_name,course_name:c.course_title,exam_date:c.issued_at,issue_date:c.issued_at,exam_grade:`${readFrontend().results[c.course_id??0]?.score??96}%`,is_valid:true}:null;}
