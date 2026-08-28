"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandWordmark } from "@/components/shared/Logo";
import { useShell } from "@/components/layout/ShellProvider";
import { appNav } from "@/lib/navigation";
import { sidebarSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3">
      {appNav.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
              collapsed && "justify-center px-0",
              active ? "text-ink" : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-2xl bg-lime"
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              />
            ) : null}
            <Icon className="relative z-10 h-4 w-4 shrink-0" />
            {!collapsed ? (
              <span className="relative z-10 font-medium">{item.label}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const { collapsed, setCollapsed } = useShell();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={sidebarSpring}
      className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-ink text-white lg:flex"
    >
      <div className="flex h-[72px] items-center justify-between px-4">
        <Link href="/dashboard" className="min-w-0">
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
      <NavList collapsed={collapsed} />
      <div className="mt-auto border-t border-white/8 p-4">
        <p className={cn("text-[11px] leading-5 text-white/35", collapsed && "sr-only")}>
          Intelligence that moves with every asset.
        </p>
      </div>
    </motion.aside>
  );
}

export function MobileSidebar() {
  const { setMobileOpen } = useShell();

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex h-[72px] items-center px-4">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <BrandWordmark inverted />
        </Link>
      </div>
      <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
    </div>
  );
}
