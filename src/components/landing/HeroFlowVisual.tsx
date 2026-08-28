"use client";

import { motion } from "framer-motion";

const nodes = [
  { label: "PO", x: 42, y: 38 },
  { label: "RAW MATERIAL", x: 168, y: 78 },
  { label: "PRODUCTION", x: 78, y: 148 },
  { label: "FINISHED", x: 214, y: 188 },
  { label: "IN TRANSIT", x: 96, y: 258 },
  { label: "INVOICE", x: 210, y: 312 },
  { label: "CASH", x: 84, y: 368 },
];

export function HeroFlowVisual() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-foreground/10 bg-white p-5 shadow-[0_20px_60px_rgba(23,24,31,0.06)] md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Digital Asset Twin
        </p>
        <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-lime">
          Live path
        </span>
      </div>
      <svg viewBox="0 0 320 430" className="h-auto w-full" fill="none">
        <path
          d="M42 38 C 90 38, 140 78, 168 78 S 90 140, 78 148 S 190 180, 214 188 S 110 240, 96 258 S 200 300, 210 312 S 110 360, 84 368"
          stroke="#17181F"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.28"
        />
        <motion.path
          d="M42 38 C 90 38, 140 78, 168 78 S 90 140, 78 148 S 190 180, 214 188 S 110 240, 96 258 S 200 300, 210 312 S 110 360, 84 368"
          stroke="#B9FF66"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="12 160"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -180 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
        {nodes.map((node, index) => (
          <g key={node.label}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={index === 4 || index === 6 ? 9 : 6}
              fill={index === 4 || index === 6 ? "#B9FF66" : "#17181F"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 * index, duration: 0.4 }}
            />
            <text
              x={node.x + 16}
              y={node.y + 4}
              fill="#17181F"
              fontSize="11"
              fontFamily="var(--font-syne), sans-serif"
              fontWeight="700"
              letterSpacing="0.08em"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <p>Physical asset</p>
        <p>Supply-chain events</p>
        <p>Risk intelligence</p>
        <p>Financing decisions</p>
      </div>
    </div>
  );
}
