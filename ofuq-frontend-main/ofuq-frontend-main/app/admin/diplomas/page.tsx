"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Edit3,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  GraduationCap,
  Layers3,
  ListRestart,
  MoreVertical,
  Plus,
  RefreshCcw,
  Search,
  Tag,
  Trash2,
  UserCheck,
} from "lucide-react";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SectionsManager from "@/components/SectionsManager";
import styles from "./AdminDiplomas.module.css";

import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Diploma,
} from "@/utils/categoryService";
import { getAdminSections, type Section } from "@/utils/sectionService";

import { getBackendAssetUrl } from "@/utils/url";
import "@/styles/toast.css";

interface DiplomaFormData {
  name: string;
  description: string;
  price: string;
  is_free: boolean;
  is_published: boolean;
  slug: string;
  cover_image: File | null;
  display_order: string;
  section_id: string;
}

type StatusFilter = "all" | "published" | "draft";
type PriceFilter = "all" | "free" | "paid";
type ContentFilter = "all" | "with-courses" | "without-courses";
type SortOption = "order" | "newest" | "oldest" | "name" | "courses" | "graduates";

type DiplomaExtra = Diploma & {
  lessons_count?: number;
  graduates_count?: number;
  completed_students_count?: number;
  subscribers_count?: number;
  enrollments_count?: number;
};

