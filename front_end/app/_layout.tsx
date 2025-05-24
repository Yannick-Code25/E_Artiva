// ARTIVA/front_end/app/_layout.tsx
import { Stack, SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext'; // Vérifie le chemin
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Empêche le splash screen de se masquer automatiquement au démarrage.
SplashScreen.preventAutoHideAsync();

function RootStackLayout() {
  const { isLoading: isAuthLoading } = useAuth(); // isLoading de AuthContext

  useEffect(() => {
    // Cacher le splash screen seulement quand AuthContext a fini de déterminer l'état d'auth.
    if (!isAuthLoading) {
      SplashScreen.hideAsync();
      console.log("RootStackLayout: Auth loading terminé, Splash Screen masqué.");
    } else {
      console.log("RootStackLayout: Auth encore en chargement, Splash Screen visible.");
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
    <Stack screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} /> 
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      {/* <Stack.Screen name="forgot-password" options={{ title: 'Mot de passe oublié' }} /> */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Information' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootStackLayout />
    </AuthProvider>
  );
}