'use client';

import type { ReactNode } from 'react';
import styles from './admin.module.css';

interface AdminTableToolbarProps {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  search?: ReactNode;
  className?: string;
}

export default function AdminTableToolbar({
  title,
  description,
  actions,
  filters,
  search,
  className = '',
}: AdminTableToolbarProps) {
  return (
    <div className={`${styles.tableToolbar} ${className}`.trim()}>
      {title || description ? (
        <div className={styles.tableToolbarTitle}>
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      {search ? <div className={styles.tableToolbarSearch}>{search}</div> : null}
      {filters ? <div className={styles.tableToolbarFilters}>{filters}</div> : null}
      {actions ? <div className={styles.tableToolbarActions}>{actions}</div> : null}
    </div>
  );
}
