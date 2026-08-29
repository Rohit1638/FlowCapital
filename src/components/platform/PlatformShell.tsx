"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Bell,
  ClipboardList,
  Factory,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Scale,
  Sparkles,
  RefreshCw,
  Activity,
} from "lucide-react";
import { BrandWordmark } from "@/components/shared/Logo";
import { useAuth } from "@/lib/auth/auth-context";
import { DEMO_REQUEST_ID } from "@/lib/platform/demo-fallback";
import { sidebarSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const manufacturerNav = [
  { href: "/manufacturer/dashboard", label: "Overview", icon: LayoutDashboard, match: "exact" as const },
  { href: "/manufacturer/production-plans", label: "Production Plans", icon: ClipboardList, match: "production-plans" as const },
  { href: "/manufacturer/financing-request", label: "Financing Request", icon: Banknote, match: "exact" as const },
  { href: "/manufacturer/simulator", label: "Simulation", icon: Play, match: "simulator-mfg" as const },
  { href: "/manufacturer/ai-assistant", label: "AI Assistant", icon: Sparkles, match: "prefix" as const },
];

const lenderNav = [
  { href: "/lender/dashboard", label: "Overview", icon: LayoutDashboard, match: "exact" as const },
  { href: "/lender/opportunities", label: "Financing Requests", icon: FileText, match: "opportunities" as const },
  { href: "/lender/transitions", label: "Transitions", icon: RefreshCw, match: "transitions" as const },
  { href: "/lender/reassessments", label: "Reassessments", icon: Activity, match: "reassessments" as const },
  { href: `/lender/opportunities/${DEMO_REQUEST_ID}/decision`, label: "Decision Workspace", icon: Scale, match: "decision-demo" as const },
  { href: "/lender/simulator", label: "Simulation", icon: Play, match: "simulator-lender" as const },
  { href: "/lender/ai-assistant", label: "AI Assistant", icon: Sparkles, match: "ai" as const },
];

function isManufacturerNavActive(pathname: string, item: (typeof manufacturerNav)[number]): boolean {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "prefix") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  if (item.match === "production-plans") {
    return pathname.startsWith("/manufacturer/production-plans");
  }
  if (item.match === "simulator-mfg") {
    return pathname.startsWith("/manufacturer/simulator");
  }
  return false;
}

function isLenderNavActive(pathname: string, item: (typeof lenderNav)[number]): boolean {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "opportunities") {
    return pathname === "/lender/opportunities" || (pathname.startsWith("/lender/opportunities/") && !pathname.endsWith("/decision"));
  }
  if (item.match === "transitions") {
    return pathname.startsWith("/lender/transitions");
  }
  if (item.match === "reassessments") {
    return pathname.startsWith("/lender/reassessments");
  }
  if (item.match === "decision-demo") {
    return pathname.includes("/decision");
  }
  if (item.match === "ai") {
    return pathname.startsWith("/lender/ai-assistant");
  }
  if (item.match === "simulator-lender") {
    return pathname.startsWith("/lender/simulator");
  }
  return false;
}

export function PlatformShell({ role, children }: { role: "MANUFACTURER" | "LENDER"; children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const nav = role === "MANUFACTURER" ? manufacturerNav : lenderNav;
  const homeHref = role === "MANUFACTURER" ? "/manufacturer/dashboard" : "/lender/dashboard";

  return (
    <div className="flex min-h-screen bg-background">
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={sidebarSpring}
        className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-ink text-white lg:flex"
      >
        <div className="flex h-[72px] items-center justify-between px-4">
          <Link href={homeHref} className="min-w-0">
            <BrandWordmark inverted compact={collapsed} />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/8 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <div className="px-4 pb-4">
          <p className={cn("text-[10px] uppercase tracking-[0.22em] text-white/30", collapsed && "sr-only")}>
            Intelligence desk
          </p>
        </div>

        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => {
            const active =
              role === "MANUFACTURER"
                ? isManufacturerNavActive(pathname, item as (typeof manufacturerNav)[number])
                : isLenderNavActive(pathname, item as (typeof lenderNav)[number]);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  collapsed && "justify-center px-0",
                  active ? "text-ink" : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId={`platform-nav-active-${role}`}
                    className="absolute inset-0 rounded-2xl bg-lime"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4 shrink-0" />
                {!collapsed ? <span className="relative z-10">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className={cn("mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3", collapsed && "justify-center p-2")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
              {role === "MANUFACTURER" ? <Factory className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{profile?.full_name}</p>
                <p className="truncate text-xs text-white/50">{profile?.organization_name}</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5",
              collapsed && "px-2",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? "Sign out" : null}
          </button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-foreground/10 bg-white/70 px-4 py-4 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Module 6A</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {role === "MANUFACTURER" ? "Production & Financing Command" : "Underwriting & Monitoring"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
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
