import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
export default function SiteGrid({ t }: { t: Dict }) {
  return (
    <div data-reveal="up" className="site-grid grid-cols-1 md:grid-cols-2 lg:gap-8 gap-3.5 items-center site-mb-12-5">
      <div>
        {" "}
        <div className="site-inline-flex site-mb-3-5">
          <span className="site-inline-block px-5 py-1.5 text-sm font-medium bg-white site-border site-border-default-200 text-default-800 rounded-[3.40282e38px]">
            {t.features.badge}
          </span>
        </div>{" "}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight lg:w-lg">
          {t.features.title}
        </h2>
      </div>
      <div>
        <p data-reveal="soft" style={css({ "--delay": "160ms" })} className="text-default-600 text-lg leading-normal float-end lg:w-md">
          {t.features.text}
        </p>
      </div>
    </div>
  );
}
