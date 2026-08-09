import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import { User, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { dataCache } from "../lib/dataCache";
import svgPaths from "../imports/Desktop/svg-rb00s3u9xu";
import { Theme, navItems } from "../types";

function getInitialLogoSettings() {
  try {
    const cached = localStorage.getItem("cached_json_settings") || localStorage.getItem("cached_logo_settings");
    if (cached) {
      const data = JSON.parse(cached);
      return {
        logoUrl: data.headerLogoUrl || data.lightLogoUrl || data.logoUrl || "/website-logo.png",
        lightLogoUrl: data.lightLogoUrl || "",
        darkLogoUrl: data.darkLogoUrl || "",
        logoSize: data.headerLogoSize || data.logoSize || 40,
        logoPaddingTop: data.headerLogoPaddingTop || data.logoPaddingTop || 0,
        logoPaddingLeft: data.headerLogoPaddingLeft || data.logoPaddingLeft || 0,
        faviconSize: data.faviconSize !== undefined ? data.faviconSize : 16
      };
    }
  } catch (e) {}
  return { logoUrl: "/website-logo.png", logoSize: 40, logoPaddingTop: 0, logoPaddingLeft: 0, faviconSize: 16 };
}

function updateSocialMetaImage(rawUrl: string, faviconSize: number = 16) {
  if (!rawUrl) return;
  let fullUrl = rawUrl;
  if (rawUrl.startsWith("/")) {
    fullUrl = `${window.location.origin}${rawUrl}`;
  }

  const setMeta = (selector: string, attrName: string, value: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      if (selector.startsWith('meta[')) {
        el = document.createElement('meta');
        const matchProp = selector.match(/property="([^"]+)"/);
        const matchName = selector.match(/name="([^"]+)"/);
        if (matchProp) el.setAttribute('property', matchProp[1]);
        if (matchName) el.setAttribute('name', matchName[1]);
        document.head.appendChild(el);
      } else if (selector.startsWith('link[')) {
        el = document.createElement('link');
        const matchRel = selector.match(/rel="([^"]+)"/);
        if (matchRel) el.setAttribute('rel', matchRel[1]);
        document.head.appendChild(el);
      }
    }
    if (el) {
      el.setAttribute(attrName, value);
    }
  };

  try {
    setMeta('meta[property="og:image"]', 'content', fullUrl);
    setMeta('meta[property="og:image:url"]', 'content', fullUrl);
    setMeta('meta[property="og:image:secure_url"]', 'content', fullUrl);
    setMeta('meta[name="twitter:image"]', 'content', fullUrl);
    setMeta('link[rel="image_src"]', 'href', fullUrl);
  } catch (e) {
    console.error("Meta update error:", e);
  }

  // Dynamically create a scaled favicon icon of exact requested pixel size
  const numSize = Math.max(8, Math.min(256, Number(faviconSize) || 16));

  const setFaviconHref = (href: string) => {
    let iconLink: HTMLLinkElement | null = document.querySelector('link[rel="icon"]');
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.type = 'image/png';
    iconLink.setAttribute('sizes', `${numSize}x${numSize}`);
    iconLink.href = href;

    let appleLink: HTMLLinkElement | null = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = href;
  };

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = numSize;
      canvas.height = numSize;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, numSize, numSize);
        ctx.drawImage(img, 0, 0, numSize, numSize);
        const dataUrl = canvas.toDataURL("image/png");
        setFaviconHref(dataUrl);
      } else {
        setFaviconHref(fullUrl);
      }
    } catch (e) {
      setFaviconHref(fullUrl);
    }
  };
  img.onerror = () => {
    setFaviconHref(fullUrl);
  };
  img.src = fullUrl;
}

function Logo({ t, isDark }: { t: Theme; isDark?: boolean }) {
  const initial = getInitialLogoSettings();
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl || "/website-logo.png");
  const [lightLogoUrl, setLightLogoUrl] = useState(initial.lightLogoUrl || "");
  const [darkLogoUrl, setDarkLogoUrl] = useState(initial.darkLogoUrl || "");
  const [logoSize, setLogoSize] = useState(initial.logoSize ?? 40);
  const [logoPaddingTop, setLogoPaddingTop] = useState(initial.logoPaddingTop ?? 0);
  const [logoPaddingLeft, setLogoPaddingLeft] = useState(initial.logoPaddingLeft ?? 0);
  const [favSize, setFavSize] = useState<number>(initial.faviconSize ?? 16);

  useEffect(() => {
    updateSocialMetaImage(logoUrl, favSize);
  }, [logoUrl, favSize]);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await dataCache.getData<any>("settings", {});
      if (data) {
        const currentLogo = data.headerLogoUrl || data.logoUrl || "/website-logo.png";
        const currentFavSize = data.faviconSize !== undefined ? Number(data.faviconSize) : 16;
        if (currentLogo) {
          setLogoUrl(currentLogo);
          setFavSize(currentFavSize);
          updateSocialMetaImage(currentLogo, currentFavSize);
        }
        if (data.lightLogoUrl) setLightLogoUrl(data.lightLogoUrl);
        if (data.darkLogoUrl) setDarkLogoUrl(data.darkLogoUrl);
        if (data.headerLogoSize !== undefined) setLogoSize(data.headerLogoSize);
        if (data.headerLogoPaddingTop !== undefined) setLogoPaddingTop(data.headerLogoPaddingTop);
        if (data.headerLogoPaddingLeft !== undefined) setLogoPaddingLeft(data.headerLogoPaddingLeft);
      }
    };

    loadSettings();
    const unsub = dataCache.subscribe("settings", (data) => {
      if (data) {
        const currentLogo = data.headerLogoUrl || data.logoUrl || "/website-logo.png";
        const currentFavSize = data.faviconSize !== undefined ? Number(data.faviconSize) : 16;
        if (currentLogo) {
          setLogoUrl(currentLogo);
          setFavSize(currentFavSize);
          updateSocialMetaImage(currentLogo, currentFavSize);
        }
        if (data.lightLogoUrl) setLightLogoUrl(data.lightLogoUrl);
        if (data.darkLogoUrl) setDarkLogoUrl(data.darkLogoUrl);
        if (data.headerLogoSize !== undefined) setLogoSize(data.headerLogoSize);
        if (data.headerLogoPaddingTop !== undefined) setLogoPaddingTop(data.headerLogoPaddingTop);
        if (data.headerLogoPaddingLeft !== undefined) setLogoPaddingLeft(data.headerLogoPaddingLeft);
      }
    });
    return () => unsub();
  }, []);

  const displayLogo = isDark ? (darkLogoUrl || logoUrl) : (lightLogoUrl || logoUrl);

  return (
    <div className="flex items-center gap-1.5 shrink-0" style={{ paddingTop: `${logoPaddingTop}px`, paddingLeft: `${logoPaddingLeft}px` }}>
      <img 
        src={displayLogo} 
        alt="Logo" 
        className="object-contain"
        style={{ height: `${logoSize}px` }}
      />
    </div>
  );
}

function getInitialNav() {
  try {
    const cached = localStorage.getItem("cached_json_nav") || localStorage.getItem("cached_nav_links") || localStorage.getItem("cached_nav_items");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [
    { id: "hero", label: "Home", href: "#hero", order: 0 },
    { id: "features", label: "Features", href: "#features", order: 1 },
    { id: "download", label: "Download", href: "#download", order: 2 },
    { id: "faq", label: "FAQ", href: "#faq", order: 3 },
    { id: "reviews", label: "Reviews", href: "#reviews", order: 4 },
  ];
}

export default function Header({
  isDark,
  setIsDark,
  t,
  currentUser,
  onRequestSignIn,
  onOpenAdmin
}: {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  t: Theme;
  currentUser: User | null;
  onRequestSignIn: () => void;
  onOpenAdmin?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dynamicNav, setDynamicNav] = useState(getInitialNav);

  useEffect(() => {
    const defaultList = [
      { id: "hero", label: "Home", href: "#hero", order: 0 },
      { id: "features", label: "Features", href: "#features", order: 1 },
      { id: "download", label: "Download", href: "#download", order: 2 },
      { id: "faq", label: "FAQ", href: "#faq", order: 3 },
      { id: "reviews", label: "Reviews", href: "#reviews", order: 4 },
    ];

    const processNavItems = (items: any[]) => {
      if (!Array.isArray(items)) return defaultList;
      // If we have items from JSON/DB, use them directly (filter out hidden ones)
      const combined = items.filter((item: any) => !item.hidden).map((item: any, idx: number) => ({
        id: item.id,
        label: item.label,
        href: item.href || "",
        order: item.order ?? idx
      }));
      combined.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      return combined;
    };

    const loadNav = async () => {
      const items = await dataCache.getData<any[]>("nav", defaultList);
      setDynamicNav(processNavItems(items));
    };

    loadNav();
    const unsub = dataCache.subscribe("nav", (items) => {
      setDynamicNav(processNavItems(items));
    });
    return () => unsub();
  }, []);

  const [active, setActive] = useState(dynamicNav[0]?.id || "hero");
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [pillAnimated, setPillAnimated] = useState(false);
  const [themeAnimated, setThemeAnimated] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setThemeAnimated(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const lastScrollY = useRef(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const lenis = useLenis();
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);

  const scrollTo = (item: { id: string; label: string; href?: string }) => {
    setPillAnimated(true);
    const rawTarget = (item.href || item.id || "").trim();
    const cleanId = rawTarget.startsWith("#") ? rawTarget.slice(1) : rawTarget;
    setActive(item.id);

    if (rawTarget.startsWith("http://") || rawTarget.startsWith("https://")) {
      window.open(rawTarget, "_blank");
      return;
    }

    let target = document.getElementById(cleanId) || document.getElementById(cleanId.toLowerCase());
    if (!target) {
      const lower = cleanId.toLowerCase();
      if (lower.includes("faq") || lower.includes("fag") || lower.includes("help") || lower.includes("question")) {
        target = document.getElementById("faq");
      } else if (lower.includes("download") || lower.includes("apk") || lower.includes("app")) {
        target = document.getElementById("download");
      } else if (lower.includes("feature") || lower.includes("service")) {
        target = document.getElementById("features");
      } else if (lower.includes("review") || lower.includes("rating")) {
        target = document.getElementById("reviews");
      } else if (lower.includes("home") || lower.includes("top")) {
        target = document.getElementById("hero");
      } else if (lower.includes("contact") || lower.includes("footer")) {
        target = document.getElementById("footer");
      }
    }

    if (target) {
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(target, { offset: -70 });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMenuOpen(false);

    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1200);
  };

  const isFirstMountRef = useRef(true);

  /* Keep the pill under the active item without initial transition on page open */
  useLayoutEffect(() => {
    const measure = () => {
      const idx = dynamicNav.findIndex((n) => n.id === active);
      const el = itemRefs.current[idx];
      if (el) {
        setPill({ left: el.offsetLeft, width: el.offsetWidth });
        if (isFirstMountRef.current) {
          setPillAnimated(false);
          isFirstMountRef.current = false;
        }
      }
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, dynamicNav]);

  /* Auto-close menus on scroll */
  useEffect(() => {
    const handleScrollClose = () => {
      if (isLogoutOpen) setIsLogoutOpen(false);
      if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("scroll", handleScrollClose, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollClose);
  }, [isLogoutOpen, menuOpen]);

  // Highlight active section on scroll and track direction
  useLenis((l) => {
    if (l) {
      const scrolled = l.scroll > 10;
      if (scrolled !== isScrolled) setIsScrolled(scrolled);
      
      const currentScrollY = l.scroll;
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
        if (isVisible) setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 50) {
        if (!isVisible) setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  });

  // Use IntersectionObserver for highly optimized active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        let currentBest = active;
        let maxVisible = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxVisible) {
            maxVisible = entry.intersectionRatio;
            currentBest = entry.target.id;
          }
        });
        if (maxVisible > 0 && currentBest !== active) {
          setPillAnimated(true);
          setActive(currentBest);
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    dynamicNav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [active]);

  // Calculate background color with transparency for premium blur effect
  const bgWithTransparency = isDark ? "rgba(15,10,26,0.5)" : "rgba(255,255,255,0.7)";

  return (
    <header
      className={`fixed left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-6 lg:px-10 transition-all duration-500 ease-in-out transform-gpu ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isScrolled
          ? "py-2 sm:py-3"
          : "py-4 sm:py-5"
      }`}
      style={{
        background: "transparent",
        top: 0,
        z: 0,
      }}
    >
      <Logo t={t} isDark={isDark} />

      {/* Desktop nav (Always active, scaled beautifully with safe padding) */}
      <nav
        className="flex gap-1 items-center h-10 p-1 px-1.5 rounded-full absolute left-1/2 -translate-x-1/2 transition-all duration-300 backdrop-blur-md shadow-sm border flex-nowrap overflow-x-auto scrollbar-none max-w-[calc(100vw-220px)] sm:max-w-[calc(100vw-280px)] shrink-0 my-0"
        style={{
          background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.75)",
          borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.08)",
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" : "0 4px 20px rgba(0,0,0,0.05)"
        }}
      >
        <div
          className={`absolute top-1 bottom-1 rounded-full ${pillAnimated ? "transition-all duration-200 ease-out" : "transition-none"}`}
          style={{ background: isDark ? "#ffffff" : "#151022", left: pill.left, width: pill.width, opacity: pill.width > 0 ? 1 : 0 }}
        />
        {dynamicNav.map((item, i) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { itemRefs.current[i] = el; }}
              onClick={() => scrollTo(item)}
              className={`font-['Plus_Jakarta_Sans',sans-serif] uppercase relative z-10 h-8 px-2.5 md:px-3.5 rounded-full cursor-pointer whitespace-nowrap flex items-center justify-center shrink-0 transition-colors duration-200 ${
                isActive ? "font-extrabold text-xs md:text-sm" : "font-semibold text-xs md:text-sm"
              }`}
              style={{
                color: isActive
                  ? (isDark ? "#000000" : "#ffffff")
                  : (isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(15, 10, 34, 0.85)")
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3 pl-10 sm:pl-16 ml-auto z-20 shrink-0">
        {/* Theme toggle - Sleek and compact */}
        <button
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle theme"
          className="relative h-10 w-[84px] rounded-full shrink-0 transition-all duration-300 cursor-pointer border flex items-center shadow-sm backdrop-blur-md"
          style={{
            background: isDark ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            className={`absolute top-1 h-8 w-8 rounded-full shadow-md ${themeAnimated ? "transition-all duration-200 ease-out" : "transition-none"}`}
            style={{
              left: isDark ? "48px" : "4px",
              background: isDark ? t.bg : "#FCC900",
              boxShadow: isDark
                ? "0 2px 8px rgba(0, 0, 0, 0.4)"
                : "0 2px 8px rgba(252, 201, 0, 0.4)",
            }}
          />
          <div className="absolute left-0 top-0 w-10 h-10 flex items-center justify-center pointer-events-none z-10">
            <svg
              className="w-4 h-4 transition-all duration-300"
              fill="none"
              viewBox="0 0 14.9788 14.0045"
            >
              <path
                d={svgPaths.p10afa40}
                stroke="#000000"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.084"
              />
            </svg>
          </div>
          <div className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center pointer-events-none z-10">
            <svg
              className="w-4 h-4 transition-all duration-300"
              fill="none"
              viewBox="0 0 14.7523 13.8062"
            >
              <path
                d={svgPaths.p1ee40600}
                stroke={isDark ? "#ffffff" : "#000000"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.23077"
              />
            </svg>
          </div>
        </button>

        {/* User Profile / Login */}
        {currentUser ? (
          <div className="relative block">
            <div
              className="flex items-center gap-1.5 pl-[2px] pr-3 h-10 rounded-full cursor-pointer transition-all hover:scale-105 backdrop-blur-md shadow-sm border"
              onClick={() => setIsLogoutOpen(!isLogoutOpen)}
              style={{
                background: isDark ? "rgba(123, 44, 191, 0.2)" : "rgba(255, 255, 255, 0.75)",
                borderColor: isDark ? "rgba(123, 44, 191, 0.4)" : "rgba(0, 0, 0, 0.1)",
              }}
            >
              {currentUser.photoURL ? (
                <img loading="lazy" src={currentUser.photoURL} alt={currentUser.displayName || "User"} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shadow-md border border-white/30" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#7B2CBF] text-white flex items-center justify-center font-bold text-sm shadow-md border border-white/20">
                  {(currentUser.displayName || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="inline-block text-xs font-bold max-w-[65px] sm:max-w-[90px] truncate" style={{ color: isDark ? "#ffffff" : "#111111" }}>
                {currentUser.displayName?.split(" ")[0]}
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform ${isLogoutOpen ? 'rotate-180' : ''}`} style={{ color: isDark ? "#ffffff" : "#111111" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <AnimatePresence>
              {isLogoutOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLogoutOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border z-50 p-2"
                    style={{ background: isDark ? "#1c142d" : "#ffffff", borderColor: t.cardBorder }}
                  >
                    <div className="px-3 py-2 border-b mb-1" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                      <p className="text-sm font-bold truncate" style={{ color: t.text }}>{currentUser.displayName}</p>
                      <p className="text-xs truncate opacity-70" style={{ color: t.text }}>{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => { signOut(auth); setIsLogoutOpen(false); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-red-500/10 text-red-500 flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={onRequestSignIn}
            className="flex items-center gap-1.5 px-4 h-10 rounded-full font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md text-white whitespace-nowrap"
            style={{ background: "#7B2CBF" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
