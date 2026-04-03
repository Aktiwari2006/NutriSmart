import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, ArrowRight, Zap } from "lucide-react";

function formatError(detail) {
  if (!detail) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail);
}

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") navigate("/admin");
      else if (!user.bmi_data) navigate("/bmi-setup");
      else navigate("/menu");
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError("");
    setLoading(true);
    try {
      await demoLogin();
      navigate("/menu");
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center px-4 py-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <span className="text-white font-black">NS</span>
            </div>
            <span className="font-black text-2xl text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>NutriSmart</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Welcome back</h2>
          <p className="text-gray-500">Sign in to your health journey</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {/* Demo Button */}
          <button
            data-testid="demo-login-btn"
            onClick={handleDemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-[#FF6B35] font-semibold py-3 px-4 rounded-2xl mb-6 border border-orange-200 transition-all"
          >
            <Zap size={16} /> Try Demo Account (Quick Access)
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  data-testid="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div data-testid="login-error" className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#FF6B35] font-semibold hover:underline" data-testid="go-to-signup">Sign up free</Link>
          </p>
        </div>

        <div className="text-center mt-4 text-xs text-gray-400">
          Demo: demo@nutrismart.com / 123456
        </div>
      </div>
    </div>
  );
}
