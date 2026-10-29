"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Search, HelpCircle, ArrowRight } from "lucide-react";
import { fetchFromAPI } from "@/lib/api";

export default function GlossaryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadGlossary = async (query = "") => {
    setLoading(true);
    try {
      const url = query ? `/resources/glossary?search=${encodeURIComponent(query)}` : "/resources/glossary";
      const data = await fetchFromAPI(url);
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlossary();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGlossary(search);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Searchable Legal & Actuarial Dictionary</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Insurance Glossary
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Plain-English definitions with real-world examples for confusing insurance terminology and statutory clauses.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-[#7F8FA4] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value === "") loadGlossary("");
            }}
            placeholder="Search terms: CSR, Solvency, HLV, Section 45, Free-Look..."
            className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-[#D9D3E8] dark:border-[#1E2D4A] bg-white dark:bg-[#0E1A33] text-[#24212B] dark:text-white focus:outline-[#7957FF]"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 text-xs font-bold text-white bg-[#7957FF] rounded-xl hover:bg-[#6444E6]"
        >
          Search
        </button>
      </form>

      {/* Glossary Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#24212B] dark:text-white">
                {item.term}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#142447] text-[#7957FF] uppercase">
                {item.category}
              </span>
            </div>

            <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
              {item.definition}
            </p>

            <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] text-[11px] text-[#24212B] dark:text-[#F1F5F9] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-1">
              <span className="font-bold text-[#7957FF] block">Real Example:</span>
              <p className="italic text-[#6F6A7C] dark:text-[#A59FB5]">{item.example}</p>
            </div>

            <div className="text-[10px] text-[#0E9F7E] font-semibold pt-1">
              ✓ Why It Matters: {item.importance}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
