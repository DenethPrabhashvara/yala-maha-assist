import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import { ArrowDown, Languages, Smartphone } from "lucide-react";
import { SITE } from "../../lib/site";

export default function SiteMxAuto({ t }: { t: Dict }) {
  return (
    <div data-stagger style={css({ "--step": "110ms" })} className="site-mx-auto px-6 site-md-mt-12 site-mt-4 site-flex flex-col gap-y-5 items-center">
      <div className="site-flex items-center gap-2 site-border site-border-default-200 bg-white site-md-px-5 site-px-2-5 site-py-2 rounded-[3.40282e38px]">
        <Languages className="size-3.5 text-primary-1" />
        <p className="text-sm site-text-default-500 font-medium">
          {" "}
          <span className="text-black font-medium">සිංහල · தமிழ் · English</span>
          {` ${t.intro.platforms} `}
        </p>
      </div>
      <p className="text-default-700 md:text-lg text-base leading-normal site-mb-2-5 md:w-xl w-xs">
        {t.intro.text}
      </p>
      <div className="site-flex flex-col md:flex-row gap-5 w-full justify-center">
        <a
          href={SITE.appUrl}
          className="group site-relative px-8.5 overflow-hidden bg-black text-white site-inline-flex items-center justify-center hover:scale-95 site-transition-all duration-300 rounded-[3.40282e38px] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)]! [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)]!"
        >
          <div className="site-relative flex-col items-center transition-transform duration-300 group-hover:-translate-y-full">
            <div className="site-flex items-center gap-3 h-14">
              <Smartphone className="w-5 h-5" />
              <span className="font-normal">{t.nav.openApp}</span>
            </div>
            <div className="site-flex items-center gap-3 h-14 site-absolute top-full">
              <Smartphone className="w-5 h-5" />
              <span className="font-normal">{t.nav.openApp}</span>
            </div>
          </div>
        </a>
        <a
          href="#features"
          className="group site-relative px-8.5 overflow-hidden bg-default-200 text-black site-inline-flex items-center justify-center hover:scale-95 site-transition-all duration-300 rounded-[3.40282e38px]"
        >
          <div className="site-relative site-flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-full">
            <div className="site-flex items-center gap-2.5 h-14">
              <ArrowDown className="w-5 h-5" />
              <span className="font-normal">{t.intro.features}</span>
            </div>
            <div className="site-flex items-center gap-2.5 h-14 site-absolute top-full">
              <ArrowDown className="w-5 h-5" />
              <span className="font-normal">{t.intro.features}</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
