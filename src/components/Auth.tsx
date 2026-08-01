"use client";

import React, { useState } from "react";
import { Lock, BookOpen, KeyRound, Mail, User, AlertCircle } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from "firebase/auth";
import { UserSession, isFirebaseConfigured, auth, localRegister, localLogin, saveUserProfile } from "../lib/db";
import AestheticBackground from "./AestheticBackground";

interface AuthProps {
  onSuccess: (session: UserSession) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isFirebaseConfigured && auth) {
      /* Cloud Firebase Authentication Mode */
      try {
        if (isRegistering) {
          if (!email || !password || !name) {
            setError("All fields are required!");
            setLoading(false);
            return;
          }
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName: name });
            
            // Send verification email
            await sendEmailVerification(userCredential.user);
            
            try {
              await saveUserProfile(email, {
                name: name,
                email: email,
                bio: "Cozy book lover 📚",
                genres: []
              });
            } catch (pErr) {
              console.error("Initial profile creation error:", pErr);
            }

            // Immediately sign out unverified account
            await signOut(auth);
            
            setMessage("Account created! A verification link has been sent to your email. Please verify your email before signing in.");
            setIsRegistering(false);
          }
        } else {
          if (!email || !password) {
            setError("Email and password are required!");
            setLoading(false);
            return;
          }
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          if (userCredential.user) {
            if (!userCredential.user.emailVerified) {
              await signOut(auth);
              setError("Your email address is not verified yet! Please check your email inbox and click the verification link.");
              setLoading(false);
              return;
            }
            onSuccess({
              email: userCredential.user.email || "",
              name: userCredential.user.displayName || name || "",
              isLocal: false,
              userId: userCredential.user.uid
            });
          }
        }
      } catch (err: any) {
        let errorMsg = err.message || "An authentication error occurred.";
        if (err.code === "auth/email-already-in-use") {
          errorMsg = "Email is already registered! Please sign in.";
        } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
          errorMsg = "Invalid email or password. Please try again!";
        } else if (err.code === "auth/weak-password") {
          errorMsg = "Password should be at least 6 characters.";
        }
        setError(errorMsg);
      }
    } else {
      /* Local Multi-User Offline Mode (Scoped to IndexedDB registry) */
      try {
        if (isRegistering) {
          if (!email || !password || !name) {
            setError("All fields are required!");
            setLoading(false);
            return;
          }
          await localRegister({ name, email, password });
          setMessage("Local account registered successfully! You can now sign in.");
          setIsRegistering(false);
        } else {
          if (!email || !password) {
            setError("Email and password are required!");
            setLoading(false);
            return;
          }
          const user = await localLogin({ email, password });
          onSuccess({
            email: user.email,
            name: user.name,
            isLocal: true
          });
        }
      } catch (err: any) {
        setError(err.message || "Invalid credentials.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-2 sm:p-4 select-none relative overflow-hidden z-0">
      
      {/* Super Aesthetic Background Layer */}
      <AestheticBackground themeName="cozyBinder" />

      {/* Realistic Binder Cover */}
      <div className="w-full max-w-md bg-[#582f0e] rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-between p-4 sm:p-8 border-l-[12px] sm:border-l-[16px] border-[#3d1e03] min-h-[500px] sm:min-h-[580px] z-10 transition-all duration-500 hover:shadow-[0_40px_80px_-12px_rgba(0,0,0,0.9)] hover:-translate-y-1">
        
        {/* Binder Design Elements */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#fba979]/30 rounded-tr-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#fba979]/30 rounded-br-xl"></div>
        <div className="absolute top-0 left-0 w-2 h-full bg-black/15"></div>
        
        {/* Leather spine indents (Modernized) */}
        <div className="absolute top-12 left-2 sm:left-4 w-1 h-3/4 bg-white/5 rounded-full shadow-inner"></div>
        <div className="absolute top-12 left-3 sm:left-6 w-[1px] sm:w-[2px] h-3/4 bg-black/25 rounded-full"></div>
        
        {/* Cozy Book Ribbon */}
        <div className="absolute top-0 right-8 sm:right-14 w-4 sm:w-6 h-24 sm:h-36 bg-accent-orange/80 shadow-[0_4px_10px_rgba(0,0,0,0.5)] rounded-b-sm transform origin-top rotate-[4deg] z-10 hover:rotate-[6deg] transition-transform duration-300 cursor-pointer"></div>

        {/* 1. Header (Book Title Label) */}
        <div className="w-full bg-[#fdfbf7] rounded-md border-2 border-[#3d1e03]/30 shadow-inner py-4 sm:py-5 px-3 sm:px-4 text-center mt-2 sm:mt-6 z-20 transform transition-transform hover:scale-105" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")" }}>
          <h1 className="font-caveat text-4xl sm:text-5xl font-extrabold text-gray-800 tracking-wide leading-none drop-shadow-sm">
            My Reading Journal
          </h1>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 mt-2 font-bold">
            Aesthetic Digital Edition
          </p>
        </div>

        {/* 2. Connection status badge */}
        <div className="w-full z-20 mt-2.5 sm:mt-4">
          {isFirebaseConfigured ? (
            <div className="bg-emerald-50 border border-emerald-200/50 p-1.5 sm:p-2 rounded-lg text-center flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[8px] sm:text-[10px] text-emerald-800 font-extrabold uppercase">
                Production Firebase Cloud Connected
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/50 p-1.5 sm:p-2 rounded-lg text-center flex items-center justify-center gap-1" title="You can sign up multiple accounts which will be stored locally in your browser.">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-[8px] sm:text-[10px] text-amber-800 font-extrabold uppercase">
                Local Accounts Sync (IndexedDB Mode)
              </span>
            </div>
          )}
        </div>

        {/* 3. Authentication Forms */}
        <div className="w-full bg-[#fcfaf5] p-5 sm:p-6 rounded-xl border border-[#3d1e03]/20 shadow-lg z-20 my-2.5 sm:my-4 flex flex-col items-center transition-all duration-300" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")" }}>
          
          {error && (
            <p className="w-full text-center text-xs font-bold text-red-500 bg-red-50 border border-red-200/50 p-2 rounded mb-3">
              {error}
            </p>
          )}

          {message && (
            <p className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 p-2 rounded mb-3">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="text-center font-extrabold text-[#4a3f35] text-xs border-b border-[#3d1e03]/10 pb-2 mb-3 tracking-wider">
              {isRegistering ? "CREATE READING ACCOUNT" : "SIGN IN TO YOUR JOURNAL"}
            </div>

            {isRegistering && (
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#3d1e03]/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#800f2f] transition-all font-semibold text-[#4a3f35] shadow-inner"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#3d1e03]/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#800f2f] transition-all font-semibold text-[#4a3f35] shadow-inner"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#3d1e03]/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#800f2f] transition-all font-semibold text-[#4a3f35] shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maroon hover:bg-maroon/90 text-white py-3 mt-2 rounded-md font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? "Please wait..." : isRegistering ? "Register New Account" : "Open Log Sheet"}
            </button>

            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setIsRegistering(!isRegistering);
                }}
                className="text-[10px] text-gray-600 hover:text-pink-600 font-extrabold cursor-pointer transition-colors"
              >
                {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>

        {/* Cozy footer mark */}
        <div className="z-20 text-[9px] text-white/70 font-bold tracking-wider uppercase mb-1 drop-shadow-sm">
          Cozy Digital Binder
        </div>
      </div>

    </div>
  );
}
