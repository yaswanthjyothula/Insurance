"use client";

import { useEffect, useState } from "react";

export interface Section {
  id: string;
  label: string;
}

/** Jump links for a long page. The current section is tracked as it scrolls past; the browser's own scrolling is left alone. */
export function SectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    // The current section is the last one whose top has scrolled up under the sticky headers
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 170) current = section.id;
      }
      // A short last section can never reach the top, so reaching the bottom of the page selects it
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4)
        current = sections[sections.length - 1]?.id ?? current;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <nav
      aria-label="Sections"
      className="sticky top-16 z-20 -mx-4 border-b border-[#E8E5F0] bg-[#F8F7FC]/90 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <ul className="m-0 flex list-none gap-1 overflow-x-auto p-0 py-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={`block whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active === section.id ? "bg-[#171B3D] text-white" : "text-[#6F6A7C] hover:bg-white hover:text-[#24212B]"
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
