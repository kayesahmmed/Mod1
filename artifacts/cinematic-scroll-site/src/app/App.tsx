import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { motion } from "motion/react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import { MarqueeBanner } from "../components/MarqueeSection";
import Footer, { ScrollToTop, Divider } from "../components/FooterSection";
import { darkTheme, lightTheme, Theme } from "../types";
import ScrollFrameSequence from "../components/ScrollFrameSequence";

const AdminPanel = lazy(() => import("../components/AdminPanel"));
const ParticlesBackground = lazy(() => import("../components/ParticlesBackground"));
const ReviewsSection = lazy(() => import("../components/ReviewsSection"));
const FAQSection = lazy(() => import("../components/FAQSection"));
const DownloadSection = lazy(() => import("../components/DownloadSection"));
const FeaturesSection = lazy(() => import("../components/FeaturesSection"));
const StatsSection = lazy(() => import("../components/MarqueeSection").then(m => ({ default: m.StatsSection })));

declare global {
  interface Window {
    google?: any;
  }
}

function LenisAssigner() {
  const lenis = useLenis();
  useEffect(() => {
    if (lenis) {
      (window as any).lenis = lenis;
      // Provide GSAP sync if needed
      // lenis.on('scroll', ScrollTrigger.update)
    }
    return () => {
      if ((window as any).lenis === lenis) {
        delete (window as any).lenis;
      }
    };
  }, [lenis]);
  return null;
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("kayes_theme");
      if (saved !== null) {
        return saved === "dark";
      }
    } catch (e) {
      console.error("Failed to load theme preference", e);
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem("kayes_theme", isDark ? "dark" : "light");
    } catch (e) {
      console.error("Failed to save theme preference", e);
    }
  }, [isDark]);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [oneTapDismissed, setOneTapDismissed] = useState(false);
  const t: Theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      // Suppress missing initial state / storage errors when sessionStorage was cleared
      if (
        err?.code !== "auth/popup-closed-by-user" &&
        err?.code !== "auth/missing-initial-state" &&
        err?.code !== "auth/argument-error"
      ) {
        console.log("Redirect result notice:", err?.message || err);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const clearOneTapCooldown = useCallback(() => {
    const host = window.location.hostname;
    document.cookie = "g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
    if (host.includes(".")) {
      const parts = host.split(".");
      if (parts.length >= 2) {
        const rootDomain = "." + parts.slice(-2).join(".");
        document.cookie = `g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
      }
    }
    try {
      localStorage.removeItem("g_state");
      sessionStorage.removeItem("g_state");
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    if (currentUser || auth.currentUser) {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (e) {
          // Ignore
        }
      }
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;

    const initOneTap = () => {
      if (currentUser || auth.currentUser) {
        if (window.google?.accounts?.id) {
          try { window.google.accounts.id.cancel(); } catch (e) {}
        }
        return true;
      }

      // Skip One Tap prompt when inside an iframe, as browsers block FedCM in framed documents
      if (window.self !== window.top) {
        return true;
      }

      if (!window.google?.accounts?.id) return false;

      clearOneTapCooldown();

      try {
        window.google.accounts.id.initialize({
          client_id: "100813616906-qr9dl7r46pd7hdmp8qpu69d0a55bbk25.apps.googleusercontent.com",
          callback: async (response: { credential: string }) => {
            try {
              const credential = GoogleAuthProvider.credential(response.credential);
              await signInWithCredential(auth, credential);
            } catch (err) {
              console.error("Google One Tap sign-in error:", err);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: false,
        });

        if (auth.currentUser) {
          window.google.accounts.id.cancel();
          return true;
        }

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log("One Tap not displayed reason:", notification.getNotDisplayedReason?.());
          }
          if (notification.isDismissedMoment()) {
            setOneTapDismissed(true);
            clearOneTapCooldown();
          } else if (notification.isSkippedMoment()) {
            clearOneTapCooldown();
          }
        });
      } catch (err) {
        console.warn("One Tap initialization notice:", err);
      }
      return true;
    };

    if (!initOneTap()) {
      interval = setInterval(() => {
        if (initOneTap() && interval) { clearInterval(interval); interval = null; }
      }, 200);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [currentUser, authInitialized, clearOneTapCooldown]);

  const handleGlobalGoogleSignIn = useCallback(async () => {
    if (currentUser) return;

    clearOneTapCooldown();

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.prompt();
          } catch (pErr) {
            console.warn("One Tap prompt notice:", pErr);
          }
        } else {
          try {
            await signInWithRedirect(auth, googleProvider);
          } catch (rErr) {
            console.warn("Redirect sign in notice:", rErr);
          }
        }
      } else if (
        err?.code !== "auth/popup-closed-by-user" &&
        err?.code !== "auth/cancelled-popup-request"
      ) {
        console.log("Sign-in notice:", err?.code || err?.message || err);
      }
    }
  }, [currentUser, clearOneTapCooldown]);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#admin") {
        setIsAdminOpen(true);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const appContent = (
    <div
      className="relative min-h-screen w-[980px] mx-auto transition-colors duration-500"
      style={{ background: t.bg }}
    >
      <ScrollFrameSequence />

      {/* Floating Ambient Particles Background */}
      <Suspense fallback={null}>
        <ParticlesBackground isDark={isDark} />
      </Suspense>

      {/* Subtle Noise Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-30 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full"
      >
        {!isDark && (
          <div className="absolute top-0 left-0 right-0 h-[800px] pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-[#FFFFFF] opacity-[0.25] filter blur-[150px] rounded-full" />
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-[#E8E2FF] opacity-[0.2] filter blur-[120px] rounded-full" />
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] bg-[#FFFFFF] opacity-[0.25] filter blur-[150px] rounded-full" />
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-[#E8E2FF] opacity-[0.2] filter blur-[120px] rounded-full" />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none overflow-hidden z-0">
          <div className="absolute" style={{ left: "5%", top: "-10%", width: 80, height: 600, background: isDark ? "#7D52FD" : "#c4b5fd", borderRadius: "50%", filter: "blur(80px)", transform: "rotate(-35deg)", opacity: isDark ? 0.65 : 0.4 }} />
          <div className="absolute" style={{ left: "32%", top: "-10%", width: 60, height: 500, background: isDark ? "#7D52FD" : "#a78bfa", borderRadius: "50%", filter: "blur(80px)", transform: "rotate(-35deg)", opacity: isDark ? 0.55 : 0.35 }} />
          <div className="absolute" style={{ right: "32%", top: "-10%", width: 60, height: 500, background: isDark ? "#7D52FD" : "#a78bfa", borderRadius: "50%", filter: "blur(80px)", transform: "rotate(35deg)", opacity: isDark ? 0.55 : 0.35 }} />
          <div className="absolute" style={{ right: "5%", top: "-10%", width: 80, height: 600, background: isDark ? "#7D52FD" : "#c4b5fd", borderRadius: "50%", filter: "blur(80px)", transform: "rotate(35deg)", opacity: isDark ? 0.65 : 0.4 }} />
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className={`absolute top-[25%] left-[-5%] w-[40%] h-[600px] bg-[#9D86FF] filter blur-[120px] rounded-full transition-opacity duration-700 ${isDark ? 'opacity-[0.16]' : 'opacity-[0.15]'}`} />
          <div className={`absolute top-[45%] right-[-10%] w-[50%] h-[700px] bg-[#00E5D1] filter blur-[150px] rounded-full transition-opacity duration-700 ${isDark ? 'opacity-[0.14]' : 'opacity-[0.12]'}`} />
          <div className={`absolute top-[65%] left-[10%] w-[45%] h-[600px] bg-[#16CF83] filter blur-[140px] rounded-full transition-opacity duration-700 ${isDark ? 'opacity-[0.14]' : 'opacity-[0.12]'}`} />
          <div className={`absolute top-[85%] right-[5%] w-[40%] h-[500px] bg-[#FFB11A] filter blur-[130px] rounded-full transition-opacity duration-700 ${isDark ? 'opacity-[0.12]' : 'opacity-[0.1]'}`} />
        </div>

        <Header isDark={isDark} setIsDark={setIsDark} t={t} onOpenAdmin={() => setIsAdminOpen(true)} currentUser={currentUser} onRequestSignIn={handleGlobalGoogleSignIn} />
        
        <HeroSection isDark={isDark} t={t} />
        
        <MarqueeBanner />
        
        <Suspense fallback={<div className="h-[200px]" />}>
          <StatsSection t={t} />
        </Suspense>
        
        <Divider t={t} />
        
        <Suspense fallback={<div className="h-[400px]" />}>
          <DownloadSection t={t} isDark={isDark} />
        </Suspense>
        
        <Divider t={t} />
        
        <Suspense fallback={<div className="h-[400px]" />}>
          <FeaturesSection isDark={isDark} t={t} />
        </Suspense>
        
        <Divider t={t} />
        
        <Suspense fallback={<div className="h-[400px]" />}>
          <FAQSection t={t} />
        </Suspense>
        
        <Divider t={t} />
        
        <Suspense fallback={<div className="h-[400px]" />}>
          <ReviewsSection isDark={isDark} t={t} currentUser={currentUser} onRequestSignIn={handleGlobalGoogleSignIn} />
        </Suspense>
        
        <Footer t={t} onOpenAdmin={() => setIsAdminOpen(true)} isDark={isDark} />
        <ScrollToTop t={t} />

        {isAdminOpen && (
          <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="w-8 h-8 border-4 border-[#7D52FD] border-t-transparent rounded-full animate-spin"></div></div>}>
            <AdminPanel
              onClose={() => {
                setIsAdminOpen(false);
                if (window.location.hash === "#admin") {
                  window.history.pushState("", document.title, window.location.pathname + window.location.search);
                }
              }}
              isDark={isDark}
              t={t}
            />
          </Suspense>
        )}
      </motion.div>
    </div>
  );

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        duration: 1.5,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        syncTouch: true,
        autoResize: true,
      }}
    >
      <LenisAssigner />
      {appContent}
    </ReactLenis>
  );
}
