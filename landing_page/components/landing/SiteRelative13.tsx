import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import QRCode from "qrcode";
import { CircleHelp, Smartphone } from "lucide-react";
import { SITE } from "../../lib/site";

async function qrDataUrl() {
  const svg = await QRCode.toString(SITE.appUrl, { type: "svg", margin: 1, color: { dark: "#111827", light: "#0000" } });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default async function SiteRelative13({ t }: { t: Dict }) {
  const qr = await qrDataUrl();
  return (
    <section id="download-app" className="site-relative overflow-hidden pt-20 lg:pt-30 pb-8">
      {"  "}
      <div className="site-container site-relative site-z-10 w-full [@media_(width>=48rem)]:px-[calc(var(--spacing)_*_5)] [@media_(width>=64rem)]:px-[calc(var(--spacing)_*_0)]">
        <div className="site-grid grid-cols-1 items-center md:grid-cols-3 gap-7.5 [@media_(width>=48rem)]:gap-[calc(var(--spacing)_*_0)]">
          <div className="order-1 site-flex flex-col items-center text-center md:text-left lg:items-start site-md-me-10">
            <h3 data-reveal="left" className="text-2xl font-medium tracking-tight site-text-default-900 lg:text-4xl">
              {t.download.title}
            </h3>
            <p className="site-mt-2-5 text-lg text-default-600 site-lg-mt-5">
              {t.download.text}
            </p>
            <div className="site-mt-3-5 site-flex flex-col gap-4 site-lg-mt-8 site-relative site-z-40">
              <a
                href={SITE.appUrl}
                className="group site-relative site-inline-flex overflow-hidden bg-black lg:px-8.5 site-px-3-5 text-white site-transition-all duration-300 hover:scale-95 rounded-[3.40282e38px] [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_20px_25px_-5px_var(--tw-shadow-color,#0000001a),_0_8px_10px_-6px_var(--tw-shadow-color,#0000001a)]"
              >
                <div className="site-relative site-flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-full">
                  <div className="site-flex h-14 items-center gap-3">
                    <Smartphone className="size-5" />
                    <span className="lg:text-base text-sm">{t.nav.openApp}</span>
                  </div>
                  <div className="site-absolute top-full site-flex h-14 items-center gap-3">
                    <Smartphone className="size-5" />
                    <span className="lg:text-base text-sm">{t.nav.openApp}</span>
                  </div>
                </div>
              </a>
              <a
                href="#faq"
                className="group site-relative site-inline-flex overflow-hidden bg-default-200 lg:px-8.5 site-px-3-5 text-black site-transition-all duration-300 hover:scale-95 rounded-[3.40282e38px]"
              >
                <div className="site-relative site-flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-full">
                  <div className="site-flex h-14 items-center gap-2.5">
                    <CircleHelp className="size-5" />
                    <span className="lg:text-base text-sm">{t.download.faq}</span>
                  </div>
                  <div className="site-absolute top-full site-flex h-14 items-center gap-2.5">
                    <CircleHelp className="size-5" />
                    <span className="lg:text-base text-sm">{t.download.faq}</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
          <div className="order-3 site-flex justify-center md:order-2">
            <img data-reveal="rise" style={css({ "--delay": "150ms" })}
              src="/images/screens/phone-welcome-si.webp"
              alt="The welcome screen in Sinhala"
              className="site-relative site-z-10 w-full md:max-w-56 md:h-80 lg:h-156 lg:max-w-114 object-contain"
            />
          </div>
          <div className="order-2 site-flex flex-col items-center md:order-3 lg:items-end site-md-ms-10">
            <div className="text-center lg:max-w-xl md:text-start">
              <h3 data-reveal="right" style={css({ "--delay": "250ms" })} className="site-mb-5 text-2xl font-medium tracking-tight site-text-default-900 lg:text-4xl">
                {t.download.scan}
              </h3>{" "}
              <div className="site-inline-block rounded-2xl bg-white p-2 site-z-30 site-relative [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_25px_50px_-12px_var(--tw-shadow-color,#00000040)]">
                <div className="site-flex items-center justify-center rounded-2xl bg-default-200 p-2">
                  <img data-reveal="pop" style={css({ "--delay": "450ms" })} src={qr} alt={`QR code for ${SITE.appUrl}`} className="size-36 lg:size-46" />
                </div>
              </div>{" "}
            </div>
          </div>
        </div>
        {"  "}
        <div className="site-absolute lg:-bottom-30 -bottom-18 top-auto site-z-20-2 lg:h-55 md:h-40 h-30 w-full site-bg-body-bg md:blur-[35px] blur-[20px] left-[calc(var(--spacing)_*_0)]" />
      </div>
      {"  "}
      <img
        src="/assets/img/cloud-04-d1b5dafb.webp"
        alt=""
        className="site-absolute -bottom-12.5 h-72.5 -left-25 w-218 pointer-events-none site-z-20"
      />
      <img
        src="/assets/img/cloud-01-8100a013.webp"
        alt=""
        className="site-absolute -bottom-25 inset-e-25 -translate-x-1/2 w-224 h-72.5 pointer-events-none site-lg-z-10 site-z-6"
      />
      <img
        src="/assets/img/cloud-04-d1b5dafb.webp"
        alt=""
        className="site-absolute -bottom-50 top-auto w-full h-87.5 pointer-events-none site-z-0 [inset-inline-end:calc(var(--spacing)_*_0)]"
      />
    </section>
  );
}
