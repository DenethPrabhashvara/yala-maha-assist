import type { LucideIcon } from "lucide-react";

export interface MarqueeItem {
  label: string;
  icon: LucideIcon;
  color: string;
  photo: string;
  photoAlt: string;
}

const CARD =
  "site-inline-flex md:size-37.5 size-32.5 flex-col items-center justify-center gap-5 rounded-3xl bg-white p-5 [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)]";
const PHOTO =
  "md:size-37.5 size-32.5 rounded-3xl site-object-cover [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_10px_15px_-3px_var(--tw-shadow-color,#0000001a),_0_4px_6px_-4px_var(--tw-shadow-color,#0000001a)]";

export default function MarqueeRow({ items, direction }: { items: MarqueeItem[]; direction: "left" | "right" }) {
  const set = (copy: boolean) => (
    <div className="site-flex items-center gap-5" aria-hidden={copy || undefined}>
      {items.map((item) => {
        const Icon = item.icon;
        return [
          <div key={`${item.label}-card`} className={CARD}>
            <div className={`site-flex md:size-12.5 size-7.5 shrink-0 items-center justify-center ${item.color} rounded-[3.40282e38px]`}>
              <Icon className="md:size-6 size-3.5 text-white" />
            </div>
            <span className="md:text-base text-sm text-center font-medium text-default-800">{item.label}</span>
          </div>,
          <img key={`${item.label}-photo`} src={item.photo} className={PHOTO} alt={copy ? "" : item.photoAlt} loading="lazy" />,
        ];
      })}
    </div>
  );
  return (
    <div className={direction === "left" ? "site-md-mt-20 site-mt-10 overflow-hidden py-6" : "site-md-mb-20 overflow-hidden pb-6"}>
      <div
        className={`site-flex site-w-max gap-5 ${
          direction === "left" ? "[animation:65s_linear_infinite_marquee-left]" : "[animation:65s_linear_infinite_marquee-right]"
        }`}
      >
        {set(false)}
        {set(true)}
      </div>
    </div>
  );
}
