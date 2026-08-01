"use client";

import React, { useState, useEffect } from "react";
import { Book } from "../lib/db";
import { Star, FileSpreadsheet, Eye } from "lucide-react";

interface SheetLogProps {
  books: Book[];
  onSelectBook: (id: string) => void;
  initialStatusFilter?: string;
}

export default function SheetLog({ books, onSelectBook, initialStatusFilter = "all" }: SheetLogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [prevInitialFilter, setPrevInitialFilter] = useState(initialStatusFilter);
  const [statusVal, setStatusVal] = useState<string>(initialStatusFilter);
  
  const [page, setPage] = useState(1);
  const [animatingState, setAnimatingState] = useState<{
    direction: 'forward' | 'backward';
    fromPage: number;
    toPage: number;
  } | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const ITEMS_PER_PAGE = 10;

  if (initialStatusFilter !== prevInitialFilter) {
    setPrevInitialFilter(initialStatusFilter);
    setStatusVal(initialStatusFilter);
    setPage(1);
  }

  const libraryBooks = books.filter((b) => !b.isWishlist);

  const filteredBooks = libraryBooks.filter((b) => {
    const matchesStatus = statusVal === "all" || b.status === statusVal;
    if (!matchesStatus) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.genres && b.genres.some((g) => g.toLowerCase().includes(q))) ||
      (b.subGenre && b.subGenre.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / ITEMS_PER_PAGE));

  const handlePageTurn = (newPage: number) => {
    if (newPage === page || animatingState) return;
    
    setAnimatingState({
      direction: newPage > page ? 'forward' : 'backward',
      fromPage: page,
      toPage: newPage
    });

    // Short delay to allow the overlay to render at its starting position before transitioning
    setTimeout(() => setIsFlipping(true), 50);

    // CSS Transition duration is 800ms
    setTimeout(() => {
      setPage(newPage);
      setAnimatingState(null);
      setIsFlipping(false);
    }, 850); 
  };

  const renderFormatTags = (formats: string[]) => (
    <div className="flex gap-1 flex-wrap">
      {formats.map((fmt) => {
        let bg = "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (fmt === "digital") bg = "bg-blue-100 text-blue-800 border-blue-200";
        else if (fmt === "audio") bg = "bg-purple-100 text-purple-800 border-purple-200";
        return <span key={fmt} className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${bg}`}>{fmt}</span>;
      })}
    </div>
  );

  const renderPriorityBadge = (prio: string) => {
    let bg = "bg-amber-100 text-amber-800 border-amber-200";
    if (prio === "Must read") bg = "bg-rose-100 text-rose-800 border-rose-200";
    else if (prio === "Maybe") bg = "bg-stone-100 text-stone-700 border-stone-200";
    return <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${bg}`}>{prio || "Interested"}</span>;
  };

  const renderSourceTag = (source: string) => {
    let bg = "bg-[#f4ebe1] text-[#4a3f35] border-[#3d1e03]/10";
    if (source === "Purchased") bg = "bg-orange-50 text-orange-700 border-orange-200";
    else if (source === "Borrowed") bg = "bg-[#dec9b6]/40 text-ink-brown border-[#3d1e03]/15";
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bg}`}>{source || "Purchased"}</span>;
  };

  const renderTable = (pageNum: number) => {
    const pageBooks = filteredBooks.slice((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE);
    
    return (
      <div className="w-full bg-planner-paper min-h-[400px]">
        <table className="w-full text-left border-collapse min-w-[800px] text-xs">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-200 text-ink-gray font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-3">Book Title</th>
              <th className="py-2.5 px-3 w-16 text-center">Cover</th>
              <th className="py-2.5 px-3">Author</th>
              <th className="py-2.5 px-3">Genre</th>
              <th className="py-2.5 px-3">Sub-genre</th>
              <th className="py-2.5 px-3">Format</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Ratings</th>
              <th className="py-2.5 px-3">Source</th>
              <th className="py-2.5 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageBooks.map((book, idx) => (
              <tr
                key={book.id}
                className="border-b border-stone-100 hover:bg-[#ffe5ec]/50 transition-colors cursor-pointer group odd:bg-pastel-pink/40 even:bg-planner-paper"
                onClick={() => onSelectBook(book.id)}
              >
                <td className="py-2 px-4 text-center font-mono font-bold text-ink-gray">
                  {(pageNum - 1) * ITEMS_PER_PAGE + idx + 1}
                </td>
                <td className="py-2 px-3 font-extrabold text-ink-brown text-sm">{book.title}</td>
                <td className="py-2 px-3">
                  <div className="w-8 h-11 bg-stone-100 border border-stone-200 rounded overflow-hidden flex items-center justify-center mx-auto shadow-sm">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[7px] text-stone-400 font-bold uppercase">No Cover</span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3 text-ink-gray font-semibold">{book.author}</td>
                <td className="py-2 px-3 text-ink-brown font-medium">{book.genres && book.genres[0] ? book.genres[0] : "-"}</td>
                <td className="py-2 px-3 text-ink-gray italic">{book.subGenre || "-"}</td>
                <td className="py-2 px-3">{renderFormatTags(book.formats)}</td>
                <td className="py-2 px-3">{renderPriorityBadge(book.priority)}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= book.rating ? "fill-star-yellow text-star-yellow" : "text-stone-200"}`} />
                    ))}
                  </div>
                </td>
                <td className="py-2 px-3">{renderSourceTag(book.source)}</td>
                <td className="py-2 px-3 text-center">
                  <button onClick={(e) => { e.stopPropagation(); onSelectBook(book.id); }} className="p-1 rounded hover:bg-stone-100 text-ink-gray hover:text-maroon transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {pageBooks.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-ink-gray italic bg-planner-paper">
                  {libraryBooks.length === 0 ? "No books logged yet." : "No matching books found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const basePageNum = animatingState ? (animatingState.direction === 'forward' ? animatingState.toPage : animatingState.fromPage) : page;
  const overlayPageNum = animatingState ? (animatingState.direction === 'forward' ? animatingState.fromPage : animatingState.toPage) : null;

  let overlayTransform = "";
  if (animatingState) {
    if (animatingState.direction === 'forward') {
      overlayTransform = isFlipping ? "rotateY(-180deg)" : "rotateY(0deg)";
    } else {
      overlayTransform = isFlipping ? "rotateY(0deg)" : "rotateY(-180deg)";
    }
  }

  return (
    <div className="bg-planner-paper text-ink-brown rounded-xl border border-[#3d1e03]/10 shadow-md overflow-hidden relative">
      <div className="bg-maroon px-4 py-3 text-white flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          <span className="font-extrabold uppercase tracking-wider text-xs">Book Tracker — READING LOG</span>
        </div>
        <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded">{libraryBooks.length} Books Logged</span>
      </div>

      <div className="bg-planner-base border-b border-[#3d1e03]/10 p-3 flex flex-wrap items-center justify-between gap-3 z-10 relative">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-ink-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search log by title, author, genre..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-planner-paper text-ink-brown pl-9 pr-4 py-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none placeholder-ink-gray/60 font-semibold"
            />
          </div>
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setPage(1); }} className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer">Clear</button>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[{ id: "all", label: "All 📚" }, { id: "reading", label: "Reading 📖" }, { id: "completed", label: "Completed 🏆" }, { id: "want_to_read", label: "To Read 🎯" }].map((pill) => (
            <button
              key={pill.id}
              onClick={() => { setStatusVal(pill.id); setPage(1); }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                statusVal === pill.id ? "bg-maroon text-white border-maroon shadow-sm" : "bg-white text-ink-gray border-[#3d1e03]/10 hover:bg-tab-peach"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Perspective Container for the Page Flip */}
      <div className="relative w-full overflow-hidden no-scrollbar bg-planner-paper" style={{ perspective: "2500px" }}>
        
        {/* Base Layer */}
        <div className="w-full overflow-x-auto no-scrollbar">
          {renderTable(basePageNum)}
        </div>

        {/* Flipping Overlay */}
        {animatingState && overlayPageNum !== null && (
          <div 
            className="absolute top-0 left-0 h-full w-full pointer-events-none z-50 overflow-visible"
            style={{ 
              transformOrigin: "left center",
              transform: overlayTransform,
              transitionProperty: "transform",
              transitionDuration: "800ms",
              transitionTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
              transformStyle: "preserve-3d"
            }}
          >
            {/* Front of the flipping page */}
            <div 
              className="absolute inset-0 w-full h-full bg-planner-paper overflow-x-hidden border-l border-white/50 shadow-[20px_0_40px_rgba(0,0,0,0.15)]"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              {renderTable(overlayPageNum)}
            </div>

            {/* Back of the flipping page (Blank paper texture) */}
            <div 
              className="absolute inset-0 w-full h-full bg-[#fdfbf7] flex items-center justify-center shadow-inner"
              style={{ 
                transform: "rotateY(180deg)", 
                backfaceVisibility: "hidden", 
                WebkitBackfaceVisibility: "hidden",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")"
              }}
            >
              <div className="opacity-10 transform -rotate-12 font-caveat text-4xl font-extrabold text-ink-brown">Journal Page</div>
            </div>
          </div>
        )}
      </div>

      {/* Bookish Page Turning Controls */}
      {totalPages > 1 && (
        <div className="relative bg-transparent border-t border-[#3d1e03]/10 h-16 sm:h-20 flex items-center justify-center mt-2 z-10">
          
          <button
            onClick={() => handlePageTurn(page - 1)}
            disabled={page === 1 || animatingState !== null}
            className="absolute left-2 sm:left-4 bottom-2 sm:bottom-4 group cursor-pointer disabled:opacity-0 transition-opacity duration-500"
            title="Turn to previous page"
          >
            <div className="w-10 h-10 sm:w-14 sm:h-14 relative overflow-hidden rounded-bl-xl hover:-translate-x-1 hover:translate-y-1 transition-transform">
              <div className="absolute bottom-0 left-0 w-0 h-0 border-r-[24px] sm:border-r-[34px] border-b-[24px] sm:border-b-[34px] border-r-transparent border-b-black/10 group-hover:border-b-black/20 transition-all drop-shadow-md"></div>
              <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-[#dec9b6] to-transparent opacity-0 group-hover:opacity-40 rounded-bl-xl transition-opacity"></div>
              <span className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 font-caveat font-extrabold text-[#800f2f] text-sm sm:text-lg transform -rotate-12 group-hover:-rotate-[18deg] transition-all">⤆</span>
            </div>
            <span className="absolute left-14 bottom-2 font-caveat text-ink-gray font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity -rotate-2">Back</span>
          </button>

          <span className="font-caveat text-ink-gray/60 font-bold text-lg tracking-widest pointer-events-none select-none">
            — {page} —
          </span>

          <button
            onClick={() => handlePageTurn(page + 1)}
            disabled={page === totalPages || animatingState !== null}
            className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 group cursor-pointer disabled:opacity-0 transition-opacity duration-500"
            title="Turn to next page"
          >
            <span className="absolute right-14 bottom-2 font-caveat text-ink-gray font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity rotate-2">Flip</span>
            <div className="w-10 h-10 sm:w-14 sm:h-14 relative overflow-hidden rounded-br-xl hover:translate-x-1 hover:translate-y-1 transition-transform origin-bottom-right">
              <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[24px] sm:border-l-[34px] border-b-[24px] sm:border-b-[34px] border-l-transparent border-b-black/15 group-hover:border-b-black/30 group-hover:border-l-[40px] sm:group-hover:border-l-[46px] transition-all drop-shadow-[0_-4px_6px_rgba(0,0,0,0.1)]"></div>
              <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[24px] sm:border-l-[34px] border-t-[24px] sm:border-t-[34px] border-t-transparent border-l-[#fdfbf7] group-hover:border-l-[40px] sm:group-hover:border-l-[46px] border border-[#3d1e03]/10 drop-shadow-[-2px_-2px_4px_rgba(0,0,0,0.1)] transition-all"></div>
              <span className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 font-caveat font-extrabold text-[#800f2f] text-sm sm:text-lg transform rotate-12 group-hover:rotate-[18deg] transition-all z-10">⤇</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
