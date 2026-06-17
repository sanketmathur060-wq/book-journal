"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Sparkles, Heart, Plus, Search, Loader2 } from "lucide-react";
import { Book, getOptimizedCoverUrl } from "../lib/db";

interface AuthorsProps {
  books: Book[];
  onAddBook: (book: Omit<Book, "id">) => void;
}

interface CatalogBook {
  title: string;
  coverUrl: string;
  pagesTotal: number;
  genre: string;
  isbn: string;
  releaseDate?: string;
  status: "want_to_read" | "completed" | "reading";
}

interface AuthorProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  released: CatalogBook[];
  future: CatalogBook[];
}

const SPOTLIGHT_AUTHORS = [
  "Sarah J. Maas",
  "Rebecca Yarros",
  "Colleen Hoover",
  "Emily Henry",
  "Ali Hazelwood",
  "Stephen King",
  "Brandon Sanderson"
];

export default function Authors({ books, onAddBook }: AuthorsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAuthor, setActiveAuthor] = useState("Sarah J. Maas");
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const lastQueryRef = useRef("");

  // Fetch Author Details and Works dynamically from Open Library API
  const fetchAuthorCatalog = async (authorName: string) => {
    if (!authorName.trim()) return;
    if (authorName.trim() === lastQueryRef.current) return;
    lastQueryRef.current = authorName.trim();
    setLoading(true);
    setErrorMsg("");
    try {
      // Step 1: Find author key
      const searchRes = await fetch(
        `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}`
      );
      if (!searchRes.ok) throw new Error("Failed to search authors");
      const searchData = await searchRes.json();
      
      if (!searchData.docs || searchData.docs.length === 0) {
        throw new Error(`No author details found online for "${authorName}".`);
      }

      const authorDoc = searchData.docs[0];
      const authorKey = authorDoc.key; // e.g. OL23919A

      // Step 2: Fetch author details (Bio & Photo)
      const detailRes = await fetch(`https://openlibrary.org/authors/${authorKey}.json`);
      if (!detailRes.ok) throw new Error("Failed to load author profile details");
      const detailData = await detailRes.json();

      let bio = "No biography available.";
      if (detailData.bio) {
        bio = typeof detailData.bio === "string" ? detailData.bio : detailData.bio.value || bio;
      }
      // Truncate excessively long bios for aesthetics
      if (bio.length > 300) {
        bio = bio.substring(0, 300) + "...";
      }

      let avatarUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=60";
      if (detailData.photos && detailData.photos.length > 0) {
        avatarUrl = `https://covers.openlibrary.org/a/id/${detailData.photos[0]}-M.jpg`;
      }

      // Step 3: Fetch author works
      const worksRes = await fetch(`https://openlibrary.org/authors/${authorKey}/works.json?limit=60`);
      if (!worksRes.ok) throw new Error("Failed to load author catalog books");
      const worksData = await worksRes.json();

      const released: CatalogBook[] = [];
      const future: CatalogBook[] = [];
      const seenTitles = new Set<string>();

      if (worksData.entries && worksData.entries.length > 0) {
        worksData.entries.forEach((work: any) => {
          const title = work.title || "";
          const normTitle = title.toLowerCase().trim();
          
          // De-duplicate translation editions or similar titles
          if (seenTitles.has(normTitle)) return;
          seenTitles.add(normTitle);

          let coverUrl = "";
          if (work.covers && work.covers.length > 0) {
            coverUrl = `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`;
          }

          const publishDateStr = work.first_publish_date || "";
          
          // Estimate pages count (works object doesn't always have pages count, so median estimation is used)
          const pagesTotal = work.subjects?.includes("Fiction") ? 380 : 320;
          
          const genres = work.subjects ? work.subjects.slice(0, 2) : ["Fiction"];
          const primaryGenre = genres.join(", ");

          // Detect future release dates (e.g. contains 2026, 2027, 2028, 2029 or future years)
          const isFuture = /2026|2027|2028|2029/i.test(publishDateStr);

          const catalogBook: CatalogBook = {
            title,
            coverUrl,
            pagesTotal,
            genre: primaryGenre || "Fiction",
            isbn: work.key ? work.key.replace("/works/", "") : Math.random().toString(),
            releaseDate: isFuture ? publishDateStr : undefined,
            status: isFuture ? "want_to_read" : "completed"
          };

          if (isFuture) {
            future.push(catalogBook);
          } else {
            released.push(catalogBook);
          }
        });
      }

      // Sort released books by alphabetical or simulated order
      released.sort((a, b) => a.title.localeCompare(b.title));

      setProfile({
        name: detailData.name || authorName,
        bio,
        avatarUrl,
        released,
        future
      });
      setActiveAuthor(detailData.name || authorName);
    } catch (err: any) {
      console.log("Author search catalog issue:", err?.message || err);
      setErrorMsg(err.message || "Failed to retrieve author catalog.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search profile load on initial render or active author change
  useEffect(() => {
    fetchAuthorCatalog(activeAuthor);
  }, []);

  // Debounce author search input as user types
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      lastQueryRef.current = "";
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchAuthorCatalog(trimmed);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleAddCatalogBook = (catBook: CatalogBook, asWishlist: boolean) => {
    const alreadyExists = books.some(
      (b) => b.isbn === catBook.isbn || b.title.toLowerCase() === catBook.title.toLowerCase()
    );
    
    if (alreadyExists) {
      setSuccessMsg(`"${catBook.title}" is already in your journal!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      return;
    }

    onAddBook({
      title: catBook.title,
      author: activeAuthor,
      coverUrl: catBook.coverUrl,
      pagesTotal: catBook.pagesTotal,
      pagesRead: asWishlist ? 0 : (catBook.status === "completed" ? catBook.pagesTotal : 0),
      status: asWishlist ? "want_to_read" : catBook.status,
      formats: ["physical"],
      rating: asWishlist ? 0 : (catBook.status === "completed" ? 4 : 0),
      spice: 0,
      summary: "",
      review: "",
      quotes: [],
      scrapbookImages: [],
      genres: [catBook.genre],
      isbn: catBook.isbn,
      priority: asWishlist ? "Interested" : "Must read",
      source: "Purchased",
      bought: !asWishlist,
      isWishlist: asWishlist
    });

    setSuccessMsg(`Saved "${catBook.title}" to your ${asWishlist ? "Wishlist" : "Library Bookcase"}! 📖`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Author Search & Spotlight Sidebar (4 Cols) */}
      <div className="lg:col-span-4 bg-planner-paper p-4 rounded-xl border border-[#3d1e03]/10 shadow-sm space-y-4">
        
        {/* Dynamic Lookup Search form */}
        <form onSubmit={handleSearchSubmit} className="space-y-2.5">
          <label className="text-[10px] font-bold text-ink-gray uppercase tracking-wider block">
            🔍 Search Novelist Catalog
          </label>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-ink-gray" />
            <input
              type="text"
              placeholder="e.g. Stephen King, Maas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-planner-paper text-ink-brown pl-8 pr-8 py-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
            />
            {loading && (
              <div className="absolute right-2.5 top-2.5">
                <svg className="animate-spin h-3.5 w-3.5 text-maroon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </form>

        <h3 className="font-caveat text-2xl font-extrabold text-maroon pt-2 border-t border-[#3d1e03]/10 flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-amber-500 fill-current" /> Spotlight Authors
        </h3>
        
        <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-2">
          {SPOTLIGHT_AUTHORS.map((name) => {
            const isActive = name.toLowerCase() === activeAuthor.toLowerCase();
            return (
              <button
                key={name}
                onClick={() => {
                  setSearchQuery("");
                  fetchAuthorCatalog(name);
                }}
                className={`text-left px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-maroon text-white border-maroon shadow-md"
                    : "bg-planner-paper text-ink-gray border-[#3d1e03]/10 hover:bg-[#ffe5ec]/20 hover:text-ink-brown"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#ffccd5]" />
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Author Catalog Inspector (8 Cols) */}
      <div className="lg:col-span-8 bg-planner-paper rounded-xl border border-[#3d1e03]/10 shadow-md overflow-hidden flex flex-col min-h-[350px]">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-ink-gray space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-maroon" />
            <span className="font-caveat text-xl font-bold animate-pulse">Scanning library archives...</span>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6 space-y-2">
            <span className="text-3xl">📭</span>
            <p className="text-xs font-bold text-[#800f2f]">{errorMsg}</p>
            <p className="text-[10px] text-ink-gray">Try verifying the spelling or query another author.</p>
          </div>
        ) : profile ? (
          <>
            {/* Burgundy Header Card */}
            <div className="bg-[#800f2f] text-white p-6 border-b border-black/10 flex flex-col md:flex-row gap-4 items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-md bg-stone-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="font-caveat text-4xl font-extrabold text-white leading-none">
                  {profile.name}
                </h3>
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                  Accurate Novels Release Catalog
                </p>
                <p className="text-xs leading-relaxed text-white/95 font-medium font-typewriter">
                  {profile.bio}
                </p>
              </div>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-6">
              
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center py-2 px-4 rounded-lg shadow-sm">
                  {successMsg}
                </div>
              )}

              {/* 1. RELEASED NOVELS CATALOG */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="font-caveat text-2xl font-bold text-[#800f2f] flex items-center gap-1">
                    📚 Published Publications
                  </h4>
                  <span className="text-[9px] bg-stone-100 px-2 py-0.5 rounded font-extrabold text-ink-gray uppercase">
                    {profile.released.length} Titles
                  </span>
                </div>
                
                {profile.released.length === 0 ? (
                  <p className="text-xs text-ink-gray italic py-4">No published works registered on catalog.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
                    {profile.released.map((book, idx) => (
                      <div key={idx} className="bg-planner-paper p-3 rounded-xl border border-[#3d1e03]/10 flex flex-col justify-between shadow-sm relative group hover:shadow-md transition-all">
                        
                        <div>
                          {/* Cover Frame */}
                          <div className="aspect-[3/4] bg-stone-100 rounded border flex items-center justify-center overflow-hidden mb-2.5 shadow-inner">
                            {book.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getOptimizedCoverUrl(book.coverUrl, 130)}
                                alt={book.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-tab-peach/40 to-planner-base flex items-center justify-center p-2 text-center text-[10px] font-bold font-caveat leading-tight">
                                {book.title}
                              </div>
                            )}
                          </div>

                          <h5 className="font-bold text-xs text-ink-brown leading-tight mb-1 line-clamp-2">
                            {book.title}
                          </h5>
                          <p className="text-[9px] text-ink-gray font-semibold mb-3 truncate">
                            Genre: {book.genre}
                          </p>
                        </div>

                        <div className="space-y-1 mt-auto">
                          <button
                            onClick={() => handleAddCatalogBook(book, false)}
                            className="w-full bg-maroon text-white font-extrabold py-1.5 rounded-lg text-[9px] uppercase shadow-sm hover:bg-maroon/90 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add to Shelf
                          </button>
                          <button
                            onClick={() => handleAddCatalogBook(book, true)}
                            className="w-full bg-planner-base text-ink-brown border border-[#3d1e03]/10 font-bold py-1.5 rounded-lg text-[9px] uppercase hover:bg-tab-peach/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Heart className="w-3 h-3 text-red-500" /> Wishlist
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. UPCOMING FUTURE RELEASES */}
              <div className="space-y-3 pt-2">
                <h4 className="font-caveat text-2xl font-bold text-[#800f2f] flex items-center gap-1 border-b pb-1.5">
                  🔮 Anticipated Upcoming Releases
                </h4>

                {profile.future.length === 0 ? (
                  <div className="bg-stone-50 border border-stone-150 p-4 rounded-xl text-center text-xs italic text-ink-gray">
                    No future releases currently registered for this author catalog.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.future.map((book, idx) => (
                      <div key={idx} className="bg-[#fff0f3]/40 p-4 rounded-xl border border-[#ffccd5]/50 flex gap-4 shadow-sm relative overflow-hidden">
                        
                        <div className="w-16 aspect-[2/3] bg-stone-100 rounded border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                          {book.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getOptimizedCoverUrl(book.coverUrl, 100)}
                              alt={book.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-tab-peach/30 to-[#ffccd5]/30 flex flex-col items-center justify-center p-1 text-center">
                              <span className="text-[14px] animate-pulse">🔮</span>
                              <span className="text-[8px] font-bold text-ink-gray uppercase mt-0.5">TBA</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="font-bold text-xs text-ink-brown leading-tight">
                              {book.title}
                            </h5>
                            <p className="text-[10px] text-maroon font-extrabold uppercase mt-1">
                              Release Year: {book.releaseDate || "TBA"}
                            </p>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAddCatalogBook(book, true)}
                              className="flex-1 bg-maroon text-white font-extrabold py-1.5 px-3 rounded-lg text-[9px] uppercase shadow-sm hover:bg-maroon/90 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Heart className="w-3 h-3 text-white fill-current" /> Auto-Add to Wishlist
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center py-20 text-ink-gray">
            Search an author above to look up their works.
          </div>
        )}

      </div>

    </div>
  );
}
