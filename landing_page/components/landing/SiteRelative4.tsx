import type { Dict } from "../../lib/i18n";
import SiteRelative4Part1 from "./SiteRelative4Part1";
import SiteRelative4Part2 from "./SiteRelative4Part2";

export default function SiteRelative4({ t }: { t: Dict }) {
  return (
    <div className="marquee-pause site-relative w-full md:py-24 py-12 overflow-hidden site-flex flex-col items-center">
      <div className="site-absolute -left-20 w-37.5 site-bg-body-bg blur-[20px] site-z-20-2 pointer-events-none site-md-block site-hidden [inset-block:calc(var(--spacing)_*_0)]" />
      <div className="site-absolute -right-20 w-37.5 site-bg-body-bg blur-[30px] site-z-20-2 pointer-events-none site-md-block site-hidden [inset-block:calc(var(--spacing)_*_0)]" />
      <SiteRelative4Part1 t={t} />
      <SiteRelative4Part2 t={t} />
      <div className="site-absolute site-z-30 site-flex justify-center items-center pointer-events-none inset-[calc(var(--spacing)_*_0)]">
        <img data-reveal="rise"
          src="/images/screens/phone-fields.webp"
          className="md:h-175 h-88 w-auto"
          alt="The My Fields screen: farm ID, water source and crops"
        />
      </div>
    </div>
  );
}
