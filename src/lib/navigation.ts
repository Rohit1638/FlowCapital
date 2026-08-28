import {
  Activity,
  Bell,
  Boxes,
  Cable,
  Factory,
  LayoutDashboard,
  Scale,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Split,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const appNav: NavItem[] = [
  {
    href: "/login",
    label: "Platform",
    icon: Factory,
    description: "Manufacturer & lender workspaces — production financing, underwriting, AI assistants.",
  },
  {
    href: "/dashboard",
    label: "Command Center",
    icon: LayoutDashboard,
    description: "Your supply-chain capital, continuously in motion.",
  },
  {
    href: "/assets",
    label: "Asset Intelligence",
    icon: Boxes,
    description: "Every physical asset. One continuous financial memory.",
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: Cable,
    description: "Every supply-chain signal enters one intelligence layer.",
  },
  {
    href: "/events",
    label: "Event Intelligence",
    icon: Activity,
    description: "Every asset movement becomes a trusted financial signal.",
  },
  {
    href: "/intelligence",
    label: "Portfolio Intelligence",
    icon: Sparkles,
    description: "See where capital can move safely across the supply chain.",
  },
  {
    href: "/decisions",
    label: "Decisions",
    icon: Scale,
    description: "Prioritize the assets where trusted evidence supports the strongest financing decisions.",
  },
  {
    href: "/allocation",
    label: "Allocation",
    icon: Split,
    description: "See how available capital can be deployed across trusted supply-chain assets.",
  },
  {
    href: "/simulator",
    label: "What-If Simulator",
    icon: SlidersHorizontal,
    description: "See how operational changes impact value, risk, and financing.",
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: Bell,
    description: "Live operational and credit alerts will appear here.",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Workspace and integrations will appear here.",
  },
];

export function getNavItem(pathname: string): NavItem | undefined {
  if (pathname.startsWith("/assets/")) {
    return appNav.find((item) => item.href === "/assets");
  }
  if (pathname.startsWith("/events")) {
    return appNav.find((item) => item.href === "/events");
  }
  if (pathname.startsWith("/intelligence")) {
    return appNav.find((item) => item.href === "/intelligence");
  }
  if (pathname.startsWith("/decisions")) {
    return appNav.find((item) => item.href === "/decisions");
  }
  if (pathname.startsWith("/allocation")) {
    return appNav.find((item) => item.href === "/allocation");
  }
  if (pathname.startsWith("/simulator")) {
    return appNav.find((item) => item.href === "/simulator");
  }
  if (pathname.startsWith("/financing")) {
    return appNav.find((item) => item.href === "/decisions");
  }
  return appNav.find((item) => item.href === pathname);
}
