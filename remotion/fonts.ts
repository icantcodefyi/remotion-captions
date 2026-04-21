"use client";

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";

const inter = loadInter("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

const montserrat = loadMontserrat("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});

const anton = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const bebas = loadBebas("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const orbitron = loadOrbitron("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

const jetbrains = loadJetBrainsMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

const poppins = loadPoppins("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});

const dmSans = loadDMSans("normal", {
  weights: ["500", "700", "900"],
  subsets: ["latin"],
});

export const FONTS = {
  inter: inter.fontFamily,
  montserrat: montserrat.fontFamily,
  anton: anton.fontFamily,
  bebas: bebas.fontFamily,
  orbitron: orbitron.fontFamily,
  jetbrains: jetbrains.fontFamily,
  poppins: poppins.fontFamily,
  dmSans: dmSans.fontFamily,
};
