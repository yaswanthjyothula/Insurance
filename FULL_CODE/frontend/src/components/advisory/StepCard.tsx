import { Check } from "lucide-react";
import { CARD_CLASS } from "@/components/advisory/styles";

interface StepCardProps {
  number: number;
  title: string;
  done: boolean;
  children: React.ReactNode;
}

export function StepCard({ number, title, done, children }: StepCardProps) {
  return (
    <section className={`${CARD_CLASS} p-4 sm:p-8 flex flex-col gap-6`} aria-label={title}>
      <div className="flex items-center gap-3.5">
        <span
          className={`flex-none w-9 h-9 rounded-full grid place-items-center text-[15px] font-extrabold ${done ? "bg-[#7957FF] text-white" : "bg-[#E9E4FF] text-[#7957FF]"}`}
        >
          {done ? <Check className="w-4 h-4" strokeWidth={3} /> : number}
        </span>
        <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
