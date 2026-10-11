'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { validatedStoredIdentity } from '@/utils/demoGateway';
import type { User } from '@/utils/authService';
import { isLocalPreview } from '@/lib/localPreview';

export default function SessionGuard({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking'|'allowed'|'error'>('checking');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (isLocalPreview) { setStatus('allowed'); return; }
    const controller = new AbortController();
    let active = true;
    setStatus('checking');
    const check = async () => {
      try {
        const user: User | null = await validatedStoredIdentity(AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]));
        if (!active) return;
        if (!user || (admin && !['admin','supervisor'].includes(user.role))) { router.replace('/auth'); return; }
        setStatus('allowed');
      } catch { if (active) setStatus('error'); }
    };
    void check();
    return () => { active = false; controller.abort(); };
  }, [admin, retry, router]);
  if (status === 'allowed') return <>{children}</>;
  return <div dir="rtl" style={{ padding: 40, textAlign: 'center' }} role={status === 'error' ? 'alert' : 'status'}>
    {status === 'error' ? <>تعذر التحقق من الجلسة. <button type="button" onClick={() => setRetry(value => value + 1)}>أعد المحاولة</button> <a href="/login_old">تسجيل الدخول</a></> : 'جارٍ التحقق من صلاحية الجلسة…'}
  </div>;
}
