import React from "react";
import {
  defaultProfiles,
  loadProfiles,
  loadSelectedDinerIds,
  saveProfiles,
  saveSelectedDinerIds,
} from "@/lib/profiles";

const ProfilesContext = React.createContext(null);

export { ProfilesContext };

export function ProfilesProvider({ children }) {
  const [profiles, setProfiles] = React.useState(() => defaultProfiles());
  const [selectedDinerIds, setSelectedDinerIds] = React.useState(() => []);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const p = loadProfiles();
    setProfiles(p);
    const ids = loadSelectedDinerIds(p.map((x) => x.id));
    setSelectedDinerIds(ids.length ? ids : p.map((x) => x.id));
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveProfiles(profiles);
  }, [profiles, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveSelectedDinerIds(selectedDinerIds);
  }, [selectedDinerIds, isHydrated]);

  const value = React.useMemo(
    () => ({
      profiles,
      setProfiles,
      selectedDinerIds,
      setSelectedDinerIds,
      isHydrated,
    }),
    [profiles, selectedDinerIds, isHydrated]
  );

  return (
    <ProfilesContext.Provider value={value}>
      {children}
    </ProfilesContext.Provider>
  );
}

export function useProfiles() {
  const ctx = React.useContext(ProfilesContext);
  if (!ctx) throw new Error("useProfiles must be used within ProfilesProvider");
  return ctx;
}

