import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { format } from "@/i18n/translate";
import { formatINR } from "@/lib/utils";
import { digitsOnly, groupIN, type FormState } from "@/lib/assessment-form";
import { useErrorText } from "./error-text";

/** What every step component receives: the answers, the visible errors, and a way to change answers. */
export interface StepProps {
  form: FormState;
  errorFor: (key: string) => string | undefined;
  onChange: (patch: Partial<FormState>) => void;
}

/** Error keys use dots ("goals.0.cost"); element ids use dashes so they are valid selectors. */
export const fieldId = (key: string): string => key.replace(/\./g, "-");

const labelClass = "block text-[13.5px] font-bold text-[#24212B] uppercase tracking-[0.12em] mb-3";
const hintClass = "text-[14.5px] text-[#5A5566] font-medium mt-2.5 block";
const errorClass = "flex items-center gap-1.5 text-[14px] font-semibold text-[#C23B3B] mt-2.5";
export const inputClass =
  "w-full h-[60px] rounded-[10px] border bg-[#FFFFFF] text-[18px] font-semibold text-[#24212B] placeholder:text-[#A59FB5] placeholder:font-medium focus:outline-none";

export const borderFor = (error?: string): string => (error ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]");

interface FieldProps {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  /** True when the control is a button group, which a <label> cannot point at. */
  group?: boolean;
  children: ReactNode;
}

export function Field({ id, label, optional, hint, error, group, children }: FieldProps) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const labelContent = (
    <>
      {label}
      {optional && <span className="ms-2 normal-case tracking-normal font-medium text-[#6F6A7C]">{t("assessment.field.optional")}</span>}
    </>
  );
  return (
    <div data-field={id}>
      {group ? (
        <span id={`${id}-label`} className={labelClass}>
          {labelContent}
        </span>
      ) : (
        <label htmlFor={id} className={labelClass}>
          {labelContent}
        </label>
      )}
      {children}
      {error ? (
        <span id={`${id}-err`} role="alert" className={errorClass}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorText(error)}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className={hintClass}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

interface TextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  /** Amount in rupees: grouped in the Indian style while typing. */
  money?: boolean;
  maxDigits?: number;
}

export function TextInput({ id, value, onChange, placeholder, error, prefix, suffix, money, maxDigits = 3 }: TextInputProps) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-lg text-[#7957FF] font-bold pointer-events-none">{prefix}</span>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={money ? groupIN(value) : value}
        placeholder={placeholder}
        onChange={(event) => onChange(digitsOnly(event.target.value, money ? 12 : maxDigits))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : `${id}-hint`}
        className={`${inputClass} ${prefix ? "ps-9" : "ps-4"} ${suffix ? "pe-20" : "pe-4"} ${borderFor(error)}`}
      />
      {suffix && (
        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[15px] text-[#6F6A7C] font-medium pointer-events-none">{suffix}</span>
      )}
    </div>
  );
}

interface SelectInputProps<T extends string> {
  id: string;
  value: T | "";
  onChange: (value: T) => void;
  placeholder: string;
  options: { value: T; label: string }[];
  error?: string;
}

export function SelectInput<T extends string>({ id, value, onChange, placeholder, options, error }: SelectInputProps<T>) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-err` : `${id}-hint`}
      className={`${inputClass} px-4 ${value ? "" : "text-[#A59FB5] font-medium"} ${error ? "border-[#C23B3B]" : "border-[#D9D3E8]"}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface ChoiceGroupProps<T extends string> {
  id: string;
  value: T | "";
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  error?: string;
  columns?: number;
}

export function ChoiceGroup<T extends string>({ id, value, onChange, options, error, columns = options.length }: ChoiceGroupProps<T>) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={`${id}-label`}
      aria-invalid={Boolean(error)}
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-[60px] rounded-[10px] text-[15px] font-bold border transition-all ${
            value === option.value
              ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]"
              : `bg-[#FFFFFF] text-[#24212B] ${error ? "border-[#C23B3B]" : "border-[#D9D3E8] hover:border-[#7957FF]/40"}`
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface StepHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  step: number;
  title: string;
  description: string;
}

export function StepHeader({ icon: Icon, step, title, description }: StepHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex gap-4 items-start pb-5 border-b border-[#D9D3E8]">
      <span className="flex-none w-12 h-12 rounded-2xl grid place-items-center text-white bg-gradient-to-br from-[#9A80FF] to-[#7957FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_0_#5B3BE6,0_14px_22px_-8px_rgba(121,87,255,0.7)]">
        <Icon className="w-6 h-6" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.03em] text-[#24212B]">
          {t("assessment.step.heading", { step, title })}
        </h2>
        <p className="m-0 text-base leading-normal text-[#5A5566]">{description}</p>
      </div>
    </div>
  );
}

export const FIELD_GRID = "grid grid-cols-1 sm:grid-cols-2 gap-x-9 gap-y-7";

/** "₹18 L per year" style hint for a typed amount, or undefined while the field is empty. The template holds {amount}. */
export function amountHint(text: string, template = "{amount}"): string | undefined {
  return text ? format(template, { amount: formatINR(Number(text), { compact: true }) }) : undefined;
}
