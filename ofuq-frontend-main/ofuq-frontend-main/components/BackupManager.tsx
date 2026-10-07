'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDatabase, FaDownload, FaRedo, FaTrash, FaPlus, FaUpload, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';
import styles from './BackupManager.module.css';
import Toast from './Toast';
import { isDemoMode } from '@/utils/demoMode';

interface Backup {
    path: string;
    date: string;
    size: string;
    size_bytes: number;
    exists: boolean;
    filename?: string;
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
    file_size?: string;
    sql_size?: string;
}

export default function BackupManager() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Meta from API
    const [diskName, setDiskName] = useState<string>('');
    const [totalBackups, setTotalBackups] = useState<number>(0);

    // Toast state
    const [toastMessage, setToastMessage] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');
    const [backupPendingDeletion, setBackupPendingDeletion] = useState<Backup | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    // Load backups
    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/admin/backups`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setBackups(response.data.backups);
                setDiskName(response.data.disk || '');
                setTotalBackups(response.data.total_backups || response.data.backups?.length || 0);
            } else {
                showToast('فشل تحميل النسخ الاحتياطية', 'error');
            }
        } catch (error: any) {
            console.error('Error loading backups:', error);
            showToast(error.response?.data?.message || 'فشل تحميل النسخ الاحتياطية', 'error');
        } finally {
            setLoading(false);
        }
    };

    const uploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isDemoMode) return;
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.zip')) {
            showToast('يجب أن يكون الملف بصيغة ZIP', 'error');
            return;
        }

        // Validate file size (max 500MB)
        if (file.size > 500 * 1024 * 1024) {
            showToast('حجم الملف يجب أن لا يتجاوز 500 ميجابايت', 'error');
            return;
        }

        try {
            setUploading(true);
            setValidationErrors([]);
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('backup_file', file);

            const response = await axios.post(
                `${API_URL}/admin/backups/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.success) {
                const validation = response.data.validation;
                const sizeInfo = validation
                    ? ` (حجم الملف: ${validation.file_size}، حجم SQL: ${validation.sql_size})`
                    : '';
                showToast(`تم رفع النسخة الاحتياطية بنجاح وتم التحقق من صحتها${sizeInfo}`, 'success');
                await loadBackups();
            } else {
                showToast('فشل رفع النسخة الاحتياطية', 'error');
            }
        } catch (error: any) {
            console.error('Error uploading backup:', error);

            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.validation_errors) {
                setValidationErrors(error.response.data.validation_errors);
                showToast('فشل التحقق من صحة النسخة الاحتياطية - الملف قد يكون تالفاً', 'error');
            } else {
                showToast(error.response?.data?.message || 'فشل رفع النسخة الاحتياطية', 'error');
            }
        } finally {
            setUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };


    const createBackup = async () => {
        if (isDemoMode) return;
        try {
            setCreating(true);
            const token = localStorage.getItem('auth_token');
            const response = await axios.post(
                `${API_URL}/admin/backups/create`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                showToast('تم إنشاء النسخة الاحتياطية بنجاح!', 'success');
                await loadBackups();
            } else {
                showToast('فشل إنشاء النسخة الاحتياطية', 'error');
            }
        } catch (error: any) {
            console.error('Error creating backup:', error);
            showToast(error.response?.data?.message || 'فشل إنشاء النسخة الاحتياطية', 'error');
        } finally {
            setCreating(false);
        }
    };

    const downloadBackup = async (backup: Backup) => {
        try {
            const token = localStorage.getItem('auth_token');
            // Use filename directly if available, otherwise extract from path (cross-platform)
            const filename = backup.filename || backup.path.split(/[/\\]/).pop();

            const response = await axios.get(
                `${API_URL}/admin/backups/${encodeURIComponent(filename!)}/download`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename || 'backup.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();

            showToast('تم تحميل النسخة الاحتياطية بنجاح', 'success');
        } catch (error: any) {
            console.error('Error downloading backup:', error);
            showToast('فشل التحميل', 'error');
        }
    };

    const deleteBackup = (backup: Backup) => {
        if (isDemoMode) return;
        setBackupPendingDeletion(backup);
        setToastMessage(`هل أنت متأكد من حذف النسخة الاحتياطية: ${backup.date}؟`);
        setToastType('confirm');
        setToastVisible(true);
    };

    const confirmDelete = async () => {
        if (isDemoMode) return;
        if (!backupPendingDeletion) return;
        try {
            const token = localStorage.getItem('auth_token');
            // Use filename directly if available, otherwise extract from path (cross-platform)
            const filename = backupPendingDeletion.filename || backupPendingDeletion.path.split(/[/\\]/).pop();

            const response = await axios.delete(`${API_URL}/admin/backups/${encodeURIComponent(filename!)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                showToast('تم حذف النسخة الاحتياطية بنجاح', 'success');
                await loadBackups();
            }
        } catch (error: any) {
            console.error('Error deleting backup:', error);
            showToast('فشل الحذف', 'error');
        } finally {
            setBackupPendingDeletion(null);
            setToastVisible(false);
        }
    };

    const cancelDelete = () => {
        setBackupPendingDeletion(null);
        setToastVisible(false);
    };

    const openRestoreModal = (backup: Backup) => {
        if (isDemoMode) return;
        setSelectedBackup(backup);
        setShowRestoreModal(true);
        setConfirmationCode('');
        setRestoreError(null);
        setValidationErrors([]);
    };

    const restoreBackup = async () => {
        if (isDemoMode) return;
        if (confirmationCode !== 'RESTORE-CONFIRM') {
            showToast('الرجاء كتابة RESTORE-CONFIRM للمتابعة', 'error');
            return;
        }

        if (!selectedBackup) return;

        try {
            setRestoring(selectedBackup.path);
            setRestoreError(null);
            setValidationErrors([]);
            const token = localStorage.getItem('auth_token');
            // Use filename directly if available, otherwise extract from path (cross-platform)
            const filename = selectedBackup.filename || selectedBackup.path.split(/[/\\]/).pop();

            const response = await axios.post(
                `${API_URL}/admin/backups/restore`,
                {
                    confirmation_code: confirmationCode,
                    filename: filename
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                const preRestoreMsg = response.data.pre_restore_backup
                    ? ' (تم إنشاء نسخة احتياطية تلقائية من الحالة السابقة)'
                    : '';
                showToast(`تم استرجاع قاعدة البيانات بنجاح!${preRestoreMsg} يرجى تحديث الصفحة.`, 'success');
                setShowRestoreModal(false);
                await loadBackups();
            }
        } catch (error: any) {
            console.error('Error restoring backup:', error);

            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.validation_errors) {
                setValidationErrors(error.response.data.validation_errors);
                setRestoreError('فشل التحقق من صحة النسخة الاحتياطية');
            } else {
                const errMsg = error.response?.data?.message || 'فشل الاسترجاع';
                const errDetails = error.response?.data?.error_output;
                const preRestoreError = error.response?.data?.pre_restore_error;
                const passwordProvided = error.response?.data?.password_provided;
                const preRestoreBackup = error.response?.data?.pre_restore_backup;

                const composed = [
                    errMsg,
                    preRestoreBackup ? '✓ تم إنشاء نسخة احتياطية من الحالة السابقة قبل محاولة الاسترجاع' : null,
                    preRestoreError ? `خطأ في النسخ الاحتياطي المسبق: ${preRestoreError}` : null,
                    typeof passwordProvided !== 'undefined' ? `كلمة المرور مُمرَّرة: ${passwordProvided ? 'نعم' : 'لا'}` : null,
                    errDetails ? `تفاصيل الخطأ:\n${String(errDetails).slice(0, 1500)}` : null,
                ].filter(Boolean).join('\n\n');
                setRestoreError(composed);
            }
            showToast(error.response?.data?.message || 'فشل الاسترجاع', 'error');
        } finally {
            setRestoring(null);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
        if (type !== 'error' && type !== 'confirm') {
            setTimeout(() => setToastVisible(false), 3000);
        }
    };

    const getFilename = (path: string) => {
        // Cross-platform path splitting
        return path.split(/[/\\]/).pop() || path;
    };

    return (
        <div className={styles.backupManager}>
            <div className={styles.header}>
                <div>
                    <h2><FaDatabase style={{ marginLeft: '8px', verticalAlign: 'middle' }} />النسخ الاحتياطية للبيانات</h2>
                    <p>يتم إنشاء نسخة احتياطية تلقائياً كل 3 أيام الساعة 2:00 صباحاً</p>
                    <div className={styles.meta}>
                        {diskName && <span className={styles.metaItem}>الديسك: {diskName}</span>}
                        <span className={styles.metaItem}>عدد النسخ: {totalBackups}</span>
                        <span className={styles.metaItem} style={{ background: '#c6f6d5', color: '#22543d' }}>
                            <FaShieldAlt style={{ marginLeft: '4px' }} />
                            نسخة تلقائية قبل الاسترجاع
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <label className={styles.uploadButton} style={{ opacity: uploading || isDemoMode ? 0.6 : 1 }} title={isDemoMode ? 'غير متاح في النسخة التجريبية' : undefined}>
                        <FaUpload style={{ marginLeft: '6px' }} />
                        {uploading ? 'جاري الرفع...' : 'رفع نسخة'}
                        <input
                            type="file"
                            accept=".zip"
                            onChange={uploadBackup}
                            disabled={uploading || isDemoMode}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <button onClick={createBackup} disabled={creating || isDemoMode} title={isDemoMode ? 'غير متاح في النسخة التجريبية' : undefined} className={styles.createButton}>
                        <FaPlus style={{ marginLeft: '6px' }} />
                        {creating ? 'جاري إنشاء النسخة...' : 'إنشاء نسخة احتياطية'}
                    </button>
                </div>
            </div>

            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
                <div className={styles.validationErrors}>
                    <div className={styles.errorHeader}>
                        <FaExclamationTriangle style={{ marginLeft: '8px' }} />
                        فشل التحقق من صحة الملف:
                    </div>
                    <ul>
                        {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                    <button
                        className={styles.dismissButton}
                        onClick={() => setValidationErrors([])}
                    >
                        إغلاق
                    </button>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>جاري تحميل النسخ الاحتياطية...</div>
            ) : backups.length === 0 ? (
                <div className={styles.empty}>
                    <p>لا توجد نسخ احتياطية. قم بإنشاء أول نسخة احتياطية!</p>
                </div>
            ) : (
                <table className={styles.backupTable}>
                    <thead>
                        <tr>
                            <th>تاريخ الإنشاء</th>
                            <th>الحجم</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.map((backup, index) => (
                            <tr key={index}>
                                <td>
                                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{backup.date}</div>
                                    <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                                        {getFilename(backup.path)}
                                    </div>
                                </td>
                                <td>{backup.size}</td>
                                <td>
                                    <span className={backup.exists ? styles.statusActive : styles.statusInactive}>
                                        {backup.exists ? (
                                            <><FaCheckCircle style={{ marginLeft: '4px' }} />متوفرة</>
                                        ) : (
                                            <><FaTimesCircle style={{ marginLeft: '4px' }} />مفقودة</>
                                        )}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => downloadBackup(backup)}
                                            className={styles.downloadButton}
                                            disabled={!backup.exists}
                                            title="تحميل"
                                        >
                                            <FaDownload style={{ marginLeft: '6px' }} />تحميل
                                        </button>
                                        <button
                                            onClick={() => openRestoreModal(backup)}
                                            className={styles.restoreButton}
                                            disabled={!!restoring || isDemoMode}
                                            title="استرجاع"
                                        >
                                            <FaRedo style={{ marginLeft: '6px' }} />استرجاع
                                        </button>
                                        <button
                                            onClick={() => deleteBackup(backup)}
                                            className={styles.deleteButton}
                                            disabled={isDemoMode}
                                            title={isDemoMode ? 'غير متاح في النسخة التجريبية' : 'حذف'}
                                            title="حذف"
                                        >
                                            <FaTrash style={{ marginLeft: '6px' }} />حذف
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Restore Confirmation Modal */}
            {showRestoreModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3><FaExclamationTriangle style={{ marginLeft: '8px', color: '#e53e3e' }} />استرجاع النسخة الاحتياطية</h3>
                        <p className={styles.warning}>
                            <strong>تحذير:</strong> هذا الإجراء سيستبدل جميع البيانات الحالية ببيانات النسخة الاحتياطية.
                        </p>
                        <p className={styles.safetyNote}>
                            <FaShieldAlt style={{ marginLeft: '6px', color: '#38a169' }} />
                            <strong>أمان:</strong> سيتم إنشاء نسخة احتياطية تلقائية من الحالة الحالية قبل الاسترجاع.
                        </p>
                        <p>
                            تاريخ النسخة: <strong>{selectedBackup?.date}</strong>
                        </p>
                        <p>
                            الحجم: <strong>{selectedBackup?.size}</strong>
                        </p>

                        <div className={styles.confirmationInput}>
                            <label>
                                اكتب <code>RESTORE-CONFIRM</code> للمتابعة:
                            </label>
                            <input
                                type="text"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                placeholder="RESTORE-CONFIRM"
                            />
                        </div>

                        {/* Validation Errors in Modal */}
                        {validationErrors.length > 0 && (
                            <div className={styles.errorDetails}>
                                <div className={styles.errorHeader}>فشل التحقق من صحة النسخة الاحتياطية:</div>
                                <ul style={{ margin: '8px 0', paddingRight: '20px' }}>
                                    {validationErrors.map((error, index) => (
                                        <li key={index} style={{ color: '#742a2a', marginBottom: '4px' }}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {restoreError && (
                            <div className={styles.errorDetails}>
                                <div className={styles.errorHeader}>فشل الاسترجاع</div>
                                <pre>{restoreError}</pre>
                                <button
                                    className={styles.copyButton}
                                    onClick={() => {
                                        if (restoreError) {
                                            navigator.clipboard.writeText(restoreError).then(() => {
                                                showToast('تم نسخ تفاصيل الخطأ', 'success');
                                            });
                                        }
                                    }}
                                >
                                    نسخ تفاصيل الخطأ
                                </button>
                            </div>
                        )}

                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setShowRestoreModal(false)}
                                className={styles.cancelButton}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={restoreBackup}
                                disabled={confirmationCode !== 'RESTORE-CONFIRM' || !!restoring}
                                className={styles.confirmButton}
                            >
                                {restoring ? 'جاري الاسترجاع...' : 'استرجاع البيانات'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <Toast
                message={toastMessage}
                type={toastType}
                isVisible={toastVisible}
                onClose={() => setToastVisible(false)}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
}

