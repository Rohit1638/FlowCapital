"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Building2, Landmark, Loader2, Lock, User } from "lucide-react";
import { AuthLayout } from "@/components/platform/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

function LoginForm() {
  const { login, loginDemo, loading, error, profile, clearSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const fromPortal = searchParams.get("portal") === "1";

  useEffect(() => {
    if (fromPortal) {
      clearSession();
    }
  }, [fromPortal, clearSession]);

  return (
    <AuthLayout title="Sign in" subtitle="Access your financing workspace with secure credentials.">
      {!fromPortal && profile ? (
        <div className="mb-5 rounded-xl border border-lime/25 bg-lime/5 px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Signed in as <span className="font-semibold text-ink">{profile.full_name}</span>
          </p>
          <button
            type="button"
            className="mt-2 font-semibold text-lime-deep hover:underline"
            onClick={() =>
              router.push(profile.role === "MANUFACTURER" ? "/manufacturer/dashboard" : "/lender/dashboard")
            }
          >
            Continue to {profile.role === "MANUFACTURER" ? "manufacturer" : "lender"} portal →
          </button>
        </div>
      ) : null}

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          login(username, password);
        }}
      >
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Username</span>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full rounded-xl border border-foreground/12 bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-lime focus:ring-2 focus:ring-lime/15"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Enter username"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Password</span>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              className="w-full rounded-xl border border-foreground/12 bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-lime focus:ring-2 focus:ring-lime/15"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter password"
            />
          </div>
        </label>
        {error ? (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full bg-lime py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-lime/90" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 border-t border-foreground/8 pt-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick demo access</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => loginDemo("MANUFACTURER")}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-foreground/10 py-3 text-xs font-semibold transition hover:border-lime/40 hover:bg-lime/5 disabled:opacity-50"
          >
            <Building2 className="h-4 w-4 text-muted-foreground transition group-hover:text-lime-deep" />
            Manufacturer
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => loginDemo("LENDER")}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-foreground/10 py-3 text-xs font-semibold transition hover:border-lime/40 hover:bg-lime/5 disabled:opacity-50"
          >
            <Landmark className="h-4 w-4 text-muted-foreground transition group-hover:text-lime-deep" />
            Lender
          </button>
        </div>
        <p className="mt-2.5 text-center text-[10px] text-muted-foreground">manufacturer_demo / lender_demo · FlowDemo@123</p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-semibold text-ink hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLayout title="Sign in" subtitle="Loading…"><p className="text-center text-sm text-muted-foreground">Loading…</p></AuthLayout>}>
      <LoginForm />
    </Suspense>
  );
}
