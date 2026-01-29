import { db } from '../firebase.js';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

// ------------------------------
// Real-time listener for profiles
// ------------------------------
export function subscribeProfiles(callback) {
  // Listen to the "users" collection in real-time
  const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
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
    await setDoc(doc(db, "users", profile.id), profile); // <-- store in "users" collection
  } catch (e) {
    console.error("Failed to save profile:", e);
  }
}

// ------------------------------
// Delete a profile
// ------------------------------
export async function deleteProfile(id) {
  try {
    await deleteDoc(doc(db, "users", id)); // <-- delete from "users" collection
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
