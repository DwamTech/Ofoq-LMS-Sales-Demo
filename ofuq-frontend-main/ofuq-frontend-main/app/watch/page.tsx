"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StudentWorkspace from "@/components/student/StudentWorkspace";
import StudentLessonView from "@/components/student/StudentLesson";
function DemoWatchPage() {
  const params = useSearchParams();
  return (
    <StudentWorkspace>
      <StudentLessonView
        courseId={Number(params.get("courseId"))}
        chapterId={Number(params.get("chapterId"))}
        lessonId={Number(params.get("lessonId"))}
      />
    </StudentWorkspace>
  );
}
export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          جاري التحميل...
        </div>
      }
    >
      <DemoWatchPage />
    </Suspense>
  );
}
