import { motion } from "motion/react";
import svgPaths from "../imports/Desktop/svg-rb00s3u9xu";
import { Theme } from "../types";

const marqueeItems = [
  "DRAG HEADSHOT",
  "COLOR HOLOGRAMS",
  "ANTI-BAN",
  "ESP RADAR",
  "AUTO AIM",
  "SPEED BOOST",
  "AIM LOCK",
  "FREE TO USE",
  "UNDETECTED",
  "INSTANT SETUP"
];

export function MarqueeBanner() {
  const quadrupled = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];
  return (
    <div className="overflow-hidden py-5 bg-[#7D52FD]/10 border-y border-[#7D52FD]/20 relative">
      <motion.div
        className="flex whitespace-nowrap gap-0"
        animate={{ x: ["0%", "-50%"] }}
        style={{ willChange: "transform" }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          duration: 22,
        }}
      >
        {quadrupled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 px-6 font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm sm:text-base tracking-widest uppercase text-[#9D86FF]">
            {item}<span className="text-[#00E5D1] text-xl">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const statsData = [
  { icon: <svg className="w-10 h-10" fill="none" viewBox="0 0 47.0588 40"><path clipRule="evenodd" d={svgPaths.pee67100} fill="#00E5D1" fillRule="evenodd" /></svg>, value: "10.5K+", label: "ACTIVE USERS" },
  { icon: <svg className="w-10 h-10" fill="none" viewBox="0 0 40 40"><path d={svgPaths.p25f88280} fill="#A65FED" /></svg>, value: "18.52K+", label: "TOTAL DOWNLOADS" },
  { icon: <svg className="w-10 h-10" fill="none" viewBox="0 0 41.8816 40"><path d={svgPaths.p1c15ee60} fill="#FFB11A" /></svg>, value: "4.9 ★", label: "RATING" },
  { icon: <svg className="w-10 h-10" fill="none" viewBox="0 0 32.4051 40"><path d={svgPaths.p1d073f0} fill="#16CF83" /></svg>, value: "99.9%", label: "UPTIME" },
];

export function StatsSection({ t }: { t: Theme }) {
  return (
    <section className="py-20 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {statsData.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.04, y: -4, boxShadow: "0 20px 40px -10px rgba(125, 82, 253, 0.25)" }}
            className="relative flex flex-col items-center gap-1 py-10 px-4 rounded-3xl cursor-default"
            style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, willChange: "transform, opacity" }}
          >
            {s.icon}
            <p className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl lg:text-[36px] text-center leading-normal mt-1 transition-colors duration-500" style={{ color: t.text }}>{s.value}</p>
            <p className="font-['Plus_Jakarta_Sans',sans-serif] font-medium text-[10px] sm:text-xs text-center tracking-[0.1em] transition-colors duration-500" style={{ color: t.subtext }}>{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
