import type { LucideIcon } from "lucide-react";

export interface CardProps {
  items: {
    question: string;
    icon: LucideIcon;
    color: string;
    screen: string;
    answer: string;
  }[];
}

export default function Card({ items }: CardProps) {
  return (
    <div className="site-lg-space-y-7-5 site-md-space-y-5 site-space-y-3-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.question} className="lift bg-default-200 md:p-7.5 p-2.5 rounded-2xl site-flex flex-col justify-between">
            <p className="text-default-800 md:text-lg text-sm font-medium leading-snug site-md-mb-7-5 site-mb-3-5">
              &ldquo;{item.question}&rdquo;
            </p>
            <div className="site-md-flex items-center gap-2.5">
              <span className={`site-flex md:size-12 size-7.5 shrink-0 items-center justify-center rounded-full ${item.color} text-white`}>
                <Icon className="md:size-5 size-3.5" />
              </span>
              <div className="site-md-mt-0 site-mt-1-25">
                <h3 className="md:text-lg text-sm font-medium site-text-default-900 leading-none">{item.screen}</h3>
                <p className="md:text-sm text-xs site-text-default-500 site-mt-1">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
