import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ShellProvider } from "@/components/layout/ShellProvider";
import { TopBar } from "@/components/layout/TopBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CloudConnectionProvider } from "@/lib/data/connection";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <CloudConnectionProvider>
        <TooltipProvider>
          <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar />
              <main className="w-full flex-1 px-4 py-6 md:px-8 md:py-8 xl:px-10">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </CloudConnectionProvider>
    </ShellProvider>
  );
}
