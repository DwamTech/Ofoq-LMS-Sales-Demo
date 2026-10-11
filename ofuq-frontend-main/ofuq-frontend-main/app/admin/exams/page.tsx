import Link from "next/link";
// In demo mode AdminView owns this route; normal operational links stay usable.
export default function AdminExamsRoute() {
  return (
    <section>
      <h1>اختبارات المقررات</h1>
      <p>افتح المقرر للوصول إلى بنك أسئلته في بيئة التشغيل.</p>
      <Link href="/admin/course-management">إدارة المقررات ←</Link>
    </section>
  );
}
