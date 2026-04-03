import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addItem = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQty = (itemId, qty) => {
    if (qty <= 0) { removeItem(itemId); return; }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalCalories = cart.reduce((s, i) => s + i.calories * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, totalItems, totalAmount, totalCalories }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
