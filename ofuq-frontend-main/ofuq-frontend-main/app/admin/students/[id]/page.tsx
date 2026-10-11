import Link from "next/link";
export default function AdminStudentDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  return (
    <section>
      <h1>السجل التعليمي للطالب</h1>
      <Link href={`/admin/reports/students/${params.id}`}>
        افتح التقرير التعليمي الحالي ←
      </Link>
    </section>
  );
}
