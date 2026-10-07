'use client';

import { useEffect } from 'react';
import AdminButton from './AdminButton';
import styles from './admin.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className={styles.dialogOverlay} role="presentation" onMouseDown={() => !loading && onCancel()}>
      <div
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
        aria-labelledby="admin-confirm-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.dialogBody}>
          <h2 id="admin-confirm-dialog-title">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <div className={styles.dialogActions}>
          <AdminButton variant="ghost" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </AdminButton>
          <AdminButton data-demo-mutation variant={variant === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
