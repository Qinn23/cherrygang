import { db } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query, where } from "firebase/firestore";
// ------------------------------
// Load profiles once
// ------------------------------
export async function loadProfiles(householdId) {
  if (!householdId) return [];

  const profilesCol = collection(db, "profiles");
  const q = query(profilesCol, where("householdId", "==", householdId));
  const snap = await getDocs(q);

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


// ------------------------------
// Real-time listener for profiles
// ------------------------------
export function subscribeProfiles(callback) {
  const unsubscribe = onSnapshot(collection(db, "profiles"), (snapshot) => {
    const profiles = snapshot.docs.map(doc => ({
      id: doc.id,   
      ...doc.data()
    }));
    callback(profiles);
  }, (error) => {
    console.error("Failed to subscribe to profiles:", error);
  });

  return unsubscribe;
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
  return String(s ?? "").trim().toUpperCase().replace(/\s+/g, " ");
}

export function splitCsv(s) {
  return String(s ?? "").split(",").map(x => normalizeToken(x)).filter(Boolean);
}
