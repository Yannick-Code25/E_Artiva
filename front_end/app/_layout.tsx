// ARTIVA/front_end/app/_layout.tsx
import { Stack, SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext'; // Vérifie le chemin

// Ce layout racine est maintenant très simple.
// Il fournit AuthProvider et ensuite rend le Stack Navigator.
// La logique de "quel écran afficher" sera gérée par AuthContext
// et la structure des fichiers (ex: app/index.tsx qui redirige vers login).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <SlotBasedRedirect />
    </AuthProvider>
  );
}

// Ce composant va maintenant contenir la logique de rendu du Stack
// et la gestion du splash screen, en utilisant useAuth.
function SlotBasedRedirect() {
  const { isLoading, userToken } = useAuth(); // isLoading de AuthContext

  useEffect(() => {
    // Cacher le splash screen seulement quand on sait si l'utilisateur est loggué ou non.
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Pendant que isLoading (de AuthContext) est vrai, le splash screen natif reste visible
  // (car on aura appelé SplashScreen.preventAutoHideAsync() au tout début de l'app si besoin)
  // Ou, si tu n'utilises pas preventAutoHideAsync, tu peux afficher un loader ici.
  if (isLoading) {
    // Retourner null ou un loader minimaliste.
    // Le splash screen natif devrait couvrir cela si preventAutoHideAsync a été appelé.
    // Si tu as appelé SplashScreen.preventAutoHideAsync() quelque part (par exemple dans App.js ou le point d'entrée de ton app),
    // alors ce 'null' est correct. Sinon, tu pourrais avoir un flash.
    return null; // Ou <ActivityIndicator />;
  }

  // Note: La redirection initiale (si pas de token -> /login, si token -> /(tabs))
  // est maintenant principalement gérée par la structure de l'app (app/index.tsx redirigeant vers /login)
  // et par l'useEffect dans AuthContext qui redirige si un token est présent et qu'on est sur une page auth.
  // Le <Slot /> ici va rendre la route actuelle déterminée par Expo Router.
  return (
    <Stack screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Information' }} />
    </Stack>
  );
}
