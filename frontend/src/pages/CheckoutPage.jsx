import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import axios from "axios";
import { MapPin, ArrowRight, Flame } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

export default function CheckoutPage() {
  const { cart, totalAmount, totalCalories, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState("123 Health Street, Mumbai, Maharashtra 400001");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (cart.length === 0 && !orderPlaced) { navigate("/menu"); return null; }

  const handleOrder = async () => {
    setError("");
    setLoading(true);
    try {
      const items = cart.map(i => ({
        item_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        calories: i.calories,
      }));
      const { data } = await axios.post(`${API}/orders`, {
        items,
        total_amount: totalAmount,
        delivery_address: address,
        payment_method: "mock",
      }, { withCredentials: true });

      // Mock Payment
      const payData = await axios.post(`${API}/payment/mock`, {
        order_id: data.order_id,
        amount: totalAmount,
      }, { withCredentials: true });

      setOrderPlaced(true);
      navigate(`/order-confirmation/${data.order_id}`, { state: { transaction_id: payData.data.transaction_id, total: totalAmount, totalCalories } });
      clearCart();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Checkout</h1>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Delivery & Payment */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                <MapPin size={18} className="text-[#FF6B35]" /> Delivery Address
              </h2>
              <textarea
                data-testid="delivery-address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] resize-none"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Payment Method</h2>
              <div className="flex items-center gap-3 bg-orange-50 border-2 border-[#FF6B35] rounded-xl p-4" data-testid="payment-method-mock">
                <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-bold text-sm">MC</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Mock Payment (Demo)</div>
                  <div className="text-xs text-gray-400">Instant payment simulation – perfect for demo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-32">
              <h2 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Your Order</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1">{item.name} × {item.quantity}</span>
                    <span className="font-medium ml-2">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> Total Calories</span>
                  <span>{totalCalories} kcal</span>
                </div>
                <div className="flex justify-between font-black text-gray-900 text-lg">
                  <span>Total</span>
                  <span data-testid="checkout-total">₹{totalAmount}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl mb-3">{error}</div>
              )}

              <button
                data-testid="place-order-btn"
                onClick={handleOrder}
                disabled={loading}
                className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Pay ₹{totalAmount} <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
