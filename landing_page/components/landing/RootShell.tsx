import type { ReactNode } from "react";
import Script from "next/script";
import "../../app/globals.css";
import "../../app/motion.css";
import type { Lang } from "../../lib/i18n";

const SCRIPT_FONTS: Partial<Record<Lang, string>> = {
  si: "https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap",
  ta: "https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap",
};

const MOTION_INIT =
  "document.documentElement.classList.add('motion');setTimeout(function(){if(!window.__motionReady)document.querySelectorAll('[data-reveal],[data-stagger]').forEach(function(e){e.classList.add('is-in')})},4000);";

export default function RootShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const font = SCRIPT_FONTS[lang];
  return (
    <html lang={lang} id="top" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {font && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={font} />
          </>
        )}
      </head>
      <body className="site-bg-body-bg">
        <Script id="motion-init" strategy="beforeInteractive">
          {MOTION_INIT}
        </Script>
        {children}
      </body>
    </html>
  );
}
