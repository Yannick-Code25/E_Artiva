// // ARTIVA/front_end/app/_layout.tsx
// import { Stack, SplashScreen } from "expo-router";
// import React, { useEffect } from "react";
// import { AuthProvider, useAuth } from "../context/AuthContext"; // Vérifie le chemin
// import { ActivityIndicator, View, StyleSheet, useColorScheme as useDeviceColorScheme } from "react-native";
// import { CartProvider } from "../context/CartContext";
// import { WishlistProvider } from "../context/WishlistContext"; // <<< AJOUTER L'IMPORT
// import { I18nextProvider } from 'react-i18next'; // <<< AJOUTER
// import i18n from '../i18n'; // <<< AJOUTER (adapte le chemin si ton i18n.ts est ailleurs)
// import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native'; // Thèmes de base de React Navigation

// // Empêche le splash screen de se masquer automatiquement au démarrage.
// SplashScreen.preventAutoHideAsync();

// function AppNavigationStack() { // Renommé en AppNavigationStack
//   const { isLoading, effectiveAppColorScheme } = useAuth(); 

//   // Détermine le thème React Navigation à utiliser
//   const navigationTheme = effectiveAppColorScheme === 'dark' ? DarkTheme : DefaultTheme; // <<< DÉFINITION ICI
//   useEffect(() => {
//       if (!isLoading) { // isLoading est maintenant le chargement global (auth + thème)
//         SplashScreen.hideAsync();
//         console.log("AppNavigationStack: Auth & Theme loading terminé, Splash Screen masqué. Thème effectif:", effectiveAppColorScheme);
//       } else {
//         console.log("AppNavigationStack: Auth ou Thème en chargement...");
//       }
//     }, [isLoading, effectiveAppColorScheme]);

//     if (isLoading) {
//       console.log("AppNavigationStack: Auth ou Thème en chargement...");
//       return null; 
//     }
//   }

//   function RootStackLayout() {
//     const { isLoading: isAuthLoading } = useAuth(); // isLoading de AuthContext

//     useEffect(() => {
//       // Cacher le splash screen seulement quand AuthContext a fini de déterminer l'état d'auth.
//       if (!isAuthLoading) {
//         SplashScreen.hideAsync();
//         console.log(
//           "RootStackLayout: Auth loading terminé, Splash Screen masqué."
//         );
//       } else {
//         console.log(
//           "RootStackLayout: Auth encore en chargement, Splash Screen visible."
//         );
//       }
//     }, [isAuthLoading]);

//     // Pendant que AuthContext charge (isLoading est true), le splash screen natif reste visible.
//     // On ne rend rien ici pour éviter de "flasher" un loader avant que la redirection (via app/index.tsx) ne se fasse.
//     if (isAuthLoading) {
//       return null;
//     }

//     // Une fois le chargement terminé, Expo Router (via app/index.tsx)
//     // redirigera vers /login ou /(tabs) basé sur userToken.
//     // Le <Stack> ici définit juste les écrans de premier niveau disponibles.
//     return (
//         <ThemeProvider value={navigationTheme}> {/* Applique le thème au navigateur Stack */}
//           <Stack screenOptions={{ animation: 'slide_from_right' }}>
//             <Stack.Screen name="index" options={{ headerShown: false }} /> 
//             <Stack.Screen name="login" options={{ headerShown: false }} />
//             <Stack.Screen name="register" options={{ headerShown: false }} />
//             <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//             <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Information' }} />
            
//             {/* La section 'settings' a son propre _layout.tsx, donc headerShown: false ici */}
//             <Stack.Screen name="settings" options={{ headerShown: false }} /> 
            
//             {/* Ces routes sont des enfants de 'settings' ou des routes autonomes.
//                 Leurs titres peuvent être définis ici ou dans leur propre composant via <Stack.Screen options... /> */}
//             <Stack.Screen name="change-password" options={{ title: 'Changer Mot de Passe' }} /> 
//             <Stack.Screen name="notifications" options={{ title: 'Mes Notifications' }} />
//             <Stack.Screen name="category-products/[categoryId]" options={{ title: 'Produits de la Catégorie' }} />
//             <Stack.Screen name="product/[id]" options={{ title: 'Détail du Produit' }} />
//             {/* Ajoute ici d'autres Stack.Screen pour les routes de premier niveau si nécessaire */}
//           </Stack>
//         </ThemeProvider>
//       );
//   }

