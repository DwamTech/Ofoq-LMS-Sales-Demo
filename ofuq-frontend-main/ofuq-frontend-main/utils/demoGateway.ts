import type { User } from './authService';
import { experienceRoutes } from '@/lib/experienceRoutes';

export type DemoPersona = 'student' | 'admin';
const base = () => (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
export const clearGatewaySession = () => {
  localStorage.removeItem('auth_token'); localStorage.removeItem('user_data'); localStorage.removeItem('ofoq_demo_session');
  window.dispatchEvent(new Event('auth-change'));
};

export async function validatedStoredIdentity(signal?: AbortSignal): Promise<User | null> {
  const token = localStorage.getItem('auth_token');
  if (!token || token === 'undefined') return null;
  const response = await fetch(`${base()}/profile`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store', signal: signal || AbortSignal.timeout(10000) });
  if ([401,403].includes(response.status)) { clearGatewaySession(); return null; }
  if (!response.ok) throw new Error('تعذر التحقق من الجلسة. أعد المحاولة.');
  const { user } = await response.json();
  if (!user || !Number.isInteger(user.id) || !['student','admin','supervisor'].includes(user.role)) { clearGatewaySession(); return null; }
  localStorage.setItem('user_data', JSON.stringify(user));
  return user as User;
}

export async function enterDemo(persona: DemoPersona, signal: AbortSignal): Promise<string> {
  const previous = localStorage.getItem('auth_token');
  // Switching is an explicit logout, including when the previous session is legacy.
  if (previous) {
    const logout = await fetch(`${base()}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${previous}`, Accept: 'application/json' }, signal });
    if (!logout.ok && ![401,403].includes(logout.status)) throw new Error('تعذر إنهاء الجلسة السابقة بأمان. أعد المحاولة.');
    clearGatewaySession();
  }
  const response = await fetch('/api/demo-entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ persona }), cache: 'no-store', signal });
  if (!response.ok) throw new Error(response.status === 429 ? 'طلبات كثيرة في وقت قصير. انتظر دقيقة ثم أعد المحاولة.' : 'تعذر إنشاء جلسة العرض. استخدم تسجيل الدخول المعتاد أو أعد المحاولة.');
  const session = await response.json();
  try {
  if (typeof session.token !== 'string' || !session.token || session.user?.role !== persona
      || session.user?.email !== `${persona}.demo@demo.ofoq.local`) throw new Error('لم تُعتمد هوية العرض المطلوبة.');
  const profile = await fetch(`${base()}/profile`, { cache: 'no-store', headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' }, signal });
  if (!profile.ok) throw new Error('تعذر تأكيد صلاحية جلسة العرض.');
  const { user } = await profile.json();
  if (user?.role !== persona || user?.id !== session.user.id || user?.email !== session.user.email) throw new Error('هوية الجلسة لا تطابق التجربة المطلوبة.');
  signal.throwIfAborted();
  // Preserve the established app contract only after a real authenticated GET.
  localStorage.setItem('auth_token', session.token);
  localStorage.setItem('user_data', JSON.stringify(user));
  localStorage.setItem('ofoq_demo_session', JSON.stringify({ persona, expires_at: session.expires_at }));
  window.dispatchEvent(new Event('auth-change'));
  return experienceRoutes[persona];
  } catch (error) {
    clearGatewaySession();
    // An interrupted profile check must not leave a newly issued token active.
    // Use an independent bounded request, since the original signal may be aborted.
    if (typeof session.token === 'string' && session.token) {
      const cleanup = new AbortController();
      const timeout = setTimeout(() => cleanup.abort(), 5000);
      try {
        await fetch(`${base()}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' }, signal: cleanup.signal });
      } catch { /* Unreachable server: the restricted token still expires after 30 minutes. */ }
      finally { clearTimeout(timeout); }
    }
    throw error;
  }
}
