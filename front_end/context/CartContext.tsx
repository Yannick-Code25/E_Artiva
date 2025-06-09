// ARTIVA/front_end/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product as BaseProductType } from "../components/ProductCard"; // Type de base du produit
import { useAuth } from "./AuthContext"; // Pour le token et l'état d'authentification
import { Alert } from "react-native"; // Pour les messages d'erreur à l'utilisateur

// **ATTENTION: REMPLACE 'VOTRE_ADRESSE_IP_LOCALE' PAR TON IP RÉELLE**
const API_BASE_URL = "http://192.168.1.2:3001/api"; // Exemple, mets la tienne

// Interface pour un article dans le panier
export interface CartItem extends BaseProductType {
  quantity: number;
  cartItemId?: string | number; // ID de l'item DANS la table cart_items du backend
}

// Interface pour la valeur du contexte du panier
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: BaseProductType, quantity?: number) => Promise<void>;
  removeFromCart: (identifier: string | number) => Promise<void>; // Peut être productId (local) ou cartItemId (API)
  updateQuantity: (
    identifier: string | number,
    newQuantity: number
  ) => Promise<void>; // Idem
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoadingCart: boolean; // Pour le chargement initial et les opérations API
  fetchCartFromServer: () => Promise<void>; // Pour forcer un re-fetch depuis le serveur
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error(
      "useCart must be used within an AuthProvider and CartProvider"
    );
  }
  return context;
}

