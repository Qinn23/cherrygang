import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useProfiles } from '@/components/ProfilesContext';
import AddFoodForm from '@/components/AddFoodForm';
import FoodInventory from '@/components/FoodInventory';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AddFoodPage() {
  const { profiles, selectedDinerIds, isHydrated } = useProfiles();
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'inventory'

  // Get the household ID from selected diners
  const householdId = selectedDinerIds?.length > 0 ? selectedDinerIds[0] : 'default-household';
  const currentDinerName = profiles?.find(p => selectedDinerIds?.includes(p.id))?.name || 'User';

  useEffect(() => {
    if (!isHydrated) return;
    fetchFoods();
  }, [isHydrated, selectedDinerIds]);

  const fetchFoods = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(`/api/food?householdId=${householdId}`);
      const result = await response.json();

      if (result.success) {
        setFoods(result.data || []);
      } else {
        setError('Failed to fetch foods');
      }
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Error loading foods');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddFood = async (formData) => {
    try {
      setIsLoading(true);
      const payload = {
        ...formData,
        addedBy: currentDinerName,
        addedDate: new Date().toISOString(),
      };

      const response = await fetch(`/api/food?householdId=${householdId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setFoods(prev => [
          { id: result.id, ...result.data },
          ...prev
        ]);
        setError(null);
        setActiveTab('inventory'); // Auto-switch to inventory tab to show the added item
        // Show success message
        const event = new CustomEvent('foodAdded', {
          detail: { foodName: formData.name }
        });
        window.dispatchEvent(event);
      } else {
        setError('Failed to add food: ' + result.error);
      }
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Error adding food: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = async (foodId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/food?householdId=${householdId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId }),
      });

      const result = await response.json();

      if (result.success) {
        setFoods(prev => prev.filter(f => f.id !== foodId));
        setError(null);
      } else {
        setError('Failed to delete food');
      }
    } catch (err) {
      console.error('Error deleting food:', err);
      setError('Error deleting food');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Add Food - CherryGang</title>
        <meta name="description" content="Add and manage food inventory" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
        {/* Header */}
        <header className="mb-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-orange-700 mb-1">
                🍳 Food Pantry
              </h1>
              <p className="text-gray-700">
                👨‍🍳 {currentDinerName} managing household inventory
              </p>
            </div>
            <Link href="/">
              <button className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md border-2 border-gray-300 transition">
                <Home size={20} />
                Home
              </button>
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-100 border-2 border-red-400 rounded-xl p-4 text-red-800 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800 font-bold text-xl"
              >
                ×
              </button>
            </div>
          )}

          {/* Success Notification */}
          <SuccessNotification />

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b-2 border-gray-300">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition ${
                activeTab === 'add'
                  ? 'bg-orange-500 text-white border-b-4 border-orange-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              ➕ Add Food
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'bg-orange-500 text-white border-b-4 border-orange-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 Inventory
              <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-sm font-bold">
                {foods.length}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-b-lg shadow-lg p-8">
            {/* Add Food Tab */}
            {activeTab === 'add' && (
              <div className="animate-fadeIn">
                <AddFoodForm onSubmit={handleAddFood} isLoading={isLoading} />
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="animate-fadeIn">
                <div className="flex justify-end mb-6">
                  <button
                    onClick={fetchFoods}
                    disabled={isFetching}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
                    {isFetching ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {isFetching ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-xl text-gray-600">Loading inventory...</p>
                  </div>
                ) : (
                  <FoodInventory
                    foods={foods}
                    onDelete={handleDeleteFood}
                    isLoading={isLoading}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Success notification component
function SuccessNotification() {
  const [show, setShow] = useState(false);
  const [foodName, setFoodName] = useState('');

  useEffect(() => {
    const handleFoodAdded = (event) => {
      setFoodName(event.detail.foodName);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };

    window.addEventListener('foodAdded', handleFoodAdded);
    return () => window.removeEventListener('foodAdded', handleFoodAdded);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-100 border-2 border-green-400 rounded-xl p-4 text-green-800 shadow-lg flex items-center gap-3 animate-bounce">
      <span className="text-2xl">✅</span>
      <div>
        <p className="font-semibold">{foodName} added successfully!</p>
        <p className="text-sm">Check Inventory tab to see it</p>
      </div>
    </div>
  );
}
