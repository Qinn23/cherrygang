import React from "react";
import { subscribeToAuthState } from "@/lib/auth";
import { getProfileByEmail } from "@/lib/profiles";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

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
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: !!user,
    }),
    [user, profile, loading]
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
