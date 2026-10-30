"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import {
  Activity,
  ChevronDown,
  History,
  LogOut,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Package,
  BarChart3,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminConfigProvider, useAdminConfig } from "@/components/admin/AdminConfigProvider";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { CrmTab } from "@/components/admin/CrmTab";
import { NeedsTab } from "@/components/admin/NeedsTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { UnderwritingTab } from "@/components/admin/UnderwritingTab";
import { AdvisorMotion } from "@/components/advisor/motion";
import { Skeleton } from "@/components/advisor/dashboard/parts";
import { ShieldIcon } from "@/components/brand/Logo";
import { errorMessage } from "@/lib/error-message";
import { formatIst } from "@/lib/time";

const TABS = [
  { id: "needs", label: "Needs analysis", icon: SlidersHorizontal },
  { id: "products", label: "Products & rates", icon: Package },
  { id: "underwriting", label: "Underwriting & test", icon: ShieldCheck },
  { id: "analytics", label: "Analytics & leads", icon: BarChart3 },
  { id: "crm", label: "CRM", icon: Users },
] as const;
type TabId = (typeof TABS)[number]["id"];

function ConfigBar() {
  const { config, lastChange, history, busy, reset, rollback, reloadFromStorage } = useAdminConfig();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  if (!config) return null;

  const run = async (call: () => Promise<unknown>, ok: string) => {
    setNote(null);
    try {
      await call();
      setNote({ ok: true, text: ok });
    } catch (failure) {
      setNote({ ok: false, text: errorMessage(failure, "That didn't work.") });
    } finally {
      setConfirmReset(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
        <Activity className="h-3.5 w-3.5 text-[#7CF2C3]" aria-hidden="true" />
        Live configuration v{config.version}
        <span className="font-medium text-white/60">· {formatIst(config.updated_at)}</span>
      </span>
      {lastChange && (
        <span role="status" className="text-xs font-semibold text-[#7CF2C3]">
          v{lastChange.version} active in {lastChange.activation_ms.toFixed(2)} ms (saved in {lastChange.persisted_ms.toFixed(1)} ms)
        </span>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" /> History <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
          <AnimatePresence>
            {showHistory && (
              <m.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-[calc(100%+8px)] z-40 w-[22rem] max-w-[90vw] rounded-2xl border border-[#E8E5F0] bg-white p-2 text-[#0E1330] shadow-2xl"
              >
                <p className="m-0 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#8A849A]">Recent versions</p>
                <ul className="m-0 max-h-72 list-none overflow-y-auto p-0">
                  {history.length === 0 && <li className="px-3 py-3 text-sm text-[#6F6A7C]">No changes yet.</li>}
                  {history.map((h) => (
                    <li key={h.version} className="flex items-start gap-2 rounded-xl px-3 py-2 hover:bg-[#F8F7FC]">
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm font-bold">
                          v{h.version} <span className="font-normal text-[#6F6A7C]">· {h.summary}</span>
                        </p>
                        <p className="m-0 truncate text-xs text-[#8A849A]">
                          {formatIst(h.at)} · {h.actor.split("@")[0]} · {h.changed_fields.length} change
                          {h.changed_fields.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      {h.version !== config.version && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => rollback(h.version), `Rolled back to the settings of version ${h.version}.`)}
                          className="shrink-0 rounded-lg border border-[#D9D3E8] px-2 py-1 text-xs font-bold text-[#3D55E0] hover:border-[#3D55E0]"
                        >
                          Roll back
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(reloadFromStorage, "Reloaded from storage.")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Reload
        </button>
        {confirmReset ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-white">
            Restore every default?
            <button
              type="button"
              disabled={busy}
              onClick={() => run(reset, "Restored the factory defaults.")}
              className="rounded-lg bg-rose-500 px-2 py-1 text-white hover:bg-rose-600"
            >
              Yes, reset
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="text-white/70 hover:text-white">
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/40 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/15"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset to factory defaults
          </button>
        )}
      </div>
      {note && (
        <p
          role={note.ok ? "status" : "alert"}
          className={`m-0 w-full text-xs font-semibold ${note.ok ? "text-[#7CF2C3]" : "text-rose-300"}`}
        >
          {note.text}
        </p>
      )}
    </div>
  );
}

function Console() {
  const { config, loading, error, refresh } = useAdminConfig();
  const [tab, setTab] = useState<TabId>("needs");
  const { signOut, user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F4F5FB]">
      <header className="bg-[#070B22] text-white">
        <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShieldIcon className="h-14 w-auto shrink-0 drop-shadow-[0_0_14px_rgba(121,87,255,0.5)]" />
            <div className="leading-tight">
              <p className="m-0 text-lg font-extrabold tracking-tight">LifeSure AI · Admin console</p>
              <p className="m-0 text-xs text-white/60">Rules and rates apply live. No restart.</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/" className="hidden text-xs font-semibold text-white/70 hover:text-white sm:block">
                Customer site
              </Link>
              <span className="hidden text-xs text-white/60 sm:block">{user?.user_metadata.full_name}</span>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  router.replace("/admin-sign-in");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/10"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
              </button>
            </div>
          </div>
          <ConfigBar />
        </div>
        <nav aria-label="Console sections" className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div role="tablist" className="flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-bold transition-colors ${tab === id ? "bg-[#F4F5FB] text-[#0E1330]" : "text-white/65 hover:text-white"}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div role="alert" className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="m-0 text-sm font-semibold text-rose-800">{error}</p>
            <button type="button" onClick={() => void refresh()} className="rounded-xl bg-[#0E1330] px-4 py-2 text-sm font-bold text-white">
              Try again
            </button>
          </div>
        ) : loading || !config ? (
          <div role="status" aria-label="Loading configuration" className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <m.div
            key={tab}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "needs" && <NeedsTab />}
            {tab === "products" && <ProductsTab />}
            {tab === "underwriting" && <UnderwritingTab />}
            {tab === "analytics" && <AnalyticsTab />}
            {tab === "crm" && <CrmTab />}
          </m.div>
        )}
      </main>
    </div>
  );
}

export function AdminShell() {
  return (
    // data-no-reveal keeps the customer site's scroll-reveal script away from this area, which animates itself
    <div data-no-reveal>
      <AdvisorMotion>
        <AdminConfigProvider>
          <Console />
        </AdminConfigProvider>
      </AdvisorMotion>
    </div>
  );
}
