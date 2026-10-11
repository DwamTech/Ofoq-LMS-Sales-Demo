"use client";
import Link from "next/link";
import {
  ArrowUpLeft,
  Check,
  BookOpen,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { ProgramGraphic } from "@/components/brand/ProgramGraphic";
import {
  courseState,
  stateLabel,
  courseHref,
  diplomaHref,
  diplomaComplete,
  examHref,
  type StudentCourse,
  type StudentDiploma,
} from "@/utils/studentJourney";
import { useStudent } from "./StudentProvider";
import styles from "./Student.module.css";

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={styles.pageIntro}>
      <span className={styles.kicker}>{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
export function Progress({
  value,
  label,
  ring = false,
}: {
  value: number;
  label: string;
  ring?: boolean;
}) {
  if (!Number.isFinite(Number(value))) return <span>التقدم غير متاح</span>;
  const progress = Math.max(0, Math.min(100, Number(value)));
  return (
    <div
      className={ring ? styles.ringProgress : styles.progress}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={`${progress}% ${label}`}
    >
      {ring ? (
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" />
          <circle
            cx="60"
            cy="60"
            r="50"
            strokeDasharray={`${progress * 3.14159} 314.159`}
          />
        </svg>
      ) : (
        <span className={styles.track}>
          <span style={{ width: `${progress}%` }} />
        </span>
      )}
      <strong>
        <bdi>{progress}%</bdi>
      </strong>
      {ring && <small>متطلبات الإنجاز</small>}
    </div>
  );
}
export function CourseTile({ course }: { course: StudentCourse }) {
  const { exams, diplomas, certificates } = useStudent();
  const exam = exams.find((item) => item.course_id === course.id);
  const state = courseState(course, exam);
  const parent = diplomas.find(
    (item) => item.category.id === course.category_id,
  );
  const certificate = certificates.find(
    (item) => item.course_id === course.id && item.status === "issued",
  );
  return (
    <article
      className={styles.courseCard}
      data-course-id={course.id}
      data-state={state}
    >
      <div className={styles.courseCardTop}>
        <BookOpen size={22} />
        <span className={styles.badge} data-complete={state === "completed"}>
          {stateLabel[state]}
        </span>
      </div>
      <h3>
        <bdi>{course.title}</bdi>
      </h3>
      <p>{parent?.category.name || "مقرر مستقل"}</p>
      <Progress
        value={course.progress_percentage}
        label={`الدروس في ${course.title}`}
      />
      <small>إنجاز الدروس — اجتياز التقييم يُعرض بشكل مستقل</small>
      <div className={styles.cardActions}>
        <Link href={courseHref(course.id)}>
          {state === "completed" ? "مراجعة المقرر" : "مساحة التعلّم"}
          <ArrowUpLeft size={16} />
        </Link>
        {state === "exam-active" && (
          <Link href={examHref(course.id)}>عرض الاختبار ←</Link>
        )}
        {certificate && (
          <Link href={`/user/my-certificates?course=${course.id}`}>
            الشهادة <Check size={15} />
          </Link>
        )}
      </div>
    </article>
  );
}
export function DiplomaTile({
  diploma,
  featured = false,
}: {
  diploma: StudentDiploma;
  featured?: boolean;
}) {
  const complete = diplomaComplete(diploma);
  return (
    <article
      className={`${styles.diplomaCard} ${featured ? styles.featuredDiploma : ""}`}
      data-diploma-id={diploma.category.id}
      data-completed={complete}
    >
      <div className={styles.programArtwork}>
        <ProgramGraphic
          title={diploma.category.name}
          identity={diploma.category.slug}
        />
        <span className={styles.badge}>
          {complete ? "رحلة مكتملة" : "رحلة قيد التعلّم"}
        </span>
      </div>
      <div className={styles.diplomaBody}>
        <span className={styles.kicker}>
          {complete ? "AN ACHIEVEMENT TO KEEP" : `التجربة التعليمية`}
        </span>
        <h3>{diploma.category.name}</h3>
        <p>
          <GraduationCap size={17} />
          {diploma.category.courses_count} مقررات مرتبطة بالبرنامج
        </p>
        <Progress
          value={diploma.progress}
          label={`إنجاز متطلبات ${diploma.category.name}`}
        />
        <div className={styles.cardActions}>
          <Link href={diplomaHref(diploma.category.slug)}>
            استكشف رحلتك <ArrowUpLeft size={16} />
          </Link>
          {complete && diploma.can_download_certificate && (
            <Link href={`/user/my-certificates?diploma=${diploma.category.id}`}>
              شهادة الدبلومة <Check size={15} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
export function BackLink({
  href = "/user",
  children = "العودة لمساحتي",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className={styles.backLink}>
      <ArrowLeft size={16} />
      {children}
    </Link>
  );
}
export function ReadError({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.empty} role="alert">
      <h2>لم تتوفر هذه المساحة.</h2>
      <p>{children}</p>
      <BackLink />
    </div>
  );
}
