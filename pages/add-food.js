import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Home } from "lucide-react";

import AddFoodForm from "@/components/AddFoodForm";
import FoodInventory from "@/components/FoodInventory";

import { db } from "@/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function AddFoodPage() {
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const auth = getAuth();

  // 🔐 Listen for authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // 🔥 Fetch foods for the logged-in user
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
      } catch (error) {
        console.error("Error fetching foods:", error);
      }
    };

    fetchFoods();
  }, [user]);

  // ➕ Add Food
  const handleAddFood = async (food) => {
    if (!user) return;

    setIsLoading(true);

    try {
      const newFood = {
        name: food.name || "",
        qty: food.qty || "",
        category: food.category || "",
        expiryDate: food.expiryDate || "",
        addedDate: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, "users", user.uid, "ingredients"),
        newFood
      );

      setFoods((prev) => [{ id: docRef.id, ...newFood }, ...prev]);
    } catch (error) {
      console.error("Error adding food:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑 Delete Food
  const handleDeleteFood = async (id) => {
    if (!user) return;

    setIsLoading(true);

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "ingredients", id)
      );

      setFoods((prev) => prev.filter((food) => food.id !== id));
    } catch (error) {
      console.error("Error deleting food:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  // ❌ If not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">
          Please login to access your food inventory.
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Food Inventory - CherryGang</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
        {/* Header */}
        <header className="mb-8 max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-orange-700">
              🧂 Food Inventory
            </h1>
            <p className="text-gray-700">
              Manage your household foods
            </p>
          </div>

          <Link href="/">
            <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow border-2 border-gray-300 hover:bg-gray-50">
              <Home size={20} />
              Home
            </button>
          </Link>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-orange-200">
            <button
              onClick={() => setActiveTab("add")}
              className={`px-6 py-3 font-semibold transition-all duration-200 ${
                activeTab === "add"
                  ? "text-orange-600 border-b-4 border-orange-500 bg-orange-50"
                  : "text-gray-600 hover:text-orange-500"
              }`}
            >
              ➕ Add Food
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-6 py-3 font-semibold transition-all duration-200 ${
                activeTab === "inventory"
                  ? "text-orange-600 border-b-4 border-orange-500 bg-orange-50"
                  : "text-gray-600 hover:text-orange-500"
              }`}
            >
              📦 Inventory ({foods.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "add" && (
            <div>
              <AddFoodForm
                onSubmit={handleAddFood}
                isLoading={isLoading}
              />
            </div>
          )}

          {activeTab === "inventory" && (
            <div>
              <FoodInventory
                foods={foods}
                onDelete={handleDeleteFood}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}