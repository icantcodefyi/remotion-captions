import type { TikTokPage } from "@remotion/captions";
import type { StyleOptions } from "@/lib/types";

export type CaptionStyleProps = {
  page: TikTokPage;
  options: StyleOptions;
  pageIndex: number;
};

export function positionStyles(position: StyleOptions["position"]) {
  switch (position) {
    case "top":
      return {
        justifyContent: "flex-start",
        paddingTop: "8%",
      } as const;
    case "center":
      return {
        justifyContent: "center",
      } as const;
    case "bottom":
    default:
      return {
        justifyContent: "flex-end",
        paddingBottom: "14%",
      } as const;
  }
}
