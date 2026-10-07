'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './reports.module.css';

const links = [
  { href: '/admin/reports/bunny', label: 'نظرة عامة' },
  { href: '/admin/reports/bunny/videos', label: 'الفيديوهات' },
  { href: '/admin/reports/bunny/sync-logs', label: 'سجلات المزامنة' },
];

export default function BunnyReportsNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.subNav} aria-label="Bunny reports navigation">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link className={`${styles.subNavLink} ${active ? styles.subNavLinkActive : ''}`} href={link.href} key={link.href}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
