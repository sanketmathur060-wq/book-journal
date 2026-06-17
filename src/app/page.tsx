"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, FileSpreadsheet, Image as ImageIcon, Heart, Plus, LogOut, BookOpen, Users, User } from "lucide-react";
import Auth from "../components/Auth";
import Dashboard from "../components/Dashboard";
import Library from "../components/Library";
import SheetLog from "../components/SheetLog";
import Wishlist from "../components/Wishlist";
import AddBook from "../components/AddBook";
import BookDetail from "../components/BookDetail";
import Authors from "../components/Authors";
import Profile from "../components/Profile";
import { GlitterEffect } from "../components/GlitterEffect";
import { Book, UserSession, getBooks, getLocalSession, setLocalSession, saveBook, deleteBook, supabase, getUserProfile, saveUserProfile } from "../lib/db";

type TabType = "dashboard" | "log" | "gallery" | "wishlist" | "authors" | "profile";

const TAB_COLORS = {
  log: {
    bgActive: "bg-[#fff0f3]",
    borderActive: "border-[#ffccd5]",
    textActive: "text-[#800f2f]",
    dot: "bg-[#800f2f]"
  },
  gallery: {
    bgActive: "bg-[#e8fcf7]",
    borderActive: "border-[#b8f2e6]",
    textActive: "text-[#006d5b]",
    dot: "bg-[#2a9d8f]"
  },
  wishlist: {
    bgActive: "bg-[#fff6e0]",
    borderActive: "border-[#ffe1a8]",
    textActive: "text-[#b27200]",
    dot: "bg-[#ffd166]"
  },
  authors: {
    bgActive: "bg-[#f3efff]",
    borderActive: "border-[#dcd3ff]",
    textActive: "text-[#4d2db3]",
    dot: "bg-[#9b5de5]"
  },
  profile: {
    bgActive: "bg-[#fff5f6]",
    borderActive: "border-[#ffccd5]",
    textActive: "text-[#ff4d6d]",
    dot: "bg-[#ff4d6d]"
  },
  dashboard: {
    bgActive: "bg-[#edf6ff]",
    borderActive: "border-[#cce5ff]",
    textActive: "text-[#004e89]",
    dot: "bg-[#00bbf9]"
  }
};

