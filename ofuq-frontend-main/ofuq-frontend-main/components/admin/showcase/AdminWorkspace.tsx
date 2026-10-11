"use client";
import { brand, publicBrandText } from '@/lib/brand'
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpLeft,
  Award,
  BookOpen,
  BarChart3,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import { BrandScope } from "@/components/brand/BrandPrimitives";
import { BrandMark } from "@/components/brand/BrandMark";
import { signout } from "@/utils/authService";
import { adminNavigationActive } from "@/utils/adminShowcase";
import { AdminProvider, useAdmin } from "./AdminProvider";
import AdminView from "./AdminView";
import styles from "./AdminShowcase.module.css";
const groups = [
  {
    title: "المشهد التعليمي",
    items: [
      { label: "نظرة شاملة", href: "/admin", icon: LayoutDashboard },
      {
        label: "البرامج التعليمية",
        href: "/admin/diplomas",
        icon: GraduationCap,
      },
      {
        label: "المقررات والمحتوى",
        href: "/admin/course-management",
        icon: BookOpen,
      },
      { label: "الطلاب", href: "/admin/students", icon: Users },
      { label: "المحاضرون", href: "/admin/instructors", icon: Users },
    ],
  },
  {
    title: "الأداء والإنجاز",
    items: [
      {
        label: "الاختبارات والتقييم",
        href: "/admin/exams",
        icon: ClipboardList,
      },
      { label: "الشهادات", href: "/admin/certificates", icon: Award },
      { label: "التقارير التعليمية", href: "/admin/reports", icon: BarChart3 },
      { label: "تحليلات الفيديو", href: "/admin/reports/bunny", icon: Video },
    ],
  },
  {
    title: "التحكم التشغيلي",
    items: [
      {
        label: "المشرفون والصلاحيات",
        href: "/admin/supervisors",
        icon: ShieldCheck,
      },
      {
        label: "الإعدادات والأدوات",
        href: "/admin/profile-management",
        icon: Settings,
      },
    ],
  },
];
function Workspace() {
  const { user } = useAdmin();
  const path = usePathname();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        document
          .querySelector<HTMLButtonElement>(
            '[aria-controls="admin-mobile-nav"]',
          )
          ?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const active = (href: string) => adminNavigationActive(path, href);
  const links = groups.map((group) => (
    <div key={group.title} className={styles.navGroup}>
      <p>{group.title}</p>
      {group.items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active(item.href) ? "page" : undefined}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  ));
  const logout = async () => {
    setBusy(true);
    try {
      await signout();
      window.location.assign("/experience");
    } catch {
      setBusy(false);
      setError("تعذّر إنهاء الجلسة. أعد المحاولة.");
    }
  };
  return (
    <div className={styles.workspace} data-admin-ready="true">
      <a className={styles.skip} href="#admin-main">
        انتقل إلى المحتوى
      </a>
      <aside className={styles.sidebar}>
        <Link href="/" aria-label={`${brand.name} — الموقع العام`}>
          <BrandMark compact theme="dark" />
        </Link>
        <p className={styles.signature}>EDUCATIONAL COMMAND CENTER</p>
        <nav aria-label="تنقل الإدارة">{links}</nav>
        <div className={styles.account}>
          <span className={styles.avatar}>{publicBrandText(user.name).slice(0, 1)}</span>
          <div>
            <strong>{publicBrandText(user.name)}</strong>
            <small>إدارة المنصة · حساب عرض</small>
          </div>
        </div>
      </aside>
      <div className={styles.content}>
        <header className={styles.topbar}>
          <span>
            {brand.name} <span aria-hidden="true">/</span> مساحة الإدارة
          </span>
          <div>
            <Link href="/">
              الموقع العام <ArrowUpLeft size={16} />
            </Link>
            <button
              data-admin-logout
              type="button"
              onClick={() => void logout()}
              disabled={busy}
            >
              <LogOut size={17} />
              {busy ? "إنهاء الجلسة…" : "خروج"}
            </button>
            <button
              className={styles.menu}
              type="button"
              aria-controls="admin-mobile-nav"
              aria-expanded={open}
              aria-label={open ? "إغلاق تنقل الإدارة" : "فتح تنقل الإدارة"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </header>
        {open && (
          <nav
            id="admin-mobile-nav"
            className={styles.mobileNav}
            aria-label="تنقل الإدارة على الهاتف"
          >
            {links}
          </nav>
        )}
        <div className={styles.notice}>
          <ShieldCheck size={16} />
          <span>
            بيانات عرض اصطناعية محفوظة في النظام · قراءة فقط · ليست مؤشرات
            تجارية فعلية
          </span>
        </div>
        {error && <p role="alert">{error}</p>}
        <main id="admin-main" className={styles.main} tabIndex={-1}>
          <AdminView />
        </main>
        <footer className={styles.footer}>
          الصورة الكاملة لتجربتك التعليمية، تحت إدارتك.
          <Link href="/experience">تغيير منظور التجربة ←</Link>
        </footer>
      </div>
    </div>
  );
}
export default function AdminWorkspace() {
  return (
    <AdminAuthGuard>
      <BrandScope className={styles.scope}>
        <AdminProvider>
          <Suspense fallback={<p role="status">جارٍ تحميل مساحة الإدارة…</p>}>
            <Workspace />
          </Suspense>
        </AdminProvider>
      </BrandScope>
    </AdminAuthGuard>
  );
}
