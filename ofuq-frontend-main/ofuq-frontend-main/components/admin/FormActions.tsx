'use client';

import type { ReactNode } from 'react';
import AdminButton from './AdminButton';
import styles from './admin.module.css';

interface FormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  actions?: ReactNode;
  className?: string;
}

export default function FormActions({
  submitLabel = 'حفظ',
  cancelLabel = 'إلغاء',
  loading = false,
  disabled = false,
  onCancel,
  actions,
  className = '',
}: FormActionsProps) {
  return (
    <div className={`${styles.formActions} ${className}`.trim()}>
      {actions}
      {onCancel ? (
        <AdminButton type="button" variant="ghost" disabled={disabled || loading} onClick={onCancel}>
          {cancelLabel}
        </AdminButton>
      ) : null}
      <AdminButton type="submit" loading={loading} disabled={disabled}>
        {submitLabel}
      </AdminButton>
    </div>
  );
}
