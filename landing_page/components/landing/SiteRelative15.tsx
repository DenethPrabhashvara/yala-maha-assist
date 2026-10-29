export interface SiteRelative15Props {
  image: string;
  alt: string;
  description: string;
  title: string;
  description2: string;
}

export default function SiteRelative15({
  image,
  alt,
  description,
  title,
  description2,
}: SiteRelative15Props) {
  return (
    <div className="site-relative overflow-hidden rounded-2xl [box-shadow:var(--tw-inset-shadow),_var(--tw-inset-ring-shadow),_var(--tw-ring-offset-shadow),_var(--tw-ring-shadow),_var(--tw-shadow)] [--tw-shadow:0_25px_50px_-12px_var(--tw-shadow-color,#00000040)] [--tw-shadow-color:#e4e4e780] [@supports_(color:color-mix(in_lab,_red,_red))]:[--tw-shadow-color:color-mix(in_oklab,_color-mix(in_oklab,_var(--color-default-200)_50%,_transparent)_var(--tw-shadow-alpha),_transparent)]">
      <img className="w-full lg:h-138 h-92 site-object-cover" alt={alt} src={image} />
      {"  "}
      <div className="site-absolute lg:bottom-8 md:bottom-4 bottom-2 right-2 lg:right-8 md:right-4 backdrop-blur-md lg:p-7.5 md:p-5 p-3.5 rounded-3xl site-border md:w-100 w-70 text-left border-[#ffffff1a] bg-[#18181b99] [@supports_(color:color-mix(in_lab,_red,_red))]:border-[color-mix(in_oklab,_var(--color-white)_10%,_transparent)] [@supports_(color:color-mix(in_lab,_red,_red))]:bg-[color-mix(in_oklab,_var(--color-default-900)_60%,_transparent)]">
        <p className="text-default-300 md:text-lg text-sm site-mb-7-5 tracking-normal font-medium">
          {description}
        </p>
        <div className="site-flex items-center justify-between">
          <h3 className="md:text-4xl text-2xl font-bold text-white leading-none">{title}</h3>
          <p className="text-default-400 text-sm font-medium tracking-tighter">{description2}</p>
        </div>
      </div>
    </div>
  );
}
