// front_end/app/(tabs)/_layout.tsx
import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, Redirect } from 'expo-router'; // Link et Pressable ne sont plus nécessaires si headerRight est commenté

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Pressable } from 'react-native';
import { useAuth } from '../../context/AuthContext';


function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userToken, isLoading: isAuthLoading } = useAuth(); // Récupérer le token et l'état de chargement


  // Si l'authentification est toujours en cours de vérification, ne rien rendre ou un loader
  // Cela évite un flash du contenu des onglets avant une potentielle redirection
  if (isAuthLoading) {
    // Normalement, _layout.tsx racine et index.tsx gèrent déjà le loader/splash.
    // Mais une sécurité ici peut être utile.
    return null; // Ou un <ActivityIndicator /> global pour les onglets
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à ce layout d'onglets,
  // le rediriger vers login. Normalement, app/index.tsx devrait déjà l'avoir fait.
  // C'est une double sécurité ou utile si l'utilisateur atterrit ici via un deep link.
  if (!userToken) {
    console.log("TabLayout: Pas de token, redirection vers /login depuis le layout des onglets.");
    return <Redirect href="/login" />;
  }

  // Si l'utilisateur est connecté, afficher les onglets

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index" // Correspond à app/(tabs)/index.tsx (Accueil)
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ShopScreen" // Doit correspondre au nom de fichier: ShopScreen.tsx
        options={{
          title: 'Boutique',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-bag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="TrendScreen" // Doit correspondre au nom de fichier: TrendScreen.tsx
        options={{
          title: 'Tendances',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="CartScreen" // Doit correspondre au nom de fichier: CartScreen.tsx
        options={{
          title: 'Panier',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileScreen" // Doit correspondre au nom de fichier: ProfileScreen.tsx
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

