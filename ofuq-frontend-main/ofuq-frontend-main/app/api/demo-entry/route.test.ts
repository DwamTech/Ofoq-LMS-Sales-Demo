/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "./route";
const request = (body: string) =>
  new NextRequest("http://localhost/api/demo-entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
test.each([
  ["student", "/user"],
  ["admin", "/admin"],
])("local compatibility entry for %s", async (persona, redirect) => {
  const original = global.fetch;
  global.fetch = jest.fn();
  try {
    const response = await POST(request(JSON.stringify({ persona })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirect });
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    global.fetch = original;
  }
});
test.each(["not-json", "{}", '{"persona":"unknown"}', '{"persona":["admin"]}'])(
  "invalid entry returns 422: %s",
  async (body) => {
    expect((await POST(request(body))).status).toBe(422);
  },
);
