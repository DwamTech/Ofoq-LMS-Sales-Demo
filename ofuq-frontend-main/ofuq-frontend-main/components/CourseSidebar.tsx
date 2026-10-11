'use client';

import React, { useEffect, useState } from 'react';
import { ProgramArtwork } from './brand/ProgramArtwork';
import { publicPrice } from './brand/publicContent';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../utils/authService';
import { addCourseToFavorites, removeCourseFromFavorites, getMyFavoriteCourseIds, type CourseStats } from '../utils/courseService';

interface CourseSidebarProps {
  courseId?: number | string;
  courseImage: string;
  courseTitle?: string;
  currentPrice: number | string;
  originalPrice: number | string;
  discount: string;
  instructorName: string;
  instructorImage: string;
  instructorTitle?: string;
  instructorBio?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  courseStats?: CourseStats;
  certificateAvailable?: boolean;
  actionContext?: string;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  courseId,
  courseImage,
  courseTitle,
  currentPrice,
  originalPrice,
  discount,
  instructorName,
  instructorImage,
  instructorTitle,
  instructorBio,
  actionLabel,
  onActionClick,
  courseStats,
  certificateAvailable = false,
  actionContext
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();
  const materialsCount = Number(courseStats?.attachments_count ?? 0) + Number(courseStats?.resources_count ?? 0);
  const quizzesCount = Number(courseStats?.quizzes_count ?? 0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // إذا كان المستخدم مسجل دخولًا، جلب المفضلة لمعرفة الحالة الأولية
      if (isAuthenticated() && courseId) {
        try {
          const favIds = await getMyFavoriteCourseIds();
          const idNum = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
          if (mounted && idNum) {
            setIsFavorite(favIds.includes(Number(idNum)));
          }
        } catch (e) {
          // تجاهل الخطأ هنا للحفاظ على تجربة هادئة
        }
      }
    })();
    return () => { mounted = false; };
  }, [courseId]);

  const toggleFavorite = async () => {
    if (!courseId) return;
    // إن لم يكن مسجلًا، الانتقال لصفحة التسجيل
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    const idNum = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    if (!idNum) return;
    // إضافة/إزالة من المفضلة عبر الـ API
    if (!isFavorite) {
      const ok = await addCourseToFavorites(Number(idNum));
      if (ok) setIsFavorite(true);
    } else {
      const ok = await removeCourseFromFavorites(Number(idNum));
      if (ok) setIsFavorite(false);
    }
  };

  const handleRegister = () => {
    if (onActionClick) {
      onActionClick();
    } else {
      // Fallback to legacy behavior
      router.push('/checkout');
    }
  };

  const handleSocialShare = (platform: string) => {
    // Handle social sharing logic here
    console.log(`Share on ${platform}`);
  };

  return (
    <div className="right-sidebar">
      {/* Course Image with Favorite Icon */}
      <div className="course-image-container">
        <ProgramArtwork image={courseImage} title={courseTitle || 'مقرر تعليمي'} identity={String(courseId || '')} className="course-image" />
        {/* نقل شارة "مجاني" أعلى الصورة للجانب المقابل لزر Fav */}
        {(() => {
          const parsed = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
          const isFree = !isNaN(parsed) ? parsed === 0 : false;
          return isFree ? (
            <div className="free-badge">مجاني</div>
          ) : null;
        })()}
        <button type="button" className="favorite-icon" onClick={toggleFavorite} aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} aria-pressed={isFavorite}>
          <svg className="heart-icon" viewBox="0 0 24 24">
            <path d={isFavorite 
              ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"
            } />
          </svg>
        </button>
      </div>

      {/* Price Section */}
      <div className="price-section">
        <div className="price-container">
          {(() => {
            const parsed = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
            const isFree = !isNaN(parsed) ? parsed === 0 : false;
            return isFree ? (
              <span className="current-price">مجاني</span>
            ) : (
              <span className="current-price">{publicPrice(currentPrice)}</span>
            );
          })()}
        </div>
        {/* <div className="offer-timer">
          سينتهي هذا العرض في خلال 20 دقيقة
        </div> */}
        <button className="register-button" onClick={handleRegister}>
          {actionLabel ?? 'سجل الآن'}
          <div className="arrow-circle">
            <div className="arrow-icon"></div>
          </div>
        </button>
        {actionContext && <p className="enrollment-context">{actionContext}</p>}
      </div>

      {/* Course Features */}
      <div className="course-features">
        <h3 className="features-title">هذا الكورس يحتوي على:</h3>
        <div className="feature-item">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>منهج من فصول ودروس مرتبطة بالمقرر</span>
        </div>
        <div className="feature-item">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>واجهة متجاوبة للجوال والكمبيوتر</span>
        </div>
        {certificateAvailable && <div className="feature-item">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span>شهادة إتمام قابلة للتحقق بعد الإكمال واجتياز الاختبار النهائي</span>
        </div>}
        <div className="feature-item">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{materialsCount > 0 ? `${materialsCount} ملف مرفق` : 'لا توجد ملفات مرفقة منشورة حاليًا'}</span>
        </div>
        <div className="feature-item">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M9 11.5l2 2 4-4M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm2 4h6" />
          </svg>
          <span>{quizzesCount > 0 ? `${quizzesCount} اختبار ضمن المحتوى` : 'لا توجد اختبارات ضمن الدروس حاليًا'}</span>
        </div>
      </div>

      {/* Instructor Section */}
      <div className="instructor-section">
        <h3 className="instructor-title">المحاضر:</h3>
        <div className="instructor-info">
          <img 
            src={instructorImage} 
            alt={instructorName}
            className="instructor-avatar"
          />
          <span className="instructor-name">{instructorName}</span>
        </div>
        {/* {instructorTitle && (
          <div className="instructor-extra">
            <span className="instructor-role">{instructorTitle}</span>
          </div>
        )}
        {instructorBio && (
          <p className="instructor-bio">{instructorBio}</p>
        )} */}
      </div>

      {/* Social Share */}
      {/* <div className="social-share">
        <h3 className="share-title">شارك الكورس:</h3>
        <div className="social-icons">
          <div className="social-icon" onClick={() => handleSocialShare('whatsapp')}>
            <svg viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
            </svg>
          </div>
          <div className="social-icon" onClick={() => handleSocialShare('telegram')}>
            <svg viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <div className="social-icon" onClick={() => handleSocialShare('instagram')}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div className="social-icon" onClick={() => handleSocialShare('youtube')}>
            <svg viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div className="social-icon" onClick={() => handleSocialShare('facebook')}>
            <svg viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default CourseSidebar;
