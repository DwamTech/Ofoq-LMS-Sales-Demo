// /**
//  * Ofuq FE⇄API Connectivity & CORS Diagnostic
//  * Run with: npm run api:test
//  */

// import { readFileSync, existsSync } from 'fs';
// import { join } from 'path';

// const LOGIN_PATH = process.env.API_TEST_LOGIN_PATH || "/auth/login";

// function normalizeBaseURL(u?: string) {
//   if (!u) throw new Error("NEXT_PUBLIC_API_URL is missing");
//   return u.endsWith('/') ? u.slice(0, -1) : u;
// }

// function mark(ok: boolean) {
//   return ok ? '✅' : '❌';
// }

// function loadEnvVar(key: string): string | undefined {
//   if (process.env[key]) return process.env[key] as string;
//   const envPath = join(process.cwd(), '.env.local');
//   if (existsSync(envPath)) {
//     try {
//       const content = readFileSync(envPath, 'utf8');
//       const line = content.split(/\r?\n/).find((l) => l.trim().startsWith(key + '='));
//       if (line) {
//         const raw = line.slice(key.length + 1).trim();
//         // strip quotes if present
//         return raw.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
//       }
//     } catch (_) {}
//   }
//   return undefined;
// }

// async function ensureFetchPolyfill() {
//   if (typeof (globalThis as any).fetch === 'undefined') {
//     try {
//       // Dynamic import if undici is available
//       const undici = await import('undici');
//       (globalThis as any).fetch = (undici as any).fetch;
//       console.log(`${mark(true)} Using undici as fetch polyfill`);
//     } catch (e) {
//       console.log(`${mark(false)} fetch is not available. Install 'undici' for Node < 18.`);
//       throw new Error('Fetch API not available. Please install undici or use Node >= 18.');
//     }
//   }
// }

// async function main() {
//   await ensureFetchPolyfill();

//   const rawBase = loadEnvVar('NEXT_PUBLIC_API_URL');
//   if (!rawBase) {
//     console.log(`${mark(false)} NEXT_PUBLIC_API_URL not found in environment or .env.local`);
//     console.log(`Hint: add NEXT_PUBLIC_API_URL=\"https://api.ofuq.academy/api\" to .env.local`);
//     return;
//   }

//   const baseURL = normalizeBaseURL(rawBase);
//   console.log(`${mark(true)} NEXT_PUBLIC_API_URL = ${baseURL}`);

//   const candidates = ['/health', '/status', '/ping', '/courses', '/allCourses'];
//   let publicOk = false;
//   let publicEndpointUsed = '';

//   for (const path of candidates) {
//     try {
//       const res = await fetch(baseURL + path, { method: 'GET' });
//       if (res.ok) {
//         publicOk = true;
//         publicEndpointUsed = path;
//         const ct = res.headers.get('content-type') || '';
//         console.log(`${mark(true)} Public GET ${path} → HTTP ${res.status} (${ct})`);
//         break;
//       } else {
//         console.log(`${mark(false)} Public GET ${path} → HTTP ${res.status}`);
//       }
//     } catch (e: any) {
//       console.log(`${mark(false)} Public GET ${path} failed → ${e?.message || e}`);
//     }
//   }

//   if (!publicOk) {
//     console.log(`Hint: Ensure a public endpoint exists: /health, /status, /ping, /courses, or /allCourses`);
//   }

//   // CORS Preflight
//   const preflightUrl = baseURL + LOGIN_PATH;
//   try {
//     const res = await fetch(preflightUrl, {
//       method: 'OPTIONS',
//       headers: {
//         'Origin': 'http://localhost:3000',
//         'Access-Control-Request-Method': 'POST',
//         'Access-Control-Request-Headers': 'content-type, authorization',
//       },
//     });

//     const allowOrigin = res.headers.get('access-control-allow-origin') || '';
//     const allowMethods = res.headers.get('access-control-allow-methods') || '';
//     const allowHeaders = res.headers.get('access-control-allow-headers') || '';

//     const corsOk = Boolean(allowOrigin) && Boolean(allowMethods) && Boolean(allowHeaders);
//     console.log(
//       `${mark(corsOk)} CORS Preflight OPTIONS ${LOGIN_PATH} →` +
//         ` origin=${allowOrigin || 'n/a'}, methods=${allowMethods || 'n/a'}, headers=${allowHeaders || 'n/a'}`
//     );

//     if (!corsOk) {
//       console.log(
//         `Hints: Allowed Origins: http://localhost:3000, https://www.ofuq.academy, https://ofuq.academy; ` +
//           `Allowed Headers: content-type, authorization; ` +
//           `Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
//       );
//     }
//   } catch (e: any) {
//     console.log(`${mark(false)} CORS Preflight OPTIONS ${LOGIN_PATH} failed → ${e?.message || e}`);
//     console.log(
//       `Hints: Ensure the endpoint exists and CORS preflight is handled for ${LOGIN_PATH}. ` +
//         `Allowed Origins: http://localhost:3000, https://www.ofuq.academy, https://ofuq.academy; ` +
//         `Allowed Headers: content-type, authorization; ` +
//         `Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
//     );
//   }

//   console.log('\nDiagnostics complete.');
// }

// main().catch((e) => {
//   console.error('Unexpected error:', e);
// });