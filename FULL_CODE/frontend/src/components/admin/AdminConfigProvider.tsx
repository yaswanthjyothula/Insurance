"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, fetchFromAPI, postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { AdminConfigView, ChangeResult, HistoryEntry, NeedsConfig, ProductConfig, UnderwritingConfig } from "@/types/admin";

interface ConfigPatch {
  needs?: Partial<NeedsConfig>;
  underwriting?: Partial<UnderwritingConfig>;
}

interface AdminConfigContextValue {
  config: AdminConfigView | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  /** The result of the latest save, for the "live in N ms" badge. */
  lastChange: ChangeResult | null;
  history: HistoryEntry[];
  refresh: () => Promise<void>;
  updateConfig: (patch: ConfigPatch, note?: string) => Promise<ChangeResult>;
  saveProduct: (productId: string, patch: Record<string, unknown>) => Promise<ChangeResult>;
  addProduct: (product: ProductConfig) => Promise<ChangeResult>;
  removeProduct: (productId: string) => Promise<ChangeResult>;
  reset: () => Promise<ChangeResult>;
  rollback: (version: number) => Promise<ChangeResult>;
  reloadFromStorage: () => Promise<void>;
}

const AdminConfigContext = createContext<AdminConfigContextValue | null>(null);

/** Holds the live configuration for every tab. Each save sends the version it was based on, so a stale editor is refused, not merged blindly. */
export function AdminConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AdminConfigView | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastChange, setLastChange] = useState<ChangeResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [view, past] = await Promise.all([
        fetchFromAPI<AdminConfigView>("/admin/config"),
        fetchFromAPI<HistoryEntry[]>("/admin/config/history"),
      ]);
      setConfig(view);
      setHistory(past);
      setError(null);
    } catch (failure) {
      setError(errorMessage(failure, "We couldn't load the configuration."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the first load of the live configuration
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (call: () => Promise<ChangeResult>): Promise<ChangeResult> => {
      setBusy(true);
      try {
        const result = await call();
        setConfig(result.config);
        setLastChange(result);
        void fetchFromAPI<HistoryEntry[]>("/admin/config/history")
          .then(setHistory)
          .catch(() => undefined);
        return result;
      } catch (failure) {
        // A refused update because someone else changed things: show the newest configuration so the editor can start again from it
        if (failure instanceof ApiError && failure.status === 409) void refresh();
        throw failure;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const version = config?.version;
  const value = useMemo<AdminConfigContextValue>(
    () => ({
      config,
      loading,
      error,
      busy,
      lastChange,
      history,
      refresh,
      updateConfig: (patch, note) =>
        run(() =>
          fetchFromAPI<ChangeResult>("/admin/config", {
            method: "PUT",
            body: JSON.stringify({ ...patch, expected_version: version, note }),
          }),
        ),
      saveProduct: (productId, patch) =>
        run(() =>
          fetchFromAPI<ChangeResult>(`/admin/products/${encodeURIComponent(productId)}?expected_version=${version}`, {
            method: "PUT",
            body: JSON.stringify(patch),
          }),
        ),
      addProduct: (product) => run(() => postJSON<ChangeResult>("/admin/products", product)),
      removeProduct: (productId) =>
        run(() => fetchFromAPI<ChangeResult>(`/admin/products/${encodeURIComponent(productId)}`, { method: "DELETE" })),
      reset: () => run(() => postJSON<ChangeResult>("/admin/reset", {})),
      rollback: (target) => run(() => postJSON<ChangeResult>("/admin/config/rollback", { version: target, expected_version: version })),
      reloadFromStorage: async () => {
        await postJSON("/admin/reload", {});
        await refresh();
      },
    }),
    [config, loading, error, busy, lastChange, history, refresh, run, version],
  );

  return <AdminConfigContext.Provider value={value}>{children}</AdminConfigContext.Provider>;
}

export function useAdminConfig(): AdminConfigContextValue {
  const context = useContext(AdminConfigContext);
  if (!context) throw new Error("useAdminConfig must be used inside <AdminConfigProvider>.");
  return context;
}
