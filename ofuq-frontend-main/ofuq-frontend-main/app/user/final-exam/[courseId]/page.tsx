import { StudentExamShowcase } from "@/components/student/StudentExam";
export default function Page({ params }: { params: { courseId: string } }) {
  return <StudentExamShowcase courseId={Number(params.courseId)} />;
}
