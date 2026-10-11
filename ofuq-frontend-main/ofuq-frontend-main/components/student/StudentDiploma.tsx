"use client";
import Link from "next/link";
import { useStudent } from "./StudentProvider";
import {
  PageIntro,
  Progress,
  CourseTile,
  BackLink,
  ReadError,
} from "./LearningPrimitives";
import { diplomaComplete, courseState } from "@/utils/studentJourney";
import styles from "./Student.module.css";

export default function StudentDiploma({ slug }: { slug: string }) {
  const { diplomas, courses, exams } = useStudent();
  const diploma = diplomas.find(
    (item) =>
      item.category.slug === decodeURIComponent(slug) ||
      String(item.category.id) === slug,
  );
  if (!diploma)
    return <ReadError>هذا البرنامج غير موجود في تسجيلاتك الحالية.</ReadError>;
  const enrolled = courses.filter(
    (course) => course.category_id === diploma.category.id,
  );
  const complete = diplomaComplete(diploma);
  return (
    <div data-student-page="diploma" data-program-id={diploma.category.id}>
      <BackLink href="/user/my_courses">دبلوماتي</BackLink>
      <PageIntro
        eyebrow="A CONNECTED EDUCATIONAL JOURNEY"
        title={diploma.category.name}
      >
        {complete
          ? "اكتملت متطلبات البرنامج. هذا أثر رحلتك."
          : "كل مقرر جزء من الرحلة. أكمل الدروس والتقييمات المطلوبة للإنجاز."}
      </PageIntro>
      <section className={styles.diplomaSummary}>
        <div>
          <span className={styles.badge} data-complete={complete}>
            {complete ? "متطلبات الدبلومة مكتملة" : "تسجيل نشط · رحلة مستمرة"}
          </span>
          <h2>
            {complete ? "رحلة تستحق أن تُوثّق." : "تعلّم. طبّق. ثم أنجز."}
          </h2>
          <p>
            {diploma.category.courses_count} مقررات في البرنامج ·{" "}
            {
              enrolled.filter(
                (course) =>
                  courseState(
                    course,
                    exams.find((exam) => exam.course_id === course.id),
                  ) === "completed",
              ).length
            }{" "}
            مقررات أُنجزت في تسجيلاتك.
          </p>
          <div className={styles.cardActions}>
            <Link
              href={`/diplomas/${encodeURIComponent(diploma.category.slug)}`}
              data-public-diploma
            >
              البرنامج في الموقع العام ↗
            </Link>
            {diploma.can_download_certificate && (
              <Link
                href={`/user/my-certificates?diploma=${diploma.category.id}`}
              >
                شهادة الدبلومة ←
              </Link>
            )}
          </div>
        </div>
        <Progress
          value={diploma.progress}
          label="اجتياز متطلبات البرنامج"
          ring
        />
      </section>
      <div className={styles.sectionHeading}>
        <h2>مقررات رحلتك</h2>
        <p>النسب أدناه لإنجاز الدروس؛ حالة التقييم مستقلة.</p>
      </div>
      <div className={styles.courseGrid}>
        {enrolled.map((course) => (
          <CourseTile key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
