"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Factory, Menu, Search, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { MobileSidebar } from "@/components/layout/AppSidebar";
import { useShell } from "@/components/layout/ShellProvider";
import { currentUser } from "@/lib/mock-data";
import { getNavItem } from "@/lib/navigation";

export function TopBar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useShell();
  const [searchOpen, setSearchOpen] = useState(false);
  const nav = getNavItem(pathname);
  const isAssetDetail = pathname.startsWith("/assets/");
  const isEventDetail = pathname.startsWith("/events/") && pathname !== "/events";
  const isDecisionDetail = pathname.startsWith("/decisions/") && pathname !== "/decisions";
  const isIntelligenceDetail = pathname.startsWith("/intelligence/") && pathname !== "/intelligence";
  const eyebrow = isAssetDetail
    ? "Asset Intelligence / Twin"
    : isEventDetail
      ? "Event Intelligence / Trace"
      : isDecisionDetail
        ? "Capital Decision / Asset"
        : isIntelligenceDetail
          ? "Portfolio Intelligence / Asset"
          : nav?.label ?? "FlowCapital";
  const heading = isAssetDetail || isEventDetail || isDecisionDetail || isIntelligenceDetail
    ? pathname.split("/").pop()
    : nav?.label ?? "Command Center";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-foreground/8 bg-[#f4f4f0]/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <p className="truncate font-display text-lg font-semibold tracking-tight">
            {heading}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              placeholder="Search assets, stages, events"
              className="hidden w-56 sm:flex"
            />
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)} aria-label="Close search">
              <X />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search />
          </Button>
        )}
        <div className="hidden items-center rounded-full border border-foreground/10 bg-white px-3 py-1.5 sm:flex">
          <LiveIndicator />
        </div>
        <ConnectionStatus />
        <Button asChild variant="lime" size="sm" className="hidden md:inline-flex">
          <Link href="/login">
            <Factory className="h-4 w-4" />
            Platform
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime" />
        </Button>
        <Avatar>
          <AvatarFallback>{currentUser.initials}</AvatarFallback>
        </Avatar>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <MobileSidebar />
        </SheetContent>
      </Sheet>
    </header>
  );
}
