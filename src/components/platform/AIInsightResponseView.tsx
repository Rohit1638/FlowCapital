"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  HelpCircle,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedSection {
  label: string;
  body: string;
  type: "confidence" | "financial" | "action" | "question" | "summary" | "default";
}

function inferSectionType(label: string): ParsedSection["type"] {
  const l = label.toLowerCase();
  if (l.includes("confidence") || l.includes("score")) return "confidence";
  if (l.includes("financial") || l.includes("exposure") || l.includes("financeable") || l.includes("amount")) return "financial";
  if (l.includes("recommend") || l.includes("action") || l.includes("next step")) return "action";
  if (l.includes("question")) return "question";
  if (l.includes("summary") || l.includes("executive")) return "summary";
  if (l.includes("risk") || l.includes("warning") || l.includes("factor") || l.includes("driver")) return "default";
  return "default";
}

function parseAIContent(content: string): { title: string; sections: ParsedSection[] } {
  const blocks = content.trim().split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  let title = "";
  let startIdx = 0;

  if (blocks[0] && !blocks[0].includes("\n") && blocks[0].length < 90) {
    title = blocks[0];
    startIdx = 1;
  }

  const sections: ParsedSection[] = [];

  for (let i = startIdx; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split("\n");

    if (lines.length >= 2 && lines[0].length < 60 && !lines[0].endsWith(".")) {
      const label = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();
      sections.push({ label, body, type: inferSectionType(label) });
      continue;
    }

    const colonIdx = block.indexOf(":");
    if (colonIdx > 0 && colonIdx < 50) {
      const label = block.slice(0, colonIdx).trim();
      const body = block.slice(colonIdx + 1).trim();
      if (body) {
        sections.push({ label, body, type: inferSectionType(label) });
        continue;
      }
    }

    sections.push({ label: "", body: block, type: "default" });
  }

  return { title, sections };
}

function extractConfidence(body: string): number | null {
  const match = body.match(/(\d{1,3})\s*\/\s*100/);
  if (match) return Math.min(100, parseInt(match[1], 10));
  const pct = body.match(/(\d{1,3})\s*%/);
  if (pct) return Math.min(100, parseInt(pct[1], 10));
  return null;
}

function highlightCurrency(text: string, dark: boolean) {
  const parts = text.split(/(₹[\d,]+(?:\.\d+)?)/g);
  return parts.map((part, i) =>
    part.startsWith("₹") ? (
      <span key={i} className={cn("font-semibold", dark ? "text-lime" : "text-lime-deep")}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function sectionIcon(type: ParsedSection["type"]) {
  switch (type) {
    case "confidence":
      return TrendingUp;
    case "financial":
      return CircleDollarSign;
    case "action":
      return Lightbulb;
    case "question":
      return HelpCircle;
    case "summary":
      return Sparkles;
    default:
      return AlertTriangle;
  }
}

function ConfidenceRing({ score, dark }: { score: number; dark: boolean }) {
  const isHigh = score >= 70;
  const isModerate = score >= 40 && score < 70;
  const stroke = isHigh ? "text-lime" : isModerate ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" strokeWidth="4" className={dark ? "stroke-white/10" : "stroke-foreground/10"} stroke="currentColor" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className={stroke}
            stroke="currentColor"
            strokeDasharray={`${(score / 100) * 163.4} 163.4`}
          />
        </svg>
        <span className={cn("font-display text-xl font-bold", dark ? "text-white" : "text-ink")}>{score}</span>
      </div>
      <div>
        <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", dark ? "text-white/45" : "text-muted-foreground")}>
          Confidence score
        </p>
        <p className={cn("mt-0.5 text-sm font-medium", dark ? "text-white/80" : "text-foreground/80")}>
          {score >= 70 ? "Strong position" : score >= 40 ? "Moderate — room to improve" : "Needs attention"}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  dark,
  index,
}: {
  section: ParsedSection;
  dark: boolean;
  index: number;
}) {
  const Icon = sectionIcon(section.type);
  const score = section.type === "confidence" ? extractConfidence(section.body) : null;

  if (section.type === "question") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className={cn(
          "rounded-xl border border-dashed px-4 py-3",
          dark ? "border-white/15 bg-white/[0.03]" : "border-foreground/12 bg-background/50",
        )}
      >
        <p className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", dark ? "text-white/40" : "text-muted-foreground")}>
          Your question
        </p>
        <p className={cn("mt-1 text-sm italic", dark ? "text-white/70" : "text-foreground/70")}>
          {section.body.replace(/^Question:\s*/i, "")}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        "rounded-xl border p-4",
        section.type === "action"
          ? dark
            ? "border-lime/30 bg-lime/[0.06]"
            : "border-lime/40 bg-lime/[0.08]"
          : dark
            ? "border-white/10 bg-white/[0.04]"
            : "border-foreground/8 bg-background/60",
      )}
    >
      {section.label ? (
        <div className="mb-2.5 flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              section.type === "action"
                ? "bg-lime/20 text-lime"
                : dark
                  ? "bg-white/8 text-white/70"
                  : "bg-foreground/5 text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", dark ? "text-white/50" : "text-muted-foreground")}>
            {section.label}
          </p>
        </div>
      ) : null}

      {score !== null ? (
        <ConfidenceRing score={score} dark={dark} />
      ) : (
        <p
          className={cn(
            "text-sm leading-relaxed",
            section.type === "action" ? "font-medium" : "",
            dark ? "text-white/85" : "text-foreground/85",
          )}
        >
          {section.type === "financial" ? highlightCurrency(section.body, dark) : section.body}
        </p>
      )}

      {section.type === "action" ? (
        <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-semibold", dark ? "text-lime" : "text-lime-deep")}>
          <ArrowRight className="h-3.5 w-3.5" />
          Suggested next step
        </div>
      ) : null}
    </motion.div>
  );
}

export function AIInsightResponseView({
  content,
  fallbackUsed,
  provider,
  theme = "light",
}: {
  content: string;
  fallbackUsed: boolean;
  provider: string;
  theme?: "light" | "dark";
}) {
  const dark = theme === "dark";
  const { title, sections } = parseAIContent(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "mt-4 overflow-hidden rounded-2xl border",
        dark ? "border-white/10 bg-ink/80" : "border-foreground/10 bg-surface-2/50",
      )}
    >
      <div className={cn("border-b px-5 py-4", dark ? "border-white/10 bg-white/[0.03]" : "border-foreground/8 bg-white/80")}>
        <div className="flex items-center gap-2">
          <Sparkles className={cn("h-4 w-4", dark ? "text-lime" : "text-lime-deep")} />
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", dark ? "text-white/50" : "text-muted-foreground")}>
            {title || "AI Insight"}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4 md:p-5">
        {sections.map((section, i) => (
          <SectionCard key={`${section.label}-${i}`} section={section} dark={dark} index={i} />
        ))}
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t px-5 py-3",
          dark ? "border-white/10 bg-white/[0.02]" : "border-foreground/8 bg-white/60",
        )}
      >
        {fallbackUsed ? (
          <span className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", dark ? "text-white/35" : "text-muted-foreground")}>
            Deterministic fallback insights
          </span>
        ) : (
          <span className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", dark ? "text-lime/70" : "text-lime-deep")}>
            Powered by {provider}
          </span>
        )}
        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", dark ? "bg-white/8 text-white/40" : "bg-foreground/5 text-muted-foreground")}>
          FlowCapital AI
        </span>
      </div>
    </motion.div>
  );
}
