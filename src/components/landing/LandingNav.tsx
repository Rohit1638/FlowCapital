"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/shared/Logo";

export function LandingNav() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
      <Link href="/" aria-label="FlowCapital AI home">
        <BrandWordmark />
      </Link>
      <div className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
        <a href="#how-it-works" className="hover:text-ink">
          How it works
        </a>
        <a href="#memory" className="hover:text-ink">
          Financial memory
        </a>
        <Link href="/login" className="hover:text-ink">
          Platform Login
        </Link>
        <Link href="/dashboard" className="hover:text-ink">
          Command Center
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
          <Link href="/login">Manufacturer / Lender</Link>
        </Button>
        <Button asChild variant="dark" size="sm">
          <Link href="/dashboard">Command Center</Link>
        </Button>
      </div>
    </header>
  );
}
