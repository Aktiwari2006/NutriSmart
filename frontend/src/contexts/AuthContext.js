import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API = process.env.REACT_APP_BACKEND_URL + "/api";

axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not auth, obj = auth

  useEffect(() => {
    axios.get(`${API}/auth/me`, { withCredentials: true })
      .then(r => setUser(r.data))
      .catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password }, { withCredentials: true });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  const updateBMI = async (height, weight, goal) => {
    const { data } = await axios.put(`${API}/profile/bmi`, { height, weight, goal }, { withCredentials: true });
    setUser(prev => ({ ...prev, bmi_data: data.bmi_data }));
    return data;
  };

  const demoLogin = () => login("demo@nutrismart.com", "123456");

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateBMI, demoLogin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
