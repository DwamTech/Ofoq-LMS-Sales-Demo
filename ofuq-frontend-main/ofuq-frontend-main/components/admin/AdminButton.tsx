'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './admin.module.css';

type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: AdminButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}

export default function AdminButton({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  className = '',
  type = 'button',
  ...props
}: AdminButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${styles.button} ${styles[`button-${variant}`]} ${className}`.trim()}
      disabled={disabled || loading}
    >
      {loading ? <span className={styles.buttonSpinner} aria-hidden="true" /> : icon ? <span>{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
