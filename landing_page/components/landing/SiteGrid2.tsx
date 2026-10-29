import type { Dict } from "../../lib/i18n";
import FlexibleStreakRulesSection from "./FlexibleStreakRulesSection";
import RoutineStacksSection from "./RoutineStacksSection";
import SiteFlex from "./SiteFlex";
import SiteRelative6 from "./SiteRelative6";
import SiteRelative7 from "./SiteRelative7";

export default function SiteGrid2({ t }: { t: Dict }) {
  return (
    <div className="site-grid grid-cols-1 lg:grid-cols-2 gap-7.5">
      <FlexibleStreakRulesSection t={t} />
      <SiteFlex t={t} />
      <RoutineStacksSection t={t} />
      <SiteRelative6 t={t} />
      <SiteRelative7 t={t} />
    </div>
  );
}
