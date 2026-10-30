"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export function SignedInCard({ next }: { next: string }) {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const { full_name: name } = user.user_metadata;

  return (
    <div className="space-y-5 text-center">
      <div
        className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-black text-2xl"
        aria-hidden="true"
      >
        {(name || user.email).charAt(0).toUpperCase()}
      </div>
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{user.demo ? "Signed in as the demo customer" : "Signed in"}</span>
        </div>
        <h2 className="m-0 text-xl font-extrabold text-[#24212B]">{name}</h2>
        <p className="m-0 text-xs text-[#6F6A7C] font-medium">{user.email}</p>
      </div>
      <Link
        href={next}
        className="w-full py-3.5 px-5 bg-[#7957FF] hover:bg-[#6444E6] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="w-full py-3 px-5 bg-white hover:bg-[#FAF9F6] text-[#C23B3B] font-semibold text-xs rounded-2xl border border-[#D9D3E8]"
      >
        Sign out
      </button>
    </div>
  );
}
