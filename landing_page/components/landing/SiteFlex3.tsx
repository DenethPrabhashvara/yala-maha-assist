export interface SiteFlex3Props {
  text: string;
  text2: string;
  text3: string;
  text4: string;
}

export default function SiteFlex3({ text, text2, text3, text4 }: SiteFlex3Props) {
  return (
    <div className="site-flex items-stretch gap-4 group">
      <div className="w-16 site-flex flex-col items-end justify-center site-relative">
        <div className="text-sm font-bold text-default-300 leading-none text-right text-white">
          {text}
          <br />
          {text2}
        </div>
      </div>
      <div className="grow bg-default-900 site-border border-default-700 p-3.5 rounded-xl site-flex justify-between items-center transition-transform">
        <span className="font-medium text-sm md:text-base site-ms-2">{text3}</span>
        <span className="text-xs md:text-sm text-white">{text4}</span>
      </div>
    </div>
  );
}
