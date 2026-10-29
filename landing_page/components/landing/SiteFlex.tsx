import type { Dict } from "../../lib/i18n";
import { fill } from "../../lib/i18n";
import { css } from "../../lib/css";
import SiteFlex2 from "./SiteFlex2";
import SiteFlex3 from "./SiteFlex3";

export default function SiteFlex({ t }: { t: Dict }) {
  return (
    <div data-reveal="up" style={css({ "--delay": "120ms" })} className="rounded-3xl lg:p-10 md:p-5 p-3.5 site-flex flex-col lg:gap-y-12.5 gap-y-5 bg-[linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.55)),url(/images/photos/farmers-wide.webp)]">
      <div>
        <h3 className="md:text-2xl text-xl site-mb-2-5 font-semibold text-white">
          {t.features.canals.title}
        </h3>
        <p className="lg:w-md text-lg text-gray-400">
          {t.features.canals.text}
        </p>
      </div>
      <div className="backdrop-blur-xl site-border rounded-3xl text-white w-full lg:max-w-xl border-[#ffffff4d] bg-[#0000] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-white)_30%,_transparent)]">
        {"  "}
        <div className="site-flex justify-between items-start border-b p-5 site-mb-7-5 border-[#ffffff4d] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-white)_30%,_transparent)]">
          <div>
            <h2 className="text-lg font-medium tracking-normal text-white">{t.features.canals.season}</h2>
            <p className="text-default-400 text-sm">{t.features.canals.schedule}</p>
          </div>
          <div className="site-flex items-center gap-2">
            <span className="px-3 text-sm font-bold site-border border-default-800 rounded-[3.40282e38px] bg-[#0009] py-[calc(var(--spacing)_*_1)] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-black)_60%,_transparent)]">
              55
            </span>
            <span className="text-default-300 text-sm font-medium">{t.features.canals.sections}</span>
          </div>
        </div>
        {"  "}
        <div data-stagger="side" style={css({ "--step": "130ms" })} className="site-space-y-4 md:pe-10 pe-4 pb-5">
          {"  "}
          <SiteFlex2 text="26" text2="Hadapanagala · Feeder canal" text3={fill(t.features.canals.until, { date: "9 Jan" })} month="Sep" />
          {"  "}
          <SiteFlex2 text="05" text2="Udawalawe · Right canal" text3={fill(t.features.canals.until, { date: "18 Jan" })} month="Oct" />
          {"  "}
          <SiteFlex3 text="10" text2="Oct" text3="Kalawewa · Left bank canal" text4={fill(t.features.canals.until, { date: "23 Jan" })} />
          {"  "}
          <SiteFlex3 text="01" text2="Nov" text3="Huruluwewa · Feeder canal" text4={fill(t.features.canals.until, { date: "14 Feb" })} />
        </div>
      </div>
    </div>
  );
}
