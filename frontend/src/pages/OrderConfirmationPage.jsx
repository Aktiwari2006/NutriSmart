import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle, Clock, MapPin, Receipt, Flame, ArrowRight } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction_id, total, totalCalories } = location.state || {};
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      axios.get(`${API}/orders/${orderId}`, { withCredentials: true })
        .then(r => setOrder(r.data))
        .catch(console.error);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Success Header */}
        <div className="text-center mb-8" data-testid="order-success">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Order Confirmed!</h1>
          <p className="text-gray-500">Your food is being prepared. Enjoy your healthy meal!</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-4">
          {/* Transaction Info */}
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={14} className="text-green-600" />
              <span className="text-xs font-bold text-green-700">Payment Successful</span>
            </div>
            {transaction_id && (
              <div className="text-xs text-gray-600" data-testid="transaction-id">
                Transaction ID: <span className="font-mono font-bold">{transaction_id}</span>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} className="text-[#FF6B35]" />
              <span>Estimated delivery: <strong>30–45 minutes</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-[#FF6B35]" />
              <span>{order?.delivery_address || "Your delivery address"}</span>
            </div>
            {totalCalories && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Flame size={14} className="text-orange-400" />
                <span>Total calories: <strong>{totalCalories} kcal</strong></span>
              </div>
            )}
          </div>

          {/* Items */}
          {order?.items?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Order Items</h3>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total Paid</span>
                <span data-testid="confirmed-total">₹{order?.total_amount || total}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              data-testid="track-order-btn"
              onClick={() => navigate("/dashboard")}
              className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              View in Dashboard <ArrowRight size={16} />
            </button>
            <button
              data-testid="order-again-btn"
              onClick={() => navigate("/menu")}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 rounded-2xl transition-colors"
            >
              Order Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
