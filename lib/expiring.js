export const ingredients = [
  { name: "Spinach", qty: "120 g", expiresOn: "2026-01-28", category: "Produce" },
  { name: "Greek Yogurt", qty: "500 g", expiresOn: "2026-01-29", category: "Dairy" },
  { name: "Cherry Tomatoes", qty: "250 g", expiresOn: "2026-01-30", category: "Produce" },
  { name: "Tortillas", qty: "8 pcs", expiresOn: "2026-02-02", category: "Bakery" },
  { name: "Cooked Rice", qty: "300 g", expiresOn: "2026-01-27", category: "Prepared" },
  { name: "Chicken Breast", qty: "400 g", expiresOn: "2026-01-26", category: "Protein" },
];

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysUntil(dateISO, now = new Date()) {
  const a = startOfDay(now).getTime();
  const b = startOfDay(new Date(dateISO)).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function computeWithDeltas(items, now = new Date()) {
  return (items || []).map((i) => ({ ...i, daysLeft: daysUntil(i.expiresOn, now) }));
}

export function getExpired(items, now = new Date()) {
  return computeWithDeltas(items, now).filter((i) => i.daysLeft < 0);
}

export function getExpiringSoon(items, windowDays = 3, now = new Date()) {
  return computeWithDeltas(items, now)
    .filter((i) => i.daysLeft >= 0 && i.daysLeft <= windowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
