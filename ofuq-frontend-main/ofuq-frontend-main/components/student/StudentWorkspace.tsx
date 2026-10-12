"use client";
import { brand } from "@/lib/brand";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowUpLeft,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Award,
  ClipboardList,
  Menu,
  X,
  LogOut,
  UserRound,
  Heart,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DemoReadOnlyControls from "@/components/DemoReadOnlyControls";
import { BrandScope } from "@/components/brand/BrandPrimitives";
import { BrandMark } from "@/components/brand/BrandMark";
import { StudentProvider, useStudent } from "./StudentProvider";
import { signout } from "@/utils/authService";
import { isDemoMode } from "@/utils/demoMode";
import styles from "./Student.module.css";

const navigation = [
  { label: "مساحتي", href: "/user", icon: LayoutDashboard },
  { label: "دبلوماتي", href: "/user/my_courses", icon: GraduationCap },
  { label: "مقرراتي", href: "/user/my_courses?view=courses", icon: BookOpen },
  { label: "اختباراتي", href: "/user/my_exams", icon: ClipboardList },
  { label: "إنجازاتي وشهاداتي", href: "/user/my-certificates", icon: Award },
];
function Workspace({ children }: { children: ReactNode }) {
  const { user } = useStudent();
  const path = usePathname();
  const query = useSearchParams();
  const currentPath =
    path === "/user/my_courses" && query.get("view") === "courses"
      ? path + "?view=courses"
      : path;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        document
          .querySelector<HTMLButtonElement>(
            '[aria-controls="student-mobile-nav"]',
          )
          ?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const logout = async () => {
    setBusy(true);
    setError("");
    try {
      await signout();
      window.location.assign("/experience");
    } catch {
      setBusy(false);
      setError("تعذّر إنهاء الجلسة لدى الخادم. أعد المحاولة.");
    }
  };
  const links = (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={currentPath === item.href ? "page" : undefined}
          >
            <Icon size={19} />
            {item.label}
            <ArrowUpLeft size={14} />
          </Link>
        );
      })}
      <div className={styles.navSecondary}>
        <Link
          href="/user/settings"
          aria-current={path === "/user/settings" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <UserRound size={18} />
          الملف والإعدادات
        </Link>
        <Link
          href="/user/fav"
          aria-current={path === "/user/fav" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Heart size={18} />
          المفضلة
        </Link>
        <Link href="/">
          <ArrowUpLeft size={18} />
          العودة للموقع
        </Link>
        <button type="button" onClick={() => void logout()} disabled={busy}>
          <LogOut size={18} />
          {busy ? "جارٍ إنهاء الجلسة…" : "تسجيل الخروج"}
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    </>
  );
  return (
    <div className={styles.workspace} data-student-ready="true">
      <a href="#student-main" className={styles.skip}>
        انتقل إلى المحتوى
      </a>
      <aside className={styles.sidebar}>
        <Link href="/" aria-label={`${brand.name} — العودة للموقع`}>
          <BrandMark compact theme="dark" />
        </Link>
        <p className={styles.kicker}>مساحة التعلّم</p>
        <nav aria-label="تنقل الطالب">{links}</nav>
        <div className={styles.sidebarBottom}>
          <span className={styles.avatar}>{user.name.slice(0, 1)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>مساحة الطالب</small>
          </div>
        </div>
      </aside>
      <div className={styles.content}>
        <header className={styles.topbar}>
          <span>
            {brand.name} <span aria-hidden="true">/</span> مساحة التعلّم
          </span>
          <div>
            <Link href="/experience">
              تغيير منظور التجربة <ArrowUpLeft size={16} />
            </Link>
            <button
              type="button"
              className={styles.menu}
              aria-label={open ? "إغلاق تنقل الطالب" : "فتح تنقل الطالب"}
              aria-expanded={open}
              aria-controls="student-mobile-nav"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </header>
        {open && (
          <nav
            id="student-mobile-nav"
            className={styles.mobileNavigation}
            aria-label="تنقل الطالب على الهاتف"
          >
            {links}
          </nav>
        )}
        {/* {isDemoMode && (
          <div className={styles.demoNotice} role="note">
            تجربة محلية كاملة · تقدمك ونتائجك محفوظة في هذا المتصفح
          </div>
        )} */}
        <main id="student-main" className={styles.main}>
          {children}
        </main>
        <footer className={styles.workspaceFooter}>
          {brand.name} <Link href="/verify-certificate">التحقق من شهادة ←</Link>
        </footer>
      </div>
    </div>
  );
}
export default function StudentWorkspace({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <BrandScope className={styles.scope}>
        <DemoReadOnlyControls />
        <StudentProvider>
          <Suspense fallback={<p role="status">جارٍ تحميل مساحة التعلم…</p>}>
            <Workspace>{children}</Workspace>
          </Suspense>
        </StudentProvider>
      </BrandScope>
    </AuthGuard>
  );
}
