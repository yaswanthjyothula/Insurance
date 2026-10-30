"use client";

import { useEffect, useState } from "react";
import { Languages, Star } from "lucide-react";
import { Panel, Skeleton } from "@/components/advisor/dashboard/parts";
import { initials } from "@/components/advisor/format";
import { MODE_LABEL } from "@/components/advisor/appointments/appointment-time";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { AdvisorProfileDetail } from "@/types/advisor";

const BIO_MAX = 500;
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[#8A849A]">{label}</dt>
      <dd className="m-0 mt-0.5 text-sm font-semibold text-[#24212B]">{value}</dd>
    </div>
  );
}

export function AdvisorProfilePage() {
  const [profile, setProfile] = useState<AdvisorProfileDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<AdvisorProfileDetail>("/advisor/profile", { signal: controller.signal })
      .then((p) => {
        setProfile(p);
        setBio(p.bio);
      })
      .catch((failure: unknown) => !controller.signal.aborted && setError(errorMessage(failure, "We couldn't load your profile.")));
    return () => controller.abort();
  }, []);

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const saved = await fetchFromAPI<AdvisorProfileDetail>("/advisor/profile", { method: "PUT", body: JSON.stringify({ bio }) });
      setProfile(saved);
      setBio(saved.bio);
      setStatus({ ok: true, text: "Saved. Customers see this when they choose an advisor." });
    } catch (failure) {
      setStatus({ ok: false, text: errorMessage(failure, "We couldn't save your bio.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">My profile</h1>
        <p className="m-0 text-sm text-[#6F6A7C]">How you appear to customers choosing an advisor.</p>
      </header>

      {error ? (
        <p role="alert" className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </p>
      ) : !profile ? (
        <div role="status" aria-label="Loading profile" className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        <>
          <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#E8E5F0] bg-white p-5 sm:p-6">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#171B3D] text-xl font-bold text-white"
              aria-hidden="true"
            >
              {initials(profile.advisor_name)}
            </span>
            <div className="min-w-0">
              <h2 className="m-0 text-xl font-extrabold tracking-tight text-[#171B3D]">{profile.advisor_name}</h2>
              <p className="m-0 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6F6A7C]">
                <span>{profile.advisor_id}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#F5B301] text-[#F5B301]" aria-hidden="true" /> {profile.rating} ({profile.review_count}{" "}
                  reviews)
                </span>
                <span>{profile.years_experience} years</span>
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Your details">
              <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Fact label="Assigned customers" value={String(profile.assigned_customers)} />
                <Fact label="Offers" value={profile.consultation_modes.map((m) => MODE_LABEL[m]).join(", ")} />
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-[#8A849A]">Languages</dt>
                  <dd className="m-0 mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#24212B]">
                    <Languages className="h-4 w-4 text-[#7957FF]" aria-hidden="true" /> {profile.languages.join(", ")}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-[#8A849A]">Specialisations</dt>
                  <dd className="m-0 mt-1 flex flex-wrap gap-1.5">
                    {profile.specialisations.map((s) => (
                      <span key={s} className="rounded-full bg-[#F4F0FF] px-2.5 py-0.5 text-xs font-bold text-[#6240E6]">
                        {cap(s.replace(/_/g, " "))}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              <p className="m-0 mt-5 rounded-xl bg-[#F8F7FC] px-3 py-2.5 text-xs text-[#6F6A7C]">
                Your name, rating, languages and specialisations come from your advisor record and are changed by the bank, not here. Choose
                which consultation types you offer in Settings.
              </p>
            </Panel>

            <Panel title="Your bio" aside={<span className="text-[11px] font-semibold text-[#8A849A]">Shown to customers</span>}>
              <label htmlFor="advisor-bio" className="sr-only">
                Bio
              </label>
              <textarea
                id="advisor-bio"
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  setStatus(null);
                }}
                maxLength={BIO_MAX}
                rows={6}
                placeholder="Tell customers how you help: who you work with and what a first session covers."
                className="w-full resize-y rounded-xl border border-[#E8E5F0] p-3 text-sm text-[#24212B]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy || bio === profile.bio}
                  className="rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857] disabled:opacity-40"
                >
                  {busy ? "Saving…" : "Save bio"}
                </button>
                <span className="text-xs tabular-nums text-[#8A849A]">
                  {bio.length}/{BIO_MAX}
                </span>
                {status && (
                  <span
                    role={status.ok ? "status" : "alert"}
                    className={`text-xs font-semibold ${status.ok ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {status.text}
                  </span>
                )}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
