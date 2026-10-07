"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Save,
  BookOpen,
  User,
  FolderOpen,
  Layers,
  Clock,
  Hash,
  ImagePlus,
  Eye,
  BarChart3,
  Upload,
  CheckCircle,
} from "lucide-react";
import Toast from "@/components/Toast";
import "@/styles/toast.css";
import { getAdminCourse, updateCourse, type Course } from "@/utils/courseService";
import { getAdminCategories, type Diploma } from "@/utils/categoryService";
import { getAdminSections, type Section } from "@/utils/sectionService";
import { getInstructors, type Instructor } from "@/utils/instructorService";
import { getBackendAssetUrl } from "@/utils/url";
import styles from "./EditCourse.module.css";

type CourseWithCoverUrl = Course & { cover_image_url?: string };

export default function EditCoursePage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const courseId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isInstructorMenuOpen, setInstructorMenuOpen] = useState(false);
  const [instructorSearch, setInstructorSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructorId, setInstructorId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [duration, setDuration] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [rank, setRank] = useState<string>('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("info");

  function showToast(msg: string, type: "success" | "error" | "warning" | "info" = "info") {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [c, cats, ins, secs] = await Promise.all([
          getAdminCourse(courseId),
          getAdminCategories(),
          getInstructors(),
          getAdminSections(),
        ]);
        if (!c) throw new Error("لم يتم العثور على بيانات المقرر");
        setCourse(c);
        setDiplomas(cats);
        setSections(secs);
        const sortedIns = [...ins].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        setInstructors(sortedIns);
        setTitle(String(c.title ?? ""));
        setDescription(String(c.description ?? ""));
        setInstructorId(String(c.instructor_id ?? c.instructor?.id ?? ""));
        setCategoryId(String(c.category_id ?? c.category?.id ?? ""));
        const existingSections = Array.isArray(c.sections) && c.sections.length > 0
          ? c.sections.map((section) => String(section.id))
          : c.section_id || c.section?.id
            ? [String(c.section_id ?? c.section?.id)]
            : [];
        setSectionIds(existingSections);
        const isPub = (c.is_published === true) || (String(c.status || "published").toLowerCase() === "published");
        setStatus(isPub ? "published" : "draft");
        setDuration(String(c.duration ?? ""));
        setRank(c.rank != null ? String(c.rank) : '');
        const existingCover = getBackendAssetUrl(c.cover_image ?? (c as CourseWithCoverUrl).cover_image_url);
        setCoverPreview(existingCover || null);
      } catch (err: unknown) {
        console.error(err);
        showToast(err instanceof Error ? err.message : "حدث خطأ في تحميل بيانات المقرر", "error");
      } finally {
        setLoading(false);
      }
    }
    if (!Number.isNaN(courseId) && courseId > 0) load();
    else {
      showToast("معرف مقرر غير صالح", "error");
      setLoading(false);
    }
  }, [courseId]);

  function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : coverPreview);
  }

  function toggleSection(sectionId: number) {
    const idValue = String(sectionId);
    setSectionIds((current) => current.includes(idValue)
      ? current.filter((item) => item !== idValue)
      : [...current, idValue]);
  }

  function removeSection(sectionId: number) {
    const idValue = String(sectionId);
    setSectionIds((current) => current.filter((item) => item !== idValue));
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setInstructorMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !instructorId || !categoryId || !duration) {
      showToast("يرجى ملء جميع الحقول الإجبارية بقيم صحيحة", "error");
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("instructor_id", instructorId);
      fd.append("category_id", categoryId);
      if (sectionIds.length > 0) {
        fd.append("section_id", sectionIds[0]);
        fd.append("section_ids", JSON.stringify(sectionIds.map(Number)));
      } else {
        fd.append("section_id", "");
        fd.append("section_ids", JSON.stringify([]));
      }
      fd.append("is_published", status === "published" ? "1" : "0");
      fd.append("duration", duration);
      fd.append("price", "0");
      fd.append("is_free", "1");
      if (rank && rank.trim() !== '') {
        fd.append('rank', rank.trim());
      }
      if (coverFile) fd.append("cover_image", coverFile);
      await updateCourse(courseId, fd);
      showToast("تم تعديل المقرر بنجاح ✅", "success");
      setTimeout(() => {
        const cid = Number(categoryId);
        if (cid) router.push(`/admin/diplomas/${cid}`);
        else router.push("/admin/course-management");
      }, 1200);
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ التعديلات", "error");
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    const cid = Number(categoryId || course?.category_id || course?.category?.id || 0);
    if (cid) router.push(`/admin/diplomas/${cid}`);
    else router.push("/admin/diplomas");
  }

  // Derived
  const sortedInstructors = [...instructors];
  const selectedInstructor = sortedInstructors.find((i) => String(i.id) === instructorId);
  const filteredInstructors = sortedInstructors.filter((i) => {
    const q = instructorSearch.trim().toLowerCase();
    if (!q) return true;
    return (i.name || "").toLowerCase().includes(q) || (i.title || "").toLowerCase().includes(q);
  });
  const selectedSections = sections.filter((s) => sectionIds.includes(String(s.id)));
  const selectedDiploma = diplomas.find(d => String(d.id) === categoryId);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>جاري تحميل بيانات المقرر...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <span>لا توجد بيانات لهذا المقرر</span>
          <button className={styles.btnSecondary} onClick={() => router.back()}>العودة</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ─── Hero ─── */}
      <div className={styles.hero}>
        <div className={styles.heroRow}>
          <div className={styles.heroInfo}>
            <h1>
              ✏️ تعديل المقرر
              <span className={`${styles.heroBadge} ${status === 'published' ? styles.heroBadgePublished : styles.heroBadgeDraft}`}>
                {status === 'published' ? 'منشور' : 'مسودة'}
              </span>
            </h1>
            <p>{course.title} — معرف: {course.id}</p>
          </div>
          <div className={styles.heroActions}>
            <Link href={`/admin/reports/courses/${courseId}`} className={`${styles.heroBtn} ${styles.heroBtnWhite}`}>
              <BarChart3 size={18} />
              التقرير
            </Link>
            <Link href={`/admin/courses/${courseId}/chapters`} className={`${styles.heroBtn} ${styles.heroBtnWhite}`}>
              <Layers size={18} />
              الفصول والدروس
            </Link>
            <button onClick={onCancel} className={`${styles.heroBtn} ${styles.heroBtnGhost}`}>
              <ArrowRight size={18} />
              رجوع
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Layout ─── */}
      <form onSubmit={onSubmit}>
        <div className={styles.layout}>
          {/* ─── Main Column ─── */}
          <div>
            {/* Basic Info */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
              <div className={styles.cardHeader}>
                <BookOpen size={20} color="#0ea5e9" />
                <h2>المعلومات الأساسية</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.form}>
                  <div className={styles.field}>
                    <label><span className={styles.required}>*</span> عنوان المقرر</label>
                    <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>

                  <div className={styles.field}>
                    <label><span className={styles.required}>*</span> وصف المقرر</label>
                    <textarea className={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field} ref={dropdownRef} style={{ position: 'relative' }}>
                      <label><User size={14} /> <span className={styles.required}>*</span> المحاضر</label>
                      <button type="button" className={styles.selectBtn} onClick={() => setInstructorMenuOpen(v => !v)}>
                        {selectedInstructor ? selectedInstructor.name : 'اختر المحاضر'}
                      </button>
                      {isInstructorMenuOpen && (
                        <div className={styles.dropdown}>
                          <div className={styles.dropdownSearch}>
                            <input placeholder="ابحث باسم المحاضر..." value={instructorSearch} onChange={e => setInstructorSearch(e.target.value)} />
                          </div>
                          {filteredInstructors.map(instr => (
                            <div key={instr.id} className={styles.dropdownItem} onClick={() => { setInstructorId(String(instr.id)); setInstructorMenuOpen(false); }}>
                              <div className={styles.dropdownItemName}>{instr.name}</div>
                              {instr.title && <div className={styles.dropdownItemSub}>{instr.title}</div>}
                            </div>
                          ))}
                          {filteredInstructors.length === 0 && <div className={styles.dropdownEmpty}>لا توجد نتائج</div>}
                        </div>
                      )}
                      <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className={styles.hiddenSelect} required aria-hidden="true">
                        <option value="">اختر المحاضر</option>
                        {sortedInstructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label><FolderOpen size={14} /> <span className={styles.required}>*</span> الدبلومة</label>
                      <select className={styles.select} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                        <option value="">اختر الدبلومة</option>
                        {diplomas.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
              <div className={styles.cardHeader}>
                <Layers size={20} color="#0ea5e9" />
                <h2>أقسام المقرر</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.multiBox}>
                  <div className={styles.multiHeader}>
                    <span className={styles.multiHint}>يمكن ربط المقرر بأكثر من قسم</span>
                    <span className={styles.multiCount}>{selectedSections.length} محدد</span>
                  </div>

                  {selectedSections.length > 0 && (
                    <div className={styles.chips}>
                      {selectedSections.map(s => (
                        <span key={s.id} className={styles.selectedChip}>
                          {s.name}
                          <button type="button" onClick={() => removeSection(s.id)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.chips}>
                    {sections.map(section => {
                      const isSelected = sectionIds.includes(String(section.id));
                      return (
                        <button
                          key={section.id}
                          type="button"
                          className={`${styles.chip} ${isSelected ? styles.chipSelected : ''}`}
                          onClick={() => toggleSection(section.id)}
                        >
                          {section.name}
                        </button>
                      );
                    })}
                    {sections.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>لا توجد أقسام متاحة</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
              <div className={styles.cardHeader}>
                <Clock size={20} color="#0ea5e9" />
                <h2>الإعدادات</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.form}>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label><Clock size={14} /> <span className={styles.required}>*</span> المدة (بالساعات)</label>
                      <input className={styles.input} type="number" min={1} value={duration} onChange={e => setDuration(e.target.value)} required />
                    </div>
                    <div className={styles.field}>
                      <label><Hash size={14} /> الترتيب (اختياري)</label>
                      <input className={styles.input} type="number" min={1} value={rank} onChange={e => setRank(e.target.value)} placeholder="مثال: 1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <ImagePlus size={20} color="#0ea5e9" />
                <h2>صورة الغلاف</h2>
              </div>
              <div className={styles.cardBody}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onCoverChange} className={styles.fileInput} />
                {coverPreview ? (
                  <div>
                    <img src={coverPreview} alt="معاينة الغلاف" className={styles.coverPreview} />
                    <div style={{ marginTop: '0.75rem' }}>
                      <button type="button" className={styles.btnSecondary} onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> تغيير الصورة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                    <div className={styles.uploadIcon}><ImagePlus size={24} /></div>
                    <div className={styles.uploadText}>
                      <strong>اضغط لرفع صورة</strong><br />
                      PNG, JPG حتى 5MB
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Sidebar ─── */}
          <div className={styles.sidebar}>
            {/* Status */}
            <div className={styles.previewCard}>
              <div className={styles.previewTitle}>حالة النشر</div>
              <div className={styles.statusToggle}>
                <button type="button" className={`${styles.statusOption} ${status === 'published' ? styles.statusOptionActive : ''}`} onClick={() => setStatus('published')}>
                  منشور
                </button>
                <button type="button" className={`${styles.statusOption} ${status === 'draft' ? styles.statusOptionActive : ''}`} onClick={() => setStatus('draft')}>
                  مسودة
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className={styles.previewCard}>
              <div className={styles.previewTitle}>ملخص المقرر</div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>العنوان</span>
                <span className={styles.previewValue}>{title || '—'}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>المحاضر</span>
                <span className={styles.previewValue}>{selectedInstructor?.name || '—'}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>الدبلومة</span>
                <span className={styles.previewValue}>{selectedDiploma?.name || '—'}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>المدة</span>
                <span className={styles.previewValue}>{duration ? `${duration} ساعة` : '—'}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>الأقسام</span>
                <span className={styles.previewValue}>{selectedSections.length || '—'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.previewCard}>
              <div className={styles.actions}>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? (
                    <>جاري الحفظ...</>
                  ) : (
                    <><Save size={18} /> حفظ التغييرات</>
                  )}
                </button>
              </div>
              <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={saving} style={{ width: '100%', textAlign: 'center' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </form>

      <Toast message={toastMessage} type={toastType} isVisible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
}
