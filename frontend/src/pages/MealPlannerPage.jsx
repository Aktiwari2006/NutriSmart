import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import axios from "axios";
import {
  ChevronLeft, ChevronRight, Plus, X, Flame, ShoppingCart,
  Sparkles, Info, Calendar, Target
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Get Monday of the week containing a given date
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(date) {
  return date.toISOString().split("T")[0];
}

function getDailyBudget(bmiData) {
  if (!bmiData) return 1800;
  const { category, goal } = bmiData;
  if (goal === "lose" || category === "overweight") return 1500;
  if (goal === "gain" || category === "underweight") return 2200;
  return 1800;
}

function CalorieMeter({ consumed, budget }) {
  const pct = Math.min((consumed / budget) * 100, 100);
  const over = consumed > budget;
  const color = over ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-bold ${over ? "text-red-600" : "text-gray-700"}`}>
          {consumed} <span className="font-normal text-gray-400">/ {budget} kcal</span>
        </span>
        {over && <span className="text-red-500 font-semibold text-[10px]">Over budget!</span>}
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MealPlannerPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [plan, setPlan] = useState({});          // {monday: [...], ...}
  const [dailyBudget, setDailyBudget] = useState(() => getDailyBudget(user?.bmi_data));
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return DAYS[today === 0 ? 6 : today - 1]; // 0=Sun → 6
  });
  const [showModal, setShowModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [modalSearch, setModalSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const weekKey = toISODate(weekStart);

  // Get date for each day of the week
  const getDayDate = (dayIdx) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIdx);
    return d;
  };

  const isToday = (dayIdx) => {
    const d = getDayDate(dayIdx);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  // Fetch plan for current week
  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/meal-plan?week_start=${weekKey}`, { withCredentials: true });
      setPlan(data.plan || {});
      if (data.daily_budget) setDailyBudget(data.daily_budget);
    } catch (e) {
      console.error(e);
      setPlan({});
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  // Fetch menu items for modal
  useEffect(() => {
    axios.get(`${API}/menu`, { withCredentials: true })
      .then(r => setMenuItems(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const savePlan = async (updatedPlan, budget = dailyBudget) => {
    setSaving(true);
    try {
      await axios.put(`${API}/meal-plan`, {
        week_start: weekKey,
        daily_budget: budget,
        plan: updatedPlan,
      }, { withCredentials: true });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addItemToDay = async (item) => {
    const dayItems = plan[activeDay] || [];
    const newItem = {
      item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      price: item.price,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    };
    const updated = { ...plan, [activeDay]: [...dayItems, newItem] };
    setPlan(updated);
    setShowModal(false);
    setModalSearch("");
    await savePlan(updated);
  };

  const removeItemFromDay = async (day, idx) => {
    const dayItems = (plan[day] || []).filter((_, i) => i !== idx);
    const updated = { ...plan, [day]: dayItems };
    setPlan(updated);
    await savePlan(updated);
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToThisWeek = () => setWeekStart(getWeekStart());

  const orderTodaysPlan = () => {
    const items = plan[activeDay] || [];
    if (items.length === 0) return;
    items.forEach(item => {
      addItem({ ...item, id: item.item_id });
    });
    navigate("/cart");
  };

  const dayCalories = (day) => (plan[day] || []).reduce((s, i) => s + (i.calories || 0), 0);
  const dayPrice = (day) => (plan[day] || []).reduce((s, i) => s + (i.price || 0), 0);
  const weekCalories = DAYS.reduce((s, d) => s + dayCalories(d), 0);
  const weekSpend = DAYS.reduce((s, d) => s + dayPrice(d), 0);

  const filteredMenu = menuItems.filter(item =>
    !modalSearch || item.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
    item.tags?.some(t => t.toLowerCase().includes(modalSearch.toLowerCase()))
  );

  const activeDayIdx = DAYS.indexOf(activeDay);
  const activeDayItems = plan[activeDay] || [];
  const activeDayCal = dayCalories(activeDay);

  return (
    <div className="bg-gray-50 min-h-screen pb-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Week Nav */}
            <div className="flex items-center gap-3">
              <button onClick={prevWeek} className="p-2 rounded-full hover:bg-gray-100 transition-colors" data-testid="prev-week">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <div className="font-black text-gray-900 text-sm sm:text-base" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Week of {weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
                <div className="text-xs text-gray-400">
                  {getDayDate(0).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {getDayDate(6).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
              </div>
              <button onClick={nextWeek} className="p-2 rounded-full hover:bg-gray-100 transition-colors" data-testid="next-week">
                <ChevronRight size={18} />
              </button>
              <button onClick={goToThisWeek} className="text-xs text-[#FF6B35] font-semibold px-3 py-1 border border-[#FF6B35]/30 rounded-full hover:bg-orange-50 transition-colors" data-testid="this-week-btn">
                This Week
              </button>
            </div>

            {/* Budget control */}
            <div className="flex items-center gap-2">
              <Target size={14} className="text-[#FF6B35]" />
              <span className="text-xs text-gray-500 font-medium">Daily Budget:</span>
              <input
                data-testid="budget-input"
                type="number"
                value={dailyBudget}
                onChange={e => {
                  const b = parseInt(e.target.value) || 1800;
                  setDailyBudget(b);
                  savePlan(plan, b);
                }}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
              />
              <span className="text-xs text-gray-400">kcal/day</span>
            </div>

            {saving && <span className="text-xs text-gray-400">Saving...</span>}
            {saveMsg && <span className="text-xs text-green-600 font-semibold">{saveMsg}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Weekly Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 col-span-2" data-testid="weekly-summary">
            <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Flame size={12} className="text-orange-400" /> Weekly Calories Planned
            </div>
            <div className="text-2xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>{weekCalories.toLocaleString()} kcal</div>
            <div className="text-xs text-gray-400">{(weekCalories / 7).toFixed(0)} avg/day</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 mb-1">Planned Spend</div>
            <div className="text-2xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>₹{weekSpend}</div>
            <div className="text-xs text-gray-400">this week</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 mb-1">Days Planned</div>
            <div className="text-2xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              {DAYS.filter(d => (plan[d] || []).length > 0).length}/7
            </div>
            <div className="text-xs text-gray-400">days with meals</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Day Selector (left panel) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700" style={{ fontFamily: "Outfit, sans-serif" }}>Weekly Overview</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {DAYS.map((day, idx) => {
                  const cal = dayCalories(day);
                  const items = plan[day] || [];
                  const pct = Math.min((cal / dailyBudget) * 100, 100);
                  const barColor = cal > dailyBudget ? "bg-red-400" : cal > dailyBudget * 0.8 ? "bg-amber-400" : "bg-emerald-400";
                  return (
                    <button
                      key={day}
                      data-testid={`day-tab-${day}`}
                      onClick={() => setActiveDay(day)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-orange-50 transition-colors ${activeDay === day ? "bg-orange-50 border-l-4 border-[#FF6B35]" : "border-l-4 border-transparent"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-xs ${isToday(idx) ? "bg-[#FF6B35] text-white" : "bg-gray-100 text-gray-600"}`}>
                          <span className="font-bold text-[10px]">{DAY_LABELS[idx]}</span>
                          <span className="font-black text-sm leading-tight">{getDayDate(idx).getDate()}</span>
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${activeDay === day ? "text-[#FF6B35]" : "text-gray-800"}`}>{DAY_FULL[idx]}</div>
                          <div className="text-xs text-gray-400">{items.length} meal{items.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <div className={`text-xs font-bold ${cal > dailyBudget ? "text-red-500" : "text-gray-600"}`}>{cal > 0 ? `${cal}` : "--"}</div>
                        <div className="w-14 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Day Detail (right panel) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Day Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isToday(activeDayIdx) ? "bg-[#FF6B35] text-white" : "bg-gray-200 text-gray-700"}`}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {DAY_FULL[activeDayIdx]}
                      {isToday(activeDayIdx) && <span className="ml-2 text-xs bg-[#FF6B35] text-white px-2 py-0.5 rounded-full">Today</span>}
                    </h2>
                    <div className="text-xs text-gray-400">
                      {getDayDate(activeDayIdx).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeDayItems.length > 0 && (
                    <button
                      data-testid="order-today-btn"
                      onClick={orderTodaysPlan}
                      className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-semibold text-sm px-4 py-2 rounded-full transition-all active:scale-95"
                    >
                      <ShoppingCart size={14} /> Order These
                    </button>
                  )}
                </div>
              </div>

              {/* Calorie Meter */}
              {activeDayItems.length > 0 && (
                <div className="px-6 py-3 bg-white border-b border-gray-100">
                  <CalorieMeter consumed={activeDayCal} budget={dailyBudget} />
                </div>
              )}

              {/* Meals List */}
              <div className="p-4" data-testid={`day-meals-${activeDay}`}>
                {loading ? (
                  <div className="py-8 text-center"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                ) : activeDayItems.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar size={28} className="text-[#FF6B35] opacity-60" />
                    </div>
                    <p className="text-gray-500 text-sm mb-1">No meals planned for {DAY_FULL[activeDayIdx]}</p>
                    <p className="text-gray-400 text-xs">Add meals below to plan your day</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {activeDayItems.map((item, idx) => (
                      <div
                        key={idx}
                        data-testid={`plan-item-${activeDay}-${idx}`}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-orange-50 transition-colors group"
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          onError={e => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&auto=format"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>{item.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-0.5 text-xs text-orange-500 font-medium">
                              <Flame size={10} /> {item.calories} kcal
                            </span>
                            <span className="text-xs text-blue-600">P: {item.protein}g</span>
                            <span className="text-xs text-amber-600">C: {item.carbs}g</span>
                            <span className="text-xs text-purple-600">F: {item.fat}g</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="font-bold text-sm text-gray-900">₹{item.price}</span>
                          <button
                            data-testid={`remove-plan-item-${idx}`}
                            onClick={() => removeItemFromDay(activeDay, idx)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Day Totals */}
                {activeDayItems.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-sm font-black text-orange-500">{activeDayCal}</div>
                      <div className="text-[10px] text-gray-400">kcal</div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-blue-500">{activeDayItems.reduce((s, i) => s + (i.protein || 0), 0).toFixed(0)}g</div>
                      <div className="text-[10px] text-gray-400">protein</div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-amber-500">{activeDayItems.reduce((s, i) => s + (i.carbs || 0), 0).toFixed(0)}g</div>
                      <div className="text-[10px] text-gray-400">carbs</div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-700">₹{dayPrice(activeDay)}</div>
                      <div className="text-[10px] text-gray-400">spend</div>
                    </div>
                  </div>
                )}

                {/* Add Meal Button */}
                <button
                  data-testid="add-meal-btn"
                  onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#FF6B35] text-gray-400 hover:text-[#FF6B35] py-4 rounded-2xl transition-all font-medium text-sm"
                >
                  <Plus size={18} /> Add Meal to {DAY_FULL[activeDayIdx]}
                </button>
              </div>
            </div>

            {/* AI Tip based on day's plan */}
            {activeDayCal > 0 && user?.bmi_data && (
              <div className={`mt-4 rounded-2xl p-4 border flex gap-3 ${activeDayCal > dailyBudget ? "bg-red-50 border-red-200" : activeDayCal > dailyBudget * 0.9 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                <Info size={16} className={`flex-shrink-0 mt-0.5 ${activeDayCal > dailyBudget ? "text-red-500" : activeDayCal > dailyBudget * 0.9 ? "text-amber-500" : "text-emerald-500"}`} />
                <div className="text-xs">
                  <span className="font-bold">
                    {activeDayCal > dailyBudget
                      ? `Over budget by ${activeDayCal - dailyBudget} kcal.`
                      : activeDayCal > dailyBudget * 0.9
                      ? `Almost at your ${dailyBudget} kcal goal.`
                      : `You have ${dailyBudget - activeDayCal} kcal remaining today.`}
                  </span>
                  {activeDayCal < dailyBudget * 0.5 && " Consider adding a protein-rich snack to meet your nutritional goals."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" data-testid="add-meal-modal">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Add to {DAY_FULL[activeDayIdx]}
                </h2>
                <p className="text-xs text-gray-400">Select a meal to add to your plan</p>
              </div>
              <button onClick={() => { setShowModal(false); setModalSearch(""); }} className="p-2 rounded-full hover:bg-gray-100" data-testid="close-modal">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-100">
              <input
                data-testid="modal-search"
                type="text"
                placeholder="Search meals..."
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
                autoFocus
              />
            </div>

            {/* Items Grid */}
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMenu.map(item => {
                  const badge = item.calories < 400 ? { bg: "bg-emerald-100", text: "text-emerald-700" }
                    : item.calories < 700 ? { bg: "bg-amber-100", text: "text-amber-700" }
                    : { bg: "bg-red-100", text: "text-red-700" };
                  return (
                    <button
                      key={item.id}
                      data-testid={`modal-item-${item.id}`}
                      onClick={() => addItemToDay(item)}
                      className="flex items-center gap-3 bg-gray-50 hover:bg-orange-50 border border-transparent hover:border-[#FF6B35]/30 rounded-2xl p-3 text-left transition-all group"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&auto=format"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                            {item.calories} kcal
                          </span>
                          <span className="text-xs text-gray-500">₹{item.price}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-white group-hover:bg-[#FF6B35] border border-gray-200 group-hover:border-[#FF6B35] rounded-full flex items-center justify-center transition-all flex-shrink-0">
                        <Plus size={14} className="text-gray-400 group-hover:text-white" />
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredMenu.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No items found for "{modalSearch}"</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
