// components/FoodInventory.js
import React from 'react';

export default function FoodInventory({ foods, onDelete, isLoading }) {
  if (!foods || foods.length === 0) {
    return (
      <div className="p-4 bg-white rounded shadow border border-orange-200">
        <p className="text-gray-500">No foods added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {foods.map(food => (
        <div
          key={food.id}
          className="flex justify-between items-center border p-4 rounded bg-white shadow"
        >
          <div>
            <p className="font-bold text-orange-700">{food.name}</p>
            <p className="text-gray-500">
              {food.quantity} {food.unit} | {food.category} | {food.expiryDate ? `Expires: ${food.expiryDate}` : 'No expiry'}
            </p>
            {food.notes && <p className="text-gray-400 italic">{food.notes}</p>}
          </div>
          <button
            onClick={() => onDelete(food.id)}
            disabled={isLoading}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
