"use client";

import React from "react";
import { Book, getOptimizedCoverUrl } from "../lib/db";
import { Heart, CheckSquare, Square, ShoppingCart } from "lucide-react";

interface WishlistProps {
  books: Book[];
  onSelectBook: (id: string) => void;
  onUpdateBook: (book: Book) => void;
}

export default function Wishlist({ books, onSelectBook, onUpdateBook }: WishlistProps) {
  // Filter for wishlist items only
  const wishlistBooks = books.filter((b) => b.isWishlist);

  const handleToggleBought = (book: Book) => {
    const updated = {
      ...book,
      bought: true,
      isWishlist: false,
      status: "want_to_read" as const, // Automatically places it on the shelf as Want to Read
    };
    onUpdateBook(updated);
  };

  const renderFormatTag = (fmt: string) => {
    let color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (fmt === "digital") {
      color = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (fmt === "audio") {
      color = "bg-purple-50 text-purple-700 border-purple-200";
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${color}`}>
        {fmt}
      </span>
    );
  };

  const renderPriorityBadge = (prio: string) => {
    let color = "bg-amber-50 text-amber-700 border-amber-200";
    if (prio === "Must read") {
      color = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (prio === "Maybe") {
      color = "bg-stone-50 text-stone-600 border-stone-200";
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
        {prio || "Interested"}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Wishlist Gallery Grid (5 Cols on large layout) */}
      <div className="lg:col-span-5 bg-planner-paper p-4 rounded-xl border border-[#3d1e03]/10 shadow-sm space-y-4">
        <div className="border-b border-[#3d1e03]/10 pb-2 flex items-center justify-between">
          <h2 className="font-caveat text-3xl font-extrabold text-maroon flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-red-500 fill-current" /> Wishlist Gallery
          </h2>
          <span className="text-[10px] text-ink-gray font-bold uppercase">
            {wishlistBooks.length} Items
          </span>
        </div>

        {wishlistBooks.length === 0 ? (
          <div className="text-center py-12 text-ink-gray italic bg-planner-base/20 rounded-lg">
            Wishlist is empty.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {wishlistBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => onSelectBook(book.id)}
                className="bg-planner-paper p-2 rounded-lg border border-[#3d1e03]/5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="aspect-[3/4] bg-stone-100 rounded overflow-hidden relative border border-black/5 shadow-inner mb-2">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getOptimizedCoverUrl(book.coverUrl, 120)}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center bg-gradient-to-br from-tab-peach to-planner-base">
                      <span className="font-caveat text-xs font-bold leading-tight">{book.title}</span>
                    </div>
                  )}

                  {book.bought && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-emerald-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider shadow">
                        Bought
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-bold text-[11px] text-ink-brown truncate">{book.title}</h3>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-ink-gray font-medium truncate max-w-[60px]">
                      {book.author}
                    </span>
                    {book.price && (
                      <span className="text-[10px] font-extrabold text-maroon">
                        ₹{book.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Checklist Table (7 Cols on large layout) */}
      <div className="lg:col-span-7 bg-planner-paper rounded-xl border border-[#3d1e03]/10 shadow-md overflow-hidden">
        {/* Burgundy Table Header */}
        <div className="bg-maroon px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-extrabold uppercase tracking-wider text-xs">
              Wishlist Checklist
            </span>
          </div>
          <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded">
            {wishlistBooks.filter((b) => b.bought).length} Bought
          </span>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[500px] text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-ink-gray font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 w-12 text-center">Bought?</th>
                <th className="py-2.5 px-3">Book Title</th>
                <th className="py-2.5 px-3">Author</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {wishlistBooks.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-stone-100 hover:bg-[#ffe5ec]/35 transition-colors odd:bg-pastel-pink/20 even:bg-planner-paper cursor-pointer"
                  onClick={() => onSelectBook(book.id)}
                >
                  {/* Checkbox cell */}
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBought(book);
                      }}
                      className="p-1 text-maroon hover:scale-105 transition-transform"
                    >
                      {book.bought ? (
                        <CheckSquare className="w-4 h-4 fill-pastel-pink text-maroon" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300" />
                      )}
                    </button>
                  </td>

                  {/* Title */}
                  <td className={`py-2.5 px-3 font-bold text-ink-brown ${book.bought ? "line-through text-ink-gray/60" : ""}`}>
                    {book.title}
                  </td>

                  {/* Author */}
                  <td className="py-2.5 px-3 text-ink-gray">
                    {book.author}
                  </td>

                  {/* Format */}
                  <td className="py-2.5 px-3">
                    {book.formats && book.formats[0] ? renderFormatTag(book.formats[0]) : "-"}
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-3">
                    {renderPriorityBadge(book.priority)}
                  </td>
                </tr>
              ))}

              {wishlistBooks.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-gray italic bg-planner-paper">
                    No books in your wishlist yet. Click Add Book to create a wishlist entry!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
