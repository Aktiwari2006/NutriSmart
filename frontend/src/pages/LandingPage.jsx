import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowRight, Heart, Zap, BarChart3, Star, ChevronDown, CheckCircle } from "lucide-react";

const FEATURES = [
  { icon: "🥗", title: "Smart Recommendations", desc: "AI analyzes your BMI and goals to suggest the perfect meals" },
  { icon: "📊", title: "Nutritional Transparency", desc: "Calories, protein, carbs and fat displayed on every item" },
  { icon: "🎯", title: "Goal-Based Filtering", desc: "Weight loss, gain or maintenance — we filter the menu for you" },
  { icon: "🚀", title: "Seamless Ordering", desc: "Add to cart, checkout and pay — all in seconds" },
];

const STEPS = [
  { step: "01", title: "Sign Up & Set Goals", desc: "Create your profile and enter your height, weight, and health goal" },
  { step: "02", title: "Get Your BMI Score", desc: "We instantly calculate your BMI and classify your nutritional needs" },
  { step: "03", title: "Browse Personalized Menu", desc: "AI-filtered menu shows items perfect for your health profile" },
  { step: "04", title: "Order & Track", desc: "Place your order, pay securely and track your calorie intake" },
];

export default function LandingPage() {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await demoLogin();
      navigate("/menu");
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-green-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-[#FF6B35] text-sm font-semibold px-4 py-2 rounded-full mb-6">
                <Zap size={14} /> AI-Powered Health Ordering
              </div>
              <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                Eat Smart,<br />
                <span className="text-[#FF6B35]">Live Better</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                NutriSmart recommends restaurant meals based on your BMI and health goals. Every order is a step toward a healthier you.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/signup" data-testid="hero-get-started" className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-semibold px-8 py-4 rounded-full transition-all active:scale-95 shadow-lg shadow-orange-200">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <button
                  data-testid="hero-demo-login"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-4 rounded-full border-2 border-gray-200 transition-all active:scale-95"
                >
                  {loading ? "Loading..." : "Try Demo"}
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8">
                {["20+ Healthy Dishes", "AI Recommendations", "100% Free"].map(s => (
                  <div key={s} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CheckCircle size={14} className="text-green-500" /> {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/3756512/pexels-photo-3756512.jpeg?w=600&auto=compress&cs=tinysrgb"
                  alt="Healthy food"
                  className="w-full rounded-3xl object-cover h-96 shadow-2xl"
                />
                {/* Floating cards */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Heart size={18} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Today's Goal</div>
                    <div className="text-sm font-bold text-gray-900">1,800 kcal</div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Star size={18} className="text-[#FF6B35]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">BMI Score</div>
                    <div className="text-sm font-bold text-gray-900">22.5 – Normal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-[#FF6B35] mb-3">Why NutriSmart</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Smart Features for Smart Eating</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to make healthier food choices, personalized just for you.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-3xl p-6 hover:bg-orange-50 transition-colors group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-[#FF6B35] mb-3">How It Works</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>4 Simple Steps to Eating Right</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 relative">
                <div className="text-5xl font-black text-orange-100 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>{s.step}</div>
                <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                {i < 3 && <div className="hidden lg:block absolute top-10 -right-4 text-gray-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-[#FF6B35]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
            {[
              { label: "Menu Items", value: "20+" },
              { label: "BMI Categories", value: "3" },
              { label: "Health Goals", value: "3" },
              { label: "Nutritional Data Points", value: "5+" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-black mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
                <div className="text-orange-100 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-black text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Ready to Eat Smarter?</h2>
          <p className="text-gray-500 mb-8">Join thousands of health-conscious food lovers who order based on their nutrition needs.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/signup" data-testid="cta-signup" className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-semibold px-8 py-4 rounded-full transition-all">
              Start Free <ArrowRight size={18} />
            </Link>
            <button
              data-testid="cta-demo"
              onClick={handleDemoLogin}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-8 py-4 rounded-full transition-all"
            >
              {loading ? "Loading..." : "Try Demo Account"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-[#FF6B35] rounded-md flex items-center justify-center">
            <span className="text-white font-black text-xs">NS</span>
          </div>
          <span className="text-white font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>NutriSmart</span>
        </div>
        <p className="text-sm">Health-Based Restaurant Ordering • Built for a healthier tomorrow</p>
      </footer>
    </div>
  );
}
