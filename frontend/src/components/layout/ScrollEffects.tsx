"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const CARD = '[class*="rounded-"][class*="border"]';

function isPinned(el: HTMLElement) {
  const pos = getComputedStyle(el).position;
  return pos === "fixed" || pos === "sticky";
}

/** Marks scroll-reveal targets: section blocks, grid tiles and standalone cards. */
function collect(root: HTMLElement): HTMLElement[] {
  const found = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>(".grid").forEach((g) => {
    if (g.children.length < 2 || g.closest(`${CARD}`) !== null && g.closest(`${CARD}`) !== g) return;
    Array.from(g.children).forEach((c) => found.add(c as HTMLElement));
  });
  root.querySelectorAll<HTMLElement>("section > *").forEach((el) => {
    if (!el.querySelector(".grid")) found.add(el);
  });
  root.querySelectorAll<HTMLElement>(CARD).forEach((el) => {
    if (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "SELECT") return;
    if (el.parentElement?.closest(CARD)) return;
    if (el.parentElement?.classList.contains("grid")) return;
    found.add(el);
  });
  return Array.from(found).filter(
    (el) => !el.hasAttribute("data-no-reveal") && !el.closest("[data-no-reveal]") && !isPinned(el) && !el.classList.contains("sr-only")
  );
}

// First load: wait for React to finish hydrating before touching server-rendered nodes.
let booted = false;

export function ScrollEffects() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);

  // Reveal-on-scroll, re-armed whenever the page content changes
  useLayoutEffect(() => {
    let cleanup = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      cleanup = setupReveal();
    };
    if (booted) start();
    else timer = setTimeout(start, 200);
    return () => {
      if (timer) clearTimeout(timer);
      cleanup();
    };
    function setupReveal() {
    const root = document.getElementById("main-content");
    if (!root) return () => {};
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const tall = e.boundingClientRect.height > window.innerHeight * 0.7;
          // a very tall block can never be 12% visible, so any overlap is enough for it
          if (!tall && e.intersectionRatio < 0.12) return;
          (e.target as HTMLElement).classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { threshold: [0, 0.12], rootMargin: "0px 0px -6% 0px" }
    );

    // Safety net for blocks that grow after they were tagged (for example when data loads): check visibility directly
    const sweep = () => {
      const vh = window.innerHeight;
      root.querySelectorAll<HTMLElement>(".ls-reveal:not(.is-in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        const visible = Math.min(r.bottom, vh * 0.94) - Math.max(r.top, 0);
        const tall = el.offsetHeight > vh * 0.7;
        if (visible > 0 && (tall || visible >= 0.12 * el.offsetHeight)) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    };

    const arm = () => {
      // tall blocks get a plain fade: a 3D tilt on a tall element swings its content far off screen
      root.querySelectorAll<HTMLElement>(".ls-reveal:not(.is-in)").forEach((el) => {
        el.classList.toggle("ls-reveal-flat", el.offsetHeight > window.innerHeight * 0.7);
      });
      collect(root).forEach((el) => {
        if (el.classList.contains("ls-reveal")) return;
        if (el.offsetHeight > window.innerHeight * 0.7) el.classList.add("ls-reveal-flat");
        const idx = Array.from(el.parentElement?.children ?? []).indexOf(el);
        el.style.setProperty("--ls-d", `${Math.min(Math.max(idx, 0), 6) * 70}ms`);
        el.classList.add("ls-reveal");
        if (reduce) el.classList.add("is-in");
        else io.observe(el);
      });
      sweep();
    };
    arm();
    let sweepRaf = 0;
    const onScrollSweep = () => {
      cancelAnimationFrame(sweepRaf);
      sweepRaf = requestAnimationFrame(sweep);
    };
    window.addEventListener("scroll", onScrollSweep, { passive: true });

    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(arm);
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sweepRaf);
      window.removeEventListener("scroll", onScrollSweep);
    };
    }
  }, [pathname]);

  // Scroll progress, parallax and scroll-driven 3D tilt
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (reduce) return;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const k = parseFloat(el.dataset.parallax || "0.1");
        el.style.translate = `0 ${(-y * k).toFixed(1)}px`;
      });
      document.querySelectorAll<HTMLElement>("[data-scroll-tilt]").forEach((el) => {
        const max = parseFloat(el.dataset.scrollTilt || "10");
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (r.top - vh * 0.35) / (vh * 0.65)));
        el.style.rotate = `x ${(p * max).toFixed(2)}deg`;
      });
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    const t = setTimeout(() => {
      booted = true;
      update();
    }, booted ? 0 : 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return <div ref={barRef} className="ls-progress" aria-hidden="true" />;
}
