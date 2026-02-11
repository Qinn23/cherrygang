import React from "react";
import { subscribeToAuthState } from "@/lib/auth";
import { getProfileByEmail } from "@/lib/profiles";
import { getUserHousehold, getHousehold } from "@/lib/households";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [household, setHousehold] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // 1️⃣ Auth subscription
  React.useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      setUser(currentUser);

      if (currentUser && currentUser.email) {
        try {
          const userProfile = await getProfileByEmail(currentUser.email);
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to load profile:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setHousehold(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2️⃣ Real-time household listener
  React.useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard
    if (!profile?.householdId) return;

    const householdRef = doc(db, "households", profile.householdId);

    const unsubscribe = onSnapshot(householdRef, (snapshot) => {
      if (snapshot.exists()) {
        setHousehold({ id: snapshot.id, ...snapshot.data() });
      } else {
        setHousehold(null);
      }
    });

    return () => unsubscribe();
  }, [profile?.householdId]);

  const value = React.useMemo(
    () => ({
      user,
      profile,
      household,
      loading,
      isAuthenticated: !!user,
    }),
    [user, profile, household, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
