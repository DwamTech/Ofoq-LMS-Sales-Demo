"use client";

import apiClient from "./apiClient";
import { getBackendAssetUrl } from "./url";
import { http } from "@/lib/http";

/**
 * واجهة شهادة الدبلومة (الجديدة)
 * بناءً على ملفات التصميم
 */
export interface DiplomaCertificate {
  id: number;
  uuid: string; // معرف التحقق الفريد
  diploma_name: string; // اسم الدبلومة (سيأتي من الباك إند)
  course_title?: string; // اسم المقرر (إن وجد)
  user_name: string; // اسم الطالب (سيأتي من الباك إند)
  issued_at: string; // تاريخ الإصدار
  file_path: string; // المسار الكامل لملف PDF (إن توفر)
  qr_path: string; // المسار الكامل لصورة QR Code (إن توفر)
  category_id?: number; // معرف القسم/الدبلومة لاستخدامه في تنزيل الشهادة
  course_id?: number; // إن كانت شهادة كورس (لدعم التوافق)
  type?: "diploma" | "course"; // نوع الشهادة عند الحاجة
}

/**
 * واجهة شهادة المقرر كما تُعاد من /my-certificates
 * تحتوي الحقول اللازمة للعرض في جدول "شهاداتي" (كورسات فقط)
 */
export interface CourseCertificate {
  id: number;
  course_title: string;
  diploma_name?: string; // اسم الدبلومة التابع لها المقرر
  issued_at?: string;
  completion_date?: string;
  serial_number?: string;
  verification_token?: string;
  verification_url?: string;
  file_path?: string;
  download_url?: string;
}

/**
 * واجهة البيانات التي تعود من صفحة التحقق العامة
 */
export interface VerifiedCertificateData {
  user_name: string;
  diploma_name: string;
  issued_at: string;
  status: "Valid" | "Invalid"; // حالة الشهادة
}

/**
 * [User] جلب شهادات الدبلومة الخاصة بالمستخدم
 * (نفترض أن الباك اند سيحدّث هذا الـ endpoint ليعيد شهادات الدبلومات)
 */
export async function getMyCertificates(): Promise<DiplomaCertificate[]> {
  try {
    const res = await apiClient.get("/my-certificates");
    const data = res.data;
    const list = Array.isArray(data?.certificates)
      ? data.certificates
      : Array.isArray(data?.data?.certificates)
        ? data.data.certificates
        : [];

    // تحويل البيانات (إذا لزم الأمر) أو الاعتماد على الباك اند لإرسال الشكل الجديد
    return list.map((cert: any) => ({
      id: Number(cert.id),
      uuid: String(cert.uuid || cert.verification_token || ""), // الحقل الجديد
      diploma_name: String(cert.diploma_name || ""),
      course_title: String(cert.course_title || ""),
      user_name: String(cert.user_name || cert.student_name || ""),
      issued_at: String(cert.issued_at || cert.completion_date || ""),
      // لا نستخدم download_url القديم لتفادي الدوران نحو الـ API القديم
      file_path: cert.file_path || "",
      qr_path: cert.qr_path || "",
      category_id:
        cert.category_id ??
        cert.category?.id ??
        cert.diploma_category_id ??
        undefined,
      course_id: cert.course_id ?? cert.course?.id ?? undefined,
      type:
        cert.type ||
        (cert.category_id || cert.category
          ? "diploma"
          : cert.course_id || cert.course
            ? "course"
            : undefined),
    }));
  } catch (error: any) {
    console.error("Error fetching my certificates:", error);
    throw new Error(error.response?.data?.message || "فشل في جلب الشهادات");
  }
}

/**
 * [User] جلب شهادات كورسات الطالب بصيغة مباشرة كما يقدّمها الباك إند
 */
export async function getMyCourseCertificates(): Promise<CourseCertificate[]> {
  try {
    const res = await apiClient.get("/my-certificates");
    const data = res.data;
    const list = Array.isArray(data?.certificates)
      ? data.certificates
      : Array.isArray(data?.data?.certificates)
        ? data.data.certificates
        : [];

    return list.map((c: any) => ({
      id: Number(c.id),
      course_title: String(c.course_title || ""),
      issued_at: c.issued_at ? String(c.issued_at) : undefined,
      completion_date: c.completion_date
        ? String(c.completion_date)
        : undefined,
      serial_number: c.serial_number ? String(c.serial_number) : undefined,
      verification_token: c.verification_token
        ? String(c.verification_token)
        : undefined,
      verification_url: c.verification_url
        ? String(c.verification_url)
        : undefined,
      file_path: c.file_path ? String(c.file_path) : undefined,
      download_url: c.download_url ? String(c.download_url) : undefined,
    }));
  } catch (error: any) {
    console.error("Error fetching my course certificates:", error);
    throw new Error(
      error.response?.data?.message || "فشل في جلب شهادات الكورسات",
    );
  }
}

