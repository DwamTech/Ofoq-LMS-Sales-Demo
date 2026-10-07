'use client';

import type { ReactNode } from 'react';
import styles from './admin.module.css';

type AdminPageSize = 'default' | 'wide' | 'full';

interface AdminPageProps {
  children: ReactNode;
  className?: string;
  size?: AdminPageSize;
}

const sizeClassMap: Record<AdminPageSize, string> = {
  default: styles.pageDefault,
  wide: styles.pageWide,
  full: styles.pageFull,
};

export default function AdminPage({ children, className = '', size = 'wide' }: AdminPageProps) {
  return (
    <div className={`${styles.page} ${sizeClassMap[size]} ${className}`.trim()}>
      {children}
    </div>
  );
}
