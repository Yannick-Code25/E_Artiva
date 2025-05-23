// ARTIVA/front_end/app/index.tsx
import { Redirect, SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Vérifie le chemin
import { ActivityIndicator, View } from 'react-native';

// SplashScreen.preventAutoHideAsync(); // Peut aussi être appelé ici si c'est le premier point d'entrée JS

export default function StartPage() {
  const { userToken, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    // Cache le splash screen une fois que l'état d'auth est déterminé
    if (!isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [isAuthLoading]);

  if (isAuthLoading) {
    // Pendant que AuthContext charge, on ne fait rien, le splash screen (géré dans _layout ou ici) est visible
    console.log("StartPage (index.tsx): Auth loading...");
    return null; // ou <ActivityIndicator />
  }

  console.log("StartPage (index.tsx): Auth loaded. Token:", userToken ? "Present" : "Absent");
  if (userToken) {
    console.log("StartPage (index.tsx): Token présent, redirection vers (tabs)");
    return <Redirect href="/(tabs)"  />;
  } else {
    console.log("StartPage (index.tsx): Pas de token, redirection vers login");
    return <Redirect href="/login" />;
  }
}