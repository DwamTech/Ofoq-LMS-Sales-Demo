"use client";
import { brand } from '@/lib/brand'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  loadStudentJourney,
  type StudentJourney,
} from "@/utils/studentJourney";
import styles from "./Student.module.css";

const Context = createContext<StudentJourney | null>(null);
export function useStudent() {
  const value = useContext(Context);
  if (!value) throw new Error("Student workspace provider required");
  return value;
}
export function StudentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<StudentJourney | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setError(false);
    setData(null);
    void loadStudentJourney(
      AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    )
      .then((value) => {
        if (active) setData(value);
      })
      .catch((reason) => {
        if (!active) return;
        if (
          reason instanceof Error &&
          reason.message === "STUDENT_ROLE_REQUIRED"
        ) {
          router.replace("/experience");
          return;
        }
        setError(true);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [retry, router]);
  if (!data)
    return (
      <div className={styles.loading} role={error ? "alert" : "status"}>
        <span>{brand.name} / مساحة التعلّم</span>
        <h1>{error ? "تعذّر تحميل رحلتك." : "نجهّز مساحة تعلّمك."}</h1>
        <p>
          {error
            ? "لم نعرض بيانات بديلة أو تقدمًا افتراضيًا. تحقق من الاتصال وأعد المحاولة."
            : "نجلب تسجيلاتك وتقدمك من المنصة."}
        </p>
        {error && (
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            أعد المحاولة
          </button>
        )}
      </div>
    );
  return <Context.Provider value={data}>{children}</Context.Provider>;
}
