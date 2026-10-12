"use client";
import { brand } from "@/lib/brand";
import { BookOpen, Clock3, Layers3, ArrowUpLeft } from "lucide-react";
import { ProgramGraphic } from "@/components/brand/ProgramGraphic";
import details from "./CourseDetails.module.css";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import HomeHeader from "../../../components/HomeHeader";
import Footer from "../../../components/Footer";
import VideoSection from "../../../components/VideoSection";
import CourseSidebar from "../../../components/CourseSidebar";
import CourseContent from "../../../components/CourseContent";
import ScrollToTop from "../../../components/ScrollToTop";
import { CourseDetailsSkeleton } from "../../../components/Skeleton";
import SocialMediaFloat from "../../../components/SocialMediaFloat";
import {
  getCourseDetails,
  getFeaturedCourses,
  getMyEnrollments,
  Course,
  checkCourseAccess,
  enrollCourse,
} from "../../../utils/courseService";
import { isAuthenticated } from "../../../utils/authService";
import { getBackendAssetUrl } from "../../../utils/url";
import {
  getMyDiplomas,
  enrollInDiploma,
  type MyDiploma,
} from "@/utils/categoryService";
import { getPublicDiplomas, type Diploma } from "@/utils/categoryService";
import {
  courseActionLabel,
  publicDescription,
} from "@/components/brand/publicContent";
import education from "@/components/brand/PublicEducation.module.css";
import EnrollmentInfoModal from "../../../components/EnrollmentInfoModal";
import Link from "next/link";
import "../../../styles/course-details.css";
import "../../../styles/course-cards.css";
import Toast from "../../../components/Toast";
import "@/styles/toast.css";

const CourseDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [courseData, setCourseData] = useState<Course | null>(null);
  const [parentDiploma, setParentDiploma] = useState<Diploma | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);
  const [, setPopularCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setIsEnrolled] = useState<boolean>(false);
  const [myDiplomas, setMyDiplomas] = useState<MyDiploma[]>([]);
  const [courseAccess, setCourseAccess] = useState<{
    allowed: boolean;
    statusCode?: number;
    reason?: string;
  }>({ allowed: false });

  // Diploma Enrollment State
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [, setEnrollStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "warning" | "info" | "confirm"
  >("info");

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" | "confirm" = "info",
    duration = 3000,
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    if (duration > 0) {
      setTimeout(() => setToastVisible(false), duration);
    }
  };

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);

        // Load course details and featured courses in parallel
        const [course, featured, diplomas] = await Promise.all([
          getCourseDetails(courseId),
          getFeaturedCourses(),
          getPublicDiplomas().catch(() => []),
        ]);

        setCourseData(course);
        setParentDiploma(
          diplomas.find(
            (diploma) => diploma.id === Number(course?.category_id),
          ) || null,
        );
        setPopularCourses(featured.slice(0, 3)); // Show only 3 featured courses
      } catch (err) {
        console.error("Error loading course data:", err);
        setError("فشل في تحميل بيانات الكورس");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  // Check if user is enrolled in this course (if authenticated)
  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        if (!courseId || !isAuthenticated()) return;
        const myCoursesResponse = await getMyEnrollments();
        const myCourses = myCoursesResponse.data;
        const courseIdNum = Number(courseId);
        setIsEnrolled(myCourses.some((course) => course.id === courseIdNum));
      } catch (err) {
        console.warn("Failed to check enrollment:", err);
      }
    };

    checkEnrollment();
  }, [courseId]);

  // حارس الوصول عبر GET /api/courses/{courseId}/progress
  useEffect(() => {
    const guardAccess = async () => {
      try {
        if (!courseId) return;
        const result = await checkCourseAccess(courseId);
        setCourseAccess(result);
      } catch (err) {
        console.warn("Failed to guard course access:", err);
        setCourseAccess({ allowed: false, reason: "forbidden" });
      }
    };
    guardAccess();
  }, [courseId]);

  useEffect(() => {
    const fetchMyDiplomas = async () => {
      try {
        if (!isAuthenticated()) {
          setMyDiplomas([]);
          return;
        }
        const list = await getMyDiplomas();
        setMyDiplomas(list);
      } catch (err) {
        console.warn("Failed to fetch my diplomas:", err);
        setMyDiplomas([]);
      }
    };
    fetchMyDiplomas();
  }, []);

  const handleEnrollmentSubmit = async () => {
    const categoryId = courseData?.category?.id || courseData?.category_id;
    if (!categoryId) return;

    try {
      setEnrollStatus({ type: "loading" });
      const res = await enrollInDiploma(categoryId);
      setEnrollStatus({
        type: "success",
        message:
          (res instanceof Error ? res.message : undefined) ||
          "تم التسجيل بنجاح",
      });
      setIsEnrollmentModalOpen(false);
      showToast("تم الاشتراك في الدبلومة بنجاح", "success");

      // Refresh access check
      const access = await checkCourseAccess(courseId);
      setCourseAccess(access);

      // Refresh my diplomas list
      const list = await getMyDiplomas();
      setMyDiplomas(list);
    } catch (e) {
      setEnrollStatus({
        type: "error",
        message:
          (e instanceof Error ? e.message : undefined) ||
          "فشلت عملية التسجيل بالدبلومة",
      });
      showToast(
        (e instanceof Error ? e.message : undefined) || "فشلت عملية التسجيل",
        "error",
      );
    }
  };

  const handlePrimaryAction = () => {
    const categoryIdNum = Number(
      courseData?.category_id ?? courseData?.category?.id ?? 0,
    );

    if (courseAccess.allowed) {
      const chapters = (courseData?.chapters || [])
        .slice()
        .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
      const firstLesson = chapters.length
        ? (chapters[0]?.lessons || [])
            .slice()
            .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))[0]
        : null;
      if (firstLesson) {
        router.push(
          `/watch?lessonId=${firstLesson.id}&chapterId=${chapters[0].id}&courseId=${courseId}&completeOnOpen=1`,
        );
      } else {
        router.push("/user/my_courses");
      }
      return;
    }

    if (!isAuthenticated()) {
      showToast("يرجى تسجيل الدخول لإتمام الاشتراك", "warning");
      router.push("/auth");
      return;
    }

    if (categoryIdNum) {
      // Check if already enrolled in diploma (client-side check optimization)
      const isDiplomaEnrolled = myDiplomas.some(
        (d) => d.category?.id === categoryIdNum,
      );

      if (isDiplomaEnrolled) {
        // Should have been caught by courseAccess.allowed, but just in case
        // Maybe refresh access?
        window.location.reload();
        return;
      }

      // Open Enrollment Modal instead of redirecting
      setIsEnrollmentModalOpen(true);
      return;
    }

    (async () => {
      try {
        const ok = await enrollCourse(courseId);
        if (ok) {
          showToast("تم التسجيل في الكورس بنجاح", "success");
          const access = await checkCourseAccess(courseId);
          setCourseAccess(access);
          if (access.allowed) {
            const chapters = (courseData?.chapters || [])
              .slice()
              .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
            const firstLesson = chapters.length
              ? (chapters[0]?.lessons || [])
                  .slice()
                  .sort(
                    (a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0),
                  )[0]
              : null;
            if (firstLesson) {
              router.push(
                `/watch?lessonId=${firstLesson.id}&chapterId=${chapters[0].id}&courseId=${courseId}&completeOnOpen=1`,
              );
            } else {
              router.push("/user/my_courses");
            }
          }
        }
      } catch (err) {
        console.error("Enroll course error:", err);
        showToast(
          (err instanceof Error ? err.message : undefined) ||
            "فشل الاشتراك بالكورس",
          "error",
        );
      }
    })();
  };

  if (loading) {
    return (
      <div className="course-details-page">
        <HomeHeader />
        <main className="main-content">
          <CourseDetailsSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="course-details-page">
        <HomeHeader />
        <main className="main-content">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
              fontSize: "18px",
              color: "#e74c3c",
            }}
          >
            {error || "الكورس غير موجود"}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className={`course-details-page ${education.coursePage} ${details.page}`}
    >
      <HomeHeader />
      <section className={education.courseHero}>
        <nav aria-label="مسار المقرر">
          <Link href="/courses">المقررات</Link>
          <span aria-hidden="true"> / </span>
          {parentDiploma ? (
            <Link href={`/diplomas/${parentDiploma.slug}`}>
              {parentDiploma.name}
            </Link>
          ) : (
            <span>مقرر تعليمي</span>
          )}
        </nav>
        <span className={education.kicker}>
          كتالوج تجربة {brand.name} · محتوى تعليمي للعرض
        </span>
        <h1>{courseData.title}</h1>
        <p>{publicDescription(courseData.description)}</p>
        <div className={details.heroMeta}>
          <span>
            <Layers3 size={18} />
            {courseData.chapters?.length ?? 0} فصول
          </span>
          <span>
            <BookOpen size={18} />
            {courseData.chapters?.reduce(
              (sum, ch) => sum + (ch.lessons?.length ?? 0),
              0,
            ) ?? 0}{" "}
            دروس
          </span>
          <span>
            <Clock3 size={18} />
            {courseData.duration ?? 0} ساعات
          </span>
        </div>
        <div className={details.heroArt} aria-hidden="true">
          <ProgramGraphic
            title={courseData.title}
            identity={String(courseData.id)}
          />
          <span className={details.artAccent}>
            <ArrowUpLeft size={30} />
          </span>
        </div>
      </section>
      <main className="main-content">
        <div className="course-details-container">
          {/* Left Content */}
          <div className="left-content">
            {/**
             * اختر فيديو المعاينة: أول درس مرئي (is_visible = true) عبر كل فصول الكورس
             * يعتمد على أن الباك اند يعرض video_url للدرس المرئي حتى لغير المشتركين
             */}
            {(() => {
              const chapters = courseData?.chapters || [];
              const lessons = chapters.flatMap((ch) => ch?.lessons || []);
              const visibleLessons = lessons
                .filter(
                  (ls) =>
                    !!ls &&
                    (ls.is_visible === true || ls.is_visible === 1) &&
                    !!ls.video_url,
                )
                .sort(
                  (a, b) => Number(a?.order ?? 9999) - Number(b?.order ?? 9999),
                );
              const previewVideoUrl = visibleLessons[0]?.video_url;
              if (!previewVideoUrl)
                return (
                  <section
                    className={education.emptyMedia}
                    aria-label="معاينة المقرر"
                  >
                    <span>معاينة المقرر</span>
                    <h2>استكشف المنهج أولًا.</h2>
                    <p>
                      لا توجد معاينة فيديو متاحة لهذا المقرر حاليًا. يمكنك
                      الاطلاع على الفصول والدروس أدناه؛ الوصول إلى المحتوى
                      الكامل يخضع لصلاحيات التسجيل.
                    </p>
                    <a href="#course-curriculum">انتقل إلى المنهج ↓</a>
                  </section>
                );
              const thumbnail = getBackendAssetUrl(
                courseData.cover_image_url ||
                  courseData.coverImage ||
                  courseData.image ||
                  courseData.cover_image,
              );
              return (
                <VideoSection
                  thumbnailUrl={thumbnail}
                  videoUrl={getBackendAssetUrl(previewVideoUrl)}
                  alt={`${courseData.title} Preview Video`}
                />
              );
            })()}
            {(() => {
              if (courseAccess.allowed) return null;
              const catSlug =
                parentDiploma?.slug || String(courseData?.category?.slug || "");
              const catName = String(
                courseData?.category?.name || "الدبلومة الأم",
              );
              return (
                <div className="preview-notice">
                  الوصول إلى محتوى المقرر يتطلب التسجيل. استكشف{" "}
                  {catSlug ? (
                    <Link
                      href={`/diplomas/${catSlug}`}
                      className="preview-notice-link"
                    >
                      {catName}
                    </Link>
                  ) : (
                    <Link href="/diploms" className="preview-notice-link">
                      الدبلومات
                    </Link>
                  )}
                  .
                </div>
              );
            })()}
            <CourseContent
              publicView
              courseTitle={courseData.title}
              lecturesCount={
                (courseData.chapters || []).reduce(
                  (sum, ch) => sum + (ch.lessons || []).length,
                  0,
                ) ||
                Number(courseData.lessons_count ?? 0) ||
                Number(courseData.chapters_count ?? 0) // Use real lessons count
              }
              studentsCount={Number(courseData.students_count ?? 0)} // Use real students count
              hoursCount={Number(courseData.duration ?? 0)} // Use real duration
              courseStats={courseData.stats}
              courseDescription={courseData.description}
              courseId={courseId}
              isEnrolled={courseAccess.allowed}
              chapters={courseData.chapters}
              instructorName={courseData.instructor?.name || ""}
              instructorImage={
                courseData.instructor?.image ||
                courseData.instructor?.profileImage
                  ? getBackendAssetUrl(
                      courseData.instructor?.image ||
                        courseData.instructor?.profileImage,
                    )
                  : "/profile.jpg"
              }
              instructorCoursesCount={courseData.instructor?.courses_count ?? 0}
              instructorStudentsCount={
                courseData.instructor?.students_count ?? 0
              }
              instructorTitle={courseData.instructor?.title || ""}
              instructorBio={courseData.instructor?.bio || ""}
            />
          </div>

          {/* Right Sidebar */}
          <CourseSidebar
            courseId={courseId}
            courseTitle={courseData.title}
            courseImage={getBackendAssetUrl(
              courseData.cover_image_url ||
                courseData.coverImage ||
                courseData.image ||
                courseData.cover_image,
            )}
            currentPrice={courseData.price} // This will show "مجاني" if price is 0
            originalPrice={courseData.price}
            discount=""
            instructorName={courseData.instructor?.name || "مدرب"}
            instructorImage={getBackendAssetUrl(
              courseData.instructor?.image ||
                courseData.instructor?.profileImage,
            )}
            instructorTitle={courseData.instructor?.title}
            instructorBio={courseData.instructor?.bio}
            courseStats={courseData.stats}
            certificateAvailable={courseData.has_final_exam === true}
            actionContext={
              courseAccess.allowed
                ? "وصولك إلى المقرر متاح وفق حالة التسجيل."
                : parentDiploma
                  ? `هذا المقرر جزء من ${parentDiploma.name}. ${courseData.is_free ? "المقرر مجاني ضمن الكتالوج؛ " : ""}التسجيل هنا يتم في الدبلومة الأم، وليس شراء المقرر منفردًا. الأسعار قيم ضمن العرض؛ عملتها غير محددة.`
                  : "التسجيل في هذا المقرر يتم بعد تسجيل الدخول. الأسعار قيم ضمن العرض؛ عملتها غير محددة."
            }
            actionLabel={courseActionLabel({
              allowed: courseAccess.allowed,
              authenticated,
              parentId: Number(courseData.category_id),
              parentEnrolled: myDiplomas.some(
                (d) => d.category?.id === Number(courseData.category_id),
              ),
            })}
            onActionClick={handlePrimaryAction}
          />
        </div>
      </main>

      {/* Popular Courses Section
      <section className="popular-courses-section">
        <div className="popular-courses-container">
          <div className="popular-courses-header">
            <div className="popular-courses-left">
              <div className="popular-badge">الأكثر شعبية</div>
            </div>
            <button className="view-all-btn">
              عرض الكل
              <div className="arrow-circle">
                <svg viewBox="0 0 24 24">
                  <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                </svg>
              </div>
            </button>
          </div>
          <h2 className="popular-title">برامجنا المميزة</h2>
          
          <div className="courses-grid">
            {popularCourses.length > 0 ? (
              popularCourses
                .map(transformCourseForCard)
                .filter(course => course !== null)
                .map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px',
                color: '#666'
              }}>
                لا توجد كورسات مميزة متاحة حالياً
              </div>
            )}
          </div>
        </div>
      </section> */}

      <Footer />

      {/* Floating Components */}
      <ScrollToTop />
      <SocialMediaFloat />
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />

      <EnrollmentInfoModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        onSubmit={handleEnrollmentSubmit}
      />

      <style jsx>{`
        .course-details-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          background-color: #f8f9fa;
        }

        .left-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>
    </div>
  );
};

export default CourseDetailsPage;
