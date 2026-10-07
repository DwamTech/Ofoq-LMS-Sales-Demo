'use client';

import type { InputHTMLAttributes } from 'react';
import styles from './admin.module.css';

interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function AdminInput({ className = '', error = false, ...props }: AdminInputProps) {
  return (
    <input
      {...props}
      className={`${styles.formControl} ${error ? styles.formControlError : ''} ${className}`.trim()}
      aria-invalid={error || props['aria-invalid'] || undefined}
    />
  );
}
