"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { BasketSummary } from "@/components/products/BasketSummary";
import { CompareBar } from "@/components/products/CompareBar";
import { CompareModal } from "@/components/products/CompareModal";
import { Customizer } from "@/components/products/Customizer";
import { ModelNote } from "@/components/products/ModelNote";
import { PriorityPicker } from "@/components/products/PriorityPicker";
import { ProductCard } from "@/components/products/ProductCard";
import { SelectionBar } from "@/components/products/SelectionBar";
import { TypeTabs, type TypeFilter } from "@/components/products/TypeTabs";
import { UlipCustomizer } from "@/components/products/UlipCustomizer";
import { useDebouncedPost } from "@/hooks/useDebouncedRequest";
import { usePack } from "@/hooks/usePack";
import { useRecommendations } from "@/hooks/useRecommendations";
import { compareGroup, MAX_COMPARE, toggleCompare, withSelectedQuotes } from "@/lib/compare";
import { requestFromFit, upsertPlan } from "@/lib/plan-config";
import { saveMyPlan, summariseSelection } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { useAssessmentStore } from "@/store/assessment-store";
import type { Priority, ProductFit, SelectedPlan } from "@/types/api";

interface BasketCheck {
  valid: boolean;
  issues: string[];
}

export default function ProductsPage() {
  const router = useRouter();
  const { recommend, selection, setSelection, setStage, isHydrated } = useAssessmentStore();
  const { pack, error: packError } = usePack();
  const [priority, setPriority] = useState<Priority | null>(null);
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [editing, setEditing] = useState<ProductFit | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  const activePriority = priority ?? recommend?.priority ?? "balanced";
  const { data, loading, error, retry } = useRecommendations(recommend, activePriority);
  const applicant = recommend?.applicant;

  const check = useDebouncedPost<object, BasketCheck>(
    "/quotes/basket",
    applicant && selection.length
      ? { applicant, items: selection.map((p) => ({ product_id: p.request.product_id, sum_assured: p.quote.sum_assured })) }
      : null,
  );
  const basketIssues = selection.length ? (check.result?.issues ?? []) : [];

  const addPlan = useCallback((plan: SelectedPlan) => setSelection(upsertPlan(selection, plan)), [selection, setSelection]);

  const useBasket = (items: ProductFit[]) => {
    if (!applicant) return;
    const plans = items
      .filter((i) => i.quote)
      .map((i) => ({ request: requestFromFit(i, applicant), quote: i.quote!, fit_summary: i.reason }));
    setSelection(plans);
  };

  const visible = useMemo(() => (data?.products ?? []).filter((p) => filter === "all" || p.product_type === filter), [data, filter]);
  const basketActive =
    !!data && data.basket.items.length > 0 && data.basket.items.every((i) => selection.some((s) => s.request.product_id === i.product_id));
  const editingProduct = editing && pack ? pack.products[editing.product_id] : null;

  const comparedFits = withSelectedQuotes(
    (data?.products ?? []).filter((p) => compareIds.includes(p.product_id)),
    selection,
  );
  const compareFull = compareIds.length >= MAX_COMPARE;
  const toggle = (id: string) => setCompareIds((ids) => toggleCompare(ids, id));
  // Two or more plans open side by side at once; a single plan joins the comparison and the customer picks another below
  const compareNow = (ids: string[]) => {
    const next = compareGroup([...ids, ...compareIds]);
    setCompareIds(next);
    if (next.length >= 2) setComparing(true);
    else document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const proceed = () => {
    setStage(4);
    saveMyPlan({ plan: summariseSelection(selection) });
    router.push("/advisory");
  };

  if (!isHydrated)
    return (
      <Shell>
        <Centered>
          <Loader2 className="h-7 w-7 animate-spin text-[#7957FF]" />
        </Centered>
      </Shell>
    );
  if (!recommend) {
    return (
      <Shell>
        <Centered>
          <h2 className="m-0 text-xl font-bold">Start with your needs</h2>
          <p className="m-0 mt-1 max-w-md text-center text-[#5A5566]">
            Matched products depend on your answers. It takes about two minutes.
          </p>
          <Link href="/assessment" className="mt-4 inline-flex h-12 items-center rounded-lg bg-[#7957FF] px-6 font-bold text-white">
            Start the needs assessment
          </Link>
        </Centered>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="m-0 text-[clamp(26px,2.8vw,36px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#24212B]">
            Products matched to you
          </h1>
          <p className="m-0 mt-2 max-w-[760px] text-[16px] leading-[1.5] text-[#5A5566]">
            {data ? (
              <>
                Your cover need is about <strong className="text-[#24212B]">{formatINR(data.recommended_cover, { compact: true })}</strong>
                .{" "}
              </>
            ) : null}
            Saffron Life is a fictional insurer, so these products and prices are for the prototype only. Pick a policy to change its cover,
            term and add-ons.
          </p>
        </div>
        <PriorityPicker value={activePriority} onChange={setPriority} />
      </header>

      {(error || packError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C23B3B] p-4 font-semibold text-[#C23B3B]"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error ?? packError}
          </span>
          <button type="button" onClick={retry} className="inline-flex items-center gap-1.5 underline">
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {!data && loading && (
        <Centered>
          <Loader2 className="h-7 w-7 animate-spin text-[#7957FF]" />
          <p className="m-0 mt-2 font-semibold">Matching products…</p>
        </Centered>
      )}

      {data && (
        <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <BasketSummary
            basket={data.basket}
            recommendedCover={data.recommended_cover}
            onUse={useBasket}
            active={basketActive}
            comparedIds={compareIds}
            compareFull={compareFull}
            onToggleCompare={toggle}
            onCompareAll={compareNow}
          />
          <section id="all-products" aria-label="All products" className="flex scroll-mt-24 flex-col gap-4">
            <TypeTabs value={filter} counts={data.type_counts} onChange={setFilter} />
            <CompareBar
              names={comparedFits.map((f) => ({ id: f.product_id, name: f.product_name }))}
              onOpen={() => setComparing(true)}
              onRemove={(id) => setCompareIds((ids) => ids.filter((x) => x !== id))}
              onClear={() => setCompareIds([])}
            />
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((fit) => (
                <ProductCard
                  key={fit.product_id}
                  fit={fit}
                  selected={selection.some((s) => s.request.product_id === fit.product_id)}
                  compared={compareIds.includes(fit.product_id)}
                  compareFull={compareFull}
                  onCustomise={() => setEditing(fit)}
                  onToggleCompare={() => toggle(fit.product_id)}
                />
              ))}
            </div>
          </section>
          <ModelNote method={data.ranking_method} note={data.methodology_note} />
        </div>
      )}

      <SelectionBar
        selection={selection}
        issues={basketIssues}
        onRemove={(id) => setSelection(selection.filter((p) => p.request.product_id !== id))}
        onContinue={proceed}
        onCompare={() => compareNow(selection.map((p) => p.request.product_id))}
      />

      {comparing && pack && comparedFits.length >= 2 && (
        <CompareModal
          fits={comparedFits}
          selectedIds={selection.map((p) => p.request.product_id)}
          products={pack.products}
          onClose={() => setComparing(false)}
          onRemove={(id) => {
            setCompareIds((ids) => ids.filter((x) => x !== id));
            if (compareIds.length <= 2) setComparing(false);
          }}
          onCustomise={(fit) => {
            setComparing(false);
            setEditing(fit);
          }}
        />
      )}

      {editing &&
        editingProduct &&
        applicant &&
        pack &&
        (editing.product_type === "ULIP" ? (
          <UlipCustomizer
            fit={editing}
            product={editingProduct}
            funds={editingProduct.ulip_fund_ids.map((id) => pack.funds[id]).filter(Boolean)}
            applicant={applicant}
            onSave={(p) => {
              addPlan(p);
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        ) : (
          <Customizer
            fit={editing}
            product={editingProduct}
            riders={editingProduct.riders_allowed.map((id) => pack.riders[id]).filter((r) => r && r.rate_basis !== "included_free")}
            applicant={applicant}
            onSave={(p) => {
              addPlan(p);
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        ))}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col text-[#24212B]">
      <JourneyProgress currentStage={3} />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-5 pb-32 pt-6 sm:px-8">{children}</main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20" role="status">
      {children}
    </div>
  );
}
