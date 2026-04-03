import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, ShoppingBag, Flame, Target, Clock, CheckCircle, ChevronRight, Edit, Mail, X, Info } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function getBMIColor(bmi) {
  if (!bmi) return "text-gray-500";
  if (bmi < 18.5) return "text-blue-600";
  if (bmi < 25) return "text-green-600";
  if (bmi < 30) return "text-yellow-600";
  return "text-red-600";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportSending, setReportSending] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [emailPreview, setEmailPreview] = useState(null);

  useEffect(() => {
    axios.get(`${API}/orders`, { withCredentials: true })
      .then(r => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sendWeeklyReport = async () => {
    setReportSending(true);
    setReportMsg("");
    try {
      const { data } = await axios.post(`${API}/email/weekly-report`, {}, { withCredentials: true });
      if (data.sent) {
        setReportMsg("Report sent to your email!");
        setTimeout(() => setReportMsg(""), 6000);
      } else {
        setEmailPreview({ html: data.preview_html, week_label: data.week_label, type: "report" });
      }
    } catch (err) {
      setReportMsg(err.response?.data?.detail || "Failed to send report");
      setTimeout(() => setReportMsg(""), 6000);
    } finally {
      setReportSending(false);
    }
  };

  const bmi = user?.bmi_data;
  const totalCalories = orders.slice(0, 7).reduce((s, o) => s + (o.items?.reduce((a, i) => a + (i.calories * i.quantity), 0) || 0), 0);
  const totalSpent = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0);

  const chartData = orders.slice(0, 7).reverse().map((o, i) => ({
    name: `Order ${i + 1}`,
    calories: o.items?.reduce((a, item) => a + (item.calories * item.quantity), 0) || 0,
    amount: o.total_amount,
  }));

  return (
    <div className="bg-gray-50 min-h-screen pb-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Hello, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-gray-500">Here's your health & order summary</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              data-testid="email-weekly-report-btn"
              onClick={sendWeeklyReport}
              disabled={reportSending}
              className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-medium px-4 py-2 rounded-full transition-colors text-sm disabled:opacity-60"
            >
              {reportSending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Mail size={14} />}
              Email Weekly Report
            </button>
            <button
              data-testid="edit-bmi-btn"
              onClick={() => navigate("/bmi-setup")}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-full hover:bg-gray-50 transition-colors text-sm"
            >
              <Edit size={14} /> Update Profile
            </button>
          </div>
          {reportMsg && (
            <div className={`w-full text-sm px-4 py-2 rounded-2xl ${reportMsg.includes("sent") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`} data-testid="report-msg">
              {reportMsg}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* BMI Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 col-span-2 lg:col-span-1" data-testid="bmi-card">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-[#FF6B35]" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your BMI</span>
            </div>
            {bmi ? (
              <>
                <div className={`text-4xl font-black mb-1 ${getBMIColor(bmi.bmi)}`} style={{ fontFamily: "Outfit, sans-serif" }}>{bmi.bmi}</div>
                <div className={`text-sm font-semibold capitalize ${getBMIColor(bmi.bmi)}`}>{bmi.category}</div>
                <div className="text-xs text-gray-400 mt-1">Goal: {bmi.goal}</div>
              </>
            ) : (
              <div>
                <div className="text-2xl font-black text-gray-300 mb-1">--</div>
                <button onClick={() => navigate("/bmi-setup")} className="text-xs text-[#FF6B35] font-semibold">Set up now →</button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100" data-testid="orders-count">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={16} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Orders</span>
            </div>
            <div className="text-4xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>{orders.length}</div>
            <div className="text-xs text-gray-400 mt-1">All time</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100" data-testid="calories-card">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-orange-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Calories (7 orders)</span>
            </div>
            <div className="text-4xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>{totalCalories.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">kcal consumed</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100" data-testid="spent-card">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-green-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Spent</span>
            </div>
            <div className="text-4xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>₹{totalSpent}</div>
            <div className="text-xs text-gray-400 mt-1">All paid orders</div>
          </div>
        </div>

        {/* Charts + Orders */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calorie Chart */}
          {chartData.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100" data-testid="calorie-chart">
              <h2 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Calorie Intake (Recent Orders)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.calories < 400 ? "#10B981" : entry.calories < 700 ? "#F59E0B" : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Health Summary */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Health Summary</h2>
            {bmi ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Height</span>
                  <span className="font-semibold">{bmi.height} cm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Weight</span>
                  <span className="font-semibold">{bmi.weight} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">BMI</span>
                  <span className={`font-bold ${getBMIColor(bmi.bmi)}`}>{bmi.bmi}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-semibold capitalize">{bmi.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Goal</span>
                  <span className="font-semibold capitalize">{bmi.goal}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => navigate("/menu")} className="w-full text-center text-sm text-[#FF6B35] font-semibold flex items-center justify-center gap-1">
                    View Recommendations <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-3">Complete your health profile</p>
                <button onClick={() => navigate("/bmi-setup")} className="bg-[#FF6B35] text-white text-sm font-semibold px-4 py-2 rounded-full">Setup BMI</button>
              </div>
            )}
          </div>
        </div>

        {/* Order History */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100" data-testid="order-history">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Order History</h2>
            <span className="text-xs text-gray-400">{orders.length} orders</span>
          </div>
          {loading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No orders yet. Start ordering healthy food!</p>
              <button onClick={() => navigate("/menu")} className="mt-3 bg-[#FF6B35] text-white text-sm font-semibold px-4 py-2 rounded-full">Browse Menu</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map(order => (
                <div key={order.id} data-testid={`order-${order.id}`} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <ShoppingBag size={16} className="text-[#FF6B35]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {order.items?.length} item(s) • ₹{order.total_amount}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Preview Modal */}
      {emailPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" data-testid="dashboard-email-preview">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Mail size={18} className="text-[#FF6B35]" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Weekly Nutrition Report Preview
                  </h2>
                  <p className="text-xs text-gray-400">{emailPreview.week_label} · auto-sent every Sunday 8 AM IST</p>
                </div>
              </div>
              <button onClick={() => setEmailPreview(null)} className="p-2 rounded-full hover:bg-gray-100" data-testid="close-report-preview">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-center gap-2">
              <Info size={13} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Demo mode:</strong> With a verified domain on Resend, this sends to every user's inbox automatically on Sunday mornings.
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              <iframe srcDoc={emailPreview.html} title="Report Preview" className="w-full border-0" style={{ minHeight: "560px" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
