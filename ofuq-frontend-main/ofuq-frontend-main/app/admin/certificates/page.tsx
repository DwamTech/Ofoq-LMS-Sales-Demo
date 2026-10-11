import Link from "next/link";
export default function AdminCertificatesRoute() {
  return (
    <section>
      <h1>شهادات الطلاب</h1>
      <p>الشهادات مرتبطة بسجلات الطلاب والدبلومات.</p>
      <Link href="/admin/students">إدارة الطلاب ←</Link>
      <br />
      <Link href="/admin/diplomas">إدارة الدبلومات ←</Link>
    </section>
  );
}
