'use client';

import React, { useState, useEffect } from 'react';
import styles from './Supervisors.module.css';
import apiClient from '@/utils/apiClient';

interface PagePermission {
    page: string;
    key: string;
    description: string;
}

interface Supervisor {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    permissions: string[];
}

export default function SupervisorsPage() {
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [pages, setPages] = useState<PagePermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });
    const [selectedPages, setSelectedPages] = useState<string[]>([]);

    // Edit modal state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPages, setEditPages] = useState<string[]>([]);
    const [showPasswordModal, setShowPasswordModal] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [supervisorsRes, permissionsRes] = await Promise.all([
                apiClient.get('/admin/supervisors'),
                apiClient.get('/admin/supervisors/permissions'),
            ]);
            setSupervisors(supervisorsRes.data.data || []);
            setPages(permissionsRes.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPages.length === 0) {
            setError('يجب اختيار صفحة واحدة على الأقل');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await apiClient.post('/admin/supervisors', {
                ...formData,
                permissions: selectedPages,
            });
            setSuccess('تم إنشاء المشرف بنجاح');
            setFormData({ name: '', email: '', password: '', phone: '' });
            setSelectedPages([]);
            fetchData();
        } catch (err: any) {
            const errors = err.response?.data?.errors;
            if (errors) {
                setError(Object.values(errors).flat().join(', '));
            } else {
                setError(err.response?.data?.message || 'حدث خطأ');
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePageToggle = (pageKey: string, list: string[], setList: (p: string[]) => void) => {
        if (list.includes(pageKey)) {
            setList(list.filter((p) => p !== pageKey));
        } else {
            setList([...list, pageKey]);
        }
    };

    const openEditModal = (supervisor: Supervisor) => {
        setEditingId(supervisor.id);
        setEditPages([...supervisor.permissions]);
    };

    const savePermissions = async () => {
        if (!editingId) return;
        if (editPages.length === 0) {
            setError('يجب اختيار صفحة واحدة على الأقل');
            return;
        }
        try {
            setSaving(true);
            await apiClient.put(`/admin/supervisors/${editingId}/permissions`, {
                permissions: editPages,
            });
            setSuccess('تم تحديث الصلاحيات بنجاح');
            setEditingId(null);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ');
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async () => {
        if (!showPasswordModal || !newPassword) return;
        try {
            setSaving(true);
            await apiClient.put(`/admin/supervisors/${showPasswordModal}/password`, {
                password: newPassword,
            });
            setSuccess('تم تغيير كلمة المرور بنجاح');
            setShowPasswordModal(null);
            setNewPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ');
        } finally {
            setSaving(false);
        }
    };

    const deleteSupervisor = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المشرف؟')) return;
        try {
            await apiClient.delete(`/admin/supervisors/${id}`);
            setSuccess('تم حذف المشرف بنجاح');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ');
        }
    };

    // Get page name from key
    const getPageName = (key: string): string => {
        const page = pages.find(p => p.key === key);
        return page?.page || key;
    };

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>إدارة المشرفين</h1>
                <p className={styles.subtitle}>إضافة وإدارة صلاحيات المشرفين</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {/* Add Supervisor Form */}
            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>إضافة مشرف جديد</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>الاسم *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="اسم المشرف"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>البريد الإلكتروني *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>كلمة المرور *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                placeholder="كلمة المرور"
                                minLength={6}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>رقم الهاتف</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="رقم الهاتف (اختياري)"
                            />
                        </div>
                    </div>

                    <div className={styles.permissionsSection}>
                        <h3>الصفحات المتاحة *</h3>
                        <p className={styles.permHint}>اختر الصفحات التي يمكن للمشرف الوصول إليها</p>
                        <div className={styles.pagesGrid}>
                            {pages.map((page) => (
                                <label key={page.key} className={styles.pageCard}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPages.includes(page.key)}
                                        onChange={() => handlePageToggle(page.key, selectedPages, setSelectedPages)}
                                    />
                                    <div className={styles.pageInfo}>
                                        <span className={styles.pageName}>{page.page}</span>
                                        <span className={styles.pageDesc}>{page.description}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={saving}>
                        {saving ? 'جاري الحفظ...' : 'إضافة المشرف'}
                    </button>
                </form>
            </div>

            {/* Supervisors Table */}
            <div className={styles.tableCard}>
                <h2 className={styles.tableTitle}>المشرفون ({supervisors.length})</h2>
                {supervisors.length === 0 ? (
                    <p className={styles.emptyMsg}>لا يوجد مشرفون حالياً</p>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الاسم</th>
                                    <th>البريد الإلكتروني</th>
                                    <th>الهاتف</th>
                                    <th>الصفحات</th>
                                    <th>تاريخ الإنشاء</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supervisors.map((sup, idx) => (
                                    <tr key={sup.id}>
                                        <td>{idx + 1}</td>
                                        <td>{sup.name}</td>
                                        <td>{sup.email}</td>
                                        <td>{sup.phone || '-'}</td>
                                        <td>
                                            <div className={styles.permBadges}>
                                                {sup.permissions.map(p => (
                                                    <span key={p} className={styles.permBadge}>
                                                        {getPageName(p)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>{new Date(sup.created_at).toLocaleDateString('ar-EG')}</td>
                                        <td className={styles.actions}>
                                            <button className={styles.editBtn} onClick={() => openEditModal(sup)}>
                                                تعديل
                                            </button>
                                            <button className={styles.passBtn} onClick={() => setShowPasswordModal(sup.id)}>
                                                كلمة المرور
                                            </button>
                                            <button className={styles.deleteBtn} onClick={() => deleteSupervisor(sup.id)}>
                                                حذف
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Permissions Modal */}
            {editingId && (
                <div className={styles.modal} onClick={() => setEditingId(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>تعديل الصفحات المتاحة</h3>
                        <div className={styles.pagesGrid}>
                            {pages.map((page) => (
                                <label key={page.key} className={styles.pageCard}>
                                    <input
                                        type="checkbox"
                                        checked={editPages.includes(page.key)}
                                        onChange={() => handlePageToggle(page.key, editPages, setEditPages)}
                                    />
                                    <div className={styles.pageInfo}>
                                        <span className={styles.pageName}>{page.page}</span>
                                        <span className={styles.pageDesc}>{page.description}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.saveBtn} onClick={savePermissions} disabled={saving}>
                                {saving ? 'جاري الحفظ...' : 'حفظ'}
                            </button>
                            <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className={styles.modal} onClick={() => setShowPasswordModal(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>تغيير كلمة المرور</h3>
                        <div className={styles.formGroup}>
                            <label>كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="أدخل كلمة المرور الجديدة"
                                minLength={6}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.saveBtn} onClick={savePassword} disabled={saving || !newPassword}>
                                {saving ? 'جاري الحفظ...' : 'تغيير'}
                            </button>
                            <button className={styles.cancelBtn} onClick={() => setShowPasswordModal(null)}>
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
