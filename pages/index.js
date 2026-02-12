// pages/index.js
import React from "react";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* =========================
   Animation Variants
========================= */

const heroFadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function WelcomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Auto-redirect logged-in users
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div
      className={`${dmSans.className} min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-slate-900`}
    >
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            SP
          </div>
          <span className="text-lg font-semibold">Smart Pantry</span>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 py-20">
        <motion.section
          className="text-center"
          variants={heroFadeUp}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight sm:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Reduce food waste.
            <br />
            Eat smarter.
          </motion.h1>

          <motion.p
            className="mt-4 text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Smart Pantry helps you track food, plan meals, and turn leftovers
            into smarter choices for your household.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex gap-4">
              <Link
                href="/login?mode=signup"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Get started
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold transition hover:bg-slate-100"
              >
                Sign in
              </Link>
            </div>

            <p className="text-xs text-slate-500">
              New here? Start reducing food waste today — it’s free.
            </p>
          </motion.div>
        </motion.section>

        {/* Features */}
        <motion.section
          className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Feature
            title="Track your pantry"
            desc="Add food items, monitor expiry dates, and know what needs to be used first."
          />
          <Feature
            title="AI-powered recipes"
            desc="Get smart recipe and meal suggestions based on what you already have."
          />
          <Feature
            title="Family profiles"
            desc="Automatically adjust meals for allergies, preferences, and dietary needs."
          />
          <Feature
            title="Smart meal generator"
            desc="Let AI plan meals that reduce waste and save time."
          />
          <Feature
            title="Fertilizer & compost tips"
            desc="Turn expired food into eco-friendly fertilizer with AI guidance."
          />
          <Feature
            title="Community life hacks"
            desc="Share and discover food-saving tips from other households."
          />
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60 py-6 text-center text-xs text-slate-500">
        Smart Pantry · Reducing food waste with smarter decisions
      </footer>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur-md transition hover:shadow-md"
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </motion.div>
  );
}
