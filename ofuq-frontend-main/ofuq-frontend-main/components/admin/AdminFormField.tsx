'use client';

import type { ReactNode } from 'react';
import styles from './admin.module.css';

interface AdminFormFieldProps {
  children: ReactNode;
  label: string;
  htmlFor?: string;
  required?: boolean;
  helpText?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function AdminFormField({
  children,
  label,
  htmlFor,
  required = false,
  helpText,
  error,
  disabled = false,
  className = '',
}: AdminFormFieldProps) {
  return (
    <div className={`${styles.formField} ${disabled ? styles.formFieldDisabled : ''} ${className}`.trim()}>
      <label className={styles.fieldLabel} htmlFor={htmlFor}>
        <span>{label}</span>
        {required ? <span className={styles.requiredMark}>*</span> : null}
      </label>
      {children}
      {helpText ? <div className={styles.helpText}>{helpText}</div> : null}
      {error ? <div className={styles.fieldError}>{error}</div> : null}
    </div>
  );
}
