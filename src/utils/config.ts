export const appThemes = [
  "blue",
  "green",
  "red",
  "purple",
  "yellow",
  "california",
  "chateauGreen",
  "lightGreen",
  "darkBlue",
  "nevada",
  "shakespeare",
  "stormGrey",
  "tomatoOrange",
  "lightBlue",
] as const;

export const colorMode = ["light", "dark", "system"] as const;

export const app_config = {
  name: "Breppo",
  name_v1: "Breppo",
  theme: "lightBlue",
  colorMode: "dark",
  LogoLight: "/images/logo_light_brep.svg",
  LogoDark: "/images/logo_dark_brep.svg",
  LogoIconLight: "/icons/favicon.png",
  LogoIconDark: "/icons/favicon.png",
  currency: "NGN",
  version: "1.0.0",
  // Support Contacts
  whatsapp: "+23480",
  email: "support@breppo.com",
  // Social Media Handles and URLs
  twitter: "https://x.com/Breppo",
  instagram: "https://instagram.com/Breppo",
  website: "https://breppo.com",
  twitterHandle: "@Breppo",
  instagramHandle: "@Breppo",
  websiteHandle: "breppo.com",
  // App store & play store review links
  appleReviewLink: "https://apps.apple.com/app/id6470390490?action=write-review",
  playStoreReviewLink: "https://play.google.com/store/apps/details?id=com.breppo.app",
  appleAppId: "6470390490",
  androidPackageName: "com.breppo.myApp",
} as const;

import app_colors from "../styles/color";
export const brandColor = app_colors[app_config.theme][500];

