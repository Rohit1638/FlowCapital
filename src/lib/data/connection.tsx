"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Asset } from "@/types/asset";
import { getHealth } from "@/lib/api/health";
import { apiAssetRepository } from "@/lib/data/api-asset-repository";
import { demoAssetRepository } from "@/lib/data/demo-asset-repository";
import type { ConnectionMode } from "@/lib/data/types";

interface ConnectionState {
  mode: ConnectionMode;
  cloudAssets: Asset[] | null;
}

const ConnectionContext = createContext<ConnectionState>({ mode: "checking", cloudAssets: null });

async function probe(): Promise<ConnectionState> {
  try {
    const health = await getHealth();
    if (health.status !== "healthy" || health.database !== "connected") {
      return { mode: "demo", cloudAssets: null };
    }
    const assets = await apiAssetRepository.getAssets();
    if (assets.length === 0) {
      const demo = await demoAssetRepository.getAssets();
      return { mode: "demo", cloudAssets: demo };
    }
    return { mode: "cloud", cloudAssets: assets };
  } catch {
    return { mode: "demo", cloudAssets: null };
  }
}

export function CloudConnectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConnectionState>({ mode: "checking", cloudAssets: null });

  useEffect(() => {
    let active = true;
    const run = async () => {
      const next = await probe();
      if (active) setState(next);
    };
    void run();
    const timer = window.setInterval(() => {
      void run();
    }, 20000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): ConnectionState {
  return useContext(ConnectionContext);
}

export function useCloudAssetBase(): Asset[] | null {
  const { mode, cloudAssets } = useConnection();
  if (mode !== "cloud" || !cloudAssets || cloudAssets.length === 0) return null;
  return cloudAssets;
}
