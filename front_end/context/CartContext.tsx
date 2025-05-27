// ARTIVA/front_end/context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Pour la persistance locale simple
import { Product } from '../components/ProductCard'; // Assure-toi que ce type est bien exporté et complet

// Type pour un article dans le panier
export interface CartItem extends Product { // Hérite des propriétés de Product
  quantity: number;
}

// Type pour la valeur du contexte du panier
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoadingCart: boolean; // Pour le chargement initial depuis AsyncStorage
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

const CART_STORAGE_KEY = 'artiva-cart-items';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true); // Pour le chargement initial

  // Charger le panier depuis AsyncStorage au montage
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          setCartItems(JSON.parse(storedCart));
        }
      } catch (e) {
        console.error("CartContext: Erreur chargement du panier depuis AsyncStorage", e);
      } finally {
        setIsLoadingCart(false);
      }
    };
    loadCart();
  }, []);

  // Sauvegarder le panier dans AsyncStorage à chaque modification
  useEffect(() => {
    // Ne pas sauvegarder pendant le chargement initial pour éviter d'écraser avec un tableau vide
    if (!isLoadingCart) { 
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
        .catch(e => console.error("CartContext: Erreur sauvegarde du panier dans AsyncStorage", e));
    }
  }, [cartItems, isLoadingCart]);

  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        // Augmenter la quantité si l'article existe déjà
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantityToAdd, product.stock || Infinity) } // Limiter par le stock
            : item
        );
      } else {
        // Ajouter le nouvel article
        // Assure-toi que ton type Product a bien tous les champs nécessaires pour CartItem
        return [...prevItems, { ...product, id: String(product.id), quantity: Math.min(quantityToAdd, product.stock || Infinity) }];
      }
    });
    console.log(`Produit ${product.name} ajouté/quantité mise à jour.`);
  };

  const removeFromCart = (productId: string | number) => {
    setCartItems(prevItems => prevItems.filter(item => String(item.id) !== String(productId)));
    console.log(`Produit ID ${productId} supprimé du panier.`);
  };

  const updateQuantity = (productId: string | number, newQuantity: number) => {
    setCartItems(prevItems => {
      if (newQuantity <= 0) {
        // Si la nouvelle quantité est 0 ou moins, supprimer l'article
        console.log(`Quantité <= 0 pour produit ID ${productId}, suppression de l'article.`);
        return prevItems.filter(item => String(item.id) !== String(productId));
      }
      // Sinon, mettre à jour la quantité, en respectant le stock
      return prevItems.map(item =>
        String(item.id) === String(productId)
          ? { ...item, quantity: Math.min(newQuantity, item.stock || Infinity) } 
          : item
      );
    });
    console.log(`Quantité mise à jour pour produit ID ${productId} à ${newQuantity}.`);
  };


  const clearCart = () => {
    setCartItems([]);
    console.log("Panier vidé.");
  };

  const getTotalItems = (): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return cartItems.reduce((total, item) => {
      // 'item.price' est une chaîne comme "99.99 FCFA". Il faut parser le nombre.
      const priceString = String(item.price).replace(/[^\d.-]/g, ''); // Garde chiffres, point, signe moins
      const priceNumber = parseFloat(priceString);
      return total + (isNaN(priceNumber) ? 0 : priceNumber * item.quantity);
    }, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isLoadingCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}