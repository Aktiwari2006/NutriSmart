import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import BMISetupPage from "./pages/BMISetupPage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import "./App.css";

function Layout({ children, showNav = true }) {
  return (
    <div className="min-h-screen bg-white">
      {showNav && <Navbar />}
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Layout showNav={false}><LandingPage /></Layout>} />
            <Route path="/login" element={<Layout showNav={false}><LoginPage /></Layout>} />
            <Route path="/signup" element={<Layout showNav={false}><SignupPage /></Layout>} />

            {/* Protected */}
            <Route path="/bmi-setup" element={<ProtectedRoute><Layout><BMISetupPage /></Layout></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><Layout><MenuPage /></Layout></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Layout><CartPage /></Layout></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Layout><CheckoutPage /></Layout></ProtectedRoute>} />
            <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><Layout><OrderConfirmationPage /></Layout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
