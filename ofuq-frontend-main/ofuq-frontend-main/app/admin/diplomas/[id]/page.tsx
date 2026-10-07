"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FolderKanban, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import Toast from "@/components/Toast";
import styles from "./AdminDiplomaCourses.module.css";
import "@/styles/toast.css";
import { deleteCategory, getAdminCategory, type Diploma } from "@/utils/categoryService";
import { deleteCourse, getAllCourses, getCourses, type Course } from "@/utils/courseService";
import { getBackendAssetUrl } from "@/utils/url";

type StatusFilter = "all" | "published" | "draft";
type PriceFilter = "all" | "free" | "paid";
type SortOption = "rank" | "newest" | "oldest" | "name" | "chapters";
type DeleteTarget = { type: "diploma" } | { type: "course"; course: Course } | null;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (isObject(error) && typeof error.message === "string") return error.message;
  return fallback;
}

function isCoursePublished(course: Course): boolean {
  if (typeof course.is_published === "boolean") return course.is_published;
  if (typeof course.status === "string") {
    const status = course.status.toLowerCase();
    return status === "published" || status === "1" || status === "true";
  }
  return false;
}

function getStatusText(published: boolean): string {
  return published ? "منشور" : "مسودة";
}

function getCourseStatusValue(course: Course): "published" | "draft" {
  return isCoursePublished(course) ? "published" : "draft";
}

function formatPrice(price: number, isFree?: boolean) {
  if (isFree || price === 0) return "مجاني";
  return `${price.toLocaleString("ar-EG")} ر.س`;
}

