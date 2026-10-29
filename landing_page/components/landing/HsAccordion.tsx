import type { ReactNode } from "react";

export interface HsAccordionProps {
  id: string;
  title: string;
  text: ReactNode;
  open: boolean;
  onToggle: () => void;
}

export default function HsAccordion({ id, title, text, open, onToggle }: HsAccordionProps) {
  return (
    <div className={`hs-accordion bg-white site-border border-zinc-100 rounded-2xl site-shadow-sm hs-accordion-active:shadow-md site-transition-all duration-300${open ? " active" : ""}`} id={`${id}-heading`}>
      <button type="button" className="hs-accordion-toggle hs-accordion-active:text-default-950 site-inline-flex items-center justify-between w-full lg:p-5 p-3.5 text-start font-bold site-text-default-900 transition site-hover-text-zinc-500" aria-expanded={open} aria-controls={`${id}-answer`} onClick={onToggle}>
        <h3 className="text-base md:text-xl font-medium">{title}</h3>
        <div className="hs-accordion-active:rotate-45 site-relative md:size-8.5 size-6.5 bg-default-200 site-flex items-center justify-center transition-transform duration-300 shrink-0 rounded-[3.40282e38px]">
          <i className="iconify lucide--plus md:size-5 size-3 text-default-800" />
        </div>
      </button>
      <div
        className={`faq-panel${open ? " is-open" : ""} w-full`}
        id={`${id}-answer`}
        role="region"
        aria-labelledby={`${id}-heading`}
        aria-hidden={!open}
      >
        <div>
          <div className="lg:px-5 lg:pb-5 site-px-3-5 pb-3.5 text-zinc-500 md:text-lg text-base md:leading-relaxed leading-normal">{text}</div>
        </div>
      </div>
    </div>
  );
}
