import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

const CATEGORIES = [
  { id: "pantry", label: "🗄️ Pantry" },
  { id: "fridge", label: "❄️ Fridge" },
  { id: "freezer", label: "🧊 Freezer" },
];

export default function AddFoodForm({ onSubmit, isLoading }) {
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);

  const [scanError, setScanError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "pantry",
    expiryDate: "",
    quantity: 1,
    unit: "piece",
    notes: "",
  });

  // ---------------- INPUT ----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 1 : value,
    }));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Please enter a food name");

    onSubmit(formData);

    setFormData({
      name: "",
      category: "pantry",
      expiryDate: "",
      quantity: 1,
      unit: "piece",
      notes: "",
    });
  };

  // ---------------- TODAY DATE ----------------
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  // determine pantry/fridge/freezer using product tags
  const guessCategory = (product) => {
    if (!product) return "pantry";
    const tags = (product.categories_tags || []).map(t => t.toLowerCase()).join(" ");
    const desc = (
      (product.generic_name || "") + " " +
      (product.labels || "") + " " +
      (product.brands || "")
    ).toLowerCase();
    const text = tags + " " + desc;
    if (/frozen|ice|ice\-cream|gelato/.test(text)) return "freezer";
    if (/refrigerated|dairy|milk|cheese|yogurt|butter|cream/.test(text)) return "fridge";
    return "pantry";
  };

  // calculate smart expiry date based on category
  const calculateExpiryDate = (category) => {
    const today = new Date();
    let daysToAdd = 7; // default pantry
    if (category === "freezer") daysToAdd = 180; // 6 months
    else if (category === "fridge") daysToAdd = 5;
    else if (category === "pantry") daysToAdd = 30;
    
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split("T")[0];
  };

  // ---------------- FETCH PRODUCT NAME ----------------
  const fetchFoodName = async (barcode) => {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await res.json();

      if (data.status === 1 && data.product?.product_name) {
        const category = guessCategory(data.product);
        setFormData((prev) => ({
          ...prev,
          name: data.product.product_name,
          category: category,
          expiryDate: calculateExpiryDate(category),
        }));
        setScanError("");
      } else {
        setScanError("Item not found. Enter name manually.");
      }
    } catch {
      setScanError("Network error. Try again.");
    }
  };

  // ---------------- START SCANNER ----------------
  const startScanner = async () => {
    setScanError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) return;

      const scanner = new Html5Qrcode("scanner");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.7,
        },
        async (decodedText) => {
          await stopScanner();
          await fetchFoodName(decodedText);
        }
      );
    } catch (err) {
      console.error(err);
      setScanError("Camera unavailable or permission denied.");
      setShowScanner(false);
    }
  };

  // ---------------- STOP SCANNER SAFELY ----------------
  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (err) {
      console.log("Stop error:", err);
    }

    scannerRef.current = null;
    setShowScanner(false);
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    if (showScanner) startScanner();

    return () => {
      stopScanner();
    };
  }, [showScanner]);

  // ---------------- UI ----------------
  return (
    <div className="w-full max-w-2xl mx-auto">
      {showScanner && (
        <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border-2 border-blue-200">
          <p className="text-center font-semibold mb-3">
            Point camera at barcode or QR code
          </p>

          <div id="scanner" className="w-full rounded-lg overflow-hidden" />

          {scanError && (
            <p className="text-red-500 text-sm mt-2">{scanError}</p>
          )}

          <button
            type="button"
            onClick={stopScanner}
            className="w-full mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            ✕ Cancel Scan
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl shadow-lg border-2 border-orange-200"
      >
        {/* show scan error above name */}
        {scanError && !showScanner && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {scanError}
          </div>
        )}

        {/* NAME */}
        <div>
          <label>Food Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => {
              handleInputChange(e);
              setScanError('');
            }}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* CATEGORY */}
        <div>
          <label>Category *</label>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, category: cat.id }))
                }
                className={`px-4 py-2 rounded ${
                  formData.category === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* QUANTITY */}
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
            <select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded"
            >
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

        {/* EXPIRY */}
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

        {/* NOTES */}
        <div>
          <label>Notes</label>
          <textarea
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* SCAN BUTTON */}
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          📷 Scan Code
        </button>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex justify-center gap-2"
        >
          <Plus size={22} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Adding..." : "Add Food"}
        </button>
      </form>
    </div>
  );
}