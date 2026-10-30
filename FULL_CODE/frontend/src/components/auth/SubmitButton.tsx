interface SubmitButtonProps {
  busy: boolean;
  idleLabel: string;
  busyLabel: string;
}

export function SubmitButton({ busy, idleLabel, busyLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full py-3.5 px-6 text-sm font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] disabled:opacity-60 rounded-2xl shadow-[0_12px_28px_rgba(121,87,255,0.32)] transition-colors"
    >
      {busy ? busyLabel : idleLabel}
    </button>
  );
}
