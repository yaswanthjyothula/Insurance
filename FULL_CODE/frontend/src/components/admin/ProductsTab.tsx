"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { m } from "motion/react";
import { Drawer, Toggle } from "@/components/admin/AdminUi";
import { useAdminConfig } from "@/components/admin/AdminConfigProvider";
import { ProductForm } from "@/components/admin/ProductForm";
import { Panel } from "@/components/advisor/dashboard/parts";
import { rise, stagger } from "@/components/advisor/motion";
import { blankProduct, inrShort, productPatch, validateProduct } from "@/lib/admin-form";
import { errorMessage } from "@/lib/error-message";
import type { Category, ProductConfig } from "@/types/admin";

const CATEGORIES: ("All" | Category)[] = ["All", "Term Life", "Whole Life", "Endowment", "ULIP"];

export function ProductsTab() {
  const { config, busy, saveProduct, addProduct, removeProduct } = useAdminConfig();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [editing, setEditing] = useState<{ saved: ProductConfig; draft: ProductConfig } | null>(null);
  const [adding, setAdding] = useState<ProductConfig | null>(null);
  const [tried, setTried] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (config?.products ?? []).filter(
      (p) =>
        (category === "All" || p.category === category) && (!needle || `${p.product_name} ${p.product_id}`.toLowerCase().includes(needle)),
    );
  }, [config, query, category]);
  if (!config) return null;

  const ids = config.products.map((p) => p.product_id);
  const riderName = (id: string) => config.available_riders.find((r) => r.rider_id === id)?.rider_name ?? id;

  const toggleActive = async (p: ProductConfig, active: boolean) => {
    setMessage(null);
    try {
      const r = await saveProduct(p.product_id, { active });
      setMessage({ ok: true, text: `${p.product_name} is now ${active ? "offered" : "switched off"} (version ${r.version}).` });
    } catch (failure) {
      setMessage({ ok: false, text: errorMessage(failure, "We couldn't change that product.") });
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setTried(true);
    if (Object.keys(validateProduct(editing.draft)).length) return;
    const patch = productPatch(editing.draft, editing.saved);
    if (Object.keys(patch).length === 0) return setEditing(null);
    try {
      const r = await saveProduct(editing.saved.product_id, patch);
      setMessage({ ok: true, text: `${editing.draft.product_name} saved as version ${r.version}. The next quote uses it.` });
      setEditing(null);
      setTried(false);
    } catch (failure) {
      setMessage({ ok: false, text: errorMessage(failure, "We couldn't save the product.") });
    }
  };

  const saveNew = async () => {
    if (!adding) return;
    setTried(true);
    if (Object.keys(validateProduct(adding, ids, true)).length) return;
    try {
      const r = await addProduct(adding);
      setMessage({ ok: true, text: `${adding.product_name} added as version ${r.version}. It is already being quoted and recommended.` });
      setAdding(null);
      setTried(false);
    } catch (failure) {
      setMessage({ ok: false, text: errorMessage(failure, "We couldn't add the product.") });
    }
  };

  const remove = async (p: ProductConfig) => {
    setMessage(null);
    try {
      await removeProduct(p.product_id);
      setMessage({ ok: true, text: `${p.product_name} was deleted.` });
    } catch (failure) {
      setMessage({ ok: false, text: errorMessage(failure, "We couldn't delete the product.") });
    } finally {
      setConfirmDelete(null);
    }
  };

  const dirtyEdit = editing ? Object.keys(productPatch(editing.draft, editing.saved)).length > 0 : false;

  return (
    <Panel
      title="Products and rates"
      aside={
        <button
          type="button"
          onClick={() => {
            setAdding(blankProduct());
            setTried(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#3D55E0] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#2F44C4]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add product
        </button>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A59FB5]" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or ID"
            aria-label="Search products"
            className="w-full rounded-xl border border-[#D9D3E8] py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${category === c ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#E8E5F0] bg-white text-[#6F6A7C] hover:border-[#B9C3FF]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`m-0 mb-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8E5F0] text-[11px] font-bold uppercase tracking-wide text-[#8A849A]">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Base rate</th>
              <th className="px-3 py-2">Entry age</th>
              <th className="px-3 py-2">Sum assured</th>
              <th className="px-3 py-2">Riders</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2 text-right">Edit</th>
            </tr>
          </thead>
          <m.tbody variants={stagger} initial="hidden" animate="show" key={`${category}-${query}`}>
            {rows.map((p) => (
              <m.tr
                key={p.product_id}
                variants={rise}
                className={`border-b border-[#F1EDFC] transition-colors hover:bg-[#FBFAFF] ${p.active ? "" : "bg-[#FAFAFB] text-[#8A849A]"}`}
              >
                <td className="px-3 py-3">
                  <span className="block font-bold text-[#0E1330]">{p.product_name}</span>
                  <span className="block text-xs text-[#8A849A]">
                    {p.product_id} · {p.category}
                    {p.custom ? " · custom" : ""}
                  </span>
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {p.base_rate_per_1000 !== null ? p.base_rate_per_1000 : <span className="text-[#A59FB5]">per premium</span>}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {p.minimum_entry_age}–{p.maximum_entry_age}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {inrShort(p.minimum_sum_assured)} – {inrShort(p.maximum_sum_assured)}
                </td>
                <td className="max-w-[200px] px-3 py-3 text-xs">
                  {p.allowed_riders.length ? p.allowed_riders.map(riderName).join(", ") : <span className="text-[#A59FB5]">None</span>}
                </td>
                <td className="px-3 py-3">
                  <Toggle checked={p.active} onChange={(v) => toggleActive(p, v)} label={`${p.product_name} active`} disabled={busy} />
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing({ saved: p, draft: structuredClone(p) });
                        setTried(false);
                      }}
                      aria-label={`Edit ${p.product_name}`}
                      className="rounded-lg p-2 text-[#6F6A7C] hover:bg-[#EEF1FF] hover:text-[#3D55E0]"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {p.custom &&
                      (confirmDelete === p.product_id ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <button type="button" onClick={() => remove(p)} className="rounded-lg bg-rose-600 px-2 py-1 font-bold text-white">
                            Delete
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(null)} className="px-1 font-semibold text-[#6F6A7C]">
                            Keep
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(p.product_id)}
                          aria-label={`Delete ${p.product_name}`}
                          className="rounded-lg p-2 text-[#A59FB5] hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ))}
                  </div>
                </td>
              </m.tr>
            ))}
          </m.tbody>
        </table>
        {rows.length === 0 && <p className="m-0 px-3 py-8 text-center text-sm text-[#6F6A7C]">No product matches.</p>}
      </div>
      <p className="m-0 mt-4 text-xs text-[#8A849A]">
        Catalogue products can be switched off but not deleted. Products added here can be deleted unless a customer has them in a saved
        plan.
      </p>

      <Drawer open={editing !== null} title={editing ? `Edit ${editing.saved.product_name}` : ""} onClose={() => setEditing(null)} wide>
        {editing && (
          <div className="space-y-5">
            <ProductForm
              draft={editing.draft}
              onChange={(next) => setEditing({ ...editing, draft: next })}
              riders={config.available_riders}
              existingIds={ids}
              showErrors={tried}
            />
            <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-[#E8E5F0] bg-white px-5 py-4">
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy || !dirtyEdit}
                className="rounded-xl bg-[#3D55E0] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F44C4] disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save product"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6F6A7C] hover:text-[#0E1330]"
              >
                Cancel
              </button>
              {dirtyEdit && <span className="self-center text-xs font-semibold text-[#3D55E0]">Unsaved changes</span>}
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={adding !== null} title="Add a new insurance product" onClose={() => setAdding(null)} wide>
        {adding && (
          <div className="space-y-5">
            <ProductForm
              draft={adding}
              onChange={setAdding}
              riders={config.available_riders}
              existingIds={ids}
              creating
              showErrors={tried}
            />
            <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-[#E8E5F0] bg-white px-5 py-4">
              <button
                type="button"
                onClick={saveNew}
                disabled={busy}
                className="rounded-xl bg-[#3D55E0] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F44C4] disabled:opacity-40"
              >
                {busy ? "Adding…" : "Add product"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6F6A7C] hover:text-[#0E1330]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </Panel>
  );
}
