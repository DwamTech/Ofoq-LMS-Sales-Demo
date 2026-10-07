'use client';

import React, { useEffect, useState, useRef } from 'react';
export const dynamic = 'force-dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiBook, FiStar, FiDollarSign, FiEye, FiPlay, FiUser } from 'react-icons/fi';
import HomeHeader from '../../../components/HomeHeader';
import Footer from '../../../components/Footer';
import ScrollToTop from '../../../components/ScrollToTop';
import { SkeletonImage, SkeletonTitle, SkeletonText, SkeletonButton, SkeletonCourseCard } from '../../../components/Skeleton';
import SocialMediaFloat from '../../../components/SocialMediaFloat';
import EnrollmentInfoModal from '../../../components/EnrollmentInfoModal';
import Toast from '../../../components/Toast';
import ExamBadge from '../../../components/ExamBadge';
import '@/styles/toast.css';
import { getPublicDiplomaDetails, enrollInDiploma, getMyDiplomas, type Diploma, type MyDiploma } from '../../../utils/categoryService';
import { type Course } from '../../../utils/courseService';
import { getBackendAssetUrl } from '../../../utils/url';
import { isAuthenticated } from '../../../utils/authService';
import styles from '../../diplomas/[slug]/DiplomaDetails.module.css';

type DiplomaDetails = Diploma & { courses?: Course[] };

