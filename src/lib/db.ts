import { createClient } from "@supabase/supabase-js";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pagesTotal: number;
  pagesRead: number;
  status: 'want_to_read' | 'reading' | 'completed';
  startDate?: string;
  endDate?: string;
  formats: ('physical' | 'digital' | 'audio')[];
  rating: number; // 0 to 5
  spice: number;  // 0 to 5
  summary: string;
  review: string;
  quotes: string[];
  scrapbookImages: string[]; // Base64 image strings in local mode
  genres: string[];
  isbn?: string;
  // New spreadsheet log & wishlist columns
  subGenre?: string;
  priority: 'Must read' | 'Interested' | 'Maybe';
  source: 'Gift' | 'Purchased' | 'Borrowed';
  price?: number;
  bought?: boolean;
  isWishlist?: boolean;
  // Multi-user scoping
  userEmail?: string;
}

export interface UserSession {
  email: string;
  name?: string;
  isLocal: boolean;
  userId?: string;
}

// Check if Supabase keys exist in the environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// IndexedDB Helper functions
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }
    const request = indexedDB.open("BookTokJournalDB", 2); // Bump version to 2 for users table
    
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains("books")) {
        db.createObjectStore("books", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("user")) {
        db.createObjectStore("user", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "email" });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Local Database Auth Management
export async function getLocalSession(): Promise<UserSession | null> {
  try {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        return {
          email: data.session.user.email || "",
          name: data.session.user.user_metadata?.name || "",
          isLocal: false,
          userId: data.session.user.id,
        };
      }
    }
    
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("user", "readonly");
      const store = tx.objectStore("user");
      const request = store.get("session");
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB error:", error);
    return null;
  }
}

export async function setLocalSession(session: UserSession | null): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("user", "readwrite");
    const store = tx.objectStore("user");
    if (session) {
      const request = store.put({ key: "session", value: session });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } else {
      const request = store.delete("session");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }
  });
}

// Unified Database CRUD Functions (Scoped to Active User)
export async function getBooks(): Promise<Book[]> {
  // 1. Supabase Mode Scoping
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id);
      
      if (!error && data) {
        return data as Book[];
      }
      if (error) {
        console.error("Supabase load error, checking local fallback:", error);
      }
    }
  }

  // 2. Fallback to Local IndexedDB (Scoped by Active Session Email)
  try {
    const session = await getLocalSession();
    const activeEmail = session?.email || "local-user@booktok.app";

    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("books", "readonly");
      const store = tx.objectStore("books");
      const request = store.getAll();
      request.onsuccess = () => {
        const allBooks = request.result || [];
        // Filter by userEmail to support local multi-user isolation
        const filtered = allBooks.filter((b: Book) => {
          return !b.userEmail || b.userEmail === activeEmail;
        });
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load books from local storage:", error);
    return [];
  }
}

export async function saveBook(book: Book): Promise<void> {
  const session = await getLocalSession();
  const activeEmail = session?.email || "local-user@booktok.app";

  // 1. Supabase Mode Scoping
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("books")
        .upsert({
          ...book,
          user_id: user.id
        });
      
      if (!error) return;
      console.error("Supabase save error, saving locally:", error);
    }
  }

  // 2. Fallback to Local IndexedDB
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("books", "readwrite");
      const store = tx.objectStore("books");
      const request = store.put({
        ...book,
        userEmail: activeEmail // bind to logged in email
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save book to local storage:", error);
    throw error;
  }
}

export async function deleteBook(id: string): Promise<void> {
  // 1. Supabase Mode Scoping
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (!error) return;
      console.error("Supabase delete error, deleting locally:", error);
    }
  }

  // 2. Fallback to Local IndexedDB
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("books", "readwrite");
      const store = tx.objectStore("books");
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete book:", error);
    throw error;
  }
}

// Local mock user registry operations in IndexedDB
export async function localRegister(user: { name: string; email: string; password: string }): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    
    // Check if email already registered
    const checkReq = store.get(user.email);
    checkReq.onsuccess = () => {
      if (checkReq.result) {
        reject(new Error("Email already registered!"));
        return;
      }
      // Put user
      const putReq = store.put(user);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    checkReq.onerror = () => reject(checkReq.error);
  });
}

