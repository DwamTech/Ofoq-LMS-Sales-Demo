'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './EnrollmentInfoModal.module.css';
import { getUserProfile, updateUserProfile, EnrollmentProfile } from '../utils/userService';
import { isAuthenticated } from '../utils/authService';
import { FiX, FiUser, FiBriefcase, FiCalendar, FiBook, FiCheck, FiLoader } from 'react-icons/fi';

export interface EnrollmentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (profile: EnrollmentProfile) => void;
}

const qualificationOptions = [
  'بدون',
  'دبلوم',
 'الثانوي',
  'بكالوريوس',
  'ماجستير',
  'دكتوراه',
];

const mediaWorkSectorOptions = [
  'جهة حكومية',
  'جهة خاصة',
  'قطاع غير ربحي',
  'إعلام مستقل',
  'أخرى',
];

const previousFieldOptions = [
  'ادارة مؤسسة',
  'انتاج',
  'إخراج',
  'تصوير',
  'مونتاج',
  'أخرى',
];

function normalizeDateInput(d?: string | null): string {
  if (!d) return '';
  // Expecting YYYY-MM-DD
  const m = /^\d{4}-\d{2}-\d{2}$/.test(d);
  return m ? d : '';
}

export default function EnrollmentInfoModal({ isOpen, onClose, onSubmit }: EnrollmentInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qualification, setQualification] = useState('');
  const [mediaWorkSector, setMediaWorkSector] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [previousField, setPreviousField] = useState('');

  // Fetch current profile when opened
  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      if (!isOpen) return;
      setError(null);
      // If not authenticated, don't block UI; allow manual fill
      if (!isAuthenticated()) {
        return; // leave fields empty
      }
      try {
        setLoading(true);
        const user = await getUserProfile();
        if (cancelled) return;
        setQualification(user.qualification || '');
        setMediaWorkSector(user.media_work_sector || '');
        setDateOfBirth(normalizeDateInput(user.date_of_birth));
        setPreviousField(user.previous_field || '');
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'فشل في جلب بيانات الملف الشخصي');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const canSubmit = useMemo(() => {
    return (
      qualification?.trim().length > 0 &&
      mediaWorkSector?.trim().length > 0 &&
      dateOfBirth?.trim().length > 0 &&
      previousField?.trim().length > 0
    );
  }, [qualification, mediaWorkSector, dateOfBirth, previousField]);

  async function handleSubmit() {
    setError(null);
    if (!canSubmit) {
      setError('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    try {
      setSaving(true);
      const updated = await updateUserProfile({
        qualification,
        media_work_sector: mediaWorkSector,
        date_of_birth: dateOfBirth,
        previous_field: previousField,
      } as any);
      if (onSubmit) onSubmit(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'فشل في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="enrollment-modal-title">
      <div className={styles.modal} dir="rtl">
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconWrapper}>
              <FiUser className={styles.headerIcon} />
            </div>
            <div>
              <h3 id="enrollment-modal-title" className={styles.title}>إكمال معلومات التسجيل</h3>
              <p className={styles.subtitle}>يرجى إكمال المعلومات التالية لإتمام التسجيل في الدبلومة</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="إغلاق">
            <FiX />
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={styles.loadingState}>
              <FiLoader className={styles.loadingIcon} />
              <span>جاري تحميل البيانات...</span>
            </div>
          )}
          
          {error && (
            <div className={styles.errorAlert} role="alert">
              <div className={styles.errorContent}>
                <span className={styles.errorText}>{error}</span>
              </div>
            </div>
          )}

          <div className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="qualification">
                <FiBook className={styles.labelIcon} />
                المؤهل العلمي
                <span className={styles.required}>*</span>
              </label>
              <select
                id="qualification"
                className={styles.select}
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                required
              >
                <option value="" disabled>اختر المؤهل العلمي</option>
                {qualificationOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="mediaWorkSector">
                <FiBriefcase className={styles.labelIcon} />
                قطاع العمل الإعلامي
                <span className={styles.required}>*</span>
              </label>
              <select
                id="mediaWorkSector"
                className={styles.select}
                value={mediaWorkSector}
                onChange={(e) => setMediaWorkSector(e.target.value)}
                required
              >
                <option value="" disabled>اختر قطاع العمل</option>
                {mediaWorkSectorOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="dateOfBirth">
                <FiCalendar className={styles.labelIcon} />
                تاريخ الميلاد
                <span className={styles.required}>*</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                className={styles.input}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="previousField">
                <FiUser className={styles.labelIcon} />
                المجال السابق
                <span className={styles.required}>*</span>
              </label>
              <select
                id="previousField"
                className={styles.select}
                value={previousField}
                onChange={(e) => setPreviousField(e.target.value)}
                required
              >
                <option value="" disabled>اختر المجال السابق</option>
                {previousFieldOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={saving}>
            إلغاء
          </button>
          <button className={styles.primaryBtn} onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving ? (
              <>
                <FiLoader className={styles.buttonIcon} />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <FiCheck className={styles.buttonIcon} />
                إتمام التسجيل
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}