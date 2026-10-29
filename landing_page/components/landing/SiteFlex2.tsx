export interface SiteFlex2Props {
  text: string;
  text2: string;
  text3: string;
  month: string;
}

export default function SiteFlex2({ text, text2, text3, month }: SiteFlex2Props) {
  return (
    <div className="site-flex items-stretch gap-4 group">
      <div className="w-16 site-flex flex-col items-end justify-center site-relative">
        <div className="text-sm font-bold text-default-300 leading-none text-right">
          {text}
          <br />
          {month}
        </div>
      </div>
      <div className="grow site-border p-3.5 rounded-xl site-flex justify-between items-center transition-transform border-[#12a70a33] bg-[#12a70a4d] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-primary-2)_20%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-primary-2)_30%,_transparent)]">
        <div className="site-flex items-center gap-2">
          <div>
            {" "}
            <i className="iconify lucide--circle-check size-3.5 text-primary-2" />{" "}
          </div>
          <span className="font-medium text-sm md:text-base">{text2}</span>
        </div>
        <span className="text-xs md:text-sm text-default-200">{text3}</span>
      </div>
    </div>
  );
}
