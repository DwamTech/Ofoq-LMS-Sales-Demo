"use client";
import { brand } from "@/lib/brand";
import Link from "next/link";
import { ArrowUpLeft, Award, BookOpen, Check, ArrowLeft } from "lucide-react";
import { useStudent } from "./StudentProvider";
import {
  PageIntro,
  Progress,
  CourseTile,
  DiplomaTile,
} from "./LearningPrimitives";
import {
  courseState,
  courseHref,
  diplomaHref,
  examHref,
  diplomaComplete,
  issuedCertificate,
} from "@/utils/studentJourney";
import styles from "./Student.module.css";

export default function StudentHome() {
  const { user, diplomas, courses, exams, certificates } = useStudent();
  const primary = diplomas.find(
    (item) => !diplomaComplete(item) && item.status === "active",
  );
  const next =
    courses.find(
      (item) => item.progress_percentage > 0 && item.progress_percentage < 100,
    ) || courses.find((item) => item.progress_percentage === 0);
  const activeExam = exams.find(
    (item) => item.active_attempt_status === "in_progress",
  );
  const completed = courses.filter(
    (item) =>
      courseState(
        item,
        exams.find((exam) => exam.course_id === item.id),
      ) === "completed",
  );
  const issued = certificates.filter(issuedCertificate);
  const currentCourses = primary
    ? courses.filter((item) => item.category_id === primary.category.id)
    : courses;
  return (
    <div className={styles.home} data-student-page="overview">
      <PageIntro
        eyebrow="01 / YOUR PERSONAL LEARNING SPACE"
        title={`أهلًا، ${user.name.split(" ")[0]}.`}
      >
        كل ما تتعلّمه، وكل ما أنجزته. رحلتك مع {brand.name} تبدأ من هنا.
      </PageIntro>
      <div className={styles.homeHero}>
        <section className={styles.journeyHero} aria-label="رحلتك الحالية">
          <div>
            <span className={styles.kicker}>
              رحلتك التعليمية / المسار الحالي
            </span>
            <h2>{primary?.category.name || "رحلتك التعليمية"}</h2>
            <p>
              تقدم البرنامج يحتسب اجتياز متطلبات المقررات، وليس مشاهدة الدروس
              وحدها.
            </p>
            {primary && (
              <Link
                className={styles.primaryAction}
                href={diplomaHref(primary.category.slug)}
              >
                تفاصيل الرحلة <ArrowUpLeft size={18} />
              </Link>
            )}
            <div className={styles.heroFacts}>
              <span>
                <strong>{courses.length}</strong>مقررات مسجلة
              </span>
              <span>
                <strong>{completed.length}</strong>مقررات أُنجزت
              </span>
              <span>
                <strong>{issued.length}</strong>شهادات صادرة
              </span>
            </div>
          </div>
          {primary && (
            <Progress value={primary.progress} label="متطلبات الدبلومة" ring />
          )}
        </section>
        <aside className={styles.nextAction}>
          <span className={styles.kicker}>STEP BY STEP</span>
          <BookOpen size={30} />
          <h2>خطوتك التالية.</h2>
          {next ? (
            <>
              <p>
                أكمل تعلّمك في <bdi>{next.title}</bdi>
              </p>
              <Progress value={next.progress_percentage} label="إنجاز الدروس" />
              <Link
                href={courseHref(next.id)}
                className={styles.lightAction}
                data-continue-learning
              >
                تابع التعلّم <ArrowUpLeft size={18} />
              </Link>
            </>
          ) : (
            <p>راجع مقرراتك وإنجازاتك، أو استكشف برنامجًا جديدًا.</p>
          )}
        </aside>
      </div>
      {activeExam && (
        <section className={styles.milestone} aria-label="خطوة التقييم التالية">
          <span className={styles.badge}>محاولة موجودة · للعرض فقط</span>
          <div>
            <h2>الدروس اكتملت. التقييم ينتظرك.</h2>
            <p>
              {activeExam.course_title} — استكشف أسئلة محاولتك الحالية دون إرسال
              إجابات.
            </p>
          </div>
          <Link href={examHref(activeExam.course_id)}>
            عرض الاختبار <ArrowUpLeft size={19} />
          </Link>
        </section>
      )}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.kicker}>02 / YOUR PROGRAMS</span>
            <h2>رحلات تتّسع معك.</h2>
          </div>
          <Link href="/user/my_courses">
            كل الدبلومات <ArrowLeft size={17} />
          </Link>
        </div>
        <div className={styles.programGrid}>
          {diplomas.map((diploma) => (
            <DiplomaTile key={diploma.id} diploma={diploma} />
          ))}
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.kicker}>03 / THE LEARNING PATH</span>
            <h2>مقررًا، خطوةً، إنجازًا.</h2>
          </div>
          <Link href="/user/my_courses?view=courses">
            كل المقررات <ArrowLeft size={17} />
          </Link>
        </div>
        <div className={styles.courseGrid}>
          {currentCourses.map((course) => (
            <CourseTile key={course.id} course={course} />
          ))}
        </div>
      </section>
      {issued.length > 0 && (
        <section className={styles.achievementBand}>
          <Award size={45} />
          <div>
            <span className={styles.kicker}>04 / SOMETHING TO BE PROUD OF</span>
            <h2>للإنجاز، أثر يبقى.</h2>
            <p>
              {issued.length} شهادات صادرة باسم {user.name}. ملفات PDF حقيقية،
              ومرجع للتحقق.
            </p>
          </div>
          <Link className={styles.primaryAction} href="/user/my-certificates">
            إنجازاتي وشهاداتي <Check size={18} />
          </Link>
        </section>
      )}
    </div>
  );
}
