import * as React from "react";

type Props = {
  className?: string;
  cutoutColor?: string;
};

/**
 * Filled cat silhouette. currentColor drives the fill so it inherits
 * from its container — which lets us recolor in dark mode for free.
 */
export const CatMark: React.FC<Props> = ({
  className,
  cutoutColor = "var(--accent-soft)",
}) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="currentColor"
    aria-hidden
  >
    <path d="M6.5 5 L9.5 12.5 L13.5 10.5 Z" />
    <path d="M25.5 5 L22.5 12.5 L18.5 10.5 Z" />
    <path
      d="M8.5 7.5 L10.5 12 L12 11 Z"
      fill="oklch(72% 0.12 55)"
      opacity="0.55"
    />
    <path
      d="M23.5 7.5 L21.5 12 L20 11 Z"
      fill="oklch(72% 0.12 55)"
      opacity="0.55"
    />
    <path d="M8 12.5 Q16 9 24 12.5 Q27 15.5 26.5 19.5 Q25.5 26 16 27 Q6.5 26 5.5 19.5 Q5 15.5 8 12.5 Z" />
    <ellipse cx="12.4" cy="17.6" rx="1.1" ry="1.55" fill={cutoutColor} />
    <ellipse cx="19.6" cy="17.6" rx="1.1" ry="1.55" fill={cutoutColor} />
    <path
      d="M14.7 20 L17.3 20 L16 21.3 Z"
      fill="oklch(72% 0.12 55)"
      stroke={cutoutColor}
      strokeWidth="0.45"
      strokeLinejoin="round"
    />
    <path
      d="M14.3 21.6 Q16 22.8 17.7 21.6"
      fill="none"
      stroke={cutoutColor}
      strokeWidth="0.9"
      strokeLinecap="round"
    />
    <path
      d="M3 19 L7.8 19.6 M3.5 21.2 L8 21"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M29 19 L24.2 19.6 M28.5 21.2 L24 21"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);
