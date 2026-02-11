import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const CATEGORIES = [
  { id: 'pantry', label: '🗄️ Pantry', description: 'Dry goods, canned items' },
  { id: 'fridge', label: '❄️ Fridge', description: 'Vegetables, dairy, ready meals' },
  { id: 'freezer', label: '🧊 Freezer', description: 'Frozen items, meat' },
];

export default function AddFoodForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'pantry',
    expiryDate: '',
    quantity: 1,
    unit: 'piece',
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a food name');
      return;
    }
    onSubmit(formData); // <-- Firebase call happens in page
    setFormData({
      name: '',
      category: 'pantry',
      expiryDate: '',
      quantity: 1,
      unit: 'piece',
      notes: '',
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg p-8 border-2 border-orange-200">
        <h2 className="text-3xl font-bold text-orange-800 mb-2">➕ Add New Food</h2>
        <p className="text-orange-600 mb-8">Keep track of your ingredients and expiry dates</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Food Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-3">
              🥕 Food Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Broccoli, Chicken Breast, Milk"
              className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">📍 Storage Location *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                  className={`p-4 rounded-xl border-2 transition font-semibold text-left ${
                    formData.category === cat.id
                      ? 'border-orange-500 bg-orange-100 text-orange-900'
                      : 'border-orange-200 bg-white text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <div className="text-xl mb-1">{cat.label}</div>
                  <div className="text-xs text-gray-600">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-semibold text-gray-800 mb-3">
                📦 Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-semibold text-gray-800 mb-3">
                📏 Unit
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white text-gray-800 cursor-pointer"
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="l">Liter (L)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="cup">Cup</option>
                <option value="tbsp">Tablespoon</option>
                <option value="tsp">Teaspoon</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
              </select>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-800 mb-3">
              📅 Expiry Date
            </label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              min={getTodayDate()}
              className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white text-gray-800"
            />
            {formData.expiryDate && (
              <p className="text-xs text-orange-700 mt-2">
                ⏰ Days remaining: {Math.ceil((new Date(formData.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-800 mb-3">
              📝 Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="e.g., Organic, needs washing, sealed pack..."
              rows="3"
              className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white text-gray-800 placeholder-gray-400 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition"
          >
            <Plus size={20} />
            {isLoading ? 'Adding...' : 'Add Food'}
          </button>
        </form>
      </div>
    </div>
  );
}
