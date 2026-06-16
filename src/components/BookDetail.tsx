"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Star, Trash2, Plus, X, Calendar, BookOpen, Sparkles, Upload, MessageSquare, Heart, Edit3 } from "lucide-react";
import { Book, fileToBase64, getOptimizedCoverUrl } from "../lib/db";

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onSave: (updatedBook: Book) => void;
  onDelete: (id: string) => void;
}

export default function BookDetail({ book, onBack, onSave, onDelete }: BookDetailProps) {
  // Local states for editing fields to avoid lagging on DB writes
  const [status, setStatus] = useState(book.status);
  const [pagesRead, setPagesRead] = useState(book.pagesRead);
  const [pagesTotal, setPagesTotal] = useState(book.pagesTotal);
  const [startDate, setStartDate] = useState(book.startDate || "");
  const [endDate, setEndDate] = useState(book.endDate || "");
  const [formats, setFormats] = useState<("physical" | "digital" | "audio")[]>(book.formats || []);
  const [rating, setRating] = useState(book.rating);
  const [spice, setSpice] = useState(book.spice);
  const [summary, setSummary] = useState(book.summary || "");
  const [review, setReview] = useState(book.review || "");
  const [newQuote, setNewQuote] = useState("");
  const [quotes, setQuotes] = useState<string[]>(book.quotes || []);
  const [scrapbookImages, setScrapbookImages] = useState<string[]>(book.scrapbookImages || []);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // New editable header states
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [coverUrl, setCoverUrl] = useState(book.coverUrl || "");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Sync states with prop when active book changes
  useEffect(() => {
    setStatus(book.status);
    setPagesRead(book.pagesRead);
    setPagesTotal(book.pagesTotal);
    setStartDate(book.startDate || "");
    setEndDate(book.endDate || "");
    setFormats(book.formats || []);
    setRating(book.rating);
    setSpice(book.spice);
    setSummary(book.summary || "");
    setReview(book.review || "");
    setQuotes(book.quotes || []);
    setScrapbookImages(book.scrapbookImages || []);
    setTitle(book.title);
    setAuthor(book.author);
    setCoverUrl(book.coverUrl || "");
    setIsEditingHeader(false);
  }, [book]);

  // New fields local states
  const [subGenre, setSubGenre] = useState(book.subGenre || "");
  const [priority, setPriority] = useState(book.priority || "Interested");
  const [source, setSource] = useState(book.source || "Purchased");
  const [price, setPrice] = useState(book.price || 0);
  const [isWishlist, setIsWishlist] = useState(!!book.isWishlist);

  // Auto-save when details change
  const saveChanges = (updates: Partial<Book>) => {
    const updatedBook = {
      ...book,
      status,
      pagesRead,
      pagesTotal,
      startDate,
      endDate,
      formats,
      rating,
      spice,
      summary,
      review,
      quotes,
      scrapbookImages,
      subGenre,
      priority,
      source,
      price,
      isWishlist,
      title,
      author,
      coverUrl,
      ...updates,
    };
    
    // Automatically set status to completed if pagesRead reaches pagesTotal
    if (updates.pagesRead !== undefined && updates.pagesRead >= pagesTotal && pagesTotal > 0) {
      updatedBook.status = "completed";
      setStatus("completed");
      if (!endDate) {
        const today = new Date().toISOString().split("T")[0];
        updatedBook.endDate = today;
        setEndDate(today);
      }
    }
    
    onSave(updatedBook);
    
    // Show quick feedback
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 1200);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const base64 = await fileToBase64(files[0]);
      setCoverUrl(base64);
      saveChanges({ coverUrl: base64 });
    } catch (err) {
      console.error("Cover image update error:", err);
    }
  };

  const handleFormatChange = (fmt: "physical" | "digital" | "audio") => {
    let updated: ("physical" | "digital" | "audio")[] = [];
    if (formats.includes(fmt)) {
      updated = formats.filter((f) => f !== fmt);
    } else {
      updated = [...formats, fmt];
    }
    setFormats(updated);
    saveChanges({ formats: updated });
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.trim()) return;
    const updatedQuotes = [...quotes, newQuote.trim()];
    setQuotes(updatedQuotes);
    setNewQuote("");
    saveChanges({ quotes: updatedQuotes });
  };

  const handleDeleteQuote = (idx: number) => {
    const updatedQuotes = quotes.filter((_, i) => i !== idx);
    setQuotes(updatedQuotes);
    saveChanges({ quotes: updatedQuotes });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const base64 = await fileToBase64(files[0]);
      const updatedImages = [...scrapbookImages, base64];
      setScrapbookImages(updatedImages);
      saveChanges({ scrapbookImages: updatedImages });
    } catch (err) {
      console.error("Image read error:", err);
    }
  };

  const handleDeleteImage = (idx: number) => {
    const updatedImages = scrapbookImages.filter((_, i) => i !== idx);
    setScrapbookImages(updatedImages);
    saveChanges({ scrapbookImages: updatedImages });
  };

  const handleDeleteBook = () => {
    if (confirm("Are you sure you want to delete this digital journal page?")) {
      onDelete(book.id);
    }
  };

  const handleMoveToLibrary = () => {
    setIsWishlist(false);
    saveChanges({ isWishlist: false, status: "want_to_read", bought: true });
  };

  return (
    <div className="flex flex-col min-h-full bg-planner-base text-ink-brown relative select-none">
      
      {/* Top Banner Control bar */}
      <div className="sticky top-0 bg-planner-base/95 backdrop-blur z-30 flex items-center justify-between px-4 py-3 border-b border-[#3d1e03]/10">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-ink-gray hover:text-ink-brown cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Log
        </button>

        <span className="text-[11px] font-bold text-ink-gray uppercase bg-tab-peach/60 px-2 py-0.5 rounded border border-[#3d1e03]/5">
          {isSavedAlert ? "✨ Auto-Saved" : isWishlist ? "💗 Wishlist Item" : "📖 Library Entry"}
        </span>

        <button
          onClick={handleDeleteBook}
          className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          title="Delete Journal Entry"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Wishlist Converter Banner */}
      {isWishlist && (
        <div className="bg-pastel-pink border-b border-maroon/10 px-4 py-2 flex items-center justify-between text-xs">
          <span className="font-bold text-maroon flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-red-500 fill-current" /> This book is currently in your Wishlist.
          </span>
          <button
            onClick={handleMoveToLibrary}
            className="bg-maroon hover:bg-maroon/90 text-white font-extrabold px-3 py-1 rounded shadow-sm text-[10px] uppercase cursor-pointer"
          >
            Move to Active Log
          </button>
        </div>
      )}

      {/* Main Journal Page content */}
      <div className="flex-1 p-3 sm:p-6 space-y-6 pb-24 max-w-5xl mx-auto w-full">
        
        {/* Book Header Section (Scrapbook details card) */}
        <div className="bg-planner-paper rounded-2xl p-4 sm:p-6 border border-[#3d1e03]/15 shadow-sm space-y-4 relative">
          
          {/* Notebook Spiral Graphic top-bar */}
          <div className="absolute top-[-10px] left-8 right-8 flex justify-between pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
              <div key={s} className="w-2.5 h-5 bg-stone-300 rounded-full border-r border-stone-400 shadow-sm" />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            {/* Large Cover */}
            <div className="w-[120px] aspect-[2/3] bg-stone-100 rounded-lg overflow-hidden border border-[#3d1e03]/25 shadow-md flex-shrink-0 relative mx-auto sm:mx-0 group">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getOptimizedCoverUrl(coverUrl, 150)}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-tab-peach to-planner-base flex items-center justify-center p-2 text-center">
                  <span className="font-caveat text-sm font-bold text-ink-brown/70">No Cover</span>
                </div>
              )}
              {/* Cover Upload Overlay */}
              <div
                onClick={() => coverFileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-1"
                title="Upload custom cover art"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[9px] uppercase font-bold">Replace Cover</span>
              </div>
              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/20 to-transparent"></div>
            </div>

            {/* Info details & dropdown fields */}
            <div className="flex-1 space-y-4">
              <div>
                {isEditingHeader ? (
                  <div className="space-y-2 max-w-md bg-stone-50/50 p-3 rounded-lg border border-[#3d1e03]/10">
                    <div>
                      <label className="text-[9px] font-bold text-ink-gray uppercase block mb-0.5">Novel Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-planner-base p-1.5 border border-[#3d1e03]/10 rounded-lg text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-ink-gray uppercase block mb-0.5">Author</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full bg-planner-base p-1.5 border border-[#3d1e03]/10 rounded-lg text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          saveChanges({ title, author });
                          setIsEditingHeader(false);
                        }}
                        className="bg-maroon text-white font-extrabold px-3 py-1 rounded text-[9px] uppercase shadow cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTitle(book.title);
                          setAuthor(book.author);
                          setIsEditingHeader(false);
                        }}
                        className="bg-stone-200 text-ink-brown font-bold px-3 py-1 rounded text-[9px] uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <div className="flex items-start gap-2 pr-12">
                      <h2 className="font-caveat text-4xl font-extrabold leading-tight text-ink-brown">
                        {title}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsEditingHeader(true)}
                        className="opacity-0 group-hover:opacity-100 text-ink-gray hover:text-maroon p-1 rounded transition-opacity cursor-pointer mt-1.5 flex-shrink-0"
                        title="Edit title & author"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-ink-gray font-semibold">by {author}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 min-[450px]:grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* Reading Status */}
                <div>
                  <label className="text-[10px] font-bold text-ink-gray uppercase block mb-1">Reading Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setStatus(newStatus);
                      saveChanges({ status: newStatus });
                    }}
                    className="w-full bg-planner-base border border-[#3d1e03]/10 text-xs font-bold rounded-lg px-2 py-1.5 text-ink-brown focus:outline-none"
                  >
                    <option value="want_to_read">To Read</option>
                    <option value="reading">Currently Reading</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[10px] font-bold text-ink-gray uppercase block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      const newPrio = e.target.value as any;
                      setPriority(newPrio);
                      saveChanges({ priority: newPrio });
                    }}
                    className="w-full bg-planner-base border border-[#3d1e03]/10 text-xs font-bold rounded-lg px-2 py-1.5 text-ink-brown focus:outline-none"
                  >
                    <option value="Must read">Must read</option>
                    <option value="Interested">Interested</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="text-[10px] font-bold text-ink-gray uppercase block mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => {
                      const newSource = e.target.value as any;
                      setSource(newSource);
                      saveChanges({ source: newSource });
                    }}
                    className="w-full bg-planner-base border border-[#3d1e03]/10 text-xs font-bold rounded-lg px-2 py-1.5 text-ink-brown focus:outline-none"
                  >
                    <option value="Purchased">Purchased</option>
                    <option value="Gift">Gift</option>
                    <option value="Borrowed">Borrowed</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="text-[10px] font-bold text-ink-gray uppercase block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => {
                      const newPrice = Number(e.target.value);
                      setPrice(newPrice);
                      saveChanges({ price: newPrice });
                    }}
                    className="w-full bg-planner-base border border-[#3d1e03]/10 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sub-genre */}
              <div>
                <label className="text-[10px] font-bold text-ink-gray uppercase block mb-1">Sub-genre / Notes</label>
                <input
                  type="text"
                  value={subGenre}
                  placeholder="e.g. High Fantasy, contemporary romance"
                  onChange={(e) => {
                    setSubGenre(e.target.value);
                    saveChanges({ subGenre: e.target.value });
                  }}
                  className="w-full bg-planner-base border border-[#3d1e03]/10 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Reading Formats */}
          <div className="border-t border-[#3d1e03]/5 pt-3">
            <span className="text-[11px] font-bold text-ink-gray uppercase block mb-1.5">Reading Format</span>
            <div className="flex gap-4">
              {["physical", "digital", "audio"].map((fmt) => (
                <label key={fmt} className="flex items-center gap-1.5 text-xs font-bold text-ink-brown cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formats.includes(fmt as any)}
                    onChange={() => handleFormatChange(fmt as any)}
                    className="w-3.5 h-3.5 accent-accent-orange"
                  />
                  <span className="capitalize">{fmt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reading Progress tracking (only relevant if not wishlist) */}
          {!isWishlist && (
            <div className="border-t border-[#3d1e03]/5 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-ink-gray uppercase">Reading Progress</span>
                <span className="text-ink-brown">
                  {pagesRead} / {pagesTotal} pages ({pagesTotal > 0 ? Math.round((pagesRead / pagesTotal) * 100) : 0}%)
                </span>
              </div>
              
              <div className="flex gap-3 items-center">
                <input
                  type="range"
                  min={0}
                  max={pagesTotal || 100}
                  value={pagesRead}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPagesRead(val);
                  }}
                  onMouseUp={() => saveChanges({ pagesRead })}
                  onTouchEnd={() => saveChanges({ pagesRead })}
                  className="flex-1 accent-accent-orange"
                />
                
                <input
                  type="number"
                  value={pagesRead || ""}
                  onChange={(e) => {
                    const val = Math.min(pagesTotal, Number(e.target.value));
                    setPagesRead(val);
                    saveChanges({ pagesRead: val });
                  }}
                  className="w-16 text-center bg-planner-base border border-[#3d1e03]/10 text-xs font-bold py-0.5 rounded-lg focus:outline-none"
                  placeholder="Page"
                />
              </div>
            </div>
          )}

          {/* Dates Started / Finished */}
          <div className="grid grid-cols-2 gap-3 border-t border-[#3d1e03]/5 pt-3">
            <div>
              <label className="text-[11px] font-bold text-ink-gray uppercase flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-ink-gray" /> Started Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  saveChanges({ startDate: e.target.value });
                }}
                className="w-full bg-planner-base border border-[#3d1e03]/10 text-[11px] font-bold p-1.5 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-ink-gray uppercase flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-ink-gray" /> Finished Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  saveChanges({ endDate: e.target.value });
                }}
                className="w-full bg-planner-base border border-[#3d1e03]/10 text-[11px] font-bold p-1.5 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Ratings Section (Stars & Spice) */}
        {!isWishlist && (
          <div className="bg-planner-paper rounded-2xl p-4 border border-[#3d1e03]/15 shadow-sm grid grid-cols-1 min-[480px]:grid-cols-2 gap-4">
            
            {/* Star Rating */}
            <div className="space-y-1.5 min-[480px]:border-r border-[#3d1e03]/10 pr-2 min-[480px]:pb-0 pb-3 border-b min-[480px]:border-b-0">
              <span className="text-[11px] font-bold text-ink-gray uppercase block">Star Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setRating(s);
                      saveChanges({ rating: s });
                    }}
                    className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= rating ? "fill-star-yellow text-star-yellow" : "text-stone-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Spice Rating */}
            <div className="space-y-1.5 min-[480px]:pl-2">
              <span className="text-[11px] font-bold text-ink-gray uppercase block">Spice Rating</span>
              <div className="flex gap-1.5 items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSpice(s);
                      saveChanges({ spice: s });
                    }}
                    className="cursor-pointer text-xl hover:scale-115 active:scale-95 transition-transform"
                  >
                    <span className={s <= spice ? "opacity-100 filter drop-shadow-sm saturate-100" : "opacity-30 saturate-0"}>
                      🌶️
                    </span>
                  </button>
                ))}
                {spice > 0 && <span className="text-xs font-bold text-spice-red ml-1">({spice}/5)</span>}
              </div>
            </div>
          </div>
        )}

        {/* Text Areas Lined Paper Effect (Summary & Review) */}
        <div className="space-y-4">
          {/* Summary Lined Paper */}
          <div className="bg-planner-paper rounded-2xl p-6 border border-[#3d1e03]/15 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-ink-gray uppercase block">Book Summary</span>
            <textarea
              className="w-full lined-paper text-ink-brown bg-transparent focus:outline-none"
              rows={4}
              placeholder="Write a brief summary of the plot or key takeaways..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onBlur={() => saveChanges({ summary })}
            />
          </div>

          {/* Review Lined Paper */}
          <div className="bg-planner-paper rounded-2xl p-6 border border-[#3d1e03]/15 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-ink-gray uppercase block">Book Review Thoughts</span>
            <textarea
              className="w-full lined-paper text-ink-brown bg-transparent focus:outline-none"
              rows={8}
              placeholder="Write your review here..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              onBlur={() => saveChanges({ review })}
            />
          </div>
        </div>

        {/* Quotes Board */}
        <div className="bg-planner-paper rounded-2xl p-6 border border-[#3d1e03]/15 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-caveat text-2xl font-bold text-ink-brown flex items-center gap-1.5">
              <MessageSquare className="w-5 h-5 text-accent-orange" /> Clipped Quotes
            </h3>
            <span className="text-[10px] text-ink-gray font-semibold uppercase">{quotes.length} Quotes</span>
          </div>

          <form onSubmit={handleAddQuote} className="flex gap-2">
            <input
              type="text"
              placeholder="Add an inspiring book quote..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              className="flex-1 bg-planner-base border border-[#3d1e03]/10 text-xs px-3 py-2 rounded-lg focus:outline-none"
            />
            <button
              type="submit"
              className="bg-shelf-brown text-planner-base px-4 py-2 rounded-lg font-bold text-xs hover:bg-shelf-brown/95 flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          {/* Display Quotes list */}
          <div className="space-y-3 pt-1">
            {quotes.map((q, idx) => (
              <div
                key={idx}
                className="bg-planner-base p-3 rounded-lg border-l-4 border-accent-orange relative shadow-sm text-xs italic font-medium text-ink-brown group"
              >
                <p className="pr-6 leading-relaxed font-typewriter">&ldquo;{q}&rdquo;</p>
                <button
                  onClick={() => handleDeleteQuote(idx)}
                  className="absolute top-2 right-2 text-ink-gray/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Remove quote"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {quotes.length === 0 && (
              <p className="text-xs text-ink-gray italic text-center py-2">
                No quotes added yet. Clip a memorable phrase!
              </p>
            )}
          </div>
        </div>

        {/* Digital Scrapbook / Mood Board */}
        <div className="bg-planner-paper rounded-2xl p-6 border border-[#3d1e03]/15 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-caveat text-2xl font-bold text-ink-brown flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-accent-orange" /> Digital Scrapbook
            </h3>
            
            {/* Direct Upload input */}
            <label className="bg-shelf-brown text-planner-base px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-shelf-brown/95 flex items-center gap-1.5 cursor-pointer shadow-sm">
              <Upload className="w-3.5 h-3.5" /> Upload Image File
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-[10px] text-ink-gray leading-normal mt-1">
            Upload images from Pinterest or Instagram (mood boards, aesthetics, stickers) to tape inside your digital journal book.
          </p>

          {/* Scrapbook grid */}
          {scrapbookImages.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#3d1e03]/10 rounded-xl">
              <p className="text-xs text-ink-gray italic">No scrapbook stickers taped here yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {scrapbookImages.map((imgUrl, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg shadow-sm border border-[#3d1e03]/10 overflow-hidden bg-stone-100 group">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-3.5 sticker-tape z-20 pointer-events-none" />
                  
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt={`Scrapbook sticker ${idx}`} className="w-full h-full object-cover" />
                  
                  <button
                    onClick={() => handleDeleteImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-35"
                    title="Remove sticker"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
