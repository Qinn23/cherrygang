import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export default function PantryHealthPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const auth = getAuth();

  // 🔐 Auth Listener (same pattern as Expiring page)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // 🔥 Fetch user's foods
  useEffect(() => {
    if (!user) return;

    const fetchFoods = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "ingredients")
        );

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFoods(data);
      } catch (err) {
        console.error("Error fetching foods:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [user]);

  // 🔄 Auth loading screen
  if (authLoading) {
    return (
      <div className={`${geistSans.className} ${geistMono.className} min-h-screen flex items-center justify-center`}>
        <p>Loading...</p>
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return (
      <div className={`${geistSans.className} ${geistMono.className} min-h-screen flex items-center justify-center`}>
        <p className="text-red-600 text-lg">
          Please login to view pantry health.
        </p>
      </div>
    );
  }

  // 🔄 Data loading
  if (loading) {
    return (
      <div className={`${geistSans.className} ${geistMono.className} min-h-screen flex items-center justify-center`}>
        <p>Loading pantry data...</p>
      </div>
    );
  }

  // ==========================
  // 🧠 Health Score Logic
  // ==========================

  const expiringWindowDays = 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const soonLimit = new Date(today);
  soonLimit.setDate(today.getDate() + expiringWindowDays);

  let fresh = 0;
  let soon = 0;
  let expired = 0;

  foods.forEach((food) => {
    if (!food.expiryDate) return;

    const [year, month, day] = food.expiryDate.split("-");
    const expiry = new Date(Number(year), Number(month) - 1, Number(day));
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
      expired++;
    } else if (expiry <= soonLimit) {
      soon++;
    } else {
      fresh++;
    }
  });

  const totalItems = foods.length;

  const score =
    totalItems === 0
      ? 100
      : Math.round(((totalItems - expired) / totalItems) * 100);

  const scoreColor =
    score >= 80
      ? "text-green-600"
      : score >= 50
      ? "text-orange-500"
      : "text-red-500";

  // ==========================
  // 🎨 UI
  // ==========================

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pantry Health
            </h1>
            <p className="text-gray-600">
              Snapshot of your pantry freshness
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-200"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Score Card */}
        <div className="rounded-xl bg-white p-6 shadow text-center mb-8">
          <p className="text-gray-500 text-sm">Pantry Health Score</p>
          <p className={`text-5xl font-bold ${scoreColor}`}>
            {score}%
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Based on how many items are not expired
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-gray-500 text-sm">Fresh</p>
            <p className="text-2xl font-bold text-green-600">
              {fresh}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-gray-500 text-sm">
              Expiring Soon (7 days)
            </p>
            <p className="text-2xl font-bold text-orange-500">
              {soon}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-gray-500 text-sm">Expired</p>
            <p className="text-2xl font-bold text-red-600">
              {expired}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}