export async function localLogin(credentials: { email: string; password: string }): Promise<{ name: string; email: string }> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const request = store.get(credentials.email);
    
    request.onsuccess = () => {
      const user = request.result;
      if (!user) {
        reject(new Error("No user found with this email. Please Sign Up!"));
        return;
      }
      if (user.password !== credentials.password) {
        reject(new Error("Incorrect password. Try again!"));
        return;
      }
      resolve({ name: user.name, email: user.email });
    };
    request.onerror = () => reject(request.error);
  });
}

// Convert image file to Base64 helper for Scrapbook/Covers
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Global Image CDN Proxy helper using Cloudflare-backed weserv.nl
// Compresses, resizes, and caches external cover images for instant loading
export function getOptimizedCoverUrl(url: string, width = 200): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url; // Base64 uploaded files are served locally
  const cleanUrl = url.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&fit=cover&output=webp`;
}

export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  genres: string[];
  avatarUrl?: string;
  theme?: string;
  layoutMode?: string;
  glitterEnabled?: boolean;
}

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  // 1. Supabase Mode Scoping
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        
        if (!error && data) {
          return {
            name: data.name || "",
            email: data.email || email,
            bio: data.bio || "",
            genres: data.genres || [],
            avatarUrl: data.avatarUrl || undefined,
            theme: data.theme || undefined,
            layoutMode: data.layout_mode || undefined,
            glitterEnabled: data.glitter_enabled !== undefined ? data.glitter_enabled : undefined
          };
        }
      }
    } catch (err) {
      console.error("Supabase load profile error, checking local fallback:", err);
    }
  }

  // 2. Fallback to Local IndexedDB
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("user", "readonly");
      const store = tx.objectStore("user");
      const request = store.get("profile_" + email);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load user profile:", error);
    return null;
  }
}

export async function saveUserProfile(email: string, profile: UserProfile): Promise<void> {
  // Fetch existing profile to merge settings and prevent overwriting
  const existing = await getUserProfile(email);
  const mergedProfile: UserProfile = {
    ...existing,
    ...profile,
    theme: profile.theme !== undefined ? profile.theme : existing?.theme,
    layoutMode: profile.layoutMode !== undefined ? profile.layoutMode : existing?.layoutMode,
    glitterEnabled: profile.glitterEnabled !== undefined ? profile.glitterEnabled : existing?.glitterEnabled,
  };

  // 1. Supabase Mode Scoping
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const upsertData: any = {
          id: user.id,
          email: mergedProfile.email,
          name: mergedProfile.name,
          bio: mergedProfile.bio,
          genres: mergedProfile.genres,
          avatarUrl: mergedProfile.avatarUrl
        };
        
        if (mergedProfile.theme !== undefined) upsertData.theme = mergedProfile.theme;
        if (mergedProfile.layoutMode !== undefined) upsertData.layout_mode = mergedProfile.layoutMode;
        if (mergedProfile.glitterEnabled !== undefined) upsertData.glitter_enabled = mergedProfile.glitterEnabled;

        const { error } = await supabase
          .from("profiles")
          .upsert(upsertData);
        
        if (!error) return;
        
        // Postgres error 42703 is "column does not exist"
        if (error.code === "42703") {
          console.warn("Supabase profiles table lacks settings columns, retrying without them.");
          const { error: retryErr } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              email: mergedProfile.email,
              name: mergedProfile.name,
              bio: mergedProfile.bio,
              genres: mergedProfile.genres,
              avatarUrl: mergedProfile.avatarUrl
            });
          if (!retryErr) return;
          console.error("Supabase profile save retry failed:", retryErr);
        } else {
          console.error("Supabase profile save failed:", error);
        }
      }
    } catch (err) {
      console.error("Supabase save profile exception:", err);
    }
  }

  // 2. Fallback to Local IndexedDB
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("user", "readwrite");
      const store = tx.objectStore("user");
      const request = store.put({ key: "profile_" + email, value: mergedProfile });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save user profile:", error);
    throw error;
  }
}
