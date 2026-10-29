import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    background?: string | number | boolean;
    bgColor?: string | number | boolean;
    border?: string | number | boolean;
    clear?: string | number | boolean;
    compact?: string | number | boolean;
    face?: string | number | boolean;
    hSpace?: string | number | boolean;
    noShade?: string | number | boolean;
    noWrap?: string | number | boolean;
    vAlign?: string | number | boolean;
    vSpace?: string | number | boolean;
  }
}
