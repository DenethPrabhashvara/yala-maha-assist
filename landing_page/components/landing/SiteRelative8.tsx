"use client";

import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";

import { useState } from "react";
import { Building2, Sprout, Users, Wheat } from "lucide-react";
import SiteRelative15 from "./SiteRelative15";
import { SITE } from "../../lib/site";

const items = ["#Yala", "#Maha", "#Mahaweli", "#DryZone", "#MinorTanks", "#HomeGardens"];

const TAB = "hs-tab-active:border-default-800 hs-tab-active:bg-default-100 hs-tab-active:text-default-900 py-2.5 px-5 site-inline-flex items-center gap-x-2.5 site-bg-default-100 site-border site-border-default-200 md:text-lg text-base font-medium site-text-default-500 rounded-xl site-hover-bg-default-100 site-transition-all";

const tabs = [
  {
    label: "Paddy farmers",
    icon: Wheat,
    image: "/images/photos/farmers-wide.webp",
    alt: "Farmers working in a paddy field",
    title: String(SITE.canalSections),
  },
  {
    label: "Vegetable growers",
    icon: Sprout,
    image: "/images/photos/canal-wide.webp",
    alt: "Uda Walawe irrigation canal",
    title: "",
  },
  {
    label: "Farmer organisations",
    icon: Users,
    image: "/images/photos/tank-wide.webp",
    alt: "Nachchaduwa tank",
    title: String(SITE.reservoirs),
  },
  {
    label: "Irrigation offices",
    icon: Building2,
    image: "/images/photos/flood.webp",
    alt: "Flooded fields in Sri Lanka",
    title: String(SITE.riverGauges),
  },
];

export default function SiteRelative8({ t }: { t: Dict }) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const words = t.who.tabs[active];
  const tabPanel = {
    ...tab,
    title: active === 1 ? t.who.days14 : tab.title,
    description: words.description,
    description2: words.stat,
  };

  return (
    <section className="site-relative" id="usecase">
      {"  "}
      <div
        className="site-absolute site-z-0 pointer-events-none opacity-60 inset-[calc(var(--spacing)_*_0)]"
        style={{
          backgroundImage: "radial-gradient(#e5e7eb 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="site-container bg-white site-object-cover site-relative site-z-10 text-center site-lg-p-25 site-p-8-5 site-lg-mx-auto rounded-2xl w-full bg-[url(/assets/img/vector-10-3927df58.png)] [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        <span data-reveal="up" className="site-inline-block px-5 py-1.5 text-sm font-medium bg-white site-border site-border-default-200 text-default-800 site-mb-3-5 rounded-[3.40282e38px]">
          {t.who.badge}
        </span>
        <h2 data-reveal="soft" style={css({ "--delay": "100ms" })} className="site-md-mb-12-5 site-mb-8 text-2xl md:text-4xl lg:text-5xl font-medium tracking-normal site-text-default-900 leading-[1.1]">
          {` ${t.who.titleA} `}
          <br className="site-hidden site-md-block" />
          {` ${t.who.titleB} `}
        </h2>
        <div data-stagger style={css({ "--step": "70ms" })} className="site-flex flex-wrap justify-center md:gap-5 gap-2.5 site-mb-7-5" role="tablist" aria-label={t.who.badge}>
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={t.who.tabs[i].label}
                type="button"
                role="tab"
                id={`tabs-item-${i + 1}`}
                aria-selected={active === i}
                aria-controls="usecase-panel"
                className={`${TAB}${active === i ? " active" : ""}`}
                onClick={() => setActive(i)}
              >
                <Icon className="size-4.5" />
                {t.who.tabs[i].label}
              </button>
            );
          })}
        </div>
        <div data-reveal="wipe" style={css({ "--delay": "150ms" })} className="site-mt-8 site-relative max-w-5xl site-mx-auto">
          <div key={active} id="usecase-panel" role="tabpanel" aria-labelledby={`tabs-item-${active + 1}`} className="tab-swap">
            <SiteRelative15
              image={tabPanel.image}
              alt={tabPanel.alt}
              description={tabPanel.description}
              title={tabPanel.title}
              description2={tabPanel.description2}
            />
          </div>
        </div>
        <div className="site-md-mt-12-5 site-mt-6">
          <p className="text-default-800 text-sm site-mb-2-5 font-medium">
            {t.who.through}
          </p>
          <div className="site-flex flex-wrap justify-center md:gap-6.5 gap-2.5">
            {items.map((item, i) => (
              <span key={i} className="text-sm font-medium transition-colors site-text-default-900">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
