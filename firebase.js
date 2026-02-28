// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, inMemoryPersistence } from "firebase/auth";

// Your web app Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsyqykjXjiwAwQNCD7S8mMvzEsWU1oQYw",
  authDomain: "smart-pantry-de268.firebaseapp.com",
  projectId: "smart-pantry-de268",
  storageBucket: "smart-pantry-de268.firebasestorage.app",
  messagingSenderId: "848774728194",
  appId: "1:848774728194:web:e5b7e87017068a5a9f351b",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Firestore reference
export const db = getFirestore(app);

// Auth reference
export const auth = getAuth(app);

// Use in-memory persistence: login lasts only for the tab session
setPersistence(auth, inMemoryPersistence).catch(err => {
  console.error("Failed to set auth persistence:", err);
});