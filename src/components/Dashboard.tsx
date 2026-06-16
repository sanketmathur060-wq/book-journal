"use client";

import React, { useState, useEffect } from "react";
import { Book } from "../lib/db";
import { Star, Trophy, Sparkles, Heart, DollarSign, BookOpen, ShoppingBag, Eye } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from "recharts";

interface DashboardProps {
  books: Book[];
  onSelectBook: (id: string) => void;
}

export default function Dashboard({ books, onSelectBook }: DashboardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const libraryBooks = books.filter((b) => !b.isWishlist);
  const wishlistBooks = books.filter((b) => b.isWishlist);

  // Core metrics
  const totalBooks = libraryBooks.length;
  const booksRead = libraryBooks.filter((b) => b.status === "completed").length;
  const currentlyReading = libraryBooks.filter((b) => b.status === "reading").length;
  const wantToRead = libraryBooks.filter((b) => b.status === "want_to_read").length;
  
  // Need to purchase: wishlist books where bought is false or undefined
  const needToPurchase = wishlistBooks.filter((b) => !b.bought).length;
  const totalPagesRead = libraryBooks.reduce((acc, b) => acc + (b.pagesRead || 0), 0);

  // Best Novel Till Now: Sort by rating desc, then spice desc, then pagesTotal desc
  const bestNovel = [...libraryBooks]
    .filter((b) => b.rating > 0)
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (b.spice || 0) - (a.spice || 0);
    })[0];

  // Colors for charts
  const PASTEL_COLORS = ["#ffccd5", "#b8f2e6", "#ffd166", "#c8b6ff", "#fde2e4", "#e8ae68", "#a2d2ff"];

  // Star ratings count calculations
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  libraryBooks.forEach((b) => {
    if (b.rating >= 1 && b.rating <= 5) {
      ratingCounts[b.rating as keyof typeof ratingCounts]++;
    }
  });

  // Genre ranking & Pie Chart data
  const genreCounts: { [key: string]: number } = {};
  libraryBooks.forEach((b) => {
    (b.genres || []).forEach((g) => {
      const genre = g.trim();
      if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  // Convert to Recharts pie array
  const genrePieData = Object.entries(genreCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5 genres

  // Financial Ledger calculations
  const wishlistCost = wishlistBooks.reduce((acc, b) => acc + (b.price || 0), 0);
  const spentCost = libraryBooks
    .filter((b) => b.source === "Purchased")
    .reduce((acc, b) => acc + (b.price || 500), 0); // Default Rs 500 if blank

  // Year In Books monthly pages
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthData: { [key: string]: number } = {};
  const currentYear = new Date().getFullYear();
  
  monthNames.forEach((m) => { currentMonthData[m] = 0; });
  libraryBooks.forEach((b) => {
    if (b.status === "completed" && b.endDate) {
      const date = new Date(b.endDate);
      if (date.getFullYear() === currentYear) {
        const mLabel = monthNames[date.getMonth()];
        currentMonthData[mLabel] += b.pagesTotal || 0;
      }
    }
  });
  const yearInBooksData = Object.entries(currentMonthData).map(([month, pages]) => ({ month, pages }));

  // Goal settings
  const bookGoal = 30;
  const pagesGoal = 10000;
  
  // Percentages
  const booksProgress = Math.min(100, Math.round((booksRead / bookGoal) * 100));
  const pagesProgress = Math.min(100, Math.round((totalPagesRead / pagesGoal) * 100));

  // Progress circle SVG calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (booksProgress / 100) * circumference;

  if (!mounted) {
    return (
      <div className="text-center py-20 font-caveat text-3xl font-extrabold animate-pulse text-[#ffccd5]">
        ✨ Loading bookish stats... ✨
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Stat cards header row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "My Library 📚", value: totalBooks, desc: "Total log entries", color: "bg-white border-[#ffccd5] text-[#800f2f]" },
          { label: "Currently Reading 📖", value: currentlyReading, desc: "Active novels", color: "bg-white border-[#ffd166] text-[#cc7000]" },
          { label: "Want to Read 🎯", value: wantToRead, desc: "To-read list shelf", color: "bg-white border-[#c8b6ff] text-[#4d2db3]" },
          { label: "Need to Purchase 🛍️", value: needToPurchase, desc: "Unpurchased wishlist", color: "bg-white border-[#ff4d6d]/30 text-maroon" },
        ].map((stat, idx) => (
          <div key={idx} className={`p-3 sm:p-4 rounded-xl border-2 ${stat.color} shadow-sm relative transition-all hover:scale-[1.01]`}>
            <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-ink-gray block tracking-wider truncate" title={stat.label}>{stat.label}</span>
            <h3 className="font-caveat text-2xl sm:text-4xl font-extrabold mt-0.5 sm:mt-1 leading-none">{stat.value}</h3>
            <p className="text-[8px] sm:text-[9px] text-ink-gray font-semibold mt-0.5 truncate" title={stat.desc}>{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* 2. Visual Goal Circle & Best Novel Spotlight Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Yearly Challenge Progress Circle */}
        <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-2xl border border-[#3d1e03]/10 shadow-sm flex flex-col items-center justify-between text-center relative">
          <span className="font-caveat text-2xl font-bold text-[#800f2f] flex items-center gap-1">
            <Trophy className="w-5 h-5 text-amber-500" /> Yearly Reading Challenge
          </span>

          <div className="relative w-36 h-36 my-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r={radius} className="stroke-stone-100" strokeWidth="12" fill="transparent" />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-[#ff4d6d]"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-caveat text-4xl font-extrabold text-[#800f2f]">{booksProgress}%</span>
              <span className="text-[9px] text-ink-gray font-bold uppercase tracking-wider">Completed</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-ink-brown">
              Finished: {booksRead} / {bookGoal} books
            </p>
            <p className="text-[10px] text-ink-gray">
              Pages Logged: {totalPagesRead} / {pagesGoal} ({pagesProgress}%)
            </p>
          </div>
        </div>

        {/* Right: Best Novel Spotlight Card */}
        <div className="md:col-span-7 bg-[#fff0f3]/40 p-4 sm:p-6 rounded-2xl border border-[#ffccd5] shadow-sm flex flex-col md:flex-row items-center justify-around gap-6 relative">
          <div className="absolute top-[-5px] left-4 w-12 h-4 bg-[#ffccd5]/50 rotate-[-12deg] shadow-sm" />
          
          <div className="text-center md:text-left space-y-2 max-w-[240px]">
            <span className="bg-[#ff4d6d] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow">
              🏆 Best Novel Till Now
            </span>
            {bestNovel ? (
              <>
                <h4 className="font-caveat text-3xl font-extrabold text-[#800f2f] leading-none line-clamp-2">
                  {bestNovel.title}
                </h4>
                <p className="text-xs text-ink-brown font-bold">by {bestNovel.author}</p>
                <div className="flex justify-center md:justify-start gap-0.5 text-star-yellow text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < bestNovel.rating ? "★" : "☆"}</span>
                  ))}
                </div>
                {bestNovel.review && (
                  <p className="text-[10px] text-ink-gray italic font-typewriter line-clamp-3 leading-relaxed">
                    &ldquo;{bestNovel.review}&rdquo;
                  </p>
                )}
                <button
                  onClick={() => onSelectBook(bestNovel.id)}
                  className="bg-maroon text-white font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase shadow hover:scale-[1.01] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Inspect Review
                </button>
              </>
            ) : (
              <p className="text-xs text-ink-gray italic py-8">Rate some novels in your library to crown a favorite!</p>
            )}
          </div>

          {/* Polaroid Frame of Best Cover */}
          {bestNovel && (
            <div 
              onClick={() => onSelectBook(bestNovel.id)}
              className="w-24 aspect-[2/3] bg-white p-2 shadow border border-stone-200 relative transform rotate-[2deg] cursor-pointer hover:rotate-0 hover:scale-105 transition-all"
            >
              {bestNovel.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bestNovel.coverUrl} alt={bestNovel.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-[8px] font-bold">Cover</div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow">
                <Star className="w-2 h-2 fill-current" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Monthly bar chart & Genre preferences Pie chart (Animated & Gorgeous) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Monthly Page activity (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-[#3d1e03]/10 shadow-sm space-y-4">
          <h4 className="font-caveat text-2xl font-bold text-[#800f2f] flex items-center gap-1">
            📜 Monthly Reading Activity (Pages)
          </h4>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearInBooksData} margin={{ left: -30, right: 5, top: 5, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 8 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#fff5f6" }} />
                <Bar dataKey="pages" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1000}>
                  {yearInBooksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Genre Distribution Donut Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl border border-[#3d1e03]/10 shadow-sm flex flex-col justify-between">
          <h4 className="font-caveat text-2xl font-bold text-[#800f2f] flex items-center gap-1">
            📊 Genre Distribution
          </h4>
          
          <div className="w-full h-40 relative flex items-center justify-center">
            {genrePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genrePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={1200}
                  >
                    {genrePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Books`, "Volume"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-ink-gray italic">No genres logged yet to display.</p>
            )}

            {genrePieData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-[#800f2f]">{totalBooks}</span>
                <span className="text-[7px] font-bold text-ink-gray uppercase">Novels</span>
              </div>
            )}
          </div>

          {/* Simple Legend for genres */}
          {genrePieData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 pt-2 border-t text-[9px] font-bold uppercase text-ink-gray">
              {genrePieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PASTEL_COLORS[index % PASTEL_COLORS.length] }} />
                  <span>{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Ledger & Rating Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Rating ledger */}
        <div className="md:col-span-6 bg-white p-4 sm:p-5 rounded-2xl border border-[#3d1e03]/10 shadow-sm flex flex-col justify-between">
          <span className="font-caveat text-2xl font-bold text-[#800f2f] flex items-center gap-1">
            ⭐ Rating Ledger
          </span>

          <div className="space-y-2.5 my-3">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = ratingCounts[r as keyof typeof ratingCounts] || 0;
              const barWidth = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
              return (
                <div key={r} className="flex items-center gap-3">
                  <div className="w-14 text-right text-xs font-bold text-ink-brown flex items-center justify-end gap-1">
                    {r} <Star className="w-3.5 h-3.5 fill-star-yellow text-star-yellow" />
                  </div>
                  <div className="flex-1 h-3 bg-stone-50 rounded-full border overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ffccd5] to-[#ff4d6d] rounded-full transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="w-8 text-xs text-ink-gray font-bold">{count} bks</div>
                </div>
              );
            })}
          </div>

          <p className="text-[9px] uppercase tracking-wider text-ink-gray font-bold border-t pt-2">
            Average star rating: {totalBooks > 0 ? (libraryBooks.reduce((acc, b) => acc + b.rating, 0) / totalBooks).toFixed(1) : "0.0"} / 5.0
          </p>
        </div>

        {/* Ledger */}
        <div className="md:col-span-6 bg-white p-4 sm:p-5 rounded-2xl border border-[#3d1e03]/10 shadow-sm flex flex-col justify-between">
          <span className="font-caveat text-2xl font-bold text-[#800f2f] flex items-center gap-1">
            💸 Bookish Budget ledger
          </span>

          <div className="space-y-2.5 pt-2 my-2 font-bold text-xs text-ink-brown">
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-ink-gray flex items-center gap-1">Spent on Novels 🛍️</span>
              <span className="text-emerald-700 font-mono">₹{spentCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-ink-gray flex items-center gap-1">Wishlist Total Value 💫</span>
              <span className="text-purple-700 font-mono">₹{wishlistCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-ink-gray flex items-center gap-1">Average Price Per Book 🏷️</span>
              <span className="text-ink-brown font-mono">
                ₹{totalBooks > 0 ? (spentCost / totalBooks).toFixed(2) : "0.00"}
              </span>
            </div>
          </div>

          <div className="bg-[#fcf8f2] p-2 rounded-lg border text-[10px] text-ink-gray text-center font-semibold mt-2">
            Tracked from purchases and dream list price items.
          </div>
        </div>

      </div>

    </div>
  );
}
