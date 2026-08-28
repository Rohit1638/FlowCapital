import type { RiskLevel } from "./asset";

export interface RiskProfile {
  assetId: string;
  level: RiskLevel;
  score: number;
  drivers: string[];
  lastCalculated: string;
}

export interface RiskSnapshot {
  id: string;
  assetId: string;
  score: number;
  level: RiskLevel;
  reason: string;
  timestamp: string;
}

export interface PortfolioRiskSnapshot {
  averageScore: number;
  highRiskAssets: number;
  overleveragedAssets: number;
  concentrationNote: string;
}
