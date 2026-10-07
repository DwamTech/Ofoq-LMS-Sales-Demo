'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import '../../../styles/checkout.css';
import { getCourseDetails, enrollCourse, getMyEnrollments, Course } from '../../../utils/courseService';
import { isAuthenticated } from '../../../utils/authService';
import { getBackendAssetUrl } from '../../../utils/url';

const DynamicCheckoutPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (!courseId) return;

        // If not authenticated, redirect to login first
        if (!isAuthenticated()) {
          router.push('/auth');
          return;
        }

        const [details, myEnrollmentsResponse] = await Promise.all([
          getCourseDetails(courseId),
          getMyEnrollments(1, 1000),
        ]);

        setCourse(details);
        const idNum = Number(courseId);
        setIsEnrolled(myEnrollmentsResponse.data.some(course => course.id === idNum));
      } catch (err: any) {
        console.error('Checkout init error:', err);
        setError(err?.message || 'فشل في تحميل بيانات صفحة الدفع');
      }
    };
    init();
  }, [courseId, router]);

  const handleEnroll = async () => {
    try {
      if (!courseId) return;
      setIsProcessing(true);

      await enrollCourse(courseId);

      setIsProcessing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Redirect to My Courses after successful enrollment
      router.push('/user/my_courses');
    } catch (err: any) {
      console.error('Enroll error:', err);
      setIsProcessing(false);
      setError(err?.message || 'فشل في الاشتراك بالكورس');
    }
  };

  if (error) {
    return (
      <div className="checkout-container">
        <div className="checkout-wrapper">
          <div className="checkout-header">
            <h1 className="checkout-title">إتمام عملية الشراء</h1>
            <p className="checkout-subtitle">حدث خطأ: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="checkout-container">
        <div className="checkout-wrapper">
          <div className="checkout-header">
            <h1 className="checkout-title">إتمام عملية الشراء</h1>
            <p className="checkout-subtitle">جارٍ تحميل بيانات الكورس...</p>
          </div>
        </div>
      </div>
    );
  }

  const priceNum = typeof course.price === 'string' ? parseFloat(course.price) : Number(course.price);
  const isFree = isNaN(priceNum) || priceNum <= 0;
  const originalPrice = isNaN(priceNum) ? 0 : priceNum * 2; // افتراض خصم 50%
  const hasDiscount = originalPrice > 0 && priceNum < originalPrice;
  const discountPercentage = hasDiscount ? Math.round(((originalPrice - priceNum) / originalPrice) * 100) : 0;

  const coverRaw =
    (course as any).cover_image_url ||
    (course as any).coverImage ||
    (course as any).image ||
    course.cover_image ||
    '/banner.jpg';

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        {/* Header */}
        <div className="checkout-header">
          <h1 className="checkout-title">إتمام عملية الشراء</h1>
          <p className="checkout-subtitle">تأكيد الاشتراك في الكورس: {course.title}</p>
        </div>

        {/* Main Content */}
        <div className="checkout-content">
          {/* Course Details Card */}
          <div className="course-card">
            <div className="course-image-section">
              <img
                src={getBackendAssetUrl(coverRaw)}
                alt={course.title}
                className="course-image"
              />
              {hasDiscount && !isFree && (
                <div className="discount-badge">خصم {discountPercentage}%</div>
              )}
            </div>

            <div className="course-details">
              <h2 className="course-title">{course.title}</h2>
              <p className="course-description">{course.description || 'وصف الكورس غير متوفر'}</p>

              <div className="course-meta">
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span>المدرب: {course.instructor?.name || 'مدرب'}</span>
                </div>
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <span>{course.duration ? `${course.duration} ساعة` : '30 ساعة'}</span>
                </div>
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                  <span>{course.chapters_count ? `${course.chapters_count} درس` : 'دروس متعددة'}</span>
                </div>
              </div>

              <div className="course-features">
                <h3 className="features-title">ما ستحصل عليه:</h3>
                <ul className="features-list">
                  <li className="feature-item">
                    <svg className="feature-icon2" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    شهادة معتمدة
                  </li>
                  <li className="feature-item">
                    <svg className="feature-icon2" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    دعم فني مدى الحياة
                  </li>
                  <li className="feature-item">
                    <svg className="feature-icon2" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    مشاريع عملية
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Purchase Section */}
          <div className="purchase-section">
            <div className="price-table">
              <h3 className="price-table-title">تفاصيل السعر</h3>
              <table className="pricing-table">
                <tbody>
                  <tr>
                    <td className="price-label">السعر الأصلي</td>
                    <td className="price-value original">{isFree ? 'مجاني' : ('ج.م ' + originalPrice)}</td>
                  </tr>
                  <tr>
                    <td className="price-label">نسبة الخصم</td>
                    <td className="price-value discount">{isFree ? 'مجاني' : (discountPercentage + '%')}</td>
                  </tr>
                  <tr>
                    <td className="price-label">مبلغ التوفير</td>
                    <td className="price-value savings">{isFree ? 'مجاني' : ('ج.م ' + (originalPrice - priceNum))}</td>
                  </tr>
                  <tr className="total-row">
                    <td className="price-label total-label">السعر النهائي</td>
                    <td className="price-value final">{isFree ? 'مجاني' : ('ج.م ' + priceNum)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isEnrolled ? (
              <button className="purchase-button" onClick={() => router.push('/user/my_courses')}>
                تابع الكورس
                <svg className="button-icon" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1z" />
                </svg>
              </button>
            ) : (
              <button
                className={`purchase-button ${isProcessing ? 'processing' : ''}`}
                onClick={handleEnroll}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    تأكيد الاشتراك
                    <svg className="button-icon" viewBox="0 0 24 24">
                      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1z" />
                    </svg>
                  </>
                )}
              </button>
            )}

            <div className="security-badges">
              <div className="security-item">
                <svg className="security-icon" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
                </svg>
                <span>دفع آمن</span>
              </div>
              <div className="security-item">
                <svg className="security-icon" viewBox="0 0 24 24">
                  <path d="M9,12L11,14L15,10L13.59,8.59L11,11.17L9.41,9.59L8,11L9,12M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" />
                </svg>
                <span>ضمان 30 يوم</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="checkout-footer-links">
          <a href="/privacy" className="footer-link">سياسة الخصوصية</a>
          <span className="link-separator">|</span>
          <a href="/terms" className="footer-link">الشروط والأحكام</a>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="toast-container">
          <div className="toast success">
            <div className="toast-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <div className="toast-content">
              <h4 className="toast-title">تم الاشتراك بنجاح!</h4>
              <p className="toast-message">سيتم تحويلك إلى دوراتك خلال لحظات</p>
            </div>
            <button className="toast-close" onClick={() => setShowToast(false)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicCheckoutPage;