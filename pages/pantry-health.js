import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function PantryHealthPage() {
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const snapshot = await getDocs(collection(db, "ingredients"));
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setFoods(data);
      } catch (err) {
        console.error("Error fetching foods:", err);
      }
    };
    fetchFoods();
  }, []);

  const expiringWindowDays = 7;

  const startOfDay = (d) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const { score, freshCount, expiringSoonCount, expiredCount, breakdown } = useMemo(() => {
    const today = startOfDay(new Date());
    const soonLimit = new Date(today);
    soonLimit.setDate(today.getDate() + expiringWindowDays);

    let fresh = 0;
    let soon = 0;
    let expired = 0;
    let points = 0;
    const totalItems = foods.length;
    const maxPoints = totalItems * 2;

    const breakdown = [];

    foods.forEach(food => {
      const expiry = startOfDay(food.expiryDate);
      let foodPoints = 0;
      let status = "";

      if (expiry < today) {
        expired++;
        foodPoints = 0;
        status = "Expired";
      } else if (expiry <= soonLimit) {
        soon++;
        foodPoints = 1;
        status = "Expiring Soon";
      } else {
        fresh++;
        foodPoints = 2;
        status = "Fresh";
      }

      points += foodPoints;
      breakdown.push({
        name: food.name || "Unnamed",
        status,
        points: foodPoints,
      });
    });

    const score = maxPoints === 0 ? 100 : Math.round((points / maxPoints) * 100);

    return { score, freshCount: fresh, expiringSoonCount: soon, expiredCount: expired, breakdown };
  }, [foods]);

  const scoreColor =
    score >= 80
      ? "text-macaron-emerald-dark"
      : score >= 50
      ? "text-macaron-peach-dark"
      : "text-red-500";

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-macaron-lavender-dark">Pantry health</h1>
            <p className="mt-1 text-xs text-macaron-lavender-dark">A quick snapshot of how fresh your pantry is right now.</p>
          </div>
          <Link href="/" className="text-sm text-macaron-pink-dark hover:underline">Back</Link>
        </div>

        {/* Score Card */}
        <div className="rounded-2xl border-2 border-macaron-mint bg-white/90 p-6 shadow-macaron-md text-center">
          <p className="text-xs text-macaron-mint-dark">Pantry health score</p>
          <p className={`mt-3 text-5xl font-bold ${scoreColor}`}>{score}%</p>
          <p className="mt-2 text-xs text-macaron-lavender-dark">Based on freshness and expiry dates</p>
        </div>

        {/* Breakdown */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-macaron-emerald bg-white/90 p-4 shadow-macaron-md">
            <p className="text-xs text-macaron-emerald-dark">Fresh</p>
            <p className="mt-1 text-2xl font-semibold text-macaron-emerald-dark">{freshCount}</p>
            <p className="text-xs text-macaron-lavender-dark">Items in good condition</p>
          </div>

          <div className="rounded-2xl border-2 border-macaron-peach bg-white/90 p-4 shadow-macaron-md">
            <p className="text-xs text-macaron-peach-dark">Expiring soon</p>
            <p className="mt-1 text-2xl font-semibold text-macaron-peach-dark">{expiringSoonCount}</p>
            <p className="text-xs text-macaron-lavender-dark">Use within {expiringWindowDays} days</p>
          </div>

          <div className="rounded-2xl border-2 border-red-300 bg-white/90 p-4 shadow-macaron-md">
            <p className="text-xs text-red-500">Expired</p>
            <p className="mt-1 text-2xl font-semibold text-red-500">{expiredCount}</p>
            <p className="text-xs text-macaron-lavender-dark">Should be reviewed</p>
          </div>
        </div>

        {/* Points Breakdown */}
        <div className="mt-8 rounded-2xl border-2 border-macaron-lavender bg-white/90 p-5 shadow-macaron-md">
          <h2 className="text-sm font-semibold text-macaron-lavender-dark">Points breakdown</h2>
          <p className="mt-1 text-xs text-macaron-lavender-dark">
            Each item contributes points based on status: Fresh = 2, Expiring Soon = 1, Expired = 0.
          </p>
          <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-gray-200 text-xs">
            {breakdown.map((item, idx) => (
              <li key={idx} className="py-1 flex justify-between">
                <span>{item.name}</span>
                <span className="font-semibold">
                  {item.points} pts ({item.status})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}