const emptyForm: DiplomaFormData = {
  name: "",
  description: "",
  price: "0",
  is_free: true,
  is_published: true,
  slug: "",
  cover_image: null,
  display_order: "0",
  section_id: "",
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const formatCount = (value: number) => value.toLocaleString("ar-EG");

const getCoursesCount = (diploma: Diploma): number | null => {
  if (typeof diploma.courses_count === "number") return diploma.courses_count;
  const raw = (diploma as DiplomaExtra).courses_count;
  if (raw !== undefined && raw !== null) return Number(raw);
  return null;
};

const getLessonsCount = (diploma: Diploma): number | null => {
  const raw = (diploma as DiplomaExtra).lessons_count;
  if (raw !== undefined && raw !== null) return Number(raw);
  return null;
};

const getStudentsCount = (diploma: Diploma): number | null => {
  const extra = diploma as DiplomaExtra;
  const raw = diploma.students_count ?? extra.subscribers_count ?? extra.enrollments_count;
  if (raw !== undefined && raw !== null) return Number(raw);
  return null;
};

const getGraduatesCount = (diploma: Diploma): number | null => {
  const extra = diploma as DiplomaExtra;
  const raw = extra.graduates_count ?? extra.completed_students_count;
  if (raw !== undefined && raw !== null) return Number(raw);
  return null;
};

const getStatusText = (isPublished: boolean) => (isPublished ? "منشور" : "مسودة");

const formatPrice = (diploma: Diploma) => {
  const price = Number(diploma.price ?? 0);
  if (diploma.is_free || price === 0) return "مجاني";
  return `${price.toLocaleString("ar-EG")} ر.س`;
};

const formatDate = (value?: string) => {
  if (!value) return "غير متاح";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متاح";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const truncate = (value?: string, fallback = "لا يوجد وصف") => {
  const text = value?.trim();
  return text || fallback;
};

export default function AdminDiplomasPage() {
  const router = useRouter();

  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiplomaForm, setShowDiplomaForm] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingDiploma, setEditingDiploma] = useState<Diploma | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("order");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pendingDeleteDiploma, setPendingDeleteDiploma] = useState<Diploma | null>(null);
  const [isDeletingDiplomaId, setIsDeletingDiplomaId] = useState<number | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("info");

  const [diplomaFormData, setDiplomaFormData] = useState<DiplomaFormData>(emptyForm);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  const showToast = useCallback((
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const loadDiplomas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const diplomasData = await getAdminCategories();
      setDiplomas(diplomasData);
      const sectionsData = await getAdminSections();
      setSections(sectionsData);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "فشل في جلب الدبلومات");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDiplomas();
  }, [loadDiplomas]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priceFilter, contentFilter, sortOption, perPage]);

  const hasCourseCounts = useMemo(
    () => diplomas.some((diploma) => getCoursesCount(diploma) !== null),
    [diplomas]
  );

  const hasStudentCounts = useMemo(
    () => diplomas.some((diploma) => getStudentsCount(diploma) !== null),
    [diplomas]
  );

  const hasGraduateCounts = useMemo(
    () => diplomas.some((diploma) => getGraduatesCount(diploma) !== null),
    [diplomas]
  );

  const stats = useMemo(() => {
    const totalStudents = diplomas.reduce((sum, diploma) => sum + (getStudentsCount(diploma) ?? 0), 0);
    const totalGraduates = diplomas.reduce((sum, diploma) => sum + (getGraduatesCount(diploma) ?? 0), 0);

    return {
      total: diplomas.length,
      published: diplomas.filter((diploma) => Boolean(diploma.is_published)).length,
      drafts: diplomas.filter((diploma) => !Boolean(diploma.is_published)).length,
      free: diplomas.filter((diploma) => Boolean(diploma.is_free) || Number(diploma.price ?? 0) === 0).length,
      paid: diplomas.filter((diploma) => !Boolean(diploma.is_free) && Number(diploma.price ?? 0) > 0).length,
      withoutCourses: hasCourseCounts
        ? diplomas.filter((diploma) => (getCoursesCount(diploma) ?? 0) === 0).length
        : null,
      students: hasStudentCounts ? totalStudents : null,
      graduates: hasGraduateCounts ? totalGraduates : null,
    };
  }, [diplomas, hasCourseCounts, hasGraduateCounts, hasStudentCounts]);

  const filteredDiplomas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...diplomas]
      .filter((diploma) => {
        const coursesCount = getCoursesCount(diploma);
        const matchesQuery =
          !query ||
          diploma.name?.toLowerCase().includes(query) ||
          diploma.slug?.toLowerCase().includes(query) ||
          diploma.description?.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" && Boolean(diploma.is_published)) ||
          (statusFilter === "draft" && !Boolean(diploma.is_published));

        const matchesPrice =
          priceFilter === "all" ||
          (priceFilter === "free" && (Boolean(diploma.is_free) || Number(diploma.price ?? 0) === 0)) ||
          (priceFilter === "paid" && !Boolean(diploma.is_free) && Number(diploma.price ?? 0) > 0);

        const matchesContent =
          contentFilter === "all" ||
          (contentFilter === "with-courses" && coursesCount !== null && coursesCount > 0) ||
          (contentFilter === "without-courses" && coursesCount !== null && coursesCount === 0);

        return matchesQuery && matchesStatus && matchesPrice && matchesContent;
      })
      .sort((a, b) => {
        if (sortOption === "newest") {
          return new Date(b.created_at ?? b.updated_at ?? 0).getTime() - new Date(a.created_at ?? a.updated_at ?? 0).getTime();
        }
        if (sortOption === "oldest") {
          return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
        }
        if (sortOption === "name") {
          return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ar");
        }
        if (sortOption === "courses") {
          return (getCoursesCount(b) ?? -1) - (getCoursesCount(a) ?? -1);
        }
        if (sortOption === "graduates") {
          return (getGraduatesCount(b) ?? -1) - (getGraduatesCount(a) ?? -1);
        }
        return Number(a.display_order ?? Number.MAX_SAFE_INTEGER) - Number(b.display_order ?? Number.MAX_SAFE_INTEGER);
      });
  }, [contentFilter, diplomas, priceFilter, searchQuery, sortOption, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDiplomas.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = filteredDiplomas.length === 0 ? 0 : (safeCurrentPage - 1) * perPage;
  const paginatedDiplomas = filteredDiplomas.slice(startIndex, startIndex + perPage);
  const fromItem = filteredDiplomas.length === 0 ? 0 : startIndex + 1;
  const toItem = Math.min(startIndex + perPage, filteredDiplomas.length);
  const filtersAreActive =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    priceFilter !== "all" ||
    contentFilter !== "all" ||
    sortOption !== "order";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriceFilter("all");
    setContentFilter("all");
    setSortOption("order");
    setCurrentPage(1);
  };

  const resetForm = () => {
    setDiplomaFormData(emptyForm);
    setEditingDiploma(null);
    setCoverPreview(null);
    setSlugEdited(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowDiplomaForm(true);
  };

  const handleDiplomaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = {
        name: diplomaFormData.name,
        description: diplomaFormData.description,
        price: 0,
        is_free: true,
        is_published: Boolean(diplomaFormData.is_published),
        slug: diplomaFormData.slug,
        cover_image: diplomaFormData.cover_image || undefined,
        display_order: Number(diplomaFormData.display_order || "0"),
        section_id: diplomaFormData.section_id ? Number(diplomaFormData.section_id) : null,
      };

      const savedDiploma = editingDiploma
        ? await updateCategory(editingDiploma.id, payload)
        : await createCategory(payload);

      showToast(editingDiploma ? "تم التعديل بنجاح" : "تم إنشاء الدبلوم بنجاح", "success");
      setShowDiplomaForm(false);
      resetForm();
      setDiplomas((prev) => {
        if (editingDiploma) {
          return prev.map((diploma) => (diploma.id === savedDiploma.id ? savedDiploma : diploma));
        }
        return [savedDiploma, ...prev];
      });

      try {
        await loadDiplomas();
      } catch {
        showToast("تم الحفظ بنجاح، لكن تعذر تحديث القائمة تلقائيًا. حدّث الصفحة إذا لم تظهر البيانات الجديدة.", "warning");
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ غير متوقع"), "error");
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteDiploma) return;
    try {
      setIsDeletingDiplomaId(pendingDeleteDiploma.id);
      await deleteCategory(pendingDeleteDiploma.id);
      showToast("تم حذف الدبلوم بنجاح", "success");
      setDiplomas((prev) => prev.filter((diploma) => diploma.id !== pendingDeleteDiploma.id));
      setPendingDeleteDiploma(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "فشل في حذف الدبلوم"), "error");
    } finally {
      setIsDeletingDiplomaId(null);
    }
  };

  const handleEdit = (diploma: Diploma) => {
    setEditingDiploma(diploma);
    setDiplomaFormData({
      name: diploma.name,
      description: diploma.description ?? "",
      price: "0",
      is_free: true,
      is_published: Boolean(diploma.is_published),
      slug: diploma.slug ?? "",
      cover_image: null,
      display_order: String(diploma.display_order ?? 0),
      section_id: diploma.section_id ? String(diploma.section_id) : "",
    });
    setCoverPreview(diploma.cover_image_url ? getBackendAssetUrl(diploma.cover_image_url) : null);
    setShowDiplomaForm(true);
  };

  const handleViewDetails = (diplomaId: number) => router.push(`/admin/diplomas/${diplomaId}`);
  const handleViewStudents = (diplomaId: number) => router.push(`/admin/diplomas/${diplomaId}/students`);
  const handleAddCourse = (diplomaId: number) => router.push(`/admin/courses/new?diploma_id=${diplomaId}`);

  return (
    <div className={styles.container} dir="rtl">
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>لوحة الإدارة</p>
          <h1 className={styles.title}>إدارة الدبلومات</h1>
          <p className={styles.subtitle}>إدارة البرامج التعليمية، المقررات المرتبطة، حالة النشر، الطلاب والخريجين.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={() => setSectionsOpen(true)} type="button">
            <FolderKanban size={18} />
            إدارة الأقسام
          </button>
          <button className={styles.btnPrimary} onClick={openCreateForm} type="button">
            <Plus size={18} />
            إضافة دبلوم جديد
          </button>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="إحصائيات الدبلومات الحالية">
        <StatCard icon={<GraduationCap size={20} />} label="إجمالي الدبلومات" value={formatCount(stats.total)} />
        <StatCard icon={<Eye size={20} />} label="الدبلومات المنشورة" value={formatCount(stats.published)} tone="success" />
        <StatCard icon={<FileText size={20} />} label="غير المنشورة" value={formatCount(stats.drafts)} tone="warning" />
        <StatCard icon={<Tag size={20} />} label="الدبلومات المجانية" value={formatCount(stats.free)} />
        <StatCard icon={<Tag size={20} />} label="الدبلومات المدفوعة" value={formatCount(stats.paid)} />
        <StatCard icon={<BookOpen size={20} />} label="بدون مقررات" value={stats.withoutCourses === null ? "غير متاح" : formatCount(stats.withoutCourses)} tone="muted" />
      </section>

      <section className={styles.managementPanel}>
        <div className={styles.toolbar}>
          <div>
            <h2>قائمة الدبلومات</h2>
            <p>النتائج والإحصائيات محسوبة من القائمة الحالية التي تم جلبها من الخادم.</p>
          </div>
        </div>

        <div className={styles.filtersBar}>
          <label className={styles.searchField}>
            <Search size={18} />
            <input
              type="search"
              placeholder="ابحث باسم الدبلومة أو الرابط أو الوصف"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <FilterSelect label="الحالة" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)}>
            <option value="all">كل الحالات</option>
            <option value="published">منشور</option>
            <option value="draft">غير منشور / مسودة</option>
          </FilterSelect>

          <FilterSelect label="التسعير" value={priceFilter} onChange={(value) => setPriceFilter(value as PriceFilter)}>
            <option value="all">كل الأسعار</option>
            <option value="free">مجاني</option>
            <option value="paid">مدفوع</option>
          </FilterSelect>

          {hasCourseCounts ? (
            <FilterSelect label="المحتوى" value={contentFilter} onChange={(value) => setContentFilter(value as ContentFilter)}>
              <option value="all">كل الدبلومات</option>
              <option value="with-courses">بها مقررات</option>
              <option value="without-courses">بدون مقررات</option>
            </FilterSelect>
          ) : null}

          <FilterSelect label="الترتيب" value={sortOption} onChange={(value) => setSortOption(value as SortOption)}>
            <option value="order">حسب الترتيب</option>
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
            <option value="name">الاسم أ-ي</option>
            {hasCourseCounts ? <option value="courses">الأكثر مقررات</option> : null}
            {hasGraduateCounts ? <option value="graduates">الأكثر خريجين</option> : null}
          </FilterSelect>

          <button type="button" className={styles.btnReset} onClick={resetFilters} disabled={!filtersAreActive}>
            <ListRestart size={17} />
            إعادة ضبط
          </button>
        </div>

        {loading ? <DiplomasSkeleton /> : null}

        {error && !loading ? (
          <div className={styles.stateCard}>
            <div>
              <h3>تعذر جلب الدبلومات</h3>
              <p>{error}</p>
            </div>
            <button type="button" className={styles.btnSecondary} onClick={loadDiplomas}>
              <RefreshCcw size={17} />
              إعادة المحاولة
            </button>
          </div>
        ) : null}

        {!loading && !error && diplomas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <GraduationCap size={34} />
            </div>
            <div className={styles.emptyTitle}>لا توجد دبلومات بعد</div>
            <p>ابدأ بإضافة أول دبلوم للمنصة.</p>
            <button type="button" className={styles.btnPrimary} onClick={openCreateForm}>
              <Plus size={18} />
              إضافة أول دبلوم
            </button>
          </div>
        ) : null}

        {!loading && !error && diplomas.length > 0 && filteredDiplomas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Filter size={34} />
            </div>
            <div className={styles.emptyTitle}>لا توجد نتائج مطابقة للفلاتر الحالية</div>
            <p>جرّب تغيير البحث أو إعادة ضبط الفلاتر.</p>
            <button type="button" className={styles.btnReset} onClick={resetFilters}>
              <ListRestart size={17} />
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : null}

        {!loading && !error && paginatedDiplomas.length > 0 ? (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>الدبلومة</th>
                    <th>الترتيب</th>
                    <th>الحالة</th>
                    <th>التسعير</th>
                    <th>المحتوى</th>
                    <th>آخر تحديث</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDiplomas.map((diploma) => {
                    const coursesCount = getCoursesCount(diploma);
                    const lessonsCount = getLessonsCount(diploma);
                    const coverUrl = getBackendAssetUrl(diploma.cover_image_url || "/logo.png");

                    return (
                      <tr key={diploma.id}>
                        <td>
                          <div className={styles.diplomaCell}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className={styles.thumb} src={coverUrl} alt={`غلاف ${diploma.name}`} />
                            <div className={styles.diplomaMeta}>
                              <strong>{diploma.name}</strong>
                              <span>{diploma.slug || "غير متاح"}</span>
                              <p>{truncate(diploma.description)}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.orderPill}>{formatCount(Number(diploma.display_order ?? 0))}</span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${diploma.is_published ? styles.badgePublished : styles.badgeDraft}`}>
                            {getStatusText(Boolean(diploma.is_published))}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${diploma.is_free || Number(diploma.price ?? 0) === 0 ? styles.priceFree : styles.pricePaid}`}>
                            {formatPrice(diploma)}
                          </span>
                        </td>
                        <td className={styles.mutedCell}>
                          {coursesCount === null
                            ? "غير متاح"
                            : lessonsCount === null
                              ? `${formatCount(coursesCount)} ${coursesCount === 1 ? "مقرر" : "مقررات"}`
                              : `${formatCount(coursesCount)} مقررات / ${formatCount(lessonsCount)} درس`}
                        </td>

                        <td className={styles.mutedCell}>{formatDate(diploma.updated_at ?? diploma.created_at)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button type="button" className={styles.manageButton} onClick={() => handleViewDetails(diploma.id)}>
                              إدارة الدبلومة
                            </button>
                            <details className={styles.actionsMenu}>
                              <summary aria-label={`إجراءات ${diploma.name}`}>
                                <MoreVertical size={18} />
                              </summary>
                              <div className={styles.actionsDropdown}>
                                <button type="button" onClick={() => handleViewDetails(diploma.id)}>
                                  <Eye size={16} />
                                  عرض
                                </button>
                                <button type="button" onClick={() => handleEdit(diploma)}>
                                  <Edit3 size={16} />
                                  تعديل
                                </button>
                                <button type="button" onClick={() => handleViewDetails(diploma.id)}>
                                  <Layers3 size={16} />
                                  إدارة المقررات
                                </button>
                                <button type="button" onClick={() => handleAddCourse(diploma.id)}>
                                  <Plus size={16} />
                                  إضافة مقرر
                                </button>
                                <button type="button" onClick={() => handleViewStudents(diploma.id)}>
                                  <UserCheck size={16} />
                                  الخريجون
                                </button>
                                <button type="button" onClick={() => router.push(`/admin/reports/diplomas/${diploma.id}`)}>
                                  <BarChart3 size={16} />
                                  التقارير
                                </button>
                                <button
                                  type="button"
                                  className={styles.menuDanger}
                                  onClick={() => setPendingDeleteDiploma(diploma)}
                                  disabled={isDeletingDiplomaId === diploma.id}
                                >
                                  <Trash2 size={16} />
                                  {isDeletingDiplomaId === diploma.id ? "جاري الحذف..." : "حذف"}
                                </button>
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

            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                عرض {formatCount(fromItem)} إلى {formatCount(toItem)} من أصل {formatCount(filteredDiplomas.length)} دبلومة
              </div>
              <div className={styles.paginationActions}>
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>
                  السابق
                </button>
                <select className={styles.perPageCompact} value={perPage} onChange={(event) => setPerPage(Number(event.target.value))}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  الصفحة {formatCount(safeCurrentPage)} من {formatCount(totalPages)}
                </span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage >= totalPages}>
                  التالي
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {showDiplomaForm ? (
        <div className={styles.modalOverlay} onClick={() => setShowDiplomaForm(false)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingDiploma ? "تعديل الدبلوم" : "إضافة دبلوم جديد"}</h2>
              <button className={styles.closeBtn} onClick={() => setShowDiplomaForm(false)} type="button">×</button>
            </div>
            <form onSubmit={handleDiplomaSubmit} className={styles.form}>
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>معلومات الدبلوم الأساسية</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.formLabel}>اسم الدبلوم</label>
                    <input
                      type="text"
                      id="name"
                      className={styles.formInput}
                      value={diplomaFormData.name}
                      onChange={(event) => {
                        const newName = event.target.value;
                        setDiplomaFormData({
                          ...diplomaFormData,
                          name: newName,
                          slug: slugEdited ? diplomaFormData.slug : slugify(newName),
                        });
                      }}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="slug" className={styles.formLabel}>الرابط (Slug)</label>
                    <input
                      type="text"
                      id="slug"
                      className={styles.formInput}
                      value={diplomaFormData.slug}
                      onChange={(event) => {
                        setSlugEdited(true);
                        setDiplomaFormData({ ...diplomaFormData, slug: event.target.value });
                      }}
                      required
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                    <label htmlFor="description" className={styles.formLabel}>الوصف</label>
                    <textarea
                      id="description"
                      className={styles.formTextarea}
                      value={diplomaFormData.description}
                      onChange={(event) => setDiplomaFormData({ ...diplomaFormData, description: event.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="display_order" className={styles.formLabel}>الترتيب</label>
                    <input
                      type="number"
                      id="display_order"
                      className={styles.formInput}
                      value={diplomaFormData.display_order}
                      onChange={(event) => setDiplomaFormData({ ...diplomaFormData, display_order: event.target.value })}
                      min={0}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="section_id" className={styles.formLabel}>القسم</label>
                    <select
                      id="section_id"
                      className={styles.formInput}
                      value={diplomaFormData.section_id}
                      onChange={(event) => setDiplomaFormData({ ...diplomaFormData, section_id: event.target.value })}
                    >
                      <option value="">بدون قسم</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}{section.is_published ? "" : " (مخفي)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="cover_image" className={styles.formLabel}>صورة الغلاف</label>
                    <input
                      type="file"
                      id="cover_image"
                      className={styles.formInput}
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0] ?? null;
                        setDiplomaFormData({ ...diplomaFormData, cover_image: file });
                        setCoverPreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                  </div>
                  {coverPreview ? (
                    <div className={`${styles.previewWrap} ${styles.formGridFull}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverPreview} alt="معاينة صورة الغلاف" className={styles.previewImg} />
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => {
                          setCoverPreview(null);
                          setDiplomaFormData({ ...diplomaFormData, cover_image: null });
                        }}
                      >
                        إزالة المعاينة
                      </button>
                    </div>
                  ) : null}
                  <div className={styles.formGroup}>
                    <label className={styles.formCheckbox}>
                      <input
                        type="checkbox"
                        checked={diplomaFormData.is_published}
                        onChange={(event) => setDiplomaFormData({ ...diplomaFormData, is_published: event.target.checked })}
                      />
                      منشور
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary}>{editingDiploma ? "تحديث" : "إضافة"}</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowDiplomaForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteDiploma !== null}
        title="حذف الدبلوم"
        description={`هل أنت متأكد من حذف "${pendingDeleteDiploma?.name || "هذا الدبلوم"}"؟ سيتم فك ارتباط المقررات به ولا يمكن التراجع عن الحذف.`}
        confirmLabel="حذف الدبلوم"
        cancelLabel="إلغاء"
        variant="danger"
        loading={isDeletingDiplomaId !== null}
        onConfirm={handleDelete}
        onCancel={() => {
          if (isDeletingDiplomaId === null) setPendingDeleteDiploma(null);
        }}
      />

      <SectionsManager isOpen={sectionsOpen} onClose={() => setSectionsOpen(false)} onChanged={loadDiplomas} />

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
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
    <article className={`${styles.statCard} ${styles[`stat-${tone}`]}`}>
      <div className={styles.statIcon}>{icon}</div>
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
    <label className={styles.filterSelect}>
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

function DiplomasSkeleton() {
  return (
    <div className={styles.skeletonWrap} aria-label="جاري تحميل الدبلومات">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className={styles.skeletonRow} key={index}>
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
