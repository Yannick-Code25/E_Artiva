// ARTIVA/front_end/app/settings/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import Colors from '../../constants/Colors'; // Ajuste le chemin
import { useColorScheme } from '../../components/useColorScheme'; // Ajuste le chemin

export default function SettingsLayout() {
  const colorScheme = useColorScheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].card,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Retour', // Texte du bouton retour sur iOS
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mes Paramètres', headerShown: true }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Modifier le Profil' }} />
      <Stack.Screen name="change-password" options={{ title: 'Changer le Mot de Passe' }} />
      <Stack.Screen name="preferences" options={{ title: 'Préférences d\'Affichage' }} />
      {/* Ajoute d'autres écrans de paramètres ici si besoin */}
    </Stack>
  );
}