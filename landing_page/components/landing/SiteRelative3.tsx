import type { Dict } from "../../lib/i18n";
import BuildSteadyDailySection from "./BuildSteadyDailySection";
import SiteMxAuto from "./SiteMxAuto";
import SiteRelative4 from "./SiteRelative4";

export default function SiteRelative3({ t }: { t: Dict }) {
  return (
    <section className="site-relative lg:pt-6 lg:pb-50 pb-20 text-center">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        {"  "}
        <BuildSteadyDailySection t={t} />
        {"  "}
        <SiteRelative4 t={t} />
        {"  "}
        <SiteMxAuto t={t} />
      </div>
      <div className="site-relative site-lg-block site-hidden">
        <img
          src="/assets/img/cloud-04-d1b5dafb.webp"
          loading="lazy"
          alt="Decoration Image"
          className="site-absolute w-full site-object-cover -bottom-100 h-148 site-z-5 [inset-inline-start:calc(var(--spacing)_*_0)] [inset-inline-end:calc(var(--spacing)_*_0)]"
        />
        <img
          src="/assets/img/cloud-02-7937c7b9.webp"
          loading="lazy"
          alt="Decoration Image"
          className="site-absolute -bottom-38 h-75 site-z-5 [inset-inline-end:calc(var(--spacing)_*_0)]"
        />
        <img
          src="/assets/img/cloud-01-8100a013.webp"
          loading="lazy"
          alt="Decoration Image"
          className="site-absolute -bottom-48 h-75 site-z-5 [inset-inline-start:calc(var(--spacing)_*_0)]"
        />
      </div>
    </section>
  );
}
