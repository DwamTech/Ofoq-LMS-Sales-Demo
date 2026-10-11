import StudentDiploma from '@/components/student/StudentDiploma';
export default function Page({params}:{params:{slug:string}}){return <StudentDiploma slug={params.slug}/>}
