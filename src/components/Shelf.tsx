"use client";

import React from "react";
import { Book } from "../lib/db";
import { BookMarked } from "lucide-react";

interface ShelfProps {
  books: Book[];
  onSelectBook: (id: string) => void;
}

export default function Shelf({ books, onSelectBook }: ShelfProps) {
  // Group books into chunks of 3 for shelves
  const shelfCapacity = 3;
  const shelves: Book[][] = [];
  
  for (let i = 0; i < books.length; i += shelfCapacity) {
    shelves.push(books.slice(i, i + shelfCapacity));
  }

  // Ensure we display at least 3 shelves for a full bookcase visual effect even if empty
  const emptyShelvesCount = Math.max(3 - shelves.length, 0);
  const displayShelves = [...shelves];
  for (let i = 0; i < emptyShelvesCount; i++) {
    displayShelves.push([]);
  }

  return (
    <div className="p-4 space-y-6">
      {/* Bookcase header */}
      <div className="text-center py-2 border-b border-[#3d1e03]/10">
        <h2 className="font-caveat text-3xl font-bold text-shelf-brown">
          My Digital Bookcase
        </h2>
        <p className="text-[10px] uppercase tracking-wider text-ink-gray mt-0.5">
          {books.length} Books Collected
        </p>
      </div>

      {/* Bookcase Container */}
      <div className="space-y-8 pt-4">
        {displayShelves.map((shelfBooks, idx) => (
          <div key={idx} className="relative flex flex-col justify-end min-h-[160px] pb-3">
            {/* Books Container */}
            <div className="flex justify-around items-end px-4 gap-4 z-10 w-full mb-[-4px]">
              {shelfBooks.map((book, bIdx) => {
                // Generate a slight random rotation for cozy realism
                const rotations = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0"];
                const rotClass = rotations[(idx + bIdx) % rotations.length];
                
                return (
                  <div
                    key={book.id}
                    onClick={() => onSelectBook(book.id)}
                    className={`w-[75px] max-w-[80px] aspect-[2/3] relative group cursor-pointer transform ${rotClass} hover:rotate-0 hover:scale-105 hover:-translate-y-1 transition-all duration-300`}
                  >
                    {/* Shadow behind book */}
                    <div className="absolute inset-0 bg-black/30 rounded-md blur-[2px] translate-y-1 translate-x-1 group-hover:translate-y-2 group-hover:translate-x-2 transition-all"></div>
                    
                    {/* Book Cover */}
                    <div className="absolute inset-0 rounded-md overflow-hidden bg-planner-paper border border-[#3d1e03]/20 shadow-sm flex flex-col justify-between">
                      {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 bg-gradient-to-br from-tab-peach to-planner-base text-center">
                          <span className="font-caveat text-[10px] leading-tight font-bold text-ink-brown line-clamp-4">
                            {book.title}
                          </span>
                        </div>
                      )}
                      
                      {/* Spine shading border overlay for 3D look */}
                      <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/25 to-transparent"></div>
                      <div className="absolute top-0 bottom-0 left-[2.5px] w-[0.5px] bg-white/20"></div>
                    </div>
                  </div>
                );
              })}

              {shelfBooks.length === 0 && (
                <div className="h-[90px] flex items-center justify-center text-ink-gray/40 text-xs italic font-semibold">
                  {idx === 0 && books.length === 0 ? "Add books to fill" : ""}
                </div>
              )}
            </div>

            {/* The Wooden Shelf Board */}
            <div className="h-4 w-full shelf-wood rounded-sm relative z-20">
              {/* Wooden planks lines */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10"></div>
              <div className="absolute bottom-[2px] left-0 right-0 h-[1px] bg-black/30"></div>
            </div>
            
            {/* Shelf shadow underneath */}
            <div className="absolute bottom-[-16px] left-2 right-2 h-4 bg-gradient-to-b from-black/20 to-transparent z-0"></div>
          </div>
        ))}
      </div>
      
      {books.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-planner-paper rounded-xl border border-dashed border-[#3d1e03]/10">
          <BookMarked className="w-8 h-8 text-ink-gray/40 mb-2" />
          <p className="font-caveat text-xl font-bold text-ink-brown">Your bookcase is ready!</p>
          <p className="text-[11px] text-ink-gray">Use the bottom &quot;Add Book&quot; scanner to stack your books.</p>
        </div>
      )}
    </div>
  );
}
