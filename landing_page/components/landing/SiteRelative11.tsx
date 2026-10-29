"use client";

import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SwiperSlide, { type SwiperSlideProps } from "./SwiperSlide";

const S = "/images/screens/";
const slides: SwiperSlideProps[] = [
  { image: `${S}phone-forecast.webp`, title: "14-day tank forecast", description: "Today's level and where it is heading" },
  { image: `${S}phone-water.webp`, title: "Tank and canals", description: "Your farm and tank on a satellite map" },
  { image: `${S}phone-report.webp`, title: "Report a canal problem", description: "Choose the problem, the canal and add photos" },
  { image: `${S}phone-myreports.webp`, title: "My reports", description: "See when the office has acted, and their note" },
  { image: `${S}phone-fields.webp`, title: "My fields", description: "Your crops, land and last season's yield" },
  { image: `${S}phone-welcome-si.webp`, title: "In Sinhala, Tamil or English", description: "Switch language at any time" },
];

export default function SiteRelative11({ t }: { t: Dict }) {
  const track = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const slide = track.current?.querySelector<HTMLElement>("[role=group]");
    track.current?.scrollBy({ left: direction * ((slide?.offsetWidth || 300) + 15), behavior: "smooth" });
  };

  return (
    <section className="site-relative overflow-hidden text-white pb-25">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        <div className="site-mx-auto site-md-mb-12-5 site-mb-8 text-center">
          <span data-reveal="up" className="site-inline-block px-5 py-1.5 text-sm font-medium bg-white site-border site-border-default-200 text-default-800 site-mb-2-5 rounded-[3.40282e38px]">
            {t.tour.badge}
          </span>{" "}
          <h2 data-reveal="soft" style={css({ "--delay": "100ms" })} className="lg:text-5xl md:text-4xl text-2xl font-semibold tracking-normal site-mb-2-5">
            {t.tour.title}
          </h2>
          <p className="md:text-lg text-base text-default-600">{t.tour.sub}</p>
        </div>
        <div className="site-relative">
          <div data-stagger style={css({ "--step": "90ms" })}
            ref={track}
            className="site-flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="App screens"
          >
            {slides.map((slide, i) => (
              <SwiperSlide key={slide.image} image={slide.image} title={t.tour.slides[i][0]} description={t.tour.slides[i][1]} ariaLabel={`${i + 1} / ${slides.length}`} />
            ))}
          </div>
          <div className="site-flex items-center justify-center gap-3 site-mt-6">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={t.tour.prev}
              className="site-flex size-10 items-center justify-center bg-default-200 hover:bg-primary-2 rounded-[3.40282e38px]"
            >
              <ChevronLeft className="size-6 text-default-800" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={t.tour.next}
              className="site-flex size-10 items-center justify-center bg-default-200 hover:bg-primary-2 rounded-[3.40282e38px]"
            >
              <ChevronRight className="size-6 text-default-800" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
