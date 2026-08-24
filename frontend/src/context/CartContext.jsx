import { useState, useEffect } from 'react';
import { CartContext } from './CartContextObject';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedTrolleyItems = localStorage.getItem('scrub_point_trolley');
      return savedTrolleyItems ? JSON.parse(savedTrolleyItems) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('scrub_point_trolley', JSON.stringify(cart));
    } catch (e) {
      console.error("Local Storage sync boundary exception error:", e);
    }
  }, [cart]);

  const addToCart = (incomingItemPayload) => {
    setCart((prevCart) => {
      const itemSize = incomingItemPayload.size || 'uni';
      const itemColor = incomingItemPayload.color || 'uni';
      const generatedCartKey = `${incomingItemPayload.id}-${itemSize}-${itemColor}`;

      const existingItemIndex = prevCart.findIndex(
        (item) => String(item.cart_key || item.id) === generatedCartKey
      );

      if (existingItemIndex > -1) {
        return prevCart.map((item, idx) =>
          idx === existingItemIndex
            ? { ...item, quantity: item.quantity + (incomingItemPayload.quantity || 1) }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            ...incomingItemPayload,
            cart_key: generatedCartKey
          }
        ];
      }
    });
  };

  const removeFromCart = (uniqueCartKeyOrId) => {
    setCart((prevCart) => {
      return prevCart.filter((item) => {
        const itemKey = String(item.cart_key || item.id || '');
        const targetKey = String(uniqueCartKeyOrId || '');
        return itemKey !== targetKey;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
