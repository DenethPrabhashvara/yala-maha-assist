"use client";

import type { Dict } from "../../lib/i18n";
import { fill } from "../../lib/i18n";
import { css } from "../../lib/css";

import { useState, type ReactNode } from "react";
import CoverageCheck from "./CoverageCheck";
import HsAccordion from "./HsAccordion";
import { SITE } from "../../lib/site";

export default function FrequentlyAskedQuestionsSection({ t }: { t: Dict }) {
  const faqs: { q: string; a: ReactNode }[] = t.faq.items.map(([q, a], i) => ({
    q,
    a:
      i === 2 ? (
        <>
          {fill(a, { tanks: SITE.reservoirs, rivers: SITE.rivers, canals: SITE.canalSections })}
          <CoverageCheck t={t} />
        </>
      ) : (
        a
      ),
  }));
  const [open, setOpen] = useState(0);

  return (
    <section className="lg:py-25 md:pb-10 py-6" id="faq">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        <div className="site-grid grid-cols-1 lg:grid-cols-12 md:grid-cols-3 lg:gap-25 gap-7.5 items-start">
          <div className="lg:col-span-5 col-span-1 site-lg-space-y-20 site-space-y-10">
            <div className="site-space-y-4">
              <span data-reveal="up" className="site-inline-block px-5 py-1.5 text-sm font-medium bg-white site-border site-border-default-200 text-default-800 site-mb-2-5 rounded-[3.40282e38px]">
                {t.faq.badge}
              </span>
              <h2 data-reveal="soft" style={css({ "--delay": "100ms" })} className="text-2xl md:text-4xl lg:text-5xl font-medium text-default-950 tracking-normal leading-normal">
                {t.faq.title}
              </h2>
            </div>
            <div className="bg-white md:p-7.5 p-5 rounded-2xl site-space-y-6 [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)] [--tw-shadow-color:#e4e4e780] [@supports_(color:color-mix(in_lab,_red,_red))]:[--tw-shadow-color:color-mix(in_oklab,_color-mix(in_oklab,_var(--color-zinc-200)_50%,_transparent)_var(--tw-shadow-alpha),_transparent)]">
              <div className="size-12.5 bg-primary-1 site-flex items-center justify-center rounded-[3.40282e38px] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_10px_15px_-3px_var(--tw-shadow-color,#0000001a),_0_4px_6px_-4px_var(--tw-shadow-color,#0000001a)]">
                <i className="iconify lucide--headset size-6 text-white" />
              </div>
              <div className="site-space-y-6">
                <h3 className="md:text-2xl text-xl font-medium text-default-950 site-mb-3-5">
                  {t.faq.side}
                </h3>
                <a href={SITE.appUrl} className="group site-relative px-8.5 overflow-hidden bg-black text-white site-inline-flex items-center justify-center hover:scale-95 site-transition-all duration-300 text-nowrap rounded-[3.40282e38px] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)]! [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)]!">
                  <div className="site-relative site-inline-flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-full">
                    <div className="site-flex items-center gap-3 h-14">
                      <span className="font-medium">{t.nav.openApp}</span>
                    </div>
                    <div className="site-flex items-center gap-3 h-14 site-absolute top-full">
                      <span className="font-medium">{t.nav.openApp}</span>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 col-span-2 site-space-y-4">
            <div data-stagger style={css({ "--step": "80ms" })} className="lg:col-span-7 site-lg-space-y-4 site-space-y-2-5">
              {faqs.map((faq, i) => (
                <HsAccordion
                  key={faq.q}
                  id={`faq-${i + 1}`}
                  title={faq.q}
                  text={faq.a}
                  open={open === i}
                  onToggle={() => setOpen(open === i ? -1 : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
