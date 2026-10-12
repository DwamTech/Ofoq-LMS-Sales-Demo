import type { User } from "@/utils/authService";
import { readFrontend } from "./frontendStore";

export const isLocalPreview = true;

export function localPreviewUser(persona?: "student" | "admin"): User {
  const role =
    persona ??
    (typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin")
      ? "admin"
      : "student");
  const user = readFrontend().users.find(
    (user) => user.id === (role === "admin" ? 99002 : 99001),
  );
  return {
    ...user,
    id: role === "admin" ? 99002 : 99001,
    name: user?.name ?? "مستخدم محلي",
    email: user?.email ?? `${role}@preview.local`,
    profile_picture: user?.profile_picture,
    role,
  };
}
