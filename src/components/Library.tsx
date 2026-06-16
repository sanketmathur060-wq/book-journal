"use client";

import React, { useState } from "react";
import { Star, Search, BookOpen, Info, Sparkles } from "lucide-react";
import { Book, getOptimizedCoverUrl } from "../lib/db";

interface LibraryProps {
  books: Book[];
  onSelectBook: (id: string) => void;
}

type FilterType = "status" | "genre" | "rating" | "source" | "year" | null;

const SPINE_GRADIENTS = [
  "from-[#ff4d6d] to-[#c77dff] text-white", // Pink-purple
  "from-[#2a9d8f] to-[#264653] text-[#f1faee]", // Teal-navy
  "from-[#e76f51] to-[#f4a261] text-[#2b1008]", // Orange-peach
  "from-[#ffd166] to-[#ffb703] text-[#42220f]", // Yellow-gold
  "from-[#9b5de5] to-[#f15bb5] text-white", // Lavender-pink
  "from-[#00bbf9] to-[#00f5d4] text-[#1d3557]", // Cyan-mint
  "from-[#ae2012] to-[#9b2226] text-white", // Dark red
  "from-[#588157] to-[#3a5a40] text-[#f1faee]", // Forest sage
];

// Aesthetic shelf decoration items
const SHELF_DECORATIONS = [
  { emoji: "🪴", style: "text-3xl mb-1 filter drop-shadow-md select-none" },
  { emoji: "🌸", style: "text-3xl mb-1 filter drop-shadow-md select-none animate-pulse" },
  { emoji: "🕯️", style: "text-2xl mb-1 filter drop-shadow-md select-none" },
  { emoji: "☕", style: "text-2xl mb-0.5 filter drop-shadow-md select-none" },
  { emoji: "🐱", style: "text-3xl filter drop-shadow-md select-none rotate-[2deg]" },
  { emoji: "🌷", style: "text-3xl mb-1 filter drop-shadow-md select-none" }
];

