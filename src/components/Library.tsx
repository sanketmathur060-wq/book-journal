"use client";

import React, { useState, useEffect } from "react";
import { Star, Search, BookOpen, Sparkles, Paintbrush } from "lucide-react";
import { Book, getOptimizedCoverUrl, saveUserProfile, getUserProfile } from "../lib/db";

interface LibraryProps {
  books: Book[];
  onSelectBook: (id: string) => void;
  initialStatusFilter?: string;
}

type FilterType = "status" | "genre" | "rating" | "source" | "year" | null;

const SPINE_GRADIENTS = [
  "from-[#ffccd5] to-[#ffb3c1] text-[#472c30]",
  "from-[#c8b6ff] to-[#bdb2ff] text-[#2a1d47]",
  "from-[#ffd8be] to-[#ffb3c1] text-[#422d3b]",
  "from-[#e2e2e9] to-[#dcd6f7] text-[#332a56]",
  "from-[#e8fccf] to-[#b9f2e6] text-[#1a3832]",
  "from-[#ffccd5] to-[#ffb3c1] text-[#4d2c32]",
  "from-[#fae1dd] to-[#f0e6ef] text-[#473e46]",
  "from-[#ffd166] to-[#fba979] text-[#422310]",
];

const DECORATION_CATEGORIES = [
  { name: "Plants", items: ["🪴", "🌵", "🌿", "🌸", "🌷", "🌹", "🌻", "🌺", "🌾", "🍀", "🍄", "🌴", "🌲", "🌳", "🍃", "🍁"] },
  { name: "Vintage & Desk", items: ["🕰️", "📻", "🕯️", "🏺", "🗿", "🧸", "☕", "🍵", "🫖", "🎨", "🎭", "🔮", "📜", "✒️", "🖋️", "🖌️", "🧮", "☎️", "📸", "🪔", "🧭", "🗝️", "🪙", "📺"] },
  { name: "Pets & Critters", items: ["🐈", "🐈‍⬛", "🐕", "🐩", "🐇", "🐹", "🦦", "🐿️", "🦔", "🦇", "🦉", "🦅", "🦆", "🦩", "🦚", "🦜", "🐸", "🐢", "🦕", "🦖", "🦋", "🐞", "🐝", "🐌"] },
  { name: "Space & Magic", items: ["🌙", "🪐", "🌟", "💫", "☄️", "🔮", "🧿", "🪬", "🪄", "✨", "⚡", "💎", "👑", "🦄", "🐉", "🐲"] },
  { name: "Treats", items: ["🍎", "🍓", "🍒", "🥐", "🥖", "🧀", "🥞", "🧁", "🍰", "🎂", "🍫", "🍬", "🍭", "🍮", "🍯", "🍷", "🥂", "🍹", "🥤", "🧋", "🧉"] },
  { name: "Hobbies", items: ["🎸", "🎹", "🎻", "🎺", "🎷", "🎧", "🎼", "🎮", "🎲", "🧩", "♟️", "🎳", "🎬", "🧶", "🧵", "🪡", "🖼️", "🛹"] },
  { name: "Misc", items: ["💀", "👽", "🤖", "👻", "🎃", "🎁", "🎀", "🎈", "🎏", "🎐", "🧧", "🎎", "🪆", "🏮", "🪭", "🧺", "🧹"] },
];

type DecorItem = { id: string; emoji: string; style: string; scale?: number };
type PlacedDecorations = { [bookId: string]: DecorItem[] };

const getDecorStyle = (emoji: string) => {
  // Giant items (Plants, Statues, TVs) - approx book size
  if (["🪴", "🏺", "🗿", "📺", "📻", "🐈", "🐈‍⬛", "🐕", "🦖", "🦕", "🌲", "🌳"].includes(emoji)) {
    return "text-[70px] sm:text-[95px] leading-none filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)]";
  }
  // Small items (Candles, keys, bugs) - half book size
  if (["☕", "🍵", "🕯️", "🗝️", "🪙", "🐌", "🐞", "🦋"].includes(emoji)) {
    return "text-[40px] sm:text-[50px] leading-none mb-1 filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]";
  }
  // Standard items - most decorations
  return "text-[55px] sm:text-[75px] leading-none mb-0.5 filter drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]";
};

