import React, { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertsPanel } from "@/components/AlertsPanel";
import { DashboardStatCard } from "@/components/DashboardStatCard";
import { DinerSelector } from "@/components/DinerSelector";
import { useAuth } from "@/components/AuthContext";
import { logout } from "@/lib/auth";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

function iconLeaf() { /* unchanged */ }
function iconClock() { /* unchanged */ }
function iconJar() { /* unchanged */ }

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, profile, user } = useAuth();

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH USER-BASED INGREDIENTS
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchIngredients = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "ingredients")
        );

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setIngredients(data);
      } catch (err) {
        console.error("Error fetching ingredients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [user]);

  // ✅ DATE CALCULATION (SAFE for string or Firestore Timestamp)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ingredientsWithDays = ingredients.map((i) => {
    if (!i.expiryDate) return { ...i, daysLeft: null };

    let expiry;

    if (i.expiryDate?.seconds) {
      expiry = new Date(i.expiryDate.seconds * 1000);
    } else {
      expiry = new Date(i.expiryDate);
    }

    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { ...i, daysLeft };
  });

  const expired = ingredientsWithDays.filter((i) => i.daysLeft < 0);
  const expiringSoon = ingredientsWithDays.filter(
    (i) => i.daysLeft >= 0 && i.daysLeft <= 7
  );

  const totalItems = ingredients.length;

  // ✅ SAFE PANTRY HEALTH
  const pantryHealth =
    totalItems === 0
      ? 100
      : Math.round(((totalItems - expired.length) / totalItems) * 100);

  // ✅ ALERTS UPDATED
  const alerts = [
    ...expired.map((i) => ({
      id: `expired-${i.id}`,
      severity: "danger",
      title: `${i.name} is expired`,
      description: `Expired ${Math.abs(i.daysLeft)} day(s) ago`,
    })),
    ...expiringSoon.slice(0, 5).map((i) => ({
      id: `soon-${i.id}`,
      severity: "warning",
      title: `${i.name} expires soon`,
      description:
        i.daysLeft === 0
          ? "Expires today"
          : `Expires in ${i.daysLeft} day(s)`,
    })),
  ];

  if (loading) {
    return (
      <div className={`${geistSans.className} ${geistMono.className} min-h-screen flex items-center justify-center`}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      <div className="flex min-h-screen">

        {/* SIDEBAR — UNCHANGED */}
        <aside className="hidden w-64 flex-shrink-0 border-r-2 border-macaron-lemon bg-gradient-to-b from-white via-macaron-lemon/5 to-macaron-lavender/10 px-5 py-6 lg:flex lg:flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-macaron-lemon text-sm font-semibold text-gray-900 shadow-md">SP</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-900">Smart Pantry</p>
                <p className="text-sm font-semibold text-gray-800">Household</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <p className="text-xs text-gray-900 truncate">{profile?.name || user?.email}</p>
                  <Link href="/edit-profile" className="rounded px-2 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition text-center">Edit</Link>
                  <button
                    onClick={async () => {
                      await logout();
                      router.push("/login");
                    }}
                    className="rounded px-2 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="rounded px-3 py-1.5 text-xs font-medium text-white bg-macaron-lemon hover:bg-macaron-lemon/90 transition text-center">Login</Link>
              )}
            </div>
          </div>

          <nav className="mt-8 space-y-1 text-sm">
            <p className="stat-label px-2 text-gray-700">Overview</p>
            <Link href="/" className="mt-1 flex items-center justify-between rounded-lg bg-gradient-to-r from-pink-400 to-pink-300 px-3 py-2 text-sm font-medium text-white shadow hover:shadow-lg"><span>Dashboard</span></Link>
            <Link href="/ai-chat" className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-macaron-lavender/20 transition-colors"><span>AI assistant</span></Link>

            <p className="mt-6 stat-label px-2 text-gray-700">Pantry</p>
            <Link href="/add-food" className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-macaron-mint/20 transition-colors"><span>Food Management</span></Link>
            <Link href="/ai-recipes" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-macaron-sky/20 transition-colors"><span>Smart Meal Generator</span></Link>

            <p className="mt-6 stat-label px-2 text-gray-700">People & tips</p>
            <Link href="/profiles" className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-macaron-lemon/20 transition-colors"><span>Family profiles</span></Link>
            <Link href="/community" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-macaron-rose/20 transition-colors"><span>Community life hacks</span></Link>
            <Link href="/fertilizer" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-macaron-mint/20 transition-colors"><span>Fertilizer tips</span></Link>
          </nav>

          <div className="mt-auto pt-8 text-xs text-gray-700">
            <p>Food waste dashboard prototype</p>
          </div>
      
        </aside>

        {/* MAIN CONTENT — UNCHANGED DESIGN */}
        <div className="flex-1 py-8 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-10">

            {/* Header unchanged */}
            <header className="border-b-2 border-macaron-lavender bg-gradient-to-r from-purple-100 via-pink-50 to-yellow-50 backdrop-blur-md rounded-2xl p-6 shadow-lg text-center">
              <p className="stat-label text-gray-700">Dashboard</p>
              <h1 className="page-title mt-2 text-gray-900 text-3xl font-bold">
                Today in your kitchen
              </h1>
              <p className="card-subtitle mt-2 text-gray-700 text-lg">
                See what's expiring, what to cook, and reduce household waste.
              </p>
            </header>

            {/* Stats — SAME CSS, ONLY LOGIC CHANGED */}
            <section className="grid gap-6 md:grid-cols-3">
              <Link href="/expiring" className="block w-full">
                <DashboardStatCard
                  title="Ingredients Expired"
                  value={`${expired.length}`}
                  subtext={`Expired items`}
                  accent={expired.length ? "rose" : "emerald"}
                  icon={iconClock()}
                />
              </Link>

              <Link href="/pantry-health" className="block w-full">
                <DashboardStatCard
                  title="Pantry Health Score"
                  value={`${pantryHealth}%`}
                  subtext={`${expired.length} expired • ${expiringSoon.length} expiring soon`}
                  accent={expired.length === 0 ? "emerald" : "rose"}
                  icon={iconJar()}
                />
              </Link>

              <Link href="/wasted-food" className="block w-full">
                <DashboardStatCard
                  title="Wasted food"
                  value={`${expired.length}`}
                  subtext={`out of ${totalItems} total items`}
                  accent={expired.length === 0 ? "emerald" : "rose"}
                  icon={iconLeaf()}
                />
              </Link>
            </section>

            {/* Alerts — SAME DESIGN */}
            <section className="space-y-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="rounded-2xl border-2 border-macaron-pink bg-white/90 p-6 shadow-xl hover:shadow-2xl transition-all">
                  <h2 className="card-title text-gray-900 text-xl font-semibold text-center">Who are we cooking for?</h2>
                  <p className="card-subtitle text-gray-700 text-center mt-1">Family profiles adjust allergies and preferences automatically.</p>
                  <div className="mt-4"><DinerSelector /></div>
                </div>

                <div className="rounded-2xl border-2 border-macaron-pink bg-white/90 p-6 shadow-xl hover:shadow-2xl transition-all">
                  <h2 className="card-title text-gray-900 text-xl font-semibold text-center">
                    Alerts
                  </h2>
                  <p className="card-subtitle mt-2 text-gray-700 text-center">
                    Expired and soon-to-expire ingredients
                  </p>
                  <div className="mt-4">
                    <AlertsPanel alerts={alerts} />
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}