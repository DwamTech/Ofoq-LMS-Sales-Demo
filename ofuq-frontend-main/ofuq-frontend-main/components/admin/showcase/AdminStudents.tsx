"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, Award, Search } from "lucide-react";
import {
  academicCourseComplete,
  adminNumber,
  certificateIssued,
  type StudentList,
  type StudentDetail,
  type ExamDetail,
  type AdminCertificate,
} from "@/utils/adminShowcase";
import { useAdmin } from "./AdminProvider";
import {
  Badge,
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

export function ShowcaseStudentLink() {
  const read = useAdminRead<StudentList>("/admin/showcase/students?showcase=1");
  const student = read.data?.data[0];
  if (!student) return <ReadState error={read.error} retry={read.retry} />;
  return (
    <Link
      className={styles.showcaseLink}
      href={`/admin/students/${student.id}`}
    >
      <span className={styles.avatar}>{student.name.slice(0, 1)}</span>
      <div>
        <strong>رحلة العرض: {student.name}</strong>
        <p>
          من دبلومة Python إلى إنجاز تطوير الويب؛ تسجيلات وتقدم واختبار وشهادات
          محفوظة.
        </p>
      </div>
      <ArrowUpLeft size={20} />
    </Link>
  );
}
export function Students() {
  const [input, setInput] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const read = useAdminRead<StudentList>(
    `/admin/showcase/students?per_page=20&page=${page}&search=${encodeURIComponent(search)}`,
  );
  return (
    <>
      <Intro
        eyebrow="المجتمع التعليمي"
        title="كل طالب، رحلة يمكن متابعتها"
        description="سجلات اصطناعية مصرح بعرضها. نعرض الهوية التعليمية، دون أرقام اتصال أو تاريخ ميلاد."
      />
      <ShowcaseStudentLink />
      <form
        className={styles.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input);
          setPage(1);
        }}
      >
        <label className={styles.search}>
          <Search size={18} />
          <span className={styles.srOnly}>اسم الطالب</span>
          <input
            type="search"
            placeholder="ابحث باسم الطالب…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <button className={styles.primary} type="submit" data-demo-allow>
          بحث في السجلات
        </button>
      </form>
      {!read.data ? (
        <ReadState error={read.error} retry={read.retry} />
      ) : (
        <Panel
          title="دليل الطلاب"
          description="بحث وترقيم صفحات على الخادم؛ لا نجلب جميع الطلاب إلى المتصفح"
        >
          <Table
            caption="الطلاب وتسجيلاتهم التعليمية"
            headers={[
              "الطالب",
              "تسجيلات الدبلومات",
              "تسجيلات المقررات",
              "الرحلة",
            ]}
          >
            {read.data.data.map((student) => (
              <tr key={student.id}>
                <td>
                  <strong>{student.name}</strong>
                </td>
                <td>{adminNumber(student.diplomas_count)}</td>
                <td>{adminNumber(student.courses_count)}</td>
                <td>
                  <Link
                    className={styles.textLink}
                    href={`/admin/students/${student.id}`}
                  >
                    عرض السجل ←
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
          {!read.data.data.length && <p>لا توجد نتائج مطابقة.</p>}
          <Pagination meta={read.data.pagination} onPage={setPage} />
        </Panel>
      )}
      <MutationNote label="إدارة حسابات الطلاب وحظرها" />
    </>
  );
}
function CertificatesTable({
  certificates,
}: {
  certificates: AdminCertificate[];
}) {
  return (
    <>
      <Table
        caption="الشهادات المحفوظة لهذا الطالب، ليست إجمالي المؤسسة"
        headers={["الإنجاز", "النوع", "حالة السجل", "الرقم والتحقق"]}
      >
        {certificates.map((c) => (
          <tr key={`${c.source}-${c.id}`}>
            <td>
              <strong>{c.program}</strong>
            </td>
            <td>{c.source === "diploma" ? "دبلومة" : "مقرر"}</td>
            <td>
              <Badge tone={certificateIssued(c) ? "success" : "warning"}>
                {certificateIssued(c)
                  ? "صادرة حسب سجل النظام"
                  : c.status === "pending"
                    ? "قيد الإصدار"
                    : c.status}
              </Badge>
            </td>
            <td>
              <bdi>{c.serial_number ?? "لا يوجد رقم صادر"}</bdi>
              {certificateIssued(c) && (
                <Link
                  className={styles.textLink}
                  href={`/verify-certificate?s=${encodeURIComponent(c.serial_number!)}`}
                >
                  التحقق من الشهادة ←
                </Link>
              )}
            </td>
          </tr>
        ))}
      </Table>
      {!certificates.length && <p>لا توجد شهادات محفوظة لهذا الطالب.</p>}
      <p className={styles.sourceNote}>
        تواريخ إنشاء السجل والإكمال والإصدار تختلف في البيانات الحالية؛ لا نعرض
        تاريخًا موحّدًا مضللًا. تنزيل الشهادة محفوظ لمسار الطالب المالك؛ لا
        نتجاوز صلاحيات التنزيل من حساب الإدارة.
      </p>
    </>
  );
}
export function StudentRecord({
  id,
  view = "journey",
}: {
  id: number;
  view?: string;
}) {
  const read = useAdminRead<{ data: StudentDetail }>(
    `/admin/showcase/students/${id}`,
  );
  if (!read.data) return <ReadState error={read.error} retry={read.retry} />;
  const student = read.data.data;
  const completed = student.courses.filter(academicCourseComplete);
  return (
    <>
      <Intro
        eyebrow="طلاب / السجل التعليمي"
        title={student.student.name}
        description="من التسجيل إلى التقييم والإنجاز؛ قراءة مباشرة للسجلات التعليمية المصرح بها."
      />
      <div className={styles.tabs}>
        <Link
          href={`/admin/students/${id}`}
          aria-current={view === "journey" ? "page" : undefined}
        >
          رحلة التعلّم
        </Link>
        <Link
          href={`/admin/students/${id}?view=exams`}
          aria-current={view === "exams" ? "page" : undefined}
        >
          الاختبارات والتقييم
        </Link>
        <Link
          href={`/admin/students/${id}?view=certificates`}
          aria-current={view === "certificates" ? "page" : undefined}
        >
          الشهادات والإنجاز
        </Link>
        <Link href={`/admin/reports/students/${id}`}>التقرير التعليمي ←</Link>
      </div>
      <div className={styles.metrics}>
        <Metric
          label="مقررات مسجّل بها"
          value={student.courses.length}
          definition="التسجيلات المباشرة لهذا الطالب"
        />
        <Metric
          label="مقررات مكتملة أكاديميًا"
          value={completed.length}
          definition="حالة إكمال المقرر مع النجاح في الاختبار النهائي؛ لا يكفي تقدم الدروس ١٠٠٪"
        />
        <Metric
          label="شهادات صادرة في السجل"
          value={student.certificates.filter(certificateIssued).length}
          definition="شهادات مقرر ودبلومة لهذا الطالب؛ لا تشمل السجلات المعلقة"
        />
      </div>
      {view === "certificates" ? (
        <Panel
          title="الإنجاز المعتمد"
          description="من جداول شهادات المقرر والدبلومة، لا من روابط إصدار قديمة"
        >
          <CertificatesTable certificates={student.certificates} />
        </Panel>
      ) : (
        <>
          {view === "journey" && (
            <Panel
              title="البرامج المسجّل بها"
              description="النسبة الأكاديمية = المقررات المطلوبة المكتملة والناجحة، وليست متوسط الدروس"
            >
              <div className={styles.diplomaProgress}>
                {student.diplomas.map((d) => (
                  <div key={d.category_id}>
                    <Link href={`/admin/diplomas/${d.category_id}`}>
                      <h2>{d.name}</h2>
                    </Link>
                    <Progress
                      label="الإكمال الأكاديمي"
                      value={d.progress_percentage}
                    />
                    <Badge
                      tone={
                        d.progress_percentage === 100 ? "success" : "neutral"
                      }
                    >
                      {d.progress_percentage === 100
                        ? "مكتملة أكاديميًا"
                        : "قيد التعلّم"}{" "}
                      · {d.status === "active" ? "اشتراك نشط" : d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          <Panel
            title={
              view === "exams" ? "سياق التقييم الفعلي" : "التقدم داخل المقررات"
            }
            description="تقدم الدروس وحالة الاختبار مؤشران مستقلان؛ لا نخلط مشاهدة المحتوى بالنجاح الأكاديمي"
          >
            <Table
              caption="تقدم الطالب وحالة الاختبارات"
              headers={[
                "المقرر",
                "تقدم الدروس",
                "النتيجة الأكاديمية",
                "الاختبار",
                "السياق",
              ]}
            >
              {student.courses.map((course) => (
                <tr key={course.course_id}>
                  <td>
                    <Link href={`/admin/courses/${course.course_id}`}>
                      {course.title}
                    </Link>
                  </td>
                  <td>
                    <Progress
                      label="دروس مكتملة"
                      value={course.progress_percentage}
                    />
                  </td>
                  <td>
                    <Badge
                      tone={
                        academicCourseComplete(course) ? "success" : "neutral"
                      }
                    >
                      {academicCourseComplete(course)
                        ? "مكتمل أكاديميًا"
                        : "لم يكتمل أكاديميًا"}
                    </Badge>
                  </td>
                  <td>
                    <span>
                      {course.exam_status === "in_progress"
                        ? "محاولة جارية"
                        : course.exam_status === "submitted"
                          ? "محاولة مُسلّمة"
                          : course.has_final_exam
                            ? "لم يبدأ"
                            : "بدون اختبار"}
                    </span>
                    {course.exam_score !== null && (
                      <small>
                        الدرجة: {adminNumber(Number(course.exam_score))}٪
                      </small>
                    )}
                  </td>
                  <td>
                    {course.has_final_exam && (
                      <Link
                        className={styles.textLink}
                        href={`/admin/exams?course=${course.course_id}&student=${id}`}
                      >
                        فحص الاختبار ←
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </Panel>
          {view === "journey" && (
            <Panel
              title="شهادات الطالب"
              description="الحالة والرقم من السجل، والتحقق عبر المسار العام"
            >
              <CertificatesTable certificates={student.certificates} />
            </Panel>
          )}
        </>
      )}
      <MutationNote label="تعديل حساب الطالب أو إصدار شهادة" />
    </>
  );
}
export function CertificateOverview() {
  const read = useAdminRead<StudentList>("/admin/showcase/students?showcase=1");
  const student = read.data?.data[0];
  return (
    <>
      <Intro
        eyebrow="النتائج التعليمية"
        title="إنجاز موثّق، يمكن التحقق منه"
        description="عرض شهادات الطالب النموذجي الحقيقي داخل قاعدة العرض. ليس عدّادًا شاملًا لشهادات المؤسسة."
      />
      {!student ? (
        <ReadState error={read.error} retry={read.retry} />
      ) : (
        <CertificateRecords id={student.id} />
      )}
      <Panel
        title="من سجل الطالب إلى شهادة قابلة للتحقق"
        description="استكشف شهادات أي طالب عبر سجله التعليمي"
      >
        <Link className={styles.primary} href="/admin/students">
          <Award size={18} /> افتح دليل الطلاب <ArrowUpLeft size={17} />
        </Link>
      </Panel>
      <MutationNote label="إصدار شهادات الدبلومات" />
    </>
  );
}
function CertificateRecords({ id }: { id: number }) {
  const read = useAdminRead<{ data: StudentDetail }>(
    `/admin/showcase/students/${id}`,
  );
  if (!read.data) return <ReadState error={read.error} retry={read.retry} />;
  return (
    <Panel
      title={`شهادات ${read.data.data.student.name}`}
      description="المقرر والدبلومة نفسها في تجربة الطالب"
    >
      <CertificatesTable certificates={read.data.data.certificates} />
    </Panel>
  );
}
export function Exams({
  courseId,
  studentId,
  quizId,
}: {
  courseId?: number;
  studentId?: number;
  quizId?: number;
}) {
  const { courses } = useAdmin();
  const path = quizId
    ? `/admin/quizzes/${quizId}/questions`
    : courseId
      ? `/admin/showcase/exams/${courseId}`
      : null;
  const read = useAdminRead<{ data: ExamDetail | ExamDetail["questions"] }>(
    path,
  );
  const context = useAdminRead<{ data: StudentDetail }>(
    studentId ? `/admin/showcase/students/${studentId}` : null,
  );
  if (!courseId && !quizId)
    return (
      <>
        <Intro
          eyebrow="قياس التعلّم"
          title="الاختبارات، في سياقها الصحيح"
          description="اختر مقررًا لفحص الاختبار النهائي وأسئلته ومحاولاته المحفوظة؛ لا تبدأ محاولة جديدة."
        />
        <ShowcaseStudentLink />
        <Panel
          title="اختبارات المقررات"
          description="وجود الاختبار وعدد أسئلته يؤكَّدان عند فتح السياق"
        >
          <div className={styles.programRows}>
            {courses.map((course) => (
              <Link key={course.id} href={`/admin/exams?course=${course.id}`}>
                <div>
                  <strong>{course.title}</strong>
                  <small>فحص الاختبار النهائي المرتبط بالمقرر</small>
                </div>
                <ArrowUpLeft size={18} />
              </Link>
            ))}
          </div>
        </Panel>
      </>
    );
  if (!read.data) return <ReadState error={read.error} retry={read.retry} />;
  const exam = Array.isArray(read.data.data) ? null : read.data.data;
  const questions = Array.isArray(read.data.data)
    ? read.data.data
    : read.data.data.questions;
  const studentCourse = context.data?.data.courses.find(
    (c) => c.course_id === courseId,
  );
  return (
    <>
      <Intro
        eyebrow="اختبارات / عرض للقراءة فقط"
        title={exam?.exam.title ?? "تقييم الدرس"}
        description={
          exam?.course.title ??
          "أسئلة فعلية من بنك التقييم. لا يتم حفظ إجابات أو تعديل الأسئلة."
        }
      />
      <div className={styles.breadcrumb}>
        <Link href="/admin/exams">كل الاختبارات ←</Link>
        {studentId && (
          <Link href={`/admin/students/${studentId}?view=exams`}>
            العودة إلى سجل الطالب ←
          </Link>
        )}
      </div>
      {studentId && !context.data ? (
        <ReadState error={context.error} retry={context.retry} />
      ) : (
        studentCourse && (
          <div className={styles.guide}>
            <strong>{context.data?.data.student.name}</strong>
            <Badge
              tone={
                studentCourse.exam_status === "in_progress"
                  ? "warning"
                  : "neutral"
              }
            >
              {studentCourse.exam_status === "in_progress"
                ? "محاولة جارية"
                : studentCourse.exam_status === "submitted"
                  ? "محاولة مُسلّمة"
                  : "لم يبدأ"}
            </Badge>
            <span>
              تقدم الدروس {adminNumber(studentCourse.progress_percentage)}٪ · لا
              يتم تغيير حالة المحاولة
            </span>
          </div>
        )
      )}
      <div className={styles.metrics}>
        <Metric
          label="أسئلة فعلية"
          value={questions.length}
          definition="من علاقة الاختبار والأسئلة، دون تشغيل محاولة"
        />
        {exam &&
          Object.entries(exam.attempts_by_status).map(([status, count]) => (
            <Metric
              key={status}
              label={
                status === "in_progress"
                  ? "محاولات جارية"
                  : status === "submitted"
                    ? "محاولات مُسلّمة"
                    : `محاولات: ${status}`
              }
              value={Number(count)}
              definition="عدد سجلات المحاولات لهذا الاختبار · ليس عدد طلاب فريدين"
            />
          ))}
      </div>
      <Panel
        title="بنك الأسئلة"
        description="عرض نص السؤال والبدائل؛ لا نعرض مفاتيح الإجابة ولا نتيح تعديلها"
      >
        <div className={styles.questions}>
          {questions.map((q, index) => (
            <article key={q.id}>
              <span className={styles.eyebrow}>
                السؤال {adminNumber(index + 1)}
              </span>
              <h2>{q.question}</h2>
              <ol>
                {q.options.map((option, i) => (
                  <li key={i}>
                    {typeof option === "string"
                      ? option
                      : "بديل غير نصي؛ راجع بنية السؤال"}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
        {!questions.length && <p>لا توجد أسئلة محفوظة لهذا الاختبار.</p>}
      </Panel>
      <MutationNote label="إضافة وتعديل أسئلة الاختبار" />
    </>
  );
}
