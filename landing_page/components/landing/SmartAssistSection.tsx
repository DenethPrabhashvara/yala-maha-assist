import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import { CloudRain, PhoneCall, Sparkles, TriangleAlert, Waves } from "lucide-react";
import { SITE } from "../../lib/site";

export default function SmartAssistSection({ t }: { t: Dict }) {
  return (
    <section className="lg:pb-50 pb-25" id="smart-assist">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        {"  "}
        <div className="site-grid grid-cols-1 md:grid-cols-2 gap-7.5 items-center site-mb-20">
          <div data-stagger style={css({ "--step": "120ms" })}>
            {" "}
            <span className="site-inline-block px-5 py-1.5 text-sm font-medium bg-white site-border site-border-default-200 text-default-800 site-mb-2-5 rounded-[3.40282e38px]">
              {t.forecast.badge}
            </span>{" "}
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium site-text-default-900 tracking-tight leading-tight site-mb-2-5">
              {` ${t.forecast.titleA} `}
              <br className="site-hidden site-md-block" />
              {` ${t.forecast.titleB} `}
            </h3>
            <p className="site-text-default-500 md:text-lg text-base md:leading-relaxed leading-normal max-w-lg site-mb-6">
              {t.forecast.text}
            </p>
            <div>
              {" "}
              <a
                href={SITE.appUrl}
                className="group site-relative px-8.5 overflow-hidden bg-black text-white site-inline-flex items-center justify-center hover:scale-95 site-transition-all duration-300 rounded-[3.40282e38px] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)]! [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)]!"
              >
                <div className="site-relative site-inline-flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-full">
                  <div className="site-flex items-center gap-3 h-14">
                    <span className="font-medium">{t.forecast.cta}</span>
                  </div>
                  <div className="site-flex items-center gap-3 h-14 site-absolute top-full">
                    <span className="font-medium">{t.forecast.cta}</span>
                  </div>
                </div>
              </a>{" "}
            </div>
          </div>
          <div className="site-relative w-full lg:max-w-4xl site-mx-auto lg:aspect-[4/3] md:aspect-video site-flex items-center justify-center rounded-2xl overflow-hidden group lg:h-142 h-100 bg-[url(/images/photos/paddy-wide.webp)] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_25px_50px_-12px_var(--tw-shadow-color,#00000040)]">
            <div className="site-absolute -right-16 top-10 md:top-20 transition-transform duration-700 ease-out">
              <img data-reveal="right" style={css({ "--delay": "200ms" })}
                src="/images/screens/phone-water.webp"
                alt="The Water screen: farm and tank on a satellite map, with the tank level"
                className="lg:w-xs h-auto -rotate-20"
              />
            </div>
            <div data-stagger style={css({ "--step": "160ms" })} className="site-absolute left-6 md:left-12 top-12 md:top-20 site-lg-flex flex-col gap-4 site-z-30 site-hidden">
              <div>
<div className="w-48 md:w-64 rounded-2xl bg-white/90 p-4 text-left shadow-xl backdrop-blur">
                  <p className="text-xs text-default-500">{t.forecast.cards[0][0]}</p>
                  <p className="mt-1 text-sm font-semibold text-default-800 md:text-base">{t.forecast.cards[0][1]}</p>
                  <span className="mt-2 inline-block rounded-full bg-default-200 px-2.5 py-1 text-xs font-medium text-default-700">{t.forecast.cards[0][2]}</span>
                </div>
              </div>
              <div>
<div className="w-48 md:w-64 site-ms-2 site-md-ms-4 rounded-2xl bg-white/90 p-4 text-left shadow-xl backdrop-blur">
                  <p className="text-xs text-default-500">{t.forecast.cards[1][0]}</p>
                  <p className="mt-1 text-sm font-semibold text-default-800 md:text-base">{t.forecast.cards[1][1]}</p>
                  <span className="mt-2 inline-block rounded-full bg-default-200 px-2.5 py-1 text-xs font-medium text-default-700">{t.forecast.cards[1][2]}</span>
                </div>
              </div>
              <div>
<div className="w-48 md:w-64 rounded-2xl bg-white/90 p-4 text-left shadow-xl backdrop-blur">
                  <p className="text-xs text-default-500">{t.forecast.cards[2][0]}</p>
                  <p className="mt-1 text-sm font-semibold text-default-800 md:text-base">{t.forecast.cards[2][1]}</p>
                  <span className="mt-2 inline-block rounded-full bg-default-200 px-2.5 py-1 text-xs font-medium text-default-700">{t.forecast.cards[2][2]}</span>
                </div>
              </div>
            </div>
            <div className="site-absolute bottom-20 left-40 site-z-30 site-lg-block site-hidden">
              <div>
                <span data-reveal="pop" style={css({ "--delay": "900ms" })} className="site-flex size-16 items-center justify-center rounded-full bg-sky-500 text-white shadow-xl">
                  <Sparkles className="size-8" />
                </span>
              </div>
            </div>
            <div className="site-absolute pointer-events-none bg-gradient-to-t to-transparent inset-[calc(var(--spacing)_*_0)] [--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position),_var(--tw-gradient-from)_var(--tw-gradient-from-position),_var(--tw-gradient-to)_var(--tw-gradient-to-position))] [--tw-gradient-from:#0000000d] [@supports_(color:color-mix(in_lab,_red,_red))]:[--tw-gradient-from:color-mix(in_oklab,_var(--color-black)_5%,_transparent)]" />
          </div>
        </div>
        {"  "}
        <div data-stagger style={css({ "--step": "100ms" })} className="site-grid grid-cols-2 lg:grid-cols-4 md:gap-7.5 gap-2.5 site-mt-24">
          <div className="lift lg:p-7.5 md:p-5 p-3.5 bg-white rounded-2xl group site-flex flex-col justify-end lg:gap-y-17.5 md:gap-y-10 gap-y-6.5">
            <div className="size-12.5 site-flex justify-center items-center bg-primary-3 rounded-[3.40282e38px]">
              <CloudRain className="size-5 text-white" />
            </div>
            <div>
              <h4 className="md:text-2xl text-xl font-medium site-text-default-900 site-mb-2-5">
                {t.forecast.tiles[0][0]}
              </h4>
              <p className="text-default-700 md:text-lg text-sm leading-normal">
                {t.forecast.tiles[0][1]}
              </p>
            </div>
          </div>
          <div className="lift lg:p-7.5 md:p-5 p-3.5 bg-white rounded-2xl group site-flex flex-col justify-end lg:gap-y-17.5 md:gap-y-10 gap-y-6.5">
            <div className="size-12.5 site-flex justify-center items-center bg-primary-7 rounded-[3.40282e38px]">
              <Waves className="size-5 text-white" />
            </div>
            <div>
              <h4 className="md:text-2xl text-xl font-medium site-text-default-900 site-mb-2-5">
                {t.forecast.tiles[1][0]}
              </h4>
              <p className="text-default-700 md:text-lg text-sm leading-normal">
                {t.forecast.tiles[1][1]}
              </p>
            </div>
          </div>
          <div className="lift lg:p-7.5 md:p-5 p-3.5 bg-white rounded-2xl group site-flex flex-col justify-end lg:gap-y-17.5 md:gap-y-10 gap-y-6.5">
            <div className="size-12.5 site-flex justify-center items-center bg-primary-6 rounded-[3.40282e38px]">
              <TriangleAlert className="size-5 text-white" />
            </div>
            <div>
              <h4 className="md:text-2xl text-xl font-medium site-text-default-900 site-mb-2-5">
                {t.forecast.tiles[2][0]}
              </h4>
              <p className="text-default-700 md:text-lg text-sm leading-normal">
                {t.forecast.tiles[2][1]}
              </p>
            </div>
          </div>
          <div className="lift lg:p-7.5 md:p-5 p-3.5 bg-white rounded-2xl group site-flex flex-col justify-end lg:gap-y-17.5 md:gap-y-10 gap-y-6.5">
            <div className="size-12.5 site-flex justify-center items-center bg-primary-2 rounded-[3.40282e38px]">
              <PhoneCall className="size-5 text-white" />
            </div>
            <div>
              <h4 className="md:text-[21px] text-xl font-medium site-text-default-900 site-mb-2-5">
                {t.forecast.tiles[3][0]}
              </h4>
              <p className="text-default-700 md:text-lg text-sm leading-normal">
                {t.forecast.tiles[3][1]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
