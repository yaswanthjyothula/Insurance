"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in?mode=signup");
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-sm text-[#6F6A7C]">
      Opening LifeSure Registration Portal...
    </div>
  );
}
