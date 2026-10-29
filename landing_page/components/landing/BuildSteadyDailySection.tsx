import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import { Droplets } from "lucide-react";

export default function BuildSteadyDailySection({ t }: { t: Dict }) {
  return (
    <div className="site-md-mb-15">
      <h2 data-reveal="soft" className="site-mx-auto max-w-5xl text-center md:text-5xl text-3xl font-medium leading-tight tracking-tight text-black site-mb-10">
        {` ${t.intro.a} `}
        <span className="site-relative site-inline-flex md:h-11 h-6.5 md:w-22.5 w-12.5 overflow-hidden align-middle rounded-[3.40282e38px]">
          <img
            src="/images/photos/paddy.webp"
            className="site-absolute h-full w-full site-object-cover inset-[calc(var(--spacing)_*_0)] [animation:8s_infinite_imageSwap]"
            alt=""
          />
          <img
            src="/images/photos/tank.webp"
            className="site-absolute h-full w-full site-object-cover inset-[calc(var(--spacing)_*_0)] [animation:8s_infinite_imageSwap2]"
            alt=""
          />
          <img
            src="/images/photos/canal.webp"
            className="site-absolute h-full w-full site-object-cover inset-[calc(var(--spacing)_*_0)] [animation:8s_infinite_imageSwap3]"
            alt=""
          />
          <img
            src="/images/photos/harvest.webp"
            className="site-absolute h-full w-full site-object-cover inset-[calc(var(--spacing)_*_0)] [animation:8s_infinite_imageSwap4]"
            alt=""
          />
        </span>
        {` ${t.intro.b} `}
        <br className="site-lg-block site-hidden" />
        {` ${t.intro.c} `}
        <span className="site-mx-1 site-inline-flex align-middle">
          <span className="site-flex md:size-15 size-7.5 items-center justify-center rounded-full bg-sky-500 text-white">
            <Droplets className="md:size-8 size-4" />
          </span>
        </span>
        {` ${t.intro.d} `}
      </h2>
      <p data-reveal="up" style={css({ "--delay": "120ms" })} className="lg:text-2xl md:text-xl text-base site-text-default-500 font-medium site-mb-3-5">
        {t.intro.sub}
      </p>
      {"  "}
      <div data-stagger style={css({ "--step": "70ms" })} className="site-flex flex-wrap justify-center gap-3.5">
        {t.intro.tags.map((buildSteadyItem, i) => (
          <span
            key={i}
            className="site-px-3-5 site-py-2 bg-default-200 text-sm font-semibold text-default-800 rounded-[3.40282e38px]"
          >
            {buildSteadyItem}
          </span>
        ))}
      </div>
    </div>
  );
}
