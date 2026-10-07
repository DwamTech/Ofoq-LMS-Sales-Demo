'use client';

import React from 'react';
import '../styles/course-details-popup.css';

interface Lesson {
  id: string;
  title: string;
  order: number;
  status: 'published' | 'draft';
  duration?: string;
  videoUrl?: string;
  description?: string;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  description?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'published' | 'draft';
  chapters: Chapter[];
  instructor?: string;
  duration?: string;
  studentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CourseDetailsPopupProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

const CourseDetailsPopup: React.FC<CourseDetailsPopupProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // استخدم مصفوفات آمنة في حال غياب البيانات
  const chapters = Array.isArray(course.chapters) ? course.chapters : [];

  const totalLessons = chapters.reduce((total, chapter) => {
    const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
    return total + lessons.length;
  }, 0);

  const publishedLessons = chapters.reduce((total, chapter) => {
    const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
    return total + lessons.filter((lesson) => lesson.status === 'published').length;
  }, 0);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-container">
        <div className="popup-header">
          <h2>تفاصيل المقرر</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="popup-content">
          {/* معلومات المقرر الأساسية */}
          <div className="course-info-section">
            <div className="section-header">
              <h3>معلومات المقرر</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">المعرف:</span>
                <span className="value">{course.id}</span>
              </div>
              <div className="info-item">
                <span className="label">العنوان:</span>
                <span className="value">{course.title}</span>
              </div>
              <div className="info-item">
                <span className="label">الحالة:</span>
                <span className={`status ${course.status}`}>
                  {course.status === 'published' ? 'منشور' : 'مسودة'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">السعر:</span>
                <span className="value">{course.price} ريال</span>
              </div>
              {course.instructor && (
                <div className="info-item">
                  <span className="label">المدرب:</span>
                  <span className="value">{course.instructor}</span>
                </div>
              )}
              {course.duration && (
                <div className="info-item">
                  <span className="label">المدة:</span>
                  <span className="value">{course.duration}</span>
                </div>
              )}
              {course.studentsCount !== undefined && (
                <div className="info-item">
                  <span className="label">عدد الطلاب:</span>
                  <span className="value">{course.studentsCount}</span>
                </div>
              )}
            </div>
            {course.description && (
              <div className="description">
                <span className="label">الوصف:</span>
                <p>{course.description}</p>
              </div>
            )}
          </div>

          {/* إحصائيات سريعة */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-number">{chapters.length}</div>
              <div className="stat-label">فصل</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalLessons}</div>
              <div className="stat-label">درس</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{publishedLessons}</div>
              <div className="stat-label">درس منشور</div>
            </div>
          </div>

          {/* الوحدات والدروس */}
          <div className="chapters-section">
            <div className="section-header">
              <h3>الوحدات والدروس ({chapters.length} فصل - {totalLessons} درس)</h3>
            </div>
            <div className="chapters-list">
              {chapters.map((chapter) => {
                const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
                return (
                  <div key={chapter.id} className="chapter-item">
                    <div className="chapter-header">
                      <div className="chapter-info">
                        <h4>📚 {chapter.title}</h4>
                        <span className="chapter-meta">
                          الترتيب: {chapter.order} | {lessons.length} {lessons.length === 1 ? 'درس' : 'دروس'}
                        </span>
                      </div>
                      <div className="chapter-stats">
                        <span className="lessons-count">{lessons.length} دروس</span>
                        <div className="chapter-id">#{chapter.id}</div>
                      </div>
                    </div>
                    
                    {chapter.description && (
                      <p className="chapter-description">{chapter.description}</p>
                    )}

                    <div className="lessons-list">
                      <div className="lessons-header">
                        <h5>📖 الدروس ({lessons.length})</h5>
                      </div>
                      {lessons.length > 0 ? (
                        lessons.map((lesson, index) => (
                          <div key={lesson.id} className="lesson-item">
                            <div className="lesson-number">{index + 1}</div>
                            <div className="lesson-info">
                              <div className="lesson-title">🎥 {lesson.title}</div>
                              <div className="lesson-meta">
                                <span>الترتيب: {lesson.order}</span>
                                <span className={`lesson-status ${lesson.status}`}>
                                  {lesson.status === 'published' ? '✅ منشور' : '📝 مسودة'}
                                </span>
                                {lesson.duration && <span>⏱️ المدة: {lesson.duration}</span>}
                              </div>
                            </div>
                            <div className="lesson-id">#{lesson.id}</div>
                          </div>
                        ))
                      ) : (
                        <div className="no-lessons">
                          <p>📭 لا توجد دروس في هذا الوحدة بعد</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {chapters.length === 0 && (
                <div className="no-chapters">
                  <p>📚 لا توجد فصول في هذا المقرر بعد</p>
                </div>
              )}
            </div>
          </div>

          {/* معلومات إضافية */}
          {(course.createdAt || course.updatedAt) && (
            <div className="timestamps-section">
              <div className="section-header">
                <h3>التواريخ</h3>
              </div>
              <div className="timestamps-grid">
                {course.createdAt && (
                  <div className="timestamp-item">
                    <span className="label">تاريخ الإنشاء:</span>
                    <span className="value">{new Date(course.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                )}
                {course.updatedAt && (
                  <div className="timestamp-item">
                    <span className="label">آخر تحديث:</span>
                    <span className="value">{new Date(course.updatedAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPopup;