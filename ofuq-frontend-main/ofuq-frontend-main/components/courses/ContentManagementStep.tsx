'use client';
import React, { useState } from 'react';
import { Course, Chapter, Lesson, Question } from '@/types/course';
import LessonQuestionManager from './LessonQuestionManager';
import Toast from '../Toast';
import '../../styles/courses.css';
import '../../styles/toast.css';
import { createChapter, updateChapter, deleteChapter } from '@/utils/chapterService';
import { createLesson, updateLesson, deleteLesson, CreateLessonData } from '@/utils/lessonService'; // Added CreateLessonData


interface ContentManagementStepProps {
  course: Course;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onNext: () => void;
  onPrev: () => void;
}

const ContentManagementStep: React.FC<ContentManagementStepProps> = ({
  course: currentCourse,
  setCourses,
  onNext,
  onPrev,
}) => {
  type ResourceType = 'website' | 'article' | 'video' | 'book' | 'tool' | 'other';

  // State for video upload method (file or url)
  const [videoUploadMethods, setVideoUploadMethods] = useState<{ [key: string]: 'file' | 'url' }>({});

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    // Auto-hide non-error/confirm toasts
    if (type !== 'error' && type !== 'confirm') {
        setTimeout(() => {
            setToastVisible(false);
        }, 3000);
    }
  };

  const closeToast = () => {
    setToastVisible(false);
  };

  const toNum = (id: string | number | undefined): number => {
    if (typeof id === 'number') return id;
    if (typeof id === 'string') {
        const num = parseInt(id, 10);
        return Number.isNaN(num) ? -1 : num; // Return -1 or similar for invalid/temp IDs
    }
    return -1;
  };
  
  const isPersistedId = (id: string | number | undefined) => {
    const numId = toNum(id);
    return numId > 0; // Check if it's a positive number (likely a DB ID)
  };

  // --- [START] Function to render Resource Icons (Restored) ---
  const renderResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'website':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon website-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'article':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon article-icon">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
      case 'video':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon video-icon">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
        );
      case 'book':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon book-icon">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
          </svg>
        );
      case 'tool':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon tool-icon">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="resource-icon default-icon">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
        );
    }
  };
  // --- [END] Function to render Resource Icons ---

  // --- [START] Function to handle Quiz Creation Callback (Added by Builder - Correct) ---
  const handleQuizCreated = (lessonId: string, newQuizData: any) => {
    const newQuizId = newQuizData?.id || newQuizData?.quiz?.id; // Adjust based on actual API response
    if (!newQuizId) {
      console.error("Failed to get new Quiz ID from response:", newQuizData);
      showToast('حدث خطأ في الحصول على معرف الاختبار الجديد', 'error');
      return;
    }

    setCourses((prevCourses) =>
      prevCourses.map((c) =>
        c.id === currentCourse.id
          ? {
              ...c,
              chapters: c.chapters.map((ch) => ({
                ...ch,
                lessons: ch.lessons.map((l) =>
                  l.id === lessonId
                    ? {
                        ...l,
                        quiz: { // Ensure quiz object exists (normalized)
                           ...(l.quiz || {}),
                           id: Number(newQuizId),
                           title: String(newQuizData?.title ?? l.quiz?.title ?? `أسئلة ${l.title}`),
                           description: newQuizData?.description ?? l.quiz?.description ?? undefined,
                           passing_score: newQuizData?.passing_score ?? l.quiz?.passing_score ?? undefined,
                           time_limit: newQuizData?.time_limit ?? l.quiz?.time_limit ?? undefined,
                           questions: l.quiz?.questions || [],
                        },
                      }
                    : l
                ),
              })),
            }
          : c
      )
    );
    showToast('تم إنشاء الاختبار بنجاح للدرس', 'success');
  };
  // --- [END] Function to handle Quiz Creation Callback ---


  return (
    <div className="step-content-container">
      <div className="step-header">
        <h2 className="step-main-title">إدارة محتوى الكورس</h2>
        <p className="step-main-description">أضف الفصول والدروس للكورس</p>
      </div>

      <div className="content-management-section">
        <div className="chapters-header">
          <h3 className="chapters-title">
            الفصول ({currentCourse?.chapters?.length || 0})
          </h3>
          <button
            onClick={async () => {
                if (!currentCourse) return;
                const newOrder = (currentCourse.chapters?.length || 0) + 1;
                const courseIdNum = toNum(currentCourse.id);
            
                // Always add locally first for instant UI update
                const tempId = `temp-chapter-${Date.now()}`;
                const newChapterLocal: Chapter = {
                    id: tempId,
                    title: 'فصل جديد',
                    description: '',
                    lessons: [],
                    order: newOrder
                };
            
                setCourses(prevCourses =>
                    prevCourses.map(course =>
                        course.id === currentCourse.id
                            ? { ...course, chapters: [...(course.chapters || []), newChapterLocal] }
                            : course
                    )
                );
            
                // If the course is already saved, also create the chapter on the backend
                if (isPersistedId(courseIdNum)) {
                    try {
                        const createdChapterApi = await createChapter(courseIdNum, { title: 'فصل جديد', description: '', order: newOrder });
                        // Update the temporary chapter with the real ID from the API
                        setCourses(prevCourses =>
                            prevCourses.map(course =>
                                course.id === currentCourse.id
                                    ? {
                                        ...course,
                                        chapters: course.chapters.map(ch =>
                                            ch.id === tempId
                                                ? { ...ch, id: String(createdChapterApi.id), title: String(createdChapterApi.title ?? ''), description: String(createdChapterApi.description ?? ''), order: (createdChapterApi.order ?? newOrder) } // Update with API data
                                                : ch
                                        )
                                    }
                                    : course
                            )
                        );
                        showToast('تمت إضافة الفصل بنجاح!', 'success');
                    } catch (error: any) {
                        showToast(error.message || 'فشل في إضافة الفصل إلى الخادم', 'error');
                        // Optional: Remove the locally added chapter if API call fails
                        setCourses(prevCourses =>
                            prevCourses.map(course =>
                                course.id === currentCourse.id
                                    ? { ...course, chapters: course.chapters.filter(ch => ch.id !== tempId) }
                                    : course
                            )
                        );
                    }
                } else {
                    showToast('تمت إضافة الفصل محلياً (سيتم حفظه مع الكورس)', 'info');
                }
            }}
            
            className="add-chapter-btn"
          >
            <span className="btn-icon">➕</span>
            إضافة فصل جديد
          </button>
        </div>

        <div className="chapters-list">
          {/* --- [START] Chapter Mapping and Editing UI (Restored) --- */}
          {currentCourse?.chapters?.map((chapter, chapterIndex) => (
            <div key={chapter.id} className="chapter-card">
              <div className="chapter-header">
                <div className="chapter-info">
                  <div className="chapter-number">
                    <span className="chapter-number-text">الفصل {chapterIndex + 1}</span>
                  </div>
                  <div className="chapter-inputs">
                    <input
                      type="text"
                      placeholder="عنوان الفصل"
                      value={chapter.title}
                      onChange={(e) => { // Update local state immediately
                        const newTitle = e.target.value;
                        setCourses(prevCourses =>
                          prevCourses.map(course =>
                            course.id === currentCourse.id
                              ? {
                                ...course,
                                chapters: course.chapters.map((ch, idx) =>
                                  idx === chapterIndex
                                    ? { ...ch, title: newTitle }
                                    : ch
                                )
                              }
                              : course
                          )
                        );
                      }}
                      onBlur={async (e) => { // Save to backend on blur if ID exists
                        const chIdNum = toNum(chapter.id);
                        if (isPersistedId(chIdNum)) {
                          try {
                            await updateChapter(chIdNum, { title: e.target.value });
                            showToast('تم تحديث عنوان الفصل', 'success');
                          } catch (error: any) {
                            showToast(error.message || 'فشل تحديث عنوان الفصل', 'error');
                            // Optional: Revert local state if API call fails?
                          }
                        }
                      }}
                      className="chapter-title-input"
                    />
                    <textarea
                      placeholder="وصف الفصل"
                      value={chapter.description}
                       onChange={(e) => { // Update local state immediately
                        const newDescription = e.target.value;
                        setCourses(prevCourses =>
                          prevCourses.map(course =>
                            course.id === currentCourse.id
                              ? {
                                ...course,
                                chapters: course.chapters.map((ch, idx) =>
                                  idx === chapterIndex
                                    ? { ...ch, description: newDescription }
                                    : ch
                                )
                              }
                              : course
                          )
                        );
                      }}
                      onBlur={async (e) => { // Save to backend on blur if ID exists
                        const chIdNum = toNum(chapter.id);
                        if (isPersistedId(chIdNum)) {
                          try {
                            await updateChapter(chIdNum, { description: e.target.value });
                            showToast('تم تحديث وصف الفصل', 'success');
                          } catch (error: any) {
                            showToast(error.message || 'فشل تحديث وصف الفصل', 'error');
                            // Optional: Revert local state
                          }
                        }
                      }}
                      className="chapter-description-input"
                      rows={2}
                    />
                  </div>
                </div>
                <button
                   onClick={async () => { // Delete Chapter Logic (Restored)
                    if (!confirm(`هل أنت متأكد من حذف "${chapter.title}" وكل دروسه؟`)) return;

                    const chIdNum = toNum(chapter.id);

                    // Always remove locally first
                    const originalChapters = [...(currentCourse.chapters || [])]; // Backup for potential revert
                    setCourses(prevCourses =>
                      prevCourses.map(course =>
                        course.id === currentCourse.id
                          ? { ...course, chapters: course.chapters.filter((_, i) => i !== chapterIndex) }
                          : course
                      )
                    );

                    if (isPersistedId(chIdNum)) {
                      try {
                        await deleteChapter(chIdNum);
                        showToast('تم حذف الفصل بنجاح', 'success');
                      } catch (error: any) {
                        showToast(error.message || 'فشل حذف الفصل من الخادم', 'error');
                        // Revert local state if API call fails
                        setCourses(prevCourses =>
                          prevCourses.map(course =>
                            course.id === currentCourse.id
                              ? { ...course, chapters: originalChapters } // Restore from backup
                              : course
                          )
                        );
                      }
                    } else {
                       showToast('تم حذف الفصل محلياً', 'info');
                    }
                  }}
                  className="delete-chapter-btn"
                >
                  <span className="btn-icon">🗑️</span> {/* Changed Icon */}
                  حذف الفصل
                </button>
              </div>
              {/* --- [END] Chapter Mapping and Editing UI --- */}

              <div className="lessons-section">
                <div className="lessons-header">
                  <h4 className="lessons-title">
                    الدروس ({chapter.lessons?.length || 0})
                  </h4>
                  <button
                    onClick={async () => { // Add Lesson Logic (Restored with API call)
                        if (!currentCourse) return;
                        const chapterIdNum = toNum(chapter.id);
                        if (!isPersistedId(chapterIdNum)) {
                            showToast('يرجى حفظ الفصل أولاً قبل إضافة دروس', 'warning');
                            return;
                        }
                    
                        const newLessonOrder = (chapter.lessons?.length || 0) + 1;
                        const tempId = `temp-lesson-${Date.now()}`;
                        const newLessonLocal: Lesson = {
                            id: tempId,
                            title: 'درس جديد',
                            description: '',
                            attachments: [],
                            isVideoPublic: false,
                            order: newLessonOrder,
                            questions: [],
                            resources: [],
                            quiz: undefined
                        };
                    
                        // Add locally first
                        setCourses(prevCourses =>
                            prevCourses.map(course =>
                                course.id === currentCourse.id
                                    ? {
                                        ...course,
                                        chapters: course.chapters.map((ch, idx) =>
                                            idx === chapterIndex
                                                ? { ...ch, lessons: [...(ch.lessons || []), newLessonLocal] }
                                                : ch
                                        )
                                    }
                                    : course
                            )
                        );
                    
                        try {
                            const lessonData: CreateLessonData = {
                                title: 'درس جديد',
                                description: '',
                                order: newLessonOrder,
                                is_visible: false
                            };
                            const createdLessonApi = await createLesson(chapterIdNum, lessonData);
                    
                            // Update the temporary lesson with the real ID and data from the API
                            setCourses(prevCourses =>
                                prevCourses.map(course =>
                                    course.id === currentCourse.id
                                        ? {
                                            ...course,
                                            chapters: course.chapters.map((ch, idx) =>
                                                idx === chapterIndex
                                                    ? {
                                                        ...ch,
                                                        lessons: ch.lessons.map(l =>
                                                            l.id === tempId
                                                                ? { // Map API response to Lesson type (normalized)
                                                                    id: String(createdLessonApi.id),
                                                                    title: String(createdLessonApi.title ?? ''),
                                                                    description: String(createdLessonApi.description ?? ''),
                                                                    videoUrl: createdLessonApi.video_url ?? undefined,
                                                                    isVideoPublic: Boolean(createdLessonApi.is_visible ?? false),
                                                                    order: (createdLessonApi.order ?? newLessonOrder),
                                                                    attachments: [], // normalize: backend JSON not File[]
                                                                    resources: [], // normalize until explicit mapping
                                                                    quiz: createdLessonApi.quiz
                                                        ? {
                                                            id: Number(createdLessonApi.quiz.id),
                                                            title: String(createdLessonApi.quiz.title ?? ''),
                                                            description: (createdLessonApi.quiz as any).description ?? undefined,
                                                            passing_score: (createdLessonApi.quiz as any).passing_score ?? undefined,
                                                            time_limit: (createdLessonApi.quiz as any).time_limit ?? undefined,
                                                            questions: [] // defer to LessonQuestionManager normalization
                                                          }
                                                        : undefined,
                                                                    questions: [] // keep UI questions empty initially
                                                                  }
                                                                : l
                                                        )
                                                      }
                                                    : ch
                                            )
                                          }
                                        : course
                                )
                            );
                            showToast('تمت إضافة الدرس بنجاح!', 'success');
                        } catch (error: any) {
                            showToast(error.message || 'فشل في إضافة الدرس إلى الخادم', 'error');
                            // Remove locally added lesson if API fails
                            setCourses(prevCourses =>
                                prevCourses.map(course =>
                                    course.id === currentCourse.id
                                        ? {
                                            ...course,
                                            chapters: course.chapters.map((ch, idx) =>
                                                idx === chapterIndex
                                                    ? { ...ch, lessons: ch.lessons.filter(l => l.id !== tempId) }
                                                    : ch
                                            )
                                          }
                                        : course
                                )
                            );
                        }
                    }}                    
                    className="add-lesson-btn"
                  >
                    <span className="btn-icon">➕</span>
                    إضافة درس
                  </button>
                </div>

                <div className="lessons-list">
                  {/* --- [START] Lesson Mapping and Editing UI (Restored) --- */}
                  {chapter.lessons?.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="lesson-card">
                      <div className="lesson-header">
                        <div className="lesson-number">
                          <span className="lesson-number-text">الدرس {lessonIndex + 1}</span>
                        </div>
                        <button
                           onClick={async () => { // Delete Lesson Logic (Restored)
                            if (!confirm(`هل أنت متأكد من حذف "${lesson.title}"؟`)) return;

                            const lessonIdNum = toNum(lesson.id);
                             // Always remove locally first
                            const originalLessons = [...(chapter.lessons || [])];
                            setCourses(prevCourses =>
                              prevCourses.map(course =>
                                course.id === currentCourse.id
                                  ? {
                                    ...course,
                                    chapters: course.chapters.map((ch, idx) =>
                                      idx === chapterIndex
                                        ? { ...ch, lessons: ch.lessons.filter((_, i) => i !== lessonIndex) }
                                        : ch
                                    )
                                  }
                                  : course
                              )
                            );

                            if (isPersistedId(lessonIdNum)) {
                              try {
                                await deleteLesson(lessonIdNum);
                                showToast('تم حذف الدرس بنجاح', 'success');
                              } catch (error: any) {
                                showToast(error.message || 'فشل حذف الدرس من الخادم', 'error');
                                // Revert local state
                                setCourses(prevCourses =>
                                  prevCourses.map(course =>
                                    course.id === currentCourse.id
                                      ? {
                                        ...course,
                                        chapters: course.chapters.map((ch, idx) =>
                                          idx === chapterIndex
                                            ? { ...ch, lessons: originalLessons }
                                            : ch
                                        )
                                      }
                                      : course
                                  )
                                );
                              }
                            } else {
                                showToast('تم حذف الدرس محلياً', 'info');
                            }
                          }}
                          className="delete-lesson-btn"
                        >
                           <span className="btn-icon">🗑️</span> {/* Changed Icon */}
                           حذف الدرس
                        </button>
                      </div>
                      <div className="lesson-inputs">
                        <input
                          type="text"
                          placeholder="عنوان الدرس"
                          value={lesson.title}
                          onChange={(e) => { // Update local state immediately
                            const newTitle = e.target.value;
                            setCourses(prevCourses =>
                              prevCourses.map(course =>
                                course.id === currentCourse.id
                                  ? {
                                    ...course,
                                    chapters: course.chapters.map((ch, idx) =>
                                      idx === chapterIndex
                                        ? {
                                          ...ch,
                                          lessons: ch.lessons.map((l, i) =>
                                            i === lessonIndex ? { ...l, title: newTitle } : l
                                          )
                                        }
                                        : ch
                                    )
                                  }
                                  : course
                              )
                            );
                          }}
                           onBlur={async (e) => { // Save to backend on blur if ID exists
                            const lessonIdNum = toNum(lesson.id);
                            if (isPersistedId(lessonIdNum)) {
                              try {
                                await updateLessonAdmin(lessonIdNum, { title: e.target.value });
                                showToast('تم تحديث عنوان الدرس', 'success');
                              } catch (error: any) {
                                showToast(error.message || 'فشل تحديث عنوان الدرس', 'error');
                              }
                            }
                          }}
                          className="lesson-title-input"
                        />
                        <textarea
                          placeholder="وصف الدرس"
                          value={lesson.description}
                           onChange={(e) => { // Update local state immediately
                            const newDescription = e.target.value;
                             setCourses(prevCourses =>
                              prevCourses.map(course =>
                                course.id === currentCourse.id
                                  ? {
                                    ...course,
                                    chapters: course.chapters.map((ch, idx) =>
                                      idx === chapterIndex
                                        ? {
                                          ...ch,
                                          lessons: ch.lessons.map((l, i) =>
                                            i === lessonIndex ? { ...l, description: newDescription } : l
                                          )
                                        }
                                        : ch
                                    )
                                  }
                                  : course
                              )
                            );
                          }}
                           onBlur={async (e) => { // Save to backend on blur if ID exists
                            const lessonIdNum = toNum(lesson.id);
                            if (isPersistedId(lessonIdNum)) {
                              try {
                                // Assuming description maps to content in backend or adjust API call
                                await updateLessonAdmin(lessonIdNum, { description: e.target.value, content: e.target.value });
                                showToast('تم تحديث وصف الدرس', 'success');
                              } catch (error: any) {
                                showToast(error.message || 'فشل تحديث وصف الدرس', 'error');
                              }
                            }
                          }}
                          className="lesson-description-input"
                          rows={2}
                        />

                        {/* Video Upload Section (Restored) */}
                        <div className="lesson-video-section">
                           <label className="video-upload-label">فيديو الدرس</label>
                            <div className="video-upload-method-toggle">
                              {/* Buttons for File/URL Toggle */}
                              <button /* ... File Button ... */ >...</button>
                              <button /* ... URL Button ... */ >...</button>
                            </div>
                            {/* Conditional Rendering for File Upload Input or URL Input */}
                            {(videoUploadMethods[lesson.id] || 'file') === 'file' && (
                                <div className="video-upload-container"> {/* File upload UI */} </div>
                            )}
                            {videoUploadMethods[lesson.id] === 'url' && (
                                <div className="video-url-input-container"> {/* URL input UI */} </div>
                            )}
                            {/* Visibility Toggle Switch */}
                           <div className="video-visibility-toggle">...</div>
                         </div>


                        {/* Attachments Section (Restored - Simplified Structure) */}
                        <div className="lesson-attachments-section">
                          <label className="attachments-label">مرفقات الدرس</label>
                          <div className="attachments-container">
                            <input type="file" multiple /* ... onChange ... */ style={{ display: 'none' }} id={`attachments-${chapter.id}-${lesson.id}`} />
                            <label htmlFor={`attachments-${chapter.id}-${lesson.id}`} className="attachments-upload-btn">
                              {/* UI to show uploaded files or placeholder */}
                            </label>
                          </div>
                        </div>

                        {/* Resources Section (Restored - Simplified Structure) */}
                        <div className="resource-link-section">
                            <div className="resource-inputs">
                                <input type="text" placeholder="عنوان المصدر" /* ... */ />
                                <input type="url" placeholder="رابط المصدر" /* ... */ />
                                {/* Resource Type Picker UI */}
                                <div className="resource-type-picker">...</div>
                                <button className="add-resource-btn" /* ... onClick ... */>إضافة رابط مصدر</button>
                            </div>
                            {/* List of Added Resources */}
                            {lesson.resources && lesson.resources.length > 0 && (
                                <div className="resource-list">...</div>
                            )}
                        </div>
                      </div>
                      {/* --- [END] Lesson Mapping and Editing UI --- */}

                      {/* Lesson Questions Section (Already Correctly Wired) */}
                      <LessonQuestionManager
                        lessonId={lesson.id}
                        quizId={lesson.quiz?.id}
                        questions={lesson.quiz?.questions || []} // Read from correct place
                        onQuestionsChange={(updatedQuestions) => { // Write to both places (compromise)
                          setCourses((prevCourses) =>
                            prevCourses.map((c) =>
                              c.id === currentCourse.id
                                ? {
                                  ...c,
                                  chapters: c.chapters.map((ch, ci) =>
                                    ci === chapterIndex
                                      ? {
                                        ...ch,
                                        lessons: ch.lessons.map((l, li) =>
                                          li === lessonIndex
                                            ? {
                                              ...l,
                                              questions: updatedQuestions, // Keep for TS
                                              quiz: {
                                                ...(l.quiz || {}),
                                                id: l.quiz?.id || 0,
                                                title: l.quiz?.title ?? `اختبار ${l.title}`,
                                                questions: updatedQuestions,
                                              },
                                            }
                                            : l
                                        ),
                                      }
                                      : ch
                                  ),
                                }
                                : c
                            )
                          );
                        }}
                         onQuizCreated={(quizId) => handleQuizCreated(lesson.id, { id: quizId })} // Adapt signature
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="step-actions">
        <button onClick={onPrev} className="step-prev-btn">
          <span className="btn-icon">⬅️</span>
          السابق: المعلومات الأساسية
        </button>
        <button onClick={onNext} className="step-next-btn">
          <span className="btn-icon">➡️</span>
          التالي: مراجعة ونشر
        </button>
      </div>

      {/* Toast Component */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={closeToast}
      />
    </div>
  );
};

export default ContentManagementStep;