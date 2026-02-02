import React, { useState } from 'react';
import { Trash2, AlertCircle, Filter, ChevronDown, ChevronUp, ChefHat } from 'lucide-react';

const CATEGORIES = {
  pantry: { label: '🗄️ Pantry', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  fridge: { label: '❄️ Fridge', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  freezer: { label: '🧊 Freezer', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
};

export default function FoodInventory({ foods, onDelete, isLoading }) {
  const [expandedFoods, setExpandedFoods] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('expiry'); // 'expiry' or 'added'
  const [showRecipes, setShowRecipes] = useState(false);
  const [recipes, setRecipes] = useState(null);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const toggleExpanded = (foodId) => {
    setExpandedFoods(prev => ({
      ...prev,
      [foodId]: !prev[foodId]
    }));
  };

  const fetchRecipeSuggestions = async () => {
    try {
      setRecipesLoading(true);
      const ingredientsText = foods.map(f => `${f.quantity} ${f.unit} of ${f.name}`).join(', ');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/ai-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientsDescription: ingredientsText,
          householdDescription: 'Using available pantry, fridge, and freezer items'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.text && result.text.trim()) {
        setRecipes(result.text);
      } else if (result.error) {
        setRecipes(`Error: ${result.error}. Please try again.`);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      const errorMsg = error.name === 'AbortError' 
        ? 'Recipe loading took too long. Please try again.'
        : `Failed to load recipes: ${error.message}`;
      setRecipes(errorMsg);
    } finally {
      setRecipesLoading(false);
    }
  };

  const formatRecipes = (text) => {
    if (!text) return [];
    
    // Split by ### (h3 headers) to separate recipes
    const recipes = text.split('###').filter(r => r.trim());
    
    return recipes.map((recipe, idx) => {
      const lines = recipe.split('\n').filter(l => l.trim());
      const title = lines[0]?.trim() || `Recipe ${idx + 1}`;
      const content = lines.slice(1).join('\n').trim();
      
      // Parse content for better formatting
      const cleanContent = content
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\*/g, '•') // Convert single * to bullets
        .replace(/^-\s/gm, '• ') // Convert - to bullets
        .trim();
      
      return { title, content: cleanContent };
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diff = expiry - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'unknown', label: 'No date', color: 'text-gray-500' };
    
    const days = getDaysUntilExpiry(expiryDate);
    
    if (days < 0) {
      return { status: 'expired', label: '❌ Expired', color: 'text-red-600' };
    } else if (days === 0) {
      return { status: 'today', label: '⚠️ Today!', color: 'text-orange-600 font-bold' };
    } else if (days <= 3) {
      return { status: 'soon', label: `⏰ ${days} days left`, color: 'text-orange-500 font-semibold' };
    } else if (days <= 7) {
      return { status: 'warning', label: `📅 ${days} days left`, color: 'text-yellow-600' };
    } else {
      return { status: 'good', label: `✅ ${days} days left`, color: 'text-green-600' };
    }
  };

  const filteredFoods = selectedCategory === 'all'
    ? foods
    : foods.filter(food => food.category === selectedCategory);

  const sortedFoods = [...filteredFoods].sort((a, b) => {
    if (sortBy === 'expiry') {
      const aExpiry = getDaysUntilExpiry(a.expiryDate) || 999;
      const bExpiry = getDaysUntilExpiry(b.expiryDate) || 999;
      return aExpiry - bExpiry;
    }
    return new Date(b.addedDate) - new Date(a.addedDate);
  });

  const urgentFoods = sortedFoods.filter(f => {
    const status = getExpiryStatus(f.expiryDate);
    return status.status === 'expired' || status.status === 'today' || status.status === 'soon';
  });

  if (foods.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🥬</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Pantry is Empty</h3>
          <p className="text-gray-600">Start by adding some ingredients above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-gray-700 px-8 py-6">
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
            📊 Food Inventory
          </h2>
          
          {urgentFoods.length > 0 && (
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 flex items-center gap-2 text-red-800 font-semibold">
              <AlertCircle size={20} />
              {urgentFoods.length} item{urgentFoods.length > 1 ? 's' : ''} expiring soon!
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="border-b-2 border-gray-200 px-8 py-6 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                <Filter size={16} />
                Filter by Location
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition bg-white text-gray-800 cursor-pointer"
              >
                <option value="all">All Locations</option>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition bg-white text-gray-800 cursor-pointer"
              >
                <option value="expiry">Expiry Date (Urgent First)</option>
                <option value="added">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Food Items List */}
        <div className="divide-y-2 divide-gray-200">
          {sortedFoods.length > 0 ? (
            sortedFoods.map((food) => {
              const expiryStatus = getExpiryStatus(food.expiryDate);
              const isExpanded = expandedFoods[food.id];
              const categoryInfo = CATEGORIES[food.category];

              return (
                <div
                  key={food.id}
                  className={`transition ${expiryStatus.status === 'expired' ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}`}
                >
                  {/* Main Item Row */}
                  <button
                    onClick={() => toggleExpanded(food.id)}
                    className="w-full px-8 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{getEmoji(food.name)}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800">{food.name}</h3>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border-2 ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Display */}
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-gray-800">{food.quantity}</div>
                      <div className="text-xs text-gray-600">{food.unit}</div>
                    </div>

                    {/* Expand Button */}
                    <div className="text-gray-600">
                      {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-8 py-6 border-t-2 border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {food.expiryDate && (
                          <div>
                            <div className="text-xs font-semibold text-gray-600 uppercase">Expiry Date</div>
                            <div className="text-lg font-bold text-gray-800">{food.expiryDate}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-gray-600 uppercase">Added Date</div>
                          <div className="text-lg font-bold text-gray-800">{new Date(food.addedDate).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {food.notes && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Notes</div>
                          <div className="bg-white p-3 rounded-lg text-gray-700 border-2 border-gray-200">
                            📝 {food.notes}
                          </div>
                        </div>
                      )}

                      {food.addedBy && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 uppercase">Added by</div>
                          <div className="text-lg font-bold text-gray-800">👤 {food.addedBy}</div>
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${food.name}?`)) {
                            onDelete(food.id);
                          }
                        }}
                        disabled={isLoading}
                        className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        Delete Item
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-8 py-12 text-center text-gray-600">
              <p className="text-lg">No items in this category</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-gray-100 px-8 py-4 border-t-2 border-gray-200 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{sortedFoods.length}</div>
            <div className="text-xs text-gray-600">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{urgentFoods.length}</div>
            <div className="text-xs text-gray-600">Expiring Soon</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {sortedFoods.filter(f => {
                const days = getDaysUntilExpiry(f.expiryDate);
                return days > 7;
              }).length}
            </div>
            <div className="text-xs text-gray-600">Good Stock</div>
          </div>
        </div>

        {/* Recipe Suggestions */}
        <div className="border-t-2 border-gray-200">
          <button
            onClick={() => {
              if (!showRecipes) {
                fetchRecipeSuggestions();
              }
              setShowRecipes(!showRecipes);
            }}
            className="w-full px-8 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition text-left"
          >
            <div className="flex items-center gap-2">
              <ChefHat size={24} className="text-purple-600" />
              <span className="font-semibold text-gray-800">Recipe Suggestions</span>
            </div>
            <div className="text-gray-600">
              {showRecipes ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </button>

          {showRecipes && (
            <div className="px-8 py-6 bg-white border-t-2 border-gray-200">
              {recipesLoading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <div className="animate-spin">⏳</div>
                  <span className="text-gray-600">Finding recipes...</span>
                </div>
              ) : recipes ? (
                <div className="space-y-6">
                  {recipes.startsWith('Error') || recipes.startsWith('Failed') ? (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">
                      <p className="font-semibold mb-2">⚠️ Recipe Generation Unavailable</p>
                      <p className="text-sm">{recipes}</p>
                      <p className="text-xs mt-3 text-red-600">
                        💡 Suggestion: Try manually planning meals with items that expire soon!
                      </p>
                    </div>
                  ) : (
                    formatRecipes(recipes).map((recipe, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-l-4 border-purple-500 shadow-sm">
                        <h3 className="font-bold text-xl text-purple-800 mb-4 leading-tight">
                          {recipe.title}
                        </h3>
                        <div className="bg-white rounded-lg p-4 text-gray-800 leading-relaxed text-sm space-y-2">
                          {recipe.content.split('\n').map((line, i) => (
                            <div key={i} className={line.trim().startsWith('•') ? 'ml-4' : ''}>
                              {line.trim().startsWith('•') ? (
                                <span className="text-purple-600 font-semibold">
                                  {line}
                                </span>
                              ) : (
                                line
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => fetchRecipeSuggestions()}
                    disabled={recipesLoading}
                    className="w-full text-sm font-semibold text-purple-600 hover:text-purple-700 py-3 transition border-2 border-purple-300 rounded-lg hover:bg-purple-50 disabled:opacity-50"
                  >
                    ↻ Refresh Suggestions
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get emoji based on food name
function getEmoji(name) {
  const lowerName = name.toLowerCase();
  const emojiMap = {
    broccoli: '🥦', spinach: '🥬', lettuce: '🥬', carrot: '🥕', potato: '🥔',
    tomato: '🍅', onion: '🧅', garlic: '🧄', pepper: '🫑', egg: '🥚', eggs: '🥚',
    chicken: '🍗', beef: '🥩', fish: '🐟', meat: '🥩', pork: '🐷', shrimp: '🦐',
    milk: '🥛', cheese: '🧀', butter: '🧈', yogurt: '🥛', cream: '🍶',
    bread: '🍞', rice: '🍚', pasta: '🍝', flour: '🌾', sugar: '🍯', salt: '🧂',
    apple: '🍎', banana: '🍌', orange: '🍊', strawberry: '🍓', blueberry: '🫐',
    grapes: '🍇', watermelon: '🍉', lemon: '🍋', avocado: '🥑', coconut: '🥥',
    cake: '🎂', ice: '🧊', frozen: '🧊', drink: '🥤', water: '💧',
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }
  return '🛒';
}
