"use client";

import { useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import type { PackFund, PackProduct, PackRider } from "@/types/api";

export interface Pack {
  products: Record<string, PackProduct>;
  riders: Record<string, PackRider>;
  funds: Record<string, PackFund>;
}

let cached: Promise<Pack> | null = null;

const byId = <T>(items: T[], key: keyof T): Record<string, T> => Object.fromEntries(items.map((i) => [String(i[key]), i]));

/** The catalogue never changes while the app runs, so it is fetched once and shared. */
function loadPack(): Promise<Pack> {
  if (!cached) {
    cached = Promise.all([
      fetchFromAPI<PackProduct[]>("/pack/products"),
      fetchFromAPI<PackRider[]>("/pack/riders"),
      fetchFromAPI<PackFund[]>("/pack/funds"),
    ])
      .then(([products, riders, funds]) => ({
        products: byId(products, "product_id"),
        riders: byId(riders, "rider_id"),
        funds: byId(funds, "fund_id"),
      }))
      .catch((error) => {
        cached = null;
        throw error;
      });
  }
  return cached;
}

export function usePack() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadPack()
      .then(setPack)
      .catch((e: Error) => setError(e.message));
  }, []);
  return { pack, error };
}
