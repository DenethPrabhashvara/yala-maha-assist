import type { Metadata } from "next";
import LandingPage from "../../components/landing/LandingPage";
import { getDict } from "../../lib/i18n";

const t = getDict("en");

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  icons: [{ rel: "icon", url: "/images/favicon.png" }],
};

export default function Page() {
  return <LandingPage lang="en" />;
}
