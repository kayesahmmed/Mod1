import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import gsap from "gsap";
import svgPaths from "../imports/Desktop/svg-rb00s3u9xu";
import { Theme } from "../types";
import { dataCache } from "../lib/dataCache";

function TypewriterGradientText({
  text = "ModX Lab",
  delay = 200,
  speed = 50,
}: {
  text?: string;
  delay?: number;
  speed?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let animFrameId: number;
    let timeoutId: ReturnType<typeof setTimeout>;
    let startTime: number | null = null;

    timeoutId = setTimeout(() => {
      const step = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const currentCount = Math.min(text.length, Math.floor(elapsed / speed) + 1);
        setDisplayedText(text.slice(0, currentCount));

        if (currentCount < text.length) {
          animFrameId = requestAnimationFrame(step);
        } else {
          setIsTyping(false);
        }
      };
      animFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [text, delay, speed]);

  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9D86FF] via-[#7D52FD] to-[#00E5D1] inline-block font-extrabold whitespace-nowrap">
        {displayedText || "\u00A0"}
      </span>
      {isTyping && (
        <span
          className="inline-block w-[4px] h-[0.8em] ml-1 bg-[#00E5D1] align-middle rounded-full animate-pulse"
          style={{
            boxShadow: "0 0 12px #00E5D1",
            willChange: "opacity",
          }}
        />
      )}
    </span>
  );
}

