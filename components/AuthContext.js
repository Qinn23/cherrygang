import React from "react";
import { subscribeToAuthState } from "@/lib/auth";
import { getProfileByEmail } from "@/lib/profiles";
import { getUserHousehold, getHousehold } from "@/lib/households";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [household, setHousehold] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      setUser(currentUser);
      console.log("Auth state changed, user:", currentUser?.uid);

      if (currentUser && currentUser.email) {
        try {
          const userProfile = await getProfileByEmail(currentUser.email);
          console.log("Loaded profile:", userProfile);
          setProfile(userProfile);

          let householdId = userProfile?.householdId;
          
          // If no householdId on profile, try family_profiles
          if (!householdId) {
            console.log("No householdId on profile, checking family_profiles...");
            householdId = await getUserHousehold(currentUser.uid);
            console.log("Got householdId from family_profiles:", householdId);
          }

          // Load household if we found one
          if (householdId) {
            const householdData = await getHousehold(householdId);
            console.log("Loaded household:", householdData);
            setHousehold(householdData);
          } else {
            console.warn("No household found for user");
            setHousehold(null);
          }
        } catch (err) {
          console.error("Failed to load profile/household:", err);
          setProfile(null);
          setHousehold(null);
        }
      } else {
        setProfile(null);
        setHousehold(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
