'use client';

import type { SelectHTMLAttributes } from 'react';
import styles from './admin.module.css';

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export default function AdminSelect({ className = '', error = false, children, ...props }: AdminSelectProps) {
  return (
    <select
      {...props}
      className={`${styles.formControl} ${styles.select} ${error ? styles.formControlError : ''} ${className}`.trim()}
      aria-invalid={error || props['aria-invalid'] || undefined}
    >
      {children}
    </select>
  );
}