/**
 * [Public] التحقق من شهادة عبر الـ UUID
 * (Endpoint جديد بناءً على ملفات التصميم)
 */
export async function verifyCertificate(
  uuid: string,
): Promise<VerifiedCertificateData> {
  try {
    // هذا endpoint عام ولا يتطلب مصادقة
    const res = await apiClient.get(`/diploma-certificate/verify/${uuid}`);
    const data = res.data?.data ?? res.data;

    if (!data || !data.user_name) {
      throw new Error("بيانات التحقق غير صالحة");
    }

    // إرجاع البيانات لعرضها في صفحة التحقق
    return {
      user_name: data.user_name,
      diploma_name: data.diploma_name,
      issued_at: data.issued_at,
      status: "Valid",
    };
  } catch (error: any) {
    console.error("Error verifying certificate:", error);
    // إرجاع حالة "غير صالح" ليتم التعامل معها في الواجهة
    return {
      user_name: "",
      diploma_name: "",
      issued_at: "",
      status: "Invalid",
    };
  }
}

/**
 * [Helper] بناء رابط صفحة التحقق (للاستخدام في الفرونت إند)
 */
export function getVerificationUrl(uuid: string): string {
  if (!uuid) return "";
  const base = http.defaults.baseURL || "";
  // رابط تحقق شهادة الدبلومة (عام)
  return `${base}/diploma-certificate/verify/${uuid}`;
}

/**
 * [Helper] جلب رابط تحميل الشهادة (PDF)
 */
