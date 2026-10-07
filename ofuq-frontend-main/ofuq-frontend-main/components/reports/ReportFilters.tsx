'use client';

import { useState } from 'react';
import type { ReportFilters as ReportFiltersValue } from '@/types/reports';
import styles from './reports.module.css';

interface ReportFiltersProps {
  value: ReportFiltersValue;
  onApply: (filters: ReportFiltersValue) => void;
  showLimit?: boolean;
  showPerPage?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
}

export default function ReportFilters({
  value,
  onApply,
  showLimit = true,
  showPerPage = false,
  statusOptions = [],
}: ReportFiltersProps) {
  const [draft, setDraft] = useState<ReportFiltersValue>(value);

  return (
    <form
      className={styles.filters}
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          from: draft.from || undefined,
          to: draft.to || undefined,
          limit: draft.limit || undefined,
          course_id: draft.course_id || undefined,
          category_id: draft.category_id || undefined,
          diploma_id: draft.diploma_id || undefined,
          status: draft.status || undefined,
          per_page: draft.per_page || undefined,
          page: 1,
          lessons_page: 1,
          students_page: 1,
          courses_page: 1,
        });
      }}
    >
      <label>
        <span>من</span>
        <input
          type="date"
          value={draft.from ?? ''}
          onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
        />
      </label>
      <label>
        <span>إلى</span>
        <input
          type="date"
          value={draft.to ?? ''}
          onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
        />
      </label>
      {statusOptions.length ? (
        <label>
          <span>الحالة</span>
          <select
            value={draft.status ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">كل الحالات</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showLimit ? (
        <label>
          <span>عدد النتائج</span>
          <input
            type="number"
            min={1}
            max={100}
            value={draft.limit ?? 10}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, limit: Number(event.target.value) || undefined }))
            }
          />
        </label>
      ) : null}
      {showPerPage ? (
        <label>
          <span>لكل صفحة</span>
          <input
            type="number"
            min={5}
            max={100}
            value={draft.per_page ?? 10}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, per_page: Number(event.target.value) || undefined }))
            }
          />
        </label>
      ) : null}
      <button type="submit">تطبيق</button>
    </form>
  );
}
