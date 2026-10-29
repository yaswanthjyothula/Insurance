import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  dark?: boolean;
}

export function ShieldIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-[10px] grid place-items-center shrink-0`}
      style={{
        background: "linear-gradient(145deg,#9277FF,#7957FF)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6),0 6px 18px rgba(121,87,255,0.35)",
        transform: "perspective(200px) rotateY(-14deg) rotateX(8deg)",
      }}
      aria-hidden="true"
    >
      <div className="w-[35%] h-[41%] border-2 border-white rounded-[2px_2px_8px_8px]" />
    </div>
  );
}

export function Logo({ className = "", variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return (
      <Link href="/" className={`inline-flex items-center gap-2 focus:ring-2 focus:ring-[#7957FF] rounded p-1 ${className}`} aria-label="LifeSure AI Home">
        <ShieldIcon />
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex items-center group focus:ring-2 focus:ring-[#7957FF] rounded p-1 ${className}`} aria-label="LifeSure AI Home">
      <span className="font-extrabold text-[28px] tracking-[-0.04em] text-[#24212B] whitespace-nowrap leading-none">
        LifeSure <span className="text-[#7957FF]">AI</span>
      </span>
    </Link>
  );
}
