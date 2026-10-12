import { http } from "./http";
import { readFrontend } from "./frontendStore";
beforeEach(() => localStorage.clear());
test("enrollment is idempotent and reaches the student journey", async () => {
  await http.post("/courses/2003/enroll");
  await http.post("/courses/2003/enroll");
  expect(readFrontend().enrolled.filter((id) => id === 2003)).toHaveLength(1);
  expect(
    (await http.get("/my-enrollments")).data.data.some(
      (c: { id: number }) => c.id === 2003,
    ),
  ).toBe(true);
});
test("review writes return the saved review and repeated submissions update it", async () => {
  const first = (
    await http.post("/courses/2001/reviews", { rating: 4, comment: "Useful" })
  ).data;
  expect(first.success).toBe(true);
  expect(first.data.user_id).toBe(99001);
  await http.post("/courses/2001/reviews", { rating: 5, comment: "Updated" });
  const list = (await http.get("/courses/2001/reviews")).data.data.data;
  expect(
    list.filter(
      (r: { id: number; user_id: number; comment: string }) =>
        r.user_id === 99001,
    ),
  ).toHaveLength(1);
  expect(
    list.find(
      (r: { id: number; user_id: number; comment: string }) =>
        r.user_id === 99001,
    ).comment,
  ).toBe("Updated");
  await http.delete(`/courses/2001/reviews/${first.data.id}`);
  expect(readFrontend().reviews.some((r) => r.id === first.data.id)).toBe(
    false,
  );
});
test("unsupported routes fail locally without network access", async () => {
  const xhr = jest.spyOn(XMLHttpRequest.prototype, "open"),
    original = global.fetch;
  global.fetch = jest.fn();
  try {
    await expect(http.get("/unknown")).rejects.toMatchObject({
      code: "LOCAL_NOT_FOUND",
    });
    expect(xhr).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    xhr.mockRestore();
    global.fetch = original;
  }
});
