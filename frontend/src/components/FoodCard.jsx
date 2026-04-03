import React from "react";
import { Plus, Minus, Flame, Zap } from "lucide-react";
import { useCart } from "../contexts/CartContext";

const calorieBadge = (calories) => {
  if (calories < 400) return { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Healthy" };
  if (calories < 700) return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Moderate" };
  return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Indulgent" };
};

const tagColors = {
  "Vegan": "bg-green-50 text-green-700",
  "High Protein": "bg-blue-50 text-blue-700",
  "Low Calorie": "bg-emerald-50 text-emerald-700",
  "Balanced": "bg-orange-50 text-orange-700",
  "Keto Friendly": "bg-purple-50 text-purple-700",
  "Gluten Free": "bg-yellow-50 text-yellow-700",
};

export default function FoodCard({ item, recommended = false }) {
  const { cart, addItem, removeItem, updateQty } = useCart();
  const inCart = cart.find(i => i.id === item.id);
  const badge = calorieBadge(item.calories);

  return (
    <div
      data-testid={`food-card-${item.id}`}
      className={`bg-white rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        recommended ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/20" : "border-gray-100"
      }`}
    >
      {/* Image */}
      <div className="relative overflow-hidden h-44">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80"; }}
        />
        {recommended && (
          <div className="absolute top-3 left-3 bg-[#FF6B35] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Zap size={10} /> Recommended
          </div>
        )}
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
          {badge.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1" style={{ fontFamily: "Outfit, sans-serif" }} data-testid={`food-name-${item.id}`}>
          {item.name}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{item.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags?.slice(0, 2).map(tag => (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[tag] || "bg-gray-100 text-gray-600"}`}>
              {tag}
            </span>
          ))}
        </div>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-1 mb-4 bg-gray-50 rounded-2xl p-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5">
              <Flame size={10} className="text-orange-400" />
              <span className="text-xs font-bold text-gray-800">{item.calories}</span>
            </div>
            <div className="text-[10px] text-gray-400">kcal</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-blue-600">{item.protein}g</div>
            <div className="text-[10px] text-gray-400">protein</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-amber-600">{item.carbs}g</div>
            <div className="text-[10px] text-gray-400">carbs</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-purple-600">{item.fat}g</div>
            <div className="text-[10px] text-gray-400">fat</div>
          </div>
        </div>

        {/* Price + Cart */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>₹{item.price}</span>
          {!inCart ? (
            <button
              data-testid={`add-to-cart-${item.id}`}
              onClick={() => addItem(item)}
              className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#E85D2A] text-white text-sm font-semibold px-4 py-2 rounded-full transition-all active:scale-95"
            >
              <Plus size={14} /> Add
            </button>
          ) : (
            <div className="flex items-center gap-2" data-testid={`cart-controls-${item.id}`}>
              <button
                onClick={() => updateQty(item.id, inCart.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                data-testid={`decrease-qty-${item.id}`}
              >
                <Minus size={14} />
              </button>
              <span className="font-bold text-gray-900 w-4 text-center" data-testid={`qty-${item.id}`}>{inCart.quantity}</span>
              <button
                onClick={() => updateQty(item.id, inCart.quantity + 1)}
                className="w-8 h-8 rounded-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white flex items-center justify-center transition-colors"
                data-testid={`increase-qty-${item.id}`}
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
