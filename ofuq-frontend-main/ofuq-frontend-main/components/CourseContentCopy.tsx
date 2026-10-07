'use client';

import React, { useState } from 'react';
import InstructorProfile from './InstructorProfile';
import LessonAttachments from './LessonAttachments';
import LessonResources from './LessonResources';
import '../styles/course-details-copy.css';
import '../styles/student-reviews.css';

interface CourseContentProps {
  courseTitle: string;
  lecturesCount: number;
  studentsCount: number;
  hoursCount: number;
  instructorName?: string;
  instructorImage?: string;
  instructorCoursesCount?: number;
  instructorStudentsCount?: number;
}

const CourseContentCopy: React.FC<CourseContentProps> = ({
  courseTitle,
  lecturesCount,
  studentsCount,
  hoursCount,
  instructorName = "نبيل محمد",
  instructorImage = "/profile.jpg",
  instructorCoursesCount = 10,
  instructorStudentsCount = 309877
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  // Sample attachments data
  const sampleAttachments = [
    {
      id: '1',
      name: 'دليل التصميم الجرافيكي.pdf',
      type: 'pdf' as const,
      size: '2.5 MB',
      url: '/attachments/design-guide.pdf'
    },
    {
      id: '2',
      name: 'عرض تقديمي - أساسيات التصميم.pptx',
      type: 'ppt' as const,
      size: '8.3 MB',
      url: '/attachments/design-basics.pptx'
    },
    {
      id: '3',
      name: 'صور مرجعية للتصميم.zip',
      type: 'other' as const,
      size: '15.7 MB',
      url: '/attachments/reference-images.zip'
    },
    {
      id: '4',
      name: 'مثال تطبيقي.jpg',
      type: 'image' as const,
      size: '1.2 MB',
      url: '/attachments/example.jpg',
      thumbnail: '/attachments/example-thumb.jpg'
    }
  ];

  // Sample resources data
  const sampleResources = [
    {
      id: '1',
      title: 'Adobe Creative Suite - الموقع الرسمي',
      description: 'تحميل وتعلم استخدام برامج Adobe للتصميم الجرافيكي',
      url: 'https://www.adobe.com/creativecloud.html',
      type: 'website' as const,
      domain: 'adobe.com'
    },
    {
      id: '2',
      title: 'نظرية الألوان في التصميم',
      description: 'مقال شامل عن كيفية استخدام الألوان بشكل فعال في التصميم',
      url: 'https://www.colortheory.com/design-basics',
      type: 'article' as const,
      domain: 'colortheory.com'
    },
    {
      id: '3',
      title: 'Typography Fundamentals',
      description: 'فيديو تعليمي عن أساسيات الخطوط والطباعة في التصميم',
      url: 'https://www.youtube.com/watch?v=typography',
      type: 'video' as const,
      domain: 'youtube.com'
    },
    {
      id: '4',
      title: 'Canva - أداة التصميم المجانية',
      description: 'أداة تصميم سهلة الاستخدام للمبتدئين',
      url: 'https://www.canva.com',
      type: 'tool' as const,
      domain: 'canva.com'
    },
    {
      id: '5',
      title: 'كتاب أساسيات التصميم الجرافيكي',
      description: 'مرجع شامل لتعلم قواعد وأسس التصميم الجرافيكي',
      url: 'https://www.designbook.com/fundamentals',
      type: 'book' as const,
      domain: 'designbook.com'
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // دالة لحساب مجموع مدة الفيديوهات في الفصل وتحويلها لصيغة الساعات والدقائق
  const calculateChapterDuration = (lessons: any[]) => {
    const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:00`;
    }
  };

  const courseContentData = [
    {
      id: 'introduction',
      chapterNumber: 1,
      title: 'المقدمة',
      lessons: [
        { 
          title: 'مرحباً بك في الدرس', 
          completed: true,
          hasQuiz: true,
          duration: 8 // minutes
        },
        { 
          title: 'نظرة عامة على البرنامج', 
          completed: true,
          hasQuiz: true,
          duration: 12 // minutes
        },
        { 
          title: 'إعداد بيئة العمل', 
          completed: false,
          hasQuiz: true,
          duration: 15 // minutes
        },
        { 
          title: 'أساسيات التصميم', 
          completed: false,
          hasQuiz: true,
          duration: 20 // minutes
        }
      ]
    },
    {
      id: 'basics',
      chapterNumber: 2,
      title: 'الأساسيات',
      lessons: [
        { 
          title: 'التعرف على الواجهة', 
          completed: false,
          hasQuiz: true,
          duration: 18 // minutes
        },
        { 
          title: 'الأدوات الأساسية', 
          completed: false,
          hasQuiz: true,
          duration: 25 // minutes
        },
        { 
          title: 'العمل مع الطبقات', 
          completed: false,
          hasQuiz: true,
          duration: 22 // minutes
        },
        { 
          title: 'حفظ وتصدير الملفات', 
          completed: false,
          hasQuiz: true,
          duration: 14 // minutes
        }
      ]
    },
    {
      id: 'advanced',
      chapterNumber: 3,
      title: 'المستوى المتقدم',
      lessons: [
        { 
          title: 'التأثيرات المتقدمة', 
          completed: false,
          hasQuiz: true,
          duration: 30 // minutes
        },
        { 
          title: 'العمل مع النصوص', 
          completed: false,
          hasQuiz: true,
          duration: 16 // minutes
        },
        { 
          title: 'الفلاتر والمؤثرات', 
          completed: false,
          hasQuiz: true,
          duration: 28 // minutes
        },
        { 
          title: 'تقنيات الإضاءة', 
          completed: false,
          hasQuiz: true,
          duration: 24 // minutes
        }
      ]
    },
    {
      id: 'projects',
      chapterNumber: 4,
      title: 'المشاريع العملية',
      lessons: [
        { 
          title: 'مشروع تصميم لوجو', 
          completed: false,
          hasQuiz: true,
          duration: 35 // minutes
        },
        { 
          title: 'تصميم بوستر إعلاني', 
          completed: false,
          hasQuiz: true,
          duration: 40 // minutes
        },
        { 
          title: 'تصميم واجهة موقع', 
          completed: false,
          hasQuiz: true,
          duration: 45 // minutes
        },
        { 
          title: 'مشروع التخرج', 
          completed: false,
          hasQuiz: true,
          duration: 50 // minutes
        }
      ]
    }
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content">
            <h2>وصف الدرس :</h2>
            <p className="course-overview">
              لوريم إيبسوم دولار سيت أميت، كونسيتيتور أديبيسنج إليت، سيد دو إييوسمود تيمبور إنسيديدونت يوت ليبوري إت دولوري ماغنا أليكوا. أوت إينيم أد مينيوم فينيام، كويز نوستريد إكسرسيتاتيون أولامكو لابوريس نيسي يوت أليكيب إكس إيا كومودو كوانتس. دويس أويت إيرور دولور إن ريبريت، إن فولوبتي فيليت إيسي كيلوم دولوري يوي فجات نولا باريتور. إكسبتور سينت أوكيات كوبايدات نون برودينت، سونت إن كولبا كوي أوفيسيا ديسيرت موليتي أنيم.</p>
            <p className="course-overview">
              لوريم إيبسوم دولار سيت أميت، كونسيتيتور أديبيسنج إليت، سيد دو إييوسمود تيمبور إنسيديدونت يوت ليبوري إت دولوري ماغنا أليكوا. أوت إينيم أد مينيوم فينيام، كويز نوستريد إكسرسيتاتيون أولامكو لابوريس نيسي يوت أليكيب إكس إيا كومودو كوانتس. دويس أويت إيرور دولور إن ريبريت، إن فولوبتي فيليت إيسي كيلوم دولوري يوي فجات نولا باريتور. إكسبتور سينت أوكيات كوبايدات نون برودينت، سونت إن كولبا كوي أوفيسيا ديسيرت موليتي أنيم. </p>
            <h2>ماذا سأتعلم من هذه الدرس؟</h2>
           <p className='course-overview'>لوريم إيبسوم دولار سيت أميت، كونسيتيتور أديبيسنج إليت، سيد دو إييوسمود تيمبور إنسيديدونت يوت ليبوري إت دولوري ماغنا أليكوا. أوت إينيم أد مينيوم فينيام، كويز نوستريد إكسرسيتاتيون أولامكو لابوريس نيسي يوت أليكيب إكس إيا كومودو كوانتس. دويس أويت إيرور دولور إن ريبريت، إن فولوبتي فيليت إيسي كيلوم دولوري يوي فجات نولا باريتور. إكسبتور سينت أوكيات كوبايدات نون برودينت، سونت إن كولبا كوي أوفيسيا ديسيرت موليتي أنيم.</p>
            
            {/* Lesson Attachments */}
            <LessonAttachments attachments={sampleAttachments} />
            
            {/* Lesson Resources */}
            <LessonResources resources={sampleResources} />
            
            <h2>محتوى الكورس :</h2>
            <p className="course-content-subtitle">نحن هنا لمساعدتك والإجابة على أسئلتك</p>
            
            <div className="course-content-dropdowns">
              {courseContentData.map((section, index) => (
                <div key={section.id} className="dropdown-section">
                  <button 
                    className={`dropdown-header ${expandedSections[section.id] ? 'expanded' : ''}`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="dropdown-title-container">
                      <span className="dropdown-number">{calculateChapterDuration(section.lessons)}</span>
                      <span className="dropdown-title">الفصل {section.chapterNumber}: {section.title}</span>
                    </div>
                    <svg 
                      className={`dropdown-arrow ${expandedSections[section.id] ? 'rotated' : ''}`} 
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>
                  
                  {expandedSections[section.id] && (
                    <div className="dropdown-content">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="lesson-container">
                          <div className="lesson-item">
                            <div className="lesson-info">
                              <span className="lesson-time">{lesson.duration.toString().padStart(2, '0')}:00</span>
                              <span className="lesson-title">{lesson.title}</span>
                              {lesson.completed && (
                                <svg className="completion-checkmark" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                              )}
                            </div>
                            <button className="play-lesson-btn">
                              <svg viewBox="0 0 24 24" className="play-icon-small">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              <span>معاينة</span>
                            </button>
                          </div>
                          {lesson.hasQuiz && (
                            <div className="lesson-quiz">
                              <button className="quiz-link-btn">
                                <svg viewBox="0 0 24 24" className="quiz-icon">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                <span>اختبار: {lesson.title}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final Exam Section */}
            <div className="final-exam-section">
              <div className="final-exam-card">
                <div className="exam-header">
                  <div className="exam-icon-container">
                    <svg className="exam-icon" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div className="exam-info">
                    <h3 className="exam-title">الاختبار النهائي للكورس</h3>
                    <p className="exam-description">اختبار شامل لجميع محتويات الكورس</p>
                  </div>
                </div>
                
                <div className="exam-progress">
                  <div className="progress-info">
                    <span className="progress-text">
                      {(() => {
                        const totalLessons = courseContentData.reduce((total, section) => total + section.lessons.length, 0);
                        const completedLessons = courseContentData.reduce((total, section) => 
                          total + section.lessons.filter(lesson => lesson.completed).length, 0);
                        const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
                        const allCompleted = completedLessons === totalLessons;
                        
                        return allCompleted 
                          ? "تم إكمال جميع الدروس - يمكنك الآن أداء الاختبار النهائي"
                          : `تم إكمال ${completedLessons} من ${totalLessons} دروس (${progressPercentage}%)`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{
                        width: `${(() => {
                          const totalLessons = courseContentData.reduce((total, section) => total + section.lessons.length, 0);
                          const completedLessons = courseContentData.reduce((total, section) => 
                            total + section.lessons.filter(lesson => lesson.completed).length, 0);
                          return Math.round((completedLessons / totalLessons) * 100);
                        })()}%`
                      }}
                    ></div>
                  </div>
                </div>

                <button 
                  className={`final-exam-btn ${(() => {
                    const totalLessons = courseContentData.reduce((total, section) => total + section.lessons.length, 0);
                    const completedLessons = courseContentData.reduce((total, section) => 
                      total + section.lessons.filter(lesson => lesson.completed).length, 0);
                    return completedLessons === totalLessons ? 'enabled' : 'disabled';
                  })()}`}
                  disabled={(() => {
                    const totalLessons = courseContentData.reduce((total, section) => total + section.lessons.length, 0);
                    const completedLessons = courseContentData.reduce((total, section) => 
                      total + section.lessons.filter(lesson => lesson.completed).length, 0);
                    return completedLessons !== totalLessons;
                  })()}
                  onClick={() => {
                    const totalLessons = courseContentData.reduce((total, section) => total + section.lessons.length, 0);
                    const completedLessons = courseContentData.reduce((total, section) => 
                      total + section.lessons.filter(lesson => lesson.completed).length, 0);
                    
                    if (completedLessons === totalLessons) {
                      // Navigate to final exam
                      console.log('Starting final exam...');
                      // Here you would typically navigate to the exam page
                    }
                  }}
                >
                  <svg className="exam-btn-icon" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                  </svg>
                  <span>
                    {(() => {
                      const totalLessons = courseContentData.reduce((total, section) => total + section.lessons.length, 0);
                      const completedLessons = courseContentData.reduce((total, section) => 
                        total + section.lessons.filter(lesson => lesson.completed).length, 0);
                      return completedLessons === totalLessons ? 'بدء الاختبار النهائي' : 'أكمل جميع الدروس أولاً';
                    })()}
                  </span>
                </button>

                {(() => {
                  const totalLessons = courseContentData.reduce((total, section) => total + section.lessons.length, 0);
                  const completedLessons = courseContentData.reduce((total, section) => 
                    total + section.lessons.filter(lesson => lesson.completed).length, 0);
                  
                  if (completedLessons !== totalLessons) {
                    return (
                      <div className="exam-requirements">
                        <div className="requirement-item">
                          <svg className="requirement-icon" viewBox="0 0 24 24">
                            <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                          </svg>
                          <span>يجب مشاهدة جميع فيديوهات الدروس لفتح الاختبار النهائي</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            
          </div>
        );
      case 'notes':
        return (
          <div className="tab-content">
            <div className="lesson-notes-container">
              <div className="notes-header">
                <h2>ملاحظات الدرس</h2>
                <p className="notes-subtitle">اكتب ملاحظاتك الشخصية حول هذا الدرس</p>
              </div>
              
              <div className="notes-editor">
                <div className="editor-toolbar">
                  <button className="toolbar-btn" title="نص عريض">
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" title="نص مائل">
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" title="نص تحته خط">
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                      <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
                    </svg>
                  </button>
                  <div className="toolbar-divider"></div>
                  <button className="toolbar-btn" title="قائمة نقطية">
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                      <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" title="قائمة مرقمة">
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
                    </svg>
                  </button>
                  <div className="toolbar-divider"></div>
                  <button className="toolbar-btn" title="إضافة رابط">
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                  </button>
                </div>
                
                <textarea 
                  className="notes-textarea"
                  placeholder="ابدأ في كتابة ملاحظاتك هنا..."
                  rows={12}
                ></textarea>
                
                <div className="notes-actions">
                  <button className="save-notes-btn">
                    <svg viewBox="0 0 24 24" className="save-icon">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                    </svg>
                    حفظ الملاحظات
                  </button>
                  <button className="export-notes-btn">
                    <svg viewBox="0 0 24 24" className="export-icon">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    تصدير PDF
                  </button>
                </div>
              </div>
              
              <div className="saved-notes-section">
                <h3>الملاحظات المحفوظة</h3>
                <div className="saved-notes-list">
                  <div className="saved-note-item">
                    <div className="note-header">
                      <span className="note-date">منذ يومين</span>
                      <span className="note-lesson">الدرس الأول: مقدمة في التصميم</span>
                    </div>
                    <p className="note-preview">هذا الدرس مهم جداً لفهم أساسيات التصميم الجرافيكي...</p>
                    <div className="note-actions">
                      <button className="edit-note-btn">تعديل</button>
                      <button className="delete-note-btn">حذف</button>
                    </div>
                  </div>
                  
                  <div className="saved-note-item">
                    <div className="note-header">
                      <span className="note-date">منذ أسبوع</span>
                      <span className="note-lesson">الدرس الثاني: استخدام الألوان</span>
                    </div>
                    <p className="note-preview">نظرية الألوان مهمة جداً في التصميم، يجب فهم...</p>
                    <div className="note-actions">
                      <button className="edit-note-btn">تعديل</button>
                      <button className="delete-note-btn">حذف</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'instructor':
        return (
          <InstructorProfile 
            instructorName={instructorName}
            instructorImage={instructorImage}
            coursesCount={instructorCoursesCount}
            studentsCount={instructorStudentsCount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="left-content">
      {/* Course Title */}
      <h1 className="course-title">{courseTitle}</h1>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            نظرة عامة
          </button>
          <button 
            className={`tab-button ${activeTab === 'instructor' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructor')}
          >
            المحاضر
          </button>
          <button 
            className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            ملاحظات الدرس
          </button>
        </div>
        {getTabContent()}
      </div>

      <style jsx>{`
        .review-item {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .instructor-details h4 {
          color: #4142D0;
          margin: 20px 0 10px 0;
        }
        
        .instructor-details ul {
          padding-right: 20px;
          margin-bottom: 15px;
        }
        
        .instructor-details li {
          margin-bottom: 5px;
          color: #666;
        }

        .course-content-sections {
          margin-top: 20px;
        }

        .content-section {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 10px;
          overflow: hidden;
        }

        .section-header {
          background-color: #f8f9fa;
          padding: 15px 20px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color 0.2s;
        }

        .section-header:hover {
          background-color: #e9ecef;
        }

        .section-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .dropdown-arrow {
          width: 20px;
          height: 20px;
          fill: #666;
          transition: transform 0.2s;
        }

        .dropdown-arrow.expanded {
          transform: rotate(180deg);
        }

        .section-content {
          padding: 0;
        }

        .lesson-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid #f0f0f0;
          background-color: white;
        }

        .lesson-item:last-child {
          border-bottom: none;
        }

        .lesson-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lesson-duration {
          background-color: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          min-width: 40px;
          text-align: center;
        }

        .lesson-type {
          color: #4142D0;
          font-size: 14px;
          text-decoration: underline;
        }

        .play-icon {
          width: 16px;
          height: 16px;
          fill: #4142D0;
        }

        .lesson-title {
          color: #333;
          font-size: 14px;
          text-align: right;
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default CourseContentCopy;
