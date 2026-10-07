'use client';

import type { ReactNode } from 'react';
import styles from './admin.module.css';

interface AdminSectionProps {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function AdminSection({
  children,
  title,
  description,
  actions,
  className = '',
}: AdminSectionProps) {
  const hasHeader = title || description || actions;

  return (
    <section className={`${styles.section} ${className}`.trim()}>
      {hasHeader ? (
        <div className={styles.sectionHeader}>
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
