import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
