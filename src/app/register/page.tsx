"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/platform/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/types/platform";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const [role, setRole] = useState<UserRole>("MANUFACTURER");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");

  return (
    <AuthLayout title="Create account" subtitle="Join FlowCapital as a manufacturer or lender.">
      <div className="mb-6 flex gap-2">
        {(["MANUFACTURER", "LENDER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "flex-1 rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition",
              role === r ? "border-ink bg-ink text-white" : "border-foreground/10 text-muted-foreground",
            )}
          >
            {r === "MANUFACTURER" ? "Manufacturer" : "Lender"}
          </button>
        ))}
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          register({ username, password, confirm_password: confirmPassword, role, company_name: companyName });
        }}
      >
        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        <Field label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
        <Field label="Company Name" value={companyName} onChange={setCompanyName} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full bg-lime text-ink hover:bg-lime/90" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input
        type={type}
        className="mt-2 w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
