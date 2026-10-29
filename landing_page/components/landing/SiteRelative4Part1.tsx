import type { Dict } from "../../lib/i18n";
import { CalendarDays, ChartLine, Droplets, Languages, MessageSquareWarning, Sprout, Waves, Camera } from "lucide-react";
import MarqueeRow, { type MarqueeItem } from "./MarqueeRow";

const P = "/images/photos/";
const items: MarqueeItem[] = [
  { label: "Tank level today", icon: Droplets, color: "bg-primary-8", photo: `${P}tank.webp`, photoAlt: "Nachchaduwa tank" },
  { label: "14-day water forecast", icon: ChartLine, color: "bg-primary-1", photo: `${P}paddy.webp`, photoAlt: "Paddy fields in Ampara" },
  { label: "River levels nearby", icon: Waves, color: "bg-primary-2", photo: `${P}flood.webp`, photoAlt: "Flooded fields in Sri Lanka" },
  { label: "Canal water dates", icon: CalendarDays, color: "bg-primary-3", photo: `${P}canal.webp`, photoAlt: "Uda Walawe irrigation canal" },
  { label: "Report a blocked canal", icon: MessageSquareWarning, color: "bg-primary-4", photo: `${P}farmers.webp`, photoAlt: "Farmers working in a paddy field" },
  { label: "Add up to 3 photos", icon: Camera, color: "bg-primary-5", photo: `${P}harvest.webp`, photoAlt: "Straw after the harvest" },
  { label: "සිංහල · தமிழ் · English", icon: Languages, color: "bg-primary-6", photo: `${P}tank.webp`, photoAlt: "Nachchaduwa tank" },
  { label: "Your crops and yields", icon: Sprout, color: "bg-primary-7", photo: `${P}paddy.webp`, photoAlt: "Paddy fields in Ampara" },
];

export default function SiteRelative4Part1({ t }: { t: Dict }) {
  return <MarqueeRow items={items.map((item, i) => ({ ...item, label: t.intro.row1[i] }))} direction="left" />;
}
