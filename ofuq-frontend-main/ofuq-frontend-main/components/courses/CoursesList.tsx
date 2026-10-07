import React, { useState } from 'react';
import { Course } from '../../types/course';
import Toast from '../Toast';
import { getBackendAssetUrl } from '../../utils/url';
import { deleteCourse } from '../../utils/courseService';
import '../../styles/toast.css';

interface CoursesListProps {
  courses: Course[];
  courseFilter: string;
  viewMode: 'cards' | 'list';
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setSelectedCourseId: (id: string | null) => void;
  setCurrentStep: (step: string) => void;
  setShowCreateCourse: (show: boolean) => void;
  setSelectedCourseForView: (id: string | null) => void;
  setShowCourseDetails: (show: boolean) => void;
}

const CoursesList: React.FC<CoursesListProps> = ({
  courses,
  courseFilter,
  viewMode,
  setCourses,
  setSelectedCourseId,
  setCurrentStep,
  setShowCreateCourse,
  setSelectedCourseForView,
  setShowCourseDetails,
}) => {
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<{id: string, title: string} | null>(null);

  const filteredCourses = courses.filter(course =>
    (courseFilter === 'all' || course.status === courseFilter) &&
    (course.title.toLowerCase())
  );

  // دالة لتحويل التاريخ الميلادي إلى تنسيق مقروء
  const formatGregorianDate = (gregorianDate: Date): string => {
    const formattedDate = new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory' // التأكد من استخدام التقويم الميلادي
    }).format(gregorianDate);
    return formattedDate;
  };

  // دالة حذف الكورس
  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    setPendingDeleteCourse({ id: courseId, title: courseTitle });
    setToastMessage(`هل أنت متأكد من حذف الكورس "${courseTitle}"؟`);
    setToastType('confirm');
    setToastVisible(true);
  };

  // تأكيد حذف الكورس
  const confirmDeleteCourse = async () => {
    if (pendingDeleteCourse) {
      try {
        await deleteCourse(parseInt(pendingDeleteCourse.id));
        setCourses(prevCourses => prevCourses.filter(course => course.id !== pendingDeleteCourse.id));
        setToastMessage(`تم حذف الكورس "${pendingDeleteCourse.title}" بنجاح`);
        setToastType('success');
        setPendingDeleteCourse(null);
        // إخفاء Toast بعد 3 ثوان
        setTimeout(() => {
          setToastVisible(false);
        }, 3000);
      } catch (error) {
        setToastMessage(`فشل في حذف الكورس "${pendingDeleteCourse.title}"`);
        setToastType('error');
        setPendingDeleteCourse(null);
        // إخفاء Toast بعد 3 ثوان
        setTimeout(() => {
          setToastVisible(false);
        }, 3000);
      }
    }
  };

  // إلغاء حذف الكورس
  const cancelDeleteCourse = () => {
    setPendingDeleteCourse(null);
    setToastVisible(false);
  };

  // دالة تبديل حالة النشر
  const handleToggleStatus = (courseId: string, currentStatus: 'draft' | 'published' | 'archived') => {
    // Only allow toggling between draft and published
    if (currentStatus === 'archived') return;
    
    const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
    const statusText = newStatus === 'published' ? 'منشور' : 'مسودة';
    
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, status: newStatus }
          : course
      )
    );
    
    setToastMessage(`تم تغيير حالة الكورس إلى "${statusText}"`);
    setToastType('success');
    setToastVisible(true);
    // إخفاء Toast بعد 3 ثوان
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  // إغلاق Toast
  const closeToast = () => {
    setToastVisible(false);
    setPendingDeleteCourse(null);
  };

  // دالة للحصول على اسم القسم
  const getCategoryName = (categoryId: string): string => {
    // يمكن استبدال هذا بقاعدة بيانات الأقسام الفعلية
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
    <div className="courses-container">
      {viewMode === 'cards' ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <div key={course.id} className="course-card-wrapper">
              <div className="course-card-background"></div>
              <div className="course-card">
                <div className="course-card-content">
                  <div className="course-image">
                    {course.coverImage ? (
                      <img 
                        src={typeof course.coverImage === 'string' ? getBackendAssetUrl(course.coverImage) : URL.createObjectURL(course.coverImage)} 
                        alt={course.title} 
                        className="course-image"
                      />
                    ) : (
                      <div className="course-image-placeholder">
                        <span>📚</span>
                      </div>
                    )}
                  </div>
                  <div className="course-body">
                    <div className="course-header">
                      <h3 className="course-title">{course.title}</h3>
                      <div className="course-status-badge">
                        <span className="status-text">
                          {course.status === 'draft' ? 'مسودة' : 'منشور'}
                        </span>
                      </div>
                    </div>
                    <div className="course-content">
                      {/* عرض المحاضر */}
                      {course.instructor && (
                        <div className="course-instructor-section">
                          <img 
                            src={course.instructor.profileImage || '/profile.jpg'} 
                            alt={course.instructor.name}
                            className="course-instructor-avatar"
                          />
                          <div className="instructor-details">
                            <span className="course-instructor-name">{course.instructor.name}</span>
                            {course.instructor.specialization && (
                              <span className="course-instructor-specialization">{course.instructor.specialization}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* عرض القسم */}
                      <div className="course-category-section">
                        <span className="category-icon">📂</span>
                        <span className="course-category-name">{getCategoryName(course.categoryId ?? 'other')}</span>
                      </div>

                      <p className="course-description">{course.description}</p>
                      <div className="course-meta">
                        <div className="course-price">
                          <span className="price-text">
                            {course.isFree ? 'مجاني' : `${course.price} جنيه`}
                          </span>
                        </div>
                        <div className="course-chapters">
                          <span className="chapters-text">{(course.chapters_count ?? course.chapters?.length ?? 0)} فصل</span>
                        </div>
                      </div>
                      <div className="course-date">
                        <span className="date-text">
                          {course.createdAt ? formatGregorianDate(course.createdAt) : ''}
                        </span>
                      </div>
                    </div>
                    <div className="course-actions">
                      <button
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setCurrentStep('content-management');
                          setShowCreateCourse(true);
                        }}
                        className="course-edit-button"
                        title="تعديل الكورس"
                      >
                         تعديل
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCourseForView(course.id);
                          setShowCourseDetails(true);
                        }}
                        className="course-content-button"
                        title="عرض الكورس"
                      >
                         عرض
                      </button>
                      <button
                        onClick={() => handleToggleStatus(course.id, course.status)}
                        className={`course-status-toggle-button ${course.status}`}
                        title={course.status === 'draft' ? 'نشر الكورس' : 'تحويل إلى مسودة'}
                      >
                        {course.status === 'draft' ? '📤 نشر' : '📥 مسودة'}
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        className="course-delete-button"
                        title="حذف الكورس"
                      >
                         حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="courses-list-view">
          {filteredCourses.map((course, index) => (
            <div key={course.id} className="course-list-item">
              <div className="course-list-number">
                <span className="list-number">{index + 1}</span>
              </div>
              <div className="course-list-image">
                {course.coverImage ? (
                  <img src={typeof course.coverImage === 'string' ? getBackendAssetUrl(course.coverImage) : URL.createObjectURL(course.coverImage)} alt={course.title} className="list-course-image" />
                ) : (
                  <div className="list-course-placeholder">📚</div>
                )}
              </div>
              <div className="course-list-content">
                <div className="course-list-header">
                  <h3 className="course-list-title">{course.title}</h3>
                  <div className="course-list-status">
                    <span className={`status-badge ${course.status}`}>
                      {course.status === 'draft' ? 'مسودة' : 'منشور'}
                    </span>
                  </div>
                </div>
                <p className="course-list-description">{course.description}</p>
                
                {/* عرض المحاضر في القائمة */}
                {course.instructor && (
                  <div className="course-list-instructor">
                    <img 
                      src={course.instructor.profileImage || '/profile.jpg'} 
                      alt={course.instructor.name}
                      className="course-list-instructor-avatar"
                    />
                    <div className="list-instructor-details">
                      <span className="course-list-instructor-name">{course.instructor.name}</span>
                      {course.instructor.specialization && (
                        <span className="course-list-instructor-specialization">{course.instructor.specialization}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* عرض القسم في القائمة */}
                <div className="course-list-category">
                  <span className="list-category-icon">📂</span>
                  <span className="course-list-category-name">{getCategoryName(course.categoryId ?? 'other')}</span>
                </div>

                {/* عرض التاريخ الميلادي في القائمة */}
                <div className="course-list-date">
                  <span className="list-date-icon">📅</span>
                  <span className="course-list-date-text">{course.createdAt ? formatGregorianDate(course.createdAt) : ''}</span>
                </div>

                <div className="course-list-actions">
                  <button
                    onClick={() => {
                      setSelectedCourseForView(course.id);
                      setShowCourseDetails(true);
                    }}
                    className="course-action-button view-course-button"
                    title="عرض الكورس"
                  >
                     عرض
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setCurrentStep('content-management');
                      setShowCreateCourse(true);
                    }}
                    className="course-action-button edit-course-button"
                    title="تعديل الكورس"
                  >
                     تعديل
                  </button>
                  <button
                    onClick={() => handleToggleStatus(course.id, course.status)}
                    className={`course-action-button status-toggle-button ${course.status}`}
                    title={course.status === 'draft' ? 'نشر الكورس' : 'تحويل إلى مسودة'}
                  >
                    {course.status === 'draft' ? '📤 نشر' : '📥 مسودة'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                    className="course-action-button delete-course-button"
                    title="حذف الكورس"
                  >
                     حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Toast Component */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={closeToast}
        onConfirm={confirmDeleteCourse}
        onCancel={cancelDeleteCourse}
      />
    </div>
  );
};

export default CoursesList;