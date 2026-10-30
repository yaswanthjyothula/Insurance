"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { PHONE_LENGTH, digitsOnly } from "@/components/advisory/advisory-helpers";
import { FieldError } from "@/components/advisory/FieldError";
import { INPUT_CLASS, LABEL_CLASS } from "@/components/advisory/styles";

export interface DetailsValues {
  name: string;
  phone: string;
  notes: string;
  shareSummary: boolean;
}

interface DetailsFieldsProps {
  values: DetailsValues;
  errors: { name?: string; phone?: string };
  onChange: (patch: Partial<DetailsValues>) => void;
}

const borderFor = (error?: string) => (error ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]");

export function DetailsFields({ values, errors, onChange }: DetailsFieldsProps) {
  const { t } = useI18n();
  return (
    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
      <div className="sm:col-span-2">
        <label htmlFor="name" className={LABEL_CLASS}>
          {t("advisory.details.fullName")}
        </label>
        <input
          id="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`${INPUT_CLASS} ${borderFor(errors.name)}`}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="phone" className={LABEL_CLASS}>
          {t("advisory.details.mobile")}
        </label>
        <div className="relative">
          <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[17px] font-bold text-[#7957FF] pointer-events-none">+91</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={values.phone}
            onChange={(event) => onChange({ phone: digitsOnly(event.target.value) })}
            placeholder={t("advisory.details.phonePlaceholder", { count: PHONE_LENGTH })}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`${INPUT_CLASS} ps-14 ${borderFor(errors.phone)}`}
          />
        </div>
        <FieldError id="phone-error" message={errors.phone} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="notes" className={LABEL_CLASS}>
          {t("advisory.details.discuss")}{" "}
          <span className="normal-case tracking-normal font-medium text-[#6F6A7C]">{t("advisory.details.optionalHint")}</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          maxLength={500}
          value={values.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder={t("advisory.details.discussPlaceholder")}
          className="w-full rounded-[10px] border border-[#D9D3E8] bg-white px-4 py-3 text-[16px] font-medium text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF]"
        />
      </div>
      <label className="sm:col-span-2 flex items-start gap-3 cursor-pointer text-[15px] leading-snug">
        <input
          type="checkbox"
          checked={values.shareSummary}
          onChange={(event) => onChange({ shareSummary: event.target.checked })}
          className="w-5 h-5 mt-0.5 accent-[#7957FF]"
        />
        <span>
          <strong>{t("advisory.details.shareTitle")}</strong> <span className="text-[#5A5566]">{t("advisory.details.shareBody")}</span>
        </span>
      </label>
    </div>
  );
}
