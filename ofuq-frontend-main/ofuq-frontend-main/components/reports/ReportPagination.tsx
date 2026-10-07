'use client';

import type { ReportPaginationMeta } from '@/types/reports';
import styles from './reports.module.css';

interface ReportPaginationProps {
  pagination?: ReportPaginationMeta | null;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export default function ReportPagination({ pagination, onPageChange, loading = false }: ReportPaginationProps) {
  if (!pagination) return null;

  const currentPage = asNumber(pagination.current_page ?? pagination.currentPage ?? pagination.page) ?? 1;
  const lastPage = asNumber(pagination.last_page ?? pagination.lastPage ?? pagination.total_pages) ?? currentPage;
  const total = asNumber(pagination.total);
  const from = asNumber(pagination.from);
  const to = asNumber(pagination.to);
  const hasPrev = currentPage > 1 || Boolean(pagination.prev_page_url);
  const hasNext = currentPage < lastPage || Boolean(pagination.next_page_url);

  if (!hasPrev && !hasNext && !total) return null;

  return (
    <div className={styles.pagination}>
      <div className={styles.paginationInfo}>
        الصفحة {currentPage.toLocaleString('ar-EG')} من {lastPage.toLocaleString('ar-EG')}
        {total ? ` - الإجمالي ${total.toLocaleString('ar-EG')}` : ''}
        {from && to ? ` - عرض ${from.toLocaleString('ar-EG')} إلى ${to.toLocaleString('ar-EG')}` : ''}
      </div>
      <div className={styles.paginationActions}>
        <button
          type="button"
          disabled={!hasPrev || loading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          السابق
        </button>
        <button type="button" disabled={!hasNext || loading} onClick={() => onPageChange(currentPage + 1)}>
          التالي
        </button>
      </div>
    </div>
  );
}
