"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Keyboard, Search, Sparkles, BookOpen, Upload, Image as ImageIcon, Check } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Book, fileToBase64 } from "../lib/db";

interface AddBookProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Omit<Book, "id">) => void;
  books: Book[];
}

interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pageCount: number;
  categories: string[];
  isbn: string;
}

// Dynamic search backup from Open Library for when Google API quota is exhausted
export default function AddBook({ isOpen, onClose, onAddBook, books }: AddBookProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  
  // Book Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [pagesTotal, setPagesTotal] = useState<number>(0);
  const [genres, setGenres] = useState("");
  const [isbn, setIsbn] = useState("");
  const [format, setFormat] = useState<"physical" | "digital" | "audio">("physical");

  // New fields
  const [subGenre, setSubGenre] = useState("");
  const [priority, setPriority] = useState<'Must read' | 'Interested' | 'Maybe'>('Interested');
  const [source, setSource] = useState<'Gift' | 'Purchased' | 'Borrowed'>('Purchased');
  const [price, setPrice] = useState<number>(0);
  const [isWishlist, setIsWishlist] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastQueryRef = useRef("");

  // Initialize and stop scanner
  useEffect(() => {
    if (isScanning && isOpen) {
      const timer = setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.7;
                return { width: size, height: size * 0.6 };
              }
            },
            (decodedText) => {
              stopScanning();
              setSearchQuery(decodedText);
            },
            () => {
              // Quiet scanning error handler
            }
          ).catch((err) => {
            console.error("Error starting camera scanner:", err);
            setScanError("Camera access denied or unavailable. Try manual lookup!");
            setIsScanning(false);
          });
        } catch (err) {
          console.error(err);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.stop()
            .then(() => { scannerRef.current = null; })
            .catch(e => console.log("Stop error:", e));
        }
      };
    }
  }, [isScanning, isOpen]);

  // Debounce search input as user types
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setSearchResults([]);
      setIsLoading(false);
      lastQueryRef.current = "";
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSearchBook(trimmed);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const stopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.stop()
        .then(() => { scannerRef.current = null; })
        .catch(e => console.log("Stop error:", e));
    }
  };

  // Open Library direct dynamic search (Google Books removed to prevent quota errors)
  const handleSearchBook = async (query: string) => {
    if (!query.trim()) return;
    if (query === lastQueryRef.current) return;
    lastQueryRef.current = query;
    setIsLoading(true);
    setScanError("");
    setSearchResults([]);
    setIsFallbackActive(false);

    try {
      // Query free, open-source Open Library API directly
      const olResponse = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`
      );
      
      if (!olResponse.ok) {
        throw new Error("Open Library search failed");
      }
      
      const olData = await olResponse.json();
      
      if (olData.docs && olData.docs.length > 0) {
        const results = olData.docs.map((doc: any) => {
          const coverUrl = doc.cover_i 
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : "";
          
          return {
            id: doc.key,
            title: doc.title || "",
            author: doc.author_name ? doc.author_name.join(", ") : "Unknown Author",
            coverUrl,
            pageCount: doc.number_of_pages_median || doc.number_of_pages || 0,
            categories: doc.subject ? doc.subject.slice(0, 3) : [],
            isbn: doc.isbn ? doc.isbn[0] : ""
          };
        });
        setSearchResults(results);
      } else {
        setScanError("No matching novels found online. Please fill details manually!");
      }
    } catch (olError: any) {
      console.log("Open Library lookup failed: " + (olError?.message || olError));
      setScanError("Online query is currently unavailable. Please type details manually in the form below!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBookResult = (book: SearchResult) => {
    setTitle(book.title);
    setAuthor(book.author);
    // Force HTTPS to prevent slow mixed-content redirect delays
    const secureCover = book.coverUrl ? book.coverUrl.replace(/^http:/i, "https:") : "";
    setCoverUrl(secureCover);
    setPagesTotal(book.pageCount);
    setGenres(book.categories.join(", "));
    setIsbn(book.isbn);
    setSearchResults([]); // close results dropdown
    setScanError("");
  };

  // Direct cover file upload handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Str = await fileToBase64(file);
        setCoverUrl(base64Str);
      } catch (err) {
        console.error("Error reading file:", err);
        setScanError("Could not process cover photo. Try another image format!");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) {
      setScanError("Title and Author are required!");
      return;
    }

    const alreadyExists = books.some(
      (b) => b.title.toLowerCase().trim() === title.toLowerCase().trim() &&
             b.author.toLowerCase().trim() === author.toLowerCase().trim()
    );

    if (alreadyExists) {
      setScanError("This novel is already added in your journal!");
      return;
    }

    const genreList = genres
      ? genres.split(",").map((g) => g.trim()).filter(Boolean)
      : ["Fiction"];

    onAddBook({
      title,
      author,
      coverUrl,
      pagesTotal: Number(pagesTotal) || 0,
      pagesRead: 0,
      status: "want_to_read",
      formats: [format],
      rating: 0,
      spice: 0,
      summary: "",
      review: "",
      quotes: [],
      scrapbookImages: [],
      genres: genreList,
      isbn: isbn || searchQuery,
      subGenre,
      priority,
      source,
      price: price ? Number(price) : undefined,
      bought: false,
      isWishlist
    });

    setTitle("");
    setAuthor("");
    setCoverUrl("");
    setPagesTotal(0);
    setGenres("");
    setIsbn("");
    setSearchQuery("");
    setFormat("physical");
    setSubGenre("");
    setPriority("Interested");
    setSource("Purchased");
    setPrice(0);
    setIsWishlist(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="absolute inset-0 bg-stone-900/60 z-10"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative bg-planner-paper rounded-2xl shadow-2xl z-20 overflow-hidden flex flex-col w-full max-w-[620px] h-full max-h-[90vh] sm:max-h-[680px] border border-[#3d1e03]/10"
          >
            {/* Burgundy Header */}
            <div className="bg-maroon text-white flex items-center justify-between px-4 py-3 flex-shrink-0">
              <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#ffccd5]" /> Add Book to Journal
              </h2>
              <button
                onClick={() => {
                  stopScanning();
                  onClose();
                }}
                className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Form body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5">
              {scanError && (
                <div className="text-xs font-semibold text-[#800f2f] bg-[#fff0f3] border border-[#ffccd5]/50 p-2.5 rounded-lg text-center">
                  {scanError}
                </div>
              )}

              {/* Mode Toggle */}
              <div className="bg-planner-base p-1.5 rounded-lg border border-[#3d1e03]/10 grid grid-cols-2 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsWishlist(false)}
                  className={`py-1.5 rounded transition-all cursor-pointer ${
                    !isWishlist ? "bg-maroon text-white shadow-sm" : "text-ink-gray hover:text-ink-brown"
                  }`}
                >
                  Add to Reading Library
                </button>
                <button
                  type="button"
                  onClick={() => setIsWishlist(true)}
                  className={`py-1.5 rounded transition-all cursor-pointer ${
                    isWishlist ? "bg-maroon text-white shadow-sm" : "text-ink-gray hover:text-ink-brown"
                  }`}
                >
                  Add to Wishlist log
                </button>
              </div>

              {/* Barcode Scan triggers */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsScanning(true);
                    setScanError("");
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isScanning
                      ? "bg-shelf-brown text-planner-base border-shelf-brown"
                      : "bg-planner-base text-ink-brown border-[#3d1e03]/10 hover:bg-tab-peach"
                  }`}
                >
                  <Camera className="w-4 h-4" /> Scan Barcode
                </button>
                <button
                  type="button"
                  onClick={stopScanning}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isScanning
                      ? "bg-shelf-brown text-planner-base border-shelf-brown"
                      : "bg-planner-base text-ink-brown border-[#3d1e03]/10 hover:bg-tab-peach"
                  }`}
                >
                  <Keyboard className="w-4 h-4" /> Manual Form
                </button>
              </div>

              {/* Camera Scanner View */}
              {isScanning && (
                <div className="space-y-2">
                  <div className="bg-black rounded-xl overflow-hidden aspect-[4/3] relative flex flex-col justify-center items-center">
                    <div id="reader" className="w-full h-full" />
                    <div className="absolute inset-0 pointer-events-none border-[30px] border-black/40 flex items-center justify-center">
                      <div className="w-3/4 h-2/3 border-2 border-dashed border-accent-orange rounded relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_red] animate-bounce" />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={stopScanning}
                    className="w-full text-center text-xs font-semibold text-accent-orange underline py-1"
                  >
                    Cancel Scan & Enter Manually
                  </button>
                </div>
              )}

              {/* Novel Google Search Section with dropdown select results list */}
              {!isScanning && (
                <div className="bg-planner-base p-4 rounded-xl border border-[#3d1e03]/10 space-y-3 relative">
                  <span className="text-[10px] font-bold text-ink-gray uppercase block flex items-center gap-1">
                    🔍 Search Novel
                    {isFallbackActive && (
                      <span className="bg-rose-100 text-rose-800 text-[8px] font-bold uppercase px-1 rounded">
                        BookTok Fallback Active
                      </span>
                    )}
                  </span>
                  
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-ink-gray" />
                      <input
                        type="text"
                        placeholder="Search title or author (e.g. Emily Henry, Maas)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-planner-paper text-ink-brown pl-8 pr-8 py-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                      />
                      {isLoading && (
                        <div className="absolute right-2.5 top-2.5">
                          <svg className="animate-spin h-3.5 w-3.5 text-maroon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown list of Search Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-[102%] bg-planner-paper border border-[#3d1e03]/15 shadow-2xl rounded-xl p-2 z-50 space-y-1 max-h-56 overflow-y-auto no-scrollbar">
                      <div className="text-[9px] uppercase font-bold text-ink-gray px-2 pb-1 border-b border-stone-100 flex justify-between">
                        <span>{isFallbackActive ? "BookTok Cozy Matches" : "Matching Books Found"}</span>
                        <button type="button" onClick={() => setSearchResults([])} className="text-red-500 hover:underline font-extrabold">Close</button>
                      </div>
                      
                      {searchResults.map((book) => (
                        <div
                          key={book.id}
                          onClick={() => handleSelectBookResult(book)}
                          className="flex gap-3 items-center p-2 rounded-lg hover:bg-[#fff0f3] cursor-pointer transition-all border border-transparent hover:border-[#ffccd5]"
                        >
                          <div className="w-8 aspect-[2/3] bg-stone-100 border rounded overflow-hidden flex-shrink-0">
                            {book.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-stone-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h5 className="text-xs font-bold text-ink-brown truncate">{book.title}</h5>
                            <p className="text-[10px] text-ink-gray truncate">by {book.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-ink-brown block mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A Court of Thorns and Roses"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-brown block mb-1">Author Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah J. Maas"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-brown block mb-1">Total Pages</label>
                    <input
                      type="number"
                      placeholder="e.g. 416"
                      value={pagesTotal || ""}
                      onChange={(e) => setPagesTotal(Number(e.target.value))}
                      className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-brown block mb-1">Genres</label>
                    <input
                      type="text"
                      placeholder="e.g. Fantasy, Romance"
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-brown block mb-1">Sub-genre</label>
                    <input
                      type="text"
                      placeholder="e.g. Fae Romance"
                      value={subGenre}
                      onChange={(e) => setSubGenre(e.target.value)}
                      className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-brown block mb-1">Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                      className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="physical">Physical</option>
                      <option value="digital">Digital</option>
                      <option value="audio">Audio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-brown block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="Must read">Must read</option>
                      <option value="Interested">Interested</option>
                      <option value="Maybe">Maybe</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-brown block mb-1">Source</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as any)}
                      className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="Purchased">Purchased</option>
                      <option value="Gift">Gift</option>
                      <option value="Borrowed">Borrowed</option>
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-bold text-ink-brown block mb-1">Book Price / Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14.99"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-planner-base p-2 border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                {/* Cover Upload Box */}
                <div className="bg-planner-paper p-3 rounded-lg border border-[#3d1e03]/10 space-y-2">
                  <span className="text-xs font-bold text-ink-brown block">Book Cover Photo</span>
                  
                  <div className="flex gap-4 items-center">
                    <div className="w-16 aspect-[3/4] bg-stone-50 rounded border flex items-center justify-center text-center overflow-hidden flex-shrink-0">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-stone-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Paste image link URL..."
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          className="flex-1 bg-planner-base p-1.5 border border-[#3d1e03]/10 rounded text-[10px] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-maroon text-white p-1.5 rounded flex items-center justify-center gap-1 hover:bg-maroon/90 cursor-pointer"
                          title="Upload cover image directly from system"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-ink-gray block">
                        Directly paste a URL or upload a file from your device.
                      </span>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-maroon text-white py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-maroon/90 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    {isWishlist ? "Add to Wishlist" : "Add to Library"}
                  </button>
                </div>
              </form>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
