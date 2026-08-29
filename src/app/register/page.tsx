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
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (raw.trim().startsWith("+")) return raw.trim();
    return raw.trim();
  };

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
          setFormError(null);
          if (password.length < 8) {
            setFormError("Password must be at least 8 characters.");
            return;
          }
          if (password !== confirmPassword) {
            setFormError("Passwords do not match.");
            return;
          }
          register({
            username,
            password,
            confirm_password: confirmPassword,
            role,
            company_name: companyName,
            phone: normalizePhone(phone),
          });
        }}
      >
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" />
        <Field label="Password" value={password} onChange={setPassword} type="password" autoComplete="new-password" />
        <Field
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
          autoComplete="new-password"
        />
        <Field label="Company Name" value={companyName} onChange={setCompanyName} autoComplete="organization" />
        <Field
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          type="tel"
          autoComplete="tel"
          placeholder="+919876543210"
          hint="E.164 format for SMS alerts (e.g. +919876543210)"
        />
        {(formError || error) ? <p className="text-sm text-destructive">{formError ?? error}</p> : null}
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
