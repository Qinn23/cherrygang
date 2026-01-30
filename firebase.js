// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsyqykjXjiwAwQNCD7S8mMvzEsWU1oQYw",
  authDomain: "smart-pantry-de268.firebaseapp.com",
  projectId: "smart-pantry-de268",
  storageBucket: "smart-pantry-de268.firebasestorage.app",
  messagingSenderId: "848774728194",
  appId: "1:848774728194:web:e5b7e87017068a5a9f351b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
