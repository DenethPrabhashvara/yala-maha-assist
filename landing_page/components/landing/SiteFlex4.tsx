import Ring from "./Ring";

export interface SiteFlex4Props {
  percent: number;
  description: string;
  status: string;
  big?: boolean;
}

export default function SiteFlex4({ percent, description, status, big }: SiteFlex4Props) {
  return (
    <div className="site-flex flex-col items-center">
      <div className="site-relative site-flex items-center justify-center">
        <Ring percent={percent} size={big ? 120 : 80} />
        <div className="site-absolute site-flex items-center text-white">
          <span className="text-xl font-medium" data-count={Math.round(percent)}>{Math.round(percent)}</span>
          <span className="site-mb-1 text-lg font-medium">%</span>
        </div>
      </div>
      <p className="site-mt-3-5 md:text-lg text-base text-default-300">{description}</p>
      <p className="text-xs text-default-400">{status}</p>
    </div>
  );
}
