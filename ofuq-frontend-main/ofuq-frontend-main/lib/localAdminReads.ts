import { readFrontend, courseProgress } from './frontendStore';
import { localAdminData, localStudentJourney } from './localWorkspaceData';

export function localAdminRead(path:string):unknown {
  const state=readFrontend(),admin=localAdminData(),journey=localStudentJourney(),url=new URL(path,'http://local.invalid');
  const students=state.users.filter(u=>u.role==='student'),pagination={current_page:1,last_page:1,total:students.length};
  const studentRows=students.filter(u=>u.name.includes(url.searchParams.get('search')??'')).map(u=>({id:u.id,name:u.name,courses_count:state.enrolled.length,diplomas_count:state.programs.length}));
  if(url.pathname==='/profile')return {user:admin.user};
  if(url.pathname==='/admin/showcase/students')return {data:studentRows,pagination:{...pagination,total:studentRows.length}};
  if(url.pathname==='/admin/instructors')return {data:{data:state.instructors,current_page:1,last_page:1,total:state.instructors.length}};
  if(url.pathname==='/admin/reports/overview')return {data:admin.overview};
  if(url.pathname==='/admin/reports/beneficiaries')return {data:{filters:{from:null,to:null,period_definition:'كل البيانات المحلية'},summary:{total_beneficiaries:students.length,completed_any_course:Object.values(state.results).some(r=>r.passed)?1:0,completed_any_diploma:0},diplomas:state.programs.map(p=>({diploma_id:p.id,diploma_name:p.name,beneficiaries_count:students.length,completed_count:0,completion_rate:0}))}};
  const studentMatch=url.pathname.match(/\/students\/(\d+)/);
  if(studentMatch){const user=students.find(u=>u.id===Number(studentMatch[1]));if(!user)throw Error('الطالب غير موجود');return {data:{student:user,diplomas:journey.diplomas.map(p=>({category_id:p.category.id,name:p.category.name,progress_percentage:p.progress,status:p.status})),courses:journey.courses.map(c=>({course_id:c.id,title:c.title,category_id:c.category_id,status:c.enrollment_status,progress_percentage:c.progress_percentage,has_final_exam:true,exam_status:state.results[c.id]?.passed?'passed':'not_started',exam_score:state.results[c.id]?.score??null})),certificates:state.certificates.map(c=>({...c,program:c.course_title,record_created_at:c.issued_at})),activity:{completed_lessons_count:state.completed.length,total_watch_duration_seconds:state.completed.length*600},lessons:{data:state.courses.flatMap(c=>c.chapters?.flatMap((ch:any)=>ch.lessons?.map((l:any)=>({lesson_id:l.id,lesson_title:l.title,progress_percentage:state.completed.includes(l.id)?100:0,status:state.completed.includes(l.id)?'completed':'pending'}))??[])??[]),pagination}}}};
  const examMatch=url.pathname.match(/\/(?:showcase\/exams|quizzes)\/(\d+)/)??url.pathname.match(/\/courses\/(\d+)\/(final-exam|question-bank)/);
  if(examMatch){const course=state.courses.find(c=>c.id===Number(examMatch[1]));return {data:{course,exam:{id:course?.id,title:'التقييم النهائي',question_count:state.questions.length},questions:state.questions,attempts_by_status:{submitted:state.results[course?.id]?1:0}}};}
  if(url.pathname.startsWith('/admin/reports/')){const id=Number(url.pathname.split('/').pop()),course=state.courses.find(c=>c.id===id),diploma=state.programs.find(p=>p.id===id);return {data:{course,diploma,lesson:{title:'تفاصيل الدرس'},summary:{total_students:students.length,total_courses:state.courses.length,completed_lessons_count:state.completed.length},activity:{total_watch_duration_seconds:state.completed.length*600},students:{data:students.map(u=>({student_id:u.id,student_name:u.name,progress_percentage:course?courseProgress(course.id).overall_progress:0,status:'active'})),pagination}}};}
  throw Error('المسار المحلي غير موجود');
}
