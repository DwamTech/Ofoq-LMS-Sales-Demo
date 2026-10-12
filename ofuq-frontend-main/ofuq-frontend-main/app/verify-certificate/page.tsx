"use client";
import { brand } from "@/lib/brand";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { http } from "@/lib/http";
import HomeHeader from "@/components/HomeHeader";
import Footer from "@/components/Footer";
import "./verify-certificate.css";
import { AlertCircle, ArrowUpLeft, ShieldCheck } from "lucide-react";
import styles from "./Verify.module.css";
import { CertificatePreview } from "@/components/brand/CertificatePreview";

interface CertificateData {
  student_name: string;
  course_title: string;
  exam_grade: string;
  exam_date: string;
  serial_number: string;
}

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateData | null>(null);
  const [error, setError] = useState("");
  const [autoVerifyDone, setAutoVerifyDone] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  /**
   * Smart serial number parser - handles any input format:
   * - Pure numbers: "12345" or "0012345" -> kept as-is
   * - Old format: "OFQ-2026-ZFZRTU" -> kept as-is (backend handles it)
   * - Full URL: "https://www.ofuq.academy/verify-certificate?s=..." -> extracts 's' param
   */
  const parseSerialNumber = (input: string): string => {
    if (!input) return "";

    let cleaned = input.trim();

    // Check if it's a URL - extract the 's' parameter
    if (
      cleaned.includes("verify-certificate") ||
      cleaned.includes("?s=") ||
      cleaned.startsWith("http")
    ) {
      try {
        // Handle full URL
        if (cleaned.startsWith("http")) {
          const url = new URL(cleaned);
          const sParam = url.searchParams.get("s");
          if (sParam) {
            cleaned = sParam.trim();
          }
        } else {
          // Handle partial URL like "?s=12345"
          const match = cleaned.match(/[?&]s=([^&\s]+)/);
          if (match) {
            cleaned = match[1].trim();
          }
        }
      } catch {
        // If URL parsing fails, try regex
        const match = cleaned.match(/[?&]s=([^&\s]+)/);
        if (match) {
          cleaned = match[1].trim();
        }
      }
    }

    // Return the serial as-is (backend handles case-insensitive search)
    return cleaned;
  };

  // التحقق التلقائي عند تحميل الصفحة مع parameter
  useEffect(() => {
    const serialFromUrl = searchParams.get("s");
    if (serialFromUrl && !autoVerifyDone) {
      const parsed = parseSerialNumber(serialFromUrl);
      setSerialNumber(serialFromUrl); // Show original in input
      setAutoVerifyDone(true);
      // تشغيل التحقق تلقائياً
      handleVerifyAuto(parsed);
    }
  }, [searchParams, autoVerifyDone]);

  // دالة التحقق التلقائي (بدون event)
  const handleVerifyAuto = async (serial: string) => {
    if (!serial.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setIsPreview(false);

    try {
      const response = await http.get(
        `/public/verify-certificate?serial_number=${encodeURIComponent(serial)}`,
      );
      setResult(response.data.data);
      setError("");
    } catch (err) {
      if ((isAxiosError(err) ? err.response?.status : undefined) === 404) {
        setError(
          "لم يتم العثور على شهادة بهذا الرقم التسلسلي. يرجى التحقق من الرقم والمحاولة مرة أخرى.",
        );
      } else if (
        (isAxiosError(err) ? err.response?.status : undefined) === 400
      ) {
        setError(
          "الرقم التسلسلي المدخل غير صحيح. يرجى التأكد من إدخال الرقم كاملاً.",
        );
      } else {
        setError(
          "حدث خطأ أثناء التحقق من الشهادة. يرجى المحاولة مرة أخرى لاحقًا.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // دالة التحقق اليدوي (عند الضغط على الزر)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setError("يرجى إدخال الرقم التسلسلي");
      return;
    }
    // Parse the input before verification
    const parsed = parseSerialNumber(serialNumber);
    if (!parsed) {
      setError("لم نتمكن من قراءة الرقم التسلسلي. يرجى التحقق من المدخل.");
      return;
    }
    await handleVerifyAuto(parsed);
  };

  return (
    <main className={`verify-certificate-main ${styles.page}`}>
      {/* Hero Section */}
      <section className="verify-hero">
        <div className="hero-content">
          <span className={styles.heroSeal} aria-hidden="true">
            <ShieldCheck size={34} />
          </span>
          <h1 className="hero-title">التحقق من الشهادات</h1>
          <p className="hero-subtitle">
            تحقق من صحة الشهادات الصادرة عن {brand.name}
          </p>
          <p className="hero-description">
            أدخل الرقم التسلسلي الموجود على الشهادة للتحقق من صحتها ومعلوماتها
          </p>
        </div>
      </section>

      {/* Verification Section */}
      <section className="verify-content">
        <div className="verify-form-container">
          <form
            onSubmit={handleVerify}
            className="verify-form"
            aria-busy={loading}
          >
            <div className="form-header">
              <h2 className="form-title">التحقق من الشهادة</h2>
              <p className="form-subtitle">أدخل الرقم التسلسلي للتحقق</p>
            </div>

            <div className="input-group">
              <label htmlFor="serialNumber" className="input-label">
                الرقم التسلسلي للشهادة
              </label>
              <input
                id="serialNumber"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="أدخل الرقم التسلسلي الموجود على الشهادة"
                className="serial-input"
                disabled={loading}
                aria-describedby={error ? "verification-error" : undefined}
                aria-invalid={Boolean(error)}
              />
            </div>

            <button type="submit" className="verify-button" disabled={loading}>
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>جاري التحقق...</span>
                </div>
              ) : (
                <>
                  <span>تحقق من الشهادة</span>
                  <ArrowUpLeft size={20} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {loading && (
            <div
              className="ofuq-loader-overlay"
              role="status"
              aria-live="polite"
            >
              <div className="ofuq-loader">
                <div className="loader-circle">
                  <div className="inner-circle"></div>
                  <div className="outer-circle"></div>
                  <div className="center-dot"></div>
                </div>
                <div className="loader-text">يتم التحقق من الشهادة...</div>
                <div className="loader-subtext">يرجى الانتظار لحظة</div>
              </div>
            </div>
          )}

          {error && (
            <div
              className="result-card error-card"
              role="alert"
              id="verification-error"
            >
              <span className={styles.errorIcon} aria-hidden="true">
                <AlertCircle size={28} />
              </span>
              <h3 className="result-title">لم يتم العثور على الشهادة</h3>
              <p className="result-message">{error}</p>
            </div>
          )}

          {result && (
            <div
              className="result-card success-card"
              role="status"
              aria-live="polite"
            >
              <span className={styles.successIcon} aria-hidden="true">
                <ShieldCheck size={30} />
              </span>

              <h3 className="result-title">
                {isPreview ? "معاينة شهادة تجريبية" : "الشهادة موثقة وصحيحة"}
              </h3>
              {isPreview && (
                <p className={styles.previewNotice}>
                  بيانات وهمية لعرض التصميم فقط · ليست شهادة صادرة أو موثقة.
                </p>
              )}
              <CertificatePreview
                studentName={result.student_name}
                courseTitle={result.course_title}
                grade={result.exam_grade}
                date={result.exam_date}
                serial={result.serial_number}
                preview={isPreview}
              />

              <div className="certificate-details">
                <div className="detail-row">
                  <span className="detail-label">اسم الطالب:</span>
                  <span className="detail-value">{result.student_name}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">اسم الدورة:</span>
                  <span className="detail-value">{result.course_title}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">النتيجة:</span>
                  <span className="detail-value grade-value">
                    {result.exam_grade}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">تاريخ الاختبار:</span>
                  <span className="detail-value">
                    {result.exam_date
                      ? new Date(result.exam_date).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">الرقم التسلسلي:</span>
                  <span className="detail-value serial-value">
                    {result.serial_number}
                  </span>
                </div>
              </div>

              <div className="verification-badge">
                <div className="badge-icon">
                  <ShieldCheck size={20} aria-hidden="true" />
                </div>
                <span>
                  {isPreview
                    ? "معاينة التصميم · بيانات تجريبية"
                    : `تم التحقق من قبل ${brand.name}`}
                </span>
              </div>
              {result.serial_number?.startsWith("OFOQ-") && (
                <p>
                  شهادة تاريخية صُدرت بالهوية السابقة. لم يتغير ملفها أو رقمها
                  أو مرجع التحقق.
                </p>
              )}
            </div>
          )}

          <div className="verify-footer">
            <p className="footer-text">هذه الخدمة مقدمة من {brand.name}</p>
            <p className="footer-subtext">
              للاستفسارات أو المساعدة، يرجى التواصل مع فريق الدعم
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function VerifyCertificate() {
  return (
    <div className={styles.backdrop}>
      <HomeHeader />
      <Suspense
        fallback={
          <div className="verify-certificate-main">
            <div className="verify-content">
              <p style={{ textAlign: "center", padding: "2rem" }}>
                جاري التحميل...
              </p>
            </div>
          </div>
        }
      >
        <VerifyCertificateContent />
      </Suspense>
      <Footer />
    </div>
  );
}
