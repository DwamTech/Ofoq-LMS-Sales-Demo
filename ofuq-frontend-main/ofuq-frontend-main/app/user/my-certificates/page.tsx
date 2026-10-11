import { Suspense } from "react";
import StudentCertificates from "@/components/student/StudentCertificates";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">جارٍ تحميل شهاداتك…</p>}>
      <StudentCertificates />
    </Suspense>
  );
}
