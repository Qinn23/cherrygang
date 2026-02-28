# 🛠️ Developer Guide - Extending the Food Inventory System

## 📚 Project Architecture

```
Food Inventory System
├── Frontend
│   ├── components/
│   │   ├── AddFoodForm.js      (Form logic & UI)
│   │   └── FoodInventory.js    (Display logic & UI)
│   └── pages/
│       ├── add-food.js         (Page integration)
│       └── api/
│           └── food.js         (Backend API)
├── Styling
│   └── styles/globals.css      (Global styles & animations)
└── Documentation
    ├── QUICKSTART_FOOD.md
    ├── FOOD_INVENTORY_GUIDE.md
    └── UI_DESIGN_SHOWCASE.md
```

---

## 🏗️ Data Flow

```
User Input
    ↓
AddFoodForm Component
    ↓
handleAddFood() function
    ↓
POST /api/food endpoint
    ↓
Firebase Firestore
    ↓
Success response
    ↓
Update local state
    ↓
FoodInventory displays item
```

---

## 🧩 Component Interface Reference

### AddFoodForm.js

**Props:**
```javascript
interface Props {
  onSubmit: (formData: FormData) => Promise<void>
  isLoading: boolean
}

interface FormData {
  name: string
  category: 'pantry' | 'fridge' | 'freezer'
  expiryDate: string (YYYY-MM-DD)
  quantity: number
  unit: string
  notes: string
}
```

**Key Functions:**
```javascript
handleInputChange(e)        // Update form state
handleSubmit(e)             // Validate & submit
startCamera()               // Initialize camera
stopCamera()                // Close camera stream
captureFrame()              // Capture barcode frame
getTodayDate()              // Get today's date string
```

**State:**
```javascript
formData: {
  name: '',
  category: 'pantry',
  expiryDate: '',
  quantity: 1,
  unit: 'piece',
  notes: ''
}
showScanner: boolean
```

---

### FoodInventory.js

**Props:**
```javascript
interface Props {
  foods: FoodItem[]
  onDelete: (foodId: string) => Promise<void>
  isLoading: boolean
}

interface FoodItem {
  id: string
  name: string
  category: string
  expiryDate: string
  quantity: number
  unit: string
  notes: string
  addedBy: string
  addedDate: string
}
```

**Key Functions:**
```javascript
toggleExpanded(foodId)      // Toggle item details
getDaysUntilExpiry(date)    // Calculate remaining days
getExpiryStatus(date)       // Get status object
getEmoji(name)              // Get emoji for food

// Filter & Sort
filteredFoods               // By category
sortedFoods                 // By expiry or date
urgentFoods                 // Items expiring soon
```

**State:**
```javascript
expandedFoods: { [foodId]: boolean }
selectedCategory: string ('all' | 'pantry' | 'fridge' | 'freezer')
sortBy: string ('expiry' | 'added')
```

---

## 🔌 API Endpoint Details

### POST /api/food

**Request:**
```javascript
{
  householdId: string (query param)
  
  body: {
    name: string (required)
    category: string (required)
    expiryDate: string (ISO date)
    quantity: number
    unit: string
    notes: string
    addedBy: string
  }
}
```

**Response (201):**
```javascript
{
  success: true
  id: string
  data: {
    name: string
    category: string
    expiryDate: string
    quantity: number
    unit: string
    notes: string
    addedBy: string
    addedDate: string
    createdAt: timestamp
  }
}
```

**Error Response (400/500):**
```javascript
{
  success?: false
  error: string (error message)
}
```

---

### GET /api/food

**Request:**
```javascript
{
  householdId: string (query param)
}
```

**Response (200):**
```javascript
{
  success: true
  data: [
    {
      id: string
      name: string
      category: string
      expiryDate: string
      quantity: number
      unit: string
      notes: string
      addedBy: string
      addedDate: string
      createdAt: timestamp
    },
    // ... more items
  ]
}
```

---

### DELETE /api/food

**Request:**
```javascript
{
  householdId: string (query param)
  
  body: {
    foodId: string (required)
  }
}
```

**Response (200):**
```javascript
{
  success: true
}
```

---

## 🔧 Modifying Core Functionality

### Add a New Storage Category

**Step 1:** Update `AddFoodForm.js`:
```javascript
const CATEGORIES = [
  { id: 'pantry', label: '🗄️ Pantry', description: '...' },
  { id: 'fridge', label: '❄️ Fridge', description: '...' },
  { id: 'freezer', label: '🧊 Freezer', description: '...' },
  // Add new category:
  { id: 'counter', label: '🛏️ Counter', description: 'Room temperature...' },
];
```

