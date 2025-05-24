// ARTIVA/front_end/app/index.tsx
import { Redirect, SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Vérifie le chemin
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function StartPage() {
  const { userToken, isLoading: isAuthLoading } = useAuth();

  // Note: Le masquage du SplashScreen est maintenant géré dans app/_layout.tsx
  // pour s'assurer qu'il est masqué une seule fois quand l'auth est prête.

  if (isAuthLoading) {
    // Pendant que AuthContext charge, _layout gère le splash.
    // On peut retourner null ici ou un loader si on veut un double niveau.
    // Pour la simplicité, on s'appuie sur _layout.
    console.log("StartPage (index.tsx): Auth en cours de chargement...");
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {/* Ce loader sera visible si _layout a déjà masqué le splash mais qu'on est encore ici */}
            <ActivityIndicator size="large" color="tomato"/>
        </View>
    );
  }

  console.log("StartPage (index.tsx): Auth chargé. Token:", userToken ? "Présent" : "Absent");
  if (userToken) {
    console.log("StartPage (index.tsx): Token présent, redirection vers (tabs)");
    return <Redirect href="/(tabs)" />;
  } else {
    console.log("StartPage (index.tsx): Pas de token, redirection vers login");
    return <Redirect href="/login" />;
  }
}