// // Le composant RootLayout qui enveloppe l'application avec tous les providers
// export default function RootLayout() {
//   return (
//      <AuthProvider>
//       <CartProvider>
//         <WishlistProvider>
//           <I18nextProvider i18n={i18n}> 
//             <AppNavigationStack /> 
//           </I18nextProvider>
//         </WishlistProvider>
//       </CartProvider>
//     </AuthProvider>
//   );
// }




// ARTIVA/front_end/app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext'; // Vérifie le chemin
import { CartProvider } from '../context/CartContext';         // Vérifie le chemin
import { WishlistProvider } from '../context/WishlistContext';   // Vérifie le chemin
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n'; // Vérifie le chemin (doit pointer vers ton fichier i18n.ts)

// Importer les thèmes de React Navigation pour le ThemeProvider
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

// Empêche le splash screen de se masquer automatiquement au démarrage.
// Nous le masquerons manuellement une fois l'authentification et le thème chargés.
SplashScreen.preventAutoHideAsync();

// Ce composant interne gère l'affichage du Stack Navigator
// et la logique liée au masquage du splash screen et à l'application du thème.
function AppNavigationStack() {
  // Récupère l'état de chargement global (auth + thème) et le thème effectif depuis AuthContext
  const { isLoading, effectiveAppColorScheme } = useAuth(); 

  // Détermine le thème React Navigation (clair ou sombre) à appliquer
  const navigationTheme = effectiveAppColorScheme === 'dark' ? DarkTheme : DefaultTheme;
  
  useEffect(() => {
    // Masquer le splash screen une fois que isLoading (de AuthContext) est false
    if (!isLoading) { 
      SplashScreen.hideAsync();
      console.log("AppNavigationStack: Chargement Auth & Thème terminé, Splash Screen masqué. Thème effectif:", effectiveAppColorScheme);
    } else {
      console.log("AppNavigationStack: Chargement Auth ou Thème en cours...");
    }
  }, [isLoading, effectiveAppColorScheme]); // Se redéclenche si isLoading ou le thème effectif change

  // Pendant que AuthContext charge (isLoading est true), le splash screen natif reste visible.
  // Retourner null ici évite un "flash" d'un écran vide ou d'un loader avant la redirection initiale.
  if (isLoading) {
    return null; 
  }

  // Une fois le chargement terminé, Expo Router (via app/index.tsx qui utilise AuthContext)
  // aura déjà décidé de rediriger vers /login ou /(tabs) basé sur userToken.
  // Le <Stack> ici définit les écrans de premier niveau disponibles pour la navigation.
  return (
    <ThemeProvider value={navigationTheme}> 
      <Stack screenOptions={{ 
          animation: 'slide_from_right', // Animation de transition par défaut
          // Tu peux ajouter d'autres screenOptions globales ici si besoin
          // Par exemple, pour styliser tous les en-têtes de la même manière s'ils étaient visibles.
          // headerStyle: { backgroundColor: navigationTheme.colors.card },
          // headerTintColor: navigationTheme.colors.text,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} /> 
        
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Information' }} />
        
         <Stack.Screen name="settings" options={{ headerShown: false }} /> 
        
        <Stack.Screen name="notifications" options={{ title: 'Mes Notifications' }} />
        <Stack.Screen name="category-products/[categoryId]" options={{ title: 'Produits par Catégorie' }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Détail du Produit' }} />
        <Stack.Screen name="checkout" options={{ title: 'Validation Commande', presentation: 'modal' }} />
        <Stack.Screen name="tag/[tag]" options={{ title: 'Produits par Tag' }} />
        <Stack.Screen name="orders/[orderId]" options={{ title: 'Détails Commande' }} />
      </Stack>
    </ThemeProvider>
  );
}

// Le composant RootLayout qui enveloppe toute l'application avec tous les providers nécessaires
export default function RootLayout() {
  return (
     <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <I18nextProvider i18n={i18n}> 
            <AppNavigationStack /> 
          </I18nextProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
