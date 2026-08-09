import { useState, useEffect, FormEvent, useRef } from "react";
import { resizeImage } from "../lib/imageUpload";
import { auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Theme } from "../types";
import { dataCache } from "../lib/dataCache";

const getInitialFaqs = () => {
  try {
    const cachedJson = localStorage.getItem("cached_json_faqs");
    const cachedFaqs = localStorage.getItem("cached_faqs");

    let items: any[] = [];
    if (cachedJson) {
      const parsed = JSON.parse(cachedJson);
      if (Array.isArray(parsed)) items = parsed;
    } else if (cachedFaqs) {
      const parsed = JSON.parse(cachedFaqs);
      if (Array.isArray(parsed)) items = parsed;
    }

    return items;
  } catch (e) {}
  return [];
};

export default function FAQSection({ t }: { t: Theme }) {
  const [dbFaqs, setDbFaqs] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isAllFaqsOpen, setIsAllFaqsOpen] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const pendingOpenIdRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubFirestore: any = null;
    
    const loadFaqs = async () => {
      // Load from dataCache first for immediate display
      const docs = await dataCache.getData<any[]>("faqs", []);
      if (Array.isArray(docs)) {
        setDbFaqs(docs);
      }
      
      try {
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        const q = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
        unsubFirestore = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Merge with what's in dataCache
          const staticFaqs = dataCache.cache.get("faqs") || [];
          const existingQs = new Set(fetched.map((f: any) => (f.q || "").trim().toLowerCase()));
          const merged = [...fetched];
          
          if (Array.isArray(staticFaqs)) {
            staticFaqs.forEach((def: any) => {
              if (!existingQs.has((def.q || "").trim().toLowerCase())) {
                merged.push(def);
                existingQs.add((def.q || "").trim().toLowerCase());
              }
            });
          }
          
          setDbFaqs(merged);
        }, (err) => console.warn("Notice loading FAQs:", err));
      } catch (err) {
        console.warn("Could not setup Firestore real-time FAQs", err);
      }
    };
    loadFaqs();
    
    const unsubCache = dataCache.subscribe("faqs", (docs) => {
      if (!unsubFirestore && Array.isArray(docs)) {
        setDbFaqs(docs);
      }
    });
    
    return () => {
      unsubCache();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const allFaqs = dbFaqs;

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!auth.currentUser) {
      const msg = "Please login first to submit a question.";
      setErrorMsg(msg);
      alert(msg);
      return;
    }
    if (!newQuestion.trim() || isSubmitting) return;

    // Client-side 10-minute rate limit check per user (max 2 submissions per 10 minutes)
    const now = Date.now();
    const TEN_MINS = 10 * 60 * 1000;
    const userKey = auth.currentUser?.uid || auth.currentUser?.email || "anon_user";
    const storageKey = `user_submissions_log_${userKey}`;
    const submissionLog: number[] = JSON.parse(localStorage.getItem(storageKey) || "[]")
      .filter((t: number) => now - t < TEN_MINS);

    if (submissionLog.length >= 2) {
      const msg = "⚠️ Rate limit reached: You can submit a maximum of 2 items (reviews or questions) every 10 minutes. Please try again later.";
      setErrorMsg(msg);
      alert(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await resizeImage(imageFile, 1600, 1600, 0.92);
      }
      const payload = {
        q: newQuestion.trim(),
        imageUrl: imageUrl,
        uid: auth.currentUser?.uid || null,
        email: auth.currentUser?.email || null
      };
      
      const res = await fetch("/api/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      let newQuestionObj: any = null;
      if (res.ok) {
        const data = await res.json();
        newQuestionObj = data.item;
      } else if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.error || "⚠️ Rate limit reached: You can submit a maximum of 2 items (reviews or questions) every 10 minutes. Please try again later.";
        setErrorMsg(msg);
        alert(msg);
        setIsSubmitting(false);
        return;
      } else {
        newQuestionObj = {
          id: `q-${Date.now()}`,
          q: newQuestion.trim(),
          a: "Your question has been submitted successfully. Our team will review and answer it shortly.",
          imageUrl: imageUrl,
          createdAt: new Date().toISOString()
        };
      }

      // 2. Also save to Firestore so Admin Panel can see it
      try {
        const { collection, addDoc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        await addDoc(collection(db, "faqs"), {
          q: newQuestion.trim(),
          a: "Submitted and pending review by admin.",
          imageUrl: imageUrl || null,
          uid: auth.currentUser?.uid || null,
          email: auth.currentUser?.email || null,
          createdAt: newQuestionObj.createdAt || new Date().toISOString()
        });
      } catch (fbErr) {
        console.error("Firestore sync error:", fbErr);
      }

            const updatedFaqs = [newQuestionObj, ...dbFaqs];
      setDbFaqs(updatedFaqs);
      dataCache.setLocalData("faqs", updatedFaqs);

      // Record submission timestamp log for this user
      submissionLog.push(now);
      localStorage.setItem(storageKey, JSON.stringify(submissionLog));

      setNewQuestion("");
      setImageFile(null);
      setIsAsking(false);
      if (e.target instanceof HTMLFormElement) e.target.reset();
      setOpenId(newQuestionObj.id);
    } catch (err: any) {


      console.error("Error submitting question:", err);
      const msg = err.message || "An error occurred";
      setErrorMsg(msg);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="faq" className="mt-16 sm:mt-24 px-4 sm:px-8 lg:px-14">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight" style={{ color: t.text }}>Frequently Asked Questions</h2>
          <p className="text-sm font-semibold max-w-xl mx-auto" style={{ color: t.subtext }}>Got questions? We've got answers.</p>
        </div>

        <div className="flex justify-center flex-wrap items-center gap-3.5 mb-6">
          <button 
            onClick={() => setIsAllFaqsOpen(true)}
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            style={{ 
              background: "rgba(22, 207, 131, 0.12)", 
              color: "#16CF83", 
              border: "1px solid rgba(22, 207, 131, 0.3)" 
            }}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Show All Questions ({allFaqs.length})</span>
          </button>

          <button 
            onClick={() => setIsAsking(!isAsking)}
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95 text-[#151022] cursor-pointer"
            style={{ background: "#16CF83" }}
          >
            {isAsking ? "Cancel" : "＋ Ask a Question"}
          </button>
        </div>

        <AnimatePresence>
          {isAsking && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleAsk} className="p-6 rounded-3xl" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                <p className="font-bold text-lg mb-3" style={{ color: t.text }}>Have a new question?</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Type your question here..."
                      className="flex-1 px-5 py-3 rounded-xl outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.border || t.cardBorder}`, color: t.text }}
                      required
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="flex-1 sm:max-w-[200px] px-3 py-3 rounded-xl outline-none text-sm cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#16CF83]/10 file:text-[#16CF83] hover:file:bg-[#16CF83]/20"
                      style={{ background: t.inputBg, border: `1px solid ${t.border || t.cardBorder}`, color: t.text }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl font-bold text-[#151022] transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
                    style={{ background: "#16CF83" }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
                {errorMsg && <div className="mt-2 text-red-500 text-sm font-semibold">{errorMsg}</div>}
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3">
          {allFaqs.slice(0, 10).map((faq, i) => {
            const isOpen = openId === faq.id;
            return (
              <div 
                key={faq.id} 
                className="rounded-2xl overflow-hidden transition-all duration-300 relative group"
                style={{ 
                  background: t.cardBg, 
                  border: isOpen ? `1px solid rgba(22, 207, 131, 0.4)` : `1px solid ${t.cardBorder}`,
                  boxShadow: isOpen ? `0 4px 20px -5px rgba(22, 207, 131, 0.25)` : "none"
                }}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                >
                  <span className="font-bold text-base pr-4 transition-colors duration-300" style={{ color: isOpen ? "#16CF83" : t.text }}>{faq.q}</span>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0"
                    style={{
                      background: isOpen ? "rgba(22, 207, 131, 0.15)" : "rgba(22, 207, 131, 0.05)",
                      color: isOpen ? "#16CF83" : t.subtext,
                      border: isOpen ? "1px solid rgba(22, 207, 131, 0.3)" : "1px solid transparent",
                      transform: isOpen ? 'rotate(180deg)' : 'none'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-2">
                        <p className="text-sm font-medium leading-relaxed" style={{ color: t.subtext }}>{faq.a}</p>
                        {faq.imageUrl && (
                          <div className="mt-4 flex justify-start">
                            <img 
                              src={faq.imageUrl} 
                              alt="FAQ Attachment" 
                              className="max-w-full sm:max-w-md h-auto rounded-xl cursor-pointer hover:opacity-80 transition-opacity" 
                              style={{ maxHeight: '350px', objectFit: 'contain', border: `1px solid ${t.cardBorder}` }} 
                              onClick={(e) => { e.stopPropagation(); setFullscreenImage(faq.imageUrl); }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isAllFaqsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsAllFaqsOpen(false); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl max-h-[85vh] rounded-3xl p-6 sm:p-8 flex flex-col gap-5 border shadow-2xl overflow-hidden relative"
              style={{ background: t.cardBg, borderColor: t.cardBorder }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black" style={{ color: t.text }}>
                    All Questions & Answers ({allFaqs.length})
                  </h3>
                  <p className="text-xs font-semibold mt-1" style={{ color: t.subtext }}>
                    Browse all asked questions and community answers.
                  </p>
                </div>
                <button
                  onClick={() => setIsAllFaqsOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all hover:bg-black/10 cursor-pointer"
                  style={{ color: t.subtext }}
                >
                  ✕
                </button>
              </div>

              {/* Search input in modal */}
              <div className="relative">
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search questions or answers..."
                  className="w-full px-5 py-3 rounded-xl text-sm outline-none border font-medium"
                  style={{ background: t.inputBg, borderColor: t.cardBorder, color: t.text }}
                />
                {faqSearch && (
                  <button
                    onClick={() => setFaqSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
                    style={{ color: t.text }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Scrollable Questions List */}
              <div className="overflow-y-auto flex flex-col gap-3 pr-1 max-h-[55vh]">
                {allFaqs
                  .filter(f => !faqSearch || (f.q || "").toLowerCase().includes(faqSearch.toLowerCase()) || (f.a && f.a.toLowerCase().includes(faqSearch.toLowerCase())))
                  .map((faq) => {
                    const isOpen = openId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl overflow-hidden transition-all duration-300 relative border"
                        style={{
                          background: t.cardBg,
                          borderColor: isOpen ? "rgba(22, 207, 131, 0.4)" : t.cardBorder,
                          boxShadow: isOpen ? "0 4px 20px -5px rgba(22, 207, 131, 0.25)" : "none"
                        }}
                      >
                        <button
                          onClick={() => setOpenId(isOpen ? null : faq.id)}
                          className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                        >
                          <span className="font-bold text-sm sm:text-base pr-2" style={{ color: isOpen ? "#16CF83" : t.text }}>
                            {faq.q}
                          </span>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300"
                            style={{
                              background: isOpen ? "rgba(22, 207, 131, 0.15)" : "rgba(22, 207, 131, 0.05)",
                              color: isOpen ? "#16CF83" : t.subtext,
                              transform: isOpen ? "rotate(180deg)" : "none"
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: t.cardBorder }}>
                                <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: t.subtext }}>
                                  {faq.a}
                                </p>
                                {faq.imageUrl && (
                                  <div className="mt-3 flex justify-start">
                                    <img
                                      src={faq.imageUrl}
                                      alt="FAQ Attachment"
                                      className="max-w-full sm:max-w-xs h-auto rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                      style={{ maxHeight: "250px", objectFit: "contain", border: `1px solid ${t.cardBorder}` }}
                                      onClick={(e) => { e.stopPropagation(); setFullscreenImage(faq.imageUrl); }}
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullscreenImage}
              alt="Fullscreen FAQ"
              className="w-full h-full object-contain rounded-xl"
            />
            <button 
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur"
              onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
