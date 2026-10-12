"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  LockKeyhole,
  BookOpen,
  GraduationCap,
  Users,
  BarChart3,
} from "lucide-react";
import { adminRead, adminNumber } from "@/utils/adminShowcase";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import styles from "./AdminShowcase.module.css";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FRONTEND_CHANGE } from "@/lib/frontendStore";
export function useAdminRead<T>(path: string | null) {
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    error: boolean;
  }>({ path: null, data: null, error: false });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const refresh = () => setRetry((value) => value + 1);
    window.addEventListener(FRONTEND_CHANGE, refresh);
    return () => window.removeEventListener(FRONTEND_CHANGE, refresh);
  }, []);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    let active = true;
    setState({ path, data: null, error: false });
    void adminRead<T>(
      path,
      AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
    )
      .then((data) => {
        if (active) setState({ path, data, error: false });
      })
      .catch(() => {
        if (active) setState({ path, data: null, error: true });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, retry]);
  return {
    data: state.path === path ? state.data : null,
    error: state.path === path && state.error,
    retry: () => setRetry((v) => v + 1),
  };
}
export function ReadState({
  error = false,
  retry,
}: {
  error?: boolean;
  retry?: () => void;
}) {
  return (
    <div className={styles.state} role={error ? "alert" : "status"}>
      <h2>{error ? "تعذّر قراءة هذه البيانات" : "جارٍ قراءة البيانات…"}</h2>
      <p>
        {error
          ? "لا نعرض أرقامًا بديلة. قد تكون الجلسة منتهية أو البيانات غير متاحة."
          : "من البيانات المحلية المحفوظة في المتصفح."}
      </p>
      {error && retry && (
        <button type="button" onClick={retry}>
          أعد المحاولة
        </button>
      )}
    </div>
  );
}
export function Intro({
  eyebrow = "مساحة الإدارة",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.intro}>
      <div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Panel({
  title,
  description,
  children,
  href,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  href?: string;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {href && (
          <Link className={styles.textLink} href={href}>
            استكشف <ArrowUpLeft size={17} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
export function Metric({
  label,
  value,
  definition,
}: {
  label: string;
  value: number;
  definition: string;
}) {
  const Icon = label.includes("مقرر")
    ? BookOpen
    : label.includes("دبلوم")
      ? GraduationCap
      : label.includes("طلاب")
        ? Users
        : BarChart3;
  return (
    <div className={styles.metric}>
      <Icon className={styles.metricIcon} size={20} aria-hidden="true" />
      <span>{label}</span>
      <strong>{adminNumber(value)}</strong>
      <small>{definition}</small>
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  const percentage = Math.min(100, Math.max(0, value));
  return (
    <div className={styles.progress}>
      <span>{label}</span>
      <strong>{adminNumber(percentage)}٪</strong>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <i style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
export function Table({
  caption,
  headers,
  children,
}: {
  caption: string;
  headers: string[];
  children: ReactNode;
}) {
  return (
    <ResponsiveTable caption={caption} headers={headers}>
      {children}
    </ResponsiveTable>
  );
}
export function Restricted({
  title,
  reason,
  mutation = false,
}: {
  title: string;
  reason: string;
  mutation?: boolean;
}) {
  return (
    <>
      <Intro eyebrow="حدود الاستعراض" title={title} description={reason} />
      <div className={styles.restricted}>
        <LockKeyhole size={34} />
        <h2>
          {mutation
            ? "متاحة في النسخة التشغيلية"
            : "وصول مقيّد لحماية البيانات"}
        </h2>
        <p>
          {mutation
            ? "هذه العملية متاحة في النسخة التشغيلية، وتم تعطيلها في وضع الاستعراض."
            : "هذه الوحدة خارج صلاحيات حساب الاستعراض. لم نطلب بياناتها ولم نتصل بأي مزوّد خارجي."}
        </p>
        <Link className={styles.primary} href="/admin">
          العودة إلى النظرة الشاملة <ArrowUpLeft size={17} />
        </Link>
      </div>
    </>
  );
}
export function MutationNote({}: { label: string }) {
  return null;
}
export function Pagination({
  meta,
  onPage,
}: {
  meta: { current_page: number; last_page: number; total: number };
  onPage: (page: number) => void;
}) {
  return (
    <div className={styles.pagination}>
      <span>
        {adminNumber(meta.total)} سجل · صفحة {adminNumber(meta.current_page)} من{" "}
        {adminNumber(meta.last_page)}
      </span>
      <button
        type="button"
        disabled={meta.current_page <= 1}
        onClick={() => onPage(meta.current_page - 1)}
      >
        السابق
      </button>
      <button
        type="button"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPage(meta.current_page + 1)}
      >
        التالي
      </button>
    </div>
  );
}
export function Horizon() {
  return (
    <div className={styles.horizon} aria-hidden="true">
      <svg viewBox="0 0 300 180">
        <path
          d="m145 12 78 78-78 78-78-78ZM145 38l52 52-52 52-52-52ZM15 155h55M230 25h55"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <span className={styles.horizonLogo}>
        <BrandLogo variant="icon" decorative />
      </span>
    </div>
  );
}
