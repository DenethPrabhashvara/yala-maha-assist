import type { Dict } from "../../lib/i18n";
import { ArrowDown, CheckCircle2, Droplets } from "lucide-react";
import { SITE } from "../../lib/site";
import { css } from "../../lib/css";

export default function SiteRelative2({ t }: { t: Dict }) {
  return (
    <section className="site-relative site-flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black lg:pt-52 md:pt-40 pt-34">
      <img
        src="/images/photos/paddy-wide.webp"
        alt="Paddy fields in Ampara, Sri Lanka"
        className="hero-photo site-absolute h-full w-full site-object-cover object-center inset-[calc(var(--spacing)_*_0)]"
      />
      <div className="site-absolute inset-[calc(var(--spacing)_*_0)] bg-gradient-to-b from-black/55 via-black/35 to-black/10" />
      <div className="site-container site-relative site-z-10 site-mx-auto site-px-4 w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        <div className="site-flex flex-col items-center text-center">
          <div className="lg:w-70 site-mb-4-5 site-inline-flex items-center gap-2 site-border p-1.5 pe-2 backdrop-blur-md rounded-[3.40282e38px] border-[#ffffff26] bg-[#ffffff1a] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-white)_15%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-white)_10%,_transparent)] hero-in" style={css({ "--delay": "80ms" })}>
            <span className="bg-black site-px-2 py-px text-base font-medium text-white rounded-[3.40282e38px]">
              {t.hero.new}
            </span>
            <span className="text-sm text-white">{t.hero.badge}</span>
          </div>
          <h1 className="hero-title font-medium leading-tight tracking-tight text-white lg:text-[90px] md:text-5xl text-4xl site-lg-mb-7-5 site-mb-5">
            <span className="hero-line">
              <span style={css({ "--delay": "200ms" })}>{t.hero.line1}</span>
            </span>
            <span className="hero-line">
              <span style={css({ "--delay": "330ms" })}>{t.hero.line2}</span>
            </span>
          </h1>
          <p style={css({ "--delay": "560ms" })} className="hero-in site-lg-mb-10 site-mb-6 max-w-sm text-lg leading-normal text-white md:text-xl">
            {t.hero.sub}
          </p>
          <div style={css({ "--delay": "700ms" })} className="hero-in site-flex items-center justify-center md:gap-5 gap-2">
            <a
              href={SITE.appUrl}
              className="group site-relative overflow-hidden bg-white md:px-8.5 site-px-3-5 py-3 md:py-4 md:text-lg text-sm font-medium text-black site-transition-all duration-300 hover:scale-95 rounded-[3.40282e38px]"
            >
              <span className="site-relative site-block overflow-hidden">
                <span className="site-block transition-transform duration-300 group-hover:-translate-y-full">
                  {t.nav.openApp}
                </span>
                <span className="site-absolute top-full site-block transition-transform duration-300 group-hover:-translate-y-full left-[calc(var(--spacing)_*_0)]">
                  {t.nav.openApp}
                </span>
              </span>
            </a>
            <a
              href="#features"
              className="group site-relative overflow-hidden site-border md:px-8.5 site-px-3-5 py-3 md:py-4 md:text-lg text-sm text-white backdrop-blur-md site-transition-all duration-300 hover:scale-95 rounded-[3.40282e38px] border-[#fff3] bg-[#ffffff0d] [@media_(hover:hover)]:[&:hover]:bg-[#ffffff1a] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-white)_20%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-white)_5%,_transparent)] [@media_(hover:hover)]:[@supports_(color:color-mix(in_lab,_red,_red))]:[&:hover]:bg-[color-mix(in_oklab,_var(--color-white)_10%,_transparent)]"
            >
              <div className="site-relative site-flex items-center gap-3 overflow-hidden">
                <div className="site-flex items-center gap-3 transition-transform duration-300 group-hover:-translate-y-full">
                  <ArrowDown className="text-white md:size-6 size-4" />
                  <span className="font-medium">{t.hero.how}</span>
                </div>
                <div className="site-absolute top-full site-flex items-center gap-3 transition-transform duration-300 group-hover:-translate-y-full left-[calc(var(--spacing)_*_0)]">
                  <ArrowDown className="text-white md:size-6 size-4" />
                  <span className="font-medium">{t.hero.how}</span>
                </div>
              </div>
            </a>
          </div>
          <div className="site-relative site-mt-6 site-md-mt-16 site-lg-mt-20 site-flex lg:gap-10 md:gap-5 gap-8 w-full max-w-5xl items-start justify-center">
            <div className="hero-card site-absolute top-8 lg:inset-s-32 md:inset-s-6 lg:size-40 size-35 [inset-inline-start:calc(var(--spacing)_*_0)]" style={css({ "--delay": "1.25s" })}>
              <div className="float-a site-flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-black/55 p-3 text-center text-white backdrop-blur-md shadow-xl">
              <span className="site-flex size-10 items-center justify-center rounded-full bg-sky-500">
                <Droplets className="size-5" />
              </span>
              <span className="text-2xl font-semibold leading-none">{t.hero.tankFull}</span>
              <span className="text-xs leading-snug text-white/80">{t.hero.tankToday}</span>
              </div>
            </div>
            <img
              src="/images/screens/phone-forecast.webp"
              alt="The 14-day tank forecast in the Yala Maha Assist app"
              className="hero-phone site-relative -z-20! lg:w-90 w-75 h-auto site-md-mt-0 site-mt-34"
            />
            <div className="hero-card site-absolute md:bottom-60 top-8 lg:inset-e-14 lg:w-60 w-50 [inset-inline-end:calc(var(--spacing)_*_0)] h-fit" style={css({ "--delay": "1.5s" })}>
              <div className="float-b rounded-2xl border border-white/15 bg-black/55 p-4 text-left text-white backdrop-blur-md shadow-xl">
              <p className="text-xs text-white/70">{t.hero.reportLabel}</p>
              <p className="mt-1 text-sm font-semibold leading-snug">{t.hero.reportTitle}</p>
              <p className="mt-3 site-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="size-4" /> {t.hero.reportSent}
              </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="site-bg-body-bg site-absolute w-full md:h-40 h-18 site-z-20-2 bottom-[calc(var(--spacing)_*_0)]" />
      <img
        src="/assets/img/vector-01-28e0b41a.webp"
        alt=""
        className="w-full top-auto lg:h-110 md:h-100 h-70 site-absolute -bottom-7.5 site-z-20-2"
      />
    </section>
  );
}
