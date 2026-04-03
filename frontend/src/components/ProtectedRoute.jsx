import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/menu" replace />;
  return children;
}
