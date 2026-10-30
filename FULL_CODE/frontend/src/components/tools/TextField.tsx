interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}

/** Like NumberField, but the value is text, so it can be empty and show only a placeholder. */
export function TextField({ label, value, onChange, prefix, placeholder, hint, error }: TextFieldProps) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#24212B]">
        {label}
      </label>
      <div
        className={`mt-1.5 flex items-center rounded-xl border bg-white focus-within:border-[#7957FF] ${error ? "border-[#C0364B]" : "border-[#D9D3E8]"}`}
      >
        {prefix && <span className="pl-3 text-[#6F6A7C]">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          className="w-full bg-transparent px-3 py-2.5 text-[15px] text-[#24212B] outline-none tabular-nums placeholder:text-[#A9A3B8]"
        />
      </div>
      {(error || hint) && (
        <p id={`${id}-note`} className={`mt-1 text-sm ${error ? "text-[#C0364B]" : "text-[#6F6A7C]"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
