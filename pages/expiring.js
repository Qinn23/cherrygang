import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export default function ExpiringPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch from same Firestore collection as add-food
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const snapshot = await getDocs(collection(db, "ingredients"));

        const data = snapshot.docs.map((doc) => ({
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

  // ✅ Safe date calculation (NO timezone issue)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const foodsWithDays = foods.map((food) => {
    if (!food.expiryDate) return { ...food, daysLeft: null };

    const [year, month, day] = food.expiryDate.split("-");

    const expiry = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { ...food, daysLeft };
  });

  const expired = foodsWithDays.filter(
    (food) => food.daysLeft < 0
  );

  const expiringSoon = foodsWithDays.filter(
    (food) => food.daysLeft >= 0 && food.daysLeft <= 7
  );

  if (loading) {
    return (
      <div className={`${geistSans.className} ${geistMono.className} min-h-screen flex items-center justify-center`}>
        <p>Loading foods...</p>
      </div>
    );
  }

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Expiring Ingredients
            </h1>
            <p className="text-gray-600">
              Track expired and soon-to-expire items
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-200"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-gray-500 text-sm">Expired</p>
            <p className="text-2xl font-bold text-red-600">
              {expired.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-gray-500 text-sm">Expiring Soon (7 days)</p>
            <p className="text-2xl font-bold text-orange-500">
              {expiringSoon.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-gray-500 text-sm">Total Items</p>
            <p className="text-2xl font-bold text-blue-600">
              {foods.length}
            </p>
          </div>
        </div>

        {/* Expired Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Expired ({expired.length})
          </h2>

          {expired.length === 0 ? (
            <p className="text-gray-500">
              No expired items 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {expired.map((item) => (
                <div key={item.id} className="bg-red-50 border p-4 rounded-lg">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.qty} • {item.category}
                  </p>
                  <p className="text-sm text-red-600">
                    Expired {Math.abs(item.daysLeft)} day(s) ago
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expiring Soon Section */}
        <section>
          <h2 className="text-xl font-semibold text-orange-500 mb-4">
            Expiring Soon ({expiringSoon.length})
          </h2>

          {expiringSoon.length === 0 ? (
            <p className="text-gray-500">
              Nothing expiring in next 7 days
            </p>
          ) : (
            <div className="space-y-3">
              {expiringSoon.map((item) => (
                <div key={item.id} className="bg-orange-50 border p-4 rounded-lg">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.qty} • {item.category}
                  </p>
                  <p className="text-sm text-orange-600">
                    {item.daysLeft === 0
                      ? "Expires Today"
                      : `${item.daysLeft} day(s) left`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}