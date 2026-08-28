"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/platform/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const { login, loginDemo, loading, error, profile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (profile) {
      router.replace(profile.role === "MANUFACTURER" ? "/manufacturer/dashboard" : "/lender/dashboard");
    }
  }, [profile, router]);

  return (
    <AuthLayout title="Sign in" subtitle="Access your manufacturer or lender workspace.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          login(username, password);
        }}
      >
        <label className="block text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Username</span>
          <input
            className="mt-2 w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/20"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Password</span>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full bg-lime text-ink hover:bg-lime/90" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <div className="mt-8 rounded-[1.25rem] border border-foreground/10 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Demo Access</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DemoCard title="Manufacturer" username="manufacturer_demo" password="FlowDemo@123" onUse={() => { setUsername("manufacturer_demo"); setPassword("FlowDemo@123"); }} onEnter={() => loginDemo("MANUFACTURER")} loading={loading} />
          <DemoCard title="Lender" username="lender_demo" password="FlowDemo@123" onUse={() => { setUsername("lender_demo"); setPassword("FlowDemo@123"); }} onEnter={() => loginDemo("LENDER")} loading={loading} />
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-ink underline underline-offset-2">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}

function DemoCard({ title, username, password, onUse, onEnter, loading }: { title: string; username: string; password: string; onUse: () => void; onEnter: () => void; loading: boolean }) {
  return (
    <div className="rounded-xl border border-foreground/10 p-4 text-sm">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{username}</p>
      <p className="font-mono text-xs text-muted-foreground">{password}</p>
      <div className="mt-3 flex flex-col gap-2">
        <button type="button" onClick={onUse} className="text-xs font-semibold text-ink hover:underline">
          Use {title} Demo
        </button>
        <button type="button" onClick={onEnter} disabled={loading} className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          Enter as {title}
        </button>
      </div>
    </div>
  );
}