export function getDownloadUrl(filePath: string): string {
  // نُهمل الروابط القديمة التي تُشير لمسارات توليد الشهادة في الباك إند
  if (!filePath) return "";
  const url = String(filePath);
  // Legacy URLs were like /api/courses/123/certificate or /api/categories/123/certificate
  // New storage paths are like /storage/certificates/courses/123.pdf

  // Strict check for legacy endpoints (must not be a storage path)
  const isStoragePath =
    url.includes("/storage/") || url.includes("/certificates/");
  const isLegacyCourse =
    !isStoragePath && url.includes("/courses/") && url.includes("/certificate");
  const isLegacyDiploma =
    !isStoragePath &&
    url.includes("/categories/") &&
    url.includes("/certificate");

  if (isLegacyCourse || isLegacyDiploma) return "";

  // إن كان الرابط كاملاً http(s) نعيده كما هو
  if (/^https?:\/\//i.test(url)) return url;

  // معالجة المسارات النسبية مثل storage/... إلى رابط كامل على مضيف الباك إند
  const normalized = getBackendAssetUrl(url);
  // حماية إضافية: لو رجعنا Placeholder غير مناسب للشهادات، اعتبره غير صالح
  return normalized && !normalized.endsWith("/banner.jpg") ? normalized : "";
}

/**
 * تحقق إن كان الرابط يُشير لمسار قديم في الباك إند لتوليد الشهادة
 */
function isLegacyBackendCertificateUrl(url?: string | null): boolean {
  if (!url) return false;
  const u = String(url);
  const isLegacyCourse = u.includes("/courses/") && u.includes("/certificate");
  const isLegacyDiploma =
    u.includes("/categories/") && u.includes("/certificate");
  return isLegacyCourse || isLegacyDiploma;
}

/**
 * [Helper] بناء رابط تنزيل شهادة الدبلومة للطالب
 */
export function getDiplomaCertificateDownloadUrl(
  categoryId: number | string,
): string {
  if (!categoryId && categoryId !== 0) return "";
  const base = http.defaults.baseURL || "";
  return `${base}/categories/${categoryId}/certificate`;
}

/**
 * [Helper] بناء رابط تنزيل شهادة المقرر للطالب (توافق قديم)
 */
export function getCourseCertificateDownloadUrl(
  courseId: number | string,
): string {
  if (!courseId && courseId !== 0) return "";
  const base = http.defaults.baseURL || "";
  return `${base}/courses/${courseId}/certificate`;
}

/**
 * [Helper] بناء روابط تحقق (عامة) لكل من الدبلومة والمقرر
 */
export function getDiplomaVerificationUrl(token: string): string {
  if (!token) return "";
  const base = http.defaults.baseURL || "";
  return `${base}/diploma-certificate/verify/${token}`;
}

export function getCourseVerificationUrl(token: string): string {
  if (!token) return "";
  const base = http.defaults.baseURL || "";
  return `${base}/certificate/verify/${token}`;
}

// =========================
// توليد وحفظ الشهادة - منطق جديد
// =========================

type RawCertificate = {
  id: number;
  verification_token: string;
  verification_url: string;
  issued_at?: string;
  completion_date?: string;
  file_path?: string | null;
  user?: { id: number; name: string; email?: string };
  course?: { id: number; title?: string };
  category?: { id: number; title?: string };
  data?: {
    user_name?: string;
    user_email?: string;
    course_title?: string;
    completion_date?: string;
    enrollment_date?: string;
    progress_percentage?: number;
  };
};

/**
 * استرجاع بيانات شهادة مقرر (بدون توليد PDF)
 */
export async function fetchCourseCertificateData(
  courseId: number | string,
): Promise<RawCertificate> {
  const res = await apiClient.get(`/courses/${courseId}/certificate/data`);
  const payload = res.data?.certificate ?? res.data;
  return payload as RawCertificate;
}

/**
 * استرجاع بيانات شهادة دبلومة (بدون توليد PDF)
 */
export async function fetchDiplomaCertificateData(
  categoryId: number | string,
): Promise<RawCertificate> {
  const res = await apiClient.get(`/categories/${categoryId}/certificate/data`);
  const payload = res.data?.certificate ?? res.data;
  return payload as RawCertificate;
}

/**
 * تحديث مسار الملف لشهادة مقرر
 */
export async function updateCourseCertificateFile(
  certificateId: number | string,
  filePath: string,
): Promise<void> {
  await apiClient.post(`/certificates/${certificateId}/file`, {
    file_path: filePath,
  });
}

/**
 * تحديث مسار الملف لشهادة دبلومة
 */
export async function updateDiplomaCertificateFile(
  certificateId: number | string,
  filePath: string,
): Promise<void> {
  await apiClient.post(`/diploma-certificates/${certificateId}/file`, {
    file_path: filePath,
  });
}

/**
 * استدعاء مسار الفرونت لتوليد PDF وحفظه في public/certificates
 */
export async function generateCertificatePdf(
  type: "course" | "diploma",
  certificate: RawCertificate,
): Promise<string> {
  const { localCertificatePdf } = await import("@/lib/localCertificatePdf");
  const blob = await localCertificatePdf({
    id: certificate.id,
    type,
    source: type === "course" ? "course" : "diploma",
    status: "issued",
    user_name: certificate.user?.name ?? certificate.data?.user_name ?? "",
    course_title:
      certificate.course?.title ??
      certificate.category?.title ??
      certificate.data?.course_title ??
      "",
    serial_number: certificate.verification_token || String(certificate.id),
    verification_token:
      certificate.verification_token || String(certificate.id),
    issued_at:
      certificate.issued_at ??
      certificate.completion_date ??
      new Date().toISOString(),
    file_path: null,
  });
  return URL.createObjectURL(blob);
}

export async function getCertificateStatus(courseId: number | string) {
  const { readFrontend } = await import("@/lib/frontendStore");
  const certificate = readFrontend().certificates.find(
    (c) => c.course_id === Number(courseId),
  );
  if (!certificate)
    return { status: "not_issued", file_url: null, file_path: null };
  const { localCertificatePdf } = await import("@/lib/localCertificatePdf");
  return {
    status: "completed",
    file_url: URL.createObjectURL(await localCertificatePdf(certificate)),
    file_path: null,
  };
}
export async function requestCertificate(courseId: number | string) {
  const { readFrontend, issueLocalCertificate } = await import(
    "@/lib/frontendStore"
  );
  if (!readFrontend().results[Number(courseId)]?.passed)
    throw Error("اجتز الاختبار أولًا");
  issueLocalCertificate(Number(courseId));
  return { certificate_status: "completed" };
}
