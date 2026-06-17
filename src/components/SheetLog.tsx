"use client";

import React from "react";
import { Book } from "../lib/db";
import { Star, FileSpreadsheet, Eye } from "lucide-react";

interface SheetLogProps {
  books: Book[];
  onSelectBook: (id: string) => void;
  initialStatusFilter?: string;
}

export default function SheetLog({ books, onSelectBook, initialStatusFilter = "all" }: SheetLogProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [prevInitialFilter, setPrevInitialFilter] = React.useState(initialStatusFilter);
  const [statusVal, setStatusVal] = React.useState<string>(initialStatusFilter);

  if (initialStatusFilter !== prevInitialFilter) {
    setPrevInitialFilter(initialStatusFilter);
    setStatusVal(initialStatusFilter);
  }

  // Filter out wishlist books; show only library books in log
  const libraryBooks = books.filter((b) => !b.isWishlist);

  // Filter books matching search query and status filter
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

  // Helper for rendering format tags
  const renderFormatTags = (formats: string[]) => {
    return (
      <div className="flex gap-1 flex-wrap">
        {formats.map((fmt) => {
          let bg = "bg-emerald-100 text-emerald-800 border-emerald-200";
          if (fmt === "digital") {
            bg = "bg-blue-100 text-blue-800 border-blue-200";
          } else if (fmt === "audio") {
            bg = "bg-purple-100 text-purple-800 border-purple-200";
          }
          return (
            <span
              key={fmt}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${bg}`}
            >
              {fmt}
            </span>
          );
        })}
      </div>
    );
  };

  // Helper for priority badges
  const renderPriorityBadge = (prio: string) => {
    let bg = "bg-amber-100 text-amber-800 border-amber-200";
    if (prio === "Must read") {
      bg = "bg-rose-100 text-rose-800 border-rose-200";
    } else if (prio === "Maybe") {
      bg = "bg-stone-100 text-stone-700 border-stone-200";
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${bg}`}>
        {prio || "Interested"}
      </span>
    );
  };

  // Helper for source tags
  const renderSourceTag = (source: string) => {
    let bg = "bg-[#f4ebe1] text-[#4a3f35] border-[#3d1e03]/10";
    if (source === "Purchased") {
      bg = "bg-orange-50 text-orange-700 border-orange-200";
    } else if (source === "Borrowed") {
      bg = "bg-[#dec9b6]/40 text-ink-brown border-[#3d1e03]/15";
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bg}`}>
        {source || "Purchased"}
      </span>
    );
  };

  return (
    <div className="bg-planner-paper text-ink-brown rounded-xl border border-[#3d1e03]/10 shadow-md overflow-hidden">
      {/* Burgundy header bar */}
      <div className="bg-maroon px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          <span className="font-extrabold uppercase tracking-wider text-xs">
            Book Tracker — READING LOG
          </span>
        </div>
        <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded">
          {libraryBooks.length} Books Logged
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="bg-planner-base border-b border-[#3d1e03]/10 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-ink-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search log by title, author, genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-planner-paper text-ink-brown pl-9 pr-4 py-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none placeholder-ink-gray/60 font-semibold"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: "all", label: "All 📚" },
            { id: "reading", label: "Reading 📖" },
            { id: "completed", label: "Completed 🏆" },
            { id: "want_to_read", label: "To Read 🎯" }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusVal(pill.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                statusVal === pill.id
                  ? "bg-maroon text-white border-maroon shadow-sm"
                  : "bg-white text-ink-gray border-[#3d1e03]/10 hover:bg-tab-peach"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto no-scrollbar">
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
            {filteredBooks.map((book, idx) => (
              <tr
                key={book.id}
                className="border-b border-stone-100 hover:bg-[#ffe5ec]/50 transition-colors cursor-pointer group odd:bg-pastel-pink/40 even:bg-planner-paper"
                onClick={() => onSelectBook(book.id)}
              >
                {/* Index number */}
                <td className="py-2 px-4 text-center font-mono font-bold text-ink-gray">
                  {idx + 1}
                </td>

                {/* Title */}
                <td className="py-2 px-3 font-extrabold text-ink-brown text-sm">
                  {book.title}
                </td>

                {/* Cover thumbnail */}
                <td className="py-2 px-3">
                  <div className="w-8 h-11 bg-stone-100 border border-stone-200 rounded overflow-hidden flex items-center justify-center mx-auto shadow-sm">
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[7px] text-stone-400 font-bold uppercase">No Cover</span>
                    )}
                  </div>
                </td>

                {/* Author */}
                <td className="py-2 px-3 text-ink-gray font-semibold">
                  {book.author}
                </td>

                {/* Genre */}
                <td className="py-2 px-3 text-ink-brown font-medium">
                  {book.genres && book.genres[0] ? book.genres[0] : "-"}
                </td>

                {/* Sub-genre */}
                <td className="py-2 px-3 text-ink-gray italic">
                  {book.subGenre || "-"}
                </td>

                {/* Format pill tags */}
                <td className="py-2 px-3">
                  {renderFormatTags(book.formats)}
                </td>

                {/* Priority */}
                <td className="py-2 px-3">
                  {renderPriorityBadge(book.priority)}
                </td>

                {/* Ratings */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= book.rating
                            ? "fill-star-yellow text-star-yellow"
                            : "text-stone-200"
                        }`}
                      />
                    ))}
                  </div>
                </td>

                {/* Source */}
                <td className="py-2 px-3">
                  {renderSourceTag(book.source)}
                </td>

                {/* Action icon */}
                <td className="py-2 px-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBook(book.id);
                    }}
                    className="p-1 rounded hover:bg-stone-100 text-ink-gray hover:text-maroon transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredBooks.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-ink-gray italic bg-planner-paper">
                  {libraryBooks.length === 0 
                    ? "No books logged yet. Click the \"Add Book\" button to create your first reading log entry."
                    : "No matching books found in your reading log."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
