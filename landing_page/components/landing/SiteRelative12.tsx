import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import {
  BellRing,
  CalendarDays,
  Camera,
  ChartLine,
  ClipboardCheck,
  Droplets,
  Languages,
  MapPin,
  Waves,
} from "lucide-react";
import Card, { type CardProps } from "./Card";

const cards: CardProps[] = [
  {
    items: [
      {
        question: "Is there enough water in the tank to plant this season?",
        icon: Droplets,
        color: "bg-primary-8",
        screen: "Home",
        answer: "Your tank's level, change per day and spilling status",
      },
      {
        question: "Will the tank be fuller or emptier in two weeks?",
        icon: ChartLine,
        color: "bg-primary-1",
        screen: "14-day forecast",
        answer: "Today's level and the forecast, with a low level line",
      },
      {
        question: "Is the river near my field going to flood?",
        icon: Waves,
        color: "bg-primary-2",
        screen: "Flood predictions",
        answer: "A warning before the river near your farm floods",
      },
    ],
  },
  {
    items: [
      {
        question: "When does water come down our canal this Maha?",
        icon: CalendarDays,
        color: "bg-primary-3",
        screen: "Canal water dates",
        answer: "The Mahaweli water issue schedule for your canal",
      },
      {
        question: "The channel is blocked again. Who do I tell?",
        icon: Camera,
        color: "bg-primary-4",
        screen: "Report",
        answer: "Choose the problem and the canal, add up to 3 photos",
      },
      {
        question: "Did anyone look at the problem I reported?",
        icon: ClipboardCheck,
        color: "bg-primary-5",
        screen: "My reports",
        answer: "Status from received to fixed, with the office's note",
      },
    ],
  },
  {
    items: [
      {
        question: "Which tanks are closest to my land?",
        icon: MapPin,
        color: "bg-primary-6",
        screen: "Registration",
        answer: "Drop a pin on the map and the nearest tanks come first",
      },
      {
        question: "Will I hear about a flood even if I am not using the app?",
        icon: BellRing,
        color: "bg-primary-7",
        screen: "SMS and voice alerts",
        answer: "An SMS on any phone, and a voice call when it is urgent",
      },
      {
        question: "Can I use it in Sinhala or Tamil?",
        icon: Languages,
        color: "bg-primary-8",
        screen: "Language",
        answer: "සිංහල, தமிழ் and English, switch at any time",
      },
    ],
  },
];

export default function SiteRelative12({ t }: { t: Dict }) {
  return (
    <section className="site-relative lg:py-40 py-20 overflow-hidden">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        <h2 data-reveal="up" className="text-center lg:text-5xl md:text-4xl text-2xl font-medium site-text-default-900 site-md-mb-12-5 site-mb-8">
          {t.questions.title}
        </h2>
        <div className="site-relative overflow-hidden">
          <div data-stagger style={css({ "--step": "140ms" })} className="site-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-7.5 md:gap-5 gap-3.5">
            {cards.map((card, i) => (
              <Card
                key={i}
                items={card.items.map((item, j) => {
                  const [question, screen, answer] = t.questions.cards[i * 3 + j];
                  return { ...item, question, screen, answer };
                })}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
