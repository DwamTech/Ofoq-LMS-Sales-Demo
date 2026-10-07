'use client';

import type { TextareaHTMLAttributes } from 'react';
import styles from './admin.module.css';

interface AdminTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export default function AdminTextarea({ className = '', error = false, ...props }: AdminTextareaProps) {
  return (
    <textarea
      {...props}
      className={`${styles.formControl} ${styles.textarea} ${error ? styles.formControlError : ''} ${className}`.trim()}
      aria-invalid={error || props['aria-invalid'] || undefined}
    />
  );
}
