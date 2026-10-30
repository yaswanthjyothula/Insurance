"use client";

import { useLayoutEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { formatCount } from "@/components/advisor/format";

/** Counts up to a real figure. The final value is in the markup from the start, so assistive tech and reduced-motion users read it at once. */
export function AnimatedNumber({ value, format = formatCount }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || reduce) return;
    node.textContent = format(0);
    const controls = animate(0, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (node.textContent = format(v)) });
    return () => {
      controls.stop();
      node.textContent = format(value);
    };
  }, [value, reduce, format]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}
