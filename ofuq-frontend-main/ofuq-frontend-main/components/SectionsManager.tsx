"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";
import {
  createSection,
  updateSection,
  getAdminSections,
  type Section,
} from "@/utils/sectionService";
import styles from "./SectionsManager.module.css";

type SectionForm = {
  name: string;
  slug: string;
  display_order: string;
  is_published: boolean;
};

type StatusFilter = "all" | "published" | "hidden";

const emptyForm: SectionForm = {
  name: "",
  slug: "",
  display_order: "",
  is_published: true,
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const formatCount = (value?: number) => Number(value ?? 0).toLocaleString("ar-EG");

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export default function SectionsManager({
  isOpen,
  onClose,
  onChanged,
}: {
  isOpen: boolean;
  onClose?: () => void;
  onChanged?: () => void | Promise<void>;
}) {
  const [sections, setSections] = useState<Section[]>([]);
  const [form, setForm] = useState<SectionForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [slugEdited, setSlugEdited] = useState(false);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError(null);
      setSections(await getAdminSections());
    } catch (err) {
      setError(getErrorMessage(err, "فشل في تحميل الأقسام"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadSections();
  }, [isOpen]);

  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => {
      const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB || a.id - b.id;
    });
  }, [sections]);

  const filteredSections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortedSections.filter((section) => {
      const matchesQuery =
        !needle ||
        section.name.toLowerCase().includes(needle) ||
        section.slug.toLowerCase().includes(needle);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && section.is_published) ||
        (statusFilter === "hidden" && !section.is_published);
      return matchesQuery && matchesStatus;
    });
  }, [query, sortedSections, statusFilter]);

  const stats = useMemo(() => ({
    total: sections.length,
    published: sections.filter((section) => section.is_published).length,
    hidden: sections.filter((section) => !section.is_published).length,
  }), [sections]);

  const duplicateSlug = useMemo(() => {
    const slug = form.slug.trim().toLowerCase();
    if (!slug) return false;
    return sections.some((section) => section.id !== editingId && section.slug.toLowerCase() === slug);
  }, [editingId, form.slug, sections]);

  const canSave = form.name.trim().length > 0 && !duplicateSlug && !saving;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSlugEdited(false);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugEdited ? prev.slug : slugify(value),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      is_published: form.is_published,
      display_order: form.display_order.trim() === "" ? undefined : Number(form.display_order),
    };

    try {
      setSaving(true);
      setError(null);
      const saved = editingId
        ? await updateSection(editingId, payload)
        : await createSection(payload);

      setSections((prev) => {
        if (editingId) {
          return prev.map((section) => section.id === saved.id ? saved : section);
        }
        return [...prev, saved];
      });
      resetForm();
      await loadSections();
      await onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, editingId ? "فشل في تعديل القسم" : "فشل في إضافة القسم"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    setSlugEdited(true);
    setForm({
      name: section.name,
      slug: section.slug,
      display_order: section.display_order === null || section.display_order === undefined ? "" : String(section.display_order),
      is_published: section.is_published,
    });
  };

  const toggleVisibility = async (section: Section) => {
    try {
      setTogglingId(section.id);
      setError(null);
      const updated = await updateSection(section.id, { is_published: !section.is_published });
      setSections((prev) => prev.map((item) => item.id === section.id ? { ...item, ...updated } : item));
      await onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, "تعذر تحديث حالة ظهور القسم"));
    } finally {
      setTogglingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="sections-manager-title">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>إدارة محتوى الدبلومات والكورسات</p>
            <h3 id="sections-manager-title" className={styles.title}>إدارة الأقسام</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div><span>الإجمالي</span><strong>{formatCount(stats.total)}</strong></div>
            <div><span>الظاهرة للزوار</span><strong>{formatCount(stats.published)}</strong></div>
            <div><span>المخفية</span><strong>{formatCount(stats.hidden)}</strong></div>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formTitle}>{editingId ? "تعديل قسم" : "إضافة قسم جديد"}</div>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>اسم القسم</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="مثال: التقنية"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>الرابط المختصر</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }));
                  }}
                  placeholder="يُنشأ تلقائيًا من الاسم"
                />
              </label>
              <label className={styles.field}>
                <span>ترتيب الظهور</span>
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(event) => setForm((prev) => ({ ...prev, display_order: event.target.value }))}
                  placeholder="0"
                />
              </label>
              <label className={styles.switchField}>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))}
                />
                <span>{form.is_published ? "ظاهر للزوار" : "مخفي عن الزوار"}</span>
              </label>
            </div>

            {duplicateSlug ? <div className={styles.inlineError}>هذا الرابط المختصر مستخدم بالفعل.</div> : null}

            <div className={styles.formActions}>
              <button className={styles.btnPrimary} type="submit" disabled={!canSave}>
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : "إضافة القسم"}
              </button>
              {editingId ? (
                <button className={styles.btnSecondary} type="button" onClick={resetForm}>
                  <RotateCcw size={16} />
                  إلغاء التعديل
                </button>
              ) : null}
            </div>
          </form>

          {error ? <div className={styles.error}>{error}</div> : null}

          <div className={styles.toolbar}>
            <label className={styles.searchField}>
              <Search size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث باسم القسم أو الرابط"
              />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">كل الأقسام</option>
              <option value="published">الظاهرة فقط</option>
              <option value="hidden">المخفية فقط</option>
            </select>
            <button className={styles.btnSecondary} type="button" onClick={loadSections} disabled={loading}>
              <RotateCcw size={16} />
              تحديث
            </button>
          </div>

          <div className={styles.list}>
            <div className={styles.listHeader}>
              <div>القسم</div>
              <div>الرابط</div>
              <div>الترتيب</div>
              <div>الارتباطات</div>
              <div>الحالة</div>
              <div>إجراءات</div>
            </div>

            {loading ? <div className={styles.empty}>جاري تحميل الأقسام...</div> : null}

            {!loading && filteredSections.map((section) => (
              <div key={section.id} className={styles.listItem}>
                <div className={styles.nameCell}>
                  <strong>{section.name}</strong>
                  <small>#{section.id}</small>
                </div>
                <div className={styles.slugCell}>{section.slug}</div>
                <div>{formatCount(section.display_order ?? 0)}</div>
                <div className={styles.countsCell}>
                  <span>{formatCount(section.courses_count)} كورس</span>
                  <span>{formatCount(section.diplomas_count)} دبلوم</span>
                </div>
                <div>
                  <span className={`${styles.statusBadge} ${section.is_published ? styles.published : styles.hidden}`}>
                    {section.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {section.is_published ? "ظاهر" : "مخفي"}
                  </span>
                </div>
                <div className={styles.editActions}>
                  <button className={styles.btnEdit} type="button" onClick={() => startEdit(section)}>
                    <Pencil size={15} />
                    تعديل
                  </button>
                  <button
                    className={section.is_published ? styles.btnDanger : styles.btnPrimarySoft}
                    type="button"
                    onClick={() => toggleVisibility(section)}
                    disabled={togglingId === section.id}
                  >
                    {section.is_published ? <Archive size={15} /> : <Check size={15} />}
                    {section.is_published ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>
            ))}

            {!loading && filteredSections.length === 0 ? (
              <div className={styles.empty}>لا توجد أقسام مطابقة.</div>
            ) : null}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose} type="button">تم</button>
        </div>
      </div>
    </div>
  );
}
