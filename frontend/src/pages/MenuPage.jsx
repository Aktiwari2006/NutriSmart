import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import axios from "axios";
import FoodCard from "../components/FoodCard";
import { Sparkles, Search, Filter, X, Activity } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "low_calorie", label: "Healthy" },
  { value: "balanced", label: "Balanced" },
  { value: "high_calorie", label: "Indulgent" },
];

export default function MenuPage() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [aiTip, setAiTip] = useState("");
  const [recReason, setRecReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, recRes] = await Promise.all([
          axios.get(`${API}/menu`, { withCredentials: true }),
          axios.get(`${API}/recommendations`, { withCredentials: true }),
        ]);
        setMenuItems(menuRes.data);
        setRecommendations(recRes.data.recommendations || []);
        setAiTip(recRes.data.ai_tip || "");
        setRecReason(recRes.data.reason || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !category || item.category === category;
    return matchSearch && matchCat;
  });

  const recIds = recommendations.map(r => r.id);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading your personalized menu...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-24" style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                data-testid="menu-search"
                type="text"
                placeholder="Search dishes, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
              />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-gray-400"><X size={14} /></button>}
            </div>
            <div className="flex gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  data-testid={`filter-${c.value || "all"}`}
                  onClick={() => setCategory(c.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === c.value ? "bg-[#FF6B35] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* BMI Profile Banner */}
        {!user?.bmi_data && (
          <div className="bg-gradient-to-r from-orange-500 to-red-400 rounded-3xl p-6 mb-8 text-white flex items-center justify-between flex-wrap gap-4" data-testid="bmi-banner">
            <div className="flex items-center gap-3">
              <Activity size={24} />
              <div>
                <div className="font-bold">Set up your health profile</div>
                <div className="text-sm text-orange-100">Get personalized meal recommendations based on your BMI</div>
              </div>
            </div>
            <button
              onClick={() => navigate("/bmi-setup")}
              className="bg-white text-[#FF6B35] font-bold px-5 py-2 rounded-full text-sm hover:bg-orange-50 transition-colors"
              data-testid="setup-bmi-btn"
            >
              Setup Now
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            data-testid="tab-recommendations"
            onClick={() => setActiveTab("recommendations")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === "recommendations" ? "bg-[#FF6B35] text-white shadow-md shadow-orange-200" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}
          >
            <Sparkles size={14} /> For You
          </button>
          <button
            data-testid="tab-all"
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === "all" ? "bg-[#FF6B35] text-white shadow-md shadow-orange-200" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}
          >
            Full Menu
          </button>
        </div>

        {/* Recommendations Tab */}
        {activeTab === "recommendations" && (
          <div data-testid="recommendations-section">
            {aiTip && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6 flex gap-3" data-testid="ai-tip">
                <Sparkles size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-green-700 mb-1">AI Nutrition Tip</div>
                  <p className="text-sm text-green-800">{aiTip}</p>
                </div>
              </div>
            )}
            {recReason && (
              <div className="mb-4">
                <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Recommended for You</h2>
                <p className="text-sm text-gray-500 mt-1">{recReason}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommendations.map(item => (
                <FoodCard key={item.id} item={item} recommended={true} />
              ))}
            </div>
            {recommendations.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Activity size={48} className="mx-auto mb-3 opacity-40" />
                <p>Set up your BMI profile to get personalized recommendations!</p>
              </div>
            )}
          </div>
        )}

        {/* Full Menu Tab */}
        {activeTab === "all" && (
          <div data-testid="full-menu-section">
            <div className="mb-4">
              <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                {category ? CATEGORIES.find(c => c.value === category)?.label : "All"} Items
                <span className="ml-2 text-base font-normal text-gray-400">({filteredItems.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredItems.map(item => (
                <FoodCard key={item.id} item={item} recommended={recIds.includes(item.id)} />
              ))}
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Search size={48} className="mx-auto mb-3 opacity-40" />
                <p>No items found. Try a different search or filter.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50" data-testid="floating-cart">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-3 bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-bold px-8 py-4 rounded-full shadow-2xl shadow-orange-300 transition-all active:scale-95"
          >
            <div className="bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black">{totalItems}</div>
            View Cart
          </button>
        </div>
      )}
    </div>
  );
}
