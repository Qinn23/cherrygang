import React from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function FoodSavePage() {
  // Static summary values for now (kept consistent with dashboard defaults)
  const foodSavedKg = 3.4;
  const co2ReducedKg = 8.9;

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-macaron-lavender-dark">Food saved</h1>
            <p className="mt-1 text-xs text-macaron-lavender-dark">Estimated waste prevented and emissions avoided this month.</p>
          </div>
          <Link href="/" className="text-sm text-macaron-pink-dark hover:underline">Back</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-macaron-mint bg-white/90 p-5 shadow-macaron-md">
            <p className="text-xs text-macaron-mint-dark">Food saved</p>
            <p className="mt-2 text-2xl font-semibold text-macaron-mint-dark">{foodSavedKg.toFixed(1)} kg</p>
            <p className="mt-2 text-xs text-macaron-lavender-dark">Estimated weight of food not wasted this month.</p>
          </div>

          <div className="rounded-2xl border-2 border-macaron-emerald bg-white/90 p-5 shadow-macaron-md">
            <p className="text-xs text-macaron-emerald-dark">CO₂ reduced</p>
            <p className="mt-2 text-2xl font-semibold text-macaron-emerald-dark">{co2ReducedKg.toFixed(1)} kg</p>
            <p className="mt-2 text-xs text-macaron-lavender-dark">Approximate emissions avoided by preventing food waste.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border-2 border-macaron-peach bg-white/90 p-5 shadow-macaron-md">
          <h2 className="text-sm font-semibold text-macaron-peach-dark">How this is calculated</h2>
          <p className="mt-2 text-xs text-macaron-lavender-dark">Currently a simple estimate based on common weight-to-emissions conversions. In future this will use detailed item-level tracking.</p>
        </div>
      </main>
    </div>
  );
}
