'use client';

import styles from './admin.module.css';

type PaginationMeta = Record<string, unknown>;

interface AdminPaginationProps {
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  loading?: boolean;
  disabled?: boolean;
}

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export default function AdminPagination({
  pagination,
  onPageChange,
  loading = false,
  disabled = false,
}: AdminPaginationProps) {
  if (!pagination) return null;

  const currentPage = asNumber(pagination.current_page ?? pagination.currentPage ?? pagination.page);
  const lastPage = asNumber(pagination.last_page ?? pagination.lastPage ?? pagination.total_pages ?? pagination.totalPages);
  const perPage = asNumber(pagination.per_page ?? pagination.perPage);
  const total = asNumber(pagination.total);
  const from = asNumber(pagination.from);
  const to = asNumber(pagination.to);

  if (!currentPage || !lastPage) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(lastPage, currentPage + 1);

  if (!hasPrev && !hasNext && !total) return null;

  return (
    <nav className={styles.pagination} aria-label="ترقيم الصفحات">
      <div className={styles.paginationInfo}>
        الصفحة {currentPage.toLocaleString('ar-EG')} من {lastPage.toLocaleString('ar-EG')}
        {total ? ` - الإجمالي ${total.toLocaleString('ar-EG')}` : ''}
        {perPage ? ` - لكل صفحة ${perPage.toLocaleString('ar-EG')}` : ''}
        {from && to ? ` - عرض ${from.toLocaleString('ar-EG')} إلى ${to.toLocaleString('ar-EG')}` : ''}
      </div>
      <div className={styles.paginationActions}>
        <button
          type="button"
          disabled={disabled || loading || !hasPrev}
          onClick={() => onPageChange(previousPage)}
        >
          السابق
        </button>
        <button
          type="button"
          disabled={disabled || loading || !hasNext}
          onClick={() => onPageChange(nextPage)}
        >
          التالي
        </button>
      </div>
    </nav>
  );
}
