import Link from "next/link";
import { ArrowRight, ClipboardList, FileSearch, Sparkles } from "lucide-react";

interface LenderResourceCardsProps {
  pendingDocuments: number;
  pendingDecisions: number;
  aiReady?: boolean;
}

export function LenderResourceCards({ pendingDocuments, pendingDecisions, aiReady = true }: LenderResourceCardsProps) {
  const items = [
    {
      title: "Document review",
      description: "Review submitted financing evidence",
      stat: `${pendingDocuments} pending`,
      href: "/lender/opportunities",
      cta: "Open",
      icon: FileSearch,
    },
    {
      title: "Decision queue",
      description: "Financing requests requiring action",
      stat: `${String(pendingDecisions).padStart(2, "0")} pending`,
      href: "/lender/opportunities",
      cta: "Review",
      icon: ClipboardList,
    },
    {
      title: "AI intelligence",
      description: "Risk & confidence analysis",
      stat: aiReady ? "AI ready" : "Offline",
      href: "/lender/ai-assistant",
      cta: "Open",
      icon: Sparkles,
    },
  ];

  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Resources</p>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group flex min-h-[132px] flex-col justify-between rounded-[1.125rem] border border-foreground/10 bg-white p-5 transition hover:border-lime/50 hover:shadow-sm"
          >
            <div>
              <div className="mb-3 flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-lime-deep" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="font-display text-lg font-semibold">{item.stat}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-lime-deep">
                {item.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
