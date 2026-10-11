import { createHmac, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const unavailable = (status = 503) => NextResponse.json({ code: 'DEMO_ENTRY_UNAVAILABLE', message: 'الدخول التجريبي غير متاح حاليًا. يمكنك استخدام تسجيل الدخول المعتاد.' }, { status, headers: { 'Cache-Control': 'no-store, private' } });

export async function POST(request: NextRequest) {
  const origin = process.env.DEMO_ENTRY_FRONTEND_ORIGIN;
  const key = process.env.DEMO_ENTRY_SIGNING_KEY;
  const api = process.env.DEMO_ENTRY_API_URL;
  if (process.env.DEMO_ENTRY_ENABLED !== 'true' || !origin || !key || key.length < 32 || !api) return unavailable();
  // Same-origin JSON only. No credential-bearing URL or browser-visible signing key.
  let approvedHost: string;
  try { approvedHost = new URL(origin).host; } catch { return unavailable(); }
  // NextURL normalizes 127.0.0.1 to localhost. Validate the actual Host header,
  // while retaining exact Origin matching; do not loosen CSRF/origin checks.
  if (request.headers.get('origin') !== origin || request.headers.get('host') !== approvedHost
      || request.headers.get('sec-fetch-site') === 'cross-site') return unavailable(403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return unavailable(415);
  if (Number(request.headers.get('content-length') || 0) > 1024) return unavailable(413);
  try {
    const backend = new URL(api);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(backend.hostname) || backend.username || backend.password || backend.search) return unavailable();
    const reader = request.body?.getReader();
    if (!reader) return unavailable(422);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 1024) { await reader.cancel(); return unavailable(413); }
      chunks.push(chunk.value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return unavailable(422); }
    if (!body || typeof body !== 'object' || !('persona' in body)
        || typeof body.persona !== 'string' || Object.keys(body).length !== 1 || !['student', 'admin'].includes(body.persona)) return unavailable(422);
    const persona = String(body.persona);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', key).update([timestamp, nonce, persona, origin].join('\n')).digest('hex');
    const old = request.headers.get('authorization');
    const response = await fetch(`${api.replace(/\/$/, '')}/demo/session`, {
      method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Demo-Timestamp': timestamp, 'X-Demo-Nonce': nonce, 'X-Demo-Origin': origin, 'X-Demo-Signature': signature,
        ...(old && /^Bearer [A-Za-z0-9_|.-]{1,512}$/.test(old) ? { Authorization: old } : {}) },
      body: JSON.stringify({ persona }),
    });
    if (!response.ok) return unavailable([403,422,429,503].includes(response.status) ? response.status : 502);
    const session = await response.json();
    if (typeof session.token !== 'string' || !session.token || session.user?.role !== persona
        || session.user?.email !== `${persona}.demo@demo.ofoq.local` || !Number.isInteger(session.user?.id)
        || typeof session.expires_at !== 'string' || !Number.isFinite(Date.parse(session.expires_at)) || Date.parse(session.expires_at) <= Date.now()) return unavailable(502);
    return NextResponse.json(session, { status: 201, headers: { 'Cache-Control': 'no-store, private', 'Cross-Origin-Resource-Policy': 'same-origin' } });
  } catch { return unavailable(502); }
}