**Step 2:** Update `FoodInventory.js`:
```javascript
const CATEGORIES = {
  pantry: { label: '🗄️ Pantry', color: 'bg-yellow-100...' },
  fridge: { label: '❄️ Fridge', color: 'bg-blue-100...' },
  freezer: { label: '🧊 Freezer', color: 'bg-cyan-100...' },
  // Add new:
  counter: { label: '🛏️ Counter', color: 'bg-pink-100...' },
};
```

**Step 3:** Test form and display

---

### Change Expiry Thresholds

**Edit `FoodInventory.js`:**
```javascript
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'unknown', ... };
  
  const days = getDaysUntilExpiry(expiryDate);
  
  // Customize these thresholds:
  if (days < 0) return { status: 'expired', label: '❌ Expired', ... };
  else if (days === 0) return { status: 'today', label: '⚠️ Today!', ... };
  else if (days <= 2) return { status: 'urgent', label: `🔴 ${days} days!`, ... };  // ← Changed from 3
  else if (days <= 5) return { status: 'soon', label: `⏰ ${days} days`, ... };     // ← Changed from 7
  else return { status: 'good', label: `✅ ${days} days`, ... };
};
```

---

### Add More Unit Options

**Edit `AddFoodForm.js`:**
```javascript
<select name="unit" value={formData.unit} onChange={handleInputChange}>
  <option value="piece">Piece</option>
  <option value="kg">Kilogram (kg)</option>
  // ... existing options ...
  
  {/* Add new units: */}
  <option value="oz">Ounce (oz)</option>
  <option value="lb">Pound (lb)</option>
  <option value="lbs">Pounds (lbs)</option>
  <option value="fl-oz">Fluid Ounce (fl oz)</option>
  <option value="gallon">Gallon</option>
  <option value="pint">Pint</option>
</select>
```

---

### Expand Food Emoji List

**Edit `FoodInventory.js`:**
```javascript
function getEmoji(name) {
  const lowerName = name.toLowerCase();
  const emojiMap = {
    // Vegetables
    broccoli: '🥦', spinach: '🥬', carrot: '🥕', potato: '🥔',
    tomato: '🍅', onion: '🧅', garlic: '🧄',
    
    // Add more:
    cucumber: '🥒', radish: '🌶️', peas: '🟢',
    mushroom: '🍄', eggplant: '🍆', corn: '🌽',
    
    // ... rest of mappings
  };
  
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) return emoji;
  }
  return '🛒'; // Default
}
```

---

## 🔌 Adding Barcode Scanning

### Install Dependencies:
```bash
npm install @zxing/library
```

### Update `AddFoodForm.js`:

```javascript
import { BrowserMultiFormatReader } from '@zxing/library';

const captureFrame = async () => {
  if (videoRef.current && canvasRef.current) {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    try {
      const codeReader = new BrowserMultiFormatReader();
      const result = await codeReader.decodeFromCanvas(canvasRef.current);
      
      // Extract product code
      const barcode = result.text;
      
      // Look up food name from barcode
      const foodName = await lookupFoodFromBarcode(barcode);
      
      // Auto-fill form
      setFormData(prev => ({
        ...prev,
        name: foodName
      }));
      
      // Close scanner
      stopCamera();
    } catch (error) {
      console.error('Barcode read error:', error);
      alert('Could not read barcode. Try again.');
    }
  }
};

async function lookupFoodFromBarcode(barcode) {
  // Call your barcode API here
  // Example using Open Food Facts API:
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();
    return data.product?.product_name || 'Unknown Product';
  } catch {
    return 'Unknown Product';
  }
}
```

---

## 🤖 Adding AI Features

### Integration with Gemini (like your ai-recipes.js)

```javascript
// In add-food.js, add a button:
const handleAiSuggest = async () => {
  const inventory = foods.map(f => f.name).join(', ');
  
  const response = await fetch('/api/ai-food-recipes', {
    method: 'POST',
    body: JSON.stringify({ inventory })
  });
  
  const suggestions = await response.json();
  // Display suggestions
};
```

