"use client";
import { brand, publicBrandText } from "@/lib/brand";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  BookOpen,
  Users,
  Award,
  GraduationCap,
} from "lucide-react";
import {
  adminDate,
  adminNumber,
  publicationCounts,
  type Overview,
} from "@/utils/adminShowcase";
import { useAdmin } from "./AdminProvider";
import { Horizon, Metric, Panel, Table } from "./AdminPrimitives";
import styles from "./AdminShowcase.module.css";
export function WatchChart({
  data,
  period = "كامل السجل المحفوظ",
}: {
  data: Overview;
  period?: string;
}) {
  const maximum = Math.max(
    1,
    ...data.top_courses.map((c) => c.watch_duration_seconds),
  );
  return (
    <Panel
      title="أين يحدث التعلّم؟"
      description={`مدة المشاهدة المسجّلة بالدقائق · ${period} · مصدر: تقرير النشاط، لا عدد المشاهدات لدى المزوّد`}
    >
      <div
        className={styles.bars}
        role="region"
        aria-label="مقارنة مدة المشاهدة؛ القيم الدقيقة في الجدول التالي"
      >
        {data.top_courses.map((course) => (
          <div key={course.course_id}>
            <Link href={`/admin/reports/courses/${course.course_id}`}>
              {course.course_title}
            </Link>
            <span>{adminNumber(course.watch_duration_seconds / 60)} د</span>
            <div>
              <i
                style={{
                  width: `${(course.watch_duration_seconds / maximum) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {!data.top_courses.length && (
        <p>لا توجد جلسات مشاهدة في النطاق المختار.</p>
      )}
      <details className={styles.chartDetails}>
        <summary>عرض القيم الدقيقة في جدول</summary>
        <Table
          caption="مدة المشاهدة وجلساتها، من السجل المحفوظ"
          headers={["المقرر", "المدة (ثانية)", "الجلسات"]}
        >
          {data.top_courses.map((c) => (
            <tr key={c.course_id}>
              <td>{c.course_title}</td>
              <td>{adminNumber(c.watch_duration_seconds)}</td>
              <td>{adminNumber(c.sessions_count)}</td>
            </tr>
          ))}
        </Table>
      </details>
    </Panel>
  );
}
export default function AdminOverview() {
  const data = useAdmin();
  const { summary } = data.overview;
  const published = publicationCounts(data);
  const [guide, setGuide] = useState(true);
  return (
    <>
      <section className={styles.executive}>
        <div>
          <span className={styles.eyebrow}>
            {brand.name} / مركز العمليات التعليمية
          </span>
          <h1>
            الصورة الكاملة،
            <br />
            <em>تحت إدارتك.</em>
          </h1>
          <p>
            مرحبًا، {publicBrandText(data.user.name)}. من البرامج إلى إنجاز
            الطلاب، رؤية واحدة لما يحدث داخل منصتك.
          </p>
          <Link className={styles.limeLink} href="/admin/reports">
            اقرأ المشهد التعليمي <ArrowUpLeft size={18} />
          </Link>
        </div>
        <div className={styles.executiveArt}>
          {/* <Badge>بيانات محفوظة · عرض اصطناعي</Badge> */}
          <Horizon />
          {/* <span>معرفة منظّمة. أثر يمكن متابعته.</span> */}
        </div>
      </section>
      <section
        className={styles.metrics}
        aria-label="المؤشرات التعليمية الحالية"
      >
        <Metric
          label="الطلاب المسجّلون"
          value={summary.total_students}
          definition="حسابات غير إدارية · كامل قاعدة العرض · تقرير overview"
        />
        <Metric
          label="مقررات منشورة"
          value={published.courses}
          definition={`علامة النشر في سجل المقرر · من ${adminNumber(data.courses.length)} مقرر · ليست حجم صفحة الكتالوج`}
        />
        <Metric
          label="دبلومات منشورة"
          value={published.diplomas}
          definition={`علامة النشر في سجل الدبلومة · من ${adminNumber(data.diplomas.length)} سجل`}
        />
        <Metric
          label="طلاب لهم نشاط مشاهدة"
          value={summary.active_students}
          definition="طلاب متميزون بجلسة مشاهدة واحدة على الأقل · كامل السجل"
        />
      </section>
      {guide && (
        <div className={styles.guide}>
          <div>
            <strong>استكشف إمكانيات الإدارة</strong>
            <p>
              برنامج منشور ← محتواه ← طالب مسجّل ← اختبار وشهادة ← تقرير تعليمي.
            </p>
          </div>
          <Link href="/admin/diplomas">ابدأ من البرامج ←</Link>
          <button
            type="button"
            aria-label="إخفاء دليل الاستكشاف"
            onClick={() => setGuide(false)}
          >
            ×
          </button>
        </div>
      )}
      <div className={styles.twoColumns}>
        <WatchChart data={data.overview} />
        <Panel
          title="البرامج التي تبني الأثر"
          description="الدبلومات المنشورة نفسها في الموقع العام"
          href="/admin/diplomas"
        >
          <div className={styles.programRows}>
            {data.diplomas
              .filter((d) => d.is_published)
              .map((d, index) => (
                <Link key={d.id} href={`/admin/diplomas/${d.id}`}>
                  <span className={styles.rowNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{d.name}</strong>
                    <small>
                      {adminNumber(d.courses_count)} مقررات · {d.section?.name}
                    </small>
                  </div>
                  <ArrowUpLeft size={18} />
                </Link>
              ))}
          </div>
        </Panel>
      </div>
      <div className={styles.twoColumns}>
        <Panel
          title="التعلّم، كما تسجّله المنصة"
          description="سجلات تعليمية اصطناعية · كامل الفترة المحفوظة"
        >
          <div className={styles.learningTotals}>
            <Metric
              label="دروس في مكتبة المحتوى"
              value={summary.total_lessons}
              definition="عدد الدروس، وليس عدد مرات إكمالها"
            />
            <Metric
              label="سجلات إكمال دروس"
              value={summary.completed_lessons_count}
              definition="زوج طالب/درس مكتمل؛ قد يتجاوز عدد دروس المكتبة"
            />
            <Metric
              label="جلسات مشاهدة"
              value={summary.total_watch_sessions}
              definition="جلسات محفوظة؛ ليست زيارات الموقع أو مشاهدات Bunny"
            />
          </div>
        </Panel>
        <Panel
          title="آخر نشاط محفوظ"
          description="مرتّب بتاريخ آخر حدث · بيانات تجريبية وليست حركة مباشرة"
        >
          <div className={styles.activity}>
            {data.overview.recent_activity.map((a, index) => (
              <Link
                key={`${a.student_id}-${a.lesson_id}-${index}`}
                href={`/admin/students/${a.student_id}`}
              >
                <span className={styles.avatar}>
                  {a.student_name?.slice(0, 1)}
                </span>
                <div>
                  <strong>{a.student_name}</strong>
                  <p>{a.lesson_title}</p>
                  <small>
                    {adminDate(a.last_event_at)} ·{" "}
                    {adminNumber(a.watched_seconds)} ثانية
                  </small>
                </div>
              </Link>
            ))}
          </div>
          {!data.overview.recent_activity.length && <p>لا يوجد نشاط محفوظ.</p>}
        </Panel>
      </div>
      <div className={styles.shortcuts}>
        {[
          {
            label: "مكتبة المحتوى",
            text: "الفصول والدروس داخل برامجها",
            href: "/admin/course-management",
            icon: BookOpen,
          },
          {
            label: "رحلة الطالب",
            text: "التسجيل والتقدم والتقييم",
            href: "/admin/students",
            icon: Users,
          },
          {
            label: "الإنجاز المعتمد",
            text: "حالات الشهادات والتحقق",
            href: "/admin/certificates",
            icon: Award,
          },
          {
            label: "نتائج البرامج",
            text: "المستفيدون والإكمال الحقيقي",
            href: "/admin/reports/beneficiaries",
            icon: GraduationCap,
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <item.icon size={23} />
            <h2>{item.label}</h2>
            <p>{item.text}</p>
            <ArrowUpLeft size={18} />
          </Link>
        ))}
      </div>
    </>
  );
}
