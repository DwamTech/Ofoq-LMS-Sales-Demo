"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  DatabaseBackup,
  FileQuestion,
  GraduationCap,
  Home,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  UserRoundCheck,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { getCurrentUser } from '../utils/authService';
import apiClient from '../utils/apiClient';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  permission?: string; // Required permission to view this item
  adminOnly?: boolean; // Only visible to admin
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onClose }) => {
  const pathname = usePathname();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  // Menu items with their required permissions
  const menuItems: MenuItem[] = [
    { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/admin/course-management', label: 'إدارة الكورسات', icon: BookOpen },
    { href: '/admin/diplomas', label: 'إدارة الدبلومات', icon: GraduationCap, permission: 'diplomas.view' },
    { href: '/admin/diplomas/question-bank', label: 'بنك الأسئلة', icon: FileQuestion, permission: 'questions.view' },
    { href: '/admin/reports', label: 'التقارير', icon: BarChart3 },
    { href: '/admin/reports/beneficiaries', label: 'تقرير المستفيدين', icon: BarChart3 },
    { href: '/admin/reports/diplomas', label: 'تقارير الدبلومات', icon: BarChart3, permission: 'diplomas.view' },
    { href: '/admin/students', label: 'إدارة الطلاب', icon: Users, permission: 'students.view' },
    { href: '/admin/instructors', label: 'المحاضرون', icon: UserRoundCheck, permission: 'instructors.view' },
    { href: '/admin/supervisors', label: 'إدارة المشرفين', icon: ShieldCheck, adminOnly: true },
    { href: '/admin/database-backups', label: 'النسخ الاحتياطية', icon: DatabaseBackup, permission: 'backups.view' },
    { href: '/admin/profile-management', label: 'إدارة الملف الشخصي', icon: Settings },
  ];

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          setUserRole(user.role);

          // Admin has all permissions
          if (user.role === 'admin') {
            setUserPermissions(['*']);
          } else {
            // Fetch permissions from API
            const response = await apiClient.get('/user/permissions');
            if (response.data.permissions) {
              setUserPermissions(response.data.permissions);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true; // No permission required
    if (userPermissions.includes('*')) return true; // Admin has all
    return userPermissions.includes(permission);
  };

  const canViewItem = (item: MenuItem): boolean => {
    if (item.adminOnly && userRole !== 'admin') return false;
    return hasPermission(item.permission);
  };

  const isActive = (href: string) => {
    if (!pathname) return false;

    if (href === '/admin' && pathname === '/admin') {
      return true;
    }

    if (href !== '/admin') {
      if (pathname === href) {
        return true;
      }

      if (pathname.startsWith(href + '/')) {
        if (href === '/admin/diplomas' && pathname.includes('/question-bank')) {
          return false;
        }
        return true;
      }
    }

    return false;
  };

  const handleNavigate = () => {
    onClose?.();
  };

  // Filter menu items based on permissions
  const visibleItems = menuItems.filter(canViewItem);

  return (
    <aside className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}>
      <div className={styles['sidebar-header']}>
        <Link href="/" className={styles['sidebar-logo']} onClick={handleNavigate} title="الانتقال إلى الصفحة الرئيسية">
          <img src="/logo.png" alt="منصة أفق للتعليم عن بعد" />
          <span className={styles['home-badge']} aria-hidden="true">
            <Home size={14} strokeWidth={2.4} />
          </span>
        </Link>
        <h2 className={styles['sidebar-title']}>لوحة الإدارة</h2>
        <p className={styles['sidebar-subtitle']}>إدارة المنصة والمحتوى</p>
      </div>

      <nav className={styles['sidebar-nav']}>
        <ul>
          {visibleItems.map((item) => (
            <li key={item.href} className={styles['nav-item']}>
              {(() => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
              <Link
                href={item.href}
                prefetch={false}
                className={`${styles['nav-link']} ${active ? styles.active : ''}`}
                onClick={handleNavigate}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles['nav-icon']}><Icon size={18} strokeWidth={2.2} /></span>
                <span>{item.label}</span>
              </Link>
                );
              })()}
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles['sidebar-footer']}>
        <p className={styles['footer-text']}>© منصة أفق للتعليم عن بعد</p>
      </div>
    </aside>
  );
};

export default Sidebar;
