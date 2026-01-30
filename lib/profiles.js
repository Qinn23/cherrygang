const STORAGE_KEY = "smartpantry.profiles.v1";
const DINERS_KEY = "smartpantry.diners.v1";

export function defaultProfiles() {
  return [
    {
      id: "dad",
      name: "Dad",
      allergies: ["nuts"],
      intolerances: [],
      preferredFoods: [],
      dislikedFoods: [],
    },
    {
      id: "mom",
      name: "Mom",
      allergies: [],
      intolerances: [],
      preferredFoods: ["spicy"],
      dislikedFoods: [],
    },
    {
      id: "child",
      name: "Child",
      allergies: [],
      intolerances: ["lactose"],
      preferredFoods: ["mild"],
      dislikedFoods: ["mushrooms"],
    },
  ];
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadProfiles() {
  if (typeof window === "undefined") return defaultProfiles();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const value = raw ? safeParse(raw, null) : null;
  return Array.isArray(value) && value.length ? value : defaultProfiles();
}

export function saveProfiles(profiles) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function loadSelectedDinerIds(fallbackIds = []) {
  if (typeof window === "undefined") return fallbackIds;
  const raw = window.localStorage.getItem(DINERS_KEY);
  const value = raw ? safeParse(raw, null) : null;
  return Array.isArray(value) ? value : fallbackIds;
}

export function saveSelectedDinerIds(ids) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DINERS_KEY, JSON.stringify(ids));
}

export function normalizeToken(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function splitCsv(s) {
  return String(s ?? "")
    .split(",")
    .map((x) => normalizeToken(x))
    .filter(Boolean);
}

