import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import svgPaths from "../imports/Desktop/svg-rb00s3u9xu";
import { Theme } from "../types";
import { dataCache } from "../lib/dataCache";

export function Divider({ t }: { t: Theme }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14">
      <div className="h-px w-full transition-colors duration-500" style={{ background: `linear-gradient(to right,transparent,${t.border},transparent)` }} />
    </div>
  );
}

export function ScrollToTop({ t }: { t: Theme }) {
  const [visible, setVisible] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 350);
    // Initial check in case page is already scrolled
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-to-top"
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleScrollTop}
          aria-label="Scroll to top"
          className="fixed bottom-28 right-[8%] sm:right-[7%] z-50 cursor-pointer flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg,rgba(255,255,255,.12),rgba(153,153,153,.08))",
            border: "1px solid rgba(22,207,131,.5)",
            boxShadow: "0 0 20px 6px rgba(22,207,131,.25), 1px 1px 15px 6px rgba(22,207,131,.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          <svg style={{ width: 24, height: 24 }} fill="none" viewBox="0 0 24 24" stroke="#16CF83" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V4" />
            <path d="m5 11 7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function getInitialFooterSettings() {
  try {
    const cached = localStorage.getItem("cached_json_settings") || localStorage.getItem("cached_logo_settings");
    if (cached) {
      const data = JSON.parse(cached);
      return {
        logoUrl: data.headerLogoUrl || data.logoUrl || "/website-logo.png",
        lightLogoUrl: data.lightLogoUrl || "",
        darkLogoUrl: data.darkLogoUrl || "",
        logoSize: data.footerLogoSize ?? data.logoSize ?? 32,
        logoPaddingTop: data.footerLogoPaddingTop ?? 0,
        logoPaddingLeft: data.footerLogoPaddingLeft ?? 0,
        telegram: data.footerTelegram || "https://t.me/kayesahmmedpro",
        whatsapp: data.footerWhatsapp || "https://wa.me/",
        youtube: data.footerYoutube || "https://youtube.com/@kayesahmmed-xs3hk?si=yTTcq8MXuImfhgUI"
      };
    }
  } catch (e) {}
  return {
    logoUrl: "/website-logo.png",
    lightLogoUrl: "",
    darkLogoUrl: "",
    logoSize: 32,
    logoPaddingTop: 0,
    logoPaddingLeft: 0,
    telegram: "https://t.me/kayesahmmedpro",
    whatsapp: "https://wa.me/",
    youtube: "https://youtube.com/@kayesahmmed-xs3hk?si=yTTcq8MXuImfhgUI"
  };
}

export default function Footer({ t, onOpenAdmin, isDark }: { t: Theme; onOpenAdmin: () => void; isDark?: boolean }) {
  const initial = getInitialFooterSettings();
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [lightLogoUrl, setLightLogoUrl] = useState(initial.lightLogoUrl);
  const [darkLogoUrl, setDarkLogoUrl] = useState(initial.darkLogoUrl);
  const [logoSize, setLogoSize] = useState(initial.logoSize);
  const [logoPaddingTop, setLogoPaddingTop] = useState(initial.logoPaddingTop);
  const [logoPaddingLeft, setLogoPaddingLeft] = useState(initial.logoPaddingLeft);
  const [telegram, setTelegram] = useState(initial.telegram);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [youtube, setYoutube] = useState(initial.youtube);

  useEffect(() => {
    const applySettings = (data: any) => {
      if (data) {
        if (data.headerLogoUrl || data.logoUrl) setLogoUrl(data.headerLogoUrl || data.logoUrl);
        if (data.lightLogoUrl) setLightLogoUrl(data.lightLogoUrl);
        if (data.darkLogoUrl) setDarkLogoUrl(data.darkLogoUrl);
        if (data.footerLogoSize !== undefined) setLogoSize(data.footerLogoSize);
        if (data.footerLogoPaddingTop !== undefined) setLogoPaddingTop(data.footerLogoPaddingTop);
        if (data.footerLogoPaddingLeft !== undefined) setLogoPaddingLeft(data.footerLogoPaddingLeft);
        if (data.footerTelegram) setTelegram(data.footerTelegram);
        if (data.footerWhatsapp) setWhatsapp(data.footerWhatsapp);
        if (data.footerYoutube) setYoutube(data.footerYoutube);
      }
    };

    const loadSettings = async () => {
      const data = await dataCache.getData<any>("settings", {});
      applySettings(data);
    };

    loadSettings();
    const unsub = dataCache.subscribe("settings", applySettings);
    return () => unsub();
  }, []);

  const socials = [
    { 
      href: telegram, 
      label: "Telegram", 
      color: "#229ED9",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-.99.53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.89 8.01-3.45 3.82-1.59 4.61-1.87 5.13-1.88.11 0 .37.03.54.17.14.12.18.28.2.45-.01.07.01.21 0 .34z"/>
        </svg>
      )
    },
    { 
      href: whatsapp, 
      label: "WhatsApp", 
      color: "#25D366",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      )
    },
    { 
      href: youtube,  
      label: "YouTube",  
      color: "#FF0000",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
  ];


  return (
    <footer id="footer" className="mt-6 transition-colors duration-500" style={{ background: t.footerBg, borderTop: "1px solid rgba(255,255,255,.1)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4 sm:gap-6 flex-wrap md:flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-none py-1">
                    {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0" style={{ paddingTop: `${logoPaddingTop}px`, paddingLeft: `${logoPaddingLeft}px` }}>
            <img src={isDark ? (darkLogoUrl || logoUrl) : (lightLogoUrl || logoUrl)} alt="Logo" className="object-contain" style={{ height: `${logoSize}px` }} />
          </div>

          {/* Social Icons */}
          <div className="flex gap-3 items-center shrink-0">
            {socials.map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                style={{ 
                  background: "linear-gradient(135deg,rgba(255,255,255,.12),rgba(153,153,153,.08))", 
                  border: "1px solid rgba(255,255,255,.15)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = s.color;
                  e.currentTarget.style.color = s.color;
                  e.currentTarget.style.boxShadow = `0 0 12px ${s.color}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.15)";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Policy & Admin Links */}
          <div className="flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm shrink-0 whitespace-nowrap">
            <span className="text-white/60">© 2026 ModX Lab.</span>
            <button className="text-white/80 hover:text-[#9D86FF] transition-colors cursor-pointer">| Privacy Policy</button>
            <button onClick={onOpenAdmin} className="text-[#00E5D1] hover:underline font-bold transition-colors cursor-pointer flex items-center gap-1">| ⚙️ Admin Website</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
