import type { Dict } from "../../lib/i18n";
import SiteGrid from "./SiteGrid";
import SiteGrid2 from "./SiteGrid2";

export default function SiteRelative5({ t }: { t: Dict }) {
  return (
    <section id="features" className="site-relative lg:pb-50 md:pb-25 pb-8">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        {"  "}
        <SiteGrid t={t} />
        {"  "}
        <SiteGrid2 t={t} />
      </div>
    </section>
  );
}
