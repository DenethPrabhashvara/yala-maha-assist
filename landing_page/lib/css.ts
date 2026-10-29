import type { CSSProperties } from "react";

export const css = (style: Record<string, string | number>) => style as CSSProperties;
