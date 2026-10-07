'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '@/components/Toast';
import { createCourse } from '@/utils/courseService';
import { getAdminCategories, type Diploma } from '@/utils/categoryService';
import { getAdminSections, type Section } from '@/utils/sectionService';
import { getInstructors, type Instructor } from '@/utils/instructorService';
import styles from './NewCourse.module.css';
import '@/styles/toast.css';

type CourseFormData = {
  title: string;
  description: string;
  instructor_id: string;
  category_id: string;
  status: 'draft' | 'published';
  duration: string;
  price: string;
  is_free: boolean;
  cover_image: File | null;
  rank: string;
  section_ids: string[];
};

type FormErrors = Partial<Record<'title' | 'description' | 'instructor_id' | 'category_id' | 'duration' | 'rank' | 'cover_image', string>>;

const allowedCoverTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxCoverSize = 20048 * 1024;

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} ك.ب`;
  return `${(size / (1024 * 1024)).toFixed(1)} م.ب`;
}

function NewCoursePageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const diplomaId = searchParams.get('diploma_id');

  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    instructor_id: '',
    category_id: diplomaId || '',
    status: 'published',
    duration: '',
    price: '0',
    is_free: true,
    cover_image: null,
    rank: '',
    section_ids: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const [isInstructorMenuOpen, setInstructorMenuOpen] = useState(false);
  const [instructorSearch, setInstructorSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const fetchInitialData = useCallback(async () => {
    setInitialLoading(true);
    setLoadError('');
    try {
      const [diplomasData, instructorsData, sectionsData] = await Promise.all([
        getAdminCategories(),
        getInstructors(),
        getAdminSections(),
      ]);
      setDiplomas(diplomasData);
      setSections(sectionsData);
      setInstructors([...instructorsData].sort((a, b) => a.name.localeCompare(b.name, 'ar')));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      const readableMessage = message.includes('401') || message.includes('403')
        ? 'يرجى تسجيل الدخول أولًا قبل إضافة مقرر جديد.'
        : 'تعذر تحميل بيانات الدبلومات أو المحاضرين أو الأقسام.';
      setLoadError(readableMessage);
      showToast(readableMessage, 'error');
    } finally {
      setInitialLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (diplomaId) {
      setFormData(prev => ({ ...prev, category_id: diplomaId }));
    }
  }, [diplomaId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setInstructorMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const selectedDiploma = diplomas.find(d => String(d.id) === formData.category_id);
  const selectedSections = sections.filter(section => formData.section_ids.includes(String(section.id)));
  const selectedInstructor = instructors.find(i => String(i.id) === formData.instructor_id);
  const filteredInstructors = instructors.filter(i => {
    const q = instructorSearch.trim();
    if (!q) return true;
    const s = `${i.name || ''} ${i.title || ''}`;
    return s.includes(q);
  });

  const clearError = (name: keyof FormErrors) => {
    setErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof FormErrors;
    clearError(fieldName);

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'is_free' && checked && { price: '0' }),
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectInstructor = (instructor: Instructor) => {
    setFormData(prev => ({ ...prev, instructor_id: String(instructor.id) }));
    clearError('instructor_id');
    setInstructorMenuOpen(false);
  };

  const validateCoverFile = (file: File) => {
    if (!allowedCoverTypes.includes(file.type)) {
      return 'صيغة صورة الغلاف غير مدعومة. الصيغ المسموحة: JPG, PNG, WebP.';
    }
    if (file.size > maxCoverSize) {
      return 'حجم صورة الغلاف أكبر من المسموح. الحد الأقصى حوالي 20MB.';
    }
    return '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    clearError('cover_image');

    if (!file) {
      setFormData(prev => ({ ...prev, cover_image: null }));
      setCoverPreview(null);
      return;
    }

    const fileError = validateCoverFile(file);
    if (fileError) {
      setErrors(prev => ({ ...prev, cover_image: fileError }));
      setFormData(prev => ({ ...prev, cover_image: null }));
      setCoverPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setFormData(prev => ({ ...prev, cover_image: file }));
    setCoverPreview(URL.createObjectURL(file));
  };

  const triggerFileEdit = () => {
    fileInputRef.current?.click();
  };

  const clearCoverImage = () => {
    setFormData(prev => ({ ...prev, cover_image: null }));
    setCoverPreview(null);
    clearError('cover_image');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSection = (sectionId: number) => {
    const id = String(sectionId);
    setFormData(prev => ({
      ...prev,
      section_ids: prev.section_ids.includes(id)
        ? prev.section_ids.filter(item => item !== id)
        : [...prev.section_ids, id],
    }));
  };

  const clearSections = () => {
    setFormData(prev => ({ ...prev, section_ids: [] }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const durationNumber = Number(formData.duration);
    const rankNumber = Number(formData.rank);

    if (!formData.title.trim()) nextErrors.title = 'عنوان المقرر مطلوب.';
    if (!formData.description.trim()) nextErrors.description = 'وصف المقرر مطلوب.';
    if (!formData.instructor_id) nextErrors.instructor_id = 'يرجى اختيار المحاضر.';
    if (!formData.category_id) nextErrors.category_id = 'يرجى اختيار الدبلومة.';
    if (!formData.duration || !Number.isInteger(durationNumber) || durationNumber < 1) {
      nextErrors.duration = 'المدة يجب أن تكون رقمًا صحيحًا أكبر من صفر.';
    }
    if (formData.rank.trim() && (!Number.isInteger(rankNumber) || rankNumber < 1)) {
      nextErrors.rank = 'الترتيب يجب أن يكون رقمًا صحيحًا موجبًا.';
    }
    if (formData.cover_image) {
      const fileError = validateCoverFile(formData.cover_image);
      if (fileError) nextErrors.cover_image = fileError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      showToast('يرجى مراجعة الحقول المطلوبة قبل إنشاء المقرر.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('instructor_id', formData.instructor_id);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('is_published', formData.status === 'published' ? '1' : '0');
      formDataToSend.append('duration', String(Number(formData.duration)));
      formDataToSend.append('price', '0');
      formDataToSend.append('is_free', '1');
      if (formData.rank.trim()) {
        formDataToSend.append('rank', String(Number(formData.rank)));
      }
      if (formData.section_ids.length > 0) {
        formDataToSend.append('section_id', formData.section_ids[0]);
        formDataToSend.append('section_ids', JSON.stringify(formData.section_ids.map(Number)));
      }
      if (formData.cover_image) {
        formDataToSend.append('cover_image', formData.cover_image);
      }

      await createCourse(formDataToSend);
      showToast('تم إنشاء المقرر بنجاح!', 'success');

      setTimeout(() => {
        if (diplomaId) {
          router.push(`/admin/diplomas/${diplomaId}`);
        } else {
          router.push('/admin/courses');
        }
      }, 1200);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء المقرر', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (diplomaId) {
      router.push(`/admin/diplomas/${diplomaId}`);
    } else {
      router.push('/admin/diplomas');
    }
  };

  const statusLabel = formData.status === 'published' ? 'منشور' : 'مسودة';
  const diplomaContext = selectedDiploma?.name || (diplomaId ? `رقم ${diplomaId}` : 'غير محددة');

  if (initialLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>إضافة مقرر جديد</h1>
            <p className={styles.subtitle}>جاري تجهيز بيانات النموذج...</p>
          </div>
        </div>
        <div className={styles.stateCard}>
          <div className={styles.loader} />
          <strong>جاري تحميل الدبلومات والمحاضرين والأقسام</strong>
          <span>لن يظهر النموذج فارغًا قبل وصول البيانات المطلوبة.</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>إضافة مقرر جديد</h1>
            <p className={styles.subtitle}>تعذر فتح النموذج بشكل كامل.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" onClick={handleBack} className={styles.backButton}>الرجوع لقائمة الدبلومات</button>
          </div>
        </div>
        <div className={styles.stateCard}>
          <strong>{loadError}</strong>
          <span>يمكنك إعادة المحاولة أو الرجوع للدبلومات.</span>
          <button type="button" className={styles.btnPrimary} onClick={fetchInitialData}>إعادة المحاولة</button>
        </div>
        <Toast message={toastMessage} type={toastType} isVisible={toastVisible} onClose={() => setToastVisible(false)} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <span className={styles.headerLabel}>لوحة إدارة الدبلومات</span>
          <h1 className={styles.title}>إضافة مقرر جديد</h1>
          <p className={styles.subtitle}>إضافة مقرر جديد داخل دبلومة: {diplomaContext}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={handleBack} className={styles.backButton}>
            {diplomaId ? 'الرجوع للدبلومة' : 'الرجوع لقائمة الدبلومات'}
          </button>
        </div>
      </div>

      <div className={styles.formShell}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>01</span>
                <h2>البيانات الأساسية</h2>
              </div>
              <p>اكتب بيانات المقرر التي ستظهر للأدمن والطلاب.</p>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="title">عنوان المقرر <span>*</span></label>
                <small>{formData.title.length} حرف</small>
              </div>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="مثال: مبادئ الإدارة للمؤسسات الإعلامية"
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              />
              {errors.title && <p className={styles.fieldError}>{errors.title}</p>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="description">وصف المقرر <span>*</span></label>
                <small>{formData.description.length} حرف</small>
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="اكتب وصفًا مختصرًا يوضح محتوى المقرر وأهدافه."
                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                rows={4}
              />
              <p className={styles.helpText}>يفضل أن يكون الوصف واضحًا ومناسبًا للظهور للطلاب.</p>
              {errors.description && <p className={styles.fieldError}>{errors.description}</p>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>المحاضر <span>*</span></label>
                <div className={styles.dropdown} ref={dropdownRef}>
                  <button
                    type="button"
                    className={`${styles.dropdownToggle} ${errors.instructor_id ? styles.inputError : ''}`}
                    onClick={() => instructors.length > 0 && setInstructorMenuOpen(v => !v)}
                    disabled={instructors.length === 0}
                  >
                    <div className={styles.dropdownSelectedText}>
                      {selectedInstructor ? (
                        <>
                          <div className={styles.dropdownItemName}>{selectedInstructor.name}</div>
                          {selectedInstructor.title && <div className={styles.dropdownItemTitle}>{selectedInstructor.title}</div>}
                        </>
                      ) : (
                        instructors.length === 0 ? 'لا يوجد محاضرون متاحون' : 'اختر المحاضر'
                      )}
                    </div>
                    <span className={styles.dropdownCaret} aria-hidden="true" />
                  </button>

                  {isInstructorMenuOpen && (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownSearch}>
                        <input
                          type="text"
                          placeholder="ابحث بالاسم أو الوصف"
                          value={instructorSearch}
                          onChange={(e) => setInstructorSearch(e.target.value)}
                        />
                      </div>
                      {filteredInstructors.length > 0 ? (
                        filteredInstructors.map(instructor => (
                          <button key={instructor.id} type="button" className={styles.dropdownItem} onClick={() => handleSelectInstructor(instructor)}>
                            <div className={styles.dropdownItemName}>{instructor.name}</div>
                            {instructor.title && <div className={styles.dropdownItemTitle}>{instructor.title}</div>}
                          </button>
                        ))
                      ) : (
                        <div className={styles.dropdownEmpty}>لا توجد نتائج مطابقة للبحث.</div>
                      )}
                    </div>
                  )}
                </div>
                {instructors.length === 0 && <p className={styles.helpText}>لا يوجد محاضرون متاحون. يرجى إضافة محاضر أولًا.</p>}
                {errors.instructor_id && <p className={styles.fieldError}>{errors.instructor_id}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category_id">الدبلومة <span>*</span></label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`${styles.select} ${errors.category_id ? styles.inputError : ''}`}
                  disabled={!!diplomaId}
                >
                  <option value="">اختر الدبلومة</option>
                  {diplomas.map(diploma => (
                    <option key={diploma.id} value={diploma.id}>{diploma.name}</option>
                  ))}
                </select>
                {diplomaId ? (
                  <p className={styles.helpText}>تم تحديد الدبلومة من الصفحة السابقة حتى لا يتم حفظ المقرر في دبلومة أخرى بالخطأ.</p>
                ) : diplomas.length === 0 ? (
                  <p className={styles.helpText}>لا توجد دبلومات متاحة.</p>
                ) : null}
                {diplomaId && <input type="hidden" name="category_id" value={diplomaId} />}
                {errors.category_id && <p className={styles.fieldError}>{errors.category_id}</p>}
              </div>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>02</span>
                <h2>التصنيف والتنظيم</h2>
              </div>
              <p>اضبط ظهور المقرر داخل التصنيفات وترتيبه داخل الدبلومة.</p>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.multiSelectBox}>
                <div className={styles.multiSelectHeader}>
                  <div>
                    <label>أقسام الكورس</label>
                    <span className={styles.multiSelectHint}>يمكن اختيار قسم أو أكثر لتسهيل ظهور المقرر في التصنيفات المناسبة.</span>
                  </div>
                  <div className={styles.selectionMeta}>
                    <strong>{selectedSections.length} محدد</strong>
                    {selectedSections.length > 0 && (
                      <button type="button" onClick={clearSections}>مسح الاختيارات</button>
                    )}
                  </div>
                </div>
                {selectedSections.length > 0 && (
                  <div className={styles.selectedChips}>
                    {selectedSections.map(section => (
                      <span key={section.id} className={styles.selectedChip}>
                        {section.name}
                        <button type="button" onClick={() => toggleSection(section.id)} aria-label={`إزالة ${section.name}`}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.sectionGrid}>
                  {sections.map(section => {
                    const selected = formData.section_ids.includes(String(section.id));
                    return (
                      <button
                        key={section.id}
                        type="button"
                        className={`${styles.sectionChip} ${selected ? styles.sectionChipSelected : ''}`}
                        onClick={() => toggleSection(section.id)}
                        aria-pressed={selected}
                      >
                        {section.name}
                      </button>
                    );
                  })}
                  {sections.length === 0 && <span className={styles.emptySections}>لا توجد أقسام متاحة حاليًا.</span>}
                </div>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="status">الحالة</label>
                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className={styles.select}>
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                </select>
                <p className={styles.helpText}>المقرر المنشور يظهر للطلاب حسب إعدادات الدبلومة.</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="rank">الترتيب <small>(اختياري)</small></label>
                <input
                  type="number"
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  placeholder="مثال: 1"
                  className={`${styles.input} ${errors.rank ? styles.inputError : ''}`}
                  min="1"
                />
                <p className={styles.helpText}>يحدد ترتيب ظهور المقرر داخل الدبلومة. اتركه فارغًا إن لم تكن تحتاج لترتيب محدد.</p>
                {errors.rank && <p className={styles.fieldError}>{errors.rank}</p>}
              </div>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>03</span>
                <h2>المدة والمحتوى</h2>
              </div>
              <p>أدخل مدة المقرر التقريبية بالساعات.</p>
            </div>
            <div className={styles.formRowSingle}>
              <div className={styles.formGroup}>
                <label htmlFor="duration">المدة بالساعات <span>*</span></label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="مثال: 20"
                  className={`${styles.input} ${errors.duration ? styles.inputError : ''}`}
                  min="1"
                />
                <p className={styles.helpText}>اكتب مدة المقرر التقريبية بالساعات كرقم صحيح أكبر من صفر.</p>
                {errors.duration && <p className={styles.fieldError}>{errors.duration}</p>}
              </div>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>04</span>
                <h2>صورة الغلاف</h2>
              </div>
              <p>الصورة اختيارية، وتساعد في تمييز المقرر بصريًا داخل لوحة الإدارة والواجهة.</p>
            </div>

            <div className={styles.uploadCard}>
              <input
                ref={fileInputRef}
                type="file"
                id="cover_image"
                name="cover_image"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className={styles.fileInputHidden}
              />
              <div className={styles.uploadInfo}>
                <strong>ارفع صورة غلاف للمقرر</strong>
                <span>JPG, PNG, WebP بحد أقصى حوالي 20MB. يفضل استخدام صورة أفقية واضحة.</span>
                <div className={styles.uploadActions}>
                  <button type="button" className={styles.btnSecondary} onClick={triggerFileEdit}>
                    {formData.cover_image ? 'تغيير الصورة' : 'اختيار صورة'}
                  </button>
                  {formData.cover_image && (
                    <button type="button" className={styles.btnGhost} onClick={clearCoverImage}>إزالة الصورة</button>
                  )}
                </div>
                {formData.cover_image && (
                  <p className={styles.fileSelected}>تم اختيار: {formData.cover_image.name} - {formatFileSize(formData.cover_image.size)}</p>
                )}
                {errors.cover_image && <p className={styles.fieldError}>{errors.cover_image}</p>}
              </div>
              <div className={styles.coverPreviewBox}>
                {coverPreview ? (
                  <img src={coverPreview} alt="معاينة غلاف المقرر" className={styles.coverPreview} />
                ) : (
                  <span>معاينة الصورة تظهر هنا</span>
                )}
              </div>
            </div>
          </section>

          <div className={styles.actions}>
            <button type="button" onClick={handleBack} className={styles.btnSecondary} disabled={submitting}>إلغاء</button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? 'جاري إنشاء المقرر...' : 'إنشاء المقرر'}
            </button>
          </div>
        </form>

        <aside className={styles.previewPanel}>
          <div className={styles.previewCard}>
            <span className={styles.sectionEyebrow}>معاينة سريعة</span>
            <h2>{formData.title.trim() || 'لم يتم إدخال العنوان بعد'}</h2>
            <p>{formData.description.trim() || 'سيظهر وصف المقرر هنا بعد كتابته.'}</p>
            <dl>
              <div>
                <dt>الدبلومة</dt>
                <dd>{selectedDiploma?.name || 'غير محددة'}</dd>
              </div>
              <div>
                <dt>المحاضر</dt>
                <dd>{selectedInstructor?.name || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>الحالة</dt>
                <dd><span className={formData.status === 'published' ? styles.badgePublished : styles.badgeDraft}>{statusLabel}</span></dd>
              </div>
              <div>
                <dt>الأقسام</dt>
                <dd>{selectedSections.length > 0 ? selectedSections.map(section => section.name).join('، ') : 'بدون أقسام'}</dd>
              </div>
              <div>
                <dt>المدة</dt>
                <dd>{formData.duration ? `${formData.duration} ساعة` : 'غير محددة'}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <Toast message={toastMessage} type={toastType} isVisible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
}

export default function NewCoursePageWrapper() {
  return (
    <Suspense fallback={<div>جاري تحميل الصفحة...</div>}>
      <NewCoursePageComponent />
    </Suspense>
  );
}
