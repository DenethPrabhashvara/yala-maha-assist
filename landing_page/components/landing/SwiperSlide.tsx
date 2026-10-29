export interface SwiperSlideProps {
  ariaLabel?: string;
  image: string;
  title: string;
  description: string;
}

export default function SwiperSlide({ ariaLabel, image, title, description }: SwiperSlideProps) {
  return (
    <div className="snap-start shrink-0 site-me-4" style={{ width: "300px", marginRight: "15px" }} role="group" aria-label={ariaLabel}>
      <div className="tilt site-relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 to-indigo-100 pt-6 h-[34rem]">
        <img src={image} alt={title} className="site-mx-auto h-[27rem] w-auto drop-shadow-xl" />
        <div className="site-absolute inset-x-0 bottom-0 bg-white/95 px-5 py-4 text-start">
          <h3 className="text-base font-semibold leading-tight text-default-900">{title}</h3>
          <p className="mt-1 text-sm text-default-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
