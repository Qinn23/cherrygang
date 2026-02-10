import React, { useMemo } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function WastedFoodPage() {
  // TEMP: static example data
  const foods = [
    { expiryDate: "2026-02-09" },
    { expiryDate: "2026-02-12" },
    { expiryDate: "2026-02-01" },
    { expiryDate: "2026-02-20" },
    { expiryDate: "2026-02-22" },
  ];

  const { wastedCount, freshCount, expiringSoonCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const soonLimit = new Date(today);
    soonLimit.setDate(today.getDate() + 7);

    let wasted = 0;
    let fresh = 0;
    let soon = 0;

    foods.forEach(food => {
      const expiry = new Date(food.expiryDate);
      expiry.setHours(0, 0, 0, 0);

      if (expiry < today) {
        wasted++;
      } else if (expiry <= soonLimit) {
        soon++;
      } else {
        fresh++;
      }
    });

    return { wastedCount: wasted, freshCount: fresh, expiringSoonCount: soon };
  }, []);

  const wastedColor =
    wastedCount === 0
      ? "text-macaron-emerald-dark"
      : wastedCount <= 2
      ? "text-macaron-peach-dark"
      : "text-red-500";

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
              Quick overview of expired items in your pantry.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-macaron-pink-dark hover:underline"
          >
            Back
          </Link>
        </div>

        {/* Wasted Score Card */}
        <div className="rounded-2xl border-2 border-red-300 bg-white/90 p-6 shadow-macaron-md text-center">
          <p className="text-xs text-red-500">Expired Items</p>
          <p className={`mt-3 text-5xl font-bold ${wastedColor}`}>
            {wastedCount}
          </p>
          <p className="mt-2 text-xs text-macaron-lavender-dark">
            Items past their expiry date
          </p>
        </div>

        {/* Breakdown */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-macaron-emerald bg-white/90 p-4 shadow-macaron-md">
            <p className="text-xs text-macaron-emerald-dark">Fresh</p>
            <p className="mt-1 text-2xl font-semibold text-macaron-emerald-dark">
              {freshCount}
            </p>
            <p className="text-xs text-macaron-lavender-dark">
              Items in good condition
            </p>
          </div>

          <div className="rounded-2xl border-2 border-macaron-peach bg-white/90 p-4 shadow-macaron-md">
            <p className="text-xs text-macaron-peach-dark">Expiring soon</p>
            <p className="mt-1 text-2xl font-semibold text-macaron-peach-dark">
              {expiringSoonCount}
            </p>
            <p className="text-xs text-macaron-lavender-dark">
              Use within 7 days
            </p>
          </div>

          <div className="rounded-2xl border-2 border-red-300 bg-white/90 p-4 shadow-macaron-md">
            <p className="text-xs text-red-500">Expired</p>
            <p className="mt-1 text-2xl font-semibold text-red-500">
              {wastedCount}
            </p>
            <p className="text-xs text-macaron-lavender-dark">
              Should be reviewed
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-8 rounded-2xl border-2 border-red-300 bg-white/90 p-5 shadow-macaron-md">
          <h2 className="text-sm font-semibold text-macaron-lavender-dark">
            How wasted food is calculated
          </h2>
          <ul className="mt-2 space-y-1 text-xs text-macaron-lavender-dark">
            <li>• Expired items count as wasted food</li>
            <li>• Items expiring soon are a warning</li>
            <li>• Fresh items are safe</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
