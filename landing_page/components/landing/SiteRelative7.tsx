import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import { BellRing, PhoneCall } from "lucide-react";

export default function SiteRelative7({ t }: { t: Dict }) {
  return (
    <div data-reveal="up" style={css({ "--delay": "120ms" })} className="site-relative overflow-hidden rounded-3xl bg-default-900 lg:p-10 p-5">
      {"  "}
      <div className="site-absolute size-125 -translate-x-1/2 -translate-y-1/2 blur-3xl top-[50%] left-[50%] rounded-[3.40282e38px] bg-[#0022ff1a] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-primary)_10%,_transparent)]" />
      {"  "}
      <div className="site-relative site-z-10">
        {"  "}
        <div className="max-w-xl">
          <h3 className="md:text-2xl text-xl font-semibold leading-tight text-white site-mb-2-5">
            {t.features.alerts.title}
          </h3>
          <p className="text-lg leading-relaxed text-default-300 w-full max-w-sm">
            {t.features.alerts.text}
          </p>
        </div>
        {"  "}
        <div className="site-relative site-lg-mt-14 site-mt-6 site-flex justify-center">
          <div className="site-absolute site-z-20-2 w-full max-w-md -translate-y-1/2 rounded-2xl p-6 top-27">
            {"  "}
            <div className="site-absolute md:left-4 md:-top-22 -top-20 rotate-[-20deg] left-[calc(var(--spacing)_*_0)]">
              <div className="site-relative">
                <span className="bell-ring site-flex md:size-18 size-10 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg">
                  <BellRing className="md:size-9 size-5" />
                </span>
                {"  "}
                <div className="site-absolute right-2 top-2 site-md-flex site-hidden size-7 items-center justify-center bg-primary-7 text-xs font-bold text-white rounded-[3.40282e38px]">
                  {" 1 "}
                </div>
              </div>
            </div>
          </div>
          <div className="site-flex w-full flex-col items-center">
            <div data-reveal="soft" style={css({ "--delay": "420ms" })} className="w-90 max-w-full site-md-mt-12 site-mt-6 rounded-2xl border border-white/10 bg-white/10 p-5 text-left text-white backdrop-blur-md">
              <p className="text-xs text-default-300">SMS · YalaMaha · 07:30</p>
              <p className="mt-2 text-base font-semibold">{t.features.alerts.smsTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-default-200">
                {t.features.alerts.smsBody}
              </p>
            </div>
            <div
              data-reveal="soft"
              style={css({ "--delay": "750ms" })}
              className="w-90 max-w-full site-mt-4 site-flex items-center gap-3 rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-left text-white backdrop-blur-md"
            >
              <span className="call-pulse site-flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500">
                <PhoneCall className="size-5" />
              </span>
              <span>
                <span className="block text-xs text-red-100/80">{t.features.alerts.callLabel}</span>
                <span className="block text-sm font-semibold">{t.features.alerts.callBody}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
