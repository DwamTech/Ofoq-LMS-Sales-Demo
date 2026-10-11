"use client";
import { useState } from "react";
import Link from "next/link";
import {
  adminNumber,
  adminDate,
  type Beneficiaries,
  type DetailReport,
  type Overview,
} from "@/utils/adminShowcase";
import { useAdmin } from "./AdminProvider";
import {
  Intro,
  Badge,
  Metric,
  Pagination,
  Panel,
  ReadState,
  Table,
  useAdminRead,
} from "./AdminPrimitives";
import { WatchChart } from "./AdminOverview";
import { ReportStudents } from "./AdminCatalog";
import styles from "./AdminShowcase.module.css";
export function Reports({
  beneficiaries = false,
}: {
  beneficiaries?: boolean;
}) {
  const { diplomas } = useAdmin();
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [diploma, setDiploma] = useState(""),
    [query, setQuery] = useState("");
  const [period, setPeriod] = useState("كامل السجل المحفوظ");
  const read = useAdminRead<{ data: Overview | Beneficiaries }>(
    `/admin/reports/${beneficiaries ? "beneficiaries" : "overview"}?limit=5${query}`,
  );
  return (
    <>
      <Intro
        eyebrow="التقارير التعليمية"
        title={
          beneficiaries
            ? "المستفيدون والإنجاز الأكاديمي"
            : "اقرأ الأثر، من سجلاته"
        }
        description={
          beneficiaries
            ? "طلاب فريدون، وتسجيلات وإكمال أكاديمي قابل للتتبع. الفترة هي فترة التسجيل، لا وقت حدوث الإكمال."
            : "النشاط التعليمي المحفوظ، دون ادّعاء نمو تاريخي أو استخدام مباشر من مزوّد الفيديو."
        }
      />
      <div className={styles.tabs}>
        <Link
          href="/admin/reports"
          aria-current={!beneficiaries ? "page" : undefined}
        >
          نشاط التعلّم
        </Link>
        <Link
          href="/admin/reports/beneficiaries"
          aria-current={beneficiaries ? "page" : undefined}
        >
          المستفيدون والإنجاز
        </Link>
        <Link href="/admin/reports/students">تقارير الطلاب</Link>
        <Link href="/admin/reports/courses">تقارير المقررات</Link>
        <Link href="/admin/reports/diplomas">تقارير البرامج</Link>
      </div>
      <form
        className={styles.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (from) params.set("from", `${from}T00:00:00`);
          if (to) params.set("to", `${to}T23:59:59`);
          if (diploma && !beneficiaries) params.set("category_id", diploma);
          setQuery("&" + params.toString());
          setPeriod(
            from || to
              ? `${from || "بداية السجل"} — ${to || "نهاية السجل"}`
              : "كامل السجل المحفوظ",
          );
        }}
      >
        <label>
          من تاريخ
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          إلى تاريخ
          <input
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        {!beneficiaries && (
          <label>
            البرنامج
            <select
              value={diploma}
              onChange={(e) => setDiploma(e.target.value)}
            >
              <option value="">كل البرامج</option>
              {diplomas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className={styles.primary} type="submit" data-demo-allow>
          تطبيق النطاق
        </button>
      </form>
      {!read.data ? (
        <ReadState error={read.error} retry={read.retry} />
      ) : beneficiaries ? (
        <BeneficiaryContent
          data={read.data.data as Beneficiaries}
          period={period}
        />
      ) : (
        <ActivityContent data={read.data.data as Overview} period={period} />
      )}
      <div className={styles.sourceNote}>
        مصدر البيانات: واجهات التقارير التعليمية الحالية. جميع الأرقام داخل
        قاعدة عرض اصطناعية، وليست مؤشرات نجاح تجاري أو فواتير. لا ننشئ ملف تصدير
        أو سجل مزامنة.
      </div>
    </>
  );
}
function ActivityContent({ data, period }: { data: Overview; period: string }) {
  return (
    <>
      <div className={styles.metrics}>
        <Metric
          label="طلاب لهم نشاط"
          value={data.summary.active_students}
          definition={`طلاب متميزون بجلسات مشاهدة · ${period}`}
        />
        <Metric
          label="جلسات مشاهدة محفوظة"
          value={data.summary.total_watch_sessions}
          definition="الجلسة تُرشَّح بتاريخ بدايتها والبرنامج، وليست زيارة موقع"
        />
        <Metric
          label="مدة المشاهدة (دقيقة)"
          value={data.summary.total_watch_duration_seconds / 60}
          definition="مجموع الثواني المحفوظة ÷ ٦٠ · نطاق التقرير"
        />
        <Metric
          label="سجلات إكمال دروس"
          value={data.summary.completed_lessons_count}
          definition="طالب/درس مكتمل · مرشّح بتاريخ تحديث سجل التقدم"
        />
      </div>
      <WatchChart data={data} period={period} />
      <Panel
        title="النشاط المسجّل"
        description="مرتّب بآخر حدث داخل النطاق المختار"
      >
        <Table
          caption="جلسات النشاط التعليمية الأخيرة"
          headers={["الطالب", "الدرس", "مدة الجلسة (ثانية)", "آخر حدث"]}
        >
          {data.recent_activity.map((a, i) => (
            <tr key={`${a.student_id}-${a.lesson_id}-${i}`}>
              <td>
                <Link href={`/admin/students/${a.student_id}`}>
                  {a.student_name}
                </Link>
              </td>
              <td>
                <Link href={`/admin/reports/lessons/${a.lesson_id}`}>
                  {a.lesson_title}
                </Link>
              </td>
              <td>{adminNumber(a.watched_seconds)}</td>
              <td>
                <bdi>{adminDate(a.last_event_at)}</bdi>
              </td>
            </tr>
          ))}
        </Table>
        {!data.recent_activity.length && (
          <p>لا توجد جلسات نشاط في هذه الفترة.</p>
        )}
      </Panel>
    </>
  );
}
function BeneficiaryContent({
  data,
  period,
}: {
  data: Beneficiaries;
  period: string;
}) {
  const { diplomas } = useAdmin();
  return (
    <>
      <div className={styles.metrics}>
        <Metric
          label="مستفيدون فريدون"
          value={data.summary.total_beneficiaries}
          definition={`دمج طلاب الدبلومات والمقررات دون تكرار · تسجيلات ${period}`}
        />
        <Metric
          label="أكملوا مقررًا واحدًا على الأقل"
          value={data.summary.completed_any_course}
          definition="طلاب فريدون من حالة إكمال تسجيل المقرر المحفوظة؛ ليست شهادات صادرة"
        />
        <Metric
          label="أكملوا دبلومة واحدة على الأقل"
          value={data.summary.completed_any_diploma}
          definition="خدمة الإكمال الأكاديمي: المقررات المطلوبة واختباراتها"
        />
      </div>
      <Panel
        title="الإنجاز حسب البرنامج"
        description={`${data.filters.period_definition} القيم تشمل السجلات غير المنشورة؛ لا يغيّر التقرير حالة النشر.`}
      >
        <Table
          caption="المستفيدون والإكمال لكل دبلومة"
          headers={[
            "البرنامج",
            "المستفيدون",
            "المكتملون أكاديميًا",
            "نسبة الإكمال",
          ]}
        >
          {data.diplomas.map((d) => (
            <tr key={d.diploma_id}>
              <td>
                <Link href={`/admin/diplomas/${d.diploma_id}`}>
                  {d.diploma_name}{" "}
                  <Badge>
                    {diplomas.find((record) => record.id === d.diploma_id)
                      ?.is_published
                      ? "منشور"
                      : "غير منشور"}
                  </Badge>
                </Link>
              </td>
              <td>{adminNumber(d.beneficiaries_count)}</td>
              <td>{adminNumber(d.completed_count)}</td>
              <td>{adminNumber(d.completion_rate)}٪</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
const definitions: Record<string, { label: string; unit: string }> = {
  enrolled_students_count: { label: "طلاب مسجّلون", unit: "طالب متميز" },
  started_students_count: {
    label: "طلاب لهم جلسات مشاهدة",
    unit: "طالب متميز",
  },
  completed_students_count: {
    label: "الإكمال بحسب التقرير",
    unit: "طالب؛ حالة المقرر المحفوظة أو إكمال الدبلومة الأكاديمي",
  },
  not_started_students_count: {
    label: "بلا جلسة مشاهدة محفوظة",
    unit: "طالب؛ ليس دليلًا على عدم بدء الدروس",
  },
  average_completion_percentage: {
    label: "متوسط التقدم",
    unit: "٪ · تقدم دروس للمقرر / إكمال أكاديمي للدبلومة",
  },
  total_watch_duration_seconds: {
    label: "مدة المشاهدة المحفوظة",
    unit: "ثانية",
  },
  completed_lessons_count: {
    label: "سجلات إكمال الدروس",
    unit: "زوج طالب/درس",
  },
  opened_students_count: { label: "فتحوا جلسة للدرس", unit: "طالب متميز" },
  completed_students_count_lesson: {
    label: "أكملوا الدرس",
    unit: "طالب متميز",
  },
  enrolled_not_opened_count: {
    label: "مسجّلون بلا جلسة للدرس",
    unit: "طالب متميز",
  },
  average_watch_duration_seconds: { label: "متوسط مدة الجلسة", unit: "ثانية" },
  watch_sessions_count: { label: "جلسات مشاهدة", unit: "جلسة" },
  completions_count: {
    label: "جلسات موسومة مكتملة",
    unit: "جلسة؛ لا تعادل إكمال برنامج",
  },
};
export function EntityReport({
  kind,
  id,
}: {
  kind: "courses" | "diplomas" | "lessons";
  id: number;
}) {
  const [page, setPage] = useState(1);
  const read = useAdminRead<{ data: DetailReport }>(
    `/admin/reports/${kind}/${id}?per_page=10&students_page=${page}`,
  );
  if (!read.data) return <ReadState error={read.error} retry={read.retry} />;
  const data = read.data.data;
  return (
    <>
      <Intro
        eyebrow="تقارير / سياق تعليمي"
        title={
          data.course?.title ??
          data.diploma?.name ??
          data.lesson?.title ??
          "تقرير تعليمي"
        }
        description="كامل السجل المحفوظ؛ المؤشرات من استجابة التقرير الفعلية، دون تقديرات مالية أو استخدام خارجي."
      />
      <div className={styles.breadcrumb}>
        <Link href="/admin/reports">كل التقارير ←</Link>
        {kind === "courses" && (
          <Link href={`/admin/courses/${id}`}>محتوى المقرر ←</Link>
        )}
        {kind === "diplomas" && (
          <Link href={`/admin/diplomas/${id}`}>تفاصيل البرنامج ←</Link>
        )}
      </div>
      <div className={styles.metrics}>
        {Object.entries(data.summary ?? {})
          .filter(([key]) => definitions[key])
          .map(([key, value]) => (
            <Metric
              key={key}
              label={definitions[key].label}
              value={Number(value)}
              definition={definitions[key].unit}
            />
          ))}
      </div>
      <ReportStudents report={data} onPage={setPage} />
    </>
  );
}
export function Instructors() {
  const [page, setPage] = useState(1);
  const read = useAdminRead<{
    data: {
      data: { id: number; name: string; title: string; bio?: string }[];
      current_page: number;
      last_page: number;
      total: number;
    };
  }>(`/admin/instructors?per_page=12&page=${page}`);
  return (
    <>
      <Intro
        eyebrow="الفريق الأكاديمي"
        title="الخبرة التي تقود التعلّم"
        description="المحاضرون المسجّلون في قاعدة العرض؛ ليسوا فريقًا تجاريًا فعليًا."
      />
      {!read.data ? (
        <ReadState error={read.error} retry={read.retry} />
      ) : (
        <Panel
          title="المحاضرون"
          description="بيانات تعريف تعليمية، دون معلومات اتصال"
        >
          <div className={styles.instructorGrid}>
            {read.data.data.data.map((i) => (
              <article key={i.id}>
                <span className={styles.avatar}>{i.name.slice(0, 1)}</span>
                <h2>{i.name}</h2>
                <strong>{i.title}</strong>
                <p>{i.bio ?? "لا توجد نبذة محفوظة."}</p>
              </article>
            ))}
          </div>
          <Pagination meta={read.data.data} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}
