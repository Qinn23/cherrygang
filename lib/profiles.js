import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, where } from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";

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

import { getHouseholdMembers } from "./households";

export async function loadProfiles(householdId = null) {
  try {
    const profilesCollection = collection(db, "profiles");
    
    // If a householdId is provided, filter to just that household
    if (householdId) {
      const q = query(profilesCollection, where("householdId", "==", householdId));
      const snapshot = await getDocs(q);
      const profiles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // if the household exists but the query returned fewer profiles than
      // members, there may be users whose profile hasn't been linked yet.
      // fetch them by UID and merge so the UI always shows everybody.
      try {
        const members = await getHouseholdMembers(householdId);
        const missingUids = members
          .map(m => m.uid)
          .filter(uid => !profiles.some(p => p.uid === uid));

        if (missingUids.length) {
          // Firestore 'in' queries support up to 10 elements; split if needed
          const chunks = [];
          for (let i = 0; i < missingUids.length; i += 10) {
            chunks.push(missingUids.slice(i, i + 10));
          }
          for (const chunk of chunks) {
            const q2 = query(profilesCollection, where("uid", "in", chunk));
            const snap2 = await getDocs(q2);
            snap2.docs.forEach(d => {
              const p = { id: d.id, ...d.data() };
              if (!profiles.some(x => x.id === p.id)) profiles.push(p);
            });
          }
        }
      } catch (e) {
        console.warn("Could not fetch missing household members:", e);
      }

      return profiles.length > 0 ? profiles : [];
    }
    
    // Otherwise load all profiles (for backwards compatibility, but avoid in prod)
    const snapshot = await getDocs(profilesCollection);
    const profiles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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

export async function createProfile(email, data = {}) {
  try {
    const profilesCollection = collection(db, "profiles");
    const docRef = await addDoc(profilesCollection, {
      email,
      uid: data.uid ?? null, // Link to Firebase auth user
      householdId: null, // Will be set when user joins/creates a household
      ...data,
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating profile:", error);
    return { success: false, error: error.message };
  }
}

export async function saveProfiles(profiles) {
  // Profiles are now managed in Firebase directly
  // This function is kept for compatibility but doesn't save to localStorage anymore
  console.log("Profiles are managed in Firebase");
}

export async function deleteProfile(profileId) {
  try {
    const profileRef = doc(db, "profiles", profileId);
    await deleteDoc(profileRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting profile:", error);
    return { success: false, error: error.message };
  }
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
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export function splitCsv(s) {
  return String(s ?? "")
    .split(",")
    .map((x) => normalizeToken(x))
    .filter(Boolean);
}

/**
 * Get all profiles in a household
 */
export async function getHouseholdProfiles(householdId) {
  try {
    const profilesCollection = collection(db, "profiles");
    const q = query(profilesCollection, where("householdId", "==", householdId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting household profiles:", error);
    return [];
  }
}

/**
 * Update profile with household ID
 */
export async function linkProfileToHousehold(profileId, householdId) {
  try {
    const profileRef = doc(db, "profiles", profileId);
    await updateDoc(profileRef, { householdId });
    return { success: true };
  } catch (error) {
    console.error("Error linking profile to household:", error);
    return { success: false, error: error.message };
  }
}