### Create `pages/api/ai-food-recipes.js`:

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { inventory } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Based on these ingredients: ${inventory}, 
                   suggest 5 quick recipes I can make.
                   Format as JSON array with name, time, difficulty.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return res.status(200).json({ 
      success: true, 
      suggestions: JSON.parse(text) 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

---

## 📊 Adding Analytics

### Track Food Additions:

```javascript
// In add-food.js:
const handleAddFood = async (formData) => {
  try {
    // ... existing code ...
    
    // Track event
    if (window.gtag) {
      window.gtag('event', 'food_added', {
        category: formData.category,
        household_id: householdId,
        user_id: currentDinerName
      });
    }
    
    // ... rest of code ...
  } catch (err) {
    // ...
  }
};
```

---

## 🧪 Testing Strategy

### Unit Tests Example (Jest):

```javascript
// __tests__/FoodInventory.test.js

describe('FoodInventory', () => {
  test('getDaysUntilExpiry calculates correctly', () => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const days = getDaysUntilExpiry(tomorrowStr);
    expect(days).toBe(1);
  });
  
  test('getExpiryStatus returns correct status', () => {
    const today = new Date().toISOString().split('T')[0];
    const status = getExpiryStatus(today);
    expect(status.status).toBe('today');
  });
  
  test('filters foods by category', () => {
    const foods = [
      { id: '1', category: 'pantry', name: 'Rice' },
      { id: '2', category: 'fridge', name: 'Milk' }
    ];
    const filtered = foods.filter(f => f.category === 'pantry');
    expect(filtered).toHaveLength(1);
  });
});
```

### Integration Tests (Cypress):

```javascript
// cypress/e2e/food-inventory.cy.js

describe('Food Inventory System', () => {
  beforeEach(() => {
    cy.visit('/add-food');
  });
  
  it('adds a food item successfully', () => {
    cy.get('input[name="name"]').type('Broccoli');
    cy.contains('Fridge').click();
    cy.get('input[name="quantity"]').clear().type('2');
    cy.get('input[name="expiryDate"]').type('2026-02-15');
    cy.contains('Add Food').click();
    
    cy.contains('✅ Broccoli added successfully');
    cy.contains('Broccoli').should('be.visible');
  });
});
```

---

## 🚀 Performance Optimization

### Memoization:

```javascript
import { useMemo, useCallback } from 'react';

const FoodInventory = ({ foods }) => {
  // Memoize filtered/sorted foods
  const sortedFoods = useMemo(() => {
    return [...foods].sort((a, b) => {
      // ... sorting logic
    });
  }, [foods, sortBy, selectedCategory]);
  
  // Memoize callbacks
  const handleDelete = useCallback((id) => {
    onDelete(id);
  }, [onDelete]);
  
  return (
    // ...
  );
};
```

### Lazy Loading:

```javascript
import dynamic from 'next/dynamic';

// Lazy load camera component
const CameraScanner = dynamic(() => import('@/components/CameraScanner'), {
  loading: () => <div>Loading camera...</div>
});
```

---

## 🔒 Security Checklist

- [ ] Validate all inputs server-side
- [ ] Sanitize user input before display
- [ ] Implement Firebase security rules
- [ ] Use environment variables for API keys
- [ ] Rate limit API endpoints
- [ ] Check user authorization for household
- [ ] Log suspicious activities
- [ ] Use HTTPS only
- [ ] Implement CSRF protection
- [ ] Secure camera access with permissions

---

## 📈 Monitoring & Logging

```javascript
// Add to API routes:
console.log(`[${new Date().toISOString()}] ${req.method} /api/food`);
console.log('Query:', req.query);
console.log('User:', req.headers['user-agent']);

// Track errors:
if (!result.success) {
  console.error(`Error adding food: ${error.message}`, {
    household: householdId,
    timestamp: new Date()
  });
}
```

---

## 🎓 Code Style Guide

### Naming Conventions:
```javascript
// Components: PascalCase
AddFoodForm, FoodInventory

// Functions: camelCase
handleAddFood, getDaysUntilExpiry

// Constants: UPPER_CASE
CATEGORIES, DEFAULT_UNIT

// State variables: camelCase
formData, selectedCategory
```

### Comments:
```javascript
// Use // for single-line comments
// Explain the "why", not the "what"

/* Use /* */ for multi-line comments
   or important explanations */
```

---

## 🎯 Common Customizations Cheat Sheet

| Feature | Location | Change |
|---------|----------|--------|
| Colors | `globals.css` | Modify color palette |
| Categories | `AddFoodForm.js` | Add/remove CATEGORIES |
| Emoji | `FoodInventory.js` | Update emojiMap |
| Units | `AddFoodForm.js` | Add options in select |
| Expiry alerts | `FoodInventory.js` | Modify getExpiryStatus |
| API endpoint | `pages/api/food.js` | Change logic/validations |
| Page header | `pages/add-food.js` | Modify heading/text |
| Fonts | `globals.css` | Update @import font links |

---

## 📚 Useful Resources

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Next.js API Routes](https://nextjs.org/docs/api-routes)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [ZXing JS (Barcode)](https://github.com/zxing-js/library)

---

**Happy extending! 🚀**
