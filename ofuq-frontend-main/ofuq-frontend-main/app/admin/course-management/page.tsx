"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Edit3,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  Layers3,
  ListRestart,
  MoreVertical,
  Plus,
  RefreshCcw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import styles from "./AdminCourses.module.css";
import "@/styles/toast.css";
import { getCourses, deleteCourse, type Course } from "@/utils/courseService";
import { getBackendAssetUrl } from "@/utils/url";
import SectionsManager from "@/components/SectionsManager";

type StatusFilter = "all" | "published" | "draft" | "archived";
type PriceFilter = "all" | "free" | "paid";
type SortOption = "newest" | "oldest" | "name" | "chapters";

type CourseExtras = Course & {
  cover_image_url?: string;
  name_instructor?: string;
  price?: number | string;
  status?: Course["status"] | string | number | boolean;
  stats?: Course["stats"];
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const statusLabels: Record<string, string> = {
  published: "منشور",
  draft: "مسودة",
  archived: "مؤرشف",
  unpublished: "غير منشور",
  pending: "قيد المراجعة",
};

const getCourseStatus = (course: Course): string => {
  if (typeof course.is_published === "boolean") {
    return course.is_published ? "published" : "draft";
  }

  const rawStatus = String((course as CourseExtras).status ?? "").toLowerCase();
  if (rawStatus === "published" || rawStatus === "1" || rawStatus === "true") return "published";
  if (rawStatus === "archived") return "archived";
  if (rawStatus === "pending") return "pending";
  if (rawStatus === "unpublished") return "unpublished";
  return "draft";
};

const getStatusText = (status: string): string => statusLabels[status] ?? "غير منشور";

const getInstructorName = (course: Course): string => {
  const extraCourse = course as CourseExtras;
  return extraCourse.instructor?.name || extraCourse.name_instructor || "غير متاح";
};

const getSectionName = (course: Course): string => {
  if (Array.isArray(course.sections) && course.sections.length > 0) {
    return course.sections.map((section) => section.name).filter(Boolean).join("، ");
  }
  return course.section?.name || "";
};

const getChaptersCount = (course: Course): number => {
  return Number(course.chapters_count ?? course.chapters?.length ?? 0);
};

const getLessonsCount = (course: Course): number | null => {
  const extraCourse = course as CourseExtras;
  const direct = extraCourse.lessons_count ?? extraCourse.stats?.lessons_count;
  if (direct !== undefined && direct !== null) return Number(direct);
  if (Array.isArray(course.chapters)) {
    return course.chapters.reduce((sum, chapter) => sum + (chapter.lessons?.length ?? 0), 0);
  }
  return null;
};

const isFreeCourse = (course: Course): boolean => {
  return Boolean(course.is_free) || Number((course as CourseExtras).price ?? 0) === 0;
};

const formatPrice = (course: Course) => {
  const price = Number((course as CourseExtras).price ?? 0);
  if (isFreeCourse(course)) return "مجاني";
  return `${price.toLocaleString("ar-EG")} ر.س`;
};

const formatDate = (value?: string): string => {
  if (!value) return "غير متاح";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متاح";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatCount = (value: number): string => value.toLocaleString("ar-EG");

const getContentSummary = (course: Course): string => {
  const chapters = getChaptersCount(course);
  const lessons = getLessonsCount(course);
  const chaptersLabel = `${formatCount(chapters)} ${chapters === 1 ? "فصل" : "فصول"}`;
  if (lessons === null) return chaptersLabel;
  return `${chaptersLabel} / ${formatCount(lessons)} ${lessons === 1 ? "درس" : "دروس"}`;
};

const hasActiveFilters = (
  query: string,
  status: StatusFilter,
  section: string,
  price: PriceFilter,
  sort: SortOption
) => query.trim() !== "" || status !== "all" || section !== "all" || price !== "all" || sort !== "newest";

export default function AdminCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info" | "confirm">("info");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pendingDeleteCourseId, setPendingDeleteCourseId] = useState<number | null>(null);
  const [isDeletingCourseId, setIsDeletingCourseId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getCourses();
      setCourses(list);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "فشل في جلب الكورسات"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sectionFilter, priceFilter, sortOption, perPage]);

  const sectionOptions = useMemo(() => {
    const sections = new Map<string, string>();
    courses.forEach((course) => {
      const name = getSectionName(course);
      if (name) sections.set(name, name);
    });
    return Array.from(sections.values()).sort((a, b) => a.localeCompare(b, "ar"));
  }, [courses]);

  const stats = useMemo(() => {
    return {
      total: courses.length,
      published: courses.filter((course) => getCourseStatus(course) === "published").length,
      drafts: courses.filter((course) => getCourseStatus(course) !== "published").length,
      free: courses.filter(isFreeCourse).length,
      paid: courses.filter((course) => !isFreeCourse(course)).length,
      uncategorized: courses.filter((course) => !getSectionName(course)).length,
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...courses]
      .filter((course) => {
        const status = getCourseStatus(course);
        const sectionName = getSectionName(course);
        const matchesQuery =
          !query ||
          course.title?.toLowerCase().includes(query) ||
          getInstructorName(course).toLowerCase().includes(query) ||
          course.description?.toLowerCase?.().includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "draft" && status !== "published" && status !== "archived") ||
          status === statusFilter;

        const matchesSection =
          sectionFilter === "all" ||
          (sectionFilter === "uncategorized" && !sectionName) ||
          sectionName === sectionFilter;

        const matchesPrice =
          priceFilter === "all" ||
          (priceFilter === "free" && isFreeCourse(course)) ||
          (priceFilter === "paid" && !isFreeCourse(course));

        return matchesQuery && matchesStatus && matchesSection && matchesPrice;
      })
      .sort((a, b) => {
        if (sortOption === "oldest") {
          return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
        }
        if (sortOption === "name") {
          return String(a.title ?? "").localeCompare(String(b.title ?? ""), "ar");
        }
        if (sortOption === "chapters") {
          return getChaptersCount(b) - getChaptersCount(a);
        }
        return new Date(b.created_at ?? b.updated_at ?? 0).getTime() - new Date(a.created_at ?? a.updated_at ?? 0).getTime();
      });
  }, [courses, priceFilter, searchQuery, sectionFilter, sortOption, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = filteredCourses.length === 0 ? 0 : (safeCurrentPage - 1) * perPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + perPage);
  const fromItem = filteredCourses.length === 0 ? 0 : startIndex + 1;
  const toItem = Math.min(startIndex + perPage, filteredCourses.length);
  const pendingDeleteCourse = courses.find((course) => Number(course.id) === pendingDeleteCourseId);
  const filtersAreActive = hasActiveFilters(searchQuery, statusFilter, sectionFilter, priceFilter, sortOption);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSectionFilter("all");
    setPriceFilter("all");
    setSortOption("newest");
    setCurrentPage(1);
  };

  const confirmDeleteCourse = (courseId: number) => {
    setPendingDeleteCourseId(courseId);
  };

  const performDeleteCourse = async () => {
    if (!pendingDeleteCourseId) return;
    const courseId = pendingDeleteCourseId;
    try {
      setIsDeletingCourseId(courseId);
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((course) => Number(course.id) !== Number(courseId)));
      setToastType("success");
      setToastMessage("تم حذف الكورس بنجاح");
      setToastVisible(true);
    } catch (err: unknown) {
      setToastType("error");
      setToastMessage(getErrorMessage(err, "فشل في حذف الكورس"));
      setToastVisible(true);
    } finally {
      setIsDeletingCourseId(null);
      setPendingDeleteCourseId(null);
    }
  };

  return (
    <div className={styles["admin-courses-container"]} dir="rtl">
      <section className={styles["admin-courses-header"]}>
        <div>
          <p className={styles["admin-courses-eyebrow"]}>لوحة الإدارة</p>
          <h1 className={styles["admin-courses-title"]}>إدارة الكورسات</h1>
          <p className={styles["admin-courses-subtitle"]}>
            إدارة المحتوى التعليمي، الكورسات، الفصول، حالة النشر والمدربين.
          </p>
        </div>
        <div className={styles["header-actions"]}>
          <button
            type="button"
            className={styles["btn-primary"]}
            onClick={() => router.push("/admin/course-management/new")}
            data-demo-allow
          >
            <Plus size={18} />
            إضافة كورس جديد
          </button>
          <button type="button" className={styles["btn-secondary"]} onClick={() => setSectionsOpen(true)}>
            <FolderKanban size={18} />
            إدارة الأقسام
          </button>
        </div>
      </section>

      <section className={styles["stats-grid"]} aria-label="إحصائيات الكورسات الحالية">
        <StatCard icon={<BookOpen size={20} />} label="إجمالي الكورسات" value={stats.total} />
        <StatCard icon={<Eye size={20} />} label="الكورسات المنشورة" value={stats.published} tone="success" />
        <StatCard icon={<FileText size={20} />} label="غير المنشورة" value={stats.drafts} tone="warning" />
        <StatCard icon={<Tag size={20} />} label="الكورسات المجانية" value={stats.free} />
        <StatCard icon={<Tag size={20} />} label="الكورسات المدفوعة" value={stats.paid} />
        <StatCard icon={<Layers3 size={20} />} label="بدون قسم" value={stats.uncategorized} tone="muted" />
      </section>

      <section className={styles["management-panel"]}>
        <div className={styles["toolbar"]}>
          <div>
            <h2>قائمة الكورسات</h2>
            <p>الإحصائيات والنتائج محسوبة من القائمة الحالية التي تم جلبها من الخادم.</p>
          </div>
        </div>

        <div className={styles["filters-bar"]}>
          <label className={styles["search-field"]}>
            <Search size={18} />
            <input
              type="search"
              placeholder="ابحث باسم الكورس أو المدرب"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <FilterSelect label="الحالة" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)}>
            <option value="all">كل الحالات</option>
            <option value="published">منشور</option>
            <option value="draft">غير منشور / مسودة</option>
            <option value="archived">مؤرشف</option>
          </FilterSelect>

          <FilterSelect label="القسم" value={sectionFilter} onChange={setSectionFilter}>
            <option value="all">كل الأقسام</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
            <option value="uncategorized">بدون قسم</option>
          </FilterSelect>

          <FilterSelect label="السعر" value={priceFilter} onChange={(value) => setPriceFilter(value as PriceFilter)}>
            <option value="all">كل الأسعار</option>
            <option value="free">مجاني</option>
            <option value="paid">مدفوع</option>
          </FilterSelect>

          <FilterSelect label="الترتيب" value={sortOption} onChange={(value) => setSortOption(value as SortOption)}>
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
            <option value="name">الاسم أ-ي</option>
            <option value="chapters">الأكثر فصولًا</option>
          </FilterSelect>

          <button type="button" className={styles["btn-reset"]} onClick={resetFilters} disabled={!filtersAreActive}>
            <ListRestart size={17} />
            إعادة ضبط
          </button>
        </div>

        {loading && <CoursesSkeleton />}

        {error && !loading && (
          <div className={styles["state-card"]}>
            <div>
              <h3>تعذر جلب الكورسات</h3>
              <p>{error}</p>
            </div>
            <button type="button" className={styles["btn-secondary"]} onClick={fetchData}>
              <RefreshCcw size={17} />
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className={styles["empty-state"]}>
            <div className={styles["empty-state-icon"]}>
              <BookOpen size={34} />
            </div>
            <div className={styles["empty-state-title"]}>لا توجد كورسات بعد</div>
            <div className={styles["empty-state-description"]}>ابدأ بإضافة أول كورس للمنصة.</div>
            <button type="button" className={styles["btn-primary"]} onClick={() => router.push("/admin/course-management/new")} data-demo-allow>
              <Plus size={18} />
              إضافة أول كورس
            </button>
          </div>
        )}

        {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
          <div className={styles["empty-state"]}>
            <div className={styles["empty-state-icon"]}>
              <Filter size={34} />
            </div>
            <div className={styles["empty-state-title"]}>لا توجد نتائج مطابقة للفلاتر الحالية</div>
            <div className={styles["empty-state-description"]}>جرّب تغيير البحث أو إعادة ضبط الفلاتر.</div>
            <button type="button" className={styles["btn-reset"]} onClick={resetFilters}>
              <ListRestart size={17} />
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}

        {!loading && !error && paginatedCourses.length > 0 && (
          <>
            <div className={styles["courses-table-container"]}>
              <table className={styles["courses-table"]}>
                <thead>
                  <tr>
                    <th>الكورس</th>
                    <th>القسم</th>
                    <th>الحالة</th>
                    <th>السعر</th>
                    <th>المحتوى</th>
                    <th>آخر تحديث</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCourses.map((course) => {
                    const status = getCourseStatus(course);
                    const sectionName = getSectionName(course);
                    const extraCourse = course as CourseExtras;
                    const coverUrl = getBackendAssetUrl(extraCourse.cover_image ?? extraCourse.cover_image_url);

                    return (
                      <tr key={String(course.id)}>
                        <td>
                          <div className={styles["course-cell"]}>
                            {coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img className={styles["cover-thumb"]} src={coverUrl} alt={course.title} />
                            ) : (
                              <div className={styles["cover-placeholder"]}>
                                <BookOpen size={20} />
                              </div>
                            )}
                            <div className={styles["course-meta"]}>
                              <strong>{course.title || "بدون عنوان"}</strong>
                              <span>{getInstructorName(course)}</span>
                              {sectionName ? <small>{sectionName}</small> : <small>غير مصنف</small>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${sectionName ? styles["badge-neutral"] : styles["badge-warning"]}`}>
                            {sectionName || "غير مصنف"}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[`status-${status}`] || styles["status-draft"]}`}>
                            {getStatusText(status)}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${isFreeCourse(course) ? styles["badge-success"] : styles["badge-paid"]}`}>
                            {formatPrice(course)}
                          </span>
                        </td>
                        <td className={styles["content-cell"]}>{getContentSummary(course)}</td>
                        <td className={styles["date-cell"]}>{formatDate(course.updated_at ?? course.created_at)}</td>
                        <td>
                          <div className={styles["row-actions"]}>
                            <button
                              type="button"
                              className={styles["manage-button"]}
                              onClick={() => router.push(`/admin/courses/${course.id}/chapters`)}
                            >
                              إدارة المحتوى
                            </button>
                            <details className={styles["actions-menu"]}>
                              <summary aria-label={`إجراءات ${course.title}`}>
                                <MoreVertical size={18} />
                              </summary>
                              <div className={styles["actions-dropdown"]}>
                                <button type="button" onClick={() => router.push(`/course-details/${course.id}`)}>
                                  <Eye size={16} />
                                  عرض
                                </button>
                                <button type="button" onClick={() => router.push(`/admin/courses/${course.id}`)}>
                                  <Edit3 size={16} />
                                  تعديل
                                </button>
                                <button type="button" onClick={() => router.push(`/admin/courses/${course.id}/chapters`)}>
                                  <Layers3 size={16} />
                                  إدارة الفصول
                                </button>
                                <button
                                  type="button"
                                  className={styles["menu-danger"]}
                                  onClick={() => confirmDeleteCourse(Number(course.id))}
                                  disabled={isDeletingCourseId === Number(course.id)}
                                >
                                  <Trash2 size={16} />
                                  {isDeletingCourseId === Number(course.id) ? "جاري الحذف..." : "حذف"}
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
              <div className={styles["pagination-info"]}>
                عرض {formatCount(fromItem)} إلى {formatCount(toItem)} من أصل {formatCount(filteredCourses.length)} كورس
              </div>
              <div className={styles["pagination-actions"]}>
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>
                  السابق
                </button>
                <select className={styles["per-page-compact"]} value={perPage} onChange={(event) => setPerPage(Number(event.target.value))}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  الصفحة {formatCount(safeCurrentPage)} من {formatCount(totalPages)}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage >= totalPages}
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={4000}
      />

      <ConfirmDialog
        open={pendingDeleteCourseId !== null}
        title="حذف الكورس"
        description={`هل أنت متأكد من حذف "${pendingDeleteCourse?.title || "هذا الكورس"}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف الكورس"
        cancelLabel="إلغاء"
        variant="danger"
        loading={isDeletingCourseId !== null}
        onConfirm={performDeleteCourse}
        onCancel={() => {
          if (isDeletingCourseId === null) setPendingDeleteCourseId(null);
        }}
      />

      <SectionsManager isOpen={sectionsOpen} onClose={() => setSectionsOpen(false)} onChanged={fetchData} />
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
  value: number;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  return (
    <article className={`${styles["stat-card"]} ${styles[`stat-${tone}`]}`}>
      <div className={styles["stat-icon"]}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{formatCount(value)}</strong>
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
    <label className={styles["filter-select"]}>
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

function CoursesSkeleton() {
  return (
    <div className={styles["skeleton-wrap"]} aria-label="جاري تحميل الكورسات">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className={styles["skeleton-row"]} key={index}>
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
