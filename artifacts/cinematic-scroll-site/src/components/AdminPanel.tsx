import { useState, useEffect, useRef } from "react";
import { resizeImage } from "../lib/imageUpload";
import { dataCache } from "../lib/dataCache";

import { db, auth, googleProvider } from "../lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs 
} from "firebase/firestore";
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";

type Theme = {
  bg: string; surface: string; border: string;
  text: string; subtext: string; cardBg: string; cardBorder: string;
  reviewBg: string; headerBg: string; footerBg: string;
  navBg: string; navActivePill: string; navActiveText: string; navText: string;
  faqBg: string; inputBg: string;
};

// Default authorized primary admin email address (kept strictly secret on client side logic)
const PRIMARY_ADMIN_EMAIL = "kayesahmmed00@gmail.com";

// Default initial static FAQ data (fallback)
const defaultFaqData = [
  { q: "Is ModX Lab safe to use?", a: "Yes! Our mod panel includes an advanced anti-ban system that keeps your account safe. We use encrypted injection methods and regular updates to bypass detection." },
  { q: "Which devices are supported?", a: "ModX Lab works on all Android devices running Android 7.0 (Nougat) or higher. Both Free Fire and Free Fire Max are supported." },
  { q: "How do I install the mod?", a: "Simply download the APK, enable 'Install from unknown sources' in your settings, install the APK, and open it before launching the game." },
  { q: "Is it free to use?", a: "Yes, ModX Lab is completely free! All features including drag headshot, holograms, ESP, and auto aim are included at no cost." },
  { q: "How often is it updated?", a: "We release updates within 24–48 hours after every Free Fire game update to ensure compatibility and undetectable performance." },
];

// Default initial static reviews data (fallback - matching main website)
const defaultReviewsData = [
  { init: "S", initBg: "#2e2344", initColor: "#7b2cbf", verBg: "#2e2344", verColor: "#7b2cbf", name: "Sakib Ahmed", stars: 5, text: "Speed boost and aim lock are game changers. The UI is so clean and easy to use." },
  { init: "R", initBg: "#0c3e3f", initColor: "#088689", verBg: "#0c3e3f", verColor: "#088689", name: "Rakib Hasan", stars: 5, text: "Best mod panel I've ever used! The drag headshot feature is insane. Anti-ban works perfectly." },
  { init: "A", initBg: "#1a2e3f", initColor: "#2790ff", verBg: "#1a2e3f", verColor: "#2790ff", name: "Arif Khan", stars: 5, text: "Amazing features! Color holograms make spotting enemies so much easier. Highly recommended." },
  { init: "M", initBg: "#3d1f30", initColor: "#eb29a4", verBg: "#3d1f30", verColor: "#eb29a4", name: "Mehedi Hasan", stars: 4, text: "ESP Radar is the best feature. Always know where enemies are. Great tool!" },
  { init: "T", initBg: "#233d28", initColor: "#16CF83", verBg: "#233d28", verColor: "#16CF83", name: "Tanvir Islam", stars: 5, text: "Unbelievable smoothness! KAC features work flawlessly without any lag or frame drops." },
  { init: "N", initBg: "#3d341a", initColor: "#FFB319", verBg: "#3d341a", verColor: "#FFB319", name: "Nayeem Chowdhury", stars: 5, text: "Safe and 100% undetected. The setup was instant and customer support is awesome." },
  { init: "F", initBg: "#1a393d", initColor: "#00E5D1", verBg: "#1a393d", verColor: "#00E5D1", name: "Fahim Hossain", stars: 5, text: "Headshot percentage went straight to 95%! Very clean interface with full dark/light theme support." },
];

