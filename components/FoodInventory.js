// components/FoodInventory.js
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function FoodInventory({ foods, onDelete, isLoading }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortBy, setSortBy] = useState('expiry'); // expiry, name, category
  const [filterStatus, setFilterStatus] = useState('all'); // all, expired, expiring, good
  const [filterCategory, setFilterCategory] = useState('all'); // all, pantry, fridge, freezer

  // Calculate days until expiry
  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const [year, month, day] = expiryDate.split('-');
    const expiry = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  // Get status color and label
  const getStatus = (expiryDate) => {
    const daysLeft = getDaysLeft(expiryDate);
    if (daysLeft === null) return { status: 'good', label: 'No expiry date', color: 'bg-blue-50 border-blue-200' };
    if (daysLeft < 0) return { status: 'expired', label: `Expired ${Math.abs(daysLeft)} day(s) ago`, color: 'bg-red-50 border-red-200' };
    if (daysLeft <= 7) return { status: 'expiring', label: `Expires in ${daysLeft} day(s)`, color: 'bg-yellow-50 border-yellow-200' };
    return { status: 'good', label: `Fresh - ${daysLeft} days left`, color: 'bg-green-50 border-green-200' };
  };

  // Get icon based on category
  const getCategoryEmoji = (category) => {
    const emojis = {
      pantry: '🗄️',
      fridge: '❄️',
      freezer: '🧊'
    };
    return emojis[category] || '📦';
  };

  // Get text color for status
  const getStatusTextColor = (status) => {
    const colors = {
      expired: 'text-red-700',
      expiring: 'text-yellow-700',
      good: 'text-green-700'
    };
    return colors[status] || 'text-blue-700';
  };

  const handleDeleteClick = (food) => {
    setDeleteConfirm(food);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Filter foods based on status and category
  const filteredFoods = foods.filter(food => {
    // Status filter
    if (filterStatus !== 'all') {
      const { status } = getStatus(food.expiryDate);
      if (status !== filterStatus) return false;
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      if (food.category !== filterCategory) return false;
    }
    
    return true;
  });

  // Sort filtered foods
  const sortedFoods = [...filteredFoods].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'expiry':
      default:
        const daysA = getDaysLeft(a.expiryDate) ?? 999;
        const daysB = getDaysLeft(b.expiryDate) ?? 999;
        return daysA - daysB;
    }
  });

  if (!foods || foods.length === 0) {
    return (
      <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow border border-blue-200 text-center">
        <p className="text-gray-600 text-lg">📦 No foods added yet.</p>
        <p className="text-gray-500 mt-2">Start adding foods to your inventory!</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter and Sort Controls - Compact Dropdowns */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-4 rounded-lg shadow border border-orange-100">
        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="expiry">⏰ Sort by Expiry</option>
          <option value="name">🔤 Sort by Name</option>
          <option value="category">📂 Sort by Location</option>
        </select>

        {/* Status Filter Dropdown */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">👍 All Status</option>
          <option value="expired">🔴 Expired</option>
          <option value="expiring">🟡 Expiring Soon</option>
          <option value="good">🟢 Fresh</option>
        </select>

        {/* Location Filter Dropdown */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">📦 All Locations</option>
          <option value="pantry">🗄️ Pantry</option>
          <option value="fridge">❄️ Fridge</option>
          <option value="freezer">🧊 Freezer</option>
        </select>

        {/* Results count */}
        <div className="text-sm text-gray-600 ml-auto">
          <span className="font-semibold">{sortedFoods.length}</span> of <span className="font-semibold">{foods.length}</span>
        </div>
      </div>

      {/* No results message */}
      {sortedFoods.length === 0 ? (
        <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow border border-blue-200 text-center">
          <p className="text-gray-600 text-lg">📦 No foods match your filters.</p>
          <p className="text-gray-500 mt-2">Try adjusting your filter or sort options.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedFoods.map(food => {
          const { status, label, color } = getStatus(food.expiryDate);
          const statusTextColor = getStatusTextColor(status);
          
          return (
            <div
              key={food.id}
              className={`border-2 p-5 rounded-lg shadow-md transition-all hover:shadow-lg ${color}`}
            >
              {/* Header with category and name */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getCategoryEmoji(food.category)}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{food.category}</span>
                  </div>
                  <p className="font-bold text-lg text-gray-900">{food.name}</p>
                </div>
              </div>

              {/* Quantity and unit */}
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block px-3 py-1 bg-white/60 rounded-full text-sm font-semibold text-gray-700">
                  {food.quantity} {food.unit}
                </span>
              </div>

              {/* Status badge */}
              <div className={`mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusTextColor} bg-white/60`}>
                {label}
              </div>

              {/* Notes if any */}
              {food.notes && (
                <p className="text-sm text-gray-600 mb-3 italic border-l-2 border-gray-300 pl-2">
                  {food.notes}
                </p>
              )}

              {/* Delete button */}
              <button
                onClick={() => handleDeleteClick(food)}
                disabled={isLoading}
                className="w-full mt-3 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          );
        })}
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in">
            <div className="text-center mb-4">
              <p className="text-lg font-bold text-gray-900">Delete Food?</p>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete <span className="font-semibold text-orange-600">{deleteConfirm.name}</span>?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
