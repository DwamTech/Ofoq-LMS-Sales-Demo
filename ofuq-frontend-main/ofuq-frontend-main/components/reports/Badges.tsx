'use client';

import styles from './reports.module.css';

const labelMap: Record<string, string> = {
  estimated: 'تقديري',
  estimated_partial: 'تقديري جزئي',
  unavailable: 'غير متاح',
  missing_settings: 'إعدادات ناقصة',
  success: 'ناجح',
  completed: 'مكتمل',
  completed_with_errors: 'مكتمل بأخطاء',
  completed_with_warnings: 'مكتمل بتحذيرات',
  failed: 'فشل',
  error: 'خطأ',
  pending: 'قيد الانتظار',
  running: 'قيد التشغيل',
};

const normalizeStatus = (status?: string | null) => String(status || 'unavailable').toLowerCase();

const Badge = ({ status, kind }: { status?: string | null; kind: 'cost' | 'accuracy' | 'sync' }) => {
  const normalized = normalizeStatus(status);
  const tone =
    normalized.includes('success') || normalized.includes('completed')
      ? styles.badgeSuccess
      : normalized.includes('partial') || normalized.includes('pending') || normalized.includes('running')
      ? styles.badgeWarning
      : normalized.includes('failed') || normalized.includes('error')
      ? styles.badgeDanger
      : normalized.includes('unavailable')
      ? styles.badgeMuted
      : styles.badgeInfo;

  return (
    <span className={`${styles.badge} ${tone}`} data-kind={kind}>
      {labelMap[normalized] ?? status ?? 'غير متاح'}
    </span>
  );
};

export const CostBadge = ({ status }: { status?: string | null }) => <Badge status={status} kind="cost" />;

export const AccuracyBadge = ({ status }: { status?: string | null }) => (
  <Badge status={status} kind="accuracy" />
);

export const SyncStatusBadge = ({ status }: { status?: string | null }) => (
  <Badge status={status} kind="sync" />
);
