import { brand } from "@/lib/brand";
import {
  ArrowUpLeft,
  BookOpen,
  Check,
  GraduationCap,
  Layers3,
  BarChart3,
  ShieldCheck,
  Users,
} from "lucide-react";
import styles from "./Experience.module.css";

export function StudentWorld({
  program,
}: {
  program: { name: string; courses: number } | null;
}) {
  return (
    <div
      className={styles.studentVisual}
      aria-label="تصور توضيحي لمسار التعلم، لا بيانات جلسة طالب"
    >
      <svg
        viewBox="0 0 500 290"
        className={styles.studentOrbit}
        aria-hidden="true"
      >
        <path d="M45 270V175a205 205 0 0 1 410 0v95M90 270V175a160 160 0 0 1 320 0v95M135 270V175a115 115 0 0 1 230 0v95" />
        <circle cx="250" cy="75" r="12" />
        <path d="M20 230h460" />
      </svg>
      <div className={styles.learningPath}>
        <span>01 / اكتشف</span>
        <span>02 / تعلّم</span>
        <span>03 / أنجز</span>
      </div>
      <div className={styles.learningProgram}>
        <BookOpen size={20} />
        <span>
          من البرامج المنشورة
          <strong>{program?.name || "مقررات ودبلومات مترابطة"}</strong>
          {program && <small>{program.courses} مقررات في البرنامج</small>}
        </span>
        <ArrowUpLeft size={20} />
      </div>
      <div className={styles.achievement}>
        <GraduationCap size={26} />
        <div>
          <strong>للإنجاز، أثر.</strong>
          <span>اختبارات وشهادات داخل مسار التعلم</span>
        </div>
        <Check size={17} />
      </div>
      <small className={styles.visualCaption}>
        تصوّر لمسار الطالب · بياناتك الفعلية تظهر بعد الدخول
      </small>
    </div>
  );
}

export function AdminWorld() {
  return (
    <div
      className={styles.adminVisual}
      aria-label="تصور توضيحي لوحدات الإدارة الحالية، لا إحصاءات فعلية"
    >
      <svg
        viewBox="0 0 500 290"
        className={styles.adminGrid}
        aria-hidden="true"
      >
        <path d="M0 40h500M0 110h500M0 180h500M0 250h500M50 0v290M150 0v290M250 0v290M350 0v290M450 0v290" />
        <path
          d="M50 235L150 180l100 20 100-95 100-40"
          className={styles.chartLine}
        />
        <circle cx="350" cy="105" r="7" />
      </svg>
      <div className={styles.controlBar}>
        <ShieldCheck size={18} />
        <span>{brand.name} / OPERATIONS</span>
        <span className={styles.statusDot} />
      </div>
      <div className={styles.operations}>
        <div>
          <Layers3 size={22} />
          <strong>البرامج</strong>
          <span>المقررات والدبلومات</span>
        </div>
        <div>
          <Users size={22} />
          <strong>المتعلمون</strong>
          <span>التسجيل والمتابعة</span>
        </div>
        <div>
          <BarChart3 size={22} />
          <strong>التقارير</strong>
          <span>رؤية التشغيل التعليمي</span>
        </div>
      </div>
      <div className={styles.reportStrip}>
        <span>نظرة عامة</span>
        <span>التقدم والنتائج</span>
        <ArrowUpLeft size={18} />
      </div>
      <small className={styles.visualCaption}>
        تصوّر للوحدات الحالية · ليس تقريرًا بإحصاءات حقيقية
      </small>
    </div>
  );
}
