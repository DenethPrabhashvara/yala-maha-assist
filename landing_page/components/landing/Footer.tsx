import type { Dict } from "../../lib/i18n";
import { SITE } from "../../lib/site";

export default function Footer({ t, home = "/" }: { t: Dict; home?: string }) {
  const pageLinks = [
    { href: "#features", label: t.nav.features },
    { href: "#usecase", label: t.nav.who },
    { href: "#metrics", label: t.nav.coverage },
    { href: "#smart-assist", label: t.nav.forecast },
    { href: "#faq", label: t.nav.faq },
  ];
  return (
    <footer className="site-bg-body-bg pt-20 lg:pb-7.5 pb-5">
      <div className="site-container w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        <div className="site-grid grid-cols-1 lg:gap-32 md:gap-12.5 gap-7.5 md:grid-cols-4 justify-between">
          <div className="lg:col-span-2">
            <a href="#top" className="site-mb-10 inline-flex items-center gap-3">
              <img src="/images/logo-icon.png" alt="" className="h-11 w-11 rounded-xl" />
              <span className="text-2xl font-semibold tracking-tight text-default-900">{t.appName}</span>
            </a>
            <div className="lg:max-w-md">
              <h2 className="md:text-2xl text-xl site-mb-2-5 font-medium">{t.footer.title}</h2>
              <p className="site-mb-5 text-lg site-text-default-500">
                {t.footer.text}
              </p>
              <a href={SITE.appUrl} className="w-full md:w-auto whitespace-nowrap bg-default-900 site-px-8 site-py-3-5 font-medium text-white site-transition-all hover:scale-95 rounded-[3.40282e38px] site-inline-block text-center">
                {t.nav.openApp}
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-base font-medium site-text-default-900 site-lg-mb-7-5 site-mb-5">{t.footer.onPage}</h3>
            <div className="site-flex flex-col justify-end gap-2">
              {pageLinks.map((link) => (
                <a key={link.href} className="md:text-lg text-base text-default-600 hover:text-default-900 hover:underline underline-offset-4 decoration-2 transition-colors" href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="site-flex flex-col gap-2">
            <h3 className="text-base font-medium site-text-default-900 site-lg-mb-7-5 site-mb-5">{t.footer.more}</h3>
            <a href={SITE.appUrl} className="md:text-lg text-base text-default-600 hover:text-default-900 hover:underline underline-offset-4 decoration-2 transition-colors">
              {t.nav.openApp}
            </a>
            <a href="/credits" className="md:text-lg text-base text-default-600 hover:text-default-900 hover:underline underline-offset-4 decoration-2 transition-colors">
              {t.footer.credits}
            </a>
          </div>
        </div>
        <div className="site-lg-mt-16 site-md-mt-8 site-mt-6 site-border-t site-border-default-200 md:pt-7.5 pt-5 site-flex flex-col md:flex-row md:justify-between justify-start items-center md:gap-6 gap-5">
          <p className="text-default-600 md:text-lg text-base">© {new Date().getFullYear()} {t.appName}</p>
          <p className="text-default-600 md:text-lg text-base">{t.footer.photosFrom} <a href="/credits" className="site-text-default-900 font-medium hover:underline">{t.footer.credits.toLowerCase()}</a></p>
        </div>
      </div>
    </footer>
  );
}
