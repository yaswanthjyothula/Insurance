import { formatInrCompact } from "@/components/advisor/format";
import { Panel } from "@/components/advisor/dashboard/parts";
import type { CustomerOverview, FinancialProfile, TimelineEvent } from "@/types/advisor";

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[#8A849A]">{label}</dt>
      <dd className="m-0 mt-0.5 text-sm font-semibold text-[#24212B]">{value}</dd>
    </div>
  );
}

export function OverviewSection({ o }: { o: CustomerOverview }) {
  return (
    <Panel title="Customer overview">
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Fact label="Age" value={`${o.age} years, ${o.gender}`} />
        <Fact label="Occupation" value={`${o.occupation} (${o.employment_type})`} />
        <Fact label="City" value={o.city} />
        <Fact label="Annual income" value={formatInrCompact(o.annual_income_inr)} />
        <Fact label="Marital status" value={cap(o.marital_status)} />
        <Fact
          label="Dependents"
          value={`${o.dependents} (${o.children} children, ${o.parents} parents${o.spouse_working === null ? "" : o.spouse_working ? ", working spouse" : ", spouse not working"})`}
        />
        <Fact label="Risk appetite" value={cap(o.risk_appetite)} />
        <Fact label="Tobacco use" value={o.smoker ? "Smoker" : "Non-smoker"} />
        <Fact label="Assigned advisor" value={o.assigned_advisor_name} />
      </dl>
      <p className="m-0 mt-5 rounded-xl bg-[#F8F7FC] px-3 py-2.5 text-xs text-[#6F6A7C]">
        Contact details are not part of the sample data. Customer ID {o.profile_id}.
      </p>
    </Panel>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-[#F1EDFC] py-2 last:border-0">
      <span className="text-sm text-[#6F6A7C]">
        {label}
        {hint && <span className="block text-[11px] text-[#A59FB5]">{hint}</span>}
      </span>
      <span className="text-sm font-semibold tabular-nums text-[#24212B]">{value}</span>
    </li>
  );
}

export function FinancialSection({ f }: { f: FinancialProfile }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel title="Income, assets and cover">
        <ul className="m-0 list-none p-0">
          <Row label="Monthly income" value={formatInrCompact(f.monthly_income_inr)} />
          <Row label="Monthly household expenses" value={formatInrCompact(f.monthly_expenses_inr)} />
          <Row label="Liquid savings" value={formatInrCompact(f.liquid_savings_inr)} hint="Counted as available assets" />
          <Row label="Market investments" value={formatInrCompact(f.market_investments_inr)} hint="Counted as available assets" />
          <Row label="Retirement savings" value={formatInrCompact(f.retirement_savings_inr)} hint="Not counted: reserved for retirement" />
          <Row label="Individual life cover" value={formatInrCompact(f.individual_cover_inr)} />
          <Row
            label="Employer group cover"
            value={formatInrCompact(f.employer_group_cover_inr)}
            hint="Counted once, with individual cover"
          />
          <Row
            label="Premium budget"
            value={f.monthly_premium_budget_inr ? `${formatInrCompact(f.monthly_premium_budget_inr)} / month` : "Not stated"}
          />
        </ul>
      </Panel>
      <div className="space-y-6">
        <Panel title="Outstanding liabilities">
          {f.liabilities.length === 0 ? (
            <p className="m-0 text-sm text-[#6F6A7C]">No outstanding loans on record.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {f.liabilities.map((li) => (
                <Row
                  key={li.loan_type}
                  label={cap(li.loan_type)}
                  value={formatInrCompact(li.outstanding_inr)}
                  hint={
                    li.emi_inr
                      ? `EMI ${formatInrCompact(li.emi_inr)}${li.remaining_months ? ` · ${li.remaining_months} months left` : ""}`
                      : undefined
                  }
                />
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Future goals">
          {f.goals.length === 0 ? (
            <p className="m-0 text-sm text-[#6F6A7C]">No goals on record.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {f.goals.map((g, i) => (
                <Row
                  key={`${g.goal_type}-${i}`}
                  label={cap(g.goal_type)}
                  value={formatInrCompact(g.amount_today_inr)}
                  hint={`${g.target_year} · ${g.priority} priority${g.beneficiary ? ` · ${g.beneficiary}` : ""} · today's money`}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function TimelineSection({ events }: { events: TimelineEvent[] }) {
  return (
    <Panel title="Activity timeline">
      <ol className="m-0 list-none space-y-4 border-l border-[#E8E5F0] p-0 pl-5">
        {events.map((e) => (
          <li key={`${e.kind}-${e.at}`} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#7957FF] ring-4 ring-white" aria-hidden="true" />
            <p className="m-0 text-sm font-semibold text-[#24212B]">{e.title}</p>
            <p className="m-0 text-xs text-[#6F6A7C]">
              {e.detail}
              {e.at ? ` · ${e.at}` : ""}
            </p>
          </li>
        ))}
      </ol>
      <p className="m-0 mt-5 rounded-xl bg-[#F8F7FC] px-3 py-2.5 text-xs text-[#6F6A7C]">
        Assessments, recommendations, quotes, appointments and notes are not recorded per customer yet. They will appear here as those
        features arrive.
      </p>
    </Panel>
  );
}
