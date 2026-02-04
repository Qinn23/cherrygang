import { db } from '../firebase.js';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";

// ------------------------------
// Load profiles once
// ------------------------------
export async function loadProfiles() {
  try {
    const snapshot = await getDocs(collection(db, "profiles"));
    return snapshot.docs.map(doc => doc.data());
  } catch (e) {
    console.error("Failed to load profiles:", e);
    return [];
  }
}

// ------------------------------
// Real-time listener for profiles
// ------------------------------
export function subscribeProfiles(callback) {
  // Listen to the "profiles" collection in real-time
  const unsubscribe = onSnapshot(collection(db, "profiles"), (snapshot) => {
    const profiles = snapshot.docs.map(doc => doc.data());
    callback(profiles);
  }, (error) => {
    console.error("Failed to subscribe to profiles:", error);
  });

  return unsubscribe; // Call this function to stop listening
}

// ------------------------------
// Save or update a single profile
// ------------------------------
export async function saveProfile(profile) {
  try {
    await setDoc(doc(db, "profiles", profile.id), profile); // <-- store in "profiles" collection
  } catch (e) {
    console.error("Failed to save profile:", e);
  }
}

// ------------------------------
// Delete a profile
// ------------------------------
export async function deleteProfile(id) {
  try {
    await deleteDoc(doc(db, "profiles", id)); // <-- delete from "profiles" collection
  } catch (e) {
    console.error("Failed to delete profile:", e);
  }
}

// ------------------------------
// Helpers
// ------------------------------
export function normalizeToken(s) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function splitCsv(s) {
  return String(s ?? "").split(",").map(x => normalizeToken(x)).filter(Boolean);
}
