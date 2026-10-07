'use client';

import { SkeletonTable } from '@/components/Skeleton';
import styles from './reports.module.css';

interface ReportStateProps {
  type: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ReportState({ type, title, message, onRetry }: ReportStateProps) {
  if (type === 'loading') {
    return (
      <div className={styles.stateBox}>
        <div className={styles.loadingHeader}>جاري تحميل بيانات التقارير...</div>
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className={`${styles.stateBox} ${type === 'error' ? styles.errorState : styles.emptyState}`}>
      <h2>{title ?? (type === 'error' ? 'تعذر تحميل البيانات' : 'لا توجد بيانات')}</h2>
      {message ? <p>{message}</p> : null}
      {type === 'error' && onRetry ? (
        <button type="button" onClick={onRetry}>
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}
