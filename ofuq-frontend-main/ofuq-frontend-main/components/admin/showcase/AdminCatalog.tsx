"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, BookOpen, Search } from "lucide-react";
import {
  adminNumber,
  plainDescription,
  type DetailReport,
} from "@/utils/adminShowcase";
import { useAdmin } from "./AdminProvider";
import {
  Badge,
  Horizon,
  Intro,
  Metric,
  MutationNote,
  Pagination,
  Panel,
  Progress,
  ReadState,
  Table,
  useAdminRead,
} from "./AdminPrimitives";
import styles from "./AdminShowcase.module.css";
export function Catalog({ kind }: { kind: "diplomas" | "courses" }) {
  const { diplomas, courses } = useAdmin();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("published");
  const records = (
    kind === "diplomas"
      ? diplomas.map((d) => ({ ...d, title: d.name }))
      : courses
  ).filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || d.is_published === (status === "published")),
  );
  return (
    <>
      <Intro
        eyebrow="الهيكل التعليمي"
        title={
          kind === "diplomas"
            ? "برامج تصنع مسارات واضحة"
            : "مكتبة المقررات والمحتوى"
        }
        description={
          kind === "diplomas"
            ? "من البرنامج إلى مقرراته وطلابه؛ العلاقات نفسها التي تظهر في تجربة التعلّم."
            : "المحتوى الفعلي، منظّمًا داخل برامجه. النشر والمحتوى قابلان للفحص دون تعديل."
        }
      />
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={18} />
          <span className={styles.srOnly}>ابحث بالاسم</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              kind === "diplomas" ? "ابحث عن دبلومة…" : "ابحث عن مقرر…"
            }
          />
        </label>
        <label>
          حالة النشر
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="published">منشور</option>
            <option value="draft">غير منشور</option>
            <option value="all">كل السجلات</option>
          </select>
        </label>
        <Badge>{adminNumber(records.length)} نتيجة</Badge>
      </div>
      {kind === "diplomas" ? (
        <div className={styles.programGrid}>
          {records.map((record, index) => {
            const diploma = diplomas.find((d) => d.id === record.id)!;
            return (
              <article key={record.id} className={styles.programCard}>
                <div
                  className={`${styles.programArt} ${styles["art" + (index % 3)]}`}
                >
                  <Badge tone={record.is_published ? "success" : "neutral"}>
                    {record.is_published ? "منشور" : "غير منشور"}
                  </Badge>
                  <Horizon />
                  <span>
                    {String(index + 1).padStart(2, "0")} / LEARNING PATH
                  </span>
                </div>
                <div className={styles.programBody}>
                  <small>{diploma.section?.name ?? "برنامج تعليمي"}</small>
                  <h2>{record.title}</h2>
                  <p>
                    {plainDescription(record.description) ||
                      "لا يوجد وصف محفوظ."}
                  </p>
                  <div>
                    <span>
                      <BookOpen size={16} />{" "}
                      {adminNumber(diploma.courses_count)} مقررات
                    </span>
                    <Link href={`/admin/diplomas/${record.id}`}>
                      استكشف البرنامج <ArrowUpLeft size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Panel
          title="المقررات المسجّلة"
          description="عداد الطلاب = تسجيلات مقررات مباشرة؛ لا نجمعه باعتباره طلابًا فريدين"
        >
          <Table
            caption="المقررات وعلاقاتها وحالة النشر"
            headers={[
              "المقرر",
              "البرنامج",
              "المحتوى",
              "التسجيلات",
              "النشر",
              "التفاصيل",
            ]}
          >
            {records.map((record) => {
              const course = courses.find((c) => c.id === record.id)!;
              const diploma = diplomas.find((d) => d.id === course.category_id);
              return (
                <tr key={course.id}>
                  <td>
                    <strong>{course.title}</strong>
                    <small>{course.instructor?.name}</small>
                  </td>
                  <td>
                    {diploma ? (
                      <Link href={`/admin/diplomas/${diploma.id}`}>
                        {diploma.name}
                      </Link>
                    ) : (
                      "غير مرتبط"
                    )}
                  </td>
                  <td>
                    {adminNumber(course.chapters.length)} فصول ·{" "}
                    {adminNumber(course.lessons_count)} درسًا
                  </td>
                  <td>{adminNumber(course.students_count)}</td>
                  <td>
                    <Badge tone={course.is_published ? "success" : "neutral"}>
                      {course.is_published ? "منشور" : "غير منشور"}
                    </Badge>
                  </td>
                  <td>
                    <Link
                      className={styles.textLink}
                      href={`/admin/courses/${course.id}`}
                    >
                      عرض المحتوى ←
                    </Link>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Panel>
      )}
      {!records.length && (
        <div className={styles.state}>
          لا توجد نتائج مطابقة. غيّر البحث أو حالة النشر.
        </div>
      )}
      <MutationNote
        label={
          kind === "diplomas" ? "إضافة وتعديل البرامج" : "إضافة وتعديل المقررات"
        }
      />
    </>
  );
}
export function DiplomaDetail({ id }: { id: number }) {
  const { diplomas, courses } = useAdmin();
  const diploma = diplomas.find((d) => d.id === id);
  const members = courses.filter((c) => c.category_id === id);
  const [page, setPage] = useState(1);
  const report = useAdminRead<{ data: DetailReport }>(
    diploma
      ? `/admin/reports/diplomas/${id}?per_page=10&students_page=${page}`
      : null,
  );
  if (!diploma)
    return (
      <Intro
        title="البرنامج غير موجود"
        description="لا يوجد برنامج بهذا المعرّف في البيانات المصرّح بها."
      />
    );
  return (
    <>
      <Intro
        eyebrow="برامج / تفاصيل الدبلومة"
        title={diploma.name}
        description={plainDescription(diploma.description)}
      >
        <Badge tone={diploma.is_published ? "success" : "neutral"}>
          {diploma.is_published ? "منشور" : "غير منشور"}
        </Badge>
      </Intro>
      <div className={styles.breadcrumb}>
        <Link href="/admin/diplomas">كل البرامج</Link>
        {diploma.is_published && (
          <Link href={`/diplomas/${encodeURIComponent(diploma.slug)}`}>
            الصفحة العامة ←
          </Link>
        )}
        <Link href={`/admin/reports/diplomas/${id}`}>التقرير التعليمي ←</Link>
      </div>
      <Panel
        title="المقررات داخل هذا المسار"
        description={`${adminNumber(members.length)} مقررات فعلية مرتبطة بالبرنامج، بما فيها غير المنشور`}
      >
        <div className={styles.programRows}>
          {members.map((course, index) => (
            <Link href={`/admin/courses/${course.id}`} key={course.id}>
              <span className={styles.rowNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{course.title}</strong>
                <small>
                  {adminNumber(course.lessons_count)} درسًا ·{" "}
                  {course.is_published ? "منشور" : "غير منشور"}
                </small>
              </div>
              <ArrowUpLeft size={18} />
            </Link>
          ))}
        </div>
        {!members.length && (
          <p>لا توجد مقررات مرتبطة بهذا السجل. لم نغيّر أو نحذف علاقاته.</p>
        )}
      </Panel>
      {!report.data ? (
        <ReadState error={report.error} retry={report.retry} />
      ) : (
        <>
          <div className={styles.metrics}>
            <Metric
              label="طلاب مسجّلون بالبرنامج"
              value={report.data.data.summary?.enrolled_students_count ?? 0}
              definition="طلاب متميزون بتسجيل دبلومة · كامل السجل"
            />
            <Metric
              label="أكملوا البرنامج أكاديميًا"
              value={report.data.data.summary?.completed_students_count ?? 0}
              definition="إكمال المقررات المطلوبة والنجاح في الاختبارات؛ ليس مجرد حالة الاشتراك"
            />
            <Metric
              label="متوسط الإكمال الأكاديمي"
              value={
                report.data.data.summary?.average_completion_percentage ?? 0
              }
              definition="نسبة مئوية · من خدمة إكمال الدبلومات"
            />
          </div>
          <ReportStudents report={report.data.data} onPage={setPage} />
        </>
      )}
      <MutationNote label="تعديل البرنامج وحالة النشر" />
    </>
  );
}
export function ReportStudents({
  report,
  onPage,
}: {
  report: DetailReport;
  onPage: (page: number) => void;
}) {
  return (
    <Panel
      title="الطلاب المرتبطون"
      description="من تقرير الكيان؛ التقدم على مستوى الدبلومة أكاديمي، وعلى مستوى المقرر تقدم الدروس"
    >
      <Table
        caption="الطلاب والتقدم المحفوظ"
        headers={["الطالب", "التقدم", "الحالة", "السجل"]}
      >
        {report.students?.data.map((student) => (
          <tr key={student.student_id}>
            <td>{student.name ?? student.student_name}</td>
            <td>
              <Progress label="التقدم" value={student.progress_percentage} />
            </td>
            <td>
              <Badge>
                {student.status === "completed"
                  ? "مكتمل حسب التقرير"
                  : student.status === "active"
                    ? "تسجيل نشط"
                    : "قيد التعلّم"}
              </Badge>
            </td>
            <td>
              <Link
                className={styles.textLink}
                href={`/admin/students/${student.student_id}`}
              >
                رحلة الطالب ←
              </Link>
            </td>
          </tr>
        ))}
      </Table>
      {!report.students?.data.length && <p>لا يوجد طلاب في النطاق الحالي.</p>}
      {report.students && (
        <Pagination meta={report.students.pagination} onPage={onPage} />
      )}
    </Panel>
  );
}
export function CourseContent({
  id,
  chapterId,
  lessonId,
}: {
  id: number;
  chapterId?: number;
  lessonId?: number;
}) {
  const { courses, diplomas } = useAdmin();
  const course = courses.find((c) => c.id === id);
  const [search, setSearch] = useState("");
  if (!course)
    return (
      <Intro
        title="المقرر غير موجود"
        description="المعرّف لا يطابق مقررًا في القائمة المصرّح بها."
      />
    );
  const diploma = diplomas.find((d) => d.id === course.category_id);
  const chapters = course.chapters.filter(
    (ch) => !chapterId || ch.id === chapterId,
  );
  const lessons = chapters
    .flatMap((ch) => ch.lessons)
    .filter(
      (l) => (!lessonId || l.id === lessonId) && l.title.includes(search),
    );
  return (
    <>
      <Intro
        eyebrow="مقررات / الهيكل التعليمي"
        title={course.title}
        description={plainDescription(course.description)}
      >
        <Badge tone={course.is_published ? "success" : "neutral"}>
          {course.is_published ? "منشور" : "غير منشور"}
        </Badge>
      </Intro>
      <div className={styles.breadcrumb}>
        {diploma && (
          <Link href={`/admin/diplomas/${diploma.id}`}>{diploma.name}</Link>
        )}
        <Link href={`/admin/reports/courses/${id}`}>تقرير المقرر ←</Link>
        <Link href={`/admin/courses/${id}/question-bank`}>
          الاختبار النهائي ←
        </Link>
      </div>
      <div className={styles.metrics}>
        <Metric
          label="فصول تعليمية"
          value={course.chapters.length}
          definition="من علاقات المقرر الحالية"
        />
        <Metric
          label="دروس"
          value={course.lessons_count}
          definition="الدروس المرتبطة بالفصول"
        />
        <Metric
          label="تسجيلات مباشرة"
          value={course.students_count}
          definition="لا تتضمن تلقائيًا كل المشتركين في الدبلومة"
        />
      </div>
      <Panel
        title="خريطة المحتوى"
        description="افتح الفصل لفحص دروسه. لا يحدث تشغيل فيديو أو تسجيل مشاهدة."
      >
        <label className={styles.search}>
          <Search size={18} />
          <span className={styles.srOnly}>ابحث في الدروس</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الدروس…"
          />
        </label>
        {chapters.map((chapter, index) => (
          <details
            key={chapter.id}
            className={styles.chapter}
            open={!!chapterId || !!search || index === 0}
          >
            <summary>
              {chapter.title}
              <span>{adminNumber(chapter.lessons.length)} دروس</span>
            </summary>
            {chapter.lessons
              .filter((l) => lessons.some((item) => item.id === l.id))
              .map((lesson) => (
                <div key={lesson.id} className={styles.lesson}>
                  <div>
                    <h3>{lesson.title}</h3>
                    <p>{plainDescription(lesson.content)}</p>
                  </div>
                  <small>
                    {adminNumber((lesson.duration_seconds ?? 0) / 60)} دقيقة
                  </small>
                  <Badge>
                    {lesson.video_url
                      ? "رابط فيديو محفوظ"
                      : "لا يوجد فيديو قابل للتشغيل"}
                  </Badge>
                  <Link
                    className={styles.textLink}
                    href={`/admin/reports/lessons/${lesson.id}`}
                  >
                    تقرير الدرس ←
                  </Link>
                  {lesson.quiz && (
                    <Link
                      className={styles.textLink}
                      href={`/admin/courses/${id}/question-bank?quiz=${lesson.quiz.id}`}
                    >
                      تقييم الدرس ←
                    </Link>
                  )}
                </div>
              ))}
          </details>
        ))}
        {!lessons.length && <p>لا توجد دروس مطابقة في هذا السياق.</p>}
      </Panel>
      <MutationNote label="تعديل الفصول والدروس ورفع المحتوى" />
    </>
  );
}
