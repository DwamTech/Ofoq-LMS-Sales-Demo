import { Suspense } from "react";
import StudentCatalog from "@/components/student/StudentCatalog";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">جارٍ تحميل مكتبة التعلّم…</p>}>
      <StudentCatalog />
    </Suspense>
  );
}
