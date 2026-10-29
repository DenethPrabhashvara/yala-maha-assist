import type { Dict } from "../../lib/i18n";
import SiteContainer from "./SiteContainer";
import SiteRelative9 from "./SiteRelative9";

export default function MetricsSection({ t }: { t: Dict }) {
  return (
    <section className="lg:py-50 py-25" id="metrics">
      <SiteContainer t={t} />
      {"  "}
      <SiteRelative9 t={t} />
    </section>
  );
}
