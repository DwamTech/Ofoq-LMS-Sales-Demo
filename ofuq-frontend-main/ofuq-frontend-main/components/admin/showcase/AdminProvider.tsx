"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadAdminData, type AdminData } from "@/utils/adminShowcase";
import styles from "./AdminShowcase.module.css";
import { FRONTEND_CHANGE } from '@/lib/frontendStore';
import { localAdminData } from '@/lib/localWorkspaceData';
const Context = createContext<AdminData | null>(null);
export function useAdmin() {
  const data = useContext(Context);
  if (!data) throw new Error("Admin provider required");
  return data;
}
export function AdminProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(()=>{const refresh=()=>setData(localAdminData());window.addEventListener(FRONTEND_CHANGE,refresh);window.addEventListener('storage',refresh);return()=>{window.removeEventListener(FRONTEND_CHANGE,refresh);window.removeEventListener('storage',refresh);};},[]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setData(null);
    setError(false);
    void loadAdminData(
      AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
    )
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    const clear = () => {
      controller.abort();
      setData(null);
      window.location.assign("/experience");
    };
    window.addEventListener("auth-change", clear);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("auth-change", clear);
    };
  }, [retry]);
  if (!data)
    return (
      <div className={styles.state} role={error ? "alert" : "status"}>
        <h1>{error ? "تعذّر فتح مركز الإدارة" : "نجهّز الصورة الكاملة…"}</h1>
        <p>
          {error
            ? "لم نستبدل البيانات بأرقام افتراضية. تحقق من الجلسة والاتصال."
            : "قراءة آمنة للبرامج والتقارير، دون تعديل سجلات التعليم."}
        </p>
        {error && (
          <button type="button" onClick={() => setRetry((v) => v + 1)}>
            أعد المحاولة
          </button>
        )}
        <a href="/experience">العودة إلى بوابة التجربة</a>
      </div>
    );
  return <Context.Provider value={data}>{children}</Context.Provider>;
}
