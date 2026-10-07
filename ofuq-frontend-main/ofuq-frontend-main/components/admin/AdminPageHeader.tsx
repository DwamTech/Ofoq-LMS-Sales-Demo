'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './admin.module.css';

interface AdminPageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  meta?: ReactNode;
  className?: string;
}

export default function AdminPageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = 'رجوع',
  meta,
  className = '',
}: AdminPageHeaderProps) {
  return (
    <header className={`${styles.pageHeader} ${className}`.trim()}>
      <div className={styles.pageHeaderMain}>
        {backHref ? (
          <Link href={backHref} className={styles.backLink}>
            {backLabel}
          </Link>
        ) : null}
        <div className={styles.titleBlock}>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
          {meta ? <div className={styles.headerMeta}>{meta}</div> : null}
        </div>
      </div>
      {actions ? <div className={styles.headerActions}>{actions}</div> : null}
    </header>
  );
}
