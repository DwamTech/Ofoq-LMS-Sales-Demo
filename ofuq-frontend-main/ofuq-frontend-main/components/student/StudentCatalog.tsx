"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useStudent } from "./StudentProvider";
import { PageIntro, CourseTile, DiplomaTile } from "./LearningPrimitives";
import { courseState } from "@/utils/studentJourney";
import styles from "./Student.module.css";

export default function StudentCatalog() {
  const params = useSearchParams();
  const view = params.get("view") === "courses" ? "courses" : "diplomas";
  const { diplomas, courses, exams } = useStudent();
  const [filter, setFilter] = useState("all");
  const visible = courses.filter(
    (course) =>
      filter === "all" ||
      (filter === "completed"
        ? courseState(
            course,
            exams.find((item) => item.course_id === course.id),
          ) === "completed"
        : courseState(
            course,
            exams.find((item) => item.course_id === course.id),
          ) !== "completed"),
  );
  return (
    <div data-student-page={view}>
      <PageIntro
        eyebrow="YOUR LEARNING LIBRARY"
        title={
          view === "courses" ? "مقرراتي. خطوة بخطوة." : "دبلوماتي. رحلة متصلة."
        }
      >
        برامجك ومقرراتك المسجلة، بهويتها نفسها في الكتالوج العام.
      </PageIntro>
      <nav className={styles.tabs} aria-label="الدبلومات والمقررات">
        <Link
          href="/user/my_courses"
          aria-current={view === "diplomas" ? "page" : undefined}
        >
          دبلوماتي <span>{diplomas.length}</span>
        </Link>
        <Link
          href="/user/my_courses?view=courses"
          aria-current={view === "courses" ? "page" : undefined}
        >
          مقرراتي <span>{courses.length}</span>
        </Link>
      </nav>
      {view === "courses" ? (
        <>
          <div className={styles.filters} aria-label="تصفية المقررات">
            {[
              ["all", "كل المقررات"],
              ["learning", "قيد الرحلة"],
              ["completed", "المكتملة"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.courseGrid}>
            {visible.map((course) => (
              <CourseTile key={course.id} course={course} />
            ))}
          </div>
          {visible.length === 0 && (
            <p className={styles.empty}>لا توجد مقررات في هذا التصنيف.</p>
          )}
        </>
      ) : (
        <div className={styles.programGrid}>
          {diplomas.map((diploma) => (
            <DiplomaTile key={diploma.id} diploma={diploma} />
          ))}
        </div>
      )}
    </div>
  );
}
