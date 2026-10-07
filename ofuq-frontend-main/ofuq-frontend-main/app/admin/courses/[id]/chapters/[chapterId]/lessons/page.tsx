"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Toast from "@/components/Toast";
import styles from "./AdminLessons.module.css";
import "@/styles/toast.css";
import { getChapterLessons, deleteLesson, createLesson, updateLesson, toggleLessonVisibility, type Lesson } from "@/utils/lessonService";
import { initBunnyUpload } from "@/utils/bunnyUploadService";
import { useUpload } from "@/contexts/UploadContext";

export default function AdminLessonsPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const chapterId = params.chapterId as string;
    const { addUpload } = useUpload();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info" | "confirm">("info");
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [pendingDeleteLessonId, setPendingDeleteLessonId] = useState<number | null>(null);
    const [isDeletingLessonId, setIsDeletingLessonId] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [videoTab, setVideoTab] = useState<"upload" | "url">("upload");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        order: 1,
        video_url: "",
        video_guid: "",
        is_visible: true
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await getChapterLessons(chapterId);
            setLessons(list);
        } catch (err: any) {
            setError(err?.message || "فشل في جلب الدروس");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [chapterId]);

    const confirmDeleteLesson = (lessonId: number) => {
        setPendingDeleteLessonId(lessonId);
        setToastMessage("هل أنت متأكد من حذف هذا الدرس؟");
        setToastType("confirm");
        setToastVisible(true);
    };

    const performDeleteLesson = async () => {
        if (!pendingDeleteLessonId) return;
        const lessonId = pendingDeleteLessonId;
        try {
            setIsDeletingLessonId(lessonId);
            await deleteLesson(lessonId);
            setLessons((prev) => prev.filter((l) => Number(l.id) !== Number(lessonId)));
            setToastType("success");
            setToastMessage("تم حذف الدرس بنجاح");
            setToastVisible(true);
        } catch (err: any) {
            setToastType("error");
            setToastMessage(err?.message || "فشل في حذف الدرس");
            setToastVisible(true);
        } finally {
            setIsDeletingLessonId(null);
            setPendingDeleteLessonId(null);
        }
    };

    const handleCreate = () => {
        setModalMode("create");
        setFormData({
            title: "",
            content: "",
            order: lessons.length + 1,
            video_url: "",
            video_guid: "",
            is_visible: true
        });
        setVideoFile(null);
        setVideoTab("upload");
        setShowModal(true);
    };

    const handleEdit = (lesson: Lesson) => {
        setModalMode("edit");
        setEditingLesson(lesson);
        setFormData({
            title: lesson.title,
            content: lesson.content || "",
            order: lesson.order,
            video_url: lesson.video_url || "",
            video_guid: lesson.video_guid || "",
            is_visible: lesson.is_visible
        });
        setVideoFile(null);
        setVideoTab(lesson.video_guid ? "upload" : "url");
        setShowModal(true);
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const saveLessonData = async (guid: string, url: string) => {
        const payload = { ...formData, video_guid: guid, video_url: url };
        
        if (modalMode === "create") {
            const newLesson = await createLesson(chapterId, payload);
            setLessons((prev) => [...prev, newLesson]);
        } else if (editingLesson) {
            const updatedLesson = await updateLesson(editingLesson.id, payload);
            setLessons((prev) => prev.map((l) => l.id === updatedLesson.id ? updatedLesson : l));
        }
        setShowModal(false);
        setEditingLesson(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (videoTab === "upload" && videoFile) {
                setToastMessage("جاري تهيئة الرفع...");
                setToastType("info");
                setToastVisible(true);
                const initData = await initBunnyUpload(courseId, formData.title || "Lesson Video");
                
                // Immediately save the DB lesson using the returned guid First
                await saveLessonData(initData.videoGuid, "");
                
                // Add to global background manager only if save succeeds
                addUpload(videoFile, initData, formData.title || "Lesson Video");
                
                setToastMessage("تم حفظ الدرس وبدء الرفع في الخلفية. يمكنك متابعة العمل.");
                setToastType("success");
                setToastVisible(true);
            } else {
                let currentGuid = videoTab === "upload" ? formData.video_guid : "";
                let currentUrl = videoTab === "url" ? formData.video_url : "";
                await saveLessonData(currentGuid, currentUrl);
                setToastMessage("تم حفظ الدرس بنجاح");
                setToastType("success");
                setToastVisible(true);
            }
        } catch (err: any) {
            setToastType("error");
            setToastMessage(err?.message || "فشل في حفظ الدرس");
            setToastVisible(true);
        }
    };

    const handleToggleVisibility = async (lessonId: number) => {
        try {
            const updatedLesson = await toggleLessonVisibility(lessonId);
            setLessons((prev) => prev.map((l) => l.id === updatedLesson.id ? updatedLesson : l));
            setToastType("success");
            setToastMessage("تم تحديث حالة الظهور بنجاح");
            setToastVisible(true);
        } catch (err: any) {
            setToastType("error");
            setToastMessage(err?.message || "فشل في تحديث حالة الظهور");
            setToastVisible(true);
        }
    };

    const filteredLessons = lessons.filter((lesson) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            lesson.title?.toLowerCase().includes(query) ||
            lesson.content?.toLowerCase?.().includes(query)
        );
    });

    return (
        <div className={styles["admin-lessons-container"]}>
            <div className={styles["admin-lessons-header"]}>
                <div>
                    <h1 className={styles["admin-lessons-title"]}>إدارة الدروس</h1>
                    <p className={styles["admin-lessons-subtitle"]}>إدارة وتنظيم دروس الفصل</p>
                </div>
                <button
                    className={styles["btn-back"]}
                    onClick={() => router.push(`/admin/courses/${courseId}/chapters`)}
                >
                    ← رجوع
                </button>
            </div>

            <div className={styles["admin-lessons-actions"]}>
                <button
                    className={styles["btn-primary"]}
                    onClick={handleCreate}
                >
                    + إضافة درس جديد
                </button>
            </div>

            {/* Search Bar */}
            <div className={styles["searchContainer"]}>
                <input
                    type="text"
                    placeholder="بحث عن درس..."
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
                    <div className={styles["spinner"]}></div>
                </div>
            )}

            {error && (
                <div className={`${styles["message"]} ${styles["message-error"]}`}>
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className={styles["lessons-table-container"]} dir="rtl">
                    <table className={styles["lessons-table"]}>
                        <thead>
                            <tr>
                                <th>العنوان</th>
                                <th>الترتيب</th>
                                <th>حالة الظهور</th>
                                <th>عدد المشاهدات</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLessons.map((lesson) => (
                                <tr key={String(lesson.id)}>
                                    <td>{lesson.title}</td>
                                    <td>{lesson.order}</td>
                                    <td>
                                        <span className={lesson.is_visible ? styles["badge-visible"] : styles["badge-hidden"]}>
                                            {lesson.is_visible ? "ظاهر" : "مخفي"}
                                        </span>
                                        {lesson.video_status && lesson.video_status !== 'ready' && (
                                            <span style={{ fontSize: '0.75rem', marginRight: '5px', color: '#eab308' }}>
                                              ({lesson.video_status === 'processing' ? 'قيد المعالجة' : 'فشل'})
                                            </span>
                                        )}
                                    </td>
                                    <td>{lesson.views || 0}</td>
                                    <td className={styles["actionsCell"]}>
                                        <button
                                            className={styles["btnAction"]}
                                            onClick={() => handleToggleVisibility(Number(lesson.id))}
                                        >
                                            {lesson.is_visible ? "إخفاء" : "إظهار"}
                                        </button>
                                        <button
                                            className={styles["btnAction"]}
                                            onClick={() => handleEdit(lesson)}
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            className={`${styles["btnAction"]} ${styles["btnDelete"]}`}
                                            onClick={() => confirmDeleteLesson(Number(lesson.id))}
                                            disabled={isDeletingLessonId === Number(lesson.id)}
                                        >
                                            {isDeletingLessonId === Number(lesson.id) ? "جاري الحذف..." : "حذف"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredLessons.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className={styles["empty-state"]}>
                                            <div className={styles["empty-state-icon"]}>📚</div>
                                            <div className={styles["empty-state-title"]}>لا توجد دروس</div>
                                            <div className={styles["empty-state-description"]}>لم يتم إنشاء أي دروس بعد. ابدأ بإنشاء درس جديد.</div>
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
                            <h2>{modalMode === "create" ? "إضافة درس جديد" : "تعديل الدرس"}</h2>
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
                                <label htmlFor="content">المحتوى</label>
                                <textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className={styles["form-textarea"]}
                                    rows={4}
                                />
                            </div>
                            <div className={styles["form-group"]}>
                                <label>الفيديو</label>
                                <div className={styles.tabs}>
                                    <div 
                                        className={`${styles.tab} ${videoTab === "upload" ? styles.active : ""}`} 
                                        onClick={() => setVideoTab("upload")}
                                    >
                                        رفع مباشر
                                    </div>
                                    <div 
                                        className={`${styles.tab} ${videoTab === "url" ? styles.active : ""}`} 
                                        onClick={() => setVideoTab("url")}
                                    >
                                        رابط مخصص (HLS/يوتيوب)
                                    </div>
                                </div>

                                {videoTab === "upload" && (
                                    <>
                                        <div className={styles.uploadArea}>
                                            <input 
                                                type="file" 
                                                accept="video/mp4,video/x-m4v,video/*,.mkv" 
                                                id="video_upload" 
                                                onChange={handleVideoFileChange}
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="video_upload" style={{ cursor: 'pointer', display: 'block' }}>
                                                {videoFile ? `تم اختيار: ${videoFile.name}` : formData.video_guid ? "يوجد فيديو مرفوع بالفعل. اختر واحداً جديداً للاستبدال." : "اضغط هنا لاختيار فيديو أو قم بسحبه"}
                                            </label>
                                        </div>
                                    </>
                                )}

                                {videoTab === "url" && (
                                    <input
                                        type="url"
                                        value={formData.video_url}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                        className={styles["form-input"]}
                                        placeholder="https://..."
                                    />
                                )}
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
                            <div className={styles["form-group"]}>
                                <label className={styles["checkbox-label"]}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_visible}
                                        onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                                    />
                                    <span>ظاهر للطلاب</span>
                                </label>
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
                onConfirm={toastType === "confirm" ? performDeleteLesson : undefined}
                onCancel={toastType === "confirm" ? () => { setToastVisible(false); setPendingDeleteLessonId(null); } : undefined}
                duration={4000}
            />
        </div>
    );
}