export default function Library({ books, onSelectBook, initialStatusFilter = "all" }: LibraryProps) {
  const libraryBooks = books.filter((b) => !b.isWishlist);

  const [prevInitialFilter, setPrevInitialFilter] = useState(initialStatusFilter);
  const [statusVal, setStatusVal] = useState<string>(initialStatusFilter);

  if (initialStatusFilter !== prevInitialFilter) {
    setPrevInitialFilter(initialStatusFilter);
    setStatusVal(initialStatusFilter);
  }

  const [activeFilterTab, setActiveFilterTab] = useState<FilterType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreVal, setGenreVal] = useState<string>("all");
  const [ratingVal, setRatingVal] = useState<number | "all">("all");
  const [sourceVal, setSourceVal] = useState<string>("all");
  const [yearVal, setYearVal] = useState<string>("all");
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);

  // Custom Decoration State
  const [decorations, setDecorations] = useState<PlacedDecorations>({});
  const [isDecorating, setIsDecorating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ emoji: string; style: string } | null>(null);
  
  const [userEmail, setUserEmail] = useState<string>("local-user@booktok.app");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasGeneratedDefaults, setHasGeneratedDefaults] = useState(false);

  // Load decorations from database on mount
  useEffect(() => {
    import("../lib/db").then(({ getLocalSession, getUserProfile }) => {
      getLocalSession().then(session => {
        const email = session?.email || "local-user@booktok.app";
        setUserEmail(email);
        getUserProfile(email).then(profile => {
          if (profile?.shelfDecorations) {
            try { 
              const parsed = JSON.parse(profile.shelfDecorations);
              setDecorations(parsed); 
              setHasGeneratedDefaults(true); // Respect their saved state, even if it is completely empty
            } catch (e) {}
          }
          setIsLoaded(true);
        });
      });
    });
  }, []);

  // Generate defaults once books are loaded
  useEffect(() => {
    if (isLoaded && !hasGeneratedDefaults && books.length > 0) {
      const defaultDecors: PlacedDecorations = {};
      defaultDecors['start'] = [{ id: 'def_start', emoji: '🪴', style: '', scale: 1.1 }];
      
      const validBooks = books.filter(b => !b.isWishlist);
      if (validBooks.length > 3) defaultDecors[validBooks[2].id] = [{ id: 'def_1', emoji: '🕯️', style: '', scale: 1.2 }];
      if (validBooks.length > 7) defaultDecors[validBooks[6].id] = [{ id: 'def_2', emoji: '🕰️', style: '', scale: 1 }];
      if (validBooks.length > 12) defaultDecors[validBooks[11].id] = [{ id: 'def_3', emoji: '☕', style: '', scale: 1.1 }];
      if (validBooks.length > 18) defaultDecors[validBooks[17].id] = [{ id: 'def_4', emoji: '🌿', style: '', scale: 1.3 }];

      setDecorations(defaultDecors);
      setHasGeneratedDefaults(true);
      
      // Auto-save the defaults so they persist
      import("../lib/db").then(({ saveUserProfile }) => {
        saveUserProfile(userEmail, { shelfDecorations: JSON.stringify(defaultDecors) });
      });
    }
  }, [isLoaded, hasGeneratedDefaults, books, userEmail]);

  const handleToggleDecorating = async () => {
    const isNowDecorating = !isDecorating;
    setIsDecorating(isNowDecorating);
    
    // Save to database when user clicks "DONE DECORATING"
    if (!isNowDecorating && isLoaded) {
      try {
        await saveUserProfile(userEmail, { shelfDecorations: JSON.stringify(decorations) });
      } catch (err) {
        console.error("Failed to save decorations to database", err);
      }
    }
  };

  const handleScatterRandom = () => {
    // Start with a fresh empty shelf to avoid stacking items
    const newDecors: PlacedDecorations = {};
    const allAvailableEmojis = DECORATION_CATEGORIES.flatMap(cat => cat.items);
    
    // Random item at the very start
    newDecors['start'] = [{ 
      id: `rand_${Date.now()}_start`, 
      emoji: allAvailableEmojis[Math.floor(Math.random() * allAvailableEmojis.length)], 
      style: '', scale: 1.1 
    }];
    
    const validBooks = books.filter(b => !b.isWishlist);
    
    validBooks.forEach((b, i) => {
      // Place an item every 4 books to guarantee ~3 items per row on most screens
      if (i > 0 && i % 4 === 0) {
         const decorEmoji = allAvailableEmojis[Math.floor(Math.random() * allAvailableEmojis.length)];
         // Slight random offset so it feels organic
         const targetId = (Math.random() > 0.3 && i < validBooks.length - 1) ? validBooks[i+1].id : b.id;
         newDecors[targetId] = [{ id: `rand_${Date.now()}_${i}`, emoji: decorEmoji, style: '', scale: 1.1 }];
      }
    });
    setDecorations(newDecors);
  };

  const allGenres = Array.from(new Set(libraryBooks.flatMap((b) => b.genres || []).filter(Boolean)));
  const allSources = Array.from(new Set(libraryBooks.map((b) => b.source).filter(Boolean)));
  const allYears = Array.from(new Set(libraryBooks.map((b) => (b.endDate ? new Date(b.endDate).getFullYear().toString() : "")).filter(Boolean)));

  const toggleFilterTab = (tab: FilterType) => setActiveFilterTab(activeFilterTab === tab ? null : tab);

  const filteredBooks = libraryBooks.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusVal === "all" || book.status === statusVal;
    const matchesGenre = genreVal === "all" || (book.genres && book.genres.includes(genreVal));
    const matchesRating = ratingVal === "all" || book.rating === ratingVal;
    const matchesSource = sourceVal === "all" || book.source === sourceVal;
    const bookYear = book.endDate ? new Date(book.endDate).getFullYear().toString() : "";
    const matchesYear = yearVal === "all" || bookYear === yearVal;
    return matchesSearch && matchesStatus && matchesGenre && matchesRating && matchesSource && matchesYear;
  });

  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, emoji: string, style: string) => {
    setDraggedItem({ emoji, style });
    e.dataTransfer.setData("text/plain", emoji);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const newItem: DecorItem = {
      id: `decor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emoji: draggedItem.emoji,
      style: draggedItem.style
    };

    setDecorations(prev => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), newItem]
    }));
    setDraggedItem(null);
  };

  const removeDecoration = (targetId: string, decorId: string) => {
    setDecorations(prev => ({
      ...prev,
      [targetId]: (prev[targetId] || []).filter(d => d.id !== decorId)
    }));
  };

  const updateDecorationScale = (targetId: string, decorId: string, newScale: number) => {
    setDecorations(prev => ({
      ...prev,
      [targetId]: (prev[targetId] || []).map(d => 
        d.id === decorId ? { ...d, scale: newScale } : d
      )
    }));
  };

  const DropZone = ({ targetId }: { targetId: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    if (!isDecorating) return null;
    
    return (
      <div 
        className={`h-[210px] flex items-end pb-[30px] justify-center transition-all duration-300 z-50 shrink-0 ${isHovered ? "w-20 mx-2" : "w-8 mx-0"}`}
        onDragOver={(e) => { handleDragOver(e); setIsHovered(true); }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={(e) => { handleDrop(e, targetId); setIsHovered(false); }}
      >
        <div className={`h-full w-full rounded-xl border-4 border-dashed transition-all ${isHovered ? "border-amber-400 bg-amber-400/20 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.6)]" : "border-white/40 bg-white/10 hover:border-amber-200"}`} />
      </div>
    );
  };

  // Build the fluid array of React elements
  const shelfFlow: React.ReactNode[] = [];
  
  // 1. Render decorations before the first book
  (decorations['start'] || []).forEach(decor => {
    const currentScale = decor.scale ?? 1;
    shelfFlow.push(
      <div key={decor.id} className="h-[210px] flex items-end pb-[30px] px-2 shrink-0 group relative z-10">
        {isDecorating && (
          <div className="absolute top-[50px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 z-50 transition-opacity bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border border-amber-200">
            <button onClick={() => removeDecoration('start', decor.id)} className="bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold shadow hover:scale-110 hover:bg-red-600 transition-all flex items-center justify-center">✕</button>
            <input type="range" min="0.3" max="2.5" step="0.1" value={currentScale} onChange={(e) => updateDecorationScale('start', decor.id, parseFloat(e.target.value))} className="w-16 h-1 accent-amber-500 cursor-ew-resize" title="Resize item" />
          </div>
        )}
        <div style={{ transform: `scale(${currentScale})`, transformOrigin: 'bottom' }} className="transition-transform">
          <div className={`${getDecorStyle(decor.emoji)} group-hover:rotate-6 transition-transform origin-bottom`}>{decor.emoji}</div>
        </div>
      </div>
    );
  });

  if (isDecorating) shelfFlow.push(<DropZone key="drop-start" targetId="start" />);

  // 2. Loop through books
  filteredBooks.forEach((book, idx) => {
    const hash = getHash(book.title + book.id);
    const gradient = SPINE_GRADIENTS[hash % SPINE_GRADIENTS.length];
    
    // Spine dimensions
    const targetHeight = 115 + (hash % 45); // 115px to 160px
    const targetWidth = 25 + (hash % 18); // 25px to 43px

    let shapeClass = "rounded-[2px]";
    if (hash % 3 === 0) shapeClass = "rounded-t-[14px] rounded-b-[3px]";
    else if (hash % 3 === 1) shapeClass = "rounded-t-[6px] rounded-b-[4px]";

    let leaningClass = "";
    if (hash % 7 === 0) leaningClass = "rotate-[4deg] origin-bottom-left translate-x-[2px] translate-y-[-1px]";
    else if (hash % 9 === 0) leaningClass = "rotate-[-4deg] origin-bottom-right translate-x-[-2px] translate-y-[-1px]";

    shelfFlow.push(
      <div key={book.id} className="h-[210px] flex items-end pb-[30px] px-[1px] sm:px-[2px] shrink-0 z-20">
        <div
          onClick={() => { if (hoveredBook?.id === book.id) onSelectBook(book.id); else setHoveredBook(book); }}
          onMouseEnter={() => setHoveredBook(book)}
          className={`relative group cursor-pointer transition-all duration-300 ease-out transform hover:-translate-y-6 sm:hover:-translate-y-8 hover:scale-105 sm:hover:scale-110 active:scale-[0.96] hover:shadow-[0_0_20px_rgba(255,215,0,0.7)] hover:z-30 ${leaningClass} overflow-visible flex-shrink-0`}
          style={{ width: `calc(var(--shelf-scale, 1) * ${targetWidth}px)`, height: `calc(var(--shelf-scale, 1) * ${targetHeight}px)` }}
        >
          {/* Spine Container */}
          <div
            className={`w-full h-full relative flex flex-col justify-between items-center py-2 sm:py-3 overflow-hidden ${shapeClass} shadow-[inset_4px_0_10px_rgba(255,255,255,0.3),inset_-6px_0_12px_rgba(0,0,0,0.5),6px_12px_10px_-2px_rgba(0,0,0,0.6)] ${!book.coverUrl ? 'bg-gradient-to-b ' + gradient : 'bg-stone-900'}`}
          >
            {book.coverUrl ? (
              <>
                <img src={getOptimizedCoverUrl(book.coverUrl, 100)} alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-70 mix-blend-lighten" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              </>
            ) : (
              <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
            )}
            
            <div className="absolute top-0 left-1 right-1 h-1 bg-[#fdfbf7] rounded-t-full shadow-inner opacity-40 z-10"></div>
            
            <div className="w-full flex flex-col gap-[2px] items-center opacity-90 z-10 mt-1">
              <div className="w-[85%] h-[2px] bg-gradient-to-r from-amber-300 via-amber-200 to-amber-500 shadow-sm"></div>
              <div className="w-[85%] h-[1px] bg-gradient-to-r from-amber-300 via-amber-200 to-amber-500 shadow-sm"></div>
            </div>
            
            <div className="[writing-mode:vertical-rl] text-center font-caveat text-[11px] sm:text-[13px] font-extrabold tracking-wider line-clamp-1 max-h-[70%] select-none leading-none scale-y-[-1] rotate-180 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-white pb-2">
              {book.title}
            </div>
            
            <div className="absolute inset-y-0 left-1 w-[4px] bg-gradient-to-r from-white/40 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-[6px] bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </div>
    );

    // Render decorations placed AFTER this book
    (decorations[book.id] || []).forEach(decor => {
      const currentScale = decor.scale ?? 1;
      shelfFlow.push(
        <div key={decor.id} className="h-[210px] flex items-end pb-[30px] px-2 shrink-0 group relative z-10">
          {isDecorating && (
            <div className="absolute top-[50px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 z-50 transition-opacity bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border border-amber-200">
              <button onClick={() => removeDecoration(book.id, decor.id)} className="bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold shadow hover:scale-110 hover:bg-red-600 transition-all flex items-center justify-center">✕</button>
              <input type="range" min="0.3" max="2.5" step="0.1" value={currentScale} onChange={(e) => updateDecorationScale(book.id, decor.id, parseFloat(e.target.value))} className="w-16 h-1 accent-amber-500 cursor-ew-resize" title="Resize item" />
            </div>
          )}
          <div style={{ transform: `scale(${currentScale})`, transformOrigin: 'bottom' }} className="transition-transform">
            <div className={`${getDecorStyle(decor.emoji)} group-hover:rotate-6 transition-transform origin-bottom`}>{decor.emoji}</div>
          </div>
        </div>
      );
    });

    if (isDecorating) shelfFlow.push(<DropZone key={`drop-${book.id}`} targetId={book.id} />);
  });

  return (
    <div className="space-y-6 select-none overflow-visible relative">
      
      {/* 1. Search and Filters Header */}
      <div className="bg-[#fff0f3] p-4 rounded-xl border border-[#ffccd5] shadow-sm space-y-3 z-30 relative">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-gray" />
            <input
              type="text"
              placeholder="Search library book title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-planner-paper border border-[#3d1e03]/10 rounded-lg text-xs text-ink-brown focus:outline-none focus:border-maroon"
            />
          </div>
          
          <button
            onClick={handleToggleDecorating}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 text-xs font-extrabold shadow-sm ${
              isDecorating ? "bg-amber-500 text-white border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse" : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
            }`}
          >
            <Paintbrush className="w-4 h-4" /> {isDecorating ? "DONE DECORATING" : "DECORATE SHELF"}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 border-t border-stone-100 pt-3 text-[10px] font-bold">
          {[
            { id: "status", label: "STATUS", active: statusVal !== "all" },
            { id: "genre", label: "GENRE", active: genreVal !== "all" },
            { id: "rating", label: "RATING", active: ratingVal !== "all" },
            { id: "source", label: "SOURCE", active: sourceVal !== "all" },
            { id: "year", label: "FINISHED YEAR", active: yearVal !== "all" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => toggleFilterTab(tab.id as FilterType)}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer border ${activeFilterTab === tab.id ? "bg-maroon text-white border-maroon shadow-sm" : tab.active ? "bg-[#ffccd5] text-maroon border-maroon/20" : "bg-planner-paper text-ink-brown border-[#3d1e03]/10 hover:bg-[#fff0f3]"}`}
            >
              {tab.label} {tab.active && "•"}
            </button>
          ))}
          {(statusVal !== "all" || genreVal !== "all" || ratingVal !== "all" || sourceVal !== "all" || yearVal !== "all") && (
            <button onClick={() => { setStatusVal("all"); setGenreVal("all"); setRatingVal("all"); setSourceVal("all"); setYearVal("all"); setActiveFilterTab(null); }} className="px-2.5 py-1 text-ink-gray hover:text-red-600 underline transition-colors cursor-pointer ml-auto">Reset</button>
          )}
        </div>

        {activeFilterTab && (
          <div className="bg-planner-paper p-3 rounded-lg border border-[#3d1e03]/10 flex flex-wrap gap-1.5 animate-fadeIn">
            {activeFilterTab === "status" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Status:</span>
                {["all", "want_to_read", "reading", "completed"].map((st) => (
                  <button key={st} onClick={() => setStatusVal(st)} className={`px-2.5 py-1 rounded text-xs font-semibold ${statusVal === st ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>
                    {st === "all" ? "All" : st.replace(/_/g, " ").toUpperCase()}
                  </button>
                ))}
              </>
            )}
            {activeFilterTab === "genre" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Genre:</span>
                <button onClick={() => setGenreVal("all")} className={`px-2.5 py-1 rounded text-xs font-semibold ${genreVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>All Genres</button>
                {allGenres.map((g) => <button key={g} onClick={() => setGenreVal(g)} className={`px-2.5 py-1 rounded text-xs font-semibold ${genreVal === g ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>{g}</button>)}
              </>
            )}
            {activeFilterTab === "rating" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Rating:</span>
                <button onClick={() => setRatingVal("all")} className={`px-2.5 py-1 rounded text-xs font-semibold ${ratingVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>All Ratings</button>
                {[5, 4, 3, 2, 1].map((r) => <button key={r} onClick={() => setRatingVal(r)} className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${ratingVal === r ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>{r} ★</button>)}
              </>
            )}
            {activeFilterTab === "source" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Source:</span>
                <button onClick={() => setSourceVal("all")} className={`px-2.5 py-1 rounded text-xs font-semibold ${sourceVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>All Sources</button>
                {allSources.map((s) => <button key={s} onClick={() => setSourceVal(s)} className={`px-2.5 py-1 rounded text-xs font-semibold ${sourceVal === s ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>{s}</button>)}
              </>
            )}
            {activeFilterTab === "year" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Finish Year:</span>
                <button onClick={() => setYearVal("all")} className={`px-2.5 py-1 rounded text-xs font-semibold ${yearVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>All Years</button>
                {allYears.map((y) => <button key={y} onClick={() => setYearVal(y)} className={`px-2.5 py-1 rounded text-xs font-semibold ${yearVal === y ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"}`}>{y}</button>)}
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Bookshelf & Side Spotlight Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-visible">
        
        {/* Left column: The Fluid 3D Bookcase */}
        <div 
           className={`lg:col-span-8 border-[6px] border-[#2b1408] rounded-2xl shadow-[inset_0_0_80px_rgba(0,0,0,0.9),0_15px_30px_rgba(0,0,0,0.3)] relative overflow-hidden [--shelf-scale:0.75] sm:[--shelf-scale:1] transition-all duration-500 ${isDecorating ? 'ring-4 ring-amber-400 ring-opacity-50 scale-[0.98]' : ''}`}
           style={{
             minHeight: "840px",
             backgroundColor: "#1f0f06", // Deep, rich mahogany base color for backboard
             backgroundImage: `
               repeating-linear-gradient(
                 to bottom,
                 transparent 0px,
                 transparent 180px,
                 #5c3218 180px,
                 #4d2913 182px,
                 #381b0a 182px,
                 #1c0c04 198px,
                 rgba(0,0,0,0.9) 198px,
                 rgba(0,0,0,0.3) 206px,
                 transparent 210px
               ),
               repeating-linear-gradient(
                 to right,
                 transparent 0px,
                 transparent 98px,
                 rgba(0,0,0,0.6) 99px,
                 rgba(255,255,255,0.03) 100px,
                 transparent 101px
               ),
               url('https://www.transparenttextures.com/patterns/wood-pattern.png')
             `,
             backgroundSize: "100% 210px, 100px 100%, 150px 150px"
           }}
        >
          {/* Side trims */}
          <div className="absolute top-0 bottom-0 left-0 w-3 sm:w-5 bg-[#2b1408] border-r-2 border-[#120703] shadow-[8px_0_15px_rgba(0,0,0,0.8)] z-[60] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
          <div className="absolute top-0 bottom-0 right-0 w-3 sm:w-5 bg-[#2b1408] border-l-2 border-[#120703] shadow-[-8px_0_15px_rgba(0,0,0,0.8)] z-[60] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />

          {/* FLUID WRAPPING SHELF CONTAINER */}
          <div className="w-full h-full flex flex-wrap content-start px-6 sm:px-10 z-10 relative py-0">
             {shelfFlow}
          </div>
        </div>

        {/* Right column: Taped Polaroid Spotlight Panel */}
        {!hoveredBook ? (
          <div className={`hidden lg:flex lg:col-span-4 bg-planner-paper p-5 rounded-2xl border-2 border-[#3d1e03]/10 shadow-md flex-col items-center justify-center text-center min-h-[360px] sticky top-6 z-20 ${isDecorating ? 'opacity-20 pointer-events-none' : ''}`}>
            <div className="w-full flex items-center justify-center gap-1.5 border-b pb-2.5 mb-3">
              <Sparkles className="w-4 h-4 text-accent-pink animate-spin-slow" />
              <h4 className="font-caveat text-xl font-bold text-maroon">Spine Inspector Panel</h4>
            </div>
            <div className="my-auto py-12 flex flex-col items-center space-y-3">
              <span className="text-4xl animate-bounce">👉📖</span>
              <p className="font-caveat text-xl font-bold text-ink-gray leading-tight">Hover over a book spine on the shelf to slide it out!</p>
              <p className="text-[9px] text-ink-gray uppercase font-bold tracking-widest">Interactive Library view</p>
            </div>
            <div className="text-[8px] text-ink-gray uppercase font-bold tracking-wider pt-3 border-t w-full mt-4">iPad GoodNotes reading log</div>
          </div>
        ) : (
          <div className="fixed bottom-4 left-4 right-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:col-span-4 bg-planner-paper p-4 lg:p-5 rounded-2xl border-2 border-[#3d1e03]/15 lg:border-[#3d1e03]/10 shadow-2xl lg:shadow-md z-[80] lg:z-20 flex flex-col lg:justify-between items-center text-center lg:min-h-[360px] lg:sticky lg:top-6 animate-slideUp">
            <div className="w-full flex items-center justify-between lg:justify-center gap-1.5 border-b pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-pink animate-spin-slow" />
                <h4 className="font-caveat text-xl font-bold text-maroon">Spine Inspector</h4>
              </div>
              <button onClick={() => setHoveredBook(null)} className="lg:hidden text-ink-gray hover:text-red-500 font-extrabold text-sm p-1 cursor-pointer">✕</button>
            </div>
            <div className="w-full flex flex-row lg:flex-col items-center gap-4 lg:space-y-4">
              <div className="w-[80px] lg:w-[130px] aspect-[2/3] bg-planner-paper p-1.5 lg:p-2.5 shadow-lg border border-stone-200 relative transform rotate-[-2deg] transition-transform hover:rotate-0 flex-shrink-0 mt-3">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-10 h-3 bg-amber-100/40 backdrop-blur-[0.5px] rotate-[-5deg] border-x border-dashed border-black/5 shadow-sm z-10" />
                {hoveredBook.coverUrl ? (
                  <img src={getOptimizedCoverUrl(hoveredBook.coverUrl, 160)} alt={hoveredBook.title} className="w-full h-full object-cover" loading="eager" decoding="async" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full bg-[#ffccd5] flex items-center justify-center p-2 text-center font-caveat text-[9px] lg:text-xs font-bold text-[#800f2f]">No Cover</div>
                )}
                <span className="absolute top-1 right-1 bg-maroon text-white text-[6px] lg:text-[7px] font-bold px-1 py-0.5 rounded shadow">{hoveredBook.status.replace(/_/g, " ").toUpperCase()}</span>
              </div>
              <div className="flex-1 lg:w-full text-left lg:text-center space-y-1.5 min-w-0">
                <h5 className="font-bold text-xs lg:text-sm text-ink-brown leading-snug truncate lg:line-clamp-2">{hoveredBook.title}</h5>
                <p className="text-[9px] lg:text-[10px] text-ink-gray font-bold truncate">by {hoveredBook.author}</p>
                <div className="flex lg:justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => <span key={s} className="text-xs lg:text-sm">{s <= hoveredBook.rating ? "★" : "☆"}</span>)}
                </div>
                {hoveredBook.genres && hoveredBook.genres.length > 0 && (
                  <div className="flex flex-wrap lg:justify-center gap-1 mt-1 lg:mt-2">
                    {hoveredBook.genres.slice(0, 2).map((g) => <span key={g} className="bg-[#fff0f3] border border-[#ffccd5] text-[#800f2f] text-[7.5px] lg:text-[8px] font-bold px-1 py-0.5 rounded-full">{g}</span>)}
                  </div>
                )}
                <button onClick={() => onSelectBook(hoveredBook.id)} className="mt-2 lg:mt-3.5 w-full bg-maroon text-white py-1.5 px-3 rounded-lg text-[9px] lg:text-[10px] font-bold hover:bg-opacity-95 transition-all flex items-center justify-center gap-1 cursor-pointer">
                  <BookOpen className="w-3.5 h-3.5" /> Read Full Log Review
                </button>
              </div>
            </div>
            <div className="hidden lg:block text-[8px] text-ink-gray uppercase font-bold tracking-wider pt-3 border-t w-full mt-4">iPad GoodNotes reading log</div>
          </div>
        )}
      </div>

      {/* OVERLAY: Drag and Drop Decoration Palette Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-[#fdfbf7] border-l-[6px] border-[#3d1e03] shadow-[-10px_0_30px_rgba(0,0,0,0.3)] z-[100] transform transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isDecorating ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="bg-[#4a2916] p-5 text-white flex justify-between items-center shadow-md bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] border-b border-amber-900/50">
          <div className="flex items-center gap-3 font-caveat text-3xl font-extrabold tracking-wide drop-shadow-sm text-amber-50">
            <Paintbrush className="w-6 h-6 text-amber-300" /> Palette
          </div>
          <button onClick={handleToggleDecorating} className="text-white/70 hover:text-white font-extrabold text-xl cursor-pointer hover:rotate-90 transition-transform">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-32 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
          <div className="bg-amber-100/60 border border-amber-200 p-3 rounded-xl shadow-inner flex flex-col gap-3">
            <p className="text-xs text-amber-900 font-bold leading-relaxed text-center">
              Drag items directly onto the pulsing dashed boxes between your books!
            </p>
            <button 
              onClick={handleToggleDecorating}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg shadow-md transition-colors text-sm"
            >
              DONE DECORATING (SAVE)
            </button>
            <button 
              onClick={handleScatterRandom}
              className="w-full bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 rounded-lg shadow-md transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> AUTO-SCATTER RANDOM DECOR
            </button>
            <button 
              onClick={() => setDecorations({})}
              className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-2 rounded-lg shadow-md transition-colors text-sm flex items-center justify-center gap-2 mt-1"
            >
              🗑️ CLEAR ALL DECORATIONS
            </button>
          </div>
          
          {DECORATION_CATEGORIES.map(category => (
            <div key={category.name} className="relative">
              <h3 className="font-extrabold text-xs text-ink-brown border-b-2 border-stone-200/50 pb-1 mb-4 uppercase tracking-widest">{category.name}</h3>
              <div className="flex flex-wrap gap-2.5">
                {category.items.map(emoji => (
                  <div 
                    key={emoji}
                    draggable
                    onDragStart={(e) => handleDragStart(e, emoji, getDecorStyle(emoji))}
                    className="text-3xl w-12 h-12 flex items-center justify-center bg-white border border-stone-200/80 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg hover:border-amber-300 transition-all select-none"
                    title={`Drag ${emoji} to shelf`}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Backdrop overlay when decorating on mobile */}
      {isDecorating && (
        <div className="fixed inset-0 bg-black/20 z-[90] lg:hidden backdrop-blur-sm transition-opacity" onClick={handleToggleDecorating} />
      )}
    </div>
  );
}