const GUEST_CART_STORAGE_KEY = "artiva-guest-cart-items"; // Clé pour le panier invité

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const { userToken, user } = useAuth(); // Récupérer le token et l'objet utilisateur

  // Fonction pour charger le panier (depuis API si connecté, sinon AsyncStorage)
  const fetchCartFromServer = useCallback(async () => {
    if (!userToken) {
      // Si pas de token/user, on ne fait rien ici (le useEffect pour invité gérera)
      console.log("CartContext: Pas de token, fetchCartFromServer annulé.");
      setIsLoadingCart(false); // Important de le mettre à false pour les invités
      return;
    }

    console.log("CartContext: Tentative de fetchCartFromServer...");
    console.log(
      "CartContext: Utilisateur connecté, chargement du panier depuis l'API..."
    );
    setIsLoadingCart(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.message || "Erreur chargement panier API");
      }
      const data = await response.json(); // Attend { cartId, items: [], totalAmount, totalItems }

      // L'API /cart renvoie des items avec productId, name, price, imageUrl, stock, ET cartItemId
      const adaptedItems = (data.items || []).map((item: any) => ({
        ...item, // Contient cartItemId, quantity, name, stock, etc.
        id: String(item.productId), // 'id' est l'ID du produit
        price: item.price ? String(item.price) : "N/A", // S'assurer que le prix est une chaîne
        imageUrl:
          item.imageUrl ||
          `https://via.placeholder.com/80?text=${encodeURIComponent(
            item.name || "Img"
          )}`,
      }));
      setCartItems(adaptedItems);
      await AsyncStorage.removeItem(GUEST_CART_STORAGE_KEY); // Vider le panier invité local après chargement serveur
      console.log(
        "CartContext: Panier chargé depuis API:",
        adaptedItems.length,
        "items."
      );
    } catch (e: any) {
      console.error("CartContext: Erreur dans fetchCartFromServer", e.message);
      Alert.alert(
        "Erreur Panier",
        "Impossible de synchroniser votre panier avec le serveur."
      );
      // Optionnel: charger le panier local comme fallback ? Ou laisser vide ?
      setCartItems([]);
    } finally {
      setIsLoadingCart(false);
    }
  }, [userToken, user]); // Dépend de userToken et user

  // Charger le panier au montage initial et lorsque userToken change
  useEffect(() => {
    const initialLoad = async () => {
      if (userToken && user) {
        await fetchCartFromServer();
      } else {
        // Utilisateur non connecté
        console.log(
          "CartContext: Utilisateur non connecté, chargement depuis AsyncStorage."
        );
        setIsLoadingCart(true);
        try {
          const storedCart = await AsyncStorage.getItem(GUEST_CART_STORAGE_KEY);
          if (storedCart) {
            setCartItems(JSON.parse(storedCart));
          } else {
            setCartItems([]);
          }
        } catch (e) {
          console.error(
            "CartContext: Erreur chargement panier invité AsyncStorage",
            e
          );
          setCartItems([]);
        } finally {
          setIsLoadingCart(false);
        }
      }
    };
    initialLoad();
  }, [userToken, user, fetchCartFromServer]); // fetchCartFromServer est maintenant une dépendance

  // Sauvegarder le panier dans AsyncStorage SEULEMENT si l'utilisateur n'est PAS connecté
  useEffect(() => {
    if (!userToken && !isLoadingCart) {
      // Après le chargement initial
      console.log(
        "CartContext: Utilisateur non connecté, sauvegarde du panier invité dans AsyncStorage."
      );
      AsyncStorage.setItem(
        GUEST_CART_STORAGE_KEY,
        JSON.stringify(cartItems)
      ).catch((e) =>
        console.error(
          "CartContext: Erreur sauvegarde panier invité AsyncStorage",
          e
        )
      );
    }
  }, [cartItems, userToken, isLoadingCart]);

  const addToCart = async (
    product: BaseProductType,
    quantityToAdd: number = 1
  ) => {
    console.log(
      "CartContext: addToCart pour produit ID:",
      product.id,
      "Quantité:",
      quantityToAdd
    );
    if (
      product.stock !== undefined &&
      product.stock <= 0 &&
      quantityToAdd > 0
    ) {
      Alert.alert("Stock épuisé", "Ce produit n'est plus disponible en stock.");
      return;
    }

    if (userToken && user) {
      setIsLoadingCart(true);
      try {
        const existingItem = cartItems.find(
          (item) => String(item.id) === String(product.id)
        );
        const newQuantity = existingItem
          ? existingItem.quantity + quantityToAdd
          : quantityToAdd;

        if (product.stock !== undefined && newQuantity > product.stock) {
          Alert.alert(
            "Stock insuffisant",
            `Vous ne pouvez pas ajouter plus de ${product.stock} unités de ce produit.`
          );
          setIsLoadingCart(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: newQuantity,
          }), // Envoyer la quantité totale
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
          throw new Error(
            errorData.message || "Erreur API ajout/MAJ au panier"
          );
        }
        await fetchCartFromServer(); // Re-synchroniser avec le serveur
      } catch (e: any) {
        console.error("CartContext: Erreur API addToCart", e.message);
        Alert.alert(
          "Erreur Panier",
          e.message || "Impossible d'ajouter l'article au panier."
        );
      } finally {
        setIsLoadingCart(false);
      }
    } else {
      // Utilisateur non connecté
      setCartItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) => String(item.id) === String(product.id)
        );
        if (existingItemIndex > -1) {
          const updatedItems = [...prevItems];
          const newQuantity = Math.min(
            updatedItems[existingItemIndex].quantity + quantityToAdd,
            product.stock || Infinity
          );
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: newQuantity,
          };
          return updatedItems;
        } else {
          const newItem: CartItem = {
            ...product,
            id: String(product.id),
            quantity: Math.min(quantityToAdd, product.stock || Infinity),
            // imageUrl est déjà dans product, price aussi (devrait être formaté)
          };
          return [...prevItems, newItem];
        }
      });
    }
  };

  const updateQuantity = async (
    productId: string | number,
    newQuantity: number
  ) => {
    console.log(
      `CartContext: updateQuantity pour ID Produit: ${productId}, nouvelle qté: ${newQuantity}`
    );
    const stringProductId = String(productId);
    const itemInCart = cartItems.find(
      (item) => String(item.id) === stringProductId
    );
    if (!itemInCart) return; // Ne devrait pas arriver si l'UI est correcte

    if (itemInCart.stock !== undefined && newQuantity > itemInCart.stock) {
      Alert.alert(
        "Stock insuffisant",
        `Il ne reste que ${itemInCart.stock} unités pour ${itemInCart.name}.`
      );
      // Ne pas mettre à jour la quantité au-delà du stock
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === stringProductId
            ? { ...item, quantity: itemInCart.stock || 1 }
            : item
        )
      );
      return;
    }

    if (userToken && user) {
      if (newQuantity <= 0) {
        // Si la qté est 0 ou moins, on supprime l'item
        await removeFromCart(itemInCart.cartItemId || stringProductId); // Utilise cartItemId si dispo
      } else {
        setIsLoadingCart(true);
        try {
          // Notre API /cart/items (POST) gère l'ajout ou la mise à jour
          const response = await fetch(`${API_BASE_URL}/cart/items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
              productId: stringProductId,
              quantity: newQuantity,
            }),
          });
          if (!response.ok) throw new Error("Erreur API MàJ qté");
          await fetchCartFromServer();
        } catch (e: any) {
          console.error("CartContext: Erreur API updateQuantity", e.message);
          Alert.alert(
            "Erreur Panier",
            e.message || "Impossible de mettre à jour la quantité."
          );
        } finally {
          setIsLoadingCart(false);
        }
      }
    } else {
      // Non connecté
      setCartItems((prevItems) => {
        if (newQuantity <= 0) {
          return prevItems.filter(
            (item) => String(item.id) !== stringProductId
          );
        }
        return prevItems.map((item) =>
          String(item.id) === stringProductId
            ? {
                ...item,
                quantity: Math.min(newQuantity, item.stock || Infinity),
              }
            : item
        );
      });
    }
  };

  const removeFromCart = async (identifier: string | number) => {
    // 'identifier' peut être productId (local) ou cartItemId (API)
    console.log(
      `CartContext: removeFromCart pour ID/cartItemID: ${identifier}`
    );
    if (userToken && user) {
      const itemToRemove = cartItems.find(
        (item) =>
          String(item.cartItemId) === String(identifier) ||
          String(item.id) === String(identifier)
      );
      const cartItemIdToRemove = itemToRemove?.cartItemId;

      if (!cartItemIdToRemove) {
        console.warn(
          "CartContext: cartItemId manquant pour suppression API, suppression locale uniquement."
        );
        setCartItems((prev) =>
          prev.filter((i) => String(i.id) !== String(identifier))
        );
        return;
      }
      setIsLoadingCart(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/cart/items/${cartItemIdToRemove}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );
        if (!response.ok) throw new Error("Erreur API suppression item");
        await fetchCartFromServer();
      } catch (e: any) {
        console.error("CartContext: Erreur API removeFromCart", e.message);
        Alert.alert(
          "Erreur Panier",
          e.message || "Impossible de supprimer l'article."
        );
      } finally {
        setIsLoadingCart(false);
      }
    } else {
      // Non connecté
      setCartItems((prevItems) =>
        prevItems.filter((item) => String(item.id) !== String(identifier))
      );
    }
  };

  const clearCart = async () => {
    /* ... (logique similaire à removeFromCart pour tous les items, ou appel à API DELETE /cart) ... */
    console.log("CartContext: clearCart appelé");
    if (userToken && user) {
      setIsLoadingCart(true);
      try {
        const response = await fetch(`${API_BASE_URL}/cart/clear`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (!response.ok) throw new Error("Erreur API vider panier");
        setCartItems([]);
      } catch (e: any) {
        console.error("CartContext: Erreur API clearCart", e.message);
        Alert.alert(
          "Erreur Panier",
          e.message || "Impossible de vider le panier."
        );
      } finally {
        setIsLoadingCart(false);
      }
    } else {
      setCartItems([]);
    }
  };

  const getTotalItems = (): number =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = (): number => {
    return parseFloat(
      cartItems
        .reduce((sum, item) => {
          const priceString = String(item.price).replace(/[^\d.-]/g, "");
          const priceNum = parseFloat(priceString);
          return sum + (isNaN(priceNum) ? 0 : priceNum * item.quantity);
        }, 0)
        .toFixed(2)
    );
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
    fetchCartFromServer: fetchCartFromServer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// function initialLoad() {
//   throw new Error('Function not implemented.');
// }
