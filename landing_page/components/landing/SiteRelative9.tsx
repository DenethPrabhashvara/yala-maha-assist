import type { Dict } from "../../lib/i18n";
import { fill } from "../../lib/i18n";
import SiteRelative14, { type SiteRelative14Props } from "./SiteRelative14";
import { SITE } from "../../lib/site";

const P = "/images/photos/";
const cards: SiteRelative14Props[] = [
  {
    image: `${P}tank.webp`,
    imageAlt: "Nachchaduwa tank",
    title: "Nachchaduwa wewa",
    place: "Anuradhapura",
    big: String(SITE.reservoirs),
    text: "Tanks and reservoirs you can follow, read every day",
  },
  {
    image: `${P}farmers.webp`,
    imageAlt: "Farmers working in a paddy field",
    title: "Paddy farmers",
    place: "Maha season",
    text: "Plan planting around your canal's water dates instead of guessing",
  },
  {
    image: `${P}flood.webp`,
    imageAlt: "Flooded fields in Sri Lanka",
    title: "Flood predictions",
    place: `${SITE.rivers} rivers`,
    big: String(SITE.riverGauges),
    text: "River gauges watched so farmers are warned before the water rises",
  },
  {
    image: `${P}canal.webp`,
    imageAlt: "Uda Walawe irrigation canal",
    title: "Uda Walawe canal",
    place: "Ratnapura",
    text: "A blocked or leaking canal can be reported in a minute, with photos",
  },
  {
    image: `${P}paddy.webp`,
    imageAlt: "Paddy fields in Ampara",
    title: "Mahaweli canals",
    place: "Water issue schedule",
    big: String(SITE.canalSections),
    text: "Canal sections with this season's water dates",
  },
  {
    image: `${P}harvest.webp`,
    imageAlt: "Straw after the harvest",
    title: "After the harvest",
    place: "Next season",
    big: "",
    text: "Tank forecast to plan what comes next",
  },
];

export default function SiteRelative9({ t }: { t: Dict }) {
  return (
    <div className="marquee-pause site-relative site-flex overflow-hidden gap-7.5">
      {[false, true].map((copy) => (
        <div key={String(copy)} className="site-flex animate-marquee whitespace-nowrap gap-7.5 py-4" aria-hidden={copy || undefined}>
          {cards.map((card, i) => (
            <SiteRelative14
              key={card.image + i}
              {...card}
              big={i === 5 ? t.who.days14 : card.big}
              title={t.helps.cards[i].title}
              place={fill(t.helps.cards[i].place, { n: SITE.rivers })}
              text={t.helps.cards[i].text}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
