import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import { SITE } from "../../lib/site";

export default function SiteContainer({ t }: { t: Dict }) {
  return (
    <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
      {"  "}
      <div className="site-flex flex-col md:flex-row justify-between items-end md:gap-8 gap-4 site-md-mb-12-5 site-mb-8">
        <h2 data-reveal="up" className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight site-text-default-900 leading-tight md:w-lg">
          {t.helps.title}
        </h2>
        <div className="site-flex flex-col items-start text-start justify-start md:justify-end md:items-end site-space-y-2-5">
          <div data-stagger style={css({ "--step": "90ms" })} className="site-flex items-center md:justify-end justify-start gap-2">
            {SITE.languages.map((language) => (
              <span key={language} className="rounded-full bg-default-200 px-3.5 py-1.5 text-sm font-semibold text-default-800">
                {language}
              </span>
            ))}
          </div>
          <div className="text-default-600 font-medium text-lg">{t.helps.sub}</div>
        </div>
      </div>
    </div>
  );
}
