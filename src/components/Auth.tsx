"use client";

import React, { useState } from "react";
import { Lock, BookOpen, KeyRound, Mail, User, AlertCircle, ShieldAlert } from "lucide-react";
import { UserSession, isSupabaseConfigured, supabase, localRegister, localLogin } from "../lib/db";

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

    if (isSupabaseConfigured && supabase) {
      /* Cloud Supabase Authentication Mode */
      try {
        if (isRegistering) {
          if (!email || !password || !name) {
            setError("All fields are required!");
            setLoading(false);
            return;
          }
          const { data, error: signupErr } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
          });
          if (signupErr) {
            setError(signupErr.message);
          } else {
            setMessage("Account registered! Please check your email inbox to confirm, then sign in.");
            setIsRegistering(false);
          }
        } else {
          if (!email || !password) {
            setError("Email and password are required!");
            setLoading(false);
            return;
          }
          const { data, error: loginErr } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (loginErr) {
            setError(loginErr.message);
          } else if (data.user) {
            onSuccess({
              email: data.user.email || "",
              name: data.user.user_metadata?.name || "",
              isLocal: false,
              userId: data.user.id
            });
          }
        }
      } catch (err: any) {
        setError(err.message || "An authentication error occurred.");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-desk-bg p-2 sm:p-4 select-none">
      
      {/* Binder Cover */}
      <div className="w-full max-w-md bg-[#582f0e] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col items-center justify-between p-4 sm:p-8 border-l-[8px] sm:border-l-[14px] border-[#3d1e03] min-h-[500px] sm:min-h-[580px]">
        
        {/* Binder Design Elements */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#fba979]/30 rounded-tr-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#fba979]/30 rounded-br-xl"></div>
        <div className="absolute top-0 left-0 w-2 h-full bg-black/15"></div>
        
        {/* Leather spine indents */}
        <div className="absolute top-12 left-2 sm:left-4 w-1 h-3/4 bg-white/5 rounded-full"></div>
        <div className="absolute top-12 left-3 sm:left-6 w-[1px] sm:w-[2px] h-3/4 bg-black/25 rounded-full"></div>
        
        {/* Cozy Book Ribbon */}
        <div className="absolute top-0 right-8 sm:right-14 w-4 sm:w-6 h-24 sm:h-36 bg-accent-orange/60 shadow-md rounded-b-md transform origin-top rotate-[4deg] z-10"></div>

        {/* 1. Header (Book Title Label) */}
        <div className="w-full bg-planner-base rounded-md border-2 border-[#3d1e03]/30 shadow-inner py-2.5 sm:py-4 px-3 sm:px-4 text-center mt-2 sm:mt-6 z-20">
          <h1 className="font-caveat text-3xl sm:text-4xl font-extrabold text-ink-brown tracking-wide leading-none">
            My Reading Journal
          </h1>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-ink-gray mt-1 sm:mt-1.5 font-bold">
            Multi-User Log Edition
          </p>
        </div>

        {/* 2. Connection status badge */}
        <div className="w-full z-20 mt-2.5 sm:mt-4">
          {isSupabaseConfigured ? (
            <div className="bg-emerald-50 border border-emerald-200/50 p-1.5 sm:p-2 rounded-lg text-center flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[8px] sm:text-[10px] text-emerald-800 font-extrabold uppercase">
                Production Cloud Database Connected
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
        <div className="w-full bg-planner-paper/95 p-4 sm:p-5 rounded-xl border border-[#3d1e03]/20 shadow-lg z-20 my-2.5 sm:my-4 flex flex-col items-center">
          
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

          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="text-center font-bold text-ink-brown text-xs border-b pb-1.5 mb-2">
              {isRegistering ? "CREATE READING ACCOUNT" : "SIGN IN TO YOUR JOURNAL"}
            </div>

            {isRegistering && (
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-ink-gray" />
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-planner-base border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-ink-gray" />
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-planner-base border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-ink-gray" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-planner-base border border-[#3d1e03]/10 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maroon hover:bg-maroon/90 text-white py-2.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? "Please wait..." : isRegistering ? "Register New Account" : "Open Log Sheet"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setIsRegistering(!isRegistering);
                }}
                className="text-[10px] text-ink-gray hover:text-maroon font-bold underline cursor-pointer"
              >
                {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>

        {/* Cozy footer mark */}
        <div className="z-20 text-[9px] text-planner-base/50 font-bold tracking-wider uppercase mb-1">
          Cozy Digital Binder
        </div>
      </div>

    </div>
  );
}
