'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import '../../styles/checkout.css';

const CheckoutPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Sample course data - in real app this would come from props or API
  const courseData = {
    title: "دورة تطوير المواقع الشاملة",
    description: "تعلم تطوير المواقع من الصفر حتى الاحتراف مع أحدث التقنيات والأدوات",
    image: "/gamification-creative-collage-concept.jpg",
    instructor: "أحمد محمد",
    duration: "40 ساعة",
    lessons: "120 درس",
    currentPrice: 299,
    originalPrice: 599,
    discount: "50%",
    features: [
      "شهادة معتمدة",
      "دعم فني مدى الحياة",
      "مشاريع عملية",
      "ضمان استرداد المال"
    ]
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    // Simulate purchase process
    setTimeout(() => {
      setIsProcessing(false);
      setShowToast(true);
      // Hide toast after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
    }, 2000);
  };

  const discountPercentage = (() => {
    const isFree = typeof courseData.currentPrice === 'number' ? courseData.currentPrice === 0 : Number(courseData.currentPrice) === 0;
    const hasDiscount = typeof courseData.originalPrice === 'number'
      && typeof courseData.currentPrice === 'number'
      && courseData.originalPrice > 0
      && courseData.originalPrice > courseData.currentPrice;
    return hasDiscount ? Math.round(((courseData.originalPrice - courseData.currentPrice) / courseData.originalPrice) * 100) : 0;
  })();
  const isFree = typeof courseData.currentPrice === 'number' ? courseData.currentPrice === 0 : Number(courseData.currentPrice) === 0;
  const hasDiscount = typeof courseData.originalPrice === 'number'
    && typeof courseData.currentPrice === 'number'
    && courseData.originalPrice > 0
    && courseData.originalPrice > courseData.currentPrice;
  const savings = hasDiscount ? (courseData.originalPrice - courseData.currentPrice) : 0;

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        {/* Header */}
        <div className="checkout-header">
          <h1 className="checkout-title">إتمام عملية الشراء</h1>
          <p className="checkout-subtitle">أنت على بُعد خطوة واحدة من بدء رحلتك التعليمية</p>
        </div>

        {/* Main Content */}
        <div className="checkout-content">
          {/* Course Details Card */}
          <div className="course-card">
            <div className="course-image-section">
              <img 
                src={courseData.image} 
                alt={courseData.title}
                className="course-image"
              />
              {hasDiscount && !isFree && (
                <div className="discount-badge">
                  خصم {discountPercentage}%
                </div>
              )}
            </div>
            
            <div className="course-details">
              <h2 className="course-title">{courseData.title}</h2>
              <p className="course-description">{courseData.description}</p>
              
              <div className="course-meta">
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>المدرب: {courseData.instructor}</span>
                </div>
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  <span>{courseData.duration}</span>
                </div>
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  <span>{courseData.lessons}</span>
                </div>
              </div>

              <div className="course-features">
                <h3 className="features-title">ما ستحصل عليه:</h3>
                <ul className="features-list">
                  {courseData.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <svg className="feature-icon2" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
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
                    <td className="price-value original">{isFree ? 'مجاني' : ('ج.م ' + courseData.originalPrice)}</td>
                  </tr>
                  <tr>
                    <td className="price-label">نسبة الخصم</td>
                    <td className="price-value discount">{isFree ? 'مجاني' : (discountPercentage + '%')}</td>
                  </tr>
                  <tr>
                    <td className="price-label">مبلغ التوفير</td>
                    <td className="price-value savings">{isFree ? 'مجاني' : ('ج.م ' + savings)}</td>
                  </tr>
                  <tr className="total-row">
                    <td className="price-label total-label">السعر النهائي</td>
                    <td className="price-value final">{isFree ? 'مجاني' : ('ج.م ' + courseData.currentPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button 
              className={`purchase-button ${isProcessing ? 'processing' : ''}`}
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="spinner"></div>
                  جاري المعالجة...
                </>
              ) : (
                <>
                  اشتري الآن
                  <svg className="button-icon" viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </>
              )}
            </button>

            <div className="security-badges">
              <div className="security-item">
                <svg className="security-icon" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                </svg>
                <span>دفع آمن</span>
              </div>
              <div className="security-item">
                <svg className="security-icon" viewBox="0 0 24 24">
                  <path d="M9,12L11,14L15,10L13.59,8.59L11,11.17L9.41,9.59L8,11L9,12M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z"/>
                </svg>
                <span>ضمان 30 يوم</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="checkout-footer-links">
          <Link href="/privacy" className="footer-link">
            سياسة الخصوصية
          </Link>
          <span className="link-separator">|</span>
          <Link href="/terms" className="footer-link">
            الشروط والأحكام
          </Link>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="toast-container">
          <div className="toast success">
            <div className="toast-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <div className="toast-content">
              <h4 className="toast-title">تم الشراء بنجاح!</h4>
              <p className="toast-message">سيتم توجيهك إلى صفحة الدورة خلال لحظات</p>
            </div>
            <button 
              className="toast-close"
              onClick={() => setShowToast(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;