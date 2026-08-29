const LAKH = 100_000;
const CRORE = 10_000_000;

export function formatINRCompact(value: number): string {
  return formatCurrencyINR(value);
}

export function formatCurrencyINR(value: number, decimals?: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= CRORE) {
    const crores = abs / CRORE;
    return `${sign}₹${trimNumber(crores, decimals)}Cr`;
  }

  if (abs >= LAKH) {
    const lakhs = abs / LAKH;
    return `${sign}₹${trimNumber(lakhs, decimals)}L`;
  }

  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export function formatINRFull(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatPercent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function padCount(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string, now: Date = new Date()): string {
  const delta = now.getTime() - new Date(value).getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < minute) return "Just now";
  if (delta < hour) {
    const mins = Math.floor(delta / minute);
    return `${mins}m ago`;
  }
  if (delta < day) {
    const hours = Math.floor(delta / hour);
    return `${hours}h ago`;
  }
  const days = Math.floor(delta / day);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return formatDate(value);
}

function trimNumber(value: number, decimals?: number): string {
  if (decimals !== undefined) {
    return value.toFixed(decimals);
  }
  const formatted = value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return formatted;
}

export { LAKH, CRORE };
