import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  dark?: boolean;
}

export function ShieldIcon({ className = "w-8 h-8" }: { className?: string }) {
  return <Image src="/brand-icon.png" alt="LifeSure AI Icon" width={230} height={259} className={`${className} object-contain`} priority />;
}

export function Logo({ className = "", variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return (
      <Link
        href="/"
        className={`inline-flex items-center outline-none focus:outline-none focus:ring-0 select-none ${className}`}
        aria-label="LifeSure AI Home"
      >
        <ShieldIcon className="h-8 w-auto" />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center group outline-none focus:outline-none focus:ring-0 select-none ${className}`}
      aria-label="LifeSure AI Home"
    >
      <Image
        src="/brand-logo.png"
        alt="LifeSure AI"
        width={735}
        height={259}
        className="h-9 md:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
        priority
      />
    </Link>
  );
}
