import { useState } from "react";
import { motion } from "motion/react";
import svgPaths from "../imports/Desktop/svg-rb00s3u9xu";
import { Theme } from "../types";

const holoPaths = [svgPaths.p217f8ec0, svgPaths.p3a837700, svgPaths.p17b36900, svgPaths.p36cb1f80, svgPaths.p3a356a80];

const featuresData = [
  { color: "#16CF83", shadow: "rgba(22,207,131,.35)",  label: "Anti-Ban",        desc: "Advanced protection system to keep your account safe",   viewBox: "55.8 45.5 28.4 35", paths: [svgPaths.p9056c00] },
  { color: "#A65FED", shadow: "rgba(166,95,237,.35)",  label: "ESP Radar",       desc: "Real-time enemy position tracking on minimap",           viewBox: "45.2 45.5 49.5 35", paths: [svgPaths.p34658080] },
  { color: "#FFB11A", shadow: "rgba(255,177,26,.35)",  label: "Auto Aim",        desc: "Smart auto-aim assist for faster eliminations",          viewBox: "60.3 45.5 19.5 35", paths: [svgPaths.p1a290900] },
  { color: "#00E5D1", shadow: "rgba(0,229,209,.35)",   label: "Speed Boost",     desc: "Enhanced movement speed for tactical advantage",         viewBox: "53 42 34 42",       paths: [svgPaths.p2627a300] },
  { color: "#EB29A4", shadow: "rgba(235,41,164,.35)",  label: "Aim Lock",        desc: "Lock onto targets with precision accuracy",             viewBox: "0 0 42 42",         paths: holoPaths },
  { color: "#2790FF", shadow: "rgba(39,144,255,.35)",  label: "Color Holograms", desc: "Multiple hologram colors to suit your style.",          viewBox: "0 0 42 42",         paths: holoPaths },
];

function FeatureCard({ f, t, index }: { f: (typeof featuresData)[0]; t: Theme; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col h-[180px] sm:h-[205px] items-start px-3.5 sm:px-5 py-5 sm:py-8 rounded-2xl cursor-pointer select-none overflow-hidden z-10"
      style={{
        background:   t.cardBg,
        border:       `1px solid ${hovered ? f.color : t.cardBorder}`,
        boxShadow:    hovered ? `0 12px 40px -8px ${f.shadow}, 0 0 0 1px ${f.color}33` : "0 4px 20px rgba(0,0,0,0.15)",
        willChange: "transform, opacity",
        z: 0
      }}
    >
      <div
        className="w-[52px] h-[42px] sm:w-[72px] sm:h-[58px] rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 shrink-0 relative z-10"
        style={{
          background:  f.color,
          boxShadow:   hovered ? `0 0 28px 12px ${f.shadow}` : `0 0 18px 8px ${f.shadow}`,
          transform:   hovered ? "scale(1.12) rotate(-4deg)" : "scale(1) rotate(0deg)",
          transition:  "all 0.3s ease",
        }}
      >
        <svg className="w-6 h-6 sm:w-9 sm:h-9" fill="none" viewBox={f.viewBox}>
          {f.paths.map((p, i) => <path key={i} d={p} fill="#151022" />)}
        </svg>
      </div>

      <p
        className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm sm:text-[22px] leading-tight transition-colors duration-200 relative z-10"
        style={{ color: hovered ? f.color : t.text }}
      >
        {f.label}
      </p>
      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] sm:text-[14px] leading-tight sm:leading-6 mt-1 tracking-wide transition-colors duration-500 relative z-10 line-clamp-2" style={{ color: t.subtext }}>
        {f.desc}
      </p>

      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 z-0"
        style={{ background: `radial-gradient(circle at 70% 30%, ${f.color}18, transparent 70%)`, opacity: hovered ? 1 : 0 }}
      />
    </motion.div>
  );
}

export default function FeaturesSection({ isDark, t }: { isDark: boolean; t: Theme }) {
  return (
    <section id="features" className="relative py-16 sm:py-20 px-3 sm:px-8 lg:px-14 max-w-7xl mx-auto">
      <div
        className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-5xl h-20 rounded-full filter blur-[45px] pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: "linear-gradient(90deg, rgba(0, 136, 255, 0.45) 0%, rgba(123, 44, 191, 0.4) 35%, rgba(0, 229, 209, 0.45) 70%, rgba(255, 0, 128, 0.3) 100%)",
          opacity: isDark ? 0.35 : 0.55
        }}
      />

      <div className="text-center mb-10 relative z-10">
        <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight" style={{ color: t.text }}>Premium Features</h2>
        <p className="text-sm font-semibold max-w-xl mx-auto" style={{ color: t.subtext }}>Everything you need to dominate the game.</p>
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-3.5 sm:gap-7">
        {featuresData.map((f, i) => <FeatureCard key={i} f={f} t={t} index={i} />)}
      </div>
    </section>
  );
}
