import { db } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  timestamp,
} from 'firebase/firestore';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get household ID from query - in a real app, this would be from auth context
  const { householdId } = req.query;
  const household = householdId || 'default-household';

  try {
    if (req.method === 'POST') {
      // Add new food item
      const { name, category, expiryDate, quantity, unit, notes, addedBy, addedDate } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const foodsRef = collection(db, `households/${household}/foods`);
      const newFood = {
        name,
        category,
        expiryDate: expiryDate || null,
        quantity: parseInt(quantity) || 1,
        unit: unit || 'piece',
        notes: notes || '',
        addedBy: addedBy || 'Unknown',
        addedDate: addedDate || new Date().toISOString(),
        createdAt: new Date(),
      };

      const docRef = await addDoc(foodsRef, newFood);

      return res.status(201).json({
        success: true,
        id: docRef.id,
        data: newFood,
      });
    } else if (req.method === 'GET') {
      // Get all food items
      const foodsRef = collection(db, `households/${household}/foods`);
      const q = query(foodsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const foods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, data: foods });
    } else if (req.method === 'DELETE') {
      // Delete food item
      const { foodId } = req.body;

      if (!foodId) {
        return res.status(400).json({ error: 'Food ID is required' });
      }

      const foodRef = doc(db, `households/${household}/foods/${foodId}`);
      await deleteDoc(foodRef);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in food API:', error);
    return res.status(500).json({ error: error.message });
  }
}
