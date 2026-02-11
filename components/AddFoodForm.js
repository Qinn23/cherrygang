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
    if (!formData.name.trim()) return alert('Please enter a food name');
    
    onSubmit(formData); // Call Firebase POST
    setFormData({
      name: '',
      category: 'pantry',
      expiryDate: '',
      quantity: 1,
      unit: 'piece',
      notes: '',
    });
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg border-2 border-orange-200">
        <div>
          <label>Food Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Broccoli"
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label>Category *</label>
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                className={`px-4 py-2 rounded ${
                  formData.category === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label>Unit</label>
            <select name="unit" value={formData.unit} onChange={handleInputChange} className="w-full border px-3 py-2 rounded">
              <option value="piece">Piece</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">L</option>
              <option value="ml">ml</option>
              <option value="pack">Pack</option>
              <option value="box">Box</option>
            </select>
          </div>
        </div>

        <div>
          <label>Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            min={getTodayDate()}
            value={formData.expiryDate}
            onChange={handleInputChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-orange-500 text-white rounded">
          <Plus size={20} /> {isLoading ? 'Adding...' : 'Add Food'}
        </button>
      </form>
    </div>
  );
}
