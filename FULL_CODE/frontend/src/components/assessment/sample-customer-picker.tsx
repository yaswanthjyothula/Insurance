import { useRef, useState } from "react";
import { AlertCircle, RefreshCw, Search, UserRound, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { SampleCustomer } from "@/types/api";
import type { SampleCustomerDetail } from "@/types/sample-customer";
import { SampleCustomerList } from "./sample-customer-list";
import { filterCustomers, messageOf, useSampleCustomers } from "./use-sample-customers";

interface SampleCustomerPickerProps {
  onSelect: (detail: SampleCustomerDetail) => void;
}

const buttonClass =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-[#FFFFFF] text-[#7957FF] text-[15px] font-bold border border-[#D9D3E8] shrink-0 shadow-[0_4px_0_#D9D3E8,0_16px_28px_-14px_rgba(36,33,43,0.25)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_#D9D3E8] transition-all";

/** Lets a visitor fill the form from one of the pack's synthetic customers, then edit it. */
export function SampleCustomerPicker({ onSelect }: SampleCustomerPickerProps) {
  const { t, tx } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { customers, status, error, loadList, loadDetail } = useSampleCustomers();
  const [query, setQuery] = useState("");
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const open = () => {
    dialogRef.current?.showModal();
    if (status === "idle" || status === "error") void loadList();
  };

  const pick = async (customer: SampleCustomer) => {
    setPickingId(customer.profile_id);
    setPickError(null);
    try {
      onSelect(await loadDetail(customer.profile_id));
      dialogRef.current?.close();
    } catch (failure) {
      setPickError(messageOf(failure));
    } finally {
      setPickingId(null);
    }
  };

  const shownError = pickError ?? (status === "error" ? error : null);
  return (
    <>
      <button type="button" onClick={open} className={buttonClass}>
        <UserRound className="w-4 h-4" />
        {t("assessment.sample.open")}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="sample-title"
        className="m-auto w-[min(640px,92vw)] rounded-3xl border border-[#D9D3E8] bg-[#FFFFFF] p-0 text-[#24212B] backdrop:bg-[#24212B]/40"
      >
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="sample-title" className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">
                {t("assessment.sample.title")}
              </h2>
              <p className="m-0 mt-1.5 text-[14.5px] text-[#5A5566]">{t("assessment.sample.intro")}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t("common.close")}
              className="p-1.5 rounded-lg hover:bg-[#F1EEF8]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <label htmlFor="sample-search" className="sr-only">
            {t("assessment.sample.searchLabel")}
          </label>
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6A7C]" />
            <input
              id="sample-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("assessment.sample.searchPlaceholder")}
              className="w-full h-12 rounded-[10px] border border-[#D9D3E8] ps-11 pe-4 text-[16px] font-medium placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF]"
            />
          </div>

          {shownError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#C23B3B] text-[#C23B3B] text-[14.5px] font-semibold"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {tx(shownError)}
              </span>
              {status === "error" && (
                <button type="button" onClick={() => void loadList()} className="underline shrink-0">
                  {t("common.tryAgain")}
                </button>
              )}
            </div>
          )}
          {status === "loading" && (
            <p role="status" className="m-0 flex items-center gap-2 text-[15px] text-[#5A5566]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#7957FF]" />
              {t("assessment.sample.loading")}
            </p>
          )}
          {status === "ready" && <SampleCustomerList customers={filterCustomers(customers, query)} pickingId={pickingId} onPick={pick} />}
        </div>
      </dialog>
    </>
  );
}
