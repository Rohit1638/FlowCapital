import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "Settings",
};

const integrations = [
  { name: "Supabase Auth", status: "Not connected" },
  { name: "Supabase PostgreSQL", status: "Not connected" },
  { name: "FastAPI / Python", status: "Not connected" },
  { name: "LangGraph agents", status: "Not connected" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Workspace and integrations will appear here."
      />
      <EmptyState
        eyebrow="Integrations"
        title="The shell is ready. The backends are not — by design."
        description="Module 1 keeps identity, data, and agents local. These slots are reserved so later modules can connect without redesigning the product."
        visual={
          <div className="space-y-3">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-3"
              >
                <p className="text-sm">{item.name}</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-lime">{item.status}</p>
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}
