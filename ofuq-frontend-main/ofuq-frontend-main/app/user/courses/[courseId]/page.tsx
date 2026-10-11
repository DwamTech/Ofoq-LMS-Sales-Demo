import StudentCourse from '@/components/student/StudentCourse';
export default function Page({params}:{params:{courseId:string}}){return <StudentCourse courseId={Number(params.courseId)}/>}
