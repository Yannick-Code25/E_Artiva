// ARTIVA/front_end/app/_layout.tsx
import { Stack, SplashScreen } from "expo-router";
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext"; // Vérifie le chemin
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext"; // <<< AJOUTER L'IMPORT

// Empêche le splash screen de se masquer automatiquement au démarrage.
SplashScreen.preventAutoHideAsync();

function RootStackLayout() {
  const { isLoading: isAuthLoading } = useAuth(); // isLoading de AuthContext

  useEffect(() => {
    // Cacher le splash screen seulement quand AuthContext a fini de déterminer l'état d'auth.
    if (!isAuthLoading) {
      SplashScreen.hideAsync();
      console.log(
        "RootStackLayout: Auth loading terminé, Splash Screen masqué."
      );
    } else {
      console.log(
        "RootStackLayout: Auth encore en chargement, Splash Screen visible."
      );
    }
  }, [isAuthLoading]);

  // Pendant que AuthContext charge (isLoading est true), le splash screen natif reste visible.
  // On ne rend rien ici pour éviter de "flasher" un loader avant que la redirection (via app/index.tsx) ne se fasse.
  if (isAuthLoading) {
    return null;
  }

  // Une fois le chargement terminé, Expo Router (via app/index.tsx)
  // redirigera vers /login ou /(tabs) basé sur userToken.
  // Le <Stack> ici définit juste les écrans de premier niveau disponibles.
  return (
    <Stack screenOptions={{ animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      {/* <Stack.Screen name="forgot-password" options={{ title: 'Mot de passe oublié' }} /> */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Information" }}
      />
      <Stack.Screen
        name="checkout"
        options={{ title: "Finaliser la Commande", presentation: "modal" }}
      />
      {/* Expo Router gère automatiquement les routes comme "product/[id]" même si non listées ici */}
      {/* Cependant, pour configurer des options d'en-tête pour cette route, on l'ajouterait : */}
      <Stack.Screen
        name="product/[id]"
        options={{ title: "Détail du Produit" }}
      />
      <Stack.Screen
        name="category-products/[categoryId]"
        options={{ title: "Produits" }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: "Mes Notifications" }}
      />
      <Stack.Screen
        name="settings" // Ceci fait référence au dossier app/settings et à son _layout.tsx
        options={{
          headerShown: false, // Car app/settings/_layout.tsx gère son propre Stack avec en-têtes
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <RootStackLayout />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
