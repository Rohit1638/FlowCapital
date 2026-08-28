export const DECISIONS_STORAGE_KEY = "flowcapital.decisions.v1";

export interface DecisionPrefs {
  availableCapital: number;
  strategy: "BALANCED" | "MAXIMIZE_SAFE_DEPLOYMENT" | "LOWEST_RISK_FIRST" | "HIGHEST_OPPORTUNITY_FIRST";
  showUnlockedComparison: boolean;
}

export const DEFAULT_DECISION_PREFS: DecisionPrefs = {
  availableCapital: 10_000_000,
  strategy: "BALANCED",
  showUnlockedComparison: false,
};

export function readDecisionPrefs(): DecisionPrefs {
  if (typeof window === "undefined") return DEFAULT_DECISION_PREFS;
  try {
    const raw = window.localStorage.getItem(DECISIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_DECISION_PREFS;
    const parsed = JSON.parse(raw) as Partial<DecisionPrefs>;
    return {
      availableCapital:
        typeof parsed.availableCapital === "number" && parsed.availableCapital >= 0
          ? parsed.availableCapital
          : DEFAULT_DECISION_PREFS.availableCapital,
      strategy: parsed.strategy ?? DEFAULT_DECISION_PREFS.strategy,
      showUnlockedComparison: Boolean(parsed.showUnlockedComparison),
    };
  } catch {
    return DEFAULT_DECISION_PREFS;
  }
}

export function writeDecisionPrefs(prefs: DecisionPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("storage"));
}

export function clearDecisionPrefs() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DECISIONS_STORAGE_KEY);
  window.dispatchEvent(new Event("storage"));
}
