import type { Dict } from "../../lib/i18n";
import SiteFlex4 from "./SiteFlex4";

export default function SiteRelative6({ t }: { t: Dict }) {
  return (
    <div className="site-relative overflow-hidden rounded-3xl lg:p-10 md:p-5 p-3.5 bg-[url(/images/photos/harvest.webp)]">
      {"  "}
      <div className="site-absolute bg-gradient-to-b inset-[calc(var(--spacing)_*_0)] [--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position),_var(--tw-gradient-from)_var(--tw-gradient-from-position),_var(--tw-gradient-to)_var(--tw-gradient-to-position))] [--tw-gradient-via-stops:var(--tw-gradient-position),_var(--tw-gradient-from)_var(--tw-gradient-from-position),_var(--tw-gradient-via)_var(--tw-gradient-via-position),_var(--tw-gradient-to)_var(--tw-gradient-to-position)] [--tw-gradient-from:#0000004d] [--tw-gradient-via:#00000080] [--tw-gradient-to:#000c] [@supports_(color:color-mix(in_lab,_red,_red))]:[--tw-gradient-from:color-mix(in_oklab,_var(--color-black)_30%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:[--tw-gradient-via:color-mix(in_oklab,_var(--color-black)_50%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:[--tw-gradient-to:color-mix(in_oklab,_var(--color-black)_80%,_transparent)]" />
      {"  "}
      <div data-reveal="up" className="site-relative site-z-10">
        {"  "}
        <div className="max-w-2xl site-md-mb-12-5 site-mb-6">
          <h3 className="md:text-2xl text-xl font-semibold leading-tight text-white site-mb-2-5">
            {t.features.nearby.title}
          </h3>
          <p className="md:text-lg text-base leading-relaxed text-default-300 md:w-sm">
            {t.features.nearby.text}
          </p>
        </div>
        {"  "}
        <div className="site-mx-auto max-w-5xl rounded-3xl p-7.5 backdrop-blur-xl bg-[#000000d9] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-black)_85%,_transparent)]">
          <h4 className="text-center md:text-lg text-base font-semibold text-white">
            {t.features.nearby.readings}
          </h4>
          {"  "}
          <div className="site-mt-7-5 site-grid grid-cols-2 gap-7.5 text-center md:grid-cols-3">
            <SiteFlex4 percent={18.37} description="Badulu Oya" status={t.features.nearby.low} />
            <SiteFlex4 percent={47.18} description="Mallipotha" status={t.features.nearby.yours} big />
            <SiteFlex4 percent={3.12} description="Demodara" status={t.features.nearby.critical} />
          </div>
        </div>
        {"  "}
        <div className="site-mt-7-5 md:gap-7.5 gap-2 site-grid grid-cols-2">
          <div className="rounded-2xl site-border p-5 backdrop-blur-xl border-[#ffffff1a] bg-[#0006] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-white)_10%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-black)_40%,_transparent)]">
            <div className="site-md-flex items-start md:justify-between gap-6">
              <div>
                <p className="text-lg leading-snug text-white">
                  {t.features.nearby.rainA}
                  <br />
                  {t.features.nearby.rainB}
                </p>
              </div>
              <h3 className="lg:text-4xl md:text-3xl text-2xl font-semibold text-white">
                <span data-count="115" data-suffix=" mm">115 mm</span>
              </h3>
            </div>
            <p className="site-md-mt-7-5 site-mt-4 text-lg text-default-400">
              {t.features.nearby.rainSub}
            </p>
          </div>
          <div className="rounded-2xl site-border p-5 backdrop-blur-xl border-[#ffffff1a] bg-[#0006] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-white)_10%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-black)_40%,_transparent)]">
            <div className="site-md-flex items-start md:justify-between gap-6">
              <div>
                <p className="text-lg leading-snug text-white">{t.features.nearby.in14}</p>
              </div>
              <h3 className="lg:text-4xl md:text-3xl text-2xl font-semibold text-white"><span data-count="55" data-suffix="%">55%</span></h3>
            </div>
            <p className="site-md-mt-7-5 site-mt-4 text-lg text-default-400">
              {t.features.nearby.up}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
