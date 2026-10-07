'use client';

import type { ReactNode } from 'react';
import AdminButton from './AdminButton';
import styles from './admin.module.css';

type AdminStateType =
  | 'loading'
  | 'error'
  | 'empty'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'network'
  | 'server'
  | 'validation'
  | 'unknown';

interface AdminStateProps {
  type: AdminStateType;
  title?: string;
  message?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const stateDefaults: Record<AdminStateType, { title: string; message: string }> = {
  loading: {
    title: 'جاري التحميل',
    message: 'يتم تجهيز البيانات الآن.',
  },
  error: {
    title: 'تعذر تحميل البيانات',
    message: 'حدث خطأ أثناء تحميل البيانات. حاول مرة أخرى.',
  },
  empty: {
    title: 'لا توجد بيانات',
    message: 'لا توجد عناصر قابلة للعرض حاليًا.',
  },
  unauthorized: {
    title: 'تحتاج إلى تسجيل الدخول',
    message: 'يرجى تسجيل الدخول للمتابعة.',
  },
  forbidden: {
    title: 'غير مصرح',
    message: 'لا تملك صلاحية الوصول إلى هذه الصفحة.',
  },
  notFound: {
    title: 'غير موجود',
    message: 'العنصر المطلوب غير موجود أو لم يعد متاحًا.',
  },
  network: {
    title: 'مشكلة في الاتصال',
    message: 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مجددًا.',
  },
  server: {
    title: 'خطأ في الخادم',
    message: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقًا.',
  },
  validation: {
    title: 'بيانات غير صحيحة',
    message: 'بعض البيانات المدخلة غير صحيحة.',
  },
  unknown: {
    title: 'حدث خطأ غير متوقع',
    message: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
  },
};

export default function AdminState({
  type,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}: AdminStateProps) {
  const defaults = stateDefaults[type];
  const isLoading = type === 'loading';

  return (
    <div className={`${styles.state} ${styles[`state-${type}`]} ${className}`.trim()} role="status">
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <div className={styles.stateContent}>
        <h2>{title ?? defaults.title}</h2>
        <p>{message ?? defaults.message}</p>
      </div>
      {onAction ? (
        <AdminButton variant="secondary" onClick={onAction}>
          {actionLabel ?? 'إعادة المحاولة'}
        </AdminButton>
      ) : null}
    </div>
  );
}
