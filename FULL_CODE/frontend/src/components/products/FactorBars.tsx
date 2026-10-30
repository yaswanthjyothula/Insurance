import type { ProductFit } from "@/types/api";

/** Why a product scored what it did: the five readable factors, then how the model's view was blended in. */
export function FactorBars({ fit }: { fit: ProductFit }) {
  return (
    <div className="flex flex-col gap-3">
      {fit.factors.map((f) => (
        <div key={f.key}>
          <div className="flex justify-between text-[13px] font-semibold">
            <span>
              {f.label} <span className="font-medium text-[#6F6A7C]">· {Math.round(f.weight * 100)}%</span>
            </span>
            <span className="tabular-nums">{Math.round(f.score * 100)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E9E4FF]">
            <div className="h-full rounded-full bg-[#7957FF]" style={{ width: `${f.score * 100}%` }} />
          </div>
          <p className="m-0 mt-1 text-[12.5px] leading-snug text-[#6F6A7C]">{f.detail}</p>
        </div>
      ))}
      {fit.model_percent != null && (
        <p className="m-0 rounded-xl border border-[#D9D3E8] bg-[#FAF9F6] p-3 text-[13px] text-[#4A4553]">
          <strong>How the match is made:</strong> rule score {fit.rule_percent}% (the factors above) and trained-model fit{" "}
          {fit.model_percent}% for your priority, averaged to {fit.match_percent}%. The model was trained on synthetic data.
        </p>
      )}
    </div>
  );
}
