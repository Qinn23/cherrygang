// pages/add-food.js
import React, { useEffect, useState } from "react";
import Head from "next/head";
import AddFoodForm from "@/components/AddFoodForm";
import FoodInventory from "@/components/FoodInventory";
import { db } from "@/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { Home } from "lucide-react";
import Link from "next/link";

export default function AddFoodPage() {
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch foods from Firebase (client-side only)
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const foodsCol = collection(db, "ingredients"); // db must be a Firestore instance
        const snapshot = await getDocs(foodsCol);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setFoods(data);
      } catch (err) {
        console.error("Error fetching foods:", err);
      }
    };
    fetchFoods();
  }, []);

  // Add a food item
  const handleAddFood = async (food) => {
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, "ingredients"), {
        ...food,
        addedDate: new Date().toISOString(),
      });
      setFoods(prev => [{ id: docRef.id, ...food }, ...prev]);
    } catch (err) {
      console.error("Error adding food:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a food item
  const handleDeleteFood = async (id) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "ingredients", id));
      setFoods(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error("Error deleting food:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Food Inventory - CherryGang</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
        <header className="mb-8 max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-orange-700">🧂 Food Inventory</h1>
            <p className="text-gray-700">Manage your household foods</p>
          </div>
          <Link href="/">
            <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow border-2 border-gray-300">
              <Home size={20} /> Home
            </button>
          </Link>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Form to add new food */}
          <AddFoodForm onSubmit={handleAddFood} isLoading={isLoading} />

          {/* Display list of foods */}
          <FoodInventory foods={foods} onDelete={handleDeleteFood} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
}