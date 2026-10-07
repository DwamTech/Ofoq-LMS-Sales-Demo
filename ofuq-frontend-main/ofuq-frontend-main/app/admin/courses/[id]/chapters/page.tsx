"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Toast from "@/components/Toast";
import styles from "./AdminChapters.module.css";
import "@/styles/toast.css";
import { getCourseChapters, deleteChapter, createChapter, updateChapter, type Chapter } from "@/utils/chapterService";

export default function AdminChaptersPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info" | "confirm">("info");
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [pendingDeleteChapterId, setPendingDeleteChapterId] = useState<number | null>(null);
    const [isDeletingChapterId, setIsDeletingChapterId] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        order: 1
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await getCourseChapters(courseId);
            setChapters(list);
        } catch (err: any) {
            setError(err?.message || "فشل في جلب الفصول");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const confirmDeleteChapter = (chapterId: number) => {
        setPendingDeleteChapterId(chapterId);
        setToastMessage("هل أنت متأكد من حذف هذا الفصل؟");
        setToastType("confirm");
        setToastVisible(true);
    };

    const performDeleteChapter = async () => {
        if (!pendingDeleteChapterId) return;
        const chapterId = pendingDeleteChapterId;
        try {
            setIsDeletingChapterId(chapterId);
            await deleteChapter(chapterId);
            setChapters((prev) => prev.filter((c) => Number(c.id) !== Number(chapterId)));
            setToastType("success");
            setToastMessage("تم حذف الفصل بنجاح");
            setToastVisible(true);
        } catch (err: any) {
            setToastType("error");
            setToastMessage(err?.message || "فشل في حذف الفصل");
            setToastVisible(true);
        } finally {
            setIsDeletingChapterId(null);
            setPendingDeleteChapterId(null);
        }
    };

    const handleCreate = () => {
        setModalMode("create");
        setFormData({
            title: "",
            description: "",
            order: chapters.length + 1
        });
        setShowModal(true);
    };

    const handleEdit = (chapter: Chapter) => {
        setModalMode("edit");
        setEditingChapter(chapter);
        setFormData({
            title: chapter.title,
            description: chapter.description || "",
            order: chapter.order
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === "create") {
                const newChapter = await createChapter(courseId, formData);
                setChapters((prev) => [...prev, newChapter]);
                setToastType("success");
                setToastMessage("تم إضافة الفصل بنجاح");
            } else if (editingChapter) {
                const updatedChapter = await updateChapter(editingChapter.id, formData);
                setChapters((prev) => prev.map((c) => c.id === updatedChapter.id ? updatedChapter : c));
                setToastType("success");
                setToastMessage("تم تعديل الفصل بنجاح");
            }
            setToastVisible(true);
            setShowModal(false);
            setEditingChapter(null);
        } catch (err: any) {
            setToastType("error");
            setToastMessage(err?.message || "فشل في حفظ الفصل");
            setToastVisible(true);
        }
    };

    const filteredChapters = chapters.filter((chapter) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            chapter.title?.toLowerCase().includes(query) ||
            chapter.description?.toLowerCase?.().includes(query)
        );
    });

    return (
        <div className={styles["admin-chapters-container"]}>
            <div className={styles["admin-chapters-header"]}>
                <div>
                    <h1 className={styles["admin-chapters-title"]}>إدارة الفصول</h1>
                    <p className={styles["admin-chapters-subtitle"]}>إدارة وتنظيم فصول الكورس</p>
                </div>
                <button
                    className={styles["btn-back"]}
                    onClick={() => router.push("/admin/course-management")}
                >
                    ← رجوع
                </button>
            </div>

            <div className={styles["admin-chapters-actions"]}>
                <button
                    className={styles["btn-primary"]}
                    onClick={handleCreate}
                >
                    + إضافة فصل جديد
                </button>
            </div>

            {/* Search Bar */}
            <div className={styles["searchContainer"]}>
                <div className={styles["searchIcon"]}>🔍</div>
                <input
                    type="text"
                    placeholder="بحث عن فصل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles["searchInput"]}
                />
                {searchQuery && (
                    <button
                        className={styles["clearSearch"]}
                        onClick={() => setSearchQuery('')}
                        aria-label="مسح البحث"
                    >
                        ×
                    </button>
                )}
            </div>

            {loading && (
                <div className={styles["loading"]}>
                    <div>
                        <div className={styles["spinner"]}></div>
                        <div className={styles["loading-text"]}>جاري تحميل الفصول...</div>
                    </div>
                </div>
            )}

            {error && (
                <div className={`${styles["message"]} ${styles["message-error"]}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <div>
                            <strong>خطأ في التحميل:</strong>
                            <div style={{ marginTop: '5px' }}>{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div className={styles["chapters-table-container"]} dir="rtl">
                    <table className={styles["chapters-table"]}>
                        <thead>
                            <tr>
                                <th className={styles["chapter-title-cell"]}>العنوان</th>
                                <th className={styles["chapter-description-cell"]}>الوصف</th>
                                <th className={styles["chapter-order-cell"]}>الترتيب</th>
                                <th className={styles["chapter-lessons-count-cell"]}>عدد الدروس</th>
                                <th className={styles["actionsCell"]}>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredChapters.map((chapter) => (
                                <tr key={String(chapter.id)}>
                                    <td>
                                        <div className={styles["chapter-title"]}>
                                            {chapter.title}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles["chapter-description"]}>
                                            {chapter.description || "—"}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles["chapter-order"]}>
                                            {chapter.order}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles["chapter-lessons-count"]}>
                                            {chapter.lessons_count || 0}
                                        </span>
                                    </td>
                                    <td className={styles["actionsCell"]}>
                                        <div className={styles["table-actions"]}>
                                            <button
                                                className={`${styles["btn-small"]} ${styles["btn-lessons"]}`}
                                                onClick={() => router.push(`/admin/courses/${courseId}/chapters/${chapter.id}/lessons`)}
                                            >
                                                إدارة الدروس
                                            </button>
                                            <button
                                                className={`${styles["btn-small"]} ${styles["btn-edit"]}`}
                                                onClick={() => handleEdit(chapter)}
                                            >
                                                تعديل
                                            </button>
                                            <button
                                                className={`${styles["btn-small"]} ${styles["btn-delete"]}`}
                                                onClick={() => confirmDeleteChapter(Number(chapter.id))}
                                                disabled={isDeletingChapterId === Number(chapter.id)}
                                            >
                                                {isDeletingChapterId === Number(chapter.id) ? "جاري الحذف..." : "حذف"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredChapters.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className={styles["empty-state"]}>
                                            <div className={styles["empty-state-icon"]}>📖</div>
                                            <div className={styles["empty-state-title"]}>لا توجد فصول</div>
                                            <div className={styles["empty-state-description"]}>لم يتم إنشاء أي فصول بعد. ابدأ بإنشاء فصل جديد.</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className={styles["modal-overlay"]} onClick={() => setShowModal(false)}>
                    <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
                        <div className={styles["modal-header"]}>
                            <h2>{modalMode === "create" ? "إضافة فصل جديد" : "تعديل الفصل"}</h2>
                            <button className={styles["modal-close"]} onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles["form-group"]}>
                                <label htmlFor="title">العنوان *</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className={styles["form-input"]}
                                />
                            </div>
                            <div className={styles["form-group"]}>
                                <label htmlFor="description">الوصف</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className={styles["form-textarea"]}
                                    rows={4}
                                />
                            </div>
                            <div className={styles["form-group"]}>
                                <label htmlFor="order">الترتيب *</label>
                                <input
                                    type="number"
                                    id="order"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                                    required
                                    min="1"
                                    className={styles["form-input"]}
                                />
                            </div>
                            <div className={styles["modal-actions"]}>
                                <button type="button" className={styles["btn-secondary"]} onClick={() => setShowModal(false)}>
                                    إلغاء
                                </button>
                                <button type="submit" className={styles["btn-primary"]}>
                                    {modalMode === "create" ? "إضافة" : "حفظ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Toast
                message={toastMessage}
                type={toastType}
                isVisible={toastVisible}
                onClose={() => setToastVisible(false)}
                onConfirm={toastType === "confirm" ? performDeleteChapter : undefined}
                onCancel={toastType === "confirm" ? () => { setToastVisible(false); setPendingDeleteChapterId(null); } : undefined}
                duration={4000}
            />
        </div>
    );
}
