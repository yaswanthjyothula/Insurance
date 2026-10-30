"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/components/auth/session-helpers";

function SignUpRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));

  useEffect(() => {
    router.replace(`/sign-in?mode=signup&next=${encodeURIComponent(next)}`);
  }, [router, next]);

  return <div className="min-h-[70vh] flex items-center justify-center text-sm text-[#6F6A7C]">Opening registration…</div>;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpRedirect />
    </Suspense>
  );
}
