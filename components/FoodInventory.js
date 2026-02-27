// components/FoodInventory.js
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function FoodInventory({ foods, onDelete, isLoading }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortBy, setSortBy] = useState('expiry'); // expiry, name, category
  const [filterStatus, setFilterStatus] = useState('all'); // all, expired, expiring, good
  const [filterCategory, setFilterCategory] = useState('all'); // all, pantry, fridge, freezer
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());

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
    if (daysLeft === null)
      return { status: 'good', label: 'No expiry date', color: 'bg-blue-50 border-blue-200' };
    if (daysLeft < 0)
      return { status: 'expired', label: `Expired ${Math.abs(daysLeft)} day(s) ago`, color: 'bg-red-50 border-red-200' };
    if (daysLeft <= 7)
      return { status: 'expiring', label: `Expires in ${daysLeft} day(s)`, color: 'bg-yellow-50 border-yellow-200' };
    return { status: 'good', label: `Fresh - ${daysLeft} days left`, color: 'bg-green-50 border-green-200' };
  };

  const getCategoryEmoji = (category) => {
    const emojis = { pantry: '🗄️', fridge: '❄️', freezer: '🧊' };
    return emojis[category] || '📦';
  };

  const getStatusTextColor = (status) => {
    const colors = { expired: 'text-red-700', expiring: 'text-yellow-700', good: 'text-green-700' };
    return colors[status] || 'text-blue-700';
  };

  const handleDeleteClick = (food) => setDeleteConfirm(food);
  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Filter and sort
  const filteredFoods = foods.filter((food) => {
    if (filterStatus !== 'all') {
      const { status } = getStatus(food.expiryDate);
      if (status !== filterStatus) return false;
    }
    if (filterCategory !== 'all' && food.category !== filterCategory) return false;
    return true;
  });

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

  // ---------------- Calendar view ----------------
  const CalendarView = ({ foods, getDaysLeft, getStatus, getCategoryEmoji, calendarDate, setCalendarDate }) => {
    const byDate = {};
    foods.forEach(f => {
      if (!f.expiryDate) return;
      (byDate[f.expiryDate] = byDate[f.expiryDate] || []).push(f);
    });

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = new Date(first);
    startDay.setDate(first.getDate() - first.getDay());

    const weeks = [];
    let cur = new Date(startDay);
    while (weeks.length < 6) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const iso = cur.toISOString().split('T')[0];
        week.push({ date: new Date(cur), iso });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{calendarDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="px-3 py-1 bg-gray-100 rounded">◀</button>
            <button onClick={nextMonth} className="px-3 py-1 bg-gray-100 rounded">▶</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-600">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weeks.map(week => week.map(day => {
            const today = new Date();
            today.setHours(0,0,0,0); // ignore time
            const isToday = day.date.getTime() === today.getTime();
            const isThisMonth = day.date.getMonth() === month;
            const items = byDate[day.iso] || [];
            return (
              <div key={day.iso} className={`min-h-[90px] p-2 border rounded ${isThisMonth ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-semibold ${!isThisMonth ? 'text-gray-400' : 'text-gray-800'}`}>{day.date.getDate()}</div>
                  <div className="text-xs text-gray-500">{items.length > 0 ? `${items.length}` : ''}</div>
                </div>
                <div className="mt-1 space-y-1">
                  {items.slice(0,3).map(it => {
                    const { status } = getStatus(it.expiryDate);
                    const badge = status === 'expired' ? 'bg-red-100 text-red-700' : (status === 'expiring' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700');
                    return (
                      <div key={it.id} className={`text-xs px-1 py-0.5 rounded ${badge} truncate`} title={`${it.name} (${it.quantity} ${it.unit})`}>
                        {getCategoryEmoji(it.category)} {it.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    );
  };

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
      {/* Filters and View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-4 rounded-lg shadow border border-orange-100">
        <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="expiry">⏰ Sort by Expiry</option>
          <option value="name">🔤 Sort by Name</option>
          <option value="category">📂 Sort by Location</option>
        </select>
        <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">👍 All Status</option>
          <option value="expired">🔴 Expired</option>
          <option value="expiring">🟡 Expiring Soon</option>
          <option value="good">🟢 Fresh</option>
        </select>
        <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="px-4 py-2 border rounded-lg bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">📦 All Locations</option>
          <option value="pantry">🗄️ Pantry</option>
          <option value="fridge">❄️ Fridge</option>
          <option value="freezer">🧊 Freezer</option>
        </select>
        <div className="text-sm text-gray-600 ml-auto">
          <span className="font-semibold">{sortedFoods.length}</span> of <span className="font-semibold">{foods.length}</span>
        </div>
        <div className="ml-2 flex items-center gap-2">
          <button onClick={()=>setViewMode('cards')} className={`px-3 py-2 rounded-md font-medium ${viewMode==='cards'?'bg-orange-500 text-white':'bg-gray-100 text-gray-700'}`}>Card</button>
          <button onClick={()=>setViewMode('calendar')} className={`px-3 py-2 rounded-md font-medium ${viewMode==='calendar'?'bg-orange-500 text-white':'bg-gray-100 text-gray-700'}`}>Calendar</button>
        </div>
      </div>

      {sortedFoods.length===0 ? (
        <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow border border-blue-200 text-center">
          <p className="text-gray-600 text-lg">📦 No foods match your filters.</p>
          <p className="text-gray-500 mt-2">Try adjusting your filter or sort options.</p>
        </div>
      ) : (
        viewMode === 'cards' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedFoods.map(food => {
              const { status, label, color } = getStatus(food.expiryDate);
              const statusTextColor = getStatusTextColor(status);
              return (
                <div key={food.id} className={`border-2 p-5 rounded-lg shadow-md transition-all hover:shadow-lg ${color}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryEmoji(food.category)}</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{food.category}</span>
                      </div>
                      <p className="font-bold text-lg text-gray-900">{food.name}</p>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-white/60 rounded-full text-sm font-semibold text-gray-700">{food.quantity} {food.unit}</span>
                  </div>
                  <div className={`mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusTextColor} bg-white/60`}>{label}</div>
                  {food.notes && (<p className="text-sm text-gray-600 mb-3 italic border-l-2 border-gray-300 pl-2">{food.notes}</p>)}
                  <button onClick={()=>handleDeleteClick(food)} disabled={isLoading} className="w-full mt-3 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <Trash2 size={16}/> Delete
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <CalendarView foods={sortedFoods} getDaysLeft={getDaysLeft} getStatus={getStatus} getCategoryEmoji={getCategoryEmoji} calendarDate={calendarDate} setCalendarDate={setCalendarDate} />
        )
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
              <button onClick={()=>setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isLoading} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">{isLoading?'Deleting...':'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}