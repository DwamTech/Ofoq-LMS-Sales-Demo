"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Award,
  ChevronDown,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  Filter,
  GraduationCap,
  ListRestart,
  Mail,
  MoreVertical,
  Phone,
  RefreshCcw,
  Search,
  Send,
  UserCheck,
  Users,
} from "lucide-react";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import Toast from "@/components/Toast";
import styles from "../AdminDiplomaCourses.module.css";
import "@/styles/toast.css";
import apiClient from "@/utils/apiClient";
import { getDownloadUrl } from "@/utils/certificateService";

type CertificateStatus = "not_generated" | "processing" | "generated" | "failed";
type GraduationFilter = "all" | "graduated" | "eligible" | "studying" | "review";
type CertificateFilter = "all" | CertificateStatus;
type CompletionFilter = "all" | "lt50" | "50to79" | "80to99" | "100";
type SortOption = "newest" | "oldest" | "name" | "progress-desc" | "progress-asc" | "graduated-newest" | "graduated-oldest";

interface DiplomaSummary {
  id: number;
  name: string;
  total_courses?: number;
}

interface AdminDiplomaStudent {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  progress: number | null;
  certificate_status: CertificateStatus;
  is_eligible: boolean;
  file_url?: string | null;
  enrolled_at?: string | null;
  graduated_at?: string | null;
  last_activity_at?: string | null;
  completed_courses?: number | null;
  total_courses?: number | null;
  completed_lessons?: number | null;
  total_lessons?: number | null;
}

type RawStudent = {
  id?: unknown;
  student_id?: unknown;
  user_id?: unknown;
  name?: unknown;
  student_name?: unknown;
  email?: unknown;
  phone?: unknown;
  progress?: unknown;
  progress_percentage?: unknown;
  certificate_status?: unknown;
  status?: unknown;
  is_eligible?: unknown;
  file_url?: unknown;
  certificate_file_url?: unknown;
  file_path?: unknown;
  enrolled_at?: unknown;
  created_at?: unknown;
  graduated_at?: unknown;
  completed_at?: unknown;
  last_activity_at?: unknown;
  completed_courses?: unknown;
  total_courses?: unknown;
  completed_lessons?: unknown;
  total_lessons?: unknown;
  user?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    phone?: unknown;
  };
};

const certificateLabels: Record<CertificateStatus, string> = {
  not_generated: "غير صادرة",
  processing: "معلقة",
  generated: "صادرة",
  failed: "مرفوضة",
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeCertificateStatus = (value: unknown): CertificateStatus => {
  const status = String(value ?? "not_generated");
  if (status === "generated" || status === "completed") return "generated";
  if (status === "processing" || status === "pending") return "processing";
  if (status === "failed") return "failed";
  return "not_generated";
};

const normalizeStudent = (student: RawStudent): AdminDiplomaStudent => {
  const progress = toNullableNumber(student.progress ?? student.progress_percentage);
  const certificateStatus = normalizeCertificateStatus(student.certificate_status ?? student.status);
  const fileUrl = student.file_url ?? student.certificate_file_url ?? student.file_path ?? null;

  return {
    id: Number(student.student_id ?? student.id ?? student.user_id ?? student.user?.id ?? 0),
    name: toNullableString(student.student_name ?? student.name ?? student.user?.name) ?? "غير متاح",
    email: toNullableString(student.email ?? student.user?.email) ?? "غير متاح",
    phone: toNullableString(student.phone ?? student.user?.phone),
    progress,
    certificate_status: certificateStatus,
    is_eligible: Boolean(student.is_eligible ?? (progress !== null && progress >= 100)),
    file_url: fileUrl ? getDownloadUrl(String(fileUrl)) : null,
    enrolled_at: toNullableString(student.enrolled_at ?? student.created_at),
    graduated_at: toNullableString(student.graduated_at ?? student.completed_at),
    last_activity_at: toNullableString(student.last_activity_at),
    completed_courses: toNullableNumber(student.completed_courses),
    total_courses: toNullableNumber(student.total_courses),
    completed_lessons: toNullableNumber(student.completed_lessons),
    total_lessons: toNullableNumber(student.total_lessons),
  };
};

const formatCount = (value: number) => value.toLocaleString("ar-EG");

const formatPercent = (value: number | null) => {
  if (value === null) return "غير متاح";
  return `${Math.round(value).toLocaleString("ar-EG")}%`;
};

const formatDate = (value?: string | null, fallback = "غير متاح") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const getProgress = (student: AdminDiplomaStudent) => Math.max(0, Math.min(100, Number(student.progress ?? 0)));

const getGraduationState = (student: AdminDiplomaStudent) => {
  if (student.certificate_status === "generated") return "graduated";
  if (student.certificate_status === "processing") return "review";
  if (student.is_eligible || getProgress(student) >= 100) return "eligible";
  return "studying";
};

const getGraduationLabel = (student: AdminDiplomaStudent) => {
  const state = getGraduationState(student);
  if (state === "graduated") return "خريج";
  if (state === "eligible") return "مؤهل للتخرج";
  if (state === "review") return "قيد المراجعة";
  return "قيد الدراسة";
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "؟") + (parts[1]?.[0] ?? "");
};

export default function AdminDiplomaStudentsPage() {
  const { id } = useParams() as { id: string };
  const diplomaId = Number(id);
  const router = useRouter();

  const [students, setStudents] = useState<AdminDiplomaStudent[]>([]);
  const [diploma, setDiploma] = useState<DiplomaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("info");

  const [searchTerm, setSearchTerm] = useState("");
  const [graduationFilter, setGraduationFilter] = useState<GraduationFilter>("all");
  const [certificateFilter, setCertificateFilter] = useState<CertificateFilter>("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("progress-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const showToast = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const fetchStudents = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const resp = await apiClient.get(`/admin/diplomas/${diplomaId}/students`, {
        cacheTTL: 10,
      });
      const result = resp.data;
      const list = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.data?.students)
          ? result.data.students
          : Array.isArray(result?.students)
            ? result.students
            : Array.isArray(result)
              ? result
              : [];

      const diplomaData = result?.data?.diploma ?? result?.diploma ?? null;
      if (diplomaData) {
        setDiploma({
          id: Number(diplomaData.id ?? diplomaId),
          name: String(diplomaData.name ?? `دبلومة ${diplomaId}`),
          total_courses: toNullableNumber(diplomaData.total_courses) ?? undefined,
        });
      }

      setStudents((list as RawStudent[]).map(normalizeStudent).filter((student) => student.id > 0));
    } catch (err: unknown) {
      if (!silent) {
        const message = getErrorMessage(err, "فشل في جلب قائمة الطلاب");
        setError(message);
        showToast(message, "error");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [diplomaId, showToast]);

  useEffect(() => {
    if (!Number.isNaN(diplomaId) && diplomaId > 0) {
      fetchStudents();
    } else {
      setError("معرف دبلومة غير صالح");
      setLoading(false);
    }
  }, [diplomaId, fetchStudents]);

  useEffect(() => {
    const hasProcessing = students.some((student) => student.certificate_status === "processing");
    if (!hasProcessing) return;

    const intervalId = setInterval(() => {
      fetchStudents(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchStudents, students]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [certificateFilter, completionFilter, graduationFilter, perPage, searchTerm, sortOption]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return [...students]
      .filter((student) => {
        const progress = getProgress(student);
        const graduationState = getGraduationState(student);
        const matchesQuery =
          !query ||
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          (student.phone ?? "").toLowerCase().includes(query);

        const matchesGraduation =
          graduationFilter === "all" ||
          graduationState === graduationFilter ||
          (graduationFilter === "graduated" && student.certificate_status === "generated");

        const matchesCertificate =
          certificateFilter === "all" || student.certificate_status === certificateFilter;

        const matchesCompletion =
          completionFilter === "all" ||
          (completionFilter === "lt50" && progress < 50) ||
          (completionFilter === "50to79" && progress >= 50 && progress < 80) ||
          (completionFilter === "80to99" && progress >= 80 && progress < 100) ||
          (completionFilter === "100" && progress >= 100);

        return matchesQuery && matchesGraduation && matchesCertificate && matchesCompletion;
      })
      .sort((a, b) => {
        if (sortOption === "oldest") {
          return new Date(a.enrolled_at ?? 0).getTime() - new Date(b.enrolled_at ?? 0).getTime();
        }
        if (sortOption === "newest") {
          return new Date(b.enrolled_at ?? 0).getTime() - new Date(a.enrolled_at ?? 0).getTime();
        }
        if (sortOption === "name") {
          return a.name.localeCompare(b.name, "ar");
        }
        if (sortOption === "progress-asc") {
          return getProgress(a) - getProgress(b);
        }
        if (sortOption === "graduated-newest") {
          return new Date(b.graduated_at ?? 0).getTime() - new Date(a.graduated_at ?? 0).getTime();
        }
        if (sortOption === "graduated-oldest") {
          return new Date(a.graduated_at ?? 0).getTime() - new Date(b.graduated_at ?? 0).getTime();
        }
        return getProgress(b) - getProgress(a);
      });
  }, [certificateFilter, completionFilter, graduationFilter, searchTerm, sortOption, students]);

  const stats = useMemo(() => {
    const total = students.length;
    const graduates = students.filter((student) => student.certificate_status === "generated").length;
    const eligible = students.filter((student) => student.is_eligible && student.certificate_status !== "generated").length;
    const processing = students.filter((student) => student.certificate_status === "processing").length;
    const issued = students.filter((student) => student.certificate_status === "generated").length;
    const notIssued = students.filter((student) => student.certificate_status === "not_generated").length;
    const progressValues = students.map((student) => student.progress).filter((value): value is number => value !== null);
    const averageProgress = progressValues.length
      ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
      : null;

    return {
      total,
      graduates,
      studying: Math.max(0, total - graduates - eligible - processing),
      eligible,
      issued,
      notIssued,
      averageProgress,
    };
  }, [students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = filteredStudents.length === 0 ? 0 : (safeCurrentPage - 1) * perPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + perPage);
  const fromItem = filteredStudents.length === 0 ? 0 : startIndex + 1;
  const toItem = Math.min(startIndex + perPage, filteredStudents.length);
  const pageIds = paginatedStudents.map((student) => student.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const filtersAreActive =
    searchTerm.trim() !== "" ||
    graduationFilter !== "all" ||
    certificateFilter !== "all" ||
    completionFilter !== "all" ||
    sortOption !== "progress-desc";

  const resetFilters = () => {
    setSearchTerm("");
    setGraduationFilter("all");
    setCertificateFilter("all");
    setCompletionFilter("all");
    setSortOption("progress-desc");
    setSelectedIds([]);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const toggleSelectPage = () => {
    setSelectedIds((current) => {
      if (allPageSelected) {
        return current.filter((id) => !pageIds.includes(id));
      }
      return Array.from(new Set([...current, ...pageIds]));
    });
  };

  const goBack = () => router.push(`/admin/diplomas/${diplomaId}`);

  const handleGenerate = async (student: AdminDiplomaStudent) => {
    if (!student.is_eligible || getProgress(student) < 100) return;
    setGeneratingId(student.id);
    try {
      const resp = await apiClient.post(`/admin/diplomas/${diplomaId}/students/${student.id}/generate-certificate`);
      const result = resp.data;
      showToast(result?.message || "تم بدء توليد الشهادة", "success");
      setStudents((prev) => prev.map((item) => (item.id === student.id ? { ...item, certificate_status: "processing" } : item)));
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "فشل في توليد الشهادة"), "error");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownload = (student: AdminDiplomaStudent) => {
    const url = student.file_url || "";
    if (!url) {
      showToast("ملف الشهادة غير متاح بعد", "warning");
      return;
    }
    window.open(url, "_blank");
  };

  const handleWhatsapp = (student: AdminDiplomaStudent) => {
    if (!student.phone) {
      showToast("رقم الهاتف غير متاح لهذا الطالب", "warning");
      return;
    }

    let message = `مرحباً ${student.name}،\n\n`;
    if (student.certificate_status === "generated" && student.file_url) {
      message += `نبارك لكم إتمام الدبلومة بنجاح.\n\nيمكنكم تحميل شهادتكم من الرابط التالي:\n${student.file_url}\n\n`;
    } else {
      message += "بخصوص الدبلومة المسجلين بها.\n\n";
    }
    message += "مع تحيات إدارة المنصة.";

    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading && !students.length) {
    return (
      <AdminAuthGuard>
        <div className={styles.container}>
          <GraduatesSkeleton />
        </div>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <div className={styles.container}>
        <section className={styles.graduatesHeader}>
          <div>
            <p className={styles.headerEyebrow}>إدارة الدبلومات / الطلاب</p>
            <h1 className={styles.title}>طلاب وخريجو الدبلومة</h1>
            <p className={styles.subtitle}>
              دبلومة: {diploma?.name ?? `#${diplomaId}`} - متابعة الطلاب، حالات التخرج، الشهادات، ونسب الإنجاز داخل الدبلومة.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.backButton} onClick={() => router.push("/admin/diplomas")}>إدارة الدبلومات</button>
            <button className={styles.backButton} onClick={goBack}>تفاصيل الدبلومة</button>
          </div>
        </section>

        <section className={styles.graduateStatsGrid} aria-label="إحصائيات الطلاب والخريجين">
          <StatCard icon={<Users size={20} />} label="إجمالي الطلاب" value={formatCount(stats.total)} />
          <StatCard icon={<GraduationCap size={20} />} label="الخريجون" value={formatCount(stats.graduates)} tone="success" />
          <StatCard icon={<UserCheck size={20} />} label="المؤهلون للتخرج" value={formatCount(stats.eligible)} tone="warning" />
          <StatCard icon={<FileClock size={20} />} label="قيد الدراسة" value={formatCount(stats.studying)} />
          <StatCard icon={<FileCheck2 size={20} />} label="شهادات صادرة" value={formatCount(stats.issued)} tone="success" />
          <StatCard icon={<Award size={20} />} label="شهادات غير صادرة" value={formatCount(stats.notIssued)} tone="muted" />
          <StatCard icon={<Filter size={20} />} label="متوسط الإكمال" value={stats.averageProgress === null ? "غير متاح" : `${formatCount(stats.averageProgress)}%`} />
        </section>

        <section className={styles.graduatesPanel}>
          <div className={styles.graduatesToolbar}>
            <div>
              <h2>قائمة الطلاب</h2>
              <p>الصفحة تعرض جميع طلاب الدبلومة، ويمكن فلترتهم حسب التخرج والشهادة ونسبة الإنجاز.</p>
            </div>
            <button className={styles.btnAction} onClick={() => fetchStudents()} type="button">
              <RefreshCcw size={17} />
              تحديث
            </button>
          </div>

          <div className={styles.graduatesFiltersBar}>
            <label className={styles.graduatesSearchField}>
              <Search size={18} />
              <input
                type="search"
                placeholder="بحث بالاسم، البريد، أو الهاتف"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <FilterSelect label="حالة التخرج" value={graduationFilter} onChange={(value) => setGraduationFilter(value as GraduationFilter)}>
              <option value="all">كل الحالات</option>
              <option value="graduated">خريج</option>
              <option value="eligible">مؤهل للتخرج</option>
              <option value="studying">قيد الدراسة</option>
              <option value="review">قيد المراجعة</option>
            </FilterSelect>

            <FilterSelect label="حالة الشهادة" value={certificateFilter} onChange={(value) => setCertificateFilter(value as CertificateFilter)}>
              <option value="all">كل الشهادات</option>
              <option value="generated">شهادة صادرة</option>
              <option value="not_generated">شهادة غير صادرة</option>
              <option value="processing">شهادة معلقة</option>
              <option value="failed">شهادة مرفوضة</option>
            </FilterSelect>

            <FilterSelect label="نسبة الإكمال" value={completionFilter} onChange={(value) => setCompletionFilter(value as CompletionFilter)}>
              <option value="all">كل النسب</option>
              <option value="lt50">أقل من 50%</option>
              <option value="50to79">من 50% إلى 79%</option>
              <option value="80to99">من 80% إلى 99%</option>
              <option value="100">100%</option>
            </FilterSelect>

            <FilterSelect label="الترتيب" value={sortOption} onChange={(value) => setSortOption(value as SortOption)}>
              <option value="progress-desc">الأعلى إكمالًا</option>
              <option value="progress-asc">الأقل إكمالًا</option>
              <option value="newest">الأحدث تسجيلًا</option>
              <option value="oldest">الأقدم تسجيلًا</option>
              <option value="name">الاسم أ-ي</option>
              <option value="graduated-newest">تاريخ التخرج الأحدث</option>
              <option value="graduated-oldest">تاريخ التخرج الأقدم</option>
            </FilterSelect>

            <button type="button" className={styles.btnReset} onClick={resetFilters} disabled={!filtersAreActive}>
              <ListRestart size={17} />
              إعادة ضبط
            </button>
          </div>

          {selectedIds.length > 0 ? (
            <div className={styles.bulkBar}>
              <span>تم تحديد {formatCount(selectedIds.length)} طالب من الصفحة الحالية.</span>
              <button type="button" onClick={() => setSelectedIds([])}>إلغاء التحديد</button>
            </div>
          ) : null}

          {error ? (
            <div className={styles.graduateStateCard}>
              <div>
                <h3>تعذر جلب الطلاب</h3>
                <p>{error}</p>
              </div>
              <button type="button" className={styles.btnAction} onClick={() => fetchStudents()}>
                <RefreshCcw size={17} />
                إعادة المحاولة
              </button>
            </div>
          ) : null}

          {!error && students.length === 0 ? (
            <div className={styles.graduateEmptyState}>
              <div className={styles.graduateEmptyIcon}><Users size={34} /></div>
              <div className={styles.graduateEmptyTitle}>لا يوجد طلاب في هذه الدبلومة بعد</div>
              <p>يمكن العودة إلى تفاصيل الدبلومة لمراجعة المقررات والإعدادات.</p>
              <button type="button" className={styles.backButton} onClick={goBack}>العودة إلى الدبلومة</button>
            </div>
          ) : null}

          {!error && students.length > 0 && filteredStudents.length === 0 ? (
            <div className={styles.graduateEmptyState}>
              <div className={styles.graduateEmptyIcon}><Filter size={34} /></div>
              <div className={styles.graduateEmptyTitle}>لا توجد نتائج مطابقة للفلاتر الحالية</div>
              <p>جرّب تغيير البحث أو إعادة ضبط الفلاتر.</p>
              <button type="button" className={styles.btnReset} onClick={resetFilters}>إعادة ضبط الفلاتر</button>
            </div>
          ) : null}

          {!error && paginatedStudents.length > 0 ? (
            <>
              <div className={styles.graduatesTableContainer}>
                <table className={styles.graduatesTable}>
                  <thead>
                    <tr>
                      <th className={styles.graduateSelectColumn}>
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectPage}
                          aria-label="تحديد طلاب الصفحة الحالية"
                        />
                      </th>
                      <th>الطالب</th>
                      <th>الدراسة والإنجاز</th>
                      <th>الشهادة والتخرج</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => {
                      const progressPct = getProgress(student);
                      const canGenerate = student.is_eligible && progressPct >= 100 && student.certificate_status !== "generated" && student.certificate_status !== "processing";
                      const canDownload = student.certificate_status === "generated" && Boolean(student.file_url);

                      return (
                        <tr key={String(student.id)}>
                          <td className={styles.graduateSelectColumn}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(student.id)}
                              onChange={() => toggleSelect(student.id)}
                              aria-label={`تحديد ${student.name}`}
                            />
                          </td>
                          <td>
                            <div className={styles.studentCell}>
                              <div className={styles.studentAvatar}>{getInitials(student.name)}</div>
                              <div className={styles.studentInfo}>
                                <strong>{student.name}</strong>
                                <span>{student.email}</span>
                                <small>{student.phone || "رقم الهاتف غير متاح"}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.graduateStudyCell}>
                              <div className={styles.graduateInlineDetails}>
                                <span className={`${styles.graduateBadge} ${styles[`graduateStatus-${getGraduationState(student)}`]}`}>
                                  {getGraduationLabel(student)}
                                </span>
                                <strong>{formatPercent(student.progress)}</strong>
                              </div>
                              <div className={styles.progressCell}>
                                <div className={styles.progressTrack}>
                                  <div className={styles.progressValue} style={{ width: `${progressPct}%` }} />
                                </div>
                              </div>
                              <div className={styles.graduateDetailText}>
                                <span>
                                  المحتوى: {student.completed_courses !== null && student.completed_courses !== undefined && student.total_courses
                                    ? `${formatCount(student.completed_courses)} من ${formatCount(student.total_courses)} مقررات`
                                    : student.completed_lessons !== null && student.completed_lessons !== undefined && student.total_lessons
                                      ? `${formatCount(student.completed_lessons)} من ${formatCount(student.total_lessons)} درسًا`
                                      : "غير متاح"}
                                </span>
                                <span>آخر نشاط: {formatDate(student.last_activity_at)}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.graduateCertificateCell}>
                              <span className={`${styles.graduateBadge} ${styles[`certificateStatus-${student.certificate_status}`]}`}>
                                {certificateLabels[student.certificate_status]}
                              </span>
                              <span>
                                تاريخ التخرج: {student.certificate_status === "generated" ? formatDate(student.graduated_at, "غير متاح") : "لم يتخرج بعد"}
                              </span>
                            </div>
                          </td>
                          <td className={styles.graduateActionsColumn}>
                            <div className={styles.graduateRowActions}>
                              <button
                                type="button"
                                className={styles.graduateManageButton}
                                onClick={() => {
                                  if (canDownload) handleDownload(student);
                                  else if (canGenerate) handleGenerate(student);
                                }}
                                disabled={!canDownload && !canGenerate}
                              >
                                {canDownload ? "تحميل الشهادة" : canGenerate ? "إصدار شهادة" : "إدارة"}
                              </button>
                              <details className={styles.graduateActionsMenu}>
                                <summary aria-label={`إجراءات ${student.name}`}>
                                  <MoreVertical size={18} />
                                </summary>
                                <div className={styles.graduateActionsDropdown}>
                                  <button type="button" onClick={() => router.push(`/admin/reports/students/${student.id}`)}>
                                    <Eye size={16} />
                                    عرض التقدم
                                  </button>
                                  {student.phone ? (
                                    <a href={`tel:${student.phone}`}>
                                      <Phone size={16} />
                                      اتصال
                                    </a>
                                  ) : null}
                                  {student.email !== "غير متاح" ? (
                                    <a href={`mailto:${student.email}`}>
                                      <Mail size={16} />
                                      بريد إلكتروني
                                    </a>
                                  ) : null}
                                  {student.phone ? (
                                    <button type="button" onClick={() => handleWhatsapp(student)}>
                                      <Send size={16} />
                                      واتساب
                                    </button>
                                  ) : null}
                                  {canGenerate ? (
                                    <button type="button" onClick={() => handleGenerate(student)} disabled={generatingId === student.id}>
                                      <FileCheck2 size={16} />
                                      {generatingId === student.id ? "جاري الإصدار..." : "إصدار شهادة"}
                                    </button>
                                  ) : null}
                                  {student.certificate_status === "failed" ? (
                                    <button type="button" onClick={() => handleGenerate(student)} disabled={generatingId === student.id}>
                                      <RefreshCcw size={16} />
                                      إعادة إصدار الشهادة
                                    </button>
                                  ) : null}
                                  {canDownload ? (
                                    <button type="button" onClick={() => handleDownload(student)}>
                                      <Download size={16} />
                                      تحميل الشهادة
                                    </button>
                                  ) : null}
                                </div>
                              </details>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.graduatesPagination}>
                <div className={styles.paginationInfo}>
                  عرض {formatCount(fromItem)} إلى {formatCount(toItem)} من أصل {formatCount(filteredStudents.length)} طالب
                </div>
                <label className={styles.perPage}>
                  عدد العناصر
                  <select value={perPage} onChange={(event) => setPerPage(Number(event.target.value))}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <div className={styles.paginationActions}>
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>
                    السابق
                  </button>
                  <span>الصفحة {formatCount(safeCurrentPage)} من {formatCount(totalPages)}</span>
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage >= totalPages}>
                    التالي
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>

        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </div>
    </AdminAuthGuard>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  return (
    <article className={`${styles.graduateStatCard} ${styles[`graduateStat-${tone}`]}`}>
      <div className={styles.graduateStatIcon}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.graduatesFilterSelect}>
      <span>{label}</span>
      <div>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {children}
        </select>
        <ChevronDown size={16} />
      </div>
    </label>
  );
}

function GraduatesSkeleton() {
  return (
    <div className={styles.graduatesSkeletonWrap} aria-label="جاري تحميل الطلاب">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className={styles.graduatesSkeletonRow} key={index}>
          <span />
          <div>
            <strong />
            <small />
          </div>
          <em />
          <em />
        </div>
      ))}
    </div>
  );
}
