'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import AuthPageContent from '../../components/AuthPageContent';
import styles from './Auth.module.css';

export default function AuthPage() {
  return (
    <div className={styles.authPage}>
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <AuthPageContent />
      </Suspense>
      <div className={styles.authFooterLinks}>
        <Link href="/privacy" className={styles.footerLink}>
          سياسة الخصوصية
        </Link>
        <span className={styles.linkSeparator}>|</span>
        <Link href="/terms" className={styles.footerLink}>
          الشروط والأحكام
        </Link>
      </div>
    </div>
  );
}