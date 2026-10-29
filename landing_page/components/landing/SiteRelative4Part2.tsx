import type { Dict } from "../../lib/i18n";
import { BellRing, CloudRain, MapPin, MessageSquareText, Navigation, ClipboardCheck, Wheat, PhoneCall } from "lucide-react";
import MarqueeRow, { type MarqueeItem } from "./MarqueeRow";

const P = "/images/photos/";
const items: MarqueeItem[] = [
  { label: "Flood predictions", icon: BellRing, color: "bg-primary-1", photo: `${P}flood.webp`, photoAlt: "Flooded fields in Sri Lanka" },
  { label: "Rain at your tank", icon: CloudRain, color: "bg-primary-2", photo: `${P}canal.webp`, photoAlt: "Uda Walawe irrigation canal" },
  { label: "SMS from the office", icon: MessageSquareText, color: "bg-primary-3", photo: `${P}farmers.webp`, photoAlt: "Farmers working in a paddy field" },
  { label: "Your farm on the map", icon: MapPin, color: "bg-primary-4", photo: `${P}paddy.webp`, photoAlt: "Paddy fields in Ampara" },
  { label: "Nearest tanks first", icon: Navigation, color: "bg-primary-5", photo: `${P}tank.webp`, photoAlt: "Nachchaduwa tank" },
  { label: "Follow your reports", icon: ClipboardCheck, color: "bg-primary-6", photo: `${P}harvest.webp`, photoAlt: "Straw after the harvest" },
  { label: "Yala and Maha seasons", icon: Wheat, color: "bg-primary-7", photo: `${P}farmers.webp`, photoAlt: "Farmers working in a paddy field" },
  { label: "Voice call in emergencies", icon: PhoneCall, color: "bg-primary-8", photo: `${P}flood.webp`, photoAlt: "Flooded fields in Sri Lanka" },
];

export default function SiteRelative4Part2({ t }: { t: Dict }) {
  return <MarqueeRow items={items.map((item, i) => ({ ...item, label: t.intro.row2[i] }))} direction="right" />;
}
