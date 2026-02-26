import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function WastedFoodPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch all ingredients from Firestore
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const snapshot = await getDocs(collection(db, "ingredients"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoods(data);
      } catch (error) {
        console.error("Error fetching foods:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // ✅ Compute only expired items
  const expiredFoods = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return foods.filter(food => {
      if (!food.expiryDate) return false;
      const [year, month, day] = food.expiryDate.split("-");
      const expiry = new Date(Number(year), Number(month) - 1, Number(day));
      expiry.setHours(0, 0, 0, 0);
      return expiry < today;
    });
  }, [foods]);

  if (loading) {
    return (
      <div
        className={`${geistSans.className} ${geistMono.className} min-h-screen flex items-center justify-center`}
      >
        <p>Loading expired items...</p>
      </div>
    );
  }

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}
    >
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-macaron-lavender-dark">
              Wasted Food
            </h1>
            <p className="mt-1 text-xs text-macaron-lavender-dark">
              Items past their expiry date in your pantry
            </p>
          </div>
          <Link href="/" className="text-sm text-macaron-pink-dark hover:underline">
            Back
          </Link>
        </div>

        {/* Expired Items List */}
        {expiredFoods.length > 0 ? (
          <div className="rounded-2xl border-2 border-red-300 bg-white/90 p-5 shadow-macaron-md">
            <h2 className="text-sm font-semibold text-macaron-lavender-dark">
              Wasted Foods List
            </h2>
            <ul className="mt-2 max-h-80 overflow-y-auto divide-y divide-gray-200 text-xs">
              {expiredFoods.map(food => (
                <li key={food.id} className="py-2 flex justify-between">
                  <span className="font-medium">{food.name || "Unnamed"}</span>
                  <span className="mx-2">Qty: {food.qty || 1}</span>
                  <span className="text-red-500">{food.expiryDate}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-macaron-emerald-dark">
            No expired items found.
          </p>
        )}
      </main>
    </div>
  );
}