export function AnimatedRingChart({ isDark = true }: { isDark?: boolean }) {
  const [progressPercent, setProgressPercent] = useState(0);
  const [isPulse, setIsPulse] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let animationFrameId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const animateValue = (startVal: number, endVal: number, duration: number, onComplete: () => void) => {
      const startTime = performance.now();
      const step = (now: number) => {
        if (!isMounted) return;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentVal = Math.round(startVal + (endVal - startVal) * eased);
        setProgressPercent(currentVal);
        setIsPulse(currentVal > 0);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          onComplete();
        }
      };
      animationFrameId = requestAnimationFrame(step);
    };

    const startCycle = () => {
      if (!isMounted) return;
      animateValue(0, 100, 1800, () => {
        if (!isMounted) return;
        animateValue(100, 0, 1800, () => {
          if (!isMounted) return;
          setIsPulse(false);
          timeoutId = setTimeout(() => {
            if (isMounted) startCycle();
          }, 200);
        });
      });
    };

    startCycle();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Arc angle calculation starting from top (-90 degrees)
  const angle = (progressPercent / 100) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const headX = 50 + 38 * Math.cos(rad);
  const headY = 50 + 38 * Math.sin(rad);

  return (
    <>
      {/* Background ambient glow */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#00E5D1]/40 via-[#16CF83]/30 to-[#7D52FD]/40 filter blur-lg transition-all duration-500 pointer-events-none ${
          isPulse ? "opacity-100 scale-110" : "opacity-25 scale-95"
        }`}
        style={{ willChange: "transform, opacity" }}
      />

      {/* SVG is NOT rotated globally so central text remains completely horizontal */}
      <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="kacThinRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5D1" />
            <stop offset="50%" stopColor="#16CF83" />
            <stop offset="100%" stopColor="#7D52FD" />
          </linearGradient>
          <filter id="kacThinGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kacDotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer tech tick marks ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
          strokeWidth="1"
          strokeDasharray="1.5 4"
        />

        {/* Outer track background (sleek thin 3.5px) */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
          strokeWidth="3.5"
        />

        {/* Inner radar dash ring */}
        <circle
          cx="50"
          cy="50"
          r="31"
          fill="none"
          stroke="rgba(0,229,209,0.25)"
          strokeWidth="0.8"
          strokeDasharray="2 4"
        />

        {/* Thin Animated Progress Ring - Rotated -90deg so it starts at 12 o'clock */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="url(#kacThinRingGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="238.761"
          strokeDashoffset={238.761 * (1 - progressPercent / 100)}
          filter="url(#kacThinGlow)"
          transform="rotate(-90 50 50)"
          style={{ transition: progressPercent === 0 ? "none" : "stroke-dashoffset 0.04s linear" }}
        />

        {/* Glowing Head Particle Dot following the arc starting at 12 o'clock */}
        {progressPercent > 0 && (
          <g filter="url(#kacDotGlow)">
            <circle cx={headX} cy={headY} r="3.5" fill="#00E5D1" />
            <circle cx={headX} cy={headY} r="1.8" fill="#FFFFFF" />
          </g>
        )}

        {/* Central Glass Core */}
        <circle
          cx="50"
          cy="50"
          r="25"
          fill={isDark ? "rgba(14, 10, 26, 0.95)" : "rgba(255, 255, 255, 0.95)"}
          stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)"}
          strokeWidth="1"
        />

        {/* 100% Horizontal Text - Strictly horizontal orientation (Left to Right) */}
        <text
          x="50"
          y="45"
          textAnchor="middle"
          dominantBaseline="central"
          className={`font-mono font-black transition-all duration-300 ${
            isPulse ? "fill-[#16CF83]" : isDark ? "fill-white" : "fill-slate-900"
          }`}
          fontSize="12"
          fontWeight="900"
          style={{ textShadow: isPulse ? "0 0 8px rgba(22,207,131,0.8)" : "none" }}
        >
          {progressPercent}%
        </text>

        {/* SCORE Label - Horizontal Left to Right */}
        <text
          x="50"
          y="57"
          textAnchor="middle"
          dominantBaseline="central"
          className={isDark ? "fill-white/60" : "fill-slate-500"}
          fontSize="5"
          fontWeight="800"
          letterSpacing="1"
        >
          SCORE
        </text>
      </svg>
    </>
  );
}

export function ModernPieChart({ isDark = true }: { isDark?: boolean }) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  const segments = [
    { label: "APKs", percent: "50%", color: "#00E5D1", desc: "Fast CDN", dash: "100.5 201.1", offset: 0 },
    { label: "Videos", percent: "30%", color: "#7D52FD", desc: "Tutorials", dash: "60.3 201.1", offset: -100.5 },
    { label: "Reviews", percent: "20%", color: "#16CF83", desc: "Ratings", dash: "40.2 201.1", offset: -160.8 },
  ];

  return (
    <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end">
      {/* Donut Pie Chart SVG */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
        {/* Glow backdrop on active slice */}
        <div 
          className="absolute inset-0 rounded-full filter blur-md transition-all duration-300 opacity-40 pointer-events-none"
          style={{
            background: activeSegment !== null ? segments[activeSegment].color : "transparent"
          }}
        />

        <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 100 100">
          <defs>
            <filter id="pieGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Slices group rotated -90deg so segments start at top 12 o'clock */}
          <g transform="rotate(-90 50 50)">
            {/* Background Track */}
            <circle cx="50" cy="50" r="38.2" fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} strokeWidth="4" />
            
            {/* Segment 1: APKs 50% */}
            <circle
              cx="50"
              cy="50"
              r="38.2"
              fill="none"
              stroke="#00E5D1"
              strokeWidth={activeSegment === 0 ? "6" : "4"}
              strokeDasharray="118 240"
              strokeDashoffset="0"
              filter={activeSegment === 0 ? "url(#pieGlowFilter)" : undefined}
              className="transition-all duration-300 cursor-pointer origin-center hover:drop-shadow-[0_0_12px_rgba(0,229,209,0.8)]"
              onMouseEnter={() => setActiveSegment(0)}
              onMouseLeave={() => setActiveSegment(null)}
            />
            {/* Segment 2: Videos 30% */}
            <circle
              cx="50"
              cy="50"
              r="38.2"
              fill="none"
              stroke="#7D52FD"
              strokeWidth={activeSegment === 1 ? "6" : "4"}
              strokeDasharray="70 240"
              strokeDashoffset="-120"
              filter={activeSegment === 1 ? "url(#pieGlowFilter)" : undefined}
              className="transition-all duration-300 cursor-pointer origin-center hover:drop-shadow-[0_0_12px_rgba(125,82,253,0.8)]"
              onMouseEnter={() => setActiveSegment(1)}
              onMouseLeave={() => setActiveSegment(null)}
            />
            {/* Segment 3: Reviews 20% */}
            <circle
              cx="50"
              cy="50"
              r="38.2"
              fill="none"
              stroke="#16CF83"
              strokeWidth={activeSegment === 2 ? "6" : "4"}
              strokeDasharray="46 240"
              strokeDashoffset="-192"
              filter={activeSegment === 2 ? "url(#pieGlowFilter)" : undefined}
              className="transition-all duration-300 cursor-pointer origin-center hover:drop-shadow-[0_0_12px_rgba(22,207,131,0.8)]"
              onMouseEnter={() => setActiveSegment(2)}
              onMouseLeave={() => setActiveSegment(null)}
            />
          </g>
          {/* Center Text Area */}
          <text
            x="50"
            y="47"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="900"
            className={`font-mono ${isDark ? "fill-white" : "fill-slate-900"} transition-all duration-300`}
          >
            {activeSegment !== null ? segments[activeSegment].percent : "100%"}
          </text>
          <text
            x="50"
            y="57"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="4.5"
            fontWeight="800"
            letterSpacing="0.5"
            className={`${isDark ? "fill-white/60" : "fill-slate-500"} transition-all duration-300`}
          >
            {activeSegment !== null ? segments[activeSegment].label : "HUB DATA"}
          </text>
        </svg>
      </div>

      {/* Legend & Breakdown Pills */}
      <div className="flex flex-col gap-1 min-w-[110px]">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setActiveSegment(idx)}
            onMouseLeave={() => setActiveSegment(null)}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg transition-all cursor-pointer border ${
              activeSegment === idx
                ? isDark
                  ? "bg-white/10 border-white/20 scale-105"
                  : "bg-slate-200 border-slate-300 scale-105"
                : isDark
                ? "bg-white/5 border-transparent hover:bg-white/10"
                : "bg-slate-100/80 border-transparent hover:bg-slate-200/80"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
              <span className={`text-[10px] font-bold ${isDark ? "text-white/90" : "text-slate-800"}`}>{seg.label}</span>
            </div>
            <span className="text-[10px] font-mono font-extrabold" style={{ color: seg.color }}>{seg.percent}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getInitialHeroLogo() {
  try {
    const cached = localStorage.getItem("cached_json_settings") || localStorage.getItem("cached_logo_settings");
    if (cached) {
      const data = JSON.parse(cached);
      return {
        logoUrl: data.headerLogoUrl || data.logoUrl || "/website-logo.png",
        heroLogoSize: data.heroLogoSize !== undefined ? Number(data.heroLogoSize) : 40,
        heroLogoPaddingTop: data.heroLogoPaddingTop !== undefined ? Number(data.heroLogoPaddingTop) : 0
      };
    }
  } catch (e) {}
  return { logoUrl: "/website-logo.png", heroLogoSize: 40, heroLogoPaddingTop: 0 };
}

export function HeroMockPanel({ isDark }: { isDark: boolean }) {
  const initialHeroLogo = getInitialHeroLogo();
  const [logoUrl, setLogoUrl] = useState<string>(initialHeroLogo.logoUrl);
  const [heroLogoSize, setHeroLogoSize] = useState<number>(initialHeroLogo.heroLogoSize);
  const [heroLogoPaddingTop, setHeroLogoPaddingTop] = useState<number>(initialHeroLogo.heroLogoPaddingTop);
  const [footerYoutube, setFooterYoutube] = useState<string>("https://youtube.com");
  const [footerTelegram, setFooterTelegram] = useState<string>("https://t.me");
  const [footerWhatsapp, setFooterWhatsapp] = useState<string>("https://wa.me");

  useEffect(() => {
    const loadLogo = async () => {
      const data = await dataCache.getData<any>("settings", {});
      if (data?.headerLogoUrl || data?.logoUrl) {
        setLogoUrl(data.headerLogoUrl || data.logoUrl);
      }
      if (data?.heroLogoSize !== undefined) {
        setHeroLogoSize(data.heroLogoSize);
      }
      if (data?.heroLogoPaddingTop !== undefined) {
        setHeroLogoPaddingTop(data.heroLogoPaddingTop);
      }
      if (data?.footerYoutube) setFooterYoutube(data.footerYoutube);
      if (data?.footerTelegram) setFooterTelegram(data.footerTelegram);
      if (data?.footerWhatsapp) setFooterWhatsapp(data.footerWhatsapp);
    };

    loadLogo();
    const unsub = dataCache.subscribe("settings", (data) => {
      if (data?.headerLogoUrl || data?.logoUrl) {
        setLogoUrl(data.headerLogoUrl || data.logoUrl);
      }
      if (data?.heroLogoSize !== undefined) {
        setHeroLogoSize(data.heroLogoSize);
      }
      if (data?.heroLogoPaddingTop !== undefined) {
        setHeroLogoPaddingTop(data.heroLogoPaddingTop);
      }
      if (data?.footerYoutube) setFooterYoutube(data.footerYoutube);
      if (data?.footerTelegram) setFooterTelegram(data.footerTelegram);
      if (data?.footerWhatsapp) setFooterWhatsapp(data.footerWhatsapp);
    });
    return () => unsub();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full rounded-3xl">
      {/* Radiant ambient glow layers */}
      <div className="absolute -top-[100px] -left-[80px] w-[450px] h-[350px] bg-gradient-to-br from-[#7D52FD]/35 via-[#00E5D1]/20 to-transparent filter blur-[60px] pointer-events-none z-20 rounded-full" />
      <div className="absolute -top-[50px] right-[40px] w-[320px] h-[220px] bg-[#16CF83]/20 filter blur-[55px] pointer-events-none z-20 rounded-full" />

      {!isDark && (
        <div className="absolute -top-[120px] -left-[100px] w-[500px] h-[550px] bg-gradient-to-br from-[#ffffff]/60 via-[#c4b5fd]/30 to-transparent filter blur-[50px] pointer-events-none z-30 transform -rotate-[35deg] rounded-full mix-blend-screen opacity-100 transition-opacity duration-700" />
      )}

      {/* Liquid animated top border line */}
      <div className="absolute -inset-[2px] pointer-events-none z-0 rounded-[26px] overflow-hidden">
        <div className="absolute top-0 -left-[20%] w-[140%] h-[150px] bg-gradient-to-b from-transparent via-[#00E5D1]/40 to-transparent filter blur-[12px] animate-liquid-waterfall mix-blend-screen opacity-100 transition-opacity duration-700" />
      </div>

      <div className="w-full rounded-[32px] p-2 sm:p-3 relative flex flex-col md:flex-row gap-4 z-10 transition-all duration-700 bg-transparent">
        
        {/* Left Column: Sidebar & Hub Navigation with Header Logo - Floating Glass Card */}
        <div 
          className="w-full md:w-64 shrink-0 flex flex-col gap-4 relative z-10 p-5 rounded-3xl backdrop-blur-3xl transition-all duration-700 shadow-2xl border"
          style={{
            background: isDark ? "linear-gradient(145deg, rgba(30, 22, 48, 0.9), rgba(15, 10, 25, 0.95))" : "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)" : "0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)"
          }}
        >
          
          {/* Header Logo inside the box */}
          <div className={`flex items-center gap-2.5 px-1 pb-1 border-b ${isDark ? "border-white/10" : "border-slate-200"}`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="MODX LAB Logo"
                className="max-w-[150px] object-contain filter drop-shadow-[0_2px_8px_rgba(0,229,209,0.4)]"
                style={{ height: `${heroLogoSize || 40}px`, paddingTop: `${heroLogoPaddingTop ?? 0}px` }}
              />
            ) : (
              <div className="flex flex-col">
                <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-black text-lg tracking-tight flex items-center gap-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  ModX Lab
                  <span className="w-3.5 h-3.5 rounded-full bg-[#16CF83]/20 flex items-center justify-center text-[#16CF83]">
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Navigation Items */}
          <div className="flex flex-col gap-1.5">
            {/* Active Item: Home */}
            <button
              onClick={() => scrollToSection("hero")}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2.5 bg-[#16CF83]/15 border border-[#16CF83]/40 text-left transition-all shadow-[0_0_12px_rgba(22,207,131,0.2)] ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <div className="w-5 h-5 rounded-lg bg-[#16CF83]/20 flex items-center justify-center text-[#16CF83] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span>Home</span>
            </button>

            <button
              onClick={() => scrollToSection("download-section")}
              className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-2.5 text-left transition-colors ${
                isDark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-900/10 hover:text-slate-900"
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${isDark ? "text-white/60" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>APK Downloads</span>
            </button>

            <button
              onClick={() => scrollToSection("video-section")}
              className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-2.5 text-left transition-colors ${
                isDark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-900/10 hover:text-slate-900"
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${isDark ? "text-white/60" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tutorial Videos</span>
            </button>

            <button
              onClick={() => scrollToSection("faq-section")}
              className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-2.5 text-left transition-colors ${
                isDark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-900/10 hover:text-slate-900"
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${isDark ? "text-white/60" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Community Q&A</span>
            </button>

            <button
              onClick={() => scrollToSection("reviews-section")}
              className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-2.5 text-left transition-colors ${
                isDark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-900/10 hover:text-slate-900"
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${isDark ? "text-white/60" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Reviews & Support</span>
            </button>
          </div>

          {/* Anti-Ban Status Box */}
          <div className={`mt-auto p-2.5 rounded-xl border ${
            isDark ? "bg-gradient-to-br from-[#16CF83]/15 via-transparent to-[#7D52FD]/10 border-[#16CF83]/25" : "bg-gradient-to-br from-[#16CF83]/10 via-slate-50 to-[#7D52FD]/10 border-[#16CF83]/30"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-white/70" : "text-slate-600"}`}>
                <svg className="w-3 h-3 text-[#16CF83]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Anti-Ban Status
              </span>
              <span className="text-[9px] font-bold text-[#16CF83] bg-[#16CF83]/20 px-1.5 py-0.5 rounded border border-[#16CF83]/30">ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16CF83] shadow-[0_0_8px_rgba(22,207,131,0.9)] animate-pulse" />
              <span className={`text-[11px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>100% Safe & Undetected</span>
            </div>
          </div>

          {/* Social Icons row */}
          <div className="flex items-center gap-2 pt-1">
            <a href={footerYoutube} target="_blank" rel="noreferrer" className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
              isDark ? "bg-white/5 hover:bg-white/15 border-white/10 text-white/70 hover:text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
            }`}>
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </a>
            <a href={footerTelegram} target="_blank" rel="noreferrer" className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
              isDark ? "bg-white/5 hover:bg-white/15 border-white/10 text-white/70 hover:text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
            }`}>
              <svg className="w-3.5 h-3.5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <a href={footerWhatsapp} target="_blank" rel="noreferrer" className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
              isDark ? "bg-white/5 hover:bg-white/15 border-white/10 text-white/70 hover:text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
            }`}>
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Right Column: Premium Content Showcase Grid */}
        <div 
          className="flex-1 flex flex-col gap-4 relative z-10 p-5 sm:p-6 rounded-3xl backdrop-blur-3xl transition-all duration-700 shadow-2xl border"
          style={{
            background: isDark ? "linear-gradient(145deg, rgba(30, 22, 48, 0.9), rgba(15, 10, 25, 0.95))" : "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)" : "0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)"
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                <span>ModX Lab Hub</span>
                <span className="text-[10px] font-bold text-[#00E5D1] bg-[#00E5D1]/15 px-2 py-0.5 rounded-full border border-[#00E5D1]/30">v4.5</span>
              </h2>
              <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-600"}`}>Official Mods, High-Speed CDN & YouTube Tutorials.</p>
            </div>
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono text-[#16CF83] ${
              isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#16CF83] animate-ping" />
              <span>Direct Server Online</span>
            </div>
          </div>

          {/* 2x2 Premium Content Cards Grid linked to Website Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Feature Card 1: APK Downloads */}
            <div
              onClick={() => scrollToSection("download-section")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                isDark
                  ? "bg-white/[0.04] border-[#00E5D1]/30 hover:bg-white/[0.08] hover:border-[#00E5D1]/70"
                  : "bg-white border-[#00E5D1]/40 hover:border-[#00E5D1] shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#00E5D1]/15 border border-[#00E5D1]/30 flex items-center justify-center text-[#00E5D1] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#00E5D1]/20 text-[#00E5D1] border border-[#00E5D1]/30">
                  DOWNLOAD SECTION
                </span>
              </div>
              <div>
                <h4 className={`font-bold text-sm font-['Plus_Jakarta_Sans',sans-serif] ${isDark ? "text-white" : "text-slate-900"}`}>APK Downloads</h4>
                <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? "text-white/60" : "text-slate-600"}`}>Direct high-speed APK files</p>
              </div>
            </div>

            {/* Feature Card 2: User Reviews & Feedback */}
            <div
              onClick={() => scrollToSection("reviews-section")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                isDark
                  ? "bg-white/[0.04] border-[#a78bfa]/30 hover:bg-white/[0.08] hover:border-[#a78bfa]/70"
                  : "bg-white border-[#a78bfa]/40 hover:border-[#7D52FD] shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#a78bfa]/15 border border-[#a78bfa]/30 flex items-center justify-center text-[#a78bfa] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/30">
                  REVIEWS
                </span>
              </div>
              <div>
                <h4 className={`font-bold text-sm font-['Plus_Jakarta_Sans',sans-serif] ${isDark ? "text-white" : "text-slate-900"}`}>User Reviews</h4>
                <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? "text-white/60" : "text-slate-600"}`}>Community ratings & feedback</p>
              </div>
            </div>

            {/* Feature Card 3: Features & Anti-Ban */}
            <div
              onClick={() => scrollToSection("features")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                isDark
                  ? "bg-white/[0.04] border-[#16CF83]/30 hover:bg-white/[0.08] hover:border-[#16CF83]/70"
                  : "bg-white border-[#16CF83]/40 hover:border-[#16CF83] shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#16CF83]/15 border border-[#16CF83]/30 flex items-center justify-center text-[#16CF83] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#16CF83]/20 text-[#16CF83] border border-[#16CF83]/30">
                  SECURITY
                </span>
              </div>
              <div>
                <h4 className={`font-bold text-sm font-['Plus_Jakarta_Sans',sans-serif] ${isDark ? "text-white" : "text-slate-900"}`}>Anti-Ban</h4>
                <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? "text-white/60" : "text-slate-600"}`}>Anti-ban protection & tools</p>
              </div>
            </div>

            {/* Feature Card 4: FAQ & Questions */}
            <div
              onClick={() => scrollToSection("faq-section")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                isDark
                  ? "bg-white/[0.04] border-[#FFB11A]/30 hover:bg-white/[0.08] hover:border-[#FFB11A]/70"
                  : "bg-white border-[#FFB11A]/40 hover:border-[#FFB11A] shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#FFB11A]/15 border border-[#FFB11A]/30 flex items-center justify-center text-[#FFB11A] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFB11A]/20 text-[#FFB11A] border border-[#FFB11A]/30">
                  QUESTIONS
                </span>
              </div>
              <div>
                <h4 className={`font-bold text-sm font-['Plus_Jakarta_Sans',sans-serif] ${isDark ? "text-white" : "text-slate-900"}`}>Community Q&A</h4>
                <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? "text-white/60" : "text-slate-600"}`}>Ask questions & get answers</p>
              </div>
            </div>
          </div>

          {/* Performance Ring Gauge & Modern Donut / Pie Chart Panel */}
          <div className={`mt-2 w-full rounded-2xl border p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md ${
            isDark
              ? "bg-gradient-to-r from-white/[0.06] via-white/[0.04] to-white/[0.06] border-white/15"
              : "bg-gradient-to-r from-slate-900/5 via-slate-900/[0.02] to-slate-900/5 border-slate-200"
          }`}>
            {/* Left: Premium Ring Chart & Optimization Metrics */}
            <div className="flex items-center gap-3.5 shrink-0 w-full md:w-auto justify-between md:justify-start">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                <AnimatedRingChart isDark={isDark} />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs sm:text-sm font-black font-['Plus_Jakarta_Sans',sans-serif] ${isDark ? "text-white" : "text-slate-900"}`}>
                    ModX Optimization
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#16CF83]/20 text-[#16CF83] border border-[#16CF83]/30">
                    v4.5 PRO
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#16CF83] flex items-center gap-1">
                  <span className="text-xs">⚡</span>
                  99.8% System Performance
                </span>
                <span className={`text-[10px] font-medium ${isDark ? "text-white/60" : "text-slate-600"}`}>
                  Android Ready
                </span>
              </div>
            </div>

            <div className={`hidden md:block w-px h-12 shrink-0 mx-1 ${isDark ? "bg-white/15" : "bg-slate-300"}`} />

            {/* Right: Modern Pie / Donut Chart */}
            <ModernPieChart isDark={isDark} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default function HeroSection({ isDark, t }: { isDark: boolean; t: Theme }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const heroSectionRef = useRef<HTMLElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms for Hero Section - Fast, Smooth & GPU-Accelerated
  const yText = useTransform(scrollYProgress, [0, 1], [0, -35]);
  const opacityText = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  
  const yPanel = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const scalePanel = useTransform(scrollYProgress, [0, 1], [1, 0.97]);
  const opacityPanel = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0.6]);
  const rotateXPanel = useTransform(scrollYProgress, [0, 1], [0, 6]);
  
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const scaleGlow = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  useEffect(() => {
    if (!searchOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsInputFocused(false);
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setShowSuggestions(false);
        setIsInputFocused(false);
        searchInputRef.current?.blur();
      }
    };

    const handleScroll = () => {
      setSearchOpen(false);
      setShowSuggestions(false);
      setIsInputFocused(false);
      searchInputRef.current?.blur();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      const timer = requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [searchOpen]);

  const getInitialDownloadsIndex = () => {
    try {
      const cached = localStorage.getItem("cached_downloads");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.flatMap((d: any) => {
            const docId = d.id;
            const categoryLabel = (d.type || d.fileType || (d.category && d.category.length < 15 ? d.category : "App") || "App").trim();
            if (d.files && Array.isArray(d.files) && d.files.length > 0) {
              return d.files.map((f: any, fIdx: number) => ({
                title: f.title || d.title || "ModX Lab Download",
                desc: f.category || f.tags || d.category || d.tags || "Mod Panel · Android",
                category: f.category || categoryLabel,
                type: f.category || categoryLabel,
                id: `download-${docId}-${fIdx}`,
                targetId: `download-${docId}`
              }));
            }
            return [{
              title: d.title || "ModX Lab Download",
              desc: d.category || d.tags || "Mod Panel · Android",
              category: categoryLabel,
              type: categoryLabel,
              id: `download-${docId}`,
              targetId: `download-${docId}`
            }];
          });
        }
      }
    } catch (e) {}
    return [];
  };

  const [downloadsIndex, setDownloadsIndex] = useState<any[]>(getInitialDownloadsIndex);

  useEffect(() => {
    const processDownloads = (rawDocs: any[]) => {
      if (!Array.isArray(rawDocs)) return [];
      return rawDocs.flatMap((d: any) => {
        const docId = d.id;
        const categoryLabel = (d.type || d.fileType || (d.category && d.category.length < 15 ? d.category : "App") || "App").trim();
        if (d.files && Array.isArray(d.files) && d.files.length > 0) {
          return d.files.map((f: any, fIdx: number) => ({
            title: f.title || d.title || "ModX Lab Download",
            desc: f.category || f.tags || d.category || d.tags || "Free Fire Mod Panel · Android",
            category: f.category || categoryLabel,
            type: f.category || categoryLabel,
            id: `download-${docId}-${fIdx}`,
            targetId: `download-${docId}`
          }));
        }
        return [{
          title: d.title || "ModX Lab Download",
          desc: d.category || d.tags || "Free Fire Mod Panel · Android",
          category: categoryLabel,
          type: categoryLabel,
          id: `download-${docId}`,
          targetId: `download-${docId}`
        }];
      });
    };

    const loadDownloads = async () => {
      const rawDocs = await dataCache.getData<any[]>("downloads", []);
      setDownloadsIndex(processDownloads(rawDocs));
    };

    loadDownloads();
    const unsub = dataCache.subscribe("downloads", (rawDocs) => {
      setDownloadsIndex(processDownloads(rawDocs));
    });
    return () => unsub();
  }, []);

  const defaultDownloadItem = [
    {
      title: "ModX Lab APK",
      desc: "Mod Panel · Android",
      category: "App",
      type: "App",
      id: "download-default-1",
      targetId: "download"
    }
  ];

  const availableDownloads = downloadsIndex.length > 0 ? downloadsIndex : defaultDownloadItem;

  const filteredResults = searchVal.trim()
    ? availableDownloads.filter(
        (item) =>
          (item.title || "").toLowerCase().includes(searchVal.toLowerCase()) ||
          (item.desc || "").toLowerCase().includes(searchVal.toLowerCase())
      )
    : availableDownloads;

  const handleSearchAction = () => {
    if (!searchOpen) {
      setSearchOpen(true);
      setShowSuggestions(true);
      return;
    }

    if (!searchVal.trim()) {
      setSearchOpen(false);
      setShowSuggestions(false);
      setIsInputFocused(false);
      searchInputRef.current?.blur();
      return;
    }

    if (filteredResults.length > 0) {
      const targetId = filteredResults[0].targetId || filteredResults[0].id || "download";
      let target = document.getElementById(targetId) || document.getElementById("download");
      if (target) {
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(target, { offset: -70 });
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    setSearchOpen(false);
    setShowSuggestions(false);
    setIsInputFocused(false);
    searchInputRef.current?.blur();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSearchVal("");
  };

  const glowRef1 = useRef<HTMLDivElement>(null);
  const glowRef2 = useRef<HTMLDivElement>(null);
  const glowRef3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (glowRef1.current) {
        gsap.to(glowRef1.current, {
          x: 90,
          y: 45,
          scale: 1.2,
          rotation: 15,
          duration: 7,
          repeat: -1,
          yoyo: true,
          force3D: true,
          ease: "sine.inOut"
        });
      }
      if (glowRef2.current) {
        gsap.to(glowRef2.current, {
          x: -80,
          y: 60,
          scale: 1.25,
          rotation: -20,
          duration: 9,
          repeat: -1,
          yoyo: true,
          force3D: true,
          ease: "sine.inOut"
        });
      }
      if (glowRef3.current) {
        gsap.to(glowRef3.current, {
          scale: 1.3,
          y: -30,
          opacity: 0.25,
          duration: 6,
          repeat: -1,
          yoyo: true,
          force3D: true,
          ease: "sine.inOut"
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroSectionRef} id="hero" className="relative pt-28 md:pt-36 pb-20 overflow-hidden" style={{ background: t.bg, minHeight: "auto" }}>
      {/* Dynamic Floating Ambient Glow Orbs */}
      <motion.div
        style={{ y: yGlow, scale: scaleGlow, willChange: "transform" }}
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        {/* Glow Orb 1 - Violet/Purple */}
        <div
          ref={glowRef1}
          className={`absolute -top-20 -left-20 w-[480px] h-[480px] bg-gradient-to-tr from-[#6C38FF] via-[#7D52FD] to-[#00C2B2] filter blur-[90px] rounded-full transition-opacity duration-700 ${
            isDark ? "opacity-[0.25]" : "opacity-[0.35] mix-blend-multiply"
          }`}
          style={{ willChange: "transform, opacity" }}
        />

        {/* Glow Orb 2 - Cyan/Teal */}
        <div
          ref={glowRef2}
          className={`absolute top-10 -right-20 w-[450px] h-[450px] bg-gradient-to-br from-[#00C2B2] via-[#05B875] to-[#6C38FF] filter blur-[90px] rounded-full transition-opacity duration-700 ${
            isDark ? "opacity-[0.22]" : "opacity-[0.30] mix-blend-multiply"
          }`}
          style={{ willChange: "transform, opacity" }}
        />

        {/* Glow Orb 3 - Center Emerald Accent */}
        <div
          ref={glowRef3}
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[320px] bg-gradient-to-r from-[#6C38FF]/50 via-[#05B875]/40 to-[#00C2B2]/50 filter blur-[100px] rounded-full transition-opacity duration-700 ${
            isDark ? "opacity-[0.20]" : "opacity-[0.25] mix-blend-multiply"
          }`}
          style={{ willChange: "transform, opacity" }}
        />
      </motion.div>

      <div className={`relative w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-14 flex flex-col items-center gap-14 ${searchOpen ? "z-[250]" : "z-10"}`}>
        <motion.div
          style={{ y: yText, opacity: opacityText, willChange: "transform, opacity" }}
          className={`flex flex-col gap-8 text-center max-w-4xl items-center sm:px-12 relative ${searchOpen ? "z-[300]" : "z-10"}`}
        >
                    <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[24px] xs:text-[30px] sm:text-4xl lg:text-[56px] leading-[1.15] transition-colors duration-500 tracking-tight max-w-full flex flex-col md:flex-row items-center gap-4"
            style={{ color: t.text, fontVariationSettings: '"opsz" 14, "wdth" 100' }}
          >
            <span>Welcome to</span>
            <span className="relative inline-block transition-all duration-500 whitespace-nowrap">
              <TypewriterGradientText text="ModX Lab 👋" delay={50} speed={30} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Plus_Jakarta_Sans',sans-serif] text-[16px] sm:text-[19px] lg:text-[21px] leading-relaxed transition-colors duration-500 max-w-2xl text-center"
            style={{ color: t.subtext }}
          >
            The official website of the ModX Lab YouTube Channel. Access our exclusive video tutorial resources, premium apps, and files. Join our community to ask questions, explore features, and share your valuable reviews!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center gap-4 justify-center flex-wrap mt-2 relative ${searchOpen ? "z-[110]" : "z-30"}`}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const target = document.getElementById("footer");
                if (target) {
                  if ((window as any).lenis) {
                    (window as any).lenis.scrollTo(target, { offset: -70 });
                  } else {
                    target.scrollIntoView({ behavior: "smooth" });
                  }
                }
              }}
              className="px-8 py-4 rounded-full font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-white text-lg capitalize transition-all hover:brightness-110 cursor-pointer shadow-xl active:scale-95"
              style={{ background: "#7D52FD", boxShadow: "0 8px 25px -4px rgba(125,82,253,0.5), inset 0 2px 4px rgba(255,255,255,0.2)", color: "white" }}
            >
              Contact me
            </motion.button>

            {/* Ultra-Premium Glassmorphic Search Bar */}
            <div ref={searchContainerRef} className={`flex items-center gap-2 h-14 relative ${searchOpen ? "z-[120]" : "z-50"}`}>
              <div
                className={`transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] h-full flex items-center overflow-hidden rounded-full ${
                  searchOpen ? "w-60 sm:w-80 opacity-100 pr-1" : "w-0 opacity-0"
                }`}
              >
                <div className="relative w-full h-full flex items-center">
                  <input
                    ref={searchInputRef}
                    value={searchVal}
                    onChange={(e) => {
                      setSearchVal(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onClick={() => setShowSuggestions(true)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchOpen(false);
                        setShowSuggestions(false);
                        setIsInputFocused(false);
                      }
                      if (e.key === "Enter") handleSearchAction();
                    }}
                    placeholder="Search features or cheats..."
                    className="w-full h-full rounded-full pl-5 pr-10 text-[16px] outline-none transition-all duration-300 font-['Plus_Jakarta_Sans',sans-serif]"
                    style={{
                      fontSize: "16px",
                      background: isDark ? "rgba(22,20,32,0.85)" : "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: `1.5px solid ${isInputFocused ? "#7D52FD" : t.cardBorder}`,
                      color: t.text,
                      boxShadow: isInputFocused
                        ? "0 0 25px rgba(125,82,253,0.45), inset 0 1px 2px rgba(255,255,255,0.15)"
                        : "0 8px 25px rgba(0,0,0,0.15)",
                    }}
                  />
                  {searchVal && (
                    <button
                      onClick={() => {
                        setSearchVal("");
                        setShowSuggestions(false);
                        searchInputRef.current?.blur();
                      }}
                      className="absolute right-3.5 text-xs p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ color: t.text }}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleSearchAction}
                className="shrink-0 w-14 h-14 flex items-center justify-center rounded-full backdrop-blur-xl transition-all cursor-pointer relative"
                style={{
                  background: searchOpen
                    ? "linear-gradient(135deg, #7D52FD, #00E5D1)"
                    : isDark
                    ? "linear-gradient(135deg, rgba(125,82,253,0.25), rgba(255,255,255,0.08))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,240,250,0.8))",
                  border: `1.5px solid ${searchOpen ? "#00E5D1" : t.cardBorder}`,
                  boxShadow: searchOpen
                    ? "0 0 30px rgba(125,82,253,0.6)"
                    : "0 8px 20px rgba(0,0,0,0.15)",
                }}
                aria-label="Search"
              >
                <svg className="w-6 h-6 transition-transform duration-300" fill="none" viewBox="0 0 15 15">
                  <path d={svgPaths.p3e9cf280} fill={searchOpen || isDark ? "white" : "#151022"} />
                </svg>
              </motion.button>

              {/* Suggestions / Results Dropdown */}
              {searchOpen && showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-[68px] right-0 w-80 sm:w-96 md:w-[420px] rounded-2xl p-3 z-[999] backdrop-blur-2xl transition-colors duration-300 shadow-2xl overflow-hidden"
                  style={{
                    background: isDark ? "rgba(18,16,26,0.96)" : "rgba(255,255,255,0.98)",
                    border: `1.5px solid ${isDark ? "rgba(125,82,253,0.35)" : "rgba(125,82,253,0.25)"}`,
                    boxShadow: isDark
                      ? "0 20px 50px -10px rgba(0,0,0,0.85), 0 0 25px rgba(125,82,253,0.25)"
                      : "0 20px 50px -10px rgba(125,82,253,0.25), 0 0 20px rgba(0,194,178,0.2)",
                  }}
                >
                  {filteredResults.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                      {filteredResults.map((item, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group border"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                            color: t.text
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            searchInputRef.current?.blur();
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur();
                            }
                            const targetId = item.targetId || item.id || "download";
                            let target = document.getElementById(targetId) || document.getElementById("download");
                            if (target) {
                              if ((window as any).lenis) {
                                (window as any).lenis.scrollTo(target, { offset: -70 });
                              } else {
                                target.scrollIntoView({ behavior: "smooth" });
                              }
                            }
                            setSearchOpen(false);
                            setShowSuggestions(false);
                            setIsInputFocused(false);
                            setSearchVal("");
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? "rgba(22,207,131,0.15)" : "rgba(22,207,131,0.1)";
                            e.currentTarget.style.borderColor = "rgba(22,207,131,0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
                            e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-[#16CF83]/20 flex items-center justify-center shrink-0 text-[#16CF83]">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <span className="font-bold text-sm truncate group-hover:text-[#16CF83] transition-colors" style={{ color: t.text }}>
                                {item.title}
                              </span>
                              <span className="text-xs font-medium truncate opacity-75" style={{ color: t.subtext }}>
                                {item.desc}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-[#16CF83]/20 text-[#16CF83] border border-[#16CF83]/30 shrink-0">
                            {item.category || item.type || "App"}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: t.subtext }}>
                      <span>🔍</span>
                      <span>No items match "{searchVal}"</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Mock Panel - Placed cleanly underneath with GPU acceleration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ y: yPanel, scale: scalePanel, opacity: opacityPanel, rotateX: rotateXPanel, transformPerspective: 1200, z: 0, willChange: "transform, opacity" }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[890px] z-10 relative mt-4"
        >
          <HeroMockPanel isDark={isDark} />
        </motion.div>
      </div>
    </section>
  );
}
