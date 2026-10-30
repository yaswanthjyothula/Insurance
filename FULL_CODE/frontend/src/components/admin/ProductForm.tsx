"use client";

import { FieldError, INPUT, Toggle } from "@/components/admin/AdminUi";
import { validateProduct, type ProductField } from "@/lib/admin-form";
import type { Category, ProductConfig, RiderOption } from "@/types/admin";

type Errors = Partial<Record<ProductField, string>>;

const LABEL = "mb-1 block text-xs font-bold text-[#6F6A7C]";

function Num({
  id,
  label,
  value,
  onChange,
  error,
  step = 1,
  hint,
  disabled,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  error?: string;
  step?: number;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        aria-invalid={Boolean(error)}
        className={`${INPUT} ${error ? "border-rose-300" : ""} disabled:bg-[#F4F3F7]`}
      />
      {hint && !error && <p className="m-0 mt-1 text-[11px] text-[#8A849A]">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 rounded-2xl border border-[#E8E5F0] p-4">
      <legend className="px-2 text-xs font-bold uppercase tracking-wide text-[#3D55E0]">{title}</legend>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </fieldset>
  );
}

interface ProductFormProps {
  draft: ProductConfig;
  onChange: (next: ProductConfig) => void;
  riders: RiderOption[];
  existingIds: string[];
  creating?: boolean;
  /** Show errors only after the first save attempt or edit. */
  showErrors: boolean;
}

/** Every rule of one product. Used to edit a product in the drawer and to add a new one. */
export function ProductForm({ draft, onChange, riders, existingIds, creating = false, showErrors }: ProductFormProps) {
  const errors: Errors = showErrors || creating ? validateProduct(draft, existingIds, creating) : {};
  const set = <K extends keyof ProductConfig>(key: K, value: ProductConfig[K]) => onChange({ ...draft, [key]: value });
  const isUlip = draft.category === "ULIP";
  const priced = !isUlip;
  const matrix = draft.rate_matrix_entry_ages;

  return (
    <div className="space-y-5">
      <Section title="Identity">
        <div className="col-span-2">
          <label htmlFor="pf-name" className={LABEL}>
            Product name
          </label>
          <input
            id="pf-name"
            value={draft.product_name}
            onChange={(e) => set("product_name", e.target.value)}
            className={`${INPUT} ${errors.product_name ? "border-rose-300" : ""}`}
            aria-invalid={Boolean(errors.product_name)}
          />
          <FieldError message={errors.product_name} />
        </div>
        {creating && (
          <>
            <div>
              <label htmlFor="pf-id" className={LABEL}>
                Product ID
              </label>
              <input
                id="pf-id"
                value={draft.product_id}
                onChange={(e) => set("product_id", e.target.value.toUpperCase())}
                placeholder="PRD-GOLD01"
                className={`${INPUT} ${errors.product_id ? "border-rose-300" : ""}`}
                aria-invalid={Boolean(errors.product_id)}
              />
              <FieldError message={errors.product_id} />
            </div>
            <div>
              <label htmlFor="pf-cat" className={LABEL}>
                Category
              </label>
              <select id="pf-cat" value={draft.category} onChange={(e) => set("category", e.target.value as Category)} className={INPUT}>
                <option>Term Life</option>
                <option>Whole Life</option>
                <option>Endowment</option>
              </select>
              <p className="m-0 mt-1 text-[11px] text-[#8A849A]">ULIPs need fund tables, so they can only be edited.</p>
            </div>
          </>
        )}
        {!creating && (
          <div className="col-span-2 flex items-center justify-between rounded-xl bg-[#F8F7FC] px-3 py-2.5">
            <span className="text-sm text-[#0E1330]">
              <span className="font-bold">{draft.product_id}</span> · {draft.category}
              {draft.custom ? " · created in the console" : ""}
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold text-[#6F6A7C]">
              {draft.active ? "Offered" : "Switched off"}
              <Toggle checked={draft.active} onChange={(v) => set("active", v)} label={`${draft.product_name} active`} />
            </span>
          </div>
        )}
      </Section>

      {priced && (
        <Section title="Price">
          <Num
            id="pf-rate"
            label="Base rate per ₹1,000 of cover (yearly)"
            step={0.0001}
            value={draft.base_rate_per_1000}
            onChange={(v) => set("base_rate_per_1000", v)}
            error={errors.base_rate_per_1000}
            hint={
              draft.reference_rate_per_1000
                ? `The pack's own rate here is ${draft.reference_rate_per_1000}. Every age and term scales with this.`
                : "Rises with age by the loading below."
            }
          />
          {draft.custom ? (
            <Num
              id="pf-ageload"
              label="Rate rise per year above age 30 (%)"
              step={0.5}
              value={draft.age_loading_percentage_per_year}
              onChange={(v) => set("age_loading_percentage_per_year", v ?? 0)}
              error={errors.age_loading_percentage_per_year}
            />
          ) : (
            <div className="rounded-xl bg-[#F8F7FC] px-3 py-2 text-xs text-[#6F6A7C]">
              Age and term differences come from the pack&apos;s rate table.
            </div>
          )}
          <Num
            id="pf-smoker"
            label="Smoker loading (%)"
            step={1}
            value={draft.smoker_loading_percentage}
            onChange={(v) => set("smoker_loading_percentage", v ?? 0)}
            error={errors.smoker_loading_percentage}
            hint="Added on top of the rate for smokers."
          />
          <div className="grid grid-cols-2 gap-3">
            <Num
              id="pf-male"
              label="Male factor"
              step={0.01}
              value={draft.gender_discount_factors.male}
              onChange={(v) => set("gender_discount_factors", { ...draft.gender_discount_factors, male: v ?? 1 })}
              error={errors.male}
            />
            <Num
              id="pf-female"
              label="Female factor"
              step={0.01}
              value={draft.gender_discount_factors.female}
              onChange={(v) => set("gender_discount_factors", { ...draft.gender_discount_factors, female: v ?? 1 })}
              error={errors.female}
              hint="0.9 = 10% cheaper"
            />
          </div>
        </Section>
      )}

      <Section title="Who can buy">
        <Num
          id="pf-minage"
          label="Minimum entry age"
          value={draft.minimum_entry_age}
          onChange={(v) => set("minimum_entry_age", v ?? 0)}
          error={errors.minimum_entry_age}
          hint={matrix ? `The rate table prices ages ${matrix[0]} to ${matrix[1]}.` : undefined}
        />
        <Num id="pf-maxage" label="Maximum entry age" value={draft.maximum_entry_age} onChange={(v) => set("maximum_entry_age", v ?? 0)} />
        <Num
          id="pf-minmat"
          label="Minimum maturity age"
          value={draft.minimum_maturity_age}
          onChange={(v) => set("minimum_maturity_age", v ?? 0)}
          error={errors.minimum_maturity_age}
        />
        <Num
          id="pf-maxmat"
          label="Maximum maturity age"
          value={draft.maximum_maturity_age}
          onChange={(v) => set("maximum_maturity_age", v ?? 0)}
        />
        <Num
          id="pf-mintenure"
          label="Minimum tenure (years)"
          value={draft.minimum_tenure}
          onChange={(v) => set("minimum_tenure", v ?? 0)}
          error={errors.minimum_tenure}
        />
        <Num
          id="pf-maxtenure"
          label="Maximum tenure (years)"
          value={draft.maximum_tenure}
          onChange={(v) => set("maximum_tenure", v ?? 0)}
        />
      </Section>

      <Section title="Cover limits">
        <Num
          id="pf-minsa"
          label="Minimum sum assured (₹)"
          step={100000}
          value={draft.minimum_sum_assured}
          onChange={(v) => set("minimum_sum_assured", v ?? 0)}
          error={errors.minimum_sum_assured}
        />
        <Num
          id="pf-maxsa"
          label="Maximum sum assured (₹)"
          step={100000}
          value={draft.maximum_sum_assured}
          onChange={(v) => set("maximum_sum_assured", v ?? 0)}
        />
        <div className="col-span-2">
          <Num
            id="pf-incmult"
            label="Maximum cover as a multiple of yearly income"
            step={1}
            value={draft.maximum_income_multiple}
            onChange={(v) => set("maximum_income_multiple", v)}
            error={errors.maximum_income_multiple}
            hint="Empty keeps the pack's own age-based limits."
          />
        </div>
      </Section>

      <Section title="Allowed riders">
        <div className="col-span-2 flex flex-wrap gap-2">
          {riders.map((rider) => {
            const on = draft.allowed_riders.includes(rider.rider_id);
            return (
              <button
                key={rider.rider_id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() =>
                  set(
                    "allowed_riders",
                    on ? draft.allowed_riders.filter((r) => r !== rider.rider_id) : [...draft.allowed_riders, rider.rider_id],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${on ? "border-[#3D55E0] bg-[#EEF1FF] text-[#3D55E0]" : "border-[#E8E5F0] bg-white text-[#6F6A7C] hover:border-[#B9C3FF]"}`}
              >
                {rider.rider_name}
              </button>
            );
          })}
          {riders.length === 0 && <p className="m-0 text-xs text-[#8A849A]">No riders exist in the catalogue.</p>}
        </div>
      </Section>
    </div>
  );
}
