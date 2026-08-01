import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";

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
  // Spreadsheet log & wishlist columns
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

// Check if Firebase keys exist in environment
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
export const isFirebaseConfigured = FIREBASE_API_KEY !== "" && FIREBASE_PROJECT_ID !== "";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = isFirebaseConfigured
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;
export const firestore = app ? getFirestore(app) : null;

// IndexedDB Helper functions for Local Offline Mode
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }
    const request = indexedDB.open("BookTokJournalDB", 2);
    
    request.onupgradeneeded = () => {
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

// Session Management
export async function getLocalSession(): Promise<UserSession | null> {
  try {
    if (auth && auth.currentUser) {
      return {
        email: auth.currentUser.email || "",
        name: auth.currentUser.displayName || "",
        isLocal: false,
        userId: auth.currentUser.uid,
      };
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
  // 1. Firebase Cloud Mode Scoping
  if (auth && firestore && auth.currentUser) {
    try {
      const q = query(
        collection(firestore, "books"),
        where("user_id", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const cloudBooks: Book[] = [];
      querySnapshot.forEach((docSnap) => {
        cloudBooks.push(docSnap.data() as Book);
      });
      return cloudBooks;
    } catch (error) {
      console.error("Firebase load error, checking local fallback:", error);
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

  // Clean undefined properties for Firestore compliance
  const cleanBook: Record<string, any> = {};
  Object.keys(book).forEach((key) => {
    const val = (book as any)[key];
    if (val !== undefined) {
      cleanBook[key] = val;
    }
  });

  // 1. Firebase Cloud Mode Scoping
  if (auth && firestore && auth.currentUser) {
    try {
      const bookRef = doc(firestore, "books", book.id);
      await setDoc(bookRef, {
        ...cleanBook,
        user_id: auth.currentUser.uid,
        userEmail: auth.currentUser.email || activeEmail
      }, { merge: true });
      return;
    } catch (error) {
      console.error("Firebase save error, saving locally:", error);
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
        userEmail: activeEmail
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
  // 1. Firebase Cloud Mode Scoping
  if (auth && firestore && auth.currentUser) {
    try {
      const bookRef = doc(firestore, "books", id);
      await deleteDoc(bookRef);
      return;
    } catch (error) {
      console.error("Firebase delete error, deleting locally:", error);
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
    
    const checkReq = store.get(user.email);
    checkReq.onsuccess = () => {
      if (checkReq.result) {
        reject(new Error("Email already registered!"));
        return;
      }
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
export function getOptimizedCoverUrl(url: string, width = 200): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
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
  // 1. Firebase Cloud Mode Scoping
  if (auth && firestore && auth.currentUser) {
    try {
      const profileRef = doc(firestore, "profiles", auth.currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        return {
          name: data.name || auth.currentUser.displayName || "",
          email: data.email || email,
          bio: data.bio || "",
          genres: data.genres || [],
          avatarUrl: data.avatarUrl || undefined,
          theme: data.theme || undefined,
          layoutMode: data.layoutMode || undefined,
          glitterEnabled: data.glitterEnabled !== undefined ? data.glitterEnabled : undefined
        };
      }
    } catch (err) {
      console.error("Firebase load profile error, checking local fallback:", err);
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
  const existing = await getUserProfile(email);
  const mergedProfile: UserProfile = {
    ...existing,
    ...profile,
    theme: profile.theme !== undefined ? profile.theme : existing?.theme,
    layoutMode: profile.layoutMode !== undefined ? profile.layoutMode : existing?.layoutMode,
    glitterEnabled: profile.glitterEnabled !== undefined ? profile.glitterEnabled : existing?.glitterEnabled,
  };

  // 1. Firebase Cloud Mode Scoping
  if (auth && firestore && auth.currentUser) {
    try {
      const profileRef = doc(firestore, "profiles", auth.currentUser.uid);
      await setDoc(profileRef, {
        id: auth.currentUser.uid,
        email: mergedProfile.email,
        name: mergedProfile.name,
        bio: mergedProfile.bio,
        genres: mergedProfile.genres,
        avatarUrl: mergedProfile.avatarUrl || "",
        theme: mergedProfile.theme || "",
        layoutMode: mergedProfile.layoutMode || "single",
        glitterEnabled: mergedProfile.glitterEnabled !== undefined ? mergedProfile.glitterEnabled : true
      }, { merge: true });
      return;
    } catch (err) {
      console.error("Firebase profile save exception:", err);
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
