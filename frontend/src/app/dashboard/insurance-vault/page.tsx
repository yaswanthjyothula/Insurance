"use client";

import React, { useState, useEffect } from "react";
import { Lock, UploadCloud, Trash2, CheckCircle2, FileText } from "lucide-react";
import { fetchFromAPI } from "@/lib/api";

export default function EmergencyVaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Term Insurance Policy Bond");
  const [loading, setLoading] = useState(false);

  const loadVault = async () => {
    try {
      const data = await fetchFromAPI("/vault/documents");
      setDocuments(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVault();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    try {
      const body = new FormData();
      body.append("title", title);
      body.append("category", category);
      
      const res = await fetch("http://127.0.0.1:8000/api/v1/vault/upload", {
        method: "POST",
        body
      });
      if (res.ok) {
        setTitle("");
        loadVault();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await fetchFromAPI(`/vault/documents/${docId}`, { method: "DELETE" });
      loadVault();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FFFFFF] text-[#24212B]">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] text-[#7957FF] border border-[#7957FF]/40 text-xs font-extrabold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-[#7957FF]" />
          <span>Encrypted Private Storage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] tracking-tight">
          Emergency Insurance Vault™
        </h1>
        <p className="text-sm font-medium text-[#4A4553] max-w-xl mx-auto">
          Private, encrypted document repository for your policy bonds, endorsement schedules, 
          and nominee instructions.
        </p>
      </div>

      {/* Upload Box */}
      <form onSubmit={handleUpload} className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-xl p-6 space-y-4 text-[#24212B]">
        <h2 className="text-sm font-extrabold text-[#24212B] border-b border-[#D9D3E8] pb-2 uppercase tracking-wider">
          Secure New Document
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-extrabold text-[#24212B] block mb-1">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HDFC Life Term Policy Schedule"
              className="w-full p-2.5 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] text-[#24212B] font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
              required
            />
          </div>

          <div>
            <label className="font-extrabold text-[#24212B] block mb-1">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] text-[#24212B] font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
            >
              <option className="bg-[#FFFFFF] text-[#24212B]">Term Insurance Policy Bond</option>
              <option className="bg-[#FFFFFF] text-[#24212B]">Health Insurance Health Card & Schedule</option>
              <option className="bg-[#FFFFFF] text-[#24212B]">Home Mortgage Loan Sanction Letter</option>
              <option className="bg-[#FFFFFF] text-[#24212B]">Nominee Emergency Letter & Will</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-xs font-extrabold text-[#FFFFFF] bg-[#7957FF] hover:bg-[#6444E6] border border-[#7957FF] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{loading ? "Encrypting & Storing..." : "Upload to Private Vault"}</span>
          </button>
        </div>
      </form>

      {/* Vault Items List */}
      <div className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-xl p-6 space-y-4 text-[#24212B]">
        <div className="flex items-center justify-between border-b border-[#D9D3E8] pb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#24212B]">
            Stored Vault Documents ({documents.length})
          </span>
          <span className="text-xs text-[#24212B] font-bold flex items-center gap-1 bg-[#FFFFFF] border border-[#7957FF]/40 px-2.5 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#24212B]" />
            <span>Encrypted Verification Active</span>
          </span>
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-[#6F6A7C] py-4 text-center font-medium">No documents uploaded yet. Secure your policy certificate above.</p>
        ) : (
          <div className="divide-y divide-[#000000]">
            {documents.map((doc) => (
              <div key={doc.doc_id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] text-[#24212B] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#24212B]" />
                  </div>
                  <div>
                    <div className="font-extrabold text-[#24212B]">{doc.title}</div>
                    <span className="text-xs text-[#4A4553] font-medium">{doc.category} | {doc.size_kb} KB</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold text-[#7957FF] px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#7957FF]/40">
                    Encrypted
                  </span>
                  <button
                    onClick={() => handleDelete(doc.doc_id)}
                    className="p-1.5 text-[#7957FF] hover:bg-[#FFFFFF] rounded transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
