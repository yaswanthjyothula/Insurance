import { useT } from "@/i18n/I18nProvider";
import { formatINR } from "@/lib/utils";
import type { UlipScenario } from "@/types/api";

const W = 560,
  H = 220,
  PAD = { l: 56, r: 12, t: 12, b: 28 };
const COLORS = ["#C98A2B", "#7957FF"];

/** Fund value over the years at each illustrated return, against the premiums paid. Pure SVG so it needs no chart library. */
export function UlipChart({ scenarios }: { scenarios: UlipScenario[] }) {
  const t = useT();
  const years = scenarios[0]?.years ?? [];
  if (!years.length) return null;
  const top = Math.max(...scenarios.flatMap((s) => s.years.map((y) => y.fund_value)), ...years.map((y) => y.premiums_paid), 1);
  const x = (i: number) => PAD.l + (i / Math.max(1, years.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.t - PAD.b);
  const line = (values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => top * f);
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("products.ulip.chartAria")} className="w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#E9E4FF" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6F6A7C">
              {formatINR(t, { compact: true, precision: 1 })}
            </text>
          </g>
        ))}
        <path d={line(years.map((p) => p.premiums_paid))} fill="none" stroke="#6F6A7C" strokeWidth="2" strokeDasharray="5 4" />
        {scenarios.map((s, i) => (
          <path
            key={s.gross_return_pct}
            d={line(s.years.map((p) => p.fund_value))}
            fill="none"
            stroke={COLORS[i % COLORS.length]}
            strokeWidth="2.5"
          />
        ))}
        <text x={PAD.l} y={H - 6} fontSize="11" fill="#6F6A7C">
          {t("products.ulip.year1")}
        </text>
        <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize="11" fill="#6F6A7C">
          {t("products.ulip.yearN", { count: years.length })}
        </text>
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#4A4553]">
        {scenarios.map((s, i) => (
          <span key={s.gross_return_pct} className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {t("products.ulip.scenario", { pct: s.gross_return_pct, amount: formatINR(s.maturity_value, { compact: true }) })}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-4 bg-[#6F6A7C]" />
          {t("products.ulip.premiumsPaid")}
        </span>
      </figcaption>
    </figure>
  );
}
