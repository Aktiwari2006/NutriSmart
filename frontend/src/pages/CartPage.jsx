import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Flame } from "lucide-react";

export default function CartPage() {
  const { cart, removeItem, updateQty, totalAmount, totalCalories, clearCart, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4" style={{ fontFamily: "Manrope, sans-serif" }}>
      <ShoppingCart size={64} className="text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Your cart is empty</h2>
      <p className="text-gray-400 mb-6">Add some delicious, healthy items from the menu!</p>
      <button
        data-testid="go-to-menu-btn"
        onClick={() => navigate("/menu")}
        className="bg-[#FF6B35] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#E85D2A] transition-colors"
      >
        Browse Menu
      </button>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Your Cart</h1>
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1" data-testid="clear-cart-btn">
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {cart.map(item => (
            <div key={item.id} data-testid={`cart-item-${item.id}`} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80"; }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>{item.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Flame size={10} className="text-orange-400" /> {item.calories} kcal each
                </div>
                <div className="text-[#FF6B35] font-bold text-sm mt-1">₹{item.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  data-testid={`cart-decrease-${item.id}`}
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold w-5 text-center text-sm" data-testid={`cart-qty-${item.id}`}>{item.quantity}</span>
                <button
                  data-testid={`cart-increase-${item.id}`}
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white flex items-center justify-center transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right">
                <div className="font-black text-gray-900">₹{(item.price * item.quantity)}</div>
                <button
                  data-testid={`cart-remove-${item.id}`}
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 mt-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100" data-testid="order-summary">
          <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Order Summary</h2>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{totalItems} item(s)</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> Total Calories</span>
              <span className="font-medium">{totalCalories} kcal</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Fee</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-lg">
              <span>Total</span>
              <span data-testid="cart-total">₹{totalAmount}</span>
            </div>
          </div>
          <button
            data-testid="proceed-checkout-btn"
            onClick={() => navigate("/checkout")}
            className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-lg"
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate("/menu")}
            className="w-full mt-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 rounded-2xl transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
