'use client';

import React from 'react';
import styles from './reports.module.css';

export interface ReportTableColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface ReportTableProps<T extends Record<string, unknown>> {
  title: string;
  rows: T[];
  columns: ReportTableColumn<T>[];
  emptyMessage?: string;
}

const renderCellValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'string') return value;
  return '-';
};

export default function ReportTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  emptyMessage = 'لا توجد بيانات متاحة',
}: ReportTableProps<T>) {
  return (
    <section className={styles.tableSection}>
      {title ? (
        <div className={styles.sectionHeader}>
          <h2>{title}</h2>
        </div>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={styles.reportTable}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? row.key ?? index)}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render ? column.render(row) : renderCellValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
