"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { safeNextPath } from "@/components/auth/session-helpers";

function SignInContent() {
  const params = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "signin";
  return <AuthPanel initialMode={mode} next={safeNextPath(params.get("next"))} />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-sm text-[#6F6A7C]">Loading…</div>}>
      <SignInContent />
    </Suspense>
  );
}
