"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { useTagLabels } from "@/components/advisory/useTagLabels";
import type { AdvisorFilters as Filters } from "@/components/advisory/advisory-helpers";
import { isConsultationMode } from "@/components/advisory/advisory-helpers";
import { CONSULTATION_MODES } from "@/components/advisory/consultation-modes";
import { SELECT_CLASS } from "@/components/advisory/styles";

interface AdvisorFiltersProps {
  filters: Filters;
  languages: string[];
  specialisations: string[];
  onChange: (filters: Filters) => void;
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C] mb-1.5">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT_CLASS}>
        {children}
      </select>
    </div>
  );
}

export function AdvisorFilters({ filters, languages, specialisations, onChange }: AdvisorFiltersProps) {
  const { t } = useI18n();
  const { tagLabel, languageLabel } = useTagLabels();
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <FilterSelect
        id="filter-mode"
        label={t("advisory.filters.how")}
        value={filters.mode}
        onChange={(value) => update({ mode: isConsultationMode(value) ? value : "" })}
      >
        <option value="">{t("advisory.filters.anyWay")}</option>
        {CONSULTATION_MODES.map((mode) => (
          <option key={mode.id} value={mode.id}>
            {t(mode.labelKey)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="filter-language"
        label={t("advisory.filters.language")}
        value={filters.language}
        onChange={(language) => update({ language })}
      >
        <option value="">{t("advisory.filters.anyLanguage")}</option>
        {languages.map((language) => (
          <option key={language} value={language}>
            {languageLabel(language)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="filter-specialisation"
        label={t("advisory.filters.specialisation")}
        value={filters.specialisation}
        onChange={(specialisation) => update({ specialisation })}
      >
        <option value="">{t("advisory.filters.anySpecialisation")}</option>
        {specialisations.map((tag) => (
          <option key={tag} value={tag}>
            {tagLabel(tag)}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}
