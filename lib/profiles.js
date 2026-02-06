import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const DINERS_KEY = "smartpantry.diners.v1";

export function defaultProfiles() {
  return [
    {
      id: "dad",
      name: "Dad",
      allergies: ["nuts"],
      intolerances: [],
      preferredFoods: [],
      dislikedFoods: [],
    },
    {
      id: "mom",
      name: "Mom",
      allergies: [],
      intolerances: [],
      preferredFoods: ["spicy"],
      dislikedFoods: [],
    },
    {
      id: "child",
      name: "Child",
      allergies: [],
      intolerances: ["lactose"],
      preferredFoods: ["mild"],
      dislikedFoods: ["mushrooms"],
    },
  ];
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export async function loadProfiles() {
  try {
    const profilesCollection = collection(db, "profiles");
    const snapshot = await getDocs(profilesCollection);
    const profiles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return profiles.length > 0 ? profiles : defaultProfiles();
  } catch (error) {
    console.error("Error loading profiles from Firebase:", error);
    return defaultProfiles();
  }
}

export async function getProfileByEmail(email) {
  try {
    const profilesCollection = collection(db, "profiles");
    const snapshot = await getDocs(profilesCollection);
    const profile = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .find(p => p.email === email);
    return profile ?? null;
  } catch (error) {
    console.error("Error finding profile by email:", error);
    return null;
  }
}

export async function updateProfile(profileId, updates) {
  try {
    const profileRef = doc(db, "profiles", profileId);
    await updateDoc(profileRef, updates);
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
}

export async function saveProfiles(profiles) {
  // Profiles are now managed in Firebase directly
  // This function is kept for compatibility but doesn't save to localStorage anymore
  console.log("Profiles are managed in Firebase");
}

export function loadSelectedDinerIds(fallbackIds = []) {
  if (typeof window === "undefined") return fallbackIds;
  const raw = window.localStorage.getItem(DINERS_KEY);
  const value = raw ? safeParse(raw, null) : null;
  return Array.isArray(value) ? value : fallbackIds;
}

export function saveSelectedDinerIds(ids) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DINERS_KEY, JSON.stringify(ids));
}

export function normalizeToken(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function splitCsv(s) {
  return String(s ?? "")
    .split(",")
    .map((x) => normalizeToken(x))
    .filter(Boolean);
}

