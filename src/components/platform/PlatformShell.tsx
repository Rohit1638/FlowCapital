"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Factory, Landmark, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

const manufacturerNav = [
  { href: "/manufacturer/dashboard", label: "Overview", match: "exact" as const },
  { href: "/manufacturer/production-plans", label: "Production Plans", match: "production-plans" as const },
  { href: "/manufacturer/financing-request", label: "Financing Request", match: "exact" as const },
  { href: "/manufacturer/ai-assistant", label: "AI Assistant", match: "prefix" as const },
];

const lenderNav = [
  { href: "/lender/dashboard", label: "Overview", match: "exact" as const },
  { href: "/lender/opportunities", label: "Financing Requests", match: "opportunities" as const },
  { href: "/lender/opportunities/demo/decision", label: "Decision Workspace", match: "decision-demo" as const },
  { href: "/lender/ai-assistant", label: "AI Assistant", match: "ai" as const },
];

function isManufacturerNavActive(pathname: string, item: (typeof manufacturerNav)[number]): boolean {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "prefix") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`) || pathname.startsWith("/manufacturer/assistant");
  }
  if (item.match === "production-plans") {
    return (
      pathname.startsWith("/manufacturer/production-plans") ||
      (pathname.startsWith("/manufacturer/requests/") && !pathname.endsWith("/demo") && pathname !== "/manufacturer/requests/new") ||
      pathname === "/manufacturer/requests"
    );
  }
  return false;
}

function isLenderNavActive(pathname: string, item: (typeof lenderNav)[number]): boolean {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "opportunities") {
    return pathname === "/lender/opportunities" || (pathname.startsWith("/lender/opportunities/") && !pathname.endsWith("/decision"));
  }
  if (item.match === "decision-demo") {
    return pathname.includes("/decision");
  }
  if (item.match === "ai") {
    return pathname.startsWith("/lender/ai-assistant") || pathname.startsWith("/lender/assistant");
  }
  return false;
}

export function PlatformShell({ role, children }: { role: "MANUFACTURER" | "LENDER"; children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const nav = role === "MANUFACTURER" ? manufacturerNav : lenderNav;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[17rem] shrink-0 flex-col border-r border-foreground/10 bg-ink text-white lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
            FlowCapital<span className="text-lime">.</span>
          </Link>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/50">
            {role === "MANUFACTURER" ? "Manufacturer Portal" : "Lender Portal"}
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active =
              role === "MANUFACTURER"
                ? isManufacturerNavActive(pathname, item as (typeof manufacturerNav)[number])
                : isLenderNavActive(pathname, item as (typeof lenderNav)[number]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl px-4 py-3 text-sm font-medium transition",
                  active ? "bg-lime text-ink" : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-ink">
              {role === "MANUFACTURER" ? <Factory className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile?.full_name}</p>
              <p className="truncate text-xs text-white/50">{profile?.organization_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-foreground/10 bg-white/70 px-4 py-4 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Module 6A</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {role === "MANUFACTURER" ? "Production & Financing Command" : "Underwriting & Monitoring"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden rounded-full border border-foreground/10 px-4 py-2 text-sm md:inline-flex">
              Legacy Intelligence
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full bg-lime/30 px-3 py-1.5 text-xs font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5" />
              AI-assisted · Deterministic finance
            </span>
            <button type="button" className="rounded-full border border-foreground/10 p-2">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
