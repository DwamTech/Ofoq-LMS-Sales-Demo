"use client";
import { brand } from "@/lib/brand";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import HomeHeader from "@/components/HomeHeader";
import Footer from "@/components/Footer";
import HeroSearchSection from "@/components/HeroSearchSection";
import CourseCard from "@/components/CourseCard";
import { SkeletonCourseCard } from "@/components/Skeleton";
import ScrollToTop from "@/components/ScrollToTop";
import SocialMediaFloat from "@/components/SocialMediaFloat";
import { getAllCourses, type Course } from "@/utils/courseService";
import { getPublicSectionsSafe, type Section } from "@/utils/sectionService";
import { getBackendAssetUrl } from "@/utils/url";
import styles from "../diploms/diploms.module.css";
import { AlertCircle, BookOpen } from "lucide-react";

function CoursesContent() {
  const searchParams = useSearchParams();
  const sectionSlug = searchParams.get("section") || "";
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedFilter, setSelectedFilter] = useState("الكل");
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    getPublicSectionsSafe().then(setSections);
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllCourses(
          sectionSlug ? { section: sectionSlug } : undefined,
        );
        setCourses(data);
      } catch (err) {
        console.error("Error loading courses:", err);
        setError("فشل في تحميل الكورسات");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [sectionSlug]);

  const activeSection = useMemo(
    () =>
      sectionSlug
        ? sections.find((section) => section.slug === sectionSlug)
        : undefined,
    [sectionSlug, sections],
  );

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (course) =>
          course.title?.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query) ||
          course.instructor?.name?.toLowerCase().includes(query),
      );
    }

    if (selectedFilter === "الأحدث") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      );
    } else if (selectedFilter === "الأكثر تسجيلاً") {
      result.sort(
        (a, b) => Number(b.students_count || 0) - Number(a.students_count || 0),
      );
    } else if (selectedFilter === "السعر (من الأقل)") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    return result;
  }, [courses, searchQuery, selectedFilter]);

  const pageTitle = activeSection
    ? `كورسات ${activeSection.name}`
    : `كورسات ${brand.name}`;

  return (
    <main className={styles.page}>
      <HeroSearchSection
        title={pageTitle}
        onSearch={setSearchQuery}
        onFilterChange={setSelectedFilter}
        searchQuery={searchQuery}
        activeFilter={selectedFilter}
      />

      <section className={styles["popular-courses-section"]}>
        <div className={styles["popular-courses-container"]}>
          <div className={styles["popular-courses-header"]}>
            <div className={styles["popular-courses-left"]}>
              <div className={styles["popular-badge"]}>الكورسات</div>
              <h2 className={styles["popular-title"]}>
                {searchQuery
                  ? `نتائج البحث عن "${searchQuery}"`
                  : activeSection
                    ? `كورسات ${activeSection.name}`
                    : "الكورسات المتاحة"}
                <span className={styles.resultCount}>
                  ({loading ? "..." : filteredCourses.length} كورس)
                </span>
              </h2>
            </div>
          </div>

          <div className={styles["courses-grid"]}>
            {loading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCourseCard key={i} />
                ))}
              </>
            ) : error ? (
              <div className={styles["error-state"]} role="alert">
                <span className={styles.stateIcon}>
                  <AlertCircle size={32} aria-hidden="true" />
                </span>
                <p>{error}</p>
              </div>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={String(course.id)}
                  title={course.title}
                  image={
                    getBackendAssetUrl(course.cover_image || "") ||
                    "/banner.jpg"
                  }
                  category={
                    course.section?.name || course.category?.name || "عام"
                  }
                  studentsCount={Number(course.students_count ?? 0)}
                  duration={`${Number(course.duration ?? 0)} ساعة`}
                  lessonsCount={Number(
                    course.lessons_count ?? course.chapters_count ?? 0,
                  )}
                  instructorName={
                    course.instructor?.name || `محاضر ${brand.name}`
                  }
                  instructorAvatar={course.instructor?.image || "/logo.png"}
                  price={Number(course.price ?? 0)}
                />
              ))
            ) : (
              <div className={styles["empty-state"]} role="status">
                <span className={styles.stateIcon}>
                  <BookOpen size={32} aria-hidden="true" />
                </span>
                <p>لا توجد كورسات تطابق معايير البحث</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CoursesPage() {
  return (
    <div dir="rtl">
      <HomeHeader />
      <Suspense
        fallback={
          <div className={styles["loading-state"]}>جاري التحميل...</div>
        }
      >
        <CoursesContent />
      </Suspense>
      <Footer />
      <ScrollToTop />
      <SocialMediaFloat />
    </div>
  );
}
