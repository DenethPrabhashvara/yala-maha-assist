import type { Metadata } from "next";
import { SITE } from "../../../lib/site";

export const metadata: Metadata = {
  title: `Photo credits | ${SITE.name}`,
  icons: [{ rel: "icon", url: "/images/favicon.png" }],
};

const photos = [
  {
    file: "paddy",
    title: "Paddy field in Sammanthurai, Ampara, Sri Lanka",
    url: "https://commons.wikimedia.org/wiki/File:Paddy_field_in_Sammanthurai,_Ampara,_Sri_Lanka.JPG",
    author: "Anton Croos",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  {
    file: "farmers",
    title: "Farmers in a Paddy field",
    url: "https://commons.wikimedia.org/wiki/File:Farmers_in_a_Paddy_field.jpg",
    author: "Cwij66",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    file: "tank",
    title: "Nachchaduwa wewa (Nachchaduwa Tank)",
    url: "https://commons.wikimedia.org/wiki/File:Nachchaduwa_wewa_(Nachchaduwa_Tank).jpg",
    author: "Shashika adithya",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    file: "canal",
    title: "Uda Walawe Irrigation Canal",
    url: "https://commons.wikimedia.org/wiki/File:Uda_Walawe_Irrigation_Canal_-_panoramio.jpg",
    author: "Pol van den Scheetek… (Panoramio user, as shown on Commons)",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  {
    file: "flood",
    title: "View of the flooded landscape in Sri Lanka (2)",
    url: "https://commons.wikimedia.org/wiki/File:View_of_the_flooded_landscape_in_an_unidentified_location_in_Sri_Lanka_(2).jpg",
    author: "AM.FALEEL",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  {
    file: "harvest",
    title: "Straws after harvesting",
    url: "https://commons.wikimedia.org/wiki/File:Straws_after_harvesting.jpg",
    author: "Ajshafeer96",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
];

export default function CreditsPage() {
  return (
    <main className="site-bg-body-bg min-h-screen px-5 py-16">
      <link rel="stylesheet" href="/assets/css/landing.css" precedence="default" />
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-medium text-default-600 hover:underline">
          ← {SITE.name}
        </a>
        <h1 className="mt-6 text-4xl font-medium tracking-tight text-default-900">Photo credits</h1>
        <p className="mt-3 text-lg text-default-600">
          The photos on this site come from Wikimedia Commons. They were resized, cropped and converted to WebP; the
          CC BY-SA photos remain under the same licence.
        </p>
        <ul className="mt-10 space-y-5">
          {photos.map((photo) => (
            <li key={photo.file} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <img src={`/images/photos/${photo.file}.webp`} alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
              <div className="text-sm leading-relaxed text-default-700">
                <a href={photo.url} className="font-semibold text-default-900 hover:underline" rel="noopener noreferrer">
                  {photo.title}
                </a>
                <br />
                by {photo.author} ·{" "}
                <a href={photo.licenceUrl} className="hover:underline" rel="noopener noreferrer">
                  {photo.licence}
                </a>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-default-500">
          Phone screens are screenshots of the {SITE.name} app. The logo belongs to {SITE.name}.
        </p>
      </div>
    </main>
  );
}
