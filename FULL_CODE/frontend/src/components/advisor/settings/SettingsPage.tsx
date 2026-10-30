"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Phone, Video } from "lucide-react";
import { PasswordForm } from "@/components/account/PasswordForm";
import { MODE_LABEL } from "@/components/advisor/appointments/appointment-time";
import { Panel, Skeleton } from "@/components/advisor/dashboard/parts";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { AdvisorSettings, ConsultationMode } from "@/types/advisor";

const ICON = { video: Video, phone: Phone, chat: MessageSquare };

export function AdvisorSettingsPage() {
  const [settings, setSettings] = useState<AdvisorSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modes, setModes] = useState<ConsultationMode[]>([]);
  const [days, setDays] = useState(3);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<AdvisorSettings>("/advisor/settings", { signal: controller.signal })
      .then((s) => {
        setSettings(s);
        setModes(s.consultation_modes);
        setDays(s.follow_up_default_days);
      })
      .catch((failure: unknown) => !controller.signal.aborted && setError(errorMessage(failure, "We couldn't load your settings.")));
    return () => controller.abort();
  }, []);

  const toggle = (mode: ConsultationMode) => {
    setStatus(null);
    setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]));
  };

  const dirty =
    settings !== null &&
    (days !== settings.follow_up_default_days || [...modes].sort().join() !== [...settings.consultation_modes].sort().join());

  const save = async () => {
    if (modes.length === 0) {
      setStatus({ ok: false, text: "Offer at least one consultation type." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const saved = await fetchFromAPI<AdvisorSettings>("/advisor/settings", {
        method: "PUT",
        body: JSON.stringify({ follow_up_default_days: days, consultation_modes: modes }),
      });
      setSettings(saved);
      setModes(saved.consultation_modes);
      setStatus({ ok: true, text: "Saved. Customers booking from now on see these choices." });
    } catch (failure) {
      setStatus({ ok: false, text: errorMessage(failure, "We couldn't save your settings.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">Settings</h1>
        <p className="m-0 text-sm text-[#6F6A7C]">What you offer customers, defaults for your own tasks, and your password.</p>
      </header>

      {error ? (
        <p role="alert" className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </p>
      ) : !settings ? (
        <div role="status" aria-label="Loading settings" className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <Panel title="Consultations and tasks">
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 text-sm font-bold text-[#24212B]">Consultation types you offer</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {settings.available_modes.map((mode) => {
                  const Icon = ICON[mode];
                  const on = modes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(mode)}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${on ? "border-[#7957FF] bg-[#F4F0FF]" : "border-[#E8E5F0] bg-white hover:border-[#D2C8F5]"}`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${on ? "text-[#7957FF]" : "text-[#A59FB5]"}`} aria-hidden="true" />
                      <span className="text-sm font-bold text-[#24212B]">{MODE_LABEL[mode]}</span>
                    </button>
                  );
                })}
              </div>
              <p className="m-0 mt-2 text-xs text-[#8A849A]">
                Customers can only book the types you leave on. You can offer only what you are approved for:{" "}
                {settings.available_modes.map((m) => MODE_LABEL[m]).join(", ")}.
              </p>
            </fieldset>

            <div className="mt-6 max-w-xs">
              <label htmlFor="follow-days" className="mb-1 block text-sm font-bold text-[#24212B]">
                New follow-ups are due in
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="follow-days"
                  type="number"
                  min={0}
                  max={30}
                  value={days}
                  onChange={(event) => {
                    setDays(Math.max(0, Math.min(30, Number(event.target.value) || 0)));
                    setStatus(null);
                  }}
                  className="w-24 rounded-xl border border-[#E8E5F0] px-3 py-2 text-sm tabular-nums"
                />
                <span className="text-sm text-[#6F6A7C]">days by default</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={busy || !dirty}
                className="rounded-xl bg-[#171B3D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#232857] disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save settings"}
              </button>
              {status && (
                <span
                  role={status.ok ? "status" : "alert"}
                  className={`text-sm font-semibold ${status.ok ? "text-emerald-700" : "text-rose-700"}`}
                >
                  {status.text}
                </span>
              )}
            </div>
          </Panel>

          <Panel title="Password">
            <div className="max-w-sm">
              <PasswordForm
                endpoint="/advisor/settings/password"
                supported={settings.password_change_supported}
                unsupportedHint="This is a demo session, so there is no password to change."
              />
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
