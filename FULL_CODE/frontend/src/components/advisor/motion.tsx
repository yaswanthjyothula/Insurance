"use client";

import { LazyMotion, MotionConfig, domMax, m, type Variants } from "motion/react";

/** Loads Motion's features on demand and makes every animation respect the visitor's reduced-motion setting. */
export function AdvisorMotion({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

export const EASE = [0.16, 1, 0.3, 1] as const;

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** A block that fades up when it scrolls into view, once. Only opacity and transform move. */
export function Reveal({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" }) {
  const Tag = as === "section" ? m.section : m.div;
  return (
    <Tag className={className} variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -60px 0px" }}>
      {children}
    </Tag>
  );
}