export default function Library({ books, onSelectBook }: LibraryProps) {
  const libraryBooks = books.filter((b) => !b.isWishlist);

  const [activeFilterTab, setActiveFilterTab] = useState<FilterType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Active filter states
  const [statusVal, setStatusVal] = useState<string>("all");
  const [genreVal, setGenreVal] = useState<string>("all");
  const [ratingVal, setRatingVal] = useState<number | "all">("all");
  const [sourceVal, setSourceVal] = useState<string>("all");
  const [yearVal, setYearVal] = useState<string>("all");

  // Hover states
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);

  // Get options for filters
  const allGenres = Array.from(
    new Set(libraryBooks.flatMap((b) => b.genres || []).filter(Boolean))
  );
  
  const allSources = Array.from(
    new Set(libraryBooks.map((b) => b.source).filter(Boolean))
  );

  const allYears = Array.from(
    new Set(
      libraryBooks
        .map((b) => (b.endDate ? new Date(b.endDate).getFullYear().toString() : ""))
        .filter(Boolean)
    )
  );

  const toggleFilterTab = (tab: FilterType) => {
    setActiveFilterTab(activeFilterTab === tab ? null : tab);
  };

  // Filter book list
  const filteredBooks = libraryBooks.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusVal === "all" || book.status === statusVal;
    const matchesGenre = genreVal === "all" || (book.genres && book.genres.includes(genreVal));
    const matchesRating = ratingVal === "all" || book.rating === ratingVal;
    const matchesSource = sourceVal === "all" || book.source === sourceVal;
    
    const bookYear = book.endDate ? new Date(book.endDate).getFullYear().toString() : "";
    const matchesYear = yearVal === "all" || bookYear === yearVal;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesGenre &&
      matchesRating &&
      matchesSource &&
      matchesYear
    );
  });

  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // Dynamic shelf generation: Minimum 3 shelves
  const booksPerShelf = 6;
  const totalShelvesNeeded = Math.max(3, Math.ceil(filteredBooks.length / booksPerShelf));

  const shelfRows = Array.from({ length: totalShelvesNeeded }).map((_, i) => {
    return filteredBooks.slice(i * booksPerShelf, (i + 1) * booksPerShelf);
  });

  return (
    <div className="space-y-6 select-none overflow-visible">
      
      {/* 1. Search and Filters Header */}
      <div className="bg-[#fff0f3] p-4 rounded-xl border border-[#ffccd5] shadow-sm space-y-3 z-30 relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-gray" />
            <input
              type="text"
              placeholder="Search library book title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#3d1e03]/10 rounded-lg text-xs text-ink-brown focus:outline-none focus:border-maroon"
            />
          </div>
        </div>

        {/* Filter buttons */}
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
              className={`px-3 py-1.5 rounded transition-all cursor-pointer border ${
                activeFilterTab === tab.id
                  ? "bg-maroon text-white border-maroon shadow-sm"
                  : tab.active
                  ? "bg-[#ffccd5] text-maroon border-maroon/20"
                  : "bg-white text-ink-brown border-[#3d1e03]/10 hover:bg-[#fff0f3]"
              }`}
            >
              {tab.label} {tab.active && "•"}
            </button>
          ))}

          {(statusVal !== "all" || genreVal !== "all" || ratingVal !== "all" || sourceVal !== "all" || yearVal !== "all") && (
            <button
              onClick={() => {
                setStatusVal("all");
                setGenreVal("all");
                setRatingVal("all");
                setSourceVal("all");
                setYearVal("all");
                setActiveFilterTab(null);
              }}
              className="px-2.5 py-1 text-ink-gray hover:text-red-600 underline transition-colors cursor-pointer ml-auto"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {activeFilterTab && (
          <div className="bg-white p-3 rounded-lg border border-[#3d1e03]/10 flex flex-wrap gap-1.5 animate-fadeIn">
            {activeFilterTab === "status" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Status:</span>
                {["all", "want_to_read", "reading", "completed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusVal(st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      statusVal === st ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                    }`}
                  >
                    {st === "all" ? "All" : st.replace(/_/g, " ").toUpperCase()}
                  </button>
                ))}
              </>
            )}

            {activeFilterTab === "genre" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Genre:</span>
                <button
                  onClick={() => setGenreVal("all")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    genreVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                  }`}
                >
                  All Genres
                </button>
                {allGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenreVal(g)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      genreVal === g ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </>
            )}

            {activeFilterTab === "rating" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Rating:</span>
                <button
                  onClick={() => setRatingVal("all")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    ratingVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                  }`}
                >
                  All Ratings
                </button>
                {[5, 4, 3, 2, 1].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingVal(r)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                      ratingVal === r ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                    }`}
                  >
                    {r} ★
                  </button>
                ))}
              </>
            )}

            {activeFilterTab === "source" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Source:</span>
                <button
                  onClick={() => setSourceVal("all")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    sourceVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                  }`}
                >
                  All Sources
                </button>
                {allSources.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSourceVal(s)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      sourceVal === s ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </>
            )}

            {activeFilterTab === "year" && (
              <>
                <span className="text-[9px] font-bold text-ink-gray uppercase w-full">Filter by Finish Year:</span>
                <button
                  onClick={() => setYearVal("all")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    yearVal === "all" ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                  }`}
                >
                  All Years
                </button>
                {allYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYearVal(y)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      yearVal === y ? "bg-maroon text-white" : "bg-stone-50 border text-ink-brown hover:bg-[#fff0f3]"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Bookshelf & Side Spotlight Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-visible">
        
        {/* Left column: The 3D Bookcase shelves (8 Columns on desktop, auto-scales down on mobile using --shelf-scale) */}
        <div className="lg:col-span-8 bg-[#582f0e]/5 border border-[#3d1e03]/15 rounded-2xl shadow-inner p-3 sm:p-6 space-y-12 sm:space-y-16 relative overflow-visible bg-cover min-h-[420px] sm:min-h-[520px] [--shelf-scale:0.75] sm:[--shelf-scale:1]">
          {/* Bookcase Side Wood Trim */}
          <div className="absolute top-0 bottom-0 left-0 w-2.5 sm:w-3.5 bg-[#3d1e03] border-r border-[#ffe5cc]/15 shadow-md z-15 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-2.5 sm:w-3.5 bg-[#3d1e03] border-l border-[#ffe5cc]/15 shadow-md z-15 pointer-events-none" />

          {shelfRows.map((rowBooks, shelfIdx) => {
            const leftDecor = SHELF_DECORATIONS[(shelfIdx * 2) % SHELF_DECORATIONS.length];
            const rightDecor = SHELF_DECORATIONS[(shelfIdx * 2 + 1) % SHELF_DECORATIONS.length];

            return (
              <div key={shelfIdx} className="relative pt-10 sm:pt-14 pb-2 sm:pb-4 px-3 sm:px-6 flex flex-col justify-end min-h-[150px] sm:min-h-[200px] overflow-visible">
                
                {/* Row of Spines standing tightly together */}
                <div className="flex gap-1 sm:gap-2 items-end justify-start w-full px-2 z-20 overflow-visible">
                  
                  {/* Left Shelf Decoration */}
                  <div className={`${leftDecor.style} pr-2 sm:pr-4 pb-1 hover:rotate-6 transition-transform`}>
                    {leftDecor.emoji}
                  </div>

                  {rowBooks.map((book, idx) => {
                    const hash = getHash(book.title + book.id);
                    const gradient = SPINE_GRADIENTS[hash % SPINE_GRADIENTS.length];
                    
                    // Height and width variations
                    const heightPx = 115 + (hash % 45);
                    const widthPx = 25 + (hash % 18);

                    // Spine shapes
                    let shapeClass = "rounded-[2px]";
                    if (hash % 3 === 0) {
                      shapeClass = "rounded-t-[14px] rounded-b-[3px]";
                    } else if (hash % 3 === 1) {
                      shapeClass = "rounded-t-[6px] rounded-b-[4px]";
                    } else {
                      shapeClass = "rounded-[2px]";
                    }

                    // Leaning angle
                    let leaningClass = "";
                    if (idx === 0 && rowBooks.length > 1) {
                      leaningClass = "rotate-[4deg] origin-bottom-left translate-x-[2px] translate-y-[-1px]";
                    } else if (idx === rowBooks.length - 1 && rowBooks.length > 1) {
                      leaningClass = "rotate-[-4deg] origin-bottom-right translate-x-[-2px] translate-y-[-1px]";
                    }

                    // Spine badges
                    let decorIcon = "✨";
                    const genresLower = book.genres.map(g => g.toLowerCase());
                    if (genresLower.some(g => g.includes("fantasy") || g.includes("magic"))) {
                      decorIcon = "🏰";
                    } else if (genresLower.some(g => g.includes("romance") || g.includes("love"))) {
                      decorIcon = "💖";
                    } else if (genresLower.some(g => g.includes("thriller") || g.includes("mystery"))) {
                      decorIcon = "🔑";
                    } else if (genresLower.some(g => g.includes("scifi") || g.includes("space"))) {
                      decorIcon = "🚀";
                    } else {
                      const generalDecor = ["✨", "🌱", "🦋", "🧸", "🐚", "🐞"];
                      decorIcon = generalDecor[hash % generalDecor.length];
                    }

                    return (
                      <div
                        key={book.id}
                        onClick={() => {
                          if (hoveredBook?.id === book.id) {
                            onSelectBook(book.id);
                          } else {
                            setHoveredBook(book);
                          }
                        }}
                        onMouseEnter={() => setHoveredBook(book)}
                        className={`relative group cursor-pointer transition-all duration-300 ease-out transform hover:-translate-y-6 sm:hover:-translate-y-8 hover:scale-105 sm:hover:scale-110 active:scale-[0.96] hover:shadow-[0_0_20px_rgba(255,215,0,0.7)] hover:z-30 ${leaningClass} overflow-visible`}
                        style={{ width: `calc(var(--shelf-scale, 1) * ${widthPx}px)` }}
                      >
                        {/* Spine Body */}
                        <div
                          className={`bg-gradient-to-b ${gradient} ${shapeClass} border-l border-t border-white/25 shadow-[4px_10px_8px_-2px_rgba(0,0,0,0.45)] relative flex flex-col justify-between items-center py-2 sm:py-3 overflow-hidden`}
                          style={{ height: `calc(var(--shelf-scale, 1) * ${heightPx}px)`, width: `calc(var(--shelf-scale, 1) * ${widthPx}px)` }}
                        >
                          {/* Gold bands top */}
                          <div className="w-full flex flex-col gap-[2px] items-center opacity-65">
                            <div className="w-[85%] h-[1.5px] bg-amber-400"></div>
                            <div className="w-[85%] h-[1px] bg-amber-400"></div>
                          </div>

                          {/* Spine Title */}
                          <div className="[writing-mode:vertical-rl] text-center font-caveat text-[9.5px] sm:text-[11.5px] font-extrabold tracking-wider line-clamp-1 max-h-[70%] select-none leading-none scale-y-[-1] rotate-180">
                            {book.title}
                          </div>

                          {/* Illustration */}
                          <div className="text-[10px] sm:text-[11px] select-none filter drop-shadow-sm pb-1">
                            {decorIcon}
                          </div>

                          {/* 3D highlights */}
                          <div className="absolute inset-y-0 left-0 w-[2.5px] bg-black/20" />
                          <div className="absolute inset-y-0 right-0 w-[1px] bg-white/20" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Right Shelf Decoration */}
                  <div className={`${rightDecor.style} pl-4 pb-1 hover:scale-110 transition-transform`}>
                    {rightDecor.emoji}
                  </div>

                </div>

                {/* 3D Wood Plank Shelf */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-[#42220f] via-[#8e5a36] to-[#42220f] border-t-2 border-[#ffe5cc]/20 shadow-[0_6px_10px_rgba(0,0,0,0.4)] rounded-sm z-15 pointer-events-none"></div>
                <div className="absolute bottom-[-8px] left-0 right-0 h-2 bg-black/45 blur-[2px] z-10 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Right column: Taped Polaroid Spotlight Panel */}
        {!hoveredBook ? (
          /* On desktop, show helper instructions card when no spine is active. On mobile, show nothing */
          <div className="hidden lg:flex lg:col-span-4 bg-white p-5 rounded-2xl border-2 border-[#3d1e03]/10 shadow-md flex-col items-center justify-center text-center min-h-[360px] sticky top-6 z-20">
            <div className="w-full flex items-center justify-center gap-1.5 border-b pb-2.5 mb-3">
              <Sparkles className="w-4 h-4 text-accent-pink animate-spin-slow" />
              <h4 className="font-caveat text-xl font-bold text-[#800f2f]">Spine Inspector Panel</h4>
            </div>
            <div className="my-auto py-12 flex flex-col items-center space-y-3">
              <span className="text-4xl animate-bounce">👉📖</span>
              <p className="font-caveat text-xl font-bold text-ink-gray leading-tight">
                Hover over a book spine on the shelf to slide it out!
              </p>
              <p className="text-[9px] text-ink-gray uppercase font-bold tracking-widest">
                Interactive Library view
              </p>
            </div>
            <div className="text-[8px] text-ink-gray uppercase font-bold tracking-wider pt-3 border-t w-full mt-4">
              iPad GoodNotes reading log
            </div>
          </div>
        ) : (
          /* When a book is hovered/selected, render details panel (floating bottom-sheet on mobile, sidebar on desktop) */
          <div className="fixed bottom-4 left-4 right-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:col-span-4 bg-white p-4 lg:p-5 rounded-2xl border-2 border-[#3d1e03]/15 lg:border-[#3d1e03]/10 shadow-2xl lg:shadow-md z-[80] lg:z-20 flex flex-col lg:justify-between items-center text-center lg:min-h-[360px] lg:sticky lg:top-6 animate-slideUp">
            
            <div className="w-full flex items-center justify-between lg:justify-center gap-1.5 border-b pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-pink animate-spin-slow" />
                <h4 className="font-caveat text-xl font-bold text-[#800f2f]">Spine Inspector</h4>
              </div>
              <button
                onClick={() => setHoveredBook(null)}
                className="lg:hidden text-ink-gray hover:text-red-500 font-extrabold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-full flex flex-row lg:flex-col items-center gap-4 lg:space-y-4">
              {/* Polaroid Frame */}
              <div className="w-[80px] lg:w-[130px] aspect-[2/3] bg-white p-1.5 lg:p-2.5 shadow-lg border border-stone-200 relative transform rotate-[-2deg] transition-transform hover:rotate-0 flex-shrink-0">
                {hoveredBook.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getOptimizedCoverUrl(hoveredBook.coverUrl, 160)}
                    alt={hoveredBook.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full bg-[#ffccd5] flex items-center justify-center p-2 text-center font-caveat text-[9px] lg:text-xs font-bold text-[#800f2f]">
                    No Cover
                  </div>
                )}
                
                {/* Status ribbon */}
                <span className="absolute top-1 right-1 bg-maroon text-white text-[6px] lg:text-[7px] font-bold px-1 py-0.5 rounded shadow">
                  {hoveredBook.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>

              {/* Book Metadata details */}
              <div className="flex-1 lg:w-full text-left lg:text-center space-y-1.5 min-w-0">
                <h5 className="font-bold text-xs lg:text-sm text-ink-brown leading-snug truncate lg:line-clamp-2">
                  {hoveredBook.title}
                </h5>
                <p className="text-[9px] lg:text-[10px] text-ink-gray font-bold truncate">
                  by {hoveredBook.author}
                </p>
                
                {/* Stars */}
                <div className="flex lg:justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-xs lg:text-sm">
                      {s <= hoveredBook.rating ? "★" : "☆"}
                    </span>
                  ))}
                </div>

                {/* Genre badges list */}
                {hoveredBook.genres && hoveredBook.genres.length > 0 && (
                  <div className="flex flex-wrap lg:justify-center gap-1 mt-1 lg:mt-2">
                    {hoveredBook.genres.slice(0, 2).map((g) => (
                      <span key={g} className="bg-[#fff0f3] border border-[#ffccd5] text-[#800f2f] text-[7.5px] lg:text-[8px] font-bold px-1 py-0.5 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => onSelectBook(hoveredBook.id)}
                  className="mt-2 lg:mt-3.5 w-full bg-maroon text-white py-1.5 px-3 rounded-lg text-[9px] lg:text-[10px] font-bold hover:bg-opacity-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read Full Log Review
                </button>
              </div>
            </div>

            <div className="hidden lg:block text-[8px] text-ink-gray uppercase font-bold tracking-wider pt-3 border-t w-full mt-4">
              iPad GoodNotes reading log
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
