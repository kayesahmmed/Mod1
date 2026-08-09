import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { User } from "firebase/auth";
import svgPaths from "../imports/Desktop/svg-rb00s3u9xu";
import { Theme } from "../types";
import { dataCache } from "../lib/dataCache";



function StarRow({ n, t }: { n: number; t: Theme }) {
  return (
    <div className="flex gap-1 relative">
      {[1, 2, 3, 4, 5].map((i) => {
        const isFull = i <= n;
        const isHalf = !isFull && (i - 0.5 <= n);
        const bgFill = t.cardBorder || "rgba(255,255,255,0.2)";
        return (
          <svg key={i} className="w-4 h-4" fill="none" viewBox="0 0 22.8254 19.8992">
            {isFull ? (
              <path d={svgPaths.p10f17200} fill="#FFB319" />
            ) : isHalf ? (
              <g>
                <path d={svgPaths.p10f17200} fill={bgFill} />
                <g style={{ clipPath: "inset(0 50% 0 0)" }}>
                  <path d={svgPaths.p10f17200} fill="#FFB319" />
                </g>
              </g>
            ) : (
              <path d={svgPaths.p10f17200} fill={bgFill} />
            )}
          </svg>
        );
      })}
    </div>
  );
}

function ReviewCard({ r, t, anim, isDark, minGlow }: { r: any; t: Theme; anim?: string; isDark?: boolean; minGlow?: boolean }) {
  if (!r) return null;
  const photo = r.photoUrl || r.photo;
  return (
    <div
      className={`${anim || ""} relative overflow-hidden shadow-transition duration-300 h-full flex flex-col justify-between select-none transform-gpu`}
      style={{
        background: t.reviewBg,
        borderRadius: "18px",
        padding: "16px 16px",
        border: `1px solid ${t.cardBorder}`,
        minWidth: 0,
        minHeight: "180px",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-16 rounded-full transition-colors duration-500 pointer-events-none ${minGlow ? 'blur-[50px] opacity-[0.02]' : (isDark ? 'blur-[35px] opacity-[0.05]' : 'blur-[35px] opacity-[0.15]')}`} style={{ background: r.initColor || "#7B2CBF" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {photo ? (
            <img
              src={photo}
              alt={r.name || "User Avatar"}
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-[52px] sm:h-[52px] rounded-xl sm:rounded-2xl object-cover shrink-0 border border-white/20 shadow-md pointer-events-none"
            />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 10, background: r.initBg || "rgba(123,44,191,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-xl leading-none" style={{ color: r.initColor || "#7B2CBF" }}>{r.init || r.name?.charAt(0) || "U"}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-base tracking-wide truncate" style={{ color: t.text }}>{r.name}</p>
            <StarRow n={r.stars} t={t} />
          </div>
        </div>
        <span className="font-['Plus_Jakarta_Sans',sans-serif] font-medium text-[9px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-full shrink-0" style={{ background: r.verBg || "rgba(22,207,131,0.15)", color: r.verColor || "#16CF83" }}>✓ Verified</span>
      </div>
      <p className="font-['Plus_Jakarta_Sans',sans-serif] font-medium text-[11px] sm:text-[17px] leading-snug sm:leading-relaxed tracking-wide relative z-10 flex-grow mt-2 sm:mt-3 line-clamp-3 sm:line-clamp-none" style={{ color: t.subtext }}>{r.text}</p>
    </div>
  );
}

const defaultReviews = [
  { init: "S", initBg: "#2e2344", initColor: "#7b2cbf", verBg: "#2e2344", verColor: "#7b2cbf", name: "Sakib Ahmed", stars: 5, text: "Speed boost and aim lock are game changers. The UI is so clean and easy to use." },
  { init: "R", initBg: "#0c3e3f", initColor: "#088689", verBg: "#0c3e3f", verColor: "#088689", name: "Rakib Hasan", stars: 5, text: "Best mod panel I've ever used! The drag headshot feature is insane. Anti-ban works perfectly." },
  { init: "A", initBg: "#1a2e3f", initColor: "#2790ff", verBg: "#1a2e3f", verColor: "#2790ff", name: "Arif Khan", stars: 5, text: "Amazing features! Color holograms make spotting enemies so much easier. Highly recommended." },
  { init: "M", initBg: "#3d1f30", initColor: "#eb29a4", verBg: "#3d1f30", verColor: "#eb29a4", name: "Mehedi Hasan", stars: 4, text: "ESP Radar is the best feature. Always know where enemies are. Great tool!" },
  { init: "T", initBg: "#233d28", initColor: "#16CF83", verBg: "#233d28", verColor: "#16CF83", name: "Tanvir Islam", stars: 5, text: "Unbelievable smoothness! KAC features work flawlessly without any lag or frame drops." },
  { init: "N", initBg: "#3d341a", initColor: "#FFB319", verBg: "#3d341a", verColor: "#FFB319", name: "Nayeem Chowdhury", stars: 5, text: "Safe and 100% undetected. The setup was instant and customer support is awesome." },
  { init: "F", initBg: "#1a393d", initColor: "#00E5D1", verBg: "#1a393d", verColor: "#00E5D1", name: "Fahim Hossain", stars: 5, text: "Headshot percentage went straight to 95%! Very clean interface with full dark/light theme support." },
];

export default function ReviewsSection({
  isDark,
  t,
  currentUser,
  onRequestSignIn
}: {
  isDark: boolean;
  t: Theme;
  currentUser: User | null;
  onRequestSignIn: () => void;
}) {
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  const [idx, setIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllReviewsOpen, setIsAllReviewsOpen] = useState(false);
  const [reviewName, setReviewName] = useState(currentUser?.displayName || "");
  const [reviewText, setReviewText] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = idx >= maxIdx ? 0 : idx + 1;
      scrollToIdx(nextIdx);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = idx <= 0 ? maxIdx : idx - 1;
      scrollToIdx(prevIdx);
    }
  };

  useEffect(() => {
    if (currentUser?.displayName) {
      setReviewName(currentUser.displayName);
    } else if (!currentUser) {
      setReviewName("");
    }
  }, [currentUser]);  useEffect(() => {
    let unsubFirestore: any = null;

    const loadReviews = async () => {
      // Load from dataCache first for immediate display
      const fetched = await dataCache.getData<any[]>("reviews", defaultReviews);
      if (Array.isArray(fetched)) {
        setDbReviews(fetched);
      }
      
      try {
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        unsubFirestore = onSnapshot(q, (snapshot) => {
          const snapshotDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Merge with what's in dataCache
          const staticReviews = dataCache.cache.get("reviews") || defaultReviews;
          const existingTexts = new Set(snapshotDocs.map((r: any) => (r.text || "").trim().toLowerCase()));
          const merged = [...snapshotDocs];
          
          if (Array.isArray(staticReviews)) {
            staticReviews.forEach((def: any) => {
              if (!existingTexts.has((def.text || "").trim().toLowerCase())) {
                merged.push(def);
                existingTexts.add((def.text || "").trim().toLowerCase());
              }
            });
          }
          
          setDbReviews(merged);
        }, (err) => console.warn("Notice loading Reviews:", err));
      } catch (err) {
        console.warn("Could not setup Firestore real-time Reviews", err);
      }
    };
    
    loadReviews();
    
    const unsubCache = dataCache.subscribe("reviews", (fetched) => {
      if (!unsubFirestore && Array.isArray(fetched)) {
        setDbReviews(fetched);
      }
    });
    
    return () => {
      unsubCache();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  useEffect(() => {
    if (isAllReviewsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAllReviewsOpen]);

  const allReviews = dbReviews;
  const total = allReviews.length;
  const displayedReviews = allReviews.slice(0, 10);

  const displayedTotal = displayedReviews.length;
  const maxIdx = typeof window !== "undefined" && window.innerWidth >= 768
    ? Math.max(0, displayedTotal - 2)
    : Math.max(0, displayedTotal - 1);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    scrollContainerRef.current.style.scrollBehavior = "auto";
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    if (isProgrammaticScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const totalScrollable = scrollWidth - clientWidth;
    if (totalScrollable <= 0) return;
    const ratio = scrollLeft / totalScrollable;
    const newActiveIndex = Math.round(ratio * maxIdx);
    setIdx(Math.min(maxIdx, Math.max(0, newActiveIndex)));
  };

  const scrollByAmount = (dir: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const cardWidth = scrollContainerRef.current.firstElementChild
      ? (scrollContainerRef.current.firstElementChild as HTMLElement).offsetWidth + 24
      : 360;
    scrollContainerRef.current.scrollBy({
      left: dir === "right" ? cardWidth : -cardWidth,
      behavior: "smooth"
    });
  };

  const scrollToIdx = (targetIdx: number) => {
    if (!scrollContainerRef.current) return;
    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }
    setIdx(targetIdx);
    const { scrollWidth, clientWidth } = scrollContainerRef.current;
    const totalScrollable = scrollWidth - clientWidth;
    const targetScroll = (targetIdx / Math.max(1, maxIdx)) * totalScrollable;
    scrollContainerRef.current.style.scrollBehavior = "smooth";
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth"
    });
    
    // Clear programmatic flag once smooth scroll is complete
    programmaticScrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      if (scrollContainerRef.current) scrollContainerRef.current.style.scrollBehavior = "auto";
    }, 800);
  };

  // Auto Infinite Loop with Pause on Hover and Dragging
  useEffect(() => {
    if (isPaused || isDragging || isModalOpen || isAllReviewsOpen || maxIdx <= 0) return;

    const interval = setInterval(() => {
      setIdx((prev) => {
        const next = prev >= maxIdx ? 0 : prev + 1;
        scrollToIdx(next);
        return next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isPaused, isDragging, isModalOpen, isAllReviewsOpen, maxIdx]);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmitReview = async () => {
    if (!currentUser) {
      alert("You must be logged in to submit a review.");
      return;
    }
    const finalName = reviewName.trim() || currentUser.displayName || "Anonymous";
    if (!finalName || !reviewText.trim() || isSubmitting) return;

    // Client-side 10-minute rate limit check per user (max 2 submissions per 10 minutes)
    const now = Date.now();
    const TEN_MINS = 10 * 60 * 1000;
    const userKey = currentUser?.uid || currentUser?.email || "anon_user";
    const storageKey = `user_submissions_log_${userKey}`;
    const submissionLog: number[] = JSON.parse(localStorage.getItem(storageKey) || "[]")
      .filter((t: number) => now - t < TEN_MINS);

    if (submissionLog.length >= 2) {
      alert("⚠️ Rate limit reached: You can submit a maximum of 2 items (reviews or questions) every 10 minutes. Please try again later.");
      return;
    }

    setIsSubmitting(true);

    const newReviewPayload = {
      name: finalName,
      init: finalName.charAt(0).toUpperCase() || "U",
      initBg: "rgba(123, 44, 191, 0.15)",
      initColor: "#7B2CBF",
      photoUrl: currentUser?.photoURL || null,
      email: currentUser?.email || null,
      uid: currentUser?.uid || null,
      stars: reviewStars,
      verBg: "rgba(22, 207, 131, 0.15)",
      verColor: "#16CF83",
      text: reviewText.trim()
    };

    try {
      // 1. Submit to custom API (saves to JSON file for website cache)
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReviewPayload)
      });
      
      let addedItem: any = null;
      if (res.ok) {
        const resData = await res.json();
        addedItem = resData.item;
      } else if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "⚠️ Rate limit reached: You can submit a maximum of 2 items (reviews or questions) every 10 minutes. Please try again later.");
        setIsSubmitting(false);
        return;
      } else {
        addedItem = {
          id: `rev-${Date.now()}`,
          ...newReviewPayload,
          createdAt: new Date().toISOString()
        };
      }

      // 2. Also save to Firestore so Admin Panel can see it
      try {
        const { collection, addDoc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        await addDoc(collection(db, "reviews"), {
          ...newReviewPayload,
          createdAt: addedItem.createdAt || new Date().toISOString()
        });
      } catch (fbErr) {
        console.error("Firestore sync error:", fbErr);
      }

            const updatedReviews = [addedItem, ...dbReviews];
      setDbReviews(updatedReviews);
      dataCache.setLocalData("reviews", updatedReviews);

      // Save submission log for this user
      submissionLog.push(now);
      localStorage.setItem(storageKey, JSON.stringify(submissionLog));

      setIdx(0);
      scrollToIdx(0);
      setSubmitted(true);
    } catch (err) {


      console.error("Error submitting review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (submitted) {
      setTimeout(() => scrollToIdx(0), 300);
    }
    setSubmitted(false);
    setReviewText("");
    setReviewStars(5);
  };

  return (
    <section id="reviews" className="relative py-20 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-[#7B2CBF] filter blur-[120px] pointer-events-none z-0 rounded-full transition-opacity duration-700 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.14]'}`} />

      <div className="relative z-10 flex flex-col items-center justify-center mb-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight" style={{ color: t.text }}>User Reviews</h2>
          <p className="text-sm font-semibold max-w-xl mx-auto" style={{ color: t.subtext }}>Read genuine feedback from our users.</p>
        </div>
        <div className="flex justify-center flex-wrap items-center gap-3.5 mb-6">
          <button 
            onClick={() => setIsAllReviewsOpen(true)}
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            style={{ 
              background: isDark ? "rgba(168, 85, 247, 0.22)" : "rgba(123, 44, 191, 0.12)", 
              color: isDark ? "#f3e8ff" : "#7B2CBF", 
              border: isDark ? "1px solid rgba(192, 132, 252, 0.45)" : "1px solid rgba(123, 44, 191, 0.3)",
              boxShadow: isDark ? "0 4px 14px rgba(123, 44, 191, 0.3)" : "none"
            }}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>Show All Reviews ({total})</span>
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                onRequestSignIn();
              } else if (currentUser?.displayName && !reviewName) {
                setReviewName(currentUser.displayName);
              }
              setIsModalOpen(true);
            }}
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95 text-white cursor-pointer shadow-lg shadow-[#7B2CBF]/25"
            style={{ background: "#7B2CBF" }}
          >
            ＋ Write a Review
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full mb-8">
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          data-lenis-prevent="true"
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            handleMouseLeaveOrUp();
          }}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onTouchCancel={() => setIsPaused(false)}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none py-4 px-1 snap-x snap-mandatory focus:outline-none ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'} transform-gpu will-change-scroll`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {displayedReviews.map((r, i) => (
            <div key={r.id || i} className="snap-start shrink-0 w-[85vw] sm:w-[380px] md:w-[420px] flex flex-col">
              <ReviewCard r={r} t={t} isDark={isDark} />
            </div>
          ))}
        </div>

        {/* Right Edge Soft Fade Overlay */}
        <div
          className="absolute top-0 right-0 bottom-0 w-8 sm:w-14 pointer-events-none z-20 rounded-r-2xl"
          style={{
            background: isDark
              ? "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)"
              : "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto py-2 max-w-[60%] scrollbar-none">
          {Array.from({ length: maxIdx + 1 }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to review ${i + 1}`}
              onClick={() => scrollToIdx(i)}
              className="rounded-full transition-all duration-300 shrink-0 cursor-pointer"
              style={{ width: i === idx ? 48 : 10, height: 10, background: i === idx ? "#00e6d2" : "#55545b" }}
            />
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => scrollByAmount("left")}
            aria-label="Previous review"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,.9)", border: isDark ? "1px solid rgba(123,44,191,0.2)" : "1px solid #7B2CBF", boxShadow: isDark ? "0 0 10px rgba(123,44,191,0.15)" : "0 0 15px 5px rgba(123,44,191,.3)" }}
          >
            <svg style={{ transform: "rotate(-90deg)", width: 16, height: 16 }} fill="none" viewBox="0 0 23.2087 13.5384">
              <path d={svgPaths.p2e4b4100} stroke={isDark ? "white" : "#151022"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.86811" />
            </svg>
          </button>
          <button
            onClick={() => scrollByAmount("right")}
            aria-label="Next review"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff", border: isDark ? "1px solid rgba(22,207,131,0.2)" : "1px solid #16CF83", boxShadow: isDark ? "0 0 10px rgba(22,207,131,0.15)" : "0 0 15px 5px rgba(22,207,131,.3)" }}
          >
            <svg style={{ transform: "rotate(90deg)", width: 16, height: 16 }} fill="none" viewBox="0 0 23.2087 13.5384">
              <path d={svgPaths.p2e4b4100} stroke={isDark ? "white" : "#151022"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.86811" />
            </svg>
          </button>
        </div>
      </div>

      {/* All Reviews Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isAllReviewsOpen && (
            <motion.div
              key="all-reviews-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => { if (e.target === e.currentTarget) setIsAllReviewsOpen(false); }}
              className={`fixed inset-0 z-[999] overflow-y-auto backdrop-blur-2xl p-4 sm:p-8 flex flex-col items-center justify-center cursor-pointer ${isDark ? "bg-black/40" : "bg-white/40"}`}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-6xl rounded-[32px] p-6 sm:p-10 relative overflow-hidden my-auto cursor-default shadow-2xl border"
                style={{
                  background: isDark
                    ? "linear-gradient(145deg, rgba(18,13,33,0.97) 0%, rgba(10,7,18,0.99) 100%)"
                    : "#ffffff",
                  borderColor: isDark ? "rgba(123,44,191,0.25)" : "rgba(123,44,191,0.3)",
                  boxShadow: isDark
                    ? "0 30px 80px -10px rgba(0,0,0,0.9), 0 0 40px rgba(123,44,191,0.15)"
                    : "0 30px 80px -10px rgba(123,44,191,0.25), 0 0 50px rgba(123,44,191,0.15)",
                }}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-32 filter blur-[60px] pointer-events-none rounded-full"
                  style={{
                    background: "#7B2CBF",
                    opacity: isDark ? 0.03 : 0.25
                  }}
                />

                <div className="flex items-center justify-between gap-4 mb-8 relative z-10 border-b pb-6" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] tracking-wider mb-1" style={{ color: isDark ? "#ffffff" : "#151022" }}>
                      ALL USER REVIEWS ({total})
                    </h3>
                    <p className="text-sm font-['Plus_Jakarta_Sans',sans-serif]" style={{ color: isDark ? "#a7a5b3" : "#5d5975" }}>
                      Read genuine feedback from ModX Lab users.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAllReviewsOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 shrink-0 cursor-pointer"
                    style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", color: isDark ? "#ffffff" : "#151022" }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                  {allReviews.map((r, i) => (
                    <ReviewCard key={r.id || i} r={r} t={t} isDark={isDark} minGlow={true} />
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t flex justify-end relative z-10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
                  <button
                    onClick={() => setIsAllReviewsOpen(false)}
                    className="px-8 py-3 rounded-xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    style={{ background: "#7B2CBF", boxShadow: "0 4px 15px rgba(123,44,191,0.4)" }}
                  >
                    Close Reviews
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Write Review Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              key="write-review-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
              className={`fixed inset-0 z-[999] overflow-y-auto backdrop-blur-2xl p-4 sm:p-8 flex flex-col items-center justify-center cursor-pointer ${isDark ? "bg-black/40" : "bg-white/40"}`}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg rounded-[32px] p-7 sm:p-9 relative overflow-hidden cursor-default shadow-2xl border my-auto"
                style={{
                  background: isDark
                    ? "linear-gradient(145deg, rgba(28,20,45,0.97) 0%, rgba(15,10,26,0.99) 100%)"
                    : "#ffffff",
                  borderColor: isDark ? "rgba(123,44,191,0.35)" : "rgba(123,44,191,0.38)",
                  boxShadow: isDark
                    ? "0 30px 80px -10px rgba(0,0,0,0.9), 0 0 40px rgba(123,44,191,0.2)"
                    : "0 30px 80px -10px rgba(123,44,191,0.35), 0 0 50px rgba(0,194,178,0.25)",
                }}
              >
                {/* Ambient Glows - Richer and deeper in light theme */}
                <div className={`absolute -top-16 -left-16 w-56 h-56 rounded-full filter blur-[60px] pointer-events-none transition-all duration-500 transform-gpu ${
                  isDark ? "bg-[#7B2CBF]/10" : "bg-[#7B2CBF]/15"
                }`} />
                <div className={`absolute -bottom-16 -right-16 w-56 h-56 rounded-full filter blur-[60px] pointer-events-none transition-all duration-500 transform-gpu ${
                  isDark ? "bg-[#00E5D1]/5" : "bg-[#00C2B2]/10"
                }`} />

                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 z-30 cursor-pointer border"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(123,44,191,0.08)",
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(123,44,191,0.2)",
                    color: isDark ? "#ffffff" : "#151022",
                  }}
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {submitted ? (
                  /* Ultra-Premium Success Box */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 relative z-10 flex flex-col items-center"
                  >
                    {/* Animated Pulsing Checkmark Ring */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full bg-[#16CF83]/20 animate-ping" />
                      <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#16CF83] to-[#00E5D1] p-[2px] shadow-[0_0_35px_rgba(22,207,131,0.5)]">
                        <div className="w-full h-full rounded-full bg-[#0a1f18] flex items-center justify-center">
                          <motion.svg
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="w-12 h-12 text-[#16CF83]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </motion.svg>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 text-xl animate-bounce">✨</div>
                      <div className="absolute -bottom-1 -left-2 text-lg animate-pulse">🌟</div>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 font-['Plus_Jakarta_Sans',sans-serif] bg-clip-text text-transparent bg-gradient-to-r from-[#16CF83] via-[#00E5D1] to-[#a78bfa]">
                      Review Published!
                    </h3>
                    <p className="text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif] mb-6 max-w-sm opacity-85" style={{ color: isDark ? "#d0cfd3" : "#4a4760" }}>
                      Thank you for your valuable feedback! Your review and profile details are now live in the community reviews.
                    </p>

                    {/* Submitted Review Preview Card */}
                    <div
                      className="w-full p-4 rounded-2xl border text-left mb-6 relative overflow-hidden backdrop-blur-md"
                      style={{
                        background: isDark ? "rgba(22,207,131,0.06)" : "rgba(22,207,131,0.05)",
                        borderColor: "rgba(22,207,131,0.3)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {currentUser?.photoURL ? (
                          <img loading="lazy" src={currentUser.photoURL} alt="User" className="w-9 h-9 rounded-full object-cover border border-[#16CF83]/40" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#16CF83]/20 text-[#16CF83] flex items-center justify-center font-bold text-sm">
                            {(reviewName || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" style={{ color: isDark ? "#ffffff" : "#151022" }}>{reviewName || "Anonymous"}</p>
                          <StarRow n={reviewStars} t={t} />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#16CF83]/20 text-[#16CF83] border border-[#16CF83]/30">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-xs italic line-clamp-2" style={{ color: isDark ? "#c4c2cb" : "#5a5670" }}>
                        "{reviewText}"
                      </p>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="w-full py-4 rounded-2xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif] text-base transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xl flex items-center justify-center gap-2"
                      style={{
                        background: "linear-gradient(135deg, #16CF83 0%, #00E5D1 100%)",
                        boxShadow: "0 8px 25px -4px rgba(22,207,131,0.5), inset 0 1px 1px rgba(255,255,255,0.3)",
                      }}
                    >
                      <span>Explore Community Reviews</span>
                      <span>→</span>
                    </button>
                  </motion.div>
                ) : (
                  /* Ultra-Premium Write Review Form */
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="text-center pb-2">
                      <h3 className="text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mb-1" style={{ color: isDark ? "#ffffff" : "#151022" }}>
                        Rate your experience
                      </h3>
                      <p className="text-sm font-['Plus_Jakarta_Sans',sans-serif] opacity-60" style={{ color: isDark ? "#a7a5b3" : "#5d5975" }}>
                        Your feedback helps us improve and serve you better.
                      </p>
                    </div>

                    {currentUser ? (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl border backdrop-blur-md" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(123,44,191,0.05)", borderColor: "rgba(123,44,191,0.25)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          {currentUser.photoURL ? (
                            <img loading="lazy" src={currentUser.photoURL} alt={currentUser.displayName || "User"} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-[#7B2CBF]/40 object-cover shrink-0 shadow-md" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7B2CBF] to-[#00E5D1] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                              {(currentUser.displayName || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold truncate" style={{ color: isDark ? "#ffffff" : "#151022" }}>{currentUser.displayName || "Google User"}</p>
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#16CF83]/20 text-[#16CF83] border border-[#16CF83]/30">Google Verified</span>
                            </div>
                            <p className="text-xs truncate opacity-70" style={{ color: isDark ? "#a7a5b3" : "#5d5975" }}>{currentUser.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-[18px] border flex items-center justify-between gap-3 backdrop-blur-md" style={{ background: "rgba(123,44,191,0.08)", borderColor: "rgba(123,44,191,0.3)" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔒</span>
                          <p className="text-xs font-semibold" style={{ color: isDark ? "#d0cfd3" : "#4a4760" }}>Sign in to verify your review with Google</p>
                        </div>
                        <button
                          type="button"
                          onClick={onRequestSignIn}
                          className="px-4 py-2 rounded-xl font-bold text-xs text-white shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                          style={{ background: "#7B2CBF" }}
                        >
                          Sign In
                        </button>
                      </div>
                    )}

                    {/* Interactive Star Rating */}
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex gap-2 relative p-3 rounded-2xl items-center justify-center" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}` }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const val = hoveredStar > 0 ? hoveredStar : reviewStars;
                          const isFull = star <= val;
                          const isHalf = !isFull && (star - 0.5 <= val);
                          const bgFill = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";

                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (reviewStars === star) {
                                  setReviewStars(star - 0.5);
                                } else if (reviewStars === star - 0.5) {
                                  setReviewStars(star - 1);
                                } else {
                                  setReviewStars(star);
                                }
                                setHoveredStar(0);
                              }}
                              onMouseEnter={() => setHoveredStar(star)}
                              onMouseLeave={() => setHoveredStar(0)}
                              className="p-1.5 transition-transform hover:scale-130 active:scale-95 cursor-pointer focus:outline-none rounded-xl"
                            >
                              <svg className="w-8 h-8 sm:w-9 sm:h-9 filter drop-shadow-[0_2px_8px_rgba(255,179,25,0.4)]" fill="none" viewBox="0 0 22.8254 19.8992">
                                {isFull ? (
                                  <path d={svgPaths.p10f17200} fill="#FFB319" />
                                ) : isHalf ? (
                                  <g>
                                    <path d={svgPaths.p10f17200} fill={bgFill} />
                                    <g style={{ clipPath: "inset(0 50% 0 0)" }}>
                                      <path d={svgPaths.p10f17200} fill="#FFB319" />
                                    </g>
                                  </g>
                                ) : (
                                  <path d={svgPaths.p10f17200} fill={bgFill} />
                                )}
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review Text Area */}
                    <div className="flex flex-col gap-1.5 relative">
                      <textarea
                        rows={3}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write your review here... (e.g. features you liked, performance)"
                        className="w-full px-5 py-4 rounded-[18px] outline-none resize-none transition-all duration-300 min-h-[120px] font-medium font-['Plus_Jakarta_Sans',sans-serif] text-sm shadow-sm"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(123,44,191,0.15)"}`,
                          color: isDark ? "#ffffff" : "#151022",
                        }}
                      />
                    </div>

                    {/* Modal Buttons */}
                    <div className="flex gap-3 mt-1">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="flex-1 py-3.5 rounded-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-sm transition-all hover:brightness-110 cursor-pointer border"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                          color: isDark ? "#ffffff" : "#151022",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || !reviewText.trim()}
                        className="flex-1 py-3.5 rounded-xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif] text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 shadow-xl"
                        style={{
                          background: "linear-gradient(135deg, #7B2CBF 0%, #00E5D1 100%)",
                          boxShadow: "0 8px 25px -4px rgba(123,44,191,0.5), inset 0 1px 1px rgba(255,255,255,0.3)",
                        }}
                      >
                        {isSubmitting ? "Publishing..." : "Submit Review"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
