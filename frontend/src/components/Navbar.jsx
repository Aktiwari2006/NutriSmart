import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, ChefHat } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/menu" : "/"} className="flex items-center gap-2" data-testid="navbar-logo">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">NS</span>
            </div>
            <span className="font-black text-xl text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Nutri<span className="text-[#FF6B35]">Smart</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/menu" className={`font-medium transition-colors text-sm ${isActive("/menu") ? "text-[#FF6B35]" : "text-gray-600 hover:text-[#FF6B35]"}`} data-testid="nav-menu">Menu</Link>
              <Link to="/dashboard" className={`font-medium transition-colors text-sm ${isActive("/dashboard") ? "text-[#FF6B35]" : "text-gray-600 hover:text-[#FF6B35]"}`} data-testid="nav-dashboard">Dashboard</Link>
              {user.role === "admin" && (
                <Link to="/admin" className={`font-medium transition-colors text-sm ${isActive("/admin") ? "text-[#FF6B35]" : "text-gray-600 hover:text-[#FF6B35]"}`} data-testid="nav-admin">Admin</Link>
              )}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" data-testid="nav-cart">
                  <ShoppingCart size={20} className="text-gray-700" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FF6B35] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold" data-testid="cart-count">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                    <div className="w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name?.split(" ")[0]}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" data-testid="logout-btn">
                    <LogOut size={18} />
                  </button>
                </div>
                <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} data-testid="mobile-menu-toggle">
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors" data-testid="nav-login">Login</Link>
                <Link to="/signup" className="text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#E85D2A] px-4 py-2 rounded-full transition-colors" data-testid="nav-signup">Get Started</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && user && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-2">
            <Link to="/menu" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <ChefHat size={16} /> Menu
            </Link>
            <Link to="/dashboard" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            {user.role === "admin" && (
              <Link to="/admin" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                <User size={16} /> Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 text-left">
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
