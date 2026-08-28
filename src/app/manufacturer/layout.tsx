import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";

export default function ManufacturerRootLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
