import React from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import {
  getProfileByEmail,
  linkProfileToHousehold,
  loadProfiles,
} from "@/lib/profiles";
import { ensurePersonalHousehold } from "@/lib/households";
import { subscribeToAuthState } from "@/lib/auth";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [household, setHousehold] = React.useState(null);
  const [householdProfiles, setHouseholdProfiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  /**
   * 1️⃣ AUTH STATE LISTENER
   */
  React.useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      setUser(currentUser);

      if (!currentUser?.email) {
        setProfile(null);
        setHousehold(null);
        setHouseholdProfiles([]);
        setLoading(false);
        return;
      }

      try {
        // Load profile
        let userProfile = await getProfileByEmail(currentUser.email);

        if (!userProfile) {
          console.warn("No profile found for user.");
          setProfile(null);
          setHousehold(null);
          setHouseholdProfiles([]);
          setLoading(false);
          return;
        }

        let householdId = userProfile.householdId;

        // Create personal household if missing
        if (!householdId) {
          householdId = await ensurePersonalHousehold(currentUser.uid);
          await linkProfileToHousehold(userProfile.id, householdId);
        }

        userProfile.householdId = householdId;
        setProfile(userProfile);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setProfile(null);
        setHousehold(null);
        setHouseholdProfiles([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * 2️⃣ REALTIME HOUSEHOLD LISTENER
   */
  React.useEffect(() => {
    if (!profile?.householdId) return;

    const householdRef = doc(db, "households", profile.householdId);

    const unsubscribe = onSnapshot(householdRef, (snapshot) => {
      if (snapshot.exists()) {
        setHousehold({
          id: snapshot.id,
          ...snapshot.data(),
        });
      } else {
        setHousehold(null);
      }
    });

    return () => unsubscribe();
  }, [profile?.householdId]);

  /**
   * 3️⃣ LOAD ALL HOUSEHOLD PROFILES
   */
  React.useEffect(() => {
    if (!household?.id) {
      setHouseholdProfiles([]);
      return;
    }

    const fetchProfiles = async () => {
      try {
        const profiles = await loadProfiles(household.id);
        setHouseholdProfiles(profiles);
      } catch (err) {
        console.error("Failed to load household profiles:", err);
        setHouseholdProfiles([]);
      }
    };

    fetchProfiles();
  }, [household?.id]);

  /**
   * CONTEXT VALUE
   */
  const value = React.useMemo(
    () => ({
      user,
      profile,
      household,
      householdProfiles,
      loading,
      isAuthenticated: !!user,
    }),
    [user, profile, household, householdProfiles, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * HOOK
 */
export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}