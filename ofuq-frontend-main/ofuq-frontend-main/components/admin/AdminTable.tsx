'use client';

import type { ReactNode } from 'react';
import AdminState from './AdminState';
import styles from './admin.module.css';

export interface AdminTableColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  header: ReactNode;
  render?: (row: T, value: unknown) => ReactNode;
  className?: string;
}

interface AdminTableProps<T extends Record<string, unknown>> {
  columns: AdminTableColumn<T>[];
  data: T[];
  getRowKey?: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  footer?: ReactNode;
  ariaLabel?: string;
}

const renderCellValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'string') return value;
  return '—';
};

export default function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  getRowKey,
  loading = false,
  emptyMessage = 'لا توجد بيانات متاحة',
  className = '',
  footer,
  ariaLabel,
}: AdminTableProps<T>) {
  const columnCount = Math.max(columns.length, 1);

  return (
    <div className={`${styles.tableShell} ${className}`.trim()}>
      {loading ? <AdminState type="loading" /> : null}
      {!loading ? (
        <div className={styles.tableWrap}>
          <table className={styles.adminTable} aria-label={ariaLabel}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} className={column.className}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={String(getRowKey ? getRowKey(row, index) : row.id ?? row.key ?? index)}>
                  {columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td key={String(column.key)} className={column.className}>
                        {column.render ? column.render(row, value) : renderCellValue(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!data.length ? (
                <tr>
                  <td colSpan={columnCount} className={styles.tableEmptyCell}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
            </tbody>
            {footer ? <tfoot>{footer}</tfoot> : null}
          </table>
        </div>
      ) : null}
    </div>
  );
}