function formatDate(value?: string) {
  if (!value) return "غير متاح";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متاح";
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function getCourseCategoryId(course: Course): number {
  const extra = course as Course & { categoryId?: number | string };
  return Number(course.category_id ?? course.category?.id ?? extra.categoryId ?? 0);
}

function getCourseSections(course: Course) {
  if (course.sections && course.sections.length > 0) return course.sections;
  return course.section ? [course.section] : [];
}

function getCourseCoverUrl(course: Course) {
  const extra = course as Course & { cover_image_url?: string | null };
  return getBackendAssetUrl(extra.cover_image_url ?? course.cover_image);
}

function getChaptersCount(course: Course) {
  return Number(course.chapters_count ?? course.stats?.chapters_count ?? course.chapters?.length ?? 0);
}

function getLessonsCount(course: Course) {
  const chapterLessons = course.chapters?.reduce((total, chapter) => total + Number(chapter.lessons?.length ?? 0), 0);
  return Number(course.lessons_count ?? course.stats?.lessons_count ?? chapterLessons ?? 0);
}

function courseMatchesDiploma(course: Course, diplomaId: number) {
  return getCourseCategoryId(course) === diplomaId;
}

export default function AdminDiplomaPage() {
  const { id } = useParams() as { id: string };
  const diplomaId = Number(id);
  const router = useRouter();

  const [diploma, setDiploma] = useState<Diploma | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setDescriptionExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuCourseId, setOpenMenuCourseId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("rank");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("info");

  const showToast = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dip = await getAdminCategory(diplomaId);
      setDiploma(dip);

      const adminCourses = await getCourses();
      const filteredAdmin = adminCourses.filter((course) => courseMatchesDiploma(course, diplomaId));

      if (filteredAdmin.length > 0) {
        setCourses(filteredAdmin);
      } else {
        const publicCourses = await getAllCourses({ per_page: 200 });
        setCourses(publicCourses.filter((course) => courseMatchesDiploma(course, diplomaId)));
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "حدث خطأ في تحميل بيانات الدبلومة");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [diplomaId, showToast]);

  useEffect(() => {
    if (!Number.isNaN(diplomaId) && diplomaId > 0) {
      fetchData();
    } else {
      setError("معرف دبلومة غير صالح");
      setLoading(false);
    }
  }, [diplomaId, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, priceFilter, sectionFilter, sortOption, perPage]);

  const availableSections = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    courses.forEach((course) => {
      getCourseSections(course).forEach((section) => {
        map.set(section.id, { id: section.id, name: section.name });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [courses]);

  const coursesStats = useMemo(() => {
    const chapters = courses.reduce((total, course) => total + getChaptersCount(course), 0);
    const lessons = courses.reduce((total, course) => total + getLessonsCount(course), 0);
    const students = courses.reduce((total, course) => total + Number(course.students_count ?? 0), 0);
    return { chapters, lessons, students };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses
      .filter((course) => {
        if (!query) return true;
        return (
          course.title?.toLowerCase().includes(query) ||
          course.instructor?.name?.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
        );
      })
      .filter((course) => statusFilter === "all" || getCourseStatusValue(course) === statusFilter)
      .filter((course) => {
        if (priceFilter === "all") return true;
        const isFree = Boolean(course.is_free) || Number(course.price ?? 0) === 0;
        return priceFilter === "free" ? isFree : !isFree;
      })
      .filter((course) => {
        if (sectionFilter === "all") return true;
        return getCourseSections(course).some((section) => String(section.id) === sectionFilter);
      })
      .sort((a, b) => {
        if (sortOption === "name") return (a.title || "").localeCompare(b.title || "", "ar");
        if (sortOption === "chapters") return getChaptersCount(b) - getChaptersCount(a);
        if (sortOption === "oldest") return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        if (sortOption === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        return Number(a.rank ?? Number.MAX_SAFE_INTEGER) - Number(b.rank ?? Number.MAX_SAFE_INTEGER) || Number(a.id) - Number(b.id);
      });
  }, [courses, priceFilter, searchQuery, sectionFilter, sortOption, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageStart = filteredCourses.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const pageEnd = Math.min(safePage * perPage, filteredCourses.length);
  const paginatedCourses = filteredCourses.slice((safePage - 1) * perPage, safePage * perPage);

  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== "all" || priceFilter !== "all" || sectionFilter !== "all" || sortOption !== "rank";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriceFilter("all");
    setSectionFilter("all");
    setSortOption("rank");
  };

  const handleAddCourse = () => router.push(`/admin/courses/new?diploma_id=${diplomaId}`);
  const goBack = () => router.push("/admin/diplomas");

  const openDeleteDiploma = () => setDeleteTarget({ type: "diploma" });
  const openDeleteCourse = (course: Course) => {
    setOpenMenuCourseId(null);
    setDeleteTarget({ type: "course", course });
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.type === "diploma") {
        await deleteCategory(diplomaId);
        showToast("تم حذف الدبلومة بنجاح", "success");
        router.push("/admin/diplomas");
      } else {
        await deleteCourse(Number(deleteTarget.course.id));
        setCourses((prev) => prev.filter((course) => Number(course.id) !== Number(deleteTarget.course.id)));
        showToast("تم حذف المقرر بنجاح", "success");
        setDeleteTarget(null);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, deleteTarget.type === "diploma" ? "فشل في حذف الدبلومة" : "فشل في حذف المقرر");
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonGrid}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.skeletonPanel}>
          {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.stateCard}>
          <h2>تعذر تحميل تفاصيل الدبلومة</h2>
          <p>{error}</p>
          <div className={styles.stateActions}>
            <button className={styles.btnPrimary} onClick={fetchData}>إعادة المحاولة</button>
            <button className={styles.btnAction} onClick={goBack}>الرجوع للدبلومات</button>
          </div>
        </div>
        <Toast message={toastMessage} type={toastType} isVisible={toastVisible} onClose={() => setToastVisible(false)} />
      </div>
    );
  }

  if (!diploma) {
    return (
      <div className={styles.container}>
        <div className={styles.stateCard}>
          <h2>لم يتم العثور على الدبلومة المطلوبة.</h2>
          <button className={styles.btnPrimary} onClick={goBack}>الرجوع للدبلومات</button>
        </div>
      </div>
    );
  }

  const diplomaPublished = Boolean(diploma.is_published);
  const diplomaPrice = formatPrice(Number(diploma.price ?? 0), Boolean(diploma.is_free));
  const studentsCount = typeof diploma.students_count === "number" ? diploma.students_count : null;
  const description = diploma.description || "غير متاح";
  const shouldShowDescriptionToggle = description.length > 240;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleContainer}>
          <div className={styles.headerText}>
            <span className={styles.headerEyebrow}>تفاصيل دبلومة</span>
            <div className={styles.titleLine}>
              <h1 className={styles.title}>دبلومة: {diploma.name}</h1>
              <span className={diplomaPublished ? styles.statusPublished : styles.statusDraft}>{getStatusText(diplomaPublished)}</span>
            </div>
            <p className={styles.subtitle}>
              {courses.length.toLocaleString("ar-EG")} مقرر • {diplomaPrice} • آخر تحديث: {formatDate(diploma.updated_at)}
            </p>
          </div>
          <button className={styles.backButton} onClick={goBack}>الرجوع للدبلومات</button>
        </div>
      </header>

      <section className={styles.diplomaOverview}>
        <article className={styles.diplomaCard}>
          <div className={styles.diplomaCardHeader}>
            <div>
              <span className={styles.cardLabel}>بيانات الدبلومة</span>
              <h2>{diploma.name}</h2>
            </div>
            <span className={diplomaPublished ? styles.statusPublished : styles.statusDraft}>{getStatusText(diplomaPublished)}</span>
          </div>

          <p className={`${styles.description} ${isDescriptionExpanded ? styles.descriptionExpanded : ""}`}>
            {description}
          </p>
          {shouldShowDescriptionToggle && (
            <button type="button" className={styles.textButton} onClick={() => setDescriptionExpanded((value) => !value)}>
              {isDescriptionExpanded ? "عرض أقل" : "عرض المزيد"}
            </button>
          )}

          <dl className={styles.infoGrid}>
            <div>
              <dt>المعرف</dt>
              <dd>{diploma.id}</dd>
            </div>
            <div>
              <dt>السعر</dt>
              <dd>{diplomaPrice}</dd>
            </div>
            <div>
              <dt>عدد المقررات</dt>
              <dd>{courses.length.toLocaleString("ar-EG")}</dd>
            </div>
            <div>
              <dt>عدد الطلاب</dt>
              <dd>{studentsCount !== null ? studentsCount.toLocaleString("ar-EG") : "غير متاح"}</dd>
            </div>
            <div>
              <dt>آخر تحديث</dt>
              <dd>{formatDate(diploma.updated_at)}</dd>
            </div>
          </dl>
        </article>

        <aside className={styles.actionsPanel}>
          <span className={styles.cardLabel}>إجراءات الدبلومة</span>
          <button className={styles.btnPrimary} onClick={handleAddCourse}>إضافة مقرر جديد</button>
          <button className={styles.btnAction} onClick={() => router.push(`/admin/diplomas/${diplomaId}/students`)}>
            خريجو الدبلومة
          </button>
          <button className={styles.btnDangerSubtle} onClick={openDeleteDiploma} disabled={isDeleting}>
            حذف الدبلومة
          </button>
        </aside>
      </section>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>المقررات</span>
          <strong>{courses.length.toLocaleString("ar-EG")}</strong>
        </div>
        <div className={styles.statCard}>
          <span>الفصول</span>
          <strong>{coursesStats.chapters.toLocaleString("ar-EG")}</strong>
        </div>
        <div className={styles.statCard}>
          <span>الدروس</span>
          <strong>{coursesStats.lessons.toLocaleString("ar-EG")}</strong>
        </div>
        <div className={styles.statCard}>
          <span>الطلاب</span>
          <strong>{studentsCount !== null ? studentsCount.toLocaleString("ar-EG") : "غير متاح"}</strong>
        </div>
        <div className={styles.statCard}>
          <span>الحالة</span>
          <strong>{getStatusText(diplomaPublished)}</strong>
        </div>
        <div className={styles.statCard}>
          <span>السعر</span>
          <strong>{diplomaPrice}</strong>
        </div>
      </section>

      <section className={styles.list}>
        <div className={styles.listHeader}>
          <div>
            <h2 className={styles.sectionTitle}>مقررات الدبلومة</h2>
            <p>إدارة المقررات المرتبطة بهذه الدبلومة وفصولها ومحتواها.</p>
          </div>
          <button className={styles.btnPrimary} onClick={handleAddCourse}>إضافة مقرر جديد</button>
        </div>

        {courses.length > 0 ? (
          <>
            <div className={styles.filtersBar}>
              <div className={styles.searchField}>
                <input
                  type="text"
                  placeholder="ابحث باسم المقرر أو المدرب"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")}>×</button>}
              </div>
              <label>
                الحالة
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                  <option value="all">الكل</option>
                  <option value="published">منشور</option>
                  <option value="draft">مسودة</option>
                </select>
              </label>
              <label>
                السعر
                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}>
                  <option value="all">الكل</option>
                  <option value="free">مجاني</option>
                  <option value="paid">مدفوع</option>
                </select>
              </label>
              <label>
                القسم
                <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                  <option value="all">الكل</option>
                  {availableSections.map((section) => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </label>
              <label>
                الترتيب
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)}>
                  <option value="rank">حسب الترتيب</option>
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="name">الاسم أ-ي</option>
                  <option value="chapters">الأكثر فصولًا</option>
                </select>
              </label>
              <button className={styles.btnReset} onClick={resetFilters} disabled={!hasActiveFilters}>إعادة ضبط الفلاتر</button>
            </div>

            {filteredCourses.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>لا توجد مقررات مطابقة للفلاتر الحالية.</h3>
                <button className={styles.btnPrimary} onClick={resetFilters}>إعادة ضبط الفلاتر</button>
              </div>
            ) : (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>المقرر</th>
                        <th>الحالة</th>
                        <th>السعر</th>
                        <th>المحتوى</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCourses.map((course) => {
                        const published = isCoursePublished(course);
                        const coverUrl = getCourseCoverUrl(course);
                        const courseSections = getCourseSections(course);
                        const chaptersCount = getChaptersCount(course);
                        const lessonsCount = getLessonsCount(course);
                        const courseId = Number(course.id);
                        return (
                          <tr key={String(course.id)}>
                            <td>
                              <div className={styles.courseCell}>
                                {coverUrl ? (
                                  <img className={styles.coverThumb} src={coverUrl} alt={course.title} />
                                ) : (
                                  <div className={styles.coverThumbPlaceholder}>بدون صورة</div>
                                )}
                                <div className={styles.courseInfo}>
                                  <strong>{course.title}</strong>
                                  <span>{course.instructor?.name || "المدرب غير متاح"}</span>
                                  <small>{courseSections.length > 0 ? courseSections.map((section) => section.name).join("، ") : "غير مصنف"}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={published ? styles.statusPublished : styles.statusDraft}>{getStatusText(published)}</span>
                            </td>
                            <td>
                              <span className={Boolean(course.is_free) || Number(course.price ?? 0) === 0 ? styles.priceFree : styles.pricePaid}>
                                {formatPrice(Number(course.price ?? 0), Boolean(course.is_free))}
                              </span>
                            </td>
                            <td>
                              <div className={styles.contentCell}>
                                <strong>{chaptersCount.toLocaleString("ar-EG")} فصل</strong>
                                <span>{lessonsCount > 0 ? `${lessonsCount.toLocaleString("ar-EG")} درس` : "الدروس غير متاحة"}</span>
                              </div>
                            </td>
                            <td className={styles.actionsCell}>
                              <button
                                className={styles.btnAction}
                                title="إدارة المحتوى"
                                onClick={() => router.push(`/admin/diplomas/${diplomaId}/courses/${course.id}/chapters`)}
                              >
                                <FolderKanban size={18} />
                              </button>
                              <button
                                className={styles.btnAction}
                                title="عرض"
                                onClick={() => window.open(`/course-details/${course.id}`, '_blank')}
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                className={styles.btnAction}
                                title="تعديل"
                                onClick={() => router.push(`/admin/courses/${course.id}`)}
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                className={styles.btnAction}
                                style={{ color: '#ef4444', backgroundColor: '#fee2e2' }}
                                title="حذف"
                                onClick={() => openDeleteCourse(course)}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.pagination}>
                  <span>عرض {pageStart.toLocaleString("ar-EG")} إلى {pageEnd.toLocaleString("ar-EG")} من أصل {filteredCourses.length.toLocaleString("ar-EG")} مقررًا</span>
                  <label>
                    عدد العناصر
                    <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                      {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <div>
                    <button disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>السابق</button>
                    <strong>صفحة {safePage.toLocaleString("ar-EG")} من {totalPages.toLocaleString("ar-EG")}</strong>
                    <button disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>التالي</button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <h3>لا توجد مقررات في هذه الدبلومة بعد.</h3>
            <p>ابدأ بإضافة أول مقرر لهذه الدبلومة حتى يظهر للطلاب حسب إعدادات النشر.</p>
            <button className={styles.btnPrimary} onClick={handleAddCourse}>إضافة أول مقرر</button>
          </div>
        )}
      </section>

      {deleteTarget && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmModal}>
            <h2>{deleteTarget.type === "diploma" ? "حذف الدبلومة" : "حذف المقرر"}</h2>
            <p>
              {deleteTarget.type === "diploma"
                ? "هل أنت متأكد من حذف هذه الدبلومة؟ قد يؤثر ذلك على المقررات والطلاب المرتبطين بها."
                : `هل أنت متأكد من حذف المقرر "${deleteTarget.course.title}"؟ قد يتم حذف أو تعطيل الفصول المرتبطة به حسب إعدادات النظام.`}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnAction} onClick={() => setDeleteTarget(null)} disabled={isDeleting}>إلغاء</button>
              <button className={styles.btnDanger} onClick={performDelete} disabled={isDeleting}>
                {isDeleting ? "جاري الحذف..." : deleteTarget.type === "diploma" ? "حذف الدبلومة" : "حذف المقرر"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} type={toastType} isVisible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
}
