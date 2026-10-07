'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import styles from './AdminCourseChapters.module.css';

// Services & types
import {
  getAdminCategory,
  type Diploma,
} from '@/utils/categoryService';

import {
  getAdminCourse,
  type Course,
} from '@/utils/courseService';

import {
  getCourseChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  type Chapter,
} from '@/utils/chapterService';

interface ChapterFormData {
  title: string;
  description: string;
  order: number;
}

export default function AdminCourseChapters() {
  const params = useParams();
  const router = useRouter();
  const diplomaId = Number(params.id);
  const courseId = Number(params.courseId);

  const [diploma, setDiploma] = useState<Diploma | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Chapter form state
  const [chapterFormData, setChapterFormData] = useState<ChapterFormData>({
    title: '',
    description: '',
    order: 1,
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch diploma details
        const diplomaData = await getAdminCategory(diplomaId);
        setDiploma(diplomaData);
        
        // Fetch course details
        const courseData = await getAdminCourse(courseId);
        setCourse(courseData);
        
        // Fetch chapters for this course
        const chaptersData = await getCourseChapters(courseId);
        setChapters(chaptersData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (diplomaId && courseId) {
      fetchData();
    }
  }, [diplomaId, courseId]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        title: chapterFormData.title,
        description: chapterFormData.description,
        order: chapterFormData.order,
        course_id: courseId,
      };

      if (editingChapter) {
        await updateChapter(editingChapter.id, payload);
        showToast('تم تحديث الفصل بنجاح', 'success');
      } else {
        await createChapter(courseId, payload);
        showToast('تم إنشاء الفصل بنجاح', 'success');
      }

      // Refresh chapters list
      const chaptersData = await getCourseChapters(courseId);
      setChapters(chaptersData);

      // Reset form
      setChapterFormData({
        title: '',
        description: '',
        order: chapters.length + 1,
      });
      setShowChapterForm(false);
      setEditingChapter(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ غير متوقع', 'error');
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterFormData({
      title: chapter.title,
      description: chapter.description || '',
      order: chapter.order || chapters.indexOf(chapter) + 1,
    });
    setShowChapterForm(true);
  };

  const handleDelete = async (chapterId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الدروس المرتبطة به.')) return;
    
    try {
      await deleteChapter(chapterId);
      showToast('تم حذف الفصل بنجاح', 'success');
      
      // Refresh chapters list
      const chaptersData = await getCourseChapters(courseId);
      setChapters(chaptersData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ غير متوقع', 'error');
    }
  };

  const handleManageLessons = (chapterId: number) => {
    router.push(`/admin/diplomas/${diplomaId}/courses/${courseId}/chapters/${chapterId}/lessons`);
  };

  const handleBackToCourses = () => {
    router.push(`/admin/diplomas/${diplomaId}`);
  };

  if (loading) return <div className="loading">جاري التحميل...</div>;
  if (error) return (
    <div className="error">خطأ: {error} (يرجى تسجيل الخروج والمحاولة مرة أخرى)</div>
  );
  if (!diploma || !course) return <div className="error">لم يتم العثور على البيانات المطلوبة</div>;

  return (
    <div className={styles.root}>
      <div className="admin-courses-container">
        {/* --- Header & Actions --- */}
        <div className="admin-courses-header">
          <div className="admin-courses-title-container">
            <button 
              className="btn-secondary back-button" 
              onClick={handleBackToCourses}
            >
              &larr; العودة للمقررات
            </button>
            <h1 className="admin-courses-title">إدارة فصول المقرر: {course.title}</h1>
          </div>
          <p className="admin-courses-subtitle">
            <span>الدبلومة: {diploma.name}</span>
            <span> | </span>
            <span>المقرر: {course.title}</span>
          </p>
        </div>

        <div className="admin-courses-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setShowChapterForm(true);
              setEditingChapter(null);
              setChapterFormData({
                title: '',
                description: '',
                order: chapters.length + 1,
              });
            }}
          >
            + إضافة فصل جديد
          </button>
        </div>

        {/* --- Add/Edit Chapter Modal --- */}
        {showChapterForm && (
          <div className="modal-overlay" onClick={() => setShowChapterForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingChapter ? 'تعديل الفصل' : 'إضافة فصل جديد'}</h2>
                <button className="close-btn" onClick={() => setShowChapterForm(false)}>×</button>
              </div>
              <form onSubmit={handleChapterSubmit} className="course-form">
                <div className="form-section">
                  <h3 className="form-section-title">معلومات الفصل</h3>
                  <div className="form-grid">
                    {/* title */}
                    <div className="form-group">
                      <label htmlFor="title" className="form-label">عنوان الفصل <span className="required">*</span></label>
                      <input 
                        type="text" 
                        id="title" 
                        className="form-input" 
                        value={chapterFormData.title} 
                        onChange={(e) => setChapterFormData({ ...chapterFormData, title: e.target.value })} 
                        required 
                        placeholder="أدخل عنوان الفصل"
                      />
                    </div>
                    
                    {/* order */}
                    <div className="form-group">
                      <label htmlFor="order" className="form-label">الترتيب</label>
                      <input 
                        type="number" 
                        id="order" 
                        className="form-input" 
                        value={chapterFormData.order} 
                        onChange={(e) => setChapterFormData({ ...chapterFormData, order: Number(e.target.value) })} 
                        min={1}
                        placeholder="ترتيب الفصل"
                      />
                    </div>
                    
                    {/* description */}
                    <div className="form-group form-grid-full">
                      <label htmlFor="description" className="form-label">وصف الفصل</label>
                      <textarea 
                        id="description" 
                        className="form-textarea" 
                        value={chapterFormData.description} 
                        onChange={(e) => setChapterFormData({ ...chapterFormData, description: e.target.value })} 
                        rows={3}
                        placeholder="أدخل وصفاً مختصراً للفصل"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">{editingChapter ? 'تحديث' : 'إضافة'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowChapterForm(false)}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- Chapters List --- */}
        <div className="admin-courses-list">
          <h2 className="section-title">قائمة الفصول في المقرر</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>الوصف</th>
                  <th>الترتيب</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((chapter) => (
                  <tr key={chapter.id}>
                    <td>{chapter.title}</td>
                    <td>{chapter.description || 'لا يوجد وصف'}</td>
                    <td>{chapter.order || chapters.indexOf(chapter) + 1}</td>
                    <td className="actions-cell">
                      <button className="btn-action" onClick={() => handleEdit(chapter)}>تعديل</button>
                      <button className="btn-action btn-danger" onClick={() => handleDelete(chapter.id)}>حذف</button>
                      <button className="btn-action btn-success" onClick={() => handleManageLessons(chapter.id)}>إدارة الدروس</button>
                    </td>
                  </tr>
                ))}
                {chapters.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center' }}>لا توجد فصول في هذا المقرر</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Toast --- */}
        {toastVisible && (
          <Toast
            isVisible={toastVisible}
            message={toastMessage}
            type={toastType}
            onClose={() => setToastVisible(false)}
          />
           
        )}
      </div>
    </div>
  );
}