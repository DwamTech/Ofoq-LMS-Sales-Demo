import type { ReactNode } from "react";
import StudentWorkspace from "@/components/student/StudentWorkspace";
export default function UserLayout({ children }: { children: ReactNode }) {
  return <StudentWorkspace>{children}</StudentWorkspace>;
}
