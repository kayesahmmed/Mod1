import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Theme } from "../types";
import { dataCache } from "../lib/dataCache";

const getInitialDownloads = () => {
  try {
    const cached = localStorage.getItem("cached_downloads");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

export default function DownloadSection({ t, isDark }: { t: Theme; isDark?: boolean }) {
  const [downloads, setDownloads] = useState<any[]>(getInitialDownloads);
  const [openHowToUseMap, setOpenHowToUseMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadDownloads = async () => {
      const fetched = await dataCache.getData<any[]>("downloads", []);
      if (Array.isArray(fetched) && fetched.length > 0) {
        setDownloads(fetched);
      }
    };

    loadDownloads();
    const unsub = dataCache.subscribe("downloads", (fetched) => {
      if (Array.isArray(fetched) && fetched.length > 0) {
        setDownloads(fetched);
      }
    });
    return () => unsub();
  }, []);

  const toggleHowToUse = (id: string) => {
    setOpenHowToUseMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const defaultDownload = {
    id: "default-1",
    boxDate: "12 August 2026",
    files: [{
      title: "ModX Lab",
      category: "Free Fire Mod Panel · Android",
      tags: "Free Fire, Free Fire Max, Android 7+, Anti-Ban, All Devices",
      imageUrl: "",
      buttonText: "Download Free APK",
      downloadLink: "https://t.me/kayesahmmedpro"
    }],
    howToUseTitle: "How to Use",
    howToUse: "Step 1: Download Shizuku\nInstall the official Shizuku app directly from Google Play Store.\nStep 2: Start Shizuku Service\nSetup & start Shizuku via Wireless Debugging or ADB mode.\nStep 3: Open Mod Panel\nOpen ModX Lab, sign in, and activate your panel.\nStep 4: Launch & Enjoy\nLaunch Free Fire / FF Max and enjoy safe anti-ban features.",
    youtubeTitle: "Video Tutorial",
    youtubeLinks: ["https://www.youtube.com/watch?v=C4LMW4iIVgA"]
  };

  const displayDownloads = downloads.length > 0 ? downloads : [defaultDownload];

  return (
    <section id="download" className="relative py-16 sm:py-20 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-6 w-full"
        style={{ willChange: "transform, opacity", z: 0 }}
      >
        <div className="text-center mb-6 px-4 sm:px-8 lg:px-14 relative z-10 w-full max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight" style={{ color: t.text }}>Download</h2>
          <p className="text-sm font-semibold max-w-xl mx-auto" style={{ color: t.subtext }}>Get the latest updates and mod files.</p>
        </div>
        {displayDownloads.map((dl, idx) => {
          const isHowToUseOpen = openHowToUseMap[dl.id] || false;
          
          const files = (dl.files && dl.files.length > 0) ? dl.files : [{ title: dl.title, category: dl.category, tags: dl.tags, imageUrl: dl.imageUrl, buttonText: dl.buttonText, downloadLink: dl.downloadLink }];
          const ytLinks = (dl.youtubeLinks && dl.youtubeLinks.length > 0) ? dl.youtubeLinks : (dl.youtubeLink ? [dl.youtubeLink] : []);
          
          const howToUseSteps = dl.howToUse ? dl.howToUse.split('\n').filter((l: string) => l.trim() !== '') : [];
          const downloadFiles = files.filter((f: any) => f.downloadLink && f.downloadLink.trim() !== "");
          return (            <motion.div
              key={dl.id}
              id={`download-${dl.id}`}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10 flex flex-col gap-6 relative overflow-hidden rounded-3xl border shadow-2xl mb-8 backdrop-blur-xl"
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.85)",
                borderColor: isDark ? "rgba(22, 207, 131, 0.3)" : "rgba(22, 207, 131, 0.25)",
                boxShadow: isDark
                  ? "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 30px rgba(22, 207, 131, 0.08)"
                  : "0 20px 50px rgba(22, 207, 131, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
              }}
            >
              {/* Radial glow background accents */}
              <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none rounded-full filter blur-3xl opacity-20" style={{ background: "radial-gradient(circle, rgba(22,207,131,0.6) 0%, transparent 70%)" }} />
              <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none rounded-full filter blur-3xl opacity-15" style={{ background: "radial-gradient(circle, rgba(123,44,191,0.5) 0%, transparent 70%)" }} />

              <div className="relative z-10 flex flex-col gap-6">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#16CF83]/15 text-[#16CF83] border border-[#16CF83]/30">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      VERIFIED RELEASE
                    </span>
                  </div>

                  {dl.boxDate && (
                    <div className="flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide" style={{ background: "rgba(22,207,131,0.12)", color: "#16CF83", border: "1px solid rgba(22,207,131,0.3)" }}>
                      <span className="w-2 h-2 rounded-full bg-[#16CF83] animate-pulse" />
                      <span>{dl.boxDate}</span>
                    </div>
                  )}
                </div>

                <div className={`grid gap-5 ${files.length >= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {files.map((file: any, fIdx: number) => {
                    const tagsArray = file.tags ? file.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                    const downloadUrl = file.downloadLink || file.link || "#";
                    return (
                      <div 
                        key={fIdx} 
                        className="flex flex-col justify-between gap-4 p-5 rounded-2xl border transition-all duration-300 hover:border-[#16CF83]/50 shadow-md" 
                        style={{ 
                          background: isDark ? "rgba(0,0,0,0.3)" : "rgba(248, 250, 252, 0.8)", 
                          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" 
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-4">
                            {file.imageUrl ? (
                              <img src={file.imageUrl} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-[0_0_20px_rgba(22,207,131,0.25)] border border-[#16CF83]/30 shrink-0" alt="Icon" />
                            ) : (
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#16CF83] to-[#05B875] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(22,207,131,0.3)] border border-white/20">
                                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-lg sm:text-xl tracking-tight" style={{ color: t.text }}>{file.title || "Download File"}</h3>
                              <p className="text-xs sm:text-sm font-bold mt-0.5 text-[#16CF83]" style={{ opacity: 0.9 }}>{file.category || "APK / Mod"}</p>
                            </div>
                          </div>

                          {tagsArray.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {tagsArray.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all"
                                  style={{
                                    background: "rgba(22,207,131,0.12)",
                                    color: "#16CF83",
                                    border: "1px solid rgba(22,207,131,0.25)"
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Direct Download Button paired with this file */}
                        <motion.a
                          whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -4px rgba(22,207,131,.6)" }}
                          whileTap={{ scale: 0.98 }}
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative overflow-hidden group flex items-center justify-center gap-2.5 w-full py-3.5 px-5 rounded-xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-sm sm:text-base text-[#151022] transition-all cursor-pointer border border-white/20 mt-2"
                          style={{
                            background: "linear-gradient(135deg, #16CF83 0%, #05B875 100%)",
                            boxShadow: "0 8px 25px -5px rgba(22,207,131,.45)"
                          }}
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full ease-in-out" style={{ transitionDuration: "1s" }} />
                          <svg className="w-4.5 h-4.5 relative z-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="relative z-10 tracking-wide">{file.buttonText || "Download Free APK"}</span>
                        </motion.a>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-center mt-1" style={{ color: t.subtext }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#16CF83]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Fast Speed
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#16CF83]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Virus Tested
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#16CF83]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Anti-Ban Safe
                  </span>
                </div>

                {(howToUseSteps.length > 0 || ytLinks.length > 0) && (
                  <motion.div
                    className="mt-2"
                    initial={false}
                    animate={{ backgroundColor: isHowToUseOpen ? (isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)") : "transparent" }}
                    transition={{ duration: 0.3 }}
                    style={{ borderRadius: "20px" }}
                  >
                    <button
                      onClick={() => toggleHowToUse(dl.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl transition-all hover:bg-black/5 group cursor-pointer border shadow-transition duration-300"
                      style={{
                        borderColor: isHowToUseOpen ? "rgba(22,207,131,0.3)" : "rgba(22,207,131,0.15)",
                        background: isHowToUseOpen ? "rgba(22,207,131,0.05)" : "transparent"
                      }}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#16CF83] to-[#05B875] flex items-center justify-center shrink-0 shadow-lg shadow-[#16CF83]/20">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg" style={{ color: t.text }}>{dl.howToUseTitle || "How to Use"}</h3>
                          <p className="text-xs font-semibold mt-0.5 opacity-80" style={{ color: t.subtext }}>
                            Click here for step-by-step setup guide
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold hidden sm:inline transition-colors" style={{ color: isHowToUseOpen ? "#16CF83" : t.subtext }}>
                          {isHowToUseOpen ? "Close guide" : "Expand guide"}
                        </span>
                        <motion.div 
                          animate={{
                            rotate: isHowToUseOpen ? 180 : 0,
                            backgroundColor: isHowToUseOpen ? "#16CF83" : "rgba(22,207,131,0.15)",
                            color: isHowToUseOpen ? "#151022" : "#16CF83",
                            boxShadow: isHowToUseOpen ? "0 0 12px rgba(22,207,131,0.4)" : "0 0 0px transparent"
                          }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {isHowToUseOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div
                            className="mt-3 p-5 sm:p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden shadow-transition duration-300"
                            style={{
                              background: isDark ? "rgba(10, 15, 28, 0.6)" : "rgba(255, 255, 255, 0.7)",
                              border: isDark ? "1px solid rgba(22, 207, 131, 0.25)" : "1px solid rgba(22, 207, 131, 0.3)",
                              boxShadow: isDark ? "0 10px 30px -10px rgba(0,0,0,0.5)" : "0 10px 30px -10px rgba(22,207,131,0.1)"
                            }}
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#16CF83]/10 rounded-full filter blur-2xl pointer-events-none" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10">
                              {howToUseSteps.map((step: string, i: number) => {
                                const colors = ["#2790FF", "#A855F7", "#16CF83", "#FF5E7E", "#F59E0B"];
                                const color = colors[i % colors.length];
                                return (
                                  <div
                                    key={i}
                                    className="p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
                                    style={{
                                      background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)",
                                      border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)"
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className="font-mono font-black text-xs px-2 py-0.5 rounded-md"
                                        style={{ background: `${color}20`, color: color, border: `1px solid ${color}40` }}
                                      >
                                        STEP 0{i + 1}
                                      </span>
                                    </div>
                                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs leading-relaxed mt-1" style={{ color: t.subtext }}>
                                      {step}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {ytLinks.length > 0 && (
                              <div
                                className="mt-4 pt-5 border-t rounded-2xl shadow-transition duration-300"
                                style={{ borderColor: "rgba(22,207,131,0.2)" }}
                              >
                                <div className="flex items-center gap-3 mb-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-[#FF0000]/15 flex items-center justify-center shrink-0 text-[#FF0000] shadow-[0_0_12px_rgba(255,0,0,0.2)]">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base sm:text-lg" style={{ color: t.text }}>{dl.youtubeTitle || "Video Tutorial"}</h3>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider" style={{ background: "rgba(255,0,0,0.15)", color: "#FF4D4D", border: "1px solid rgba(255,0,0,0.3)" }}>
                                        YouTube Guide
                                      </span>
                                    </div>
                                    <p className="text-xs font-medium mt-0.5" style={{ color: t.subtext }}>
                                      Watch step-by-step setup video tutorials
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 mt-4">
                                  {ytLinks.map((linkData: any, lIdx: number) => {
                                    const ytUrl = typeof linkData === 'string' ? linkData : linkData.url;
                                    const ytTitle = typeof linkData === 'string' ? null : linkData.title;
                                    const ytId = getYouTubeId(ytUrl);
                                    if (!ytId) return null;
                                    return (
                                      <div key={lIdx} className="flex flex-col gap-2">
                                        {ytTitle && (
                                          <h4 className="font-semibold text-sm pl-1" style={{ color: t.text }}>{ytTitle}</h4>
                                        )}
                                        <div
                                          className="relative w-full rounded-2xl overflow-hidden shadow-2xl border shadow-transition duration-300"
                                          style={{
                                            aspectRatio: "16/9",
                                            background: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.05)",
                                            borderColor: isDark ? "rgba(22, 207, 131, 0.25)" : "rgba(22, 207, 131, 0.3)"
                                          }}
                                        >
                                          <iframe
                                            className="absolute top-0 left-0 w-full h-full rounded-2xl"
                                            src={`https://www.youtube.com/embed/${ytId}?rel=0&cc_load_policy=1`}
                                            title={`ModX Lab Video Tutorial ${lIdx + 1}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
