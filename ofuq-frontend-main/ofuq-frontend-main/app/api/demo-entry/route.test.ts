/** @jest-environment node */
import { randomBytes, createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('server-only demo entry proxy', () => {
  const original = { ...process.env };
  const fetchMock = jest.fn();
  beforeEach(() => {
    process.env.DEMO_ENTRY_ENABLED='true';
    process.env.DEMO_ENTRY_SIGNING_KEY=randomBytes(32).toString('hex');
    process.env.DEMO_ENTRY_FRONTEND_ORIGIN='http://127.0.0.1:3004';
    process.env.DEMO_ENTRY_API_URL='http://127.0.0.1:8000/api';
    global.fetch=fetchMock; fetchMock.mockReset();
  });
  afterAll(() => { process.env=original; });
  const request=(body: string,origin='http://127.0.0.1:3004')=>new NextRequest('http://127.0.0.1:3004/api/demo-entry',{method:'POST',headers:{Host:'127.0.0.1:3004',Origin:origin,'Content-Type':'application/json'},body});
  test('disabled by default, no backend request',async()=>{delete process.env.DEMO_ENTRY_ENABLED;expect((await POST(request('{"persona":"admin"}'))).status).toBe(503);expect(fetchMock).not.toHaveBeenCalled();});
  test('cross-origin denied',async()=>{expect((await POST(request('{"persona":"admin"}','https://untrusted.example'))).status).toBe(403);expect(fetchMock).not.toHaveBeenCalled();});
  test.each(['{"persona":"supervisor"}','{"persona":["admin"]}','{"persona":"admin","user_id":1}','not-json'])('invalid input %s',async body=>{expect((await POST(request(body))).status).toBe(422);expect(fetchMock).not.toHaveBeenCalled();});
  test('oversized input is rejected before issuing a session',async()=>{expect((await POST(request('x'.repeat(2000)))).status).toBe(413);expect(fetchMock).not.toHaveBeenCalled();});
  test('private signer cannot be sent to an unapproved host',async()=>{process.env.DEMO_ENTRY_API_URL='https://untrusted.example/api';expect((await POST(request('{"persona":"student"}'))).status).toBe(503);expect(fetchMock).not.toHaveBeenCalled();});
  test('valid response is signed privately, non-cacheable, exact persona',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({token:'synthetic-unit-fixture',user:{id:1,role:'student',email:'student.demo@demo.ofoq.local'},expires_at:new Date(Date.now()+1800000).toISOString()}),{status:201}));
    const response=await POST(request('{"persona":"student"}'));
    expect(response.status).toBe(201);expect(response.headers.get('cache-control')).toContain('no-store');
    const headers=fetchMock.mock.calls[0][1].headers;
    const payload=[headers['X-Demo-Timestamp'],headers['X-Demo-Nonce'],'student',headers['X-Demo-Origin']].join('\n');
    expect(headers['X-Demo-Signature']).toBe(createHmac('sha256',process.env.DEMO_ENTRY_SIGNING_KEY!).update(payload).digest('hex'));
    expect(JSON.stringify(await response.json())).not.toContain(process.env.DEMO_ENTRY_SIGNING_KEY);
  });
  test('wrong returned role never leaks a token to the browser',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({token:'synthetic-unit-fixture',user:{id:1,role:'admin',email:'admin.demo@demo.ofoq.local'}}),{status:201}));
    const response=await POST(request('{"persona":"student"}'));expect(response.status).toBe(502);expect((await response.json()).token).toBeUndefined();
  });
  test('backend unavailable returns a generic failure without config',async()=>{fetchMock.mockRejectedValue(new Error('private connection failure'));const response=await POST(request('{"persona":"admin"}'));expect(response.status).toBe(502);expect(JSON.stringify(await response.json())).not.toContain('private connection failure');});
  test('invalid expiration cannot become a browser session',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({token:'synthetic-unit-fixture',user:{id:1,role:'student',email:'student.demo@demo.ofoq.local'},expires_at:'not-a-date'}),{status:201}));
    const response=await POST(request('{"persona":"student"}'));expect(response.status).toBe(502);expect((await response.json()).token).toBeUndefined();
  });
});
