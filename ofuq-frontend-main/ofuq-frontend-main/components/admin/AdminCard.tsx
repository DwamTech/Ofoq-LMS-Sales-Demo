'use client';

import type { ReactNode } from 'react';
import styles from './admin.module.css';

interface AdminCardProps {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function AdminCard({
  children,
  title,
  description,
  actions,
  className = '',
}: AdminCardProps) {
  const hasHeader = title || description || actions;

  return (
    <article className={`${styles.card} ${className}`.trim()}>
      {hasHeader ? (
        <div className={styles.cardHeader}>
          <div>
            {title ? <h3>{title}</h3> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className={styles.cardActions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </article>
  );
}
