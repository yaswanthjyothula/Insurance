"use client";

import { useEffect, useRef } from "react";

/** Site-wide cursor effects: trailing aura, card spotlight, magnetic buttons, click ripple. Fine pointers only. */
export function CursorEffects() {
  const aura = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    const el = aura.current;
    let x = 0, y = 0, ax = 0, ay = 0, raf = 0;

    const loop = () => {
      ax += (x - ax) * 0.22;
      ay += (y - ay) * 0.22;
      if (el) el.style.transform = `translate(${ax}px, ${ay}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      el?.classList.add("is-on");
      const t = e.target as HTMLElement | null;
      el?.classList.toggle("is-hot", !!t?.closest("a, button, [role=button], input[type=range], summary, label"));
      const spot = t?.closest<HTMLElement>(".ls-spot");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((m) => {
        const r = m.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
        m.style.setProperty("--tx", near ? `${Math.max(-8, Math.min(8, dx * 0.18))}px` : "0px");
        m.style.setProperty("--ty", near ? `${Math.max(-8, Math.min(8, dy * 0.18))}px` : "0px");
      });
    };
    const leave = () => el?.classList.remove("is-on");
    const click = (e: MouseEvent) => {
      const r = document.createElement("span");
      r.className = "ls-ripple";
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 650);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("click", click);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("click", click);
    };
  }, []);

  return <div ref={aura} className="ls-aura" aria-hidden />;
}