const themes = {
  cozyBinder: {
    name: "Cozy Binder 🧸",
    cssVariables: {
      "--color-planner-base": "#f9f8f3",
      "--color-planner-paper": "#fcfaf5",
      "--color-desk-bg": "#8ba39a",
      "--color-tab-peach": "#f4ebe1",
      "--color-accent-orange": "#fba979",
      "--color-ink-brown": "#4a3f35",
      "--color-ink-gray": "#6b7280",
      "--color-maroon": "#800f2f",
      "--color-pastel-pink": "#fff0f3",
      "--color-spine-color": "#582f0e",
      "--color-spine-border": "#3d1e03"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #a5bcb3 0%, #768d84 100%)",
    glitterColors: ["#800f2f", "#fba979", "#4a3f35", "#ffd166", "#8ba39a"],
    glitterBlendMode: "normal"
  },
  forestOak: {
    name: "Forest Oak 🌿",
    cssVariables: {
      "--color-planner-base": "#f4f3eb",
      "--color-planner-paper": "#faf9f2",
      "--color-desk-bg": "#2c3e2b",
      "--color-tab-peach": "#e5dcc6",
      "--color-accent-orange": "#d4af37",
      "--color-ink-brown": "#1b2e1a",
      "--color-ink-gray": "#4a5d4a",
      "--color-maroon": "#1e4d2b",
      "--color-pastel-pink": "#f0f5f0",
      "--color-spine-color": "#3d2314",
      "--color-spine-border": "#28170d"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #3e5c3c 0%, #20311f 100%)",
    glitterColors: ["#1e4d2b", "#d4af37", "#1b2e1a", "#e5dcc6", "#ffffff"],
    glitterBlendMode: "normal"
  },
  midnightLavender: {
    name: "Midnight Lavender 🌌",
    cssVariables: {
      "--color-planner-base": "#f5f3f7",
      "--color-planner-paper": "#faf8fc",
      "--color-desk-bg": "#2b263d",
      "--color-tab-peach": "#e6e1f0",
      "--color-accent-orange": "#b298dc",
      "--color-ink-brown": "#241e33",
      "--color-ink-gray": "#5e5770",
      "--color-maroon": "#503975",
      "--color-pastel-pink": "#f6f0ff",
      "--color-spine-color": "#1f1a30",
      "--color-spine-border": "#13101e"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #43395c 0%, #1d1929 100%)",
    glitterColors: ["#503975", "#b298dc", "#241e33", "#ffccd5", "#ffffff"],
    glitterBlendMode: "normal"
  },
  sweetSakura: {
    name: "Sweet Sakura 🌸",
    cssVariables: {
      "--color-planner-base": "#fffafb",
      "--color-planner-paper": "#fff5f7",
      "--color-desk-bg": "#dfb2b7",
      "--color-tab-peach": "#fce1e4",
      "--color-accent-orange": "#ffb3c1",
      "--color-ink-brown": "#472c30",
      "--color-ink-gray": "#85585f",
      "--color-maroon": "#c95267",
      "--color-pastel-pink": "#fff0f2",
      "--color-spine-color": "#8c4451",
      "--color-spine-border": "#5c2a33"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #ffd0d5 0%, #ba8a90 100%)",
    glitterColors: ["#c95267", "#ffb3c1", "#472c30", "#ffd166", "#1e3a8a"],
    glitterBlendMode: "normal"
  },
  princessLilac: {
    name: "Princess Lilac 🎀",
    cssVariables: {
      "--color-planner-base": "#faf5ff",
      "--color-planner-paper": "#f3e8ff",
      "--color-desk-bg": "#d8b4fe",
      "--color-tab-peach": "#f3e8ff",
      "--color-accent-orange": "#c084fc",
      "--color-ink-brown": "#3b0764",
      "--color-ink-gray": "#6b21a8",
      "--color-maroon": "#701a75",
      "--color-pastel-pink": "#fae8ff",
      "--color-spine-color": "#581c87",
      "--color-spine-border": "#3b0764"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #f3e8ff 0%, #c084fc 100%)",
    glitterColors: ["#701a75", "#c084fc", "#3b0764", "#ffd166", "#1e3a8a"],
    glitterBlendMode: "normal"
  },
  peachCream: {
    name: "Peach Cream 🍑",
    cssVariables: {
      "--color-planner-base": "#fffaf0",
      "--color-planner-paper": "#ffedd5",
      "--color-desk-bg": "#fed7aa",
      "--color-tab-peach": "#ffedd5",
      "--color-accent-orange": "#fb923c",
      "--color-ink-brown": "#7c2d12",
      "--color-ink-gray": "#9a3412",
      "--color-maroon": "#c2410c",
      "--color-pastel-pink": "#ffedd5",
      "--color-spine-color": "#ea580c",
      "--color-spine-border": "#9a3412"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #ffedd5 0%, #fdba74 100%)",
    glitterColors: ["#c2410c", "#fb923c", "#7c2d12", "#ffedd5", "#1e3a8a"],
    glitterBlendMode: "normal"
  },
  inkMinimalist: {
    name: "Ink Minimalist 🖤",
    cssVariables: {
      "--color-planner-base": "#f8f9fa",
      "--color-planner-paper": "#ffffff",
      "--color-desk-bg": "#495057",
      "--color-tab-peach": "#e9ecef",
      "--color-accent-orange": "#6c757d",
      "--color-ink-brown": "#212529",
      "--color-ink-gray": "#495057",
      "--color-maroon": "#343a40",
      "--color-pastel-pink": "#f1f3f5",
      "--color-spine-color": "#212529",
      "--color-spine-border": "#000000"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #6c757d 0%, #343a40 100%)",
    glitterColors: ["#212529", "#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"],
    glitterBlendMode: "normal"
  },
  gothicVelvet: {
    name: "Gothic Velvet 🥀 (Dark)",
    cssVariables: {
      "--color-planner-base": "#1a1215",
      "--color-planner-paper": "#23181c",
      "--color-desk-bg": "#0c0507",
      "--color-tab-peach": "#3a252c",
      "--color-accent-orange": "#e25c80",
      "--color-ink-brown": "#f5ecef",
      "--color-ink-gray": "#b8a4aa",
      "--color-maroon": "#982c47",
      "--color-pastel-pink": "#2e1e23",
      "--color-spine-color": "#4a0e1c",
      "--color-spine-border": "#1f0308"
    },
    bodyBg: "radial-gradient(circle at 50% 30%, #1e1115 0%, #080305 100%)",
    glitterColors: ["#ff4d6d", "#c95267", "#ffffff", "#ffd166", "#e25c80"],
    glitterBlendMode: "normal"
  }
};

function getSavedPreferences(userEmail: string | undefined): {
  theme: keyof typeof themes;
  layout: "single" | "double";
  glitter: boolean;
} {
  if (typeof window === "undefined") {
    return { theme: "cozyBinder", layout: "single", glitter: true };
  }
  const prefix = userEmail ? `${userEmail}_` : "guest_";
  
  let theme: keyof typeof themes = "cozyBinder";
  const savedTheme = localStorage.getItem(`${prefix}selected-theme`);
  if (savedTheme && savedTheme in themes) {
    theme = savedTheme as keyof typeof themes;
  }

  let layout: "single" | "double" = "single";
  const savedLayout = localStorage.getItem(`${prefix}selected-layout`);
  if (savedLayout === "single" || savedLayout === "double") {
    layout = savedLayout as "single" | "double";
  }

  let glitter = true;
  const savedGlitter = localStorage.getItem(`${prefix}selected-glitter`);
  if (savedGlitter !== null) {
    glitter = savedGlitter === "true";
  }

  return { theme, layout, glitter };
}

export default function Home() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("log");
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleDashboardTabChange = (tab: TabType, status?: string) => {
    setActiveTab(tab);
    setStatusFilter(status || "all");
    setActiveBookId(null);
  };

  // Customizer preferences states
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>("cozyBinder");
  const [layoutMode, setLayoutMode] = useState<"single" | "double">("single");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlitterEnabled, setIsGlitterEnabled] = useState(true);

  const theme = themes[currentTheme];

  const loadUserPreferences = React.useCallback(async (userEmail: string | undefined) => {
    // 1. Load from localStorage immediately for instant UI application
    const prefs = getSavedPreferences(userEmail);
    setCurrentTheme(prefs.theme);
    setLayoutMode(prefs.layout);
    setIsGlitterEnabled(prefs.glitter);

    // 2. Fetch latest settings from database profile if logged in
    if (userEmail) {
      try {
        const profile = await getUserProfile(userEmail);
        if (profile) {
          if (profile.theme && profile.theme in themes && profile.theme !== prefs.theme) {
            setCurrentTheme(profile.theme as keyof typeof themes);
            localStorage.setItem(`${userEmail}_selected-theme`, profile.theme);
          }
          if (profile.layoutMode && (profile.layoutMode === "single" || profile.layoutMode === "double") && profile.layoutMode !== prefs.layout) {
            setLayoutMode(profile.layoutMode as "single" | "double");
            localStorage.setItem(`${userEmail}_selected-layout`, profile.layoutMode);
          }
          if (profile.glitterEnabled !== undefined && profile.glitterEnabled !== prefs.glitter) {
            setIsGlitterEnabled(profile.glitterEnabled);
            localStorage.setItem(`${userEmail}_selected-glitter`, profile.glitterEnabled ? "true" : "false");
          }
        }
      } catch (err) {
        console.error("Failed to sync preferences from DB profile:", err);
      }
    }
  }, []);

  const saveUserPreference = async (key: string, value: string) => {
    if (typeof window === "undefined") return;
    const prefix = session?.email ? `${session.email}_` : "guest_";
    localStorage.setItem(`${prefix}${key}`, value);

    // If logged in, persist settings to the database profile
    if (session?.email) {
      try {
        const profile = await getUserProfile(session.email) || {
          name: session.name || "",
          email: session.email,
          bio: "",
          genres: []
        };
        
        if (key === "selected-theme") {
          profile.theme = value;
        } else if (key === "selected-layout") {
          profile.layoutMode = value;
        } else if (key === "selected-glitter") {
          profile.glitterEnabled = value === "true";
        }
        
        await saveUserProfile(session.email, profile);
      } catch (err) {
        console.error("Error saving preference to profile DB:", err);
      }
    }
  };

  // Dynamically apply background style to body
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.background = theme.bodyBg;
    }
  }, [theme]);

  // Load Session, Initial Books and Preferences on mount & setup auth listener
  useEffect(() => {
    async function init() {
      // 1. Try local session load (IndexedDB fallback / Cached Supabase session)
      const savedSession = await getLocalSession();
      if (savedSession) {
        setSession(savedSession);
        const bookList = await getBooks();
        setBooks(bookList);
      }

      // 2. Load preferences
      loadUserPreferences(savedSession?.email);

      setLoading(false);
    }
    init();

    // 2. Bind Supabase Auth change listeners
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sbSession) => {
        if (sbSession?.user) {
          const newSession: UserSession = {
            email: sbSession.user.email || "",
            name: sbSession.user.user_metadata?.name || "",
            isLocal: false,
            userId: sbSession.user.id
          };
          setSession(newSession);
          await setLocalSession(newSession);
          
          const bookList = await getBooks();
          setBooks(bookList);
          
          loadUserPreferences(newSession.email);
        } else {
          // Null session on signed out events
          if (event === "SIGNED_OUT") {
            setSession(null);
            await setLocalSession(null);
            setBooks([]);
            setActiveBookId(null);
            loadUserPreferences(undefined);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadUserPreferences]);

  const handleAuthSuccess = async (newSession: UserSession) => {
    await setLocalSession(newSession);
    setSession(newSession);
    const bookList = await getBooks();
    setBooks(bookList);
    loadUserPreferences(newSession.email);
  };

  const handleLogout = async () => {
    if (confirm("Lock your digital reading planner?")) {
      if (supabase && !session?.isLocal) {
        await supabase.auth.signOut();
      }
      await setLocalSession(null);
      setSession(null);
      setBooks([]);
      setActiveBookId(null);
      loadUserPreferences(undefined);
    }
  };

  const handleAddBook = async (newBookData: Omit<Book, "id">) => {
    const newBook: Book = {
      ...newBookData,
      id: typeof window !== "undefined" && window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : "123e4567-e89b-12d3-a456-" + Math.random().toString(36).substring(2, 14),
    };
    await saveBook(newBook);
    const updatedBooks = await getBooks();
    setBooks(updatedBooks);
    
    // Switch tabs based on destination
    if (newBook.isWishlist) {
      setActiveTab("wishlist");
    } else {
      setActiveTab("gallery");
    }
  };

  const handleSaveBook = async (updatedBook: Book) => {
    await saveBook(updatedBook);
    const updatedBooks = await getBooks();
    setBooks(updatedBooks);
  };

  const handleDeleteBook = async (id: string) => {
    await deleteBook(id);
    const updatedBooks = await getBooks();
    setBooks(updatedBooks);
    setActiveBookId(null);
  };

  const selectedBook = books.find((b) => b.id === activeBookId);

  if (loading) {
    return (
      <div className="min-h-screen bg-desk-bg flex items-center justify-center font-caveat text-4xl font-bold text-white animate-pulse">
        Opening digital journal...
      </div>
    );
  }

  // Not logged in: Render journal cover passcode screen
  if (!session) {
    return <Auth onSuccess={handleAuthSuccess} />;
  }



  return (
    <div 
      className="min-h-screen p-1 sm:p-4 md:p-8 flex flex-col items-center justify-start relative select-none w-full transition-all duration-300"
      style={theme.cssVariables as React.CSSProperties}
    >
      
      {/* Main Widescreen Planner container with a leather binder spine on the left */}
      <div className="w-full max-w-[1300px] bg-planner-base rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-[#3d1e03]/25 overflow-hidden flex flex-col min-h-[85vh] pl-2 sm:pl-3.5 relative">
        
        {/* Left Book Spine representation */}
        <div className="absolute left-0 top-0 bottom-0 w-2 sm:w-3.5 bg-[var(--color-spine-color)] border-r border-[var(--color-spine-border)]/35 z-20 pointer-events-none" />
        <div className="absolute left-[1px] sm:left-[2px] top-0 bottom-0 w-[1px] bg-white/10 z-20 pointer-events-none" />

        {/* Header toolbar */}
        <header className="bg-maroon text-white px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-black/20 gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base tracking-wider uppercase leading-none truncate">
                Book Tracker
              </h1>
              <span className="text-[8px] sm:text-[10px] text-white/60 font-semibold tracking-widest uppercase block truncate">
                {session.isLocal ? "Local Demo" : `${session.name || session.email}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Customizer settings widget */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="bg-white/15 hover:bg-white/25 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase border border-white/15 flex items-center gap-1 transition-all cursor-pointer hover:scale-[1.01]"
                title="Customize Theme & Layout"
              >
                <span>🎨 Customizer</span>
              </button>
              
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-stone-200 shadow-2xl p-4 z-[99] text-ink-brown space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-caveat text-xl font-bold text-maroon">Planner Customizer</span>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-xs font-bold text-ink-gray hover:text-red-500">✕</button>
                  </div>
                  
                  {/* Theme Select */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-ink-gray uppercase tracking-wider block">Journal Theme</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(themes).map(([key, t]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setCurrentTheme(key as keyof typeof themes);
                            saveUserPreference("selected-theme", key);
                          }}
                          className={`px-2 py-1.5 rounded text-[10px] font-bold text-center border transition-all cursor-pointer ${
                            currentTheme === key
                              ? "bg-maroon text-white border-maroon shadow-sm"
                              : "bg-planner-base text-ink-gray border-[#3d1e03]/10 hover:bg-planner-paper"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Select */}
                  <div className="space-y-2 border-t pt-3">
                    <label className="text-[9px] font-bold text-ink-gray uppercase tracking-wider block">Binder Layout</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setLayoutMode("single");
                          saveUserPreference("selected-layout", "single");
                        }}
                        className={`flex-1 px-3 py-1.5 rounded text-[10px] font-bold text-center border transition-all cursor-pointer ${
                          layoutMode === "single"
                            ? "bg-maroon text-white border-maroon shadow-sm"
                            : "bg-planner-base text-ink-gray border-[#3d1e03]/10 hover:bg-planner-paper"
                        }`}
                      >
                        Single Page
                      </button>
                      <button
                        onClick={() => {
                          setLayoutMode("double");
                          saveUserPreference("selected-layout", "double");
                        }}
                        className={`flex-1 px-3 py-1.5 rounded text-[10px] font-bold text-center border transition-all cursor-pointer ${
                          layoutMode === "double"
                            ? "bg-maroon text-white border-maroon shadow-sm"
                            : "bg-planner-base text-ink-gray border-[#3d1e03]/10 hover:bg-planner-paper"
                        }`}
                      >
                        Double Page
                      </button>
                    </div>
                  </div>

                  {/* Glitter Toggle */}
                  <div className="space-y-2 border-t pt-3 flex justify-between items-center">
                    <div>
                      <label className="text-[9px] font-bold text-ink-gray uppercase tracking-wider block">Glitter Magic ✨</label>
                      <span className="text-[8px] text-ink-gray leading-none block">Shimmering sparkles</span>
                    </div>
                    <button
                      onClick={() => {
                        const next = !isGlitterEnabled;
                        setIsGlitterEnabled(next);
                        saveUserPreference("selected-glitter", next ? "true" : "false");
                      }}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isGlitterEnabled
                          ? "bg-maroon text-white border-maroon shadow-sm"
                          : "bg-planner-base text-ink-gray border-[#3d1e03]/10 hover:bg-planner-paper"
                      }`}
                    >
                      {isGlitterEnabled ? "On" : "Off"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Book trigger */}
            <button
              onClick={() => setIsAddBookOpen(true)}
              className="bg-white hover:bg-white/90 text-maroon font-extrabold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs uppercase shadow flex items-center gap-1 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Book
            </button>

            {/* Logout/Lock icon */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Sign Out / Lock"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </header>

        {/* Workspace Content */}
        {layoutMode === "single" ? (
          <>
            {/* Tab Selection Bar (Divider Index Tabs) */}
            {!selectedBook && (
              <div className="bg-planner-paper px-4 border-b border-[#3d1e03]/10 flex gap-1 pt-3 overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap">
                {[
                  { id: "log", label: "🎀 Log Sheet", icon: FileSpreadsheet },
                  { id: "gallery", label: "🌸 Gallery Grid", icon: ImageIcon },
                  { id: "wishlist", label: "💖 Wishlist", icon: Heart },
                  { id: "authors", label: "🌷 Authors", icon: Users },
                  { id: "profile", label: "✨ Profile", icon: User },
                  { id: "dashboard", label: "🧸 Dashboard", icon: LayoutDashboard },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setStatusFilter("all");
                      }}
                      className={`px-5 py-2.5 rounded-t-xl text-xs font-bold flex flex-shrink-0 items-center gap-2 border-t border-x transition-all duration-200 cursor-pointer relative ${
                        isActive
                          ? "bg-planner-paper text-maroon border-[#3d1e03]/10 border-b-transparent translate-y-[1px] z-10 shadow-[0_-3px_10px_rgba(0,0,0,0.04)]"
                          : "bg-[#dec9b6]/15 text-ink-gray border-transparent hover:bg-[#dec9b6]/35 hover:text-ink-brown"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-maroon scale-100' : 'bg-ink-gray scale-50 opacity-60'} transition-transform`} />
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Scrollable Core Workspace */}
            <main className="flex-1 p-3 sm:p-6 overflow-y-auto no-scrollbar">
              {selectedBook ? (
                <BookDetail
                  book={selectedBook}
                  onBack={() => setActiveBookId(null)}
                  onSave={handleSaveBook}
                  onDelete={handleDeleteBook}
                />
              ) : (
                <>
                  {activeTab === "log" && <SheetLog books={books} onSelectBook={setActiveBookId} initialStatusFilter={statusFilter} />}
                  {activeTab === "gallery" && <Library books={books} onSelectBook={setActiveBookId} initialStatusFilter={statusFilter} />}
                  {activeTab === "wishlist" && (
                    <Wishlist
                      books={books}
                      onSelectBook={setActiveBookId}
                      onUpdateBook={handleSaveBook}
                    />
                  )}
                  {activeTab === "authors" && <Authors books={books} onAddBook={handleAddBook} />}
                  {activeTab === "profile" && <Profile session={session} />}
                  {activeTab === "dashboard" && <Dashboard books={books} onSelectBook={setActiveBookId} onTabChange={handleDashboardTabChange} />}
                </>
              )}
            </main>
          </>
        ) : (
          /* Double page binder layout */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative overflow-hidden">
            
            {/* Metal Spiral Divider (Absolute center of page partition) */}
            <div className="hidden lg:flex absolute left-[25%] top-0 bottom-0 w-8 -translate-x-1/2 flex-col items-center justify-around py-6 z-40 pointer-events-none border-x border-[#3d1e03]/10 bg-planner-paper/10">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-9 h-2.5 bg-gradient-to-r from-stone-400 via-stone-100 to-stone-500 rounded-full border border-stone-600/35 shadow-sm transform -rotate-1" />
              ))}
            </div>

            {/* Left Page (Sidebar Navigation & Overview) */}
            <aside className="lg:col-span-3 bg-planner-paper border-r border-[#3d1e03]/15 p-4 sm:p-5 flex flex-col justify-between gap-6 z-10 overflow-y-auto no-scrollbar">
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-ink-gray uppercase tracking-wider block">Binder Navigation</span>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: "log", label: "🎀 Log Sheet", icon: FileSpreadsheet },
                      { id: "gallery", label: "🌸 Gallery Grid", icon: ImageIcon },
                      { id: "wishlist", label: "💖 Wishlist", icon: Heart },
                      { id: "authors", label: "🌷 Authors Catalog", icon: Users },
                      { id: "profile", label: "✨ Journal Profile", icon: User },
                      { id: "dashboard", label: "🧸 Dashboard Stats", icon: LayoutDashboard },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as TabType);
                            setActiveBookId(null);
                            setStatusFilter("all");
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-3 border cursor-pointer ${
                            isActive
                              ? "bg-planner-base text-maroon border-[#3d1e03]/10 shadow-sm translate-x-1"
                              : "bg-[#dec9b6]/10 text-ink-gray border-transparent hover:bg-[#dec9b6]/25 hover:text-ink-brown"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-maroon scale-100' : 'bg-ink-gray scale-50 opacity-60'} transition-transform`} />
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick stats mini note widget */}
                <div className="bg-planner-base p-4 rounded-xl border border-[#3d1e03]/10 relative overflow-visible mt-2 shadow-inner">
                  {/* Taped sticky note */}
                  <div className="absolute -top-2 left-6 w-12 h-3.5 bg-amber-100/50 backdrop-blur-[0.5px] rotate-[-5deg] border-x border-dashed border-black/5 shadow-sm pointer-events-none" />
                  <span className="font-caveat text-xl font-bold text-maroon block mb-1">Journal Note ✍️</span>
                  <div className="space-y-1.5 text-[10px] font-bold text-ink-brown font-typewriter">
                    <div className="flex justify-between">
                      <span>Total Shelf:</span>
                      <span>{books.filter(b => !b.isWishlist).length} Books</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dream List:</span>
                      <span>{books.filter(b => b.isWishlist).length} Items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yearly Goal:</span>
                      <span>{books.filter(b => !b.isWishlist && b.status === "completed").length} / 30</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-ink-gray font-bold uppercase tracking-wider text-center pt-4 border-t border-[#3d1e03]/10">
                BookTok Digital Journal
              </div>
            </aside>

            {/* Right Page (Main Workspace) */}
            <main className="lg:col-span-9 p-3 sm:p-6 overflow-y-auto no-scrollbar bg-planner-base z-10">
              {selectedBook ? (
                <BookDetail
                  book={selectedBook}
                  onBack={() => setActiveBookId(null)}
                  onSave={handleSaveBook}
                  onDelete={handleDeleteBook}
                />
              ) : (
                <>
                  {activeTab === "log" && <SheetLog books={books} onSelectBook={setActiveBookId} initialStatusFilter={statusFilter} />}
                  {activeTab === "gallery" && <Library books={books} onSelectBook={setActiveBookId} initialStatusFilter={statusFilter} />}
                  {activeTab === "wishlist" && (
                    <Wishlist
                      books={books}
                      onSelectBook={setActiveBookId}
                      onUpdateBook={handleSaveBook}
                    />
                  )}
                  {activeTab === "authors" && <Authors books={books} onAddBook={handleAddBook} />}
                  {activeTab === "profile" && <Profile session={session} />}
                  {activeTab === "dashboard" && <Dashboard books={books} onSelectBook={setActiveBookId} onTabChange={handleDashboardTabChange} />}
                </>
              )}
            </main>

          </div>
        )}

        {/* Footer label */}
        <footer className="bg-planner-paper px-6 py-3 border-t border-[#3d1e03]/10 flex items-center justify-between text-[10px] text-ink-gray font-semibold uppercase flex-shrink-0">
          <span>Copyright © {new Date().getFullYear()} Sanket Mathur. All Rights Reserved.</span>
          <span>{session.isLocal ? "Local Offline Database Active" : "Supabase Cloud Sync Active"}</span>
        </footer>

      </div>

      {/* Add Book central modal dialog */}
      <AddBook
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        onAddBook={handleAddBook}
        books={books}
      />

      {/* Glitter magical particles overlay */}
      {isGlitterEnabled && (
        <GlitterEffect key={currentTheme} colors={theme.glitterColors} intensity={0.4} mixBlendMode={theme.glitterBlendMode} />
      )}

    </div>
  );
}
