import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowRight, Activity, Target, Scale } from "lucide-react";

const GOALS = [
  { value: "lose", label: "Lose Weight", icon: "⬇️", desc: "Low calorie, high protein meals", color: "border-green-400 bg-green-50" },
  { value: "maintain", label: "Maintain Weight", icon: "⚖️", desc: "Balanced, nutritious meals", color: "border-blue-400 bg-blue-50" },
  { value: "gain", label: "Gain Weight", icon: "⬆️", desc: "Calorie-rich, protein-dense meals", color: "border-purple-400 bg-purple-50" },
];

function getBMIInfo(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600", bg: "bg-blue-50", tip: "Focus on calorie-rich, nutrient-dense foods" };
  if (bmi < 25) return { label: "Normal", color: "text-green-600", bg: "bg-green-50", tip: "Maintain your healthy weight with balanced meals" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-600", bg: "bg-yellow-50", tip: "Opt for low-calorie, high-fiber meals" };
  return { label: "Obese", color: "text-red-600", bg: "bg-red-50", tip: "Choose low-calorie, vegetable-rich options" };
}

export default function BMISetupPage() {
  const { updateBMI, user } = useAuth();
  const navigate = useNavigate();
  const [height, setHeight] = useState(user?.bmi_data?.height || "170");
  const [weight, setWeight] = useState(user?.bmi_data?.weight || "70");
  const [goal, setGoal] = useState(user?.bmi_data?.goal || "maintain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bmi = height && weight ? parseFloat((parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)) : null;
  const bmiInfo = bmi ? getBMIInfo(bmi) : null;

  const getBMIWidth = () => {
    if (!bmi) return "0%";
    const pct = Math.min(Math.max(((bmi - 10) / 30) * 100, 0), 100);
    return `${pct}%`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!height || !weight) { setError("Please enter both height and weight"); return; }
    setLoading(true);
    try {
      await updateBMI(parseFloat(height), parseFloat(weight), goal);
      navigate("/menu");
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Your Health Profile</h1>
          <p className="text-gray-500">We'll personalize your menu recommendations based on your BMI</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                  <Scale size={14} className="text-[#FF6B35]" /> Height (cm)
                </label>
                <input
                  data-testid="bmi-height"
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="170"
                  min="100" max="250"
                  required
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] text-center transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                  <Scale size={14} className="text-[#FF6B35]" /> Weight (kg)
                </label>
                <input
                  data-testid="bmi-weight"
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="70"
                  min="20" max="300"
                  required
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] text-center transition-all"
                />
              </div>
            </div>

            {/* BMI Preview */}
            {bmi && bmiInfo && (
              <div data-testid="bmi-result" className={`${bmiInfo.bg} rounded-2xl p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Your BMI</div>
                    <div className={`text-3xl font-black ${bmiInfo.color}`} style={{ fontFamily: "Outfit, sans-serif" }}>{bmi}</div>
                  </div>
                  <div className={`text-sm font-bold px-3 py-1.5 rounded-full bg-white ${bmiInfo.color}`}>{bmiInfo.label}</div>
                </div>
                <div className="h-2 bg-gradient-to-r from-blue-300 via-green-300 to-red-400 rounded-full relative mb-2">
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-700 shadow transition-all" style={{ left: getBMIWidth() }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-2">
                  <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                </div>
                <p className="text-xs text-gray-600">{bmiInfo.tip}</p>
              </div>
            )}

            {/* Goal Selection */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                <Target size={14} className="text-[#FF6B35]" /> Your Health Goal
              </label>
              <div className="grid grid-cols-3 gap-3">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    data-testid={`goal-${g.value}`}
                    onClick={() => setGoal(g.value)}
                    className={`rounded-2xl p-3 border-2 text-center transition-all ${goal === g.value ? g.color + " scale-[1.02]" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    <div className="text-2xl mb-1">{g.icon}</div>
                    <div className="text-xs font-bold text-gray-800">{g.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
            )}

            <button
              data-testid="bmi-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-lg"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>See My Personalized Menu <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