export default function DiplomaDetailsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const coursesRef = useRef<HTMLElement>(null);

  const [diploma, setDiploma] = useState<DiplomaDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollStatus, setEnrollStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'info', duration = 3000) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    if (duration > 0) {
      setTimeout(() => setToastVisible(false), duration);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!diploma || !isAuthenticated()) {
      setIsEnrolled(false);
      return;
    }
    try {
      setCheckingEnrollment(true);
      const myDiplomas = await getMyDiplomas();
      const enrolled = myDiplomas.some((myDiploma: MyDiploma) =>
        myDiploma.category?.id === diploma.id || myDiploma.category?.slug === diploma.slug
      );
      setIsEnrolled(enrolled);
    } catch {
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicDiplomaDetails(String(slug));
        setDiploma(data as unknown as DiplomaDetails);
      } catch (e: any) {
        setError(e?.message || 'حدث خطأ أثناء جلب بيانات الدبلومة');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [slug]);

  useEffect(() => {
    try {
      const notice = searchParams?.get('notice');
      if (notice === 'enroll_required') {
        showToast('يرجى الاشتراك في الدبلومة لعرض محتويات هذا المقرر', 'warning', 4000);
      }
    } catch {}
  }, [searchParams]);

  useEffect(() => {
    if (diploma) {
      checkEnrollmentStatus();
    }
  }, [diploma]);

  const scrollToCourses = () => {
    if (coursesRef.current) {
      coursesRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleEnroll = async () => {
    if (!diploma) return;
    if (isEnrolled) {
      scrollToCourses();
      return;
    }
    const loggedIn = isAuthenticated();
    if (!loggedIn) {
      setEnrollStatus({ type: 'error', message: 'يرجى تسجيل الدخول لإتمام التسجيل' });
      router.push('/auth');
      return;
    }
    setIsEnrollmentModalOpen(true);
  };

  const handleEnrollmentSubmit = async () => {
    if (!diploma) return;
    try {
      setEnrollStatus({ type: 'loading' });
      const res = await enrollInDiploma(diploma.id);
      setEnrollStatus({ type: 'success', message: res?.message || 'تم التسجيل بنجاح' });
      setIsEnrollmentModalOpen(false);
      setIsEnrolled(true);
      try {
        router.push('/dashboard/my-diplomas');
      } catch {}
    } catch (e: any) {
      setEnrollStatus({ type: 'error', message: e?.message || 'فشلت عملية التسجيل بالدبلومة' });
    }
  };

  const transformCourse = (course: Course) => {
    const coverRaw = (course as any).cover_image_url || (course as any).coverImage || (course as any).image || course.cover_image || '';
    const image = getBackendAssetUrl(coverRaw) || '/banner.jpg';
    const instructorName = (course?.instructor as any)?.name || 'مدرب';
    const desc = (course?.description || '').trim();
    const description = desc.length > 120 ? desc.slice(0, 120) + '…' : desc;
    return {
      id: String(course.id),
      title: course.title || 'مقرر تعليمي',
      image,
      description,
      instructorName,
      priceText: course.is_free ? 'مجاني' : `${course.price} جنيه`,
    };
  };

  const getButtonText = () => {
    if (checkingEnrollment) return 'جاري التحقق...';
    if (enrollStatus.type === 'loading') return 'جارِ التسجيل…';
    if (isEnrolled) return 'شاهد المقررات';
    return 'التسجيل بالدبلومة';
  };

  return (
    <div>
      <HomeHeader />

      {loading && (
        <main className={styles.page} dir="rtl">
          <section className={styles.detailsSection}>
            <div className={styles.detailsGrid}>
              <div className={styles.coverWrapper}>
                <SkeletonImage aspectRatio="4/3" />
              </div>
              <div className={styles.detailsContent}>
                <SkeletonTitle width="50%" />
                <SkeletonText lines={4} />
                <div style={{ marginTop: '20px' }}>
                  <SkeletonButton width={200} />
                </div>
              </div>
            </div>
          </section>
          <section className={styles.coursesSection}>
            <SkeletonTitle width="200px" />
            <div className={styles.coursesGrid}>
              {[1, 2, 3].map((i) => (
                <SkeletonCourseCard key={i} />
              ))}
            </div>
          </section>
        </main>
      )}

      {!loading && error && (
        <section className={styles.errorSection}>
          <div className={styles.errorBox}>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={() => router.refresh()}>إعادة المحاولة</button>
          </div>
        </section>
      )}

      {!loading && !error && diploma && (
        <main className={styles.page} dir="rtl">
          <section className={styles.detailsSection}>
            <div className={styles.detailsGrid}>
              <div className={styles.coverWrapper}>
                <img
                  className={styles.coverImage}
                  src={getBackendAssetUrl(diploma?.cover_image_url || '') || '/banner.jpg'}
                  alt={diploma?.name || 'غلاف الدبلومة'}
                />
                <div className={styles.coverOverlay}>
                  <button
                    className={isEnrolled ? styles.viewCoursesButton : styles.enrollButton}
                    onClick={handleEnroll}
                    disabled={enrollStatus.type === 'loading' || checkingEnrollment}
                  >
                    {isEnrolled ? <FiEye /> : <FiPlay />}
                  </button>
                </div>
              </div>
              <div className={styles.detailsContent}>
                <h2 className={styles.detailsTitle}>نبذة عن الدبلومة</h2>
                <p className={styles.detailsDescription}>{diploma?.description}</p>
                <div className={styles.detailsMeta}>
                  <div className={styles.metaItem}>
                    <strong>السعر:</strong>
                    <span className={styles.priceTag}>
                      {diploma?.is_free ? 'مجاني' : `${diploma?.price} جنيه`}
                    </span>
                  </div>
                  {typeof diploma?.courses_count !== 'undefined' && (
                    <div className={styles.metaItem}>
                      <strong>عدد المقررات:</strong>
                      <span className={styles.countTag}>{diploma?.courses_count}</span>
                    </div>
                  )}
                </div>
                <div className={styles.detailsActions}>
                  <button
                    className={`${styles.enrollButtonSecondary} ${isEnrolled ? styles.viewCoursesButtonSecondary : ''}`}
                    onClick={handleEnroll}
                    disabled={enrollStatus.type === 'loading' || checkingEnrollment}
                    aria-label={isEnrolled ? 'مشاهدة المقررات' : 'التسجيل بالدبلومة'}
                  >
                    <span className={styles.buttonText}>{getButtonText()}</span>
                    <span className={styles.buttonIconSmall} aria-hidden="true">
                      {isEnrolled ? <FiEye /> : <FiBook />}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section ref={coursesRef} className={styles.coursesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>مقررات الدبلومة</h2>
              <div className={styles.sectionLine}></div>
            </div>
            <div className={styles.coursesGrid}>
              {(diploma?.courses || []).length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><FiBook /></div>
                  <p>لا توجد مقررات مرتبطة حالياً.</p>
                </div>
              )}
              {(diploma?.courses || []).map((course) => {
                const c = transformCourse(course);
                return (
                  <Link href={`/course-details/${c.id}`} key={c.id} className={styles.courseCard}>
                    <div className={styles.courseImageWrapper}>
                      <img src={c.image} alt={c.title} className={styles.courseImage} />
                      <ExamBadge hasFinalExam={course.has_final_exam} variant="default" />
                      <div className={styles.courseOverlay}>
                        <div className={styles.coursePlayButton}><FiPlay /></div>
                      </div>
                      <div className={styles.courseBadge}>
                        {c.priceText}
                      </div>
                    </div>
                    <div className={styles.courseContent}>
                      <h3 className={styles.courseTitle}>{c.title}</h3>
                      <p className={styles.courseDescription}>{c.description}</p>
                      <div className={styles.courseMeta}>
                        <div className={styles.courseInstructor}>
                          <i className={styles.instructorIcon}><FiUser /></i>
                          <span>المحاضر: {c.instructorName}</span>
                        </div>
                      </div>
                      <div className={styles.courseFooter}>
                        <span className={styles.courseAction}>ابدأ التعلم</span>
                        <i className={styles.arrowIcon}>←</i>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>
      )}

      <EnrollmentInfoModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        onSubmit={handleEnrollmentSubmit}
      />

      <Footer />
      <ScrollToTop />
      <SocialMediaFloat />
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
    </div>
  );
}
