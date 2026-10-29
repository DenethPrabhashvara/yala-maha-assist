import type { Dict } from "../../lib/i18n";
import { css } from "../../lib/css";
import { ChartLine, CloudRain, Database, Droplets, MapPin, TrendingUp, TriangleAlert } from "lucide-react";

export default function FlexibleStreakRulesSection({ t }: { t: Dict }) {
  return (
    <div data-reveal="up" className="rounded-3xl bg-default-200 overflow-hidden">
      <div className="lg:px-10 lg:pb-12.5 lg:pt-10 site-md-px-5 site-md-py-5 site-px-3-5 site-py-3-5">
        <h3 className="md:text-2xl text-xl font-semibold text-default-800 site-mb-2-5">
          {t.features.tank.title}
        </h3>
        <p className="max-w-md text-lg text-default-600">
          {t.features.tank.text}
        </p>
      </div>
      {"  "}
      <div className="site-relative site-mb-7-5 overflow-hidden">
        <img data-reveal="pop" style={css({ "--delay": "280ms" })}
          src="/images/screens/tank-card.webp"
          alt="Mallipotha tank at 47% full, rising 2.2% a day"
          className="rounded-3xl md:w-100 w-62 h-auto site-mx-auto shadow-xl"
        />
      </div>
      {"  "}
      <div className="marquee-pause site-relative overflow-hidden">
        <div className="site-flex site-w-max animate-marquee gap-5 lg:pb-20 pb-5">
          <div className="site-flex items-center gap-3 py-2.5 ps-2.5 pe-5 bg-white backdrop-blur-sm rounded-[3.40282e38px]">
            <div className="site-flex size-8 items-center justify-center bg-primary-1 rounded-[3.40282e38px]">
              <Droplets className="size-3.5 text-white" />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-default-800">
              {t.features.tank.chips[0]}
            </span>
          </div>
          <div className="site-flex items-center gap-3 py-2.5 ps-2.5 pe-5 bg-white backdrop-blur-sm rounded-[3.40282e38px]">
            <div className="site-flex size-8 items-center justify-center bg-primary-6 rounded-[3.40282e38px]">
              <TrendingUp className="size-3.5 text-white" />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-default-800">
              {t.features.tank.chips[1]}
            </span>
          </div>
          <div className="site-flex items-center gap-3 py-2.5 ps-2.5 pe-5 bg-white backdrop-blur-sm rounded-[3.40282e38px]">
            <div className="site-flex size-8 items-center justify-center bg-primary-8 rounded-[3.40282e38px]">
              <CloudRain className="size-3.5 text-white" />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-default-800">
              {t.features.tank.chips[2]}
            </span>
          </div>
          <div className="site-flex items-center gap-3 py-2.5 ps-2.5 pe-5 bg-white backdrop-blur-sm rounded-[3.40282e38px]">
            <div className="site-flex size-8 items-center justify-center bg-primary-2 rounded-[3.40282e38px]">
              <MapPin className="size-3.5 text-white" />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-default-800">
              {t.features.tank.chips[3]}
            </span>
          </div>
          <div className="site-flex items-center gap-3 py-2.5 ps-2.5 pe-5 bg-white backdrop-blur-sm rounded-[3.40282e38px]">
            <div className="site-flex size-8 items-center justify-center bg-primary-3 rounded-[3.40282e38px]">
              <ChartLine className="size-3.5 text-white" />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-default-800">
              {t.features.tank.chips[4]}
            </span>
          </div>
          <div className="site-flex items-center gap-3 py-2.5 ps-2.5 pe-5 bg-white backdrop-blur-sm rounded-[3.40282e38px]">
            <div className="site-flex size-8 items-center justify-center bg-primary-4 rounded-[3.40282e38px]">
              <TriangleAlert className="size-3.5 text-white" />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-default-800">{t.features.tank.chips[5]}</span>
          </div>
          <div className="site-flex items-center gap-3 py-2.5 ps-2.5 pe-5 bg-white backdrop-blur-sm rounded-[3.40282e38px]">
            <div className="site-flex size-8 items-center justify-center bg-primary-7 rounded-[3.40282e38px]">
              <Database className="size-3.5 text-white" />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-default-800">
              {t.features.tank.chips[6]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
