"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Upload, BookOpen, Heart, Mail, FileText, Sparkles, Check } from "lucide-react";
import { UserSession, UserProfile, getUserProfile, saveUserProfile, fileToBase64 } from "../lib/db";

interface ProfileProps {
  session: UserSession;
}

const AVAILABLE_GENRES = [
  "Fantasy",
  "Romance",
  "Thriller",
  "Sci-Fi",
  "Mystery",
  "Non-Fiction",
  "Memoir",
  "Poetry",
  "Historical Fiction",
  "Young Adult",
  "New Adult",
  "Dystopian"
];

export default function Profile({ session }: ProfileProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile details on mount
  useEffect(() => {
    async function loadProfile() {
      const activeEmail = session.email;
      setEmail(activeEmail);
      setName(session.name || "");
      
      const profile = await getUserProfile(activeEmail);
      if (profile) {
        setName(profile.name || session.name || "");
        setBio(profile.bio || "");
        setSelectedGenres(profile.genres || []);
        setAvatarUrl(profile.avatarUrl || "");
      }
    }
    loadProfile();
  }, [session]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Str = await fileToBase64(file);
        setAvatarUrl(base64Str);
      } catch (err) {
        console.error("Error uploading avatar:", err);
        setStatusMessage("Failed to process profile image!");
        setIsError(true);
      }
    }
  };

  const handleToggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");
    setIsError(false);

    try {
      const updatedProfile: UserProfile = {
        name,
        email,
        bio,
        genres: selectedGenres,
        avatarUrl
      };
      await saveUserProfile(session.email, updatedProfile);
      
      // Also update local cached session name if it changed
      if (typeof window !== "undefined") {
        setStatusMessage("Profile updated successfully! ✨");
        setTimeout(() => setStatusMessage(""), 3000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setStatusMessage("Failed to save profile. Try again!");
      setIsError(true);
    }
  };

  return (
    <div className="max-w-[850px] mx-auto bg-white rounded-2xl border border-[#3d1e03]/10 shadow-md overflow-hidden">
      
      {/* Burgundy Header Tab */}
      <div className="bg-maroon text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-black/10">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-[#ffccd5]" />
          <h2 className="font-extrabold uppercase text-xs tracking-wider">
            Reader Profile Settings
          </h2>
        </div>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-semibold uppercase">
          Cozy Customization
        </span>
      </div>

      <form onSubmit={handleSave} className="p-4 sm:p-6 md:p-8 space-y-6">
        
        {statusMessage && (
          <div
            className={`text-center py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
              isError
                ? "bg-[#fff0f3] text-[#800f2f] border border-[#ffccd5]"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Polaroid avatar editor (4 Cols) */}
          <div className="md:col-span-4 flex flex-col items-center space-y-4">
            <span className="text-xs font-bold text-ink-brown uppercase tracking-wider block">
              Reader Portrait
            </span>
            
            {/* Polaroid Frame Container */}
            <div className="w-[170px] bg-white p-3.5 pb-8 shadow-xl border border-stone-200 rounded transform rotate-[-1deg] transition-all hover:rotate-0 hover:scale-[1.02]">
              <div className="w-full aspect-square bg-stone-100 rounded border flex items-center justify-center overflow-hidden relative group">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-center text-stone-300 p-2">
                    <User className="w-12 h-12 stroke-[1]" />
                    <span className="text-[9px] uppercase font-bold tracking-widest mt-1">No Portrait</span>
                  </div>
                )}
                
                {/* Upload Overlay on hover */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-2"
                >
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[9px] uppercase font-extrabold tracking-wider">Change photo</span>
                </div>
              </div>
              
              {/* Polaroid signature label */}
              <div className="mt-4 text-center">
                <span className="font-caveat text-xl font-bold text-ink-gray line-clamp-1">
                  {name || "Lovely Reader"}
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-planner-base hover:bg-tab-peach/80 text-ink-brown font-bold px-3 py-1.5 rounded-lg border border-[#3d1e03]/10 text-[10px] uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
          </div>

          {/* RIGHT COLUMN: Profile Input Fields (8 Cols) */}
          <div className="md:col-span-8 space-y-4">
            
            {/* Display Name */}
            <div>
              <label className="text-xs font-bold text-ink-brown block mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-accent-orange" /> Display Username / Nickname *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BookishBeauty"
                className="w-full bg-planner-base p-2.5 border border-[#3d1e03]/10 rounded-lg text-xs font-semibold focus:outline-none focus:border-maroon/40"
              />
            </div>

            {/* Email (Readonly to preserve DB auth binding) */}
            <div>
              <label className="text-xs font-bold text-ink-brown block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#ffccd5]" /> Linked Email Address
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-stone-50 p-2.5 border border-[#3d1e03]/5 rounded-lg text-xs text-ink-gray font-semibold cursor-not-allowed"
              />
              <span className="text-[9px] text-ink-gray block mt-0.5">
                This email is used to sync your database entries.
              </span>
            </div>

            {/* Reader Bio */}
            <div>
              <label className="text-xs font-bold text-ink-brown block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-ink-gray" /> Reader Bio / BookTok Intro
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your reading aesthetic! (e.g. 'Enemies-to-lovers trope collector. Sarah J. Maas devouree. Coffee and high fantasy are my therapy.')"
                className="w-full bg-planner-base p-2.5 border border-[#3d1e03]/10 rounded-lg text-xs font-semibold focus:outline-none focus:border-maroon/40 font-typewriter resize-none"
              />
            </div>

            {/* Favorite Genre Tag selection list */}
            <div>
              <label className="text-xs font-bold text-ink-brown block mb-2 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> Favorite Novel Genres
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleToggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-maroon text-white border-maroon shadow"
                          : "bg-planner-base text-ink-gray border-[#3d1e03]/10 hover:bg-[#ffe5ec]/20 hover:text-ink-brown"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-[#3d1e03]/10 flex justify-end">
          <button
            type="submit"
            className="bg-maroon hover:bg-maroon/90 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Check className="w-4 h-4" /> Save Profile Info
          </button>
        </div>

      </form>

    </div>
  );
}
