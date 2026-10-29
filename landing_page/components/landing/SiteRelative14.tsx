export interface SiteRelative14Props {
  image: string;
  imageAlt: string;
  title: string;
  place: string;
  big?: string;
  text: string;
}

export default function SiteRelative14({ image, imageAlt, title, place, big, text }: SiteRelative14Props) {
  return (
    <div className="site-relative w-95 md:h-128 h-75 rounded-2xl overflow-hidden site-flex flex-col justify-between p-7.5 group">
      <img
        className="site-absolute w-full h-full site-object-cover inset-[calc(var(--spacing)_*_0)]"
        src={image}
        alt={imageAlt}
        loading="lazy"
      />
      <div className="site-absolute bg-gradient-to-t site-from-black-80 site-via-transparent site-to-black-20 inset-[calc(var(--spacing)_*_0)] [--tw-gradient-to:#0003] [@supports_(color:color-mix(in_lab,_red,_red))]:[--tw-gradient-to:color-mix(in_oklab,_var(--color-black)_20%,_transparent)]" />
      <div className="site-relative site-z-10">
        <p className="text-lg text-white font-medium whitespace-normal">
          <span className="opacity-100">{title}</span>{" "}
          <span className="opacity-50 text-sm font-medium">— {place}</span>
        </p>
      </div>
      <div className="site-relative site-z-10 text-white">
        {big && <h3 className="text-5xl font-black site-mb-1 text-white">{big}</h3>}
        <p className="text-white text-lg font-medium leading-tight whitespace-normal">{text}</p>
      </div>
    </div>
  );
}
