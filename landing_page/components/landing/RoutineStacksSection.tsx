import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import { Send } from "lucide-react";
import { SITE } from "../../lib/site";

export default function RoutineStacksSection({ t }: { t: Dict }) {
  return (
    <div data-reveal="up" className="lg:col-span-2">
      <div className="site-relative overflow-hidden rounded-2xl bg-black lg:p-10 md:p-5 p-3.5 bg-[linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.55)),url(/images/photos/canal-wide.webp)]">
        {"  "}
        <div className="site-absolute inset-[calc(var(--spacing)_*_0)] bg-[#0006] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-black)_40%,_transparent)]" />
        <div className="site-relative site-z-10 site-grid grid-cols-1 items-center md:gap-10 gap-6 md:grid-cols-2">
          <div className="site-flex h-full flex-col justify-between">
            <div className="lg:max-w-md">
              <h3 className="md:text-2xl text-xl font-semibold leading-tight text-white site-mb-2-5">
                {t.features.report.title}
              </h3>
              <p className="md:text-lg text-base leading-relaxed text-default-400 site-md-mb-7-5 site-mb-5">
                {t.features.report.text}
              </p>
              {"  "}
              <a
                href={SITE.appUrl}
                className="group site-inline-flex site-relative overflow-hidden bg-white md:px-8.5 site-px-3-5 py-3 md:py-3 md:text-lg text-sm font-medium text-black site-transition-all duration-300 hover:scale-95 rounded-[3.40282e38px]"
              >
                <span className="site-relative site-block overflow-hidden">
                  <span className="site-block transition-transform duration-300 group-hover:-translate-y-full">
                    {t.features.report.cta}
                  </span>
                  <span className="site-absolute top-full site-block transition-transform duration-300 group-hover:-translate-y-full left-[calc(var(--spacing)_*_0)]">
                    {t.features.report.cta}
                  </span>
                </span>
              </a>{" "}
            </div>
            <p className="site-md-mt-14 site-mt-5 text-sm site-text-default-500">
              {t.features.report.note}
            </p>
          </div>
          <div className="site-relative site-flex items-end justify-center lg:justify-end">
            <img data-reveal="right" style={css({ "--delay": "220ms" })}
              src="/images/screens/phone-report.webp"
              alt="Reporting a blocked canal with a photo"
              className="site-mb-68 md:w-80 w-60 h-auto pt-5 site-z-30 object-contain"
            />
            <div data-reveal="pop" style={css({ "--delay": "650ms" })} className="hidden md:block site-absolute lg:inset-e-82 inset-e-65 md:top-25 top-20 site-z-30 lg:w-52 w-36 rounded-2xl bg-white p-4 text-left shadow-2xl">
              <p className="text-xs text-default-500">REP-000012</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-default-800">{t.features.report.status}</p>
              <p className="mt-3 site-flex items-center gap-1.5 text-xs font-medium text-sky-600">
                <span className="tick-pop"><Send className="size-3.5" /></span> {t.features.report.sent}
              </p>
              <p className="mt-2 text-xs leading-snug text-default-600">&ldquo;{t.features.report.officer}&rdquo;</p>
            </div>
            <div className="site-absolute bg-gradient-to-l site-from-transparent site-via-transparent site-to-black-40 inset-[calc(var(--spacing)_*_0)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
