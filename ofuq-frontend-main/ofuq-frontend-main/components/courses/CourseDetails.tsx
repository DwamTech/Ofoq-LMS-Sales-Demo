import { Course } from '../../types/course';
import { useState } from 'react';
import '../../styles/modern-course-details.css';
import { getBackendAssetUrl } from '../../utils/url';

interface CourseDetailsProps {
  course: Course;
  onClose: () => void;
  isClient: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ course, onClose, isClient }) => {
  // State to manage which chapters are expanded
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  // Get category name helper function
  const getCategoryName = (categoryId: string): string => {
    const categories: { [key: string]: string } = {
      'tech': 'التكنولوجيا',
      'business': 'الأعمال',
      'design': 'التصميم',
      'marketing': 'التسويق',
      'language': 'اللغات',
      'science': 'العلوم',
      'other': 'أخرى'
    };
    return categories[categoryId] || 'غير محدد';
  };

  return (
    <div
      className="course-details-popup-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="course-details-popup-container">
        {/* Header Section */}
        <div className="course-details-popup-header">
          <button
            onClick={onClose}
            className="course-details-popup-close"
            title="إغلاق (Esc)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className="course-details-popup-info">
            <div className="course-details-popup-image-wrapper">
              {course.coverImage ? (
                <img 
                  src={typeof course.coverImage === 'string' ? getBackendAssetUrl(course.coverImage) : URL.createObjectURL(course.coverImage)} 
                  alt={course.title} 
                  className="course-details-popup-image" 
                />
              ) : (
                <div className="course-details-popup-image-placeholder">
                  📚
                </div>
              )}
            </div>
            
            <div className="course-details-popup-details">
              <div className="course-details-popup-badges">
                <div className={`course-details-popup-status-badge ${course.status}`}>
                  {course.status === 'published' ? 'منشور' : 'مسودة'}
                </div>
                <div className="course-details-popup-category-badge"> 
                  {getCategoryName(course.categoryId ?? 'other')}
                </div>
              </div>
              
              <h1 className="course-details-popup-title">{course.title}</h1>
              <p className="course-details-popup-description">{course.description}</p>
              
              {/* Instructor Info */}
              {course.instructor && (
                <div className="course-details-popup-instructor">
                  <img 
                    src={course.instructor.profileImage || '/profile.jpg'} 
                    alt={course.instructor.name}
                    className="course-details-popup-instructor-avatar"
                  />
                  <div className="course-details-popup-instructor-info">
                    <span className="course-details-popup-instructor-name">{course.instructor.name}</span>
                    {course.instructor.specialization && (
                      <span className="course-details-popup-instructor-specialization">{course.instructor.specialization}</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="course-details-popup-stats">
                <div className="course-details-popup-stat-item">
                  <div className="course-details-popup-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <div className="course-details-popup-stat-content">
                    <span className="course-details-popup-stat-number">{course.chapters.length}</span>
                    <span className="course-details-popup-stat-label">فصل</span>
                  </div>
                </div>
                
                <div className="course-details-popup-stat-item">
                  <div className="course-details-popup-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                    </svg>
                  </div>
                  <div className="course-details-popup-stat-content">
                    <span className="course-details-popup-stat-number">
                      {course.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)}
                    </span>
                    <span className="course-details-popup-stat-label">درس</span>
                  </div>
                </div>
                
                <div className="course-details-popup-stat-item">
                  <div className="course-details-popup-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="course-details-popup-stat-content">
                    <span className="course-details-popup-stat-number">
                      {course.isFree ? 'مجاني' : `${course.price} ج.م`}
                    </span>
                    <span className="course-details-popup-stat-label">السعر</span>
                  </div>
                </div>
                
                <div className="course-details-popup-stat-item">
                  <div className="course-details-popup-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="course-details-popup-stat-content">
                    <span className="course-details-popup-stat-number">
                      {course.createdAt
                        ? (isClient
                            ? course.createdAt.toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                calendar: 'gregory'
                              })
                            : course.createdAt.toISOString().split('T')[0])
                        : ''}
                    </span>
                    <span className="course-details-popup-stat-label">تاريخ الإنشاء</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="course-details-popup-content">
          <div className="course-details-popup-content-header">
            <h2 className="course-details-popup-content-title">محتويات الكورس</h2>
            <div className="course-details-popup-content-summary">
              {course.chapters.length > 0 ? (
                <span>{course.chapters.length} فصل • {course.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)} درس</span>
              ) : (
                <span>لا يوجد محتوى متاح</span>
              )}
            </div>
          </div>
          
          {course.chapters.length > 0 ? (
            <div className="course-details-popup-chapters">
              {course.chapters.map((chapter, index) => (
                <div key={chapter.id} className="course-details-popup-chapter">
                  <div 
                    className="course-details-popup-chapter-header"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="course-details-popup-chapter-number">
                      <span>{index + 1}</span>
                    </div>
                    <div className="course-details-popup-chapter-info">
                      <h3 className="course-details-popup-chapter-title">{chapter.title}</h3>
                      <p className="course-details-popup-chapter-description">{chapter.description}</p>
                      <div className="course-details-popup-chapter-meta">
                        <span className="course-details-popup-lessons-count">{chapter.lessons.length} درس</span>
                      </div>
                    </div>
                    <div className="course-details-popup-chapter-toggle">
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={`course-details-popup-dropdown-arrow ${expandedChapters.has(chapter.id) ? 'expanded' : ''}`}
                      >
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </div>
                  </div>
                  
                  {chapter.lessons.length > 0 && (
                    <div className={`course-details-popup-lessons ${expandedChapters.has(chapter.id) ? 'expanded' : 'collapsed'}`}>
                      {chapter.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="course-details-popup-lesson" style={{'--lesson-index': lessonIndex} as React.CSSProperties}>
                          <div className="course-details-popup-lesson-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5,3 19,12 5,21 5,3"></polygon>
                            </svg>
                          </div>
                          <div className="course-details-popup-lesson-content">
                            <span className="course-details-popup-lesson-title">الدرس {lessonIndex + 1}: {lesson.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="course-details-popup-empty">
              <div className="course-details-popup-empty-icon">
                📚
              </div>
              <h3>لا يوجد محتوى</h3>
              <p>لم يتم إضافة أي فصول أو دروس لهذا الكورس بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;