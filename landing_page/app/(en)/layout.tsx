import type { ReactNode } from "react";
import RootShell from "../../components/landing/RootShell";

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
