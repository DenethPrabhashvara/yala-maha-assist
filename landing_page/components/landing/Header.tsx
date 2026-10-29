"use client";

import type { Dict } from "../../lib/i18n";
import type { Lang } from "../../lib/i18n";
import { useState } from "react";
import { Smartphone } from "lucide-react";
import { SITE } from "../../lib/site";

export default function Header({ t, lang }: { t: Dict; lang: Lang }) {
  const items = [
    { href: "#features", label: t.nav.features },
    { href: "#usecase", label: t.nav.who },
  ];
  const items2 = [
    { href: "#metrics", label: t.nav.coverage },
    { href: "#smart-assist", label: t.nav.forecast },
    { href: "#faq", label: t.nav.faq },
  ];
  const mobileLinks = [...items, ...items2];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <div className="site-fixed site-z-120 w-full [inset-inline:calc(var(--spacing)_*_0)] top-[calc(var(--spacing)_*_0)]">
        <div className="site-container site-lg-py-7-5 site-md-py-5 site-py-3-5 w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
          <div className="site-flex items-center lg:justify-center justify-between w-full bg-white md:rounded-2xl rounded-lg [@media_(width>=64rem)]:bg-[#0000]">
            <div className="lg:p-4 md:py-4 py-1.5 px-3 header-pill bg-white min-w-[175px] w-max shrink-0 site-flex rounded-[20px] [@media_(width>=64rem)]:[box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [@media_(width>=64rem)]:[--tw-shadow:0_10px_15px_-3px_var(--tw-shadow-color,#0000001a),_0_4px_6px_-4px_var(--tw-shadow-color,#0000001a)]">
              <a href="#top" className="site-flex items-center gap-2.5" aria-label={`${t.appName} home`}>
                <img src="/images/logo-icon.png" alt="" className="md:h-9 h-8 md:w-9 w-8 rounded-lg" />
                <span className="font-semibold text-default-800 md:text-lg text-base tracking-tight whitespace-nowrap">
                  {t.appName}
                </span>
              </a>
            </div>
            <div className="w-full h-2.5 site-transition-all duration-500 ease-in-out site-in--nav-sticky-on-w-2-5 site-lg-flex site-hidden" />
            <div className="site-flex items-center justify-between">
              <div className="header-pill p-1.5 bg-white rounded-[20px] whitespace-nowrap site-lg-block site-hidden [@media_(width>=64rem)]:[box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [@media_(width>=64rem)]:[--tw-shadow:0_10px_15px_-3px_var(--tw-shadow-color,#0000001a),_0_4px_6px_-4px_var(--tw-shadow-color,#0000001a)]">
                <ul id="navbar" className="site-flex items-center">
                  {items.map((item, i) => (
                    <li key={i} className="">
                      <a
                        className="site-flex items-center justify-center text-sm font-medium hover:bg-default-200 hover:text-default-800 rounded-2xl site-transition-all py-4 px-7"
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                  {items2.map((item, i) => (
                    <li key={i}>
                      <a
                        className="site-flex items-center justify-center text-sm font-medium hover:bg-default-200 hover:text-default-800 rounded-2xl site-transition-all py-4 px-7"
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="w-full h-2.5 site-transition-all duration-500 ease-in-out site-in--nav-sticky-on-w-2-5 site-lg-flex site-hidden" />
            <div className="header-pill site-flex items-center gap-1.25 p-1.5 bg-white rounded-[20px] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_10px_15px_-3px_var(--tw-shadow-color,#0000001a),_0_4px_6px_-4px_var(--tw-shadow-color,#0000001a)] [@media_(width>=64rem)]:[box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [@media_(width>=64rem)]:[--tw-shadow:0_10px_15px_-3px_var(--tw-shadow-color,#0000001a),_0_4px_6px_-4px_var(--tw-shadow-color,#0000001a)]">
              <a
                href={SITE.appUrl}
                className="site-flex items-center gap-2 md:h-12.5 h-8.75 md:px-5 px-3 md:rounded-2xl rounded-lg bg-black text-white md:text-sm text-xs font-medium whitespace-nowrap site-transition-all duration-300 hover:bg-default-800"
              >
                <Smartphone className="md:size-5 size-4" />
                <span className="hidden md:inline">{t.nav.openApp}</span>
              </a>
              <div className="site-flex items-center site-lg-hidden">
                {" "}
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                  }}
                  className="site-flex md:h-12.5 md:w-12.5 size-8.75 items-center justify-center overflow-hidden md:rounded-2xl rounded-lg bg-default-200 site-transition-all duration-300"
                >
                  <i className={`iconify ${menuOpen ? "tabler--x" : "tabler--align-right"} size-6`} />
                </button>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      <div
        id="mobile-menu"
        className={`site-fixed site-z-110 rounded-lg transform overflow-hidden bg-white site-transition-all duration-300 [inset-inline:calc(var(--spacing)_*_0)] top-[calc(var(--spacing)_*_0)] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)]${menuOpen ? " mobile-menu-open" : " site-hidden"}`}
        role="dialog"
        tabIndex={-1}
        aria-labelledby="mobile-menu-label"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setMenuOpen(false);
          }
        }}
      >
        {" "}
        <div className="site-flex max-h-50 flex-col overflow-y-auto p-3">
          {mobileLinks.map((siteFlex, i) => (
            <a
              key={i}
              className="group site-flex items-center p-1.5 text-base font-medium text-default-600 site-transition-all hover:text-primary"
              href={siteFlex.href}
              onClick={() => {
                setMenuOpen(false);
              }}
            >
              {siteFlex.label}
            </a>
          ))}
        </div>{" "}
      </div>{" "}
    </header>
  );
}
