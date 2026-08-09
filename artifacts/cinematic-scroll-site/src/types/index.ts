export type Theme = {
  bg: string;
  surface: string;
  border: string;
  text: string;
  subtext: string;
  cardBg: string;
  cardBorder: string;
  reviewBg: string;
  headerBg: string;
  footerBg: string;
  navBg: string;
  navActivePill: string;
  navActiveText: string;
  navText: string;
  faqBg: string;
  inputBg: string;
};

export const darkTheme: Theme = {
  bg:            "#000000",
  surface:       "#202025",
  border:        "rgba(255,255,255,.18)",
  text:          "#ffffff",
  subtext:       "#a1a1aa",
  cardBg:        "#1a1a1f",
  cardBorder:    "rgba(255,255,255,.16)",
  reviewBg:      "#1a1a1f",
  headerBg:      "rgba(0,0,0,.85)",
  footerBg:      "#000000",
  navBg:         "rgba(255,255,255,.12)",
  navActivePill: "#ffffff",
  navActiveText: "#000000",
  navText:       "#ffffff",
  faqBg:         "#1a1a1f",
  inputBg:       "#222228",
};

export const lightTheme: Theme = {
  bg:            "#fafafa",
  surface:       "#f4f4f5",
  border:        "rgba(0,0,0,.08)",
  text:          "#09090b",
  subtext:       "#52525b",
  cardBg:        "#ffffff",
  cardBorder:    "rgba(0,0,0,.06)",
  reviewBg:      "#ffffff",
  headerBg:      "rgba(250,250,250,.85)",
  footerBg:      "#09090b",
  navBg:         "rgba(255,255,255,.9)",
  navActivePill: "#151022",
  navActiveText: "#ffffff",
  navText:       "#09090b",
  faqBg:         "#ffffff",
  inputBg:       "#f4f4f5",
};

export const navItems = [
  { id: "hero",     label: "Home",     href: "#hero",     order: 0 },
  { id: "features", label: "Features", href: "#features", order: 1 },
  { id: "download", label: "Download", href: "#download", order: 2 },
  { id: "faq",      label: "FAQ",      href: "#faq",      order: 3 },
  { id: "reviews",  label: "Reviews",  href: "#reviews",  order: 4 },
];
