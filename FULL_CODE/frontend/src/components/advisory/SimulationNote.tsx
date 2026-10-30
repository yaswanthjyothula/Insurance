import { Info } from "lucide-react";
import { T } from "@/i18n/I18nProvider";

export function SimulationNote() {
  return (
    <div
      className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] text-[14.5px] leading-normal text-[#4A4553]"
      data-no-reveal
    >
      <Info className="w-4 h-4 mt-1 shrink-0 text-[#7957FF]" />
      <div>
        <strong className="text-[#24212B]">
          <T k="advisory.simulation.title" />
        </strong>{" "}
        <T k="advisory.simulation.body" />
      </div>
    </div>
  );
}
