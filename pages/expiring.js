import React from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { computeWithDeltas, getExpired, getExpiringSoon, ingredients } from "@/lib/expiring";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function ExpiringPage() {
  const now = new Date();
  const withDeltas = computeWithDeltas(ingredients, now);
  const expired = getExpired(ingredients, now);
  const expiringSoon = getExpiringSoon(ingredients, 7, now);

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-macaron-lavender-dark">
              Pantry
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-macaron-lavender-dark">
              Expiring ingredients
            </h1>
            <p className="mt-1 text-sm text-macaron-lavender-dark">
              Keep track of what needs attention in your pantry.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-macaron-lavender-dark hover:bg-macaron-lavender/20 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border-2 border-macaron-pink bg-white/90 p-5 shadow-macaron-md">
            <p className="text-xs font-semibold uppercase text-macaron-lavender-dark">Expired</p>
            <p className="mt-2 text-2xl font-semibold text-macaron-pink-dark">{expired.length}</p>
            <p className="mt-1 text-xs text-macaron-lavender-dark">Items to discard</p>
          </div>
          <div className="rounded-2xl border-2 border-macaron-peach bg-white/90 p-5 shadow-macaron-md">
            <p className="text-xs font-semibold uppercase text-macaron-lavender-dark">Expiring soon</p>
            <p className="mt-2 text-2xl font-semibold text-macaron-peach-dark">{expiringSoon.length}</p>
            <p className="mt-1 text-xs text-macaron-lavender-dark">Next 7 days</p>
          </div>
          <div className="rounded-2xl border-2 border-macaron-mint bg-white/90 p-5 shadow-macaron-md">
            <p className="text-xs font-semibold uppercase text-macaron-lavender-dark">Total tracked</p>
            <p className="mt-2 text-2xl font-semibold text-macaron-mint-dark">{ingredients.length}</p>
            <p className="mt-1 text-xs text-macaron-lavender-dark">In your pantry</p>
          </div>
        </div>

        {/* Expired Items */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-macaron-pink-dark"></div>
            <h2 className="text-lg font-semibold text-macaron-pink-dark">Expired ({expired.length})</h2>
          </div>
          {expired.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-macaron-mint bg-macaron-mint/10 p-6 text-center">
              <p className="text-sm text-macaron-mint-dark">No expired items. Great work!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expired.map((i) => (
                <div
                  key={`${i.name}-${i.expiresOn}`}
                  className="group rounded-xl border-2 border-macaron-pink/30 bg-macaron-pink/5 p-4 hover:border-macaron-pink hover:bg-macaron-pink/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-macaron-pink-dark">{i.name}</p>
                      <p className="mt-0.5 text-xs text-macaron-lavender-dark">{i.qty} • {i.category}</p>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <span className="inline-block rounded-full bg-macaron-pink px-3 py-1 text-xs font-medium text-white">
                        {Math.abs(i.daysLeft)}d ago
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expiring Soon */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-macaron-peach-dark"></div>
            <h2 className="text-lg font-semibold text-macaron-peach-dark">Expiring soon ({expiringSoon.length})</h2>
          </div>
          {expiringSoon.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-macaron-sky bg-macaron-sky/10 p-6 text-center">
              <p className="text-sm text-macaron-sky-dark">Nothing expiring in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringSoon.map((i) => {
                const urgency =
                  i.daysLeft === 0
                    ? "bg-gradient-macaron-pink"
                    : i.daysLeft <= 2
                      ? "bg-gradient-macaron-peach"
                      : "bg-gradient-macaron-sky";

                return (
                  <div
                    key={`${i.name}-${i.expiresOn}`}
                    className="group rounded-xl border-2 border-macaron-peach/30 bg-macaron-peach/5 p-4 hover:border-macaron-peach hover:bg-macaron-peach/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-macaron-peach-dark">{i.name}</p>
                        <p className="mt-0.5 text-xs text-macaron-lavender-dark">{i.qty} • {i.category}</p>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <span className={`inline-block rounded-full ${urgency} px-3 py-1 text-xs font-medium text-white`}>
                          {i.daysLeft === 0 ? "Today" : `${i.daysLeft}d left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
