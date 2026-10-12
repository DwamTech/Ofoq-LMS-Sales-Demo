import {
  enterDemo,
  validatedStoredIdentity,
  clearGatewaySession,
} from "./demoGateway";
describe("frontend direct entry", () => {
  const original = global.fetch;
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });
  afterAll(() => {
    global.fetch = original;
  });
  test.each([
    ["student", "/user"],
    ["admin", "/admin"],
  ] as const)("opens %s directly", async (persona, route) => {
    expect(await enterDemo(persona, new AbortController().signal)).toBe(route);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });
  test("aborted entry does not continue", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(enterDemo("student", controller.signal)).rejects.toThrow();
  });
  test("identity comes from local data and old credentials are cleared", async () => {
    localStorage.setItem("auth_token", "old");
    clearGatewaySession();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect((await validatedStoredIdentity())?.id).toBe(99001);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
