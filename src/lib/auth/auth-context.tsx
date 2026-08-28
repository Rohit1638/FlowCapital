"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { platformFetch } from "@/lib/platform/client";
import type { PlatformProfile, UserRole } from "@/types/platform";

const STORAGE_KEY = "flowcapital-auth";

interface AuthState {
  token: string;
  profile: PlatformProfile;
}

interface AuthContextValue {
  profile: PlatformProfile | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: { username: string; password: string; confirm_password: string; role: UserRole; company_name?: string }) => Promise<void>;
  loginDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

function persistAndRoute(state: AuthState, router: ReturnType<typeof useRouter>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  router.push(state.profile.role === "MANUFACTURER" ? "/manufacturer/dashboard" : "/lender/dashboard");
}

function demoRoleForUsername(username: string): UserRole | null {
  const key = username.trim().toLowerCase();
  if (key === "manufacturer_demo") return "MANUFACTURER";
  if (key === "lender_demo") return "LENDER";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(readStored());
    setLoading(false);
  }, []);

  const applySession = useCallback(
    (next: AuthState) => {
      setState(next);
      persistAndRoute(next, router);
    },
    [router],
  );

  const loginWithDemoToken = useCallback(
    async (role: UserRole) => {
      const result = await platformFetch<{ access_token: string; profile: PlatformProfile }>("/auth/demo-login", {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      applySession({ token: result.access_token, profile: result.profile });
    },
    [applySession],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await platformFetch<{ access_token: string; profile: PlatformProfile }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        applySession({ token: result.access_token, profile: result.profile });
      } catch (err) {
        const demoRole = demoRoleForUsername(username);
        if (demoRole && password === "FlowDemo@123") {
          try {
            await loginWithDemoToken(demoRole);
            return;
          } catch {
            // fall through to error below
          }
        }
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setError("Invalid username or password.");
          } else if (err.status === 0) {
            setError("Cannot reach the backend. Start it on port 8030 and refresh this page.");
          } else {
            setError(err.message);
          }
        } else {
          setError("Unable to sign in. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [applySession, loginWithDemoToken],
  );

  const register = useCallback(
    async (payload: { username: string; password: string; confirm_password: string; role: UserRole; company_name?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await platformFetch<{ access_token: string; profile: PlatformProfile }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        applySession({ token: result.access_token, profile: result.profile });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [applySession],
  );

  const loginDemo = useCallback(
    async (role: UserRole) => {
      setLoading(true);
      setError(null);
      try {
        await loginWithDemoToken(role);
      } catch {
        await login(role === "MANUFACTURER" ? "manufacturer_demo" : "lender_demo", "FlowDemo@123");
      } finally {
        setLoading(false);
      }
    },
    [login, loginWithDemoToken],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(null);
    router.push("/login");
  }, [router]);

  const authHeaders = useCallback((): Record<string, string> => {
    if (!state?.token) return {};
    return { Authorization: `Bearer ${state.token}` };
  }, [state?.token]);

  const value = useMemo(
    () => ({
      profile: state?.profile ?? null,
      token: state?.token ?? null,
      loading,
      login,
      register,
      loginDemo,
      logout,
      authHeaders,
      error,
    }),
    [state, loading, login, register, loginDemo, logout, authHeaders, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireRole(role: UserRole) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.profile) {
      router.replace("/login");
      return;
    }
    if (auth.profile.role !== role) {
      router.replace(auth.profile.role === "MANUFACTURER" ? "/manufacturer/dashboard" : "/lender/dashboard");
    }
  }, [auth.loading, auth.profile, role, router]);

  return auth;
}
