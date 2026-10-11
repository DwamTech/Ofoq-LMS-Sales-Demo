"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  Download,
  ShieldCheck,
  ArrowUpLeft,
  Eye,
  X,
} from "lucide-react";
import { useStudent } from "./StudentProvider";
import { PageIntro } from "./LearningPrimitives";
import { CertificatePreview } from '@/components/brand/CertificatePreview';
import {
  issuedCertificate,
  downloadStudentCertificate,
  certificateVerificationHref,
  type StudentCertificate,
} from "@/utils/studentJourney";
import { BrandMark } from "@/components/brand/BrandMark";
import styles from "./Student.module.css";

export default function StudentCertificates() {
  const { certificates, user } = useStudent();
  const params = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<StudentCertificate | null>(null);
  const all = certificates.filter((certificate) =>
    issuedCertificate(certificate),
  );
  const scoped = all.filter(
    (certificate) =>
      (!params.get("course") ||
        String(certificate.course_id) === params.get("course")) &&
      (!params.get("diploma") ||
        String(certificate.category_id) === params.get("diploma")),
  );
  const visible = scoped.filter(
    (certificate) => filter === "all" || certificate.type === filter,
  );
  const download = async (certificate: StudentCertificate) => {
    const key = `${certificate.source}-${certificate.id}`;
    setBusy(key);
    setError("");
    try {
      const blob = await downloadStudentCertificate(certificate);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.serial_number}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("تعذّر تنزيل ملف PDF صالح. لم نولّد شهادة جديدة؛ أعد المحاولة.");
    } finally {
      setBusy("");
    }
  };
  return (
    <div data-student-page="certificates">
      <PageIntro
        eyebrow="ACHIEVEMENT / SOMETHING TO KEEP"
        title="للإنجاز، أثر يبقى."
      >
        شهاداتك الصادرة باسمك. يمكنك معاينتها، وتنزيل نسخة PDF، والتحقق من رقمها.
      </PageIntro>
      <div className={styles.certificateIntro}>
        <Award size={42} />
        <div>
          <strong>{all.length} شهادات صادرة</strong>
          <p>{user.name} · رحلات أُنجزت ووُثقت</p>
        </div>
        <Link href="/user/my-certificates">
          عرض كل الإنجازات <ArrowUpLeft size={18} />
        </Link>
      </div>
      <div className={styles.filters} aria-label="أنواع الشهادات">
        {[
          ["all", "كل الشهادات"],
          ["diploma", "الدبلومات"],
          ["course", "المقررات"],
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
      {error && (
        <p role="alert" className={styles.examNotice}>
          {error}
        </p>
      )}
      <div className={styles.certificateGrid}>
        {visible.map((certificate) => (
          <article
            key={`${certificate.source}-${certificate.id}`}
            className={styles.certificateCard}
            data-certificate-type={certificate.type}
            data-certificate-id={certificate.id}
          >
            <div className={styles.certificateArtwork}>
              <BrandMark />
              <div className={styles.certificateSeal}>
                <Award size={36} />
              </div>
              <span className={styles.kicker}>
                {certificate.type === "diploma"
                  ? "DIPLOMA ACHIEVEMENT"
                  : "COURSE ACHIEVEMENT"}
              </span>
              <h2>
                {certificate.type === "diploma"
                  ? certificate.diploma_name
                  : certificate.course_title}
              </h2>
              <p>{certificate.user_name || user.name}</p>
              <span className={styles.certificateReference}>
                <bdi>{certificate.serial_number}</bdi>
              </span>
            </div>
            <div className={styles.certificateBody}>
              {certificate.serial_number?.startsWith('OFOQ-') && <p>ملف تاريخي صُدر بالهوية السابقة؛ رقم الشهادة ومرجع التحقق محفوظان.</p>}
              <span className={styles.badge} data-complete="true">
                <ShieldCheck size={15} />
                شهادة صادرة ·{" "}
                {certificate.type === "diploma" ? "دبلومة" : "مقرر"}
              </span>
              <p>
                {certificate.source === "course"
                  ? "تاريخ إنشاء السجل"
                  : "تاريخ الإصدار"}
                :{" "}
                <bdi>
                  {new Date(certificate.issued_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </bdi>
              </p>
              {certificate.diploma_name && certificate.type === "course" && (
                <p>{certificate.diploma_name}</p>
              )}
              <div className={styles.cardActions}>
                <button
                  type="button"
                  data-certificate-download={certificate.type}
                  onClick={() => void download(certificate)}
                  disabled={!certificate.file_path || !!busy}
                >
                  <Download size={17} />
                  {busy === `${certificate.source}-${certificate.id}`
                    ? "جارٍ تنزيل PDF…"
                    : "تنزيل PDF"}
                </button>
                <Link
                  href={certificateVerificationHref(certificate)}
                  data-certificate-verify={certificate.type}
                >
                  <ShieldCheck size={17} />
                  التحقق
                </Link>
                <button type="button" onClick={() => setPreview(certificate)}>
                  <Eye size={17} />
                  معاينة الشهادة
                </button>
              </div>
              {!certificate.file_path && (
                <p>ملف PDF غير متاح؛ لن نُنشئ ملفًا في وضع العرض.</p>
              )}
            </div>
          </article>
        ))}
      </div>
      {visible.length === 0 && (
        <p className={styles.empty}>لا توجد شهادة صادرة مرتبطة بهذا السياق.</p>
      )}
      {preview && (
        <section
          className={styles.certificatePreview}
          aria-label="بيانات الشهادة المختارة"
        >
          <div className={styles.sectionHeading}>
            <h2>بيانات الشهادة الصادرة</h2>
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="إغلاق بيانات الشهادة"
            >
              <X />
            </button>
          </div>
          <p>
            معاينة الشهادة وبيانات الإنجاز المحفوظة في تجربتك المحلية.
          </p>
          <CertificatePreview studentName={preview.user_name} courseTitle={preview.course_title} grade="ناجح" date={preview.issued_at} serial={preview.serial_number}/>
          <dl>
            <dt>الطالب</dt>
            <dd>{preview.user_name || user.name}</dd>
            <dt>البرنامج</dt>
            <dd>{preview.course_title}</dd>
            <dt>المرجع</dt>
            <dd>
              <bdi>{preview.serial_number}</bdi>
            </dd>
            <dt>الحالة</dt>
            <dd>صادرة</dd>
          </dl>
          <button
            type="button"
            onClick={() => void download(preview)}
            disabled={!!busy}
          >
            <Download size={17} />
            تنزيل المستند الفعلي
          </button>
        </section>
      )}
    </div>
  );
}
