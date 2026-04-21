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
        paddingBottom: "0%",
      } as const;
    case "center":
      return {
        justifyContent: "center",
        paddingTop: "0%",
        paddingBottom: "0%",
      } as const;
    case "bottom":
    default:
      return {
        justifyContent: "flex-end",
        paddingTop: "0%",
        paddingBottom: "14%",
      } as const;
  }
}
