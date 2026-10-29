import type { Dict } from "../../lib/i18n";
import { fill } from "../../lib/i18n";
import { css } from "../../lib/css";
import { SITE } from "../../lib/site";

export default function SiteRelative10({ t }: { t: Dict }) {
  return (
    <section className="site-relative lg:pb-46 md:pb-25 pb-20 overflow-hidden">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        {"  "}
        <div data-reveal="up" className="text-center site-mb-2">
          {" "}
          <span className="site-inline-block px-5 py-1.5 text-sm font-medium bg-white site-border site-border-default-200 text-default-800 site-mb-3-5 rounded-[3.40282e38px]">
            {t.coverage.badge}
          </span>{" "}
          <h2 className="lg:text-5xl md:text-4xl text-3xl font-medium site-text-default-900">
            {` ${t.coverage.titleA} `}
            <br />
            {` ${t.coverage.titleB} `}
          </h2>
        </div>
        {"  "}
        <div className="site-relative site-flex flex-col items-center justify-center site-mb-7-5 site-z-20-2">
          <div className="site-relative site-md-inline-flex items-center">
            <h3 className="lg:text-[120px] md:text-[100px] text-4xl font-black leading-none tracking-normal text-primary-1 site-md-ms-0 site-ms-8">
              <span data-count={SITE.reservoirs}>{SITE.reservoirs}</span>
            </h3>
            <div className="site-md-absolute md:top-20 -inset-e-12 md:-right-20 md:rotate-8 bg-white site-py-2 site-md-px-5 site-px-2 rounded-2xl whitespace-nowrap site-mt-1 [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)]">
              <p className="md:text-sm text-xs font-bold text-default-800">
                {t.coverage.tanks}
              </p>
            </div>
          </div>
        </div>
        <div className="site-flex flex-col justify-start items-center md:h-138 h-100 site-mx-auto site-relative">

          <div className="site-bg-body-bg w-full h-full overflow-hidden">
            <div className="site-z-20-2 lg:h-200 md:h-125 h-75 site-bg-body-bg site-relative overflow-hidden">
              <img data-reveal="wipe"
                src="/images/photos/tank-wide.webp"
                alt="Nachchaduwa tank, Anuradhapura"
                style={{ objectPosition: "center 72%" }}
                className="site-absolute -inset-300 site-z---100 size-full site-object-cover bg-cover site-m-auto bg-[url(/images/photos/tank-wide.webp)] [background-position:50%] object-cover"
              />
            </div>
            <img
              src="/assets/img/cloud-06-7399a3c5.webp"
              alt="Decoration"
              className="site-absolute md:h-62.5 h-40 top-auto -inset-s-20 lg:bottom-2 md:bottom-30 bottom-40 site-z-20-2 w-full [inset-inline-end:calc(var(--spacing)_*_0)]"
            />
            <img
              src="/assets/img/cloud-01-8100a013.webp"
              alt="Decoration Image"
              className="site-absolute md:h-112 lg:-bottom-50 md:-bottom-25 bottom-20 -inset-s-7.5 top-auto site-z-20-2 w-full [inset-inline-end:calc(var(--spacing)_*_0)]"
            />
            <img
              src="/assets/img/cloud-01-8100a013.webp"
              alt="Decoration Image"
              className="site-absolute lg:h-112 h-75 lg:-bottom-25 md:-bottom-5 bottom-3 lg:-inset-e-62.5 -inset-e-25 top-auto inset-s-auto site-z-20-2 w-full"
            />
          </div>
          <div className="site-grid md:grid-cols-3 grid-cols-2 gap-6 lg:gap-17.5 items-start text-center md:w-3xl site-mx-auto site-z-40 site-lg--mt-0 site-md--mt-60 site-mt-50">
            <div className="site-flex flex-col items-center">
              <div className="site-flex items-baseline gap-[calc(var(--spacing)_*_1)]">
                <h3 className="text-3xl md:text-5xl lg:text-7xl font-medium site-text-default-900 tracking-normal">
                  <span data-count={SITE.riverGauges}>{SITE.riverGauges}</span>
                </h3>
              </div>
              <p className="site-mt-2 text-default-800 font-semibold md:text-lg text-sm leading-tight">
                {fill(t.coverage.gauges, { n: SITE.rivers })}
              </p>
            </div>
            <div className="site-flex flex-col items-center">
              <h3 className="text-3xl md:text-5xl lg:text-7xl font-medium site-text-default-900 tracking-normal">
                <span data-count={SITE.canalSections}>{SITE.canalSections}</span>
              </h3>
              <p className="site-mt-2 text-default-800 font-semibold md:text-lg text-sm leading-tight">
                {t.coverage.canals}
              </p>
            </div>
            <div className="site-flex flex-col items-center md:col-span-1 col-span-2">
              <div className="site-flex items-baseline gap-[calc(var(--spacing)_*_1)]">
                <h3 className="text-3xl md:text-5xl lg:text-7xl font-medium site-text-default-900 tracking-normal">
                  <span data-count={SITE.languages.length}>{SITE.languages.length}</span>
                </h3>
              </div>
              <p className="site-mt-2 text-default-800 font-semibold md:text-lg text-sm leading-tight">
                {t.coverage.languages}
              </p>
            </div>
          </div>
        </div>
        {"  "}
      </div>
    </section>
  );
}
