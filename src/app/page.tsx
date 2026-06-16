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
import { Book, UserSession, getBooks, getLocalSession, setLocalSession, saveBook, deleteBook, supabase } from "../lib/db";

type TabType = "dashboard" | "log" | "gallery" | "wishlist" | "authors" | "profile";

export default function Home() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("log");
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Session and Initial Books on mount & setup auth listener
  useEffect(() => {
    async function init() {
      // 1. Try local session load (IndexedDB fallback / Cached Supabase session)
      const savedSession = await getLocalSession();
      if (savedSession) {
        setSession(savedSession);
        const bookList = await getBooks();
        setBooks(bookList);
      }
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
        } else {
          // Null session on signed out events
          if (event === "SIGNED_OUT") {
            setSession(null);
            await setLocalSession(null);
            setBooks([]);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleAuthSuccess = async (newSession: UserSession) => {
    await setLocalSession(newSession);
    setSession(newSession);
    const bookList = await getBooks();
    setBooks(bookList);
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
    <div className="min-h-screen bg-desk-bg p-1 sm:p-4 md:p-8 flex flex-col items-center justify-start relative select-none">
      
      {/* Main Widescreen Planner container */}
      <div className="w-full max-w-[1300px] bg-planner-base rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-[#3d1e03]/25 overflow-hidden flex flex-col min-h-[85vh]">
        
        {/* Header toolbar */}
        <header className="bg-[#800f2f] text-white px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-black/20 gap-2 flex-shrink-0">
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

        {/* Tab Selection Bar (Divider Index Tabs) */}
        {!selectedBook && (
          <div className="bg-planner-paper px-4 border-b border-[#3d1e03]/10 flex gap-1 pt-3 overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap">
            {[
              { id: "log", label: "Log Sheet", icon: FileSpreadsheet },
              { id: "gallery", label: "Gallery Grid", icon: ImageIcon },
              { id: "wishlist", label: "Wishlist", icon: Heart },
              { id: "authors", label: "Authors", icon: Users },
              { id: "profile", label: "Profile", icon: User },
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-5 py-2.5 rounded-t-xl text-xs font-bold flex flex-shrink-0 items-center gap-2 border-t border-x transition-all cursor-pointer ${
                    isActive
                      ? "bg-planner-base text-maroon border-[#3d1e03]/15 border-b-planner-base translate-y-[1px] z-10"
                      : "bg-[#dec9b6]/20 text-ink-gray border-transparent hover:bg-[#dec9b6]/45"
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
              {activeTab === "log" && <SheetLog books={books} onSelectBook={setActiveBookId} />}
              {activeTab === "gallery" && <Library books={books} onSelectBook={setActiveBookId} />}
              {activeTab === "wishlist" && (
                <Wishlist
                  books={books}
                  onSelectBook={setActiveBookId}
                  onUpdateBook={handleSaveBook}
                />
              )}
              {activeTab === "authors" && <Authors books={books} onAddBook={handleAddBook} />}
              {activeTab === "profile" && <Profile session={session} />}
              {activeTab === "dashboard" && <Dashboard books={books} onSelectBook={setActiveBookId} />}
            </>
          )}
        </main>

        {/* Footer label */}
        <footer className="bg-planner-paper px-6 py-3 border-t border-[#3d1e03]/10 flex items-center justify-between text-[10px] text-ink-gray font-semibold uppercase flex-shrink-0">
          <span>Digital BookTok Journal</span>
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

    </div>
  );
}