export default function AdminPanel({ 
  onClose, 
  isDark, 
  t 
}: { 
  onClose: () => void; 
  isDark: boolean; 
  t: Theme 
}) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_authenticated") === "true";
  });
  const [accessDeniedEmail, setAccessDeniedEmail] = useState<string | null>(null);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Manage Admin Emails & Credentials Modal
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [adminEmailsList, setAdminEmailsList] = useState<string[]>([]);
  const [newAllowedEmail, setNewAllowedEmail] = useState("");

  // Change Password state
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [currentAdminDocId, setCurrentAdminDocId] = useState<string | null>(null);


  // Settings State
  const [lightLogoBase64, setLightLogoBase64] = useState("");
  const [darkLogoBase64, setDarkLogoBase64] = useState("");
  const [headerLogoSize, setHeaderLogoSize] = useState<number | string>(40);
  const [heroLogoSize, setHeroLogoSize] = useState<number | string>(40);
  const [heroLogoPaddingTop, setHeroLogoPaddingTop] = useState<number | string>(0);
  const [faviconSize, setFaviconSize] = useState<number | string>(16);
  const [headerLogoPaddingTop, setHeaderLogoPaddingTop] = useState<number | string>(0);
  const [headerLogoPaddingLeft, setHeaderLogoPaddingLeft] = useState<number | string>(0);
  const [footerLogoSize, setFooterLogoSize] = useState<number | string>(32);
  const [footerLogoPaddingTop, setFooterLogoPaddingTop] = useState<number | string>(0);
  const [footerLogoPaddingLeft, setFooterLogoPaddingLeft] = useState<number | string>(0);

  const handleNumInput = (val: string, setter: (v: number | string) => void) => {
    if (val === "") {
      setter("");
    } else {
      const parsed = parseInt(val, 10);
      setter(isNaN(parsed) ? "" : parsed);
    }
  };
  const [footerTelegram, setFooterTelegram] = useState("https://t.me/");
  const [footerWhatsapp, setFooterWhatsapp] = useState("https://wa.me/");
  const [footerYoutube, setFooterYoutube] = useState("https://youtube.com/");

  useEffect(() => {
    if (isAuthenticated) {
      dataCache.getData<any>("settings", {}).then((data) => {
        if (data) {
          if (data.headerLogoUrl) setLightLogoBase64(data.headerLogoUrl);
          if (data.lightLogoUrl) setLightLogoBase64(data.lightLogoUrl);
          if (data.darkLogoUrl) setDarkLogoBase64(data.darkLogoUrl);
          if (data.headerLogoSize !== undefined) setHeaderLogoSize(data.headerLogoSize);
          if (data.heroLogoSize !== undefined) setHeroLogoSize(data.heroLogoSize);
          if (data.heroLogoPaddingTop !== undefined) setHeroLogoPaddingTop(data.heroLogoPaddingTop);
          if (data.faviconSize !== undefined) setFaviconSize(data.faviconSize);
          if (data.headerLogoPaddingTop !== undefined) setHeaderLogoPaddingTop(data.headerLogoPaddingTop);
          if (data.headerLogoPaddingLeft !== undefined) setHeaderLogoPaddingLeft(data.headerLogoPaddingLeft);
          if (data.footerLogoSize !== undefined) setFooterLogoSize(data.footerLogoSize);
          if (data.footerLogoPaddingTop !== undefined) setFooterLogoPaddingTop(data.footerLogoPaddingTop);
          if (data.footerLogoPaddingLeft !== undefined) setFooterLogoPaddingLeft(data.footerLogoPaddingLeft);
          if (data.footerTelegram) setFooterTelegram(data.footerTelegram);
          if (data.footerWhatsapp) setFooterWhatsapp(data.footerWhatsapp);
          if (data.footerYoutube) setFooterYoutube(data.footerYoutube);
        }
      });
    }
  }, [isAuthenticated]);

  const handleLightLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const base64 = await resizeImage(file, 200, 200);
      setLightLogoBase64(base64);
    } catch (err) {
      console.error(err);
      showToast("Error processing logo", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDarkLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const base64 = await resizeImage(file, 200, 200);
      setDarkLogoBase64(base64);
    } catch (err) {
      console.error(err);
      showToast("Error processing logo", "error");
    } finally {
      setIsProcessing(false);
    }
  };


  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const existingSettings = await dataCache.getData<any>("settings", {});
      const finalLogo = lightLogoBase64 || existingSettings?.headerLogoUrl || existingSettings?.lightLogoUrl || "/website-logo.png";
      const finalDarkLogo = darkLogoBase64 || existingSettings?.darkLogoUrl || finalLogo;

      const parseNum = (val: any, fallback: number) => (val !== "" && val !== undefined && !isNaN(Number(val)) ? Number(val) : fallback);

      const newSettings = {
        ...existingSettings,
        headerLogoUrl: finalLogo,
        lightLogoUrl: finalLogo,
        darkLogoUrl: finalDarkLogo,
        headerLogoSize: parseNum(headerLogoSize, existingSettings?.headerLogoSize ?? 40),
        heroLogoSize: parseNum(heroLogoSize, existingSettings?.heroLogoSize ?? 40),
        heroLogoPaddingTop: parseNum(heroLogoPaddingTop, existingSettings?.heroLogoPaddingTop ?? 0),
        faviconSize: parseNum(faviconSize, existingSettings?.faviconSize ?? 16),
        headerLogoPaddingTop: parseNum(headerLogoPaddingTop, existingSettings?.headerLogoPaddingTop ?? 0),
        headerLogoPaddingLeft: parseNum(headerLogoPaddingLeft, existingSettings?.headerLogoPaddingLeft ?? 0),
        footerLogoSize: parseNum(footerLogoSize, existingSettings?.footerLogoSize ?? 32),
        footerLogoPaddingTop: parseNum(footerLogoPaddingTop, existingSettings?.footerLogoPaddingTop ?? 0),
        footerLogoPaddingLeft: parseNum(footerLogoPaddingLeft, existingSettings?.footerLogoPaddingLeft ?? 0),
        updatedAt: new Date().toISOString()
      };
      
      dataCache.setLocalData("settings", newSettings);
      dataCache.bumpVersionLocally("settings");
      
      showToast("Logo & Styles saved as draft! Click 'Publish Changes' to deploy live.");
    } catch (err: any) {
      console.error("Save Logo Error:", err);
      showToast(`Failed to save: ${err.message || "Unknown error"}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const existingSettings = await dataCache.getData<any>("settings", {});
      const newSettings = {
        ...existingSettings,
        footerTelegram,
        footerWhatsapp,
        footerYoutube,
        updatedAt: new Date().toISOString()
      };

      showToast("Social links saved as draft! Click 'Publish Changes' to deploy live.");
    } catch (err: any) {
      console.error("Save Socials Error:", err);
      showToast(`Failed to save: ${err.message || "Unknown error"}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };


  // Nav Links State
  const defaultNavsList = [
    { id: "hero", label: "Home", href: "#hero", order: 0 },
    { id: "features", label: "Features", href: "#features", order: 1 },
    { id: "download", label: "Download", href: "#download", order: 2 },
    { id: "faq", label: "FAQ", href: "#faq", order: 3 },
    { id: "reviews", label: "Reviews", href: "#reviews", order: 4 },
  ];
  const [navLinks, setNavLinks] = useState<any[]>(defaultNavsList);
  const [isAddingNav, setIsAddingNav] = useState(false);
  const [navLabel, setNavLabel] = useState("");
  const [navHref, setNavHref] = useState("");
  const [editNavId, setEditNavId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      dataCache.getData<any[]>("nav", defaultNavsList).then(cached => {
        if (Array.isArray(cached)) {
          setNavLinks(cached);
        } else {
          setNavLinks(defaultNavsList);
        }
      });
    }
  }, [isAuthenticated]);

  const handleSaveNav = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!navLabel.trim() || !navHref.trim()) return showToast("Label and Href required", "error");
    setIsProcessing(true);
    try {
      let updatedNav: any[] = [];
      if (editNavId) {
        updatedNav = navLinks.map(n => n.id === editNavId ? { ...n, label: navLabel.trim(), href: navHref.trim() } : n);
        showToast("Nav item updated! Click 'Publish Changes' to deploy live.");
      } else {
        const newId = navLabel.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
        const newItem = {
          id: newId,
          label: navLabel.trim(),
          href: navHref.trim(),
          order: navLinks.length,
          hidden: false,
        };
        updatedNav = [...navLinks, newItem];
        showToast("Nav item added! Click 'Publish Changes' to deploy live.");
      }
      setNavLinks(updatedNav);

      setIsAddingNav(false); setEditNavId(null); setNavLabel(""); setNavHref("");
    } catch (e) {
      console.error(e); showToast("Error saving nav item", "error");
    } finally { setIsProcessing(false); }
  };

  const handleDeleteNav = async (item: any) => {
    if (!window.confirm(`Delete "${item.label}" from navbar?`)) return;
    setIsProcessing(true);
    try {
      const updatedNav = navLinks.filter(n => n.id !== item.id);
      setNavLinks(updatedNav);
      showToast(`Nav item "${item.label}" deleted! Click 'Publish Changes' to deploy live.`);
    } catch(e) { console.error(e); showToast("Error deleting nav item", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleResetDefaultNav = async () => {
    if (!window.confirm("Reset navbar to original default buttons (Home, Features, Download, FAQ, Reviews)?")) return;
    setIsProcessing(true);
    try {
      const defaultNavs = [
        { id: "hero", label: "Home", href: "#hero", order: 0 },
        { id: "features", label: "Features", href: "#features", order: 1 },
        { id: "download", label: "Download", href: "#download", order: 2 },
        { id: "faq", label: "FAQ", href: "#faq", order: 3 },
        { id: "reviews", label: "Reviews", href: "#reviews", order: 4 },
      ];
      setNavLinks(defaultNavs);
      showToast("Navbar reset to defaults! Click 'Publish Changes' to deploy live.");
    } catch(e) {
      console.error(e);
      showToast("Error resetting navbar", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartEditNav = (item: any) => {
    setEditNavId(item.id); setNavLabel(item.label); setNavHref(item.href); setIsAddingNav(true);
  };

  // Panel active tab
  const [activeTab, setActiveTab] = useState<"faqs" | "reviews" | "downloads" | "nav" | "settings">("faqs");

  
  // Downloads State
  const [dbDownloads, setDbDownloads] = useState<any[]>([]);
  const [isAddingDownload, setIsAddingDownload] = useState(false);
  const [editDownloadId, setEditDownloadId] = useState<string | null>(null);
  
  // Download Form State
  const [dlFiles, setDlFiles] = useState<any[]>([{ title: "", category: "", tags: "", imageUrl: "", buttonText: "Download Free APK", downloadLink: "" }]);
  const [dlBoxDate, setDlBoxDate] = useState("");
  const [dlHowToUse, setDlHowToUse] = useState("");
  const [dlYoutubeLinks, setDlYoutubeLinks] = useState<any[]>([{ title: "", url: "" }]);
  const [dlHowToUseTitle, setDlHowToUseTitle] = useState("How to Use");
  const [dlYoutubeTitle, setDlYoutubeTitle] = useState("Video Tutorial");

  const handleAddDlFile = () => setDlFiles([...dlFiles, { title: "", category: "", tags: "", imageUrl: "", buttonText: "Download Free APK", downloadLink: "" }]);
  const handleRemoveDlFile = (idx: number) => setDlFiles(dlFiles.filter((_, i) => i !== idx));
  const updateDlFile = (idx: number, field: string, val: string) => {
    const newFiles = [...dlFiles];
    newFiles[idx][field] = val;
    setDlFiles(newFiles);
  };
  
  const handleAddYtLink = () => setDlYoutubeLinks([...dlYoutubeLinks, { title: "", url: "" }]);
  const handleRemoveYtLink = (idx: number) => setDlYoutubeLinks(dlYoutubeLinks.filter((_, i) => i !== idx));
  const updateYtLink = (idx: number, field: string, val: string) => {
    const newLinks = [...dlYoutubeLinks];
    if (typeof newLinks[idx] === 'string') {
      newLinks[idx] = { title: "", url: newLinks[idx] };
    }
    newLinks[idx][field] = val;
    setDlYoutubeLinks(newLinks);
  };
  

  // FAQ State
  const [dbFaqs, setDbFaqs] = useState<any[]>([]);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState("");
  const [editAText, setEditAText] = useState("");
  
  // Adding New FAQ State
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // Reviews State
  const [dbReviews, setDbReviews] = useState<any[]>([]);
  
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toast alert
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Helper function to check if email is authorized
  const checkIsEmailAuthorized = async (email: string) => {
    const emailLower = email.trim().toLowerCase();
    
    // Always authorize primary admin email
    if (emailLower === PRIMARY_ADMIN_EMAIL.toLowerCase()) return true;

    // Check Firestore allowed emails
    try {
      const snap = await getDocs(collection(db, "admin_emails"));
      const allowedFromDb = snap.docs.map(d => d.data().email?.toLowerCase());
      if (allowedFromDb.includes(emailLower)) return true;
    } catch (e) {
      console.error("Error checking admin emails in Firestore:", e);
    }

    return false;
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err?.code !== "auth/popup-closed-by-user") {
        console.log("Redirect result notice:", err);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const isAuthorized = await checkIsEmailAuthorized(user.email);

        if (isAuthorized) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          setAccessDeniedEmail(null);
          sessionStorage.setItem("admin_authenticated", "true");
          sessionStorage.setItem("admin_email", user.email);
        } else {
          // Block unauthorized email from Admin Panel, but keep user signed in on main website
          setCurrentUser(user);
          setIsAuthenticated(false);
          sessionStorage.removeItem("admin_authenticated");
          sessionStorage.removeItem("admin_email");
          setAccessDeniedEmail(user.email);
        }
      } else {
        const isPassAuth = sessionStorage.getItem("admin_authenticated_pass") === "true";
        if (!isPassAuth) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch allowed admin emails list for settings view
  const fetchAllowedAdminEmails = async () => {
    try {
      const snap = await getDocs(collection(db, "admin_emails"));
      const list = snap.docs.map(d => d.data().email);
      setAdminEmailsList(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllowedAdminEmails();
    }
  }, [isAuthenticated]);

  // Google OAuth Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setLoginError("");
    setAccessDeniedEmail(null);

    try {
      let user = null;
      try {
        const result = await signInWithPopup(auth, googleProvider);
        user = result.user;
      } catch (popupErr: any) {
        console.warn("Popup sign in notice, using redirect fallback:", popupErr?.code || popupErr?.message);
        if (
          popupErr?.code === "auth/internal-error" ||
          popupErr?.code === "auth/popup-blocked" ||
          popupErr?.code === "auth/cancelled-popup-request"
        ) {
          // Fallback to redirect sign-in on mobile or blocked popups
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }

      if (user && user.email) {
        const isAuthorized = await checkIsEmailAuthorized(user.email);

        if (isAuthorized) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          setAccessDeniedEmail(null);
          sessionStorage.setItem("admin_authenticated", "true");
          sessionStorage.setItem("admin_email", user.email);
          showToast(`Welcome Admin!`);
        } else {
          // Block user with confidential access denied dialog in Admin Panel, but keep user signed in on main website
          setCurrentUser(user);
          setIsAuthenticated(false);
          setAccessDeniedEmail(user.email);
        }
      } else {
        setLoginError("Could not retrieve email address from Google.");
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err?.code !== "auth/popup-closed-by-user") {
        // Fallback to redirect sign in if popup throws internal error
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          setLoginError("Sign-in failed. Please try again.");
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Ensure default admin credentials in Firebase
  const ensureDefaultAdminInFirebase = async () => {
    try {
      const snap = await getDocs(collection(db, "admins"));
      if (snap.empty) {
        const newDoc = await addDoc(collection(db, "admins"), {
          username: "admin",
          email: PRIMARY_ADMIN_EMAIL,
          password: "admin1234",
          updatedAt: new Date().toISOString()
        });
        setCurrentAdminDocId(newDoc.id);
        return { username: "admin", email: PRIMARY_ADMIN_EMAIL, password: "admin1234", id: newDoc.id };
      } else {
        const adminDoc = snap.docs[0];
        setCurrentAdminDocId(adminDoc.id);
        return { id: adminDoc.id, ...adminDoc.data() } as any;
      }
    } catch (err) {
      console.error("Error ensuring admin:", err);
      return null;
    }
  };

  // Password & Email Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const inputUser = loginUsername.trim().toLowerCase();
    const inputPass = loginPassword.trim();

    if (!inputUser || !inputPass) {
      setLoginError("Please enter both email/username and password!");
      return;
    }

    setIsLoggingIn(true);
    try {
      const snap = await getDocs(collection(db, "admins"));
      let validAdmins: any[] = [];

      if (snap.empty) {
        const defaultAdmin = await ensureDefaultAdminInFirebase();
        if (defaultAdmin) validAdmins.push(defaultAdmin);
      } else {
        validAdmins = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // Allow login if matching primary email + password or username + password in admins collection
      const matched = validAdmins.find(
        a => 
          (
            a.username?.toLowerCase() === inputUser || 
            a.email?.toLowerCase() === inputUser ||
            inputUser === PRIMARY_ADMIN_EMAIL.toLowerCase()
          ) && 
          a.password === inputPass
      );

      if (matched) {
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("admin_authenticated_pass", "true");
        sessionStorage.setItem("admin_email", inputUser.includes("@") ? inputUser : PRIMARY_ADMIN_EMAIL);
        setCurrentAdminDocId(matched.id);
        setIsAuthenticated(true);
        setLoginUsername("");
        setLoginPassword("");
        showToast("Logged in successfully as Admin!");
      } else {
        setLoginError("Invalid email or password! Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Failed to connect to authentication server. Try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Signout error:", err);
    }
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_authenticated_pass");
    sessionStorage.removeItem("admin_email");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAccessDeniedEmail(null);
    showToast("Logged out of Admin Panel.");
  };

  // Add Allowed Admin Email to Firestore
  const handleAddAllowedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllowedEmail.trim() || !newAllowedEmail.includes("@")) {
      showToast("Please enter a valid email address!", "error");
      return;
    }

    setIsProcessing(true);
    try {
      await addDoc(collection(db, "admin_emails"), {
        email: newAllowedEmail.trim().toLowerCase(),
        createdAt: new Date().toISOString()
      });
      showToast(`Added ${newAllowedEmail} as authorized admin!`);
      setNewAllowedEmail("");
      fetchAllowedAdminEmails();
    } catch (err) {
      console.error(err);
      showToast("Failed to add admin email", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Username/Password Credentials
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      showToast("Username and Password cannot be empty!", "error");
      return;
    }

    setIsProcessing(true);
    try {
      let docId = currentAdminDocId;
      if (!docId) {
        const snap = await getDocs(collection(db, "admins"));
        if (!snap.empty) docId = snap.docs[0].id;
      }

      if (docId) {
        await updateDoc(doc(db, "admins", docId), {
          username: newAdminUsername.trim(),
          email: PRIMARY_ADMIN_EMAIL,
          password: newAdminPassword.trim(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const newDoc = await addDoc(collection(db, "admins"), {
          username: newAdminUsername.trim(),
          email: PRIMARY_ADMIN_EMAIL,
          password: newAdminPassword.trim(),
          updatedAt: new Date().toISOString()
        });
        setCurrentAdminDocId(newDoc.id);
      }

      showToast("Admin credentials updated in Firebase!");
      setIsManagingAdmins(false);
      setNewAdminUsername("");
      setNewAdminPassword("");
    } catch (err) {
      console.error("Error updating credentials:", err);
      showToast("Failed to update credentials", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Real-time Listeners and Cache loader for FAQs, Reviews, Downloads
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    // Load initial data from dataCache / static JSON so counts are NEVER 0 when static data exists
    const loadInitialCache = async () => {
      const cachedFaqs = await dataCache.getData<any[]>("faqs", defaultFaqData);
      const cachedReviews = await dataCache.getData<any[]>("reviews", defaultReviewsData);
      const cachedDownloads = await dataCache.getData<any[]>("downloads", []);

      if (isMounted) {
        setDbFaqs(prev => (prev.length > 0 ? prev : (cachedFaqs.length > 0 ? cachedFaqs : defaultFaqData)));
        
        const existingCachedTexts = new Set(cachedReviews.map((r: any) => (r.text || "").trim()));
        const mergedCache = [...cachedReviews];
        defaultReviewsData.forEach(def => {
          if (!existingCachedTexts.has((def.text || "").trim())) {
            mergedCache.push(def);
          }
        });
        setDbReviews(prev => (prev.length > 0 ? prev : mergedCache));

        if (cachedDownloads.length > 0) {
          setDbDownloads(prev => (prev.length > 0 ? prev : cachedDownloads));
        }
      }
    };

    loadInitialCache();
    
    try {
      const qFaqs = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
      const unsubFaqs = onSnapshot(qFaqs, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, isFirestore: true, ...doc.data() }));
        const staticFaqs = dataCache.cache.get("faqs") || defaultFaqData;
        const existingQs = new Set(fetched.map((f: any) => (f.q || "").trim()));
        const merged = [...fetched];
        
        if (Array.isArray(staticFaqs)) {
          staticFaqs.forEach((def: any) => {
            if (!existingQs.has((def.q || "").trim())) {
              merged.push(def);
              existingQs.add((def.q || "").trim());
            }
          });
        }
        
        setDbFaqs(merged);
      }, (err) => console.warn("Notice loading FAQs:", err));

      const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const unsubReviews = onSnapshot(qReviews, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, isFirestore: true, ...doc.data() }));
        const staticReviews = dataCache.cache.get("reviews") || defaultReviewsData;
        const existingTexts = new Set(fetched.map((r: any) => (r.text || "").trim()));
        const merged = [...fetched];
        
        if (Array.isArray(staticReviews)) {
          staticReviews.forEach((def: any) => {
            if (!existingTexts.has((def.text || "").trim())) {
              merged.push(def);
              existingTexts.add((def.text || "").trim());
            }
          });
        }
        
        setDbReviews(merged);
      }, (err) => console.warn("Notice loading Reviews:", err));

      return () => {
        isMounted = false;
        unsubFaqs();
        unsubReviews();
      };
    } catch (err) {
      console.error(err);
    }
  }, [isAuthenticated]);


  const allFaqs = dbFaqs;
  const allReviews = dbReviews;



  // Filtered FAQs

  const filteredFaqs = allFaqs.filter(f => 
    (f.q || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f.a && f.a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered Reviews
  const filteredReviews = allReviews.filter(r => 
    (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.text || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  // Filtered Downloads
  const filteredDownloads = dbDownloads.filter(d => 
    (d.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  // --- Download Actions ---
  const handleImageSelectDlFile = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const base64 = await resizeImage(file, 300, 300, 0.9);
      updateDlFile(idx, 'imageUrl', base64);
      showToast("Image processed successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to process image", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenBlankDownloadForm = () => {
    setEditDownloadId(null);
    setDlFiles([{ title: "", category: "", tags: "", imageUrl: "", buttonText: "Download Free APK", downloadLink: "" }]);
    setDlBoxDate(""); setDlHowToUse(""); setDlYoutubeLinks([{ title: "", url: ""}]); setDlHowToUseTitle("How to Use"); setDlYoutubeTitle("Video Tutorial");
    setIsAddingDownload(true);
  };

  const handleStartEditDownload = (dl: any) => {
    setEditDownloadId(dl.id);
    setDlFiles(dl.files?.length ? dl.files : [{ title: dl.title || "", category: dl.category || "", tags: dl.tags || "", imageUrl: dl.imageUrl || "", buttonText: dl.buttonText || "Download", downloadLink: dl.downloadLink || "" }]);
    setDlBoxDate(dl.boxDate || "");
    setDlHowToUse(dl.howToUse || "");
    setDlYoutubeLinks(dl.youtubeLinks?.length ? dl.youtubeLinks : (dl.youtubeLink ? [dl.youtubeLink] : [""]));
    setDlHowToUseTitle(dl.howToUseTitle || "How to Use");
    setDlYoutubeTitle(dl.youtubeTitle || "Video Tutorial");
    setIsAddingDownload(true);
  };

  const handleSaveDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dlFiles.length === 0 || !dlFiles[0].title.trim()) {
      showToast("At least one app/file with a title is required", "error");
      return;
    }
    setIsProcessing(true);
    const dlData = {
      files: dlFiles,
      boxDate: dlBoxDate.trim(),
      howToUse: dlHowToUse.trim(),
      youtubeLinks: dlYoutubeLinks.filter(l => (typeof l === 'string' ? l : l.url).trim() !== ""),
      howToUseTitle: dlHowToUseTitle.trim(),
      youtubeTitle: dlYoutubeTitle.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      let updatedDlList = [...dbDownloads];
      if (editDownloadId) {
        updatedDlList = updatedDlList.map(item => item.id === editDownloadId ? { ...item, ...dlData } : item);
        showToast("Download box updated!");
      } else {
        const newId = "dl_" + Date.now();
        const newBox = { id: newId, ...dlData, createdAt: new Date().toISOString() };
        updatedDlList = [newBox, ...updatedDlList];
        showToast("New Download box created!");
      }

      setDbDownloads(updatedDlList);

      setIsAddingDownload(false);
      setEditDownloadId(null);
      setDlFiles([{ title: "", category: "", tags: "", imageUrl: "", buttonText: "Download Free APK", downloadLink: "" }]);
      setDlBoxDate(""); setDlHowToUse(""); setDlYoutubeLinks([{ title: "", url: ""}]); setDlHowToUseTitle("How to Use"); setDlYoutubeTitle("Video Tutorial");
      showToast("Download box saved! Click 'Publish Changes' to deploy live.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save download", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDownload = async (dl: any) => {
    if (!confirm(`Delete ${dl.files?.[0]?.title || dl.title || "this download box"}?`)) return;
    setIsProcessing(true);
    try {
      const updatedDlList = dbDownloads.filter(d => d.id !== dl.id);
      setDbDownloads(updatedDlList);
      showToast("Download box deleted! Click 'Publish Changes' to deploy live.");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- FAQ Actions ---
  const handleStartEditFaq = (faq: any) => {
    setEditingFaqId(faq.id);
    setEditQText(faq.q || "");
    setEditAText(faq.a || "");
  };

  const handleSaveFaq = async (faq: any) => {
    if (!editQText.trim()) {
      showToast("Question text cannot be empty!", "error");
      return;
    }

    setIsProcessing(true);
    try {
      if (faq.isFirestore) {
        await updateDoc(doc(db, "faqs", faq.id), {
          q: editQText.trim(),
          a: editAText.trim(),
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }
      const updatedFaqs = dbFaqs.map(f => f.id === faq.id ? { ...f, q: editQText.trim(), a: editAText.trim() } : f);
      setDbFaqs(updatedFaqs);
      dataCache.setLocalData("faqs", updatedFaqs); // Immediate cache update

      showToast("FAQ updated! Click 'Publish Changes' to deploy live.");
      setEditingFaqId(null);
    } catch (err) {
      console.error("Error saving FAQ:", err);
      showToast("Failed to save FAQ", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFaq = async (faq: any) => {
    if (!confirm(`Are you sure you want to delete this question?\n"${faq.q}"`)) return;
    setIsProcessing(true);
    try {
      const updatedFaqs = dbFaqs.filter(f => f.id !== faq.id);
      setDbFaqs(updatedFaqs);
      dataCache.setLocalData("faqs", updatedFaqs); // Immediate local cache update
      if (faq.isFirestore) {
        await deleteDoc(doc(db, "faqs", faq.id)).catch(() => {});
      }
      showToast("Question deleted! Click 'Publish Changes' to deploy live.");
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      showToast("Failed to delete question", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      showToast("Please write a question!", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const faqPayload = {
        q: newQuestion.trim(),
        a: newAnswer.trim() || "Thank you for asking! We will update this answer shortly.",
        createdAt: new Date().toISOString()
      };
      let docId = "faq_" + Date.now();
      try {
        const docRef = await addDoc(collection(db, "faqs"), faqPayload);
        docId = docRef.id;
      } catch (_) {}

      const newFaq = { id: docId, ...faqPayload, isFirestore: true };
      const updatedFaqs = [newFaq, ...dbFaqs];
      setDbFaqs(updatedFaqs);
      dataCache.setLocalData("faqs", updatedFaqs); // Immediate local cache update

      setNewQuestion("");
      setNewAnswer("");
      setIsAddingFaq(false);
      showToast("New FAQ question added! Click 'Publish Changes' to deploy live.");
    } catch (err) {
      console.error("Error adding new FAQ:", err);
      showToast("Failed to add question", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Review Actions ---
  const handleDeleteReview = async (review: any) => {
    if (!confirm(`Are you sure you want to delete review from ${review.name}?`)) return;
    setIsProcessing(true);
    try {
      const updatedReviews = dbReviews.filter(r => r.id !== review.id);
      setDbReviews(updatedReviews);
      dataCache.setLocalData("reviews", updatedReviews); // Immediate local cache update
      if (review.isFirestore) {
        await deleteDoc(doc(db, "reviews", review.id)).catch(() => {});
      }
      showToast("Review deleted! Click 'Publish Changes' to deploy live.");
    } catch (err) {
      console.error("Error deleting review:", err);
      showToast("Failed to delete review", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    /* Outer Backdrop: Clicking anywhere outside the modal closes the Admin window & returns to main website */
    <div 
      onClick={onClose}
      className={`fixed inset-0 z-[120] overflow-y-auto backdrop-blur-2xl flex flex-col items-center justify-start sm:justify-center p-2 sm:p-6 lg:p-10 animate-fade-in select-none cursor-pointer ${
        isDark ? "bg-black/85" : "bg-slate-900/60"
      }`}
    >
      
      {/* Toast Alert */}
      {statusMsg && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`fixed top-6 right-6 z-[160] px-6 py-3.5 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 animate-fade-in ${
            statusMsg.type === "success" ? "bg-[#16CF83] text-black" : "bg-red-500 text-white"
          }`}
        >
          <span>{statusMsg.type === "success" ? "✓" : "⚠️"}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 🚫 ACCESS DENIED SCREEN (PREMIUM CONFIDENTIAL REDESIGN - NO SECRET EMAIL DISCLOSURE) */}
      {accessDeniedEmail ? (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-3xl p-6 sm:p-8 relative overflow-hidden my-auto flex flex-col items-center text-center gap-6 animate-fade-in cursor-default"
          style={{ 
            background: isDark ? "linear-gradient(145deg, #1a0a14 0%, #0d050a 100%)" : "#ffffff", 
            border: isDark ? "2px solid rgba(239, 68, 68, 0.6)" : "2px solid #fca5a5", 
            boxShadow: isDark 
              ? "0 25px 70px rgba(239, 68, 68, 0.35), inset 0 0 40px rgba(239, 68, 68, 0.1)"
              : "0 20px 50px rgba(239, 68, 68, 0.2)" 
          }}
        >
          {/* Ambient red neon top light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-red-500/20 filter blur-[40px] pointer-events-none rounded-full" />

          {/* Glowing Shield Icon */}
          <div className="w-20 h-20 rounded-2xl bg-red-500/15 border-2 border-red-500 flex items-center justify-center shrink-0 shadow-[0_0_35px_rgba(239,68,68,0.5)] animate-pulse">
            <span className="text-4xl">🛑</span>
          </div>

          <div className="flex flex-col gap-2 relative z-10">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/40 w-fit mx-auto shadow-sm">
              ACCESS DENIED • UNAUTHORIZED ACCOUNT
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-['Orbitron',sans-serif] tracking-wider text-red-500 drop-shadow-sm">
              UNAUTHORIZED ACCOUNT
            </h2>
            <p className={`text-xs sm:text-sm font-['Plus_Jakarta_Sans'] leading-relaxed max-w-md mx-auto ${
              isDark ? "text-white/80" : "text-slate-600"
            }`}>
              Your Google account does not have administrative privileges. Access to this control panel is restricted exclusively to authorized administrators.
            </p>
          </div>

          {/* Security notice box (NO secret email shown!) */}
          <div className={`p-4 rounded-2xl border w-full text-xs text-left leading-relaxed flex flex-col gap-2 relative z-10 ${
            isDark ? "bg-black/60 border-red-500/30 text-white/90" : "bg-red-50 border-red-200 text-slate-800"
          }`}>
            <div className="flex items-center gap-2 font-bold text-red-500">
              <span className="text-base">🔒</span>
              <span className="uppercase tracking-wider">Security Protection Active:</span>
            </div>
            <p className={isDark ? "text-white/70" : "text-slate-600"}>
              Unauthorized login attempts are strictly monitored and logged. Please sign in with an authorized Google account.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1 relative z-10">
            <button
              onClick={() => {
                setAccessDeniedEmail(null);
                handleGoogleSignIn();
              }}
              className="w-full py-3.5 rounded-2xl font-bold font-['Bricolage_Grotesque'] text-sm bg-gradient-to-r from-red-500 to-amber-500 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(239,68,68,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔄 Try Google Sign In Again</span>
            </button>
            <button
              onClick={onClose}
              className={`w-full py-3.5 rounded-2xl font-bold font-['Bricolage_Grotesque'] text-sm transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                isDark 
                  ? "bg-white/10 text-white hover:bg-white/20 border-white/15" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
              }`}
            >
              <span>← Return to Website</span>
            </button>
          </div>
        </div>
      ) : !isAuthenticated ? (

        /* 🔐 INTEGRATED PREMIUM LOGIN SCREEN (EXCLUSIVELY GOOGLE OAUTH WITH LIGHT & DARK THEME SUPPORT) */
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl p-6 sm:p-8 relative overflow-hidden my-auto flex flex-col gap-6 cursor-default transition-all duration-300"
          style={{ 
            background: isDark 
              ? "linear-gradient(160deg, #130a21 0%, #070311 100%)" 
              : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", 
            border: isDark 
              ? "1px solid rgba(0, 229, 209, 0.4)" 
              : "1px solid rgba(123, 44, 191, 0.25)", 
            boxShadow: isDark 
              ? "0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 229, 209, 0.12)" 
              : "0 25px 60px rgba(15, 23, 42, 0.12), 0 10px 30px rgba(123, 44, 191, 0.08)" 
          }}
        >
          {/* Background Ambient Glow */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-36 filter blur-[50px] pointer-events-none rounded-full"
            style={{
              background: isDark
                ? "linear-gradient(90deg, #00E5D1 0%, #7B2CBF 100%)"
                : "linear-gradient(90deg, rgba(0,229,209,0.2) 0%, rgba(123,44,191,0.2) 100%)",
              opacity: isDark ? 0.25 : 0.6
            }} 
          />

          {/* Card Header */}
          <div className="text-center flex flex-col items-center gap-2 relative z-10">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 mb-1 transition-transform hover:scale-105"
              style={{
                background: isDark ? "rgba(0, 229, 209, 0.12)" : "linear-gradient(135deg, rgba(123, 44, 191, 0.1), rgba(0, 229, 209, 0.1))",
                border: isDark ? "1px solid rgba(0, 229, 209, 0.5)" : "1px solid rgba(123, 44, 191, 0.3)",
                boxShadow: isDark ? "0 0 30px rgba(0,229,209,0.35)" : "0 4px 20px rgba(123,44,191,0.15)"
              }}
            >
              <span className="text-3xl">🛡️</span>
            </div>
            
            <h2 
              className={`text-2xl sm:text-3xl font-extrabold font-['Orbitron',sans-serif] tracking-wider ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              ADMIN PORTAL
            </h2>
            
            <p className={`text-xs sm:text-sm font-['Plus_Jakarta_Sans'] leading-relaxed max-w-xs ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}>
              Authentication required. Sign in with your authorized Google account to manage portal content.
            </p>
          </div>

          {/* Error message display if any */}
          {loginError && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-500 text-xs font-semibold text-center animate-fade-in relative z-10 flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          {/* GOOGLE OAUTH PRIMARY SIGN-IN BUTTON */}
          <div className="flex flex-col gap-3 relative z-10 py-1">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full py-4 px-6 rounded-2xl font-bold font-['Bricolage_Grotesque'] text-sm sm:text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3.5 border shadow-lg group relative overflow-hidden"
              style={{ 
                background: "#ffffff", 
                borderColor: isDark ? "#334155" : "#cbd5e1",
                color: "#0f172a",
                boxShadow: isDark 
                  ? "0 10px 30px rgba(0,229,209,0.2)" 
                  : "0 10px 25px rgba(123,44,191,0.15)" 
              }}
            >
              {/* Button highlight animation line */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

              {/* Official Google SVG Icon */}
              <svg className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              
              <span className="tracking-wide">
                {isLoggingIn ? "Connecting to Google..." : "Continue with Google"}
              </span>
            </button>

            {/* Security Pill Badge */}
            <div className={`mt-1 py-2 px-3 rounded-xl border text-[11px] font-semibold text-center flex items-center justify-center gap-2 ${
              isDark 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <span>🔒</span>
              <span>Secure OAuth2.0 Admin Verification</span>
            </div>
          </div>

          {/* Footer Return Link */}
          <div className="border-t pt-4 text-center relative z-10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0" }}>
            <button 
              onClick={onClose}
              className={`text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto ${
                isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>← Close & Return to Main Website</span>
            </button>
          </div>
        </div>
      ) : (

        /* ----------------------------------------------------
           ✅ AUTHENTICATED ADMIN DASHBOARD
           ---------------------------------------------------- */
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 relative my-auto flex flex-col gap-4 sm:gap-6 cursor-default overflow-y-auto backdrop-blur-3xl"
          style={{ 
            background: isDark ? "linear-gradient(145deg, rgba(30, 22, 48, 0.95), rgba(15, 10, 25, 0.98))" : "linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.98))",
            border: `1px solid ${isDark ? "rgba(0, 229, 209, 0.2)" : "rgba(123, 44, 191, 0.2)"}`, 
            boxShadow: isDark ? "0 30px 80px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)" : "0 25px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)"
          }}
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#00E5D1] opacity-[0.18] filter blur-[60px] pointer-events-none rounded-full" />

          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 relative z-10" style={{ borderColor: t.cardBorder }}>
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img loading="lazy" 
                  src={currentUser.photoURL} 
                  alt="Admin" 
                  className="w-12 h-12 rounded-2xl border-2 border-[#00E5D1] shadow-[0_0_15px_rgba(0,229,209,0.4)] object-cover shrink-0" 
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#00E5D1]/15 border border-[#00E5D1] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,229,209,0.3)]">
                  <span className="text-2xl">⚙️</span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold font-['Orbitron',sans-serif] tracking-wider" style={{ color: t.text }}>
                    ADMIN PANEL
                  </h1>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#16CF83]/20 text-[#16CF83] border border-[#16CF83]/40 flex items-center gap-1">
                    <span>✓</span> Verified Administrator
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-['Plus_Jakarta_Sans'] mt-0.5 flex items-center gap-2" style={{ color: t.subtext }}>
                  <span>Logged in as: <strong className="text-[#00E5D1]">{currentUser?.email || sessionStorage.getItem("admin_email") || "Admin"}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <button
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    let currentDownloads = [...dbDownloads];
                    // Auto-save active download box form if open and title is present
                    if ((isAddingDownload || editDownloadId) && dlFiles.length > 0 && dlFiles[0].title.trim() !== "") {
                      const dlData = {
                        files: dlFiles,
                        boxDate: dlBoxDate.trim(),
                        howToUse: dlHowToUse.trim(),
                        youtubeLinks: dlYoutubeLinks.filter(l => (typeof l === 'string' ? l : l.url).trim() !== ""),
                        howToUseTitle: dlHowToUseTitle.trim(),
                        youtubeTitle: dlYoutubeTitle.trim(),
                        updatedAt: new Date().toISOString()
                      };
                      if (editDownloadId) {
                        currentDownloads = currentDownloads.map(item => item.id === editDownloadId ? { ...item, ...dlData } : item);
                      } else {
                        const newId = "dl_" + Date.now();
                        const newBox = { id: newId, ...dlData, createdAt: new Date().toISOString() };
                        currentDownloads = [newBox, ...currentDownloads];
                      }
                      setDbDownloads(currentDownloads);
                      setIsAddingDownload(false);
                      setEditDownloadId(null);
                      setDlFiles([{ title: "", category: "", tags: "", imageUrl: "", buttonText: "Download Free APK", downloadLink: "" }]);
                      setDlBoxDate(""); setDlHowToUse(""); setDlYoutubeLinks([{ title: "", url: ""}]); setDlHowToUseTitle("How to Use"); setDlYoutubeTitle("Video Tutorial");
                    }

                    const existingSettings = await dataCache.getData<any>("settings", {});
                    const finalHeaderLogo = lightLogoBase64 || existingSettings?.headerLogoUrl || existingSettings?.lightLogoUrl || "/website-logo.png";
                    const finalDarkLogo = darkLogoBase64 || existingSettings?.darkLogoUrl || finalHeaderLogo;

                    const parseNum = (val: any, fallback: number) => (val !== "" && val !== undefined && !isNaN(Number(val)) ? Number(val) : fallback);

                    const settingsObj = {
                      headerLogoUrl: finalHeaderLogo,
                      lightLogoUrl: finalHeaderLogo,
                      darkLogoUrl: finalDarkLogo,
                      headerLogoSize: parseNum(headerLogoSize, existingSettings?.headerLogoSize ?? 40),
                      heroLogoSize: parseNum(heroLogoSize, existingSettings?.heroLogoSize ?? 40),
                      heroLogoPaddingTop: parseNum(heroLogoPaddingTop, existingSettings?.heroLogoPaddingTop ?? 0),
                      faviconSize: parseNum(faviconSize, existingSettings?.faviconSize ?? 16),
                      headerLogoPaddingTop: parseNum(headerLogoPaddingTop, existingSettings?.headerLogoPaddingTop ?? 0),
                      headerLogoPaddingLeft: parseNum(headerLogoPaddingLeft, existingSettings?.headerLogoPaddingLeft ?? 0),
                      footerLogoSize: parseNum(footerLogoSize, existingSettings?.footerLogoSize ?? 32),
                      footerLogoPaddingTop: parseNum(footerLogoPaddingTop, existingSettings?.footerLogoPaddingTop ?? 0),
                      footerLogoPaddingLeft: parseNum(footerLogoPaddingLeft, existingSettings?.footerLogoPaddingLeft ?? 0),
                      footerTelegram: footerTelegram || existingSettings?.footerTelegram || "https://t.me/kayesahmmedpro",
                      footerWhatsapp: footerWhatsapp || existingSettings?.footerWhatsapp || "https://wa.me/",
                      footerYoutube: footerYoutube || existingSettings?.footerYoutube || "https://youtube.com/@kayesahmmed-xs3hk?si=yTTcq8MXuImfhgUI",
                      updatedAt: new Date().toISOString()
                    };

                    let currentNavList = [...navLinks];
                    if (isAddingNav && navLabel.trim() && navHref.trim()) {
                      if (editNavId) {
                        currentNavList = currentNavList.map(n => n.id === editNavId ? { ...n, label: navLabel.trim(), href: navHref.trim() } : n);
                      } else {
                        const newId = navLabel.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
                        currentNavList.push({
                          id: newId,
                          label: navLabel.trim(),
                          href: navHref.trim(),
                          order: currentNavList.length,
                          hidden: false,
                        });
                      }
                      setNavLinks(currentNavList);
                      setIsAddingNav(false);
                      setEditNavId(null);
                      setNavLabel("");
                      setNavHref("");
                    }
                    const finalNav = currentNavList;

                    // Update local dataCache instantly for immediate preview feedback
                    dataCache.setLocalData("downloads", currentDownloads);
                    dataCache.setLocalData("faqs", allFaqs);
                    dataCache.setLocalData("reviews", allReviews);
                    dataCache.setLocalData("nav", finalNav);
                    dataCache.setLocalData("settings", settingsObj);

                    dataCache.bumpVersionLocally("downloads");
                    dataCache.bumpVersionLocally("faqs");
                    dataCache.bumpVersionLocally("reviews");
                    dataCache.bumpVersionLocally("nav");
                    dataCache.bumpVersionLocally("settings");

                    const res = await fetch("/api/admin/publish", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        allData: {
                          downloads: currentDownloads,
                          faqs: allFaqs,
                          reviews: allReviews,
                          nav: finalNav,
                          settings: settingsObj
                        }
                      })
                    });
                    if (res.ok) {
                      showToast("🚀 Auto-Saved & Published to Production CDN!");
                    } else {
                      showToast("Saved locally and in Cache!");
                    }
                  } catch (e) {
                    showToast("Saved locally and in Cache!");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs bg-[#16CF83]/20 text-[#16CF83] border border-[#16CF83]/50 hover:bg-[#16CF83] hover:text-black transition-all cursor-pointer flex items-center gap-1 shadow-md"
              >
                <span>🚀</span> <span className="hidden sm:inline">Publish Changes</span><span className="sm:hidden">Publish</span> (CDN/JSON)
              </button>

              <button
                onClick={() => setIsManagingAdmins(!isManagingAdmins)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs bg-[#7B2CBF]/20 text-[#9D86FF] border border-[#7B2CBF]/40 hover:bg-[#7B2CBF] hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                ⚙️ <span className="hidden sm:inline">Admin Settings</span><span className="sm:hidden">Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                🔒 Logout
              </button>

              <button 
                onClick={onClose}
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold font-['Bricolage_Grotesque'] text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ml-auto sm:ml-0"
                style={{ 
                  background: "linear-gradient(135deg, #00E5D1, #2790FF)", 
                  color: "#151022",
                  boxShadow: "0 4px 20px rgba(0,229,209,0.4)" 
                }}
              >
                <span>← Back to Web</span>
              </button>
            </div>
          </div>

          {/* ADMIN SETTINGS & AUTHORIZED EMAILS OVERLAY */}
          {isManagingAdmins && (
            <div 
              className="p-6 rounded-2xl border flex flex-col gap-6 relative z-10 animate-fade-in"
              style={{ background: t.cardBg, borderColor: "#7B2CBF" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold font-['Orbitron'] text-lg text-[#9D86FF] flex items-center gap-2">
                  <span>⚙️</span> Authorized Admin Gmail Accounts
                </h3>
                <button 
                  onClick={() => setIsManagingAdmins(false)}
                  className="text-xs font-bold text-white/60 hover:text-white"
                >
                  ✕ Close Settings
                </button>
              </div>

              {/* Add Authorized Admin Email Form */}
              <form onSubmit={handleAddAllowedEmail} className="flex flex-col gap-3 p-4 rounded-xl bg-black/20 border border-white/10">
                <label className="text-xs font-bold text-[#00E5D1] uppercase tracking-wider">
                  Add Additional Authorized Admin Gmail:
                </label>
                <div className="flex gap-2">
                  <input 
                    type="email"
                    value={newAllowedEmail}
                    onChange={e => setNewAllowedEmail(e.target.value)}
                    placeholder="e.g. secondaryadmin@gmail.com"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }}
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#16CF83] text-[#151022] hover:scale-105 cursor-pointer shrink-0"
                  >
                    ＋ Authorize Gmail
                  </button>
                </div>
              </form>

              {/* List of currently authorized emails */}
              {adminEmailsList.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-white/70">Extra Authorized Gmails:</span>
                  <div className="flex flex-wrap gap-2">
                    {adminEmailsList.map((email, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-[#7B2CBF]/20 border border-[#7B2CBF]/40 text-xs text-[#9D86FF] font-semibold">
                        ✉️ {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto whitespace-nowrap shrink-0 scrollbar-none touch-pan-x flex-nowrap" style={{ background: t.surface, border: `1px solid ${t.cardBorder}`, WebkitOverflowScrolling: "touch" }}>
              <button
                onClick={() => setActiveTab("faqs")}
                className={`px-5 sm:px-6 py-2.5 rounded-xl font-['Bricolage_Grotesque'] font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "faqs" 
                    ? "bg-[#00E5D1] text-[#151022] shadow-[0_0_15px_rgba(0,229,209,0.4)]" 
                    : isDark 
                      ? "text-white/80 hover:text-white" 
                      : "text-slate-800 hover:text-slate-950 font-extrabold"
                }`}
              >
                ❓ FAQ Questions ({allFaqs.length})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-5 sm:px-6 py-2.5 rounded-xl font-['Bricolage_Grotesque'] font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "reviews" 
                    ? "bg-[#7B2CBF] text-white shadow-[0_0_15px_rgba(123,44,191,0.4)]" 
                    : isDark 
                      ? "text-white/80 hover:text-white" 
                      : "text-slate-800 hover:text-slate-950 font-extrabold"
                }`}
              >
                ⭐ User Reviews ({allReviews.length})
              </button>

              <button
                onClick={() => setActiveTab("downloads")}
                className={`px-5 sm:px-6 py-2.5 rounded-xl font-['Bricolage_Grotesque'] font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "downloads" 
                    ? "bg-[#2790FF] text-white shadow-[0_0_15px_rgba(39,144,255,0.4)]" 
                    : isDark 
                      ? "text-white/80 hover:text-white" 
                      : "text-slate-800 hover:text-slate-950 font-extrabold"
                }`}
              >
                📦 Downloads
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-5 sm:px-6 py-2.5 rounded-xl font-['Bricolage_Grotesque'] font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "settings" 
                    ? "bg-[#A855F7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                    : isDark 
                      ? "text-white/80 hover:text-white" 
                      : "text-slate-800 hover:text-slate-950 font-extrabold"
                }`}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setActiveTab("nav")}
                className={`px-5 sm:px-6 py-2.5 rounded-xl font-['Bricolage_Grotesque'] font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "nav" 
                    ? "bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" 
                    : isDark 
                      ? "text-white/80 hover:text-white" 
                      : "text-slate-800 hover:text-slate-950 font-extrabold"
                }`}
              >
                🔗 Navbar
              </button>

            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              
              {activeTab === "downloads" && (
                <button
                  onClick={() => {
                    if (isAddingDownload) {
                      setIsAddingDownload(false);
                    } else {
                      handleOpenBlankDownloadForm();
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2790FF] text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
                >
                  {isAddingDownload ? "✕ Cancel" : "＋ Add Download Box"}
                </button>
              )}

              {activeTab === "faqs" && (
                <button
                  onClick={() => setIsAddingFaq(!isAddingFaq)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#16CF83] text-[#151022] hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
                >
                  {isAddingFaq ? "✕ Cancel" : "＋ Add FAQ Question"}
                </button>
              )}

              <div className="relative flex-1 sm:w-64">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ 
                    background: t.inputBg, 
                    border: `1px solid ${t.cardBorder}`, 
                    color: t.text 
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ADD NEW FAQ FORM EXPAND */}
          {activeTab === "faqs" && isAddingFaq && (
            <form 
              onSubmit={handleAddNewFaq}
              className="p-6 rounded-2xl border flex flex-col gap-4 relative z-10 animate-fade-in"
              style={{ background: t.cardBg, borderColor: "#00E5D1" }}
            >
              <h3 className="font-bold font-['Orbitron'] text-lg text-[#00E5D1] flex items-center gap-2">
                <span>＋</span> Add New Question & Answer
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Question Text</label>
                <input 
                  type="text"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder="Type question here..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Answer Text (Optional)</label>
                <textarea 
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  placeholder="Type official answer here..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none min-h-[80px] resize-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingFaq(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#00E5D1] text-[#151022] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  {isProcessing ? "Saving..." : "Save Question to Firebase"}
                </button>
              </div>
            </form>
          )}

          {/* MAIN TAB CONTENT */}
          <div 
            className="relative z-10 w-full h-[900px] max-h-[85vh] overflow-y-auto pr-2 flex flex-col gap-4 touch-pan-y overscroll-contain" 
            style={{ height: "900px", maxHeight: "85vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            
            
            {/* TAB: DOWNLOADS */}
            {activeTab === "downloads" && (
              <div className="flex flex-col gap-4">
                {!isAddingDownload && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2" style={{ color: t.text }}>
                        <span>📦 Download Boxes ({filteredDownloads.length})</span>
                      </h3>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: t.subtext }}>Create, edit, or manage download boxes and files.</p>
                    </div>
                    <button
                      onClick={handleOpenBlankDownloadForm}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2790FF] text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(39,144,255,0.4)] cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>＋ Add New Download Box</span>
                    </button>
                  </div>
                )}

                {isAddingDownload && (
                  <form onSubmit={handleSaveDownload} className="flex flex-col gap-6 p-6 rounded-2xl border relative z-10 animate-fade-in" style={{ background: t.cardBg, borderColor: "#2790FF" }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg" style={{ color: t.text }}>
                        {editDownloadId ? "✎ Edit Download Box" : "＋ Add New Download Box"}
                      </h3>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Box Date (Top Right, e.g. 12 August 2026)</label>
                      <input type="text" value={dlBoxDate} onChange={e => setDlBoxDate(e.target.value)} placeholder="12 August 2026" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                    </div>

                    <div className="flex flex-col gap-4">
                      <h4 className="font-bold text-base border-b pb-2" style={{ color: t.text, borderColor: t.cardBorder }}>Apps / Files</h4>
                      {dlFiles.map((file, idx) => (
                        <div key={idx} className="p-4 border rounded-xl relative flex flex-col gap-4" style={{ borderColor: t.cardBorder, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                          {dlFiles.length > 1 && (
                            <button type="button" onClick={() => handleRemoveDlFile(idx)} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">✕</button>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Title</label>
                              <input type="text" value={file.title} onChange={e => updateDlFile(idx, 'title', e.target.value)} placeholder="App Name" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Category / Subtitle</label>
                              <input type="text" value={file.category} onChange={e => updateDlFile(idx, 'category', e.target.value)} placeholder="Free Fire Mod Panel · Android" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Tags (comma separated)</label>
                              <input type="text" value={file.tags} onChange={e => updateDlFile(idx, 'tags', e.target.value)} placeholder="Android 7+, Anti-Ban" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Icon / Image</label>
                              <input type="file" accept="image/*" onChange={(e) => handleImageSelectDlFile(e, idx)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#2790FF]/20 file:text-[#2790FF] cursor-pointer" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                              {file.imageUrl && <img src={file.imageUrl} alt="Preview" className="h-10 mt-1 object-contain self-start" />}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Button Text</label>
                              <input type="text" value={file.buttonText} onChange={e => updateDlFile(idx, 'buttonText', e.target.value)} placeholder="Download Free APK" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Download Link</label>
                              <input type="text" value={file.downloadLink} onChange={e => updateDlFile(idx, 'downloadLink', e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={handleAddDlFile} className="w-full py-3 rounded-xl font-bold text-xs bg-[#2790FF]/10 text-[#2790FF] border border-dashed border-[#2790FF]/40 hover:bg-[#2790FF]/20 transition-colors cursor-pointer">
                        ＋ Add Another App/File
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <h4 className="font-bold text-base border-b pb-2" style={{ color: t.text, borderColor: t.cardBorder }}>How To Use Guide</h4>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Title</label>
                        <input type="text" value={dlHowToUseTitle} onChange={e => setDlHowToUseTitle(e.target.value)} placeholder="How to Use" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Steps (Write steps, each on a new line)</label>
                        <textarea value={dlHowToUse} onChange={e => setDlHowToUse(e.target.value)} placeholder="Step 1: Do this..." className="w-full px-4 py-3 rounded-xl text-sm outline-none min-h-[100px] resize-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <h4 className="font-bold text-base border-b pb-2" style={{ color: t.text, borderColor: t.cardBorder }}>YouTube Tutorials</h4>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Section Title</label>
                        <input type="text" value={dlYoutubeTitle} onChange={e => setDlYoutubeTitle(e.target.value)} placeholder="Video Tutorial" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                      {dlYoutubeLinks.map((link, idx) => {
                        const title = typeof link === 'string' ? "" : (link.title || "");
                        const url = typeof link === 'string' ? link : (link.url || "");
                        return (
                          <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl border border-dashed" style={{ borderColor: t.cardBorder, background: "rgba(0,0,0,0.02)" }}>
                            <input type="text" value={title} onChange={e => updateYtLink(idx, "title", e.target.value)} placeholder="Video Title (e.g. Tutorial)" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                            <div className="flex items-center gap-2">
                              <input type="text" value={url} onChange={e => updateYtLink(idx, "url", e.target.value)} placeholder="https://youtu.be/..." className="flex-1 px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                              {dlYoutubeLinks.length > 1 && (
                                <button type="button" onClick={() => handleRemoveYtLink(idx)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 shrink-0 cursor-pointer">✕</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <button type="button" onClick={handleAddYtLink} className="w-full py-3 rounded-xl font-bold text-xs bg-[#2790FF]/10 text-[#2790FF] border border-dashed border-[#2790FF]/40 hover:bg-[#2790FF]/20 transition-colors cursor-pointer">
                        ＋ Add Another YouTube Link
                      </button>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-2" style={{ borderColor: t.cardBorder }}>
                      <button type="button" onClick={() => setIsAddingDownload(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-black/10 border border-black/10 hover:bg-black/20 transition-colors cursor-pointer" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: t.text }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={isProcessing} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#2790FF] text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                        {editDownloadId ? "Save Changes" : "Create Download Box"}
                      </button>
                    </div>
                  </form>
                )}
                
                {filteredDownloads.length === 0 && !isAddingDownload ? (
                  <div className="p-10 text-center rounded-2xl border flex flex-col items-center gap-4" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                    <div className="w-16 h-16 rounded-2xl bg-[#2790FF]/15 flex items-center justify-center text-3xl">📦</div>
                    <div>
                      <h4 className="font-bold text-lg" style={{ color: t.text }}>No Download Boxes Found</h4>
                      <p className="text-xs font-semibold mt-1" style={{ color: t.subtext }}>You haven't created any download boxes yet or no results match your search.</p>
                    </div>
                    <button
                      onClick={handleOpenBlankDownloadForm}
                      className="px-6 py-3 rounded-xl font-bold text-sm bg-[#2790FF] text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(39,144,255,0.4)] cursor-pointer mt-2"
                    >
                      ＋ Add First Download Box
                    </button>
                  </div>
                ) : (
                  !isAddingDownload && (
                    <div className="flex flex-col gap-3">
                      {filteredDownloads.map((dl, i) => (
                        <div key={dl.id} className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-black/5" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                          <div className="flex items-center gap-3 w-full">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[#2790FF]/20 text-[#2790FF] border border-[#2790FF]/30 shrink-0">
                              Box #{i + 1}
                            </span>
                            {(dl.files?.[0]?.imageUrl || dl.imageUrl) ? (
                              <img src={dl.files?.[0]?.imageUrl || dl.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-black/10 shrink-0" alt="Icon" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[#2790FF]/20 flex items-center justify-center shrink-0">📦</div>
                            )}
                            <div className="flex flex-col">
                              <h4 className="font-bold text-sm" style={{ color: t.text }}>{dl.files?.[0]?.title || dl.title || "No Title"}</h4>
                              <span className="text-xs font-semibold" style={{ color: t.subtext }}>
                                {dl.files?.length > 1 ? `${dl.files.length} Apps/Files` : (dl.files?.[0]?.category || dl.category)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <button onClick={() => handleStartEditDownload(dl)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#2790FF]/15 text-[#2790FF] hover:bg-[#2790FF]/25 transition-colors cursor-pointer">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteDownload(dl)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors cursor-pointer">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleOpenBlankDownloadForm}
                        className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#2790FF]/10 text-[#2790FF] border border-dashed border-[#2790FF]/40 hover:bg-[#2790FF]/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        <span>＋ Add New Download Box (Box #{filteredDownloads.length + 1} Below)</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            
                                    {/* TAB: NAVBAR ITEMS */}
            {activeTab === "nav" && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="font-bold text-lg text-[#3B82F6] flex items-center gap-2">
                    🔗 Navbar Link Settings
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetDefaultNav}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30 transition-colors cursor-pointer shrink-0"
                    >
                      🔄 Reset Defaults
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNav(!isAddingNav);
                        if (!isAddingNav) {
                          setEditNavId(null);
                          setNavLabel("");
                          setNavHref("");
                        }
                      }}
                      className="px-5 py-2 rounded-xl font-bold text-xs bg-[#3B82F6] text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
                    >
                      {isAddingNav ? "✕ Cancel" : "＋ Add Nav Link"}
                    </button>
                  </div>
                </div>

                {isAddingNav && (
                  <form onSubmit={handleSaveNav} className="p-5 rounded-2xl border flex flex-col gap-4 animate-fade-in" style={{ background: t.cardBg, borderColor: "#3B82F6" }}>
                    <h4 className="font-bold text-sm text-[#3B82F6]">
                      {editNavId ? "✏️ Edit Navbar Item" : "＋ Add New Navbar Item"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>
                          Navbar Button Name (যেমন: Help, Features, Downloads)
                        </label>
                        <input type="text" value={navLabel} onChange={e => setNavLabel(e.target.value)} placeholder="Help" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>
                          Link Section Name / ID (যেমন: faq, features, download, reviews)
                        </label>
                        <input type="text" value={navHref} onChange={e => setNavHref(e.target.value)} placeholder="faq" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} required />
                        <p className="text-[11px] font-medium text-[#3B82F6] opacity-90 mt-0.5">
                          💡 Section ID to scroll to when clicked (e.g., faq, features, download, reviews, hero).
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: t.cardBorder }}>
                      <button type="button" onClick={() => setIsAddingNav(false)} className="px-4 py-2 rounded-xl font-bold text-xs bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer">
                        Cancel
                      </button>
                      <button type="submit" disabled={isProcessing} className="px-5 py-2 rounded-xl font-bold text-xs bg-[#3B82F6] text-white hover:scale-105 transition-transform cursor-pointer">
                        {editNavId ? "Save Changes" : "Add to Navbar"}
                      </button>
                    </div>
                  </form>
                )}

                {navLinks.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                    <p className="text-sm font-semibold" style={{ color: t.subtext }}>No custom navbar links configured. Click "Add Nav Link" to create one.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {navLinks.map((item, i) => (
                      <div key={item.id} className="p-4 rounded-xl border flex items-center justify-between gap-4" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold flex items-center justify-center">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm" style={{ color: t.text }}>{item.label}</p>
                            <p className="text-xs font-mono opacity-60" style={{ color: t.subtext }}>{item.href}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleStartEditNav(item)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#3B82F6]/15 text-[#3B82F6] hover:bg-[#3B82F6]/25 transition-colors cursor-pointer">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteNav(item)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors cursor-pointer">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="flex flex-col gap-8 pb-4">
                {/* Logo Section */}
                <form onSubmit={handleSaveLogo} className="p-5 sm:p-6 rounded-2xl border flex flex-col gap-5 relative z-10 animate-fade-in" style={{ background: t.cardBg, borderColor: "#A855F7" }}>
                  <h3 className="font-bold text-lg text-[#A855F7] mb-2">
                    Header Logo Settings
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5 p-4 rounded-xl border" style={{ borderColor: t.cardBorder, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Light Theme Logo</label>
                        <input type="file" accept="image/*" onChange={handleLightLogoSelect} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#A855F7]/20 file:text-[#A855F7] cursor-pointer" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                        {lightLogoBase64 && (
                          <div className="mt-2 p-2 rounded-lg bg-gray-100 inline-flex items-center justify-center border self-start min-h-[60px] min-w-[60px]">
                            <img src={lightLogoBase64} alt="Light Logo Preview" className="h-12 object-contain text-black text-xs" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 p-4 rounded-xl border" style={{ borderColor: t.cardBorder, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Dark Theme Logo</label>
                        <input type="file" accept="image/*" onChange={handleDarkLogoSelect} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#A855F7]/20 file:text-[#A855F7] cursor-pointer" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                        {darkLogoBase64 && (
                          <div className="mt-2 p-2 rounded-lg bg-zinc-900 inline-flex items-center justify-center border border-zinc-800 self-start min-h-[60px] min-w-[60px]">
                            <img src={darkLogoBase64} alt="Dark Logo Preview" className="h-12 object-contain text-white text-xs" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                    {/* Header Logo Settings Line */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Header Logo Size (px)</label>
                        <input type="number" value={headerLogoSize} onChange={e => handleNumInput(e.target.value, setHeaderLogoSize)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Header Top Padding (px)</label>
                        <input type="number" value={headerLogoPaddingTop} onChange={e => handleNumInput(e.target.value, setHeaderLogoPaddingTop)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Header Left Padding (px)</label>
                        <input type="number" value={headerLogoPaddingLeft} onChange={e => handleNumInput(e.target.value, setHeaderLogoPaddingLeft)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                    </div>

                    {/* Footer Logo Settings Line */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Footer Logo Size (px)</label>
                        <input type="number" value={footerLogoSize} onChange={e => handleNumInput(e.target.value, setFooterLogoSize)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Footer Top Padding (px)</label>
                        <input type="number" value={footerLogoPaddingTop} onChange={e => handleNumInput(e.target.value, setFooterLogoPaddingTop)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Footer Left Padding (px)</label>
                        <input type="number" value={footerLogoPaddingLeft} onChange={e => handleNumInput(e.target.value, setFooterLogoPaddingLeft)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                    </div>

                    {/* ModX Lab Box Logo Settings Line */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>ModX Lab Box Logo Size (px)</label>
                        <input type="number" value={heroLogoSize} onChange={e => handleNumInput(e.target.value, setHeroLogoSize)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>ModX Lab Box Top Padding (px)</label>
                        <input type="number" value={heroLogoPaddingTop} onChange={e => handleNumInput(e.target.value, setHeroLogoPaddingTop)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                    </div>

                    {/* Favicon Settings Line */}
                    <div className="grid grid-cols-1 gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Browser Tab Favicon (Logo) Size (px)</label>
                        <input type="number" value={faviconSize} onChange={e => handleNumInput(e.target.value, setFaviconSize)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                      </div>
                    </div>

                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={isProcessing} className="px-6 py-3 rounded-xl font-bold text-sm bg-[#A855F7] text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      {isProcessing ? "Saving..." : "Save Logo"}
                    </button>
                  </div>
                </form>

                {/* Social Links Section */}
                <form onSubmit={handleSaveSocials} className="p-5 sm:p-6 rounded-2xl border flex flex-col gap-5 relative z-10 animate-fade-in" style={{ background: t.cardBg, borderColor: "#3B82F6" }}>
                  <h3 className="font-bold text-lg text-[#3B82F6] mb-2">
                    Social Links (Footer & Hero Box)
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>Telegram Link</label>
                      <input type="text" value={footerTelegram} onChange={e => setFooterTelegram(e.target.value)} placeholder="https://t.me/..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>WhatsApp Link</label>
                      <input type="text" value={footerWhatsapp} onChange={e => setFooterWhatsapp(e.target.value)} placeholder="https://wa.me/..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.subtext }}>YouTube Link</label>
                      <input type="text" value={footerYoutube} onChange={e => setFooterYoutube(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
                    </div>
                  </div>

                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={isProcessing} className="px-6 py-3 rounded-xl font-bold text-sm bg-[#3B82F6] text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      {isProcessing ? "Saving..." : "Save Social Links"}
                    </button>
                  </div>
                </form>
              </div>
            )}


            {/* TAB 1: FAQ QUESTIONS */}

              {activeTab === "faqs" && (
              <div className="flex flex-col gap-4">
                {filteredFaqs.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                    <p className="text-base font-semibold" style={{ color: t.subtext }}>No FAQ questions found.</p>
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => {
                    const isEditing = editingFaqId === faq.id;

                    return (
                      <div 
                        key={faq.id}
                        className="p-5 sm:p-6 rounded-2xl border transition-all flex flex-col gap-4"
                        style={{ 
                          background: t.cardBg, 
                          borderColor: isEditing ? "#00E5D1" : t.cardBorder,
                          boxShadow: isEditing ? "0 0 20px rgba(0,229,209,0.2)" : "none"
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#00E5D1]/15 text-[#00E5D1] font-bold text-xs flex items-center justify-center shrink-0 border border-[#00E5D1]/30">
                              #{index + 1}
                            </span>
                            <div>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                isDark ? "bg-white/10 text-white/80" : "bg-teal-100 text-teal-900 border border-teal-200"
                              }`}>
                                {faq.isFirestore ? "User / Firebase FAQ" : "Default System FAQ"}
                              </span>
                            </div>
                          </div>

                          {/* Actions buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {!isEditing ? (
                              <>
                                <button
                                  onClick={() => handleStartEditFaq(faq)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2790FF]/20 text-[#2790FF] border border-[#2790FF]/40 hover:bg-[#2790FF] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  ✏️ Edit / Answer
                                </button>
                                <button
                                  onClick={() => handleDeleteFaq(faq)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  🗑️ Delete
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setEditingFaqId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/60 hover:text-white cursor-pointer"
                              >
                                Cancel Edit
                              </button>
                            )}
                          </div>
                        </div>

                        {/* EDIT MODE */}
                        {isEditing ? (
                          <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: t.cardBorder }}>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-[#00E5D1]">Question:</label>
                              <input 
                                type="text"
                                value={editQText}
                                onChange={e => setEditQText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none font-semibold"
                                style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }}
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-[#16CF83]">Answer:</label>
                              <textarea 
                                value={editAText}
                                onChange={e => setEditAText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none min-h-[90px] resize-none"
                                style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }}
                              />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                              <button
                                onClick={() => handleSaveFaq(faq)}
                                disabled={isProcessing}
                                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#16CF83] text-[#151022] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                              >
                                {isProcessing ? "Saving..." : "✓ Save Answer & Changes"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* DISPLAY MODE */
                          <div className="flex flex-col gap-2">
                            <div>
                              <p className={`text-xs font-semibold uppercase mb-1 ${isDark ? "text-white/50" : "text-slate-500 font-bold"}`}>Question:</p>
                              <p className="font-bold text-base sm:text-lg leading-snug" style={{ color: t.text }}>
                                {faq.q}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl mt-1 border" style={{ background: t.surface, borderColor: t.cardBorder }}>
                              <p className="text-xs font-semibold uppercase text-[#16CF83] mb-1">Answer:</p>
                              <p className="text-sm sm:text-base leading-relaxed" style={{ color: t.subtext }}>
                                {faq.a || "(No answer given yet. Click 'Edit / Answer' above to reply to this user.)"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: USER REVIEWS */}
            {activeTab === "reviews" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReviews.length === 0 ? (
                  <div className="col-span-full p-12 text-center rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                    <p className="text-base font-semibold" style={{ color: t.subtext }}>No reviews found.</p>
                  </div>
                ) : (
                  filteredReviews.map((rev) => (
                    <div 
                      key={rev.id}
                      className="p-5 rounded-2xl border flex flex-col justify-between gap-4 relative overflow-hidden"
                      style={{ background: t.cardBg, borderColor: t.cardBorder }}
                    >
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                          {(rev.photoUrl || rev.photo) ? (
                            <img loading="lazy" 
                              src={rev.photoUrl || rev.photo} 
                              alt={rev.name || "User Avatar"} 
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/20 shadow-sm"
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                              style={{ background: rev.initBg || "rgba(123,44,191,0.2)", color: rev.initColor || "#7B2CBF" }}
                            >
                              {rev.init || rev.name?.charAt(0) || "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-base" style={{ color: t.text }}>{rev.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-[#FFB11A]">
                                {"★".repeat(rev.stars || 5)}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                isDark ? "bg-white/10 text-white/80" : "bg-purple-100 text-purple-900 border border-purple-200"
                              }`}>
                                {rev.isFirestore ? "User Firebase" : "System Sample"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteReview(rev)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          🗑️ Delete Review
                        </button>
                      </div>

                      <p className="text-sm leading-relaxed relative z-10" style={{ color: t.text }}>
                        "{rev.text}"
                      </p>

                      {rev.createdAt && (
                        <p className={`text-[10px] text-right font-medium ${isDark ? "text-white/40" : "text-slate-500"}`}>
                          Added: {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* Footer info inside admin modal */}
          <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10 text-xs" style={{ borderColor: t.cardBorder, color: t.subtext }}>
            <span>Admin Security Active • Authorized Account Verification</span>
            <button 
              onClick={onClose}
              className="font-bold underline hover:text-[#00E5D1] cursor-pointer"
            >
              Close Admin Dashboard
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
