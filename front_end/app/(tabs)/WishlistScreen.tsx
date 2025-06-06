// // ARTIVA/front_end/app/(tabs)/WishlistScreen.tsx
// import React, { useEffect  } from 'react';
// import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Button, ActivityIndicator, Platform } from 'react-native';
// import { Stack, useRouter, Href } from 'expo-router';
// import { useWishlist, WishlistItem } from '../../context/WishlistContext'; // Importer WishlistItem
// import { FontAwesome } from '@expo/vector-icons';
// import Colors from '../../constants/Colors';
// import { useColorScheme } from '../../components/useColorScheme';
// import { useAuth } from '../../context/AuthContext';


// export default function TabWishlistScreen() {
//   const { wishlistItems, removeFromWishlist, isLoadingWishlist, fetchWishlist } = useWishlist();
//   const { userToken, isLoading: isAuthLoading } = useAuth();
//   const router = useRouter();
//   const colorScheme = useColorScheme();
//   const tintColor = Colors[colorScheme ?? 'light'].tint;
//   const textColor = Colors[colorScheme ?? 'light'].text;
//   const backgroundColor = Colors[colorScheme ?? 'light'].background;
//   const cardColor = Colors[colorScheme ?? 'light'].card;
//   const subtleTextColor = Colors[colorScheme ?? 'light'].tabIconDefault;

// useEffect(() => {
//     // Attendre que le chargement initial de l'auth soit terminé
//     if (!isAuthLoading && !userToken) {
//       console.log("WishlistScreen: Utilisateur non connecté, redirection vers /login");
//       router.replace('/login' as Href); 
//     }
//   }, [isAuthLoading, userToken, router]);

  
//   const handleProductPress = (productId: string | number) => {
//     const path = `/product/${String(productId)}` as Href;
//     router.push(path);
//   };

//   const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
//     <TouchableOpacity style={[styles.itemContainer, {backgroundColor: cardColor}]} onPress={() => handleProductPress(item.id)}>
//       <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
//       <View style={styles.itemDetails}>
//         <Text style={[styles.itemName, {color: textColor}]} numberOfLines={2}>{item.name}</Text>
//         <Text style={[styles.itemPrice, {color: tintColor}]}>{item.price}</Text> 
//         {/* Tu pourrais afficher d'autres infos ici si besoin */}
//       </View>
//       <TouchableOpacity onPress={() => removeFromWishlist(item.id)} style={styles.removeItemButton}>
//         <FontAwesome name="trash-o" size={24} color="#EF4444" /> 
//       </TouchableOpacity>
//     </TouchableOpacity>
//   );
  

//   // Afficher un loader pendant le chargement initial de la wishlist
//   if (isAuthLoading || (!userToken && !isAuthLoading) || (isLoadingWishlist && wishlistItems.length === 0) ) { // Loader seulement si la liste est vide et qu'on charge
//     return (
//       <View style={[styles.centered, {backgroundColor}]}>
//         <ActivityIndicator size="large" color={tintColor}/>
//         <Text style={{marginTop: 10, color: textColor}}>Chargement de votre liste de souhaits...</Text>
//       </View>
//     );

//   }
  
//   return (
//     <View style={[styles.screenContainer, {backgroundColor}]}>
//       <Stack.Screen options={{ title: 'Listes de Souhaits', headerShown: false }} />

//       {/* En-tête personnalisé (similaire à CartScreen) */}
//       <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
//         {router.canGoBack() && ( // Bouton retour si applicable (peu probable pour un onglet racine)
//           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//             <FontAwesome name="arrow-left" size={24} color={tintColor} />
//           </TouchableOpacity>
//         )}
//         <Text style={[styles.customHeaderTitle, { color: textColor }]}>Ma Liste de Souhaits</Text>
//         <View style={{width: router.canGoBack() ? 40 : 0}} /> 
//       </View>
      
//       {wishlistItems.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <FontAwesome name="heart-o" size={80} color={subtleTextColor} />
//           <Text style={[styles.emptyText, {color: textColor}]}>Votre liste de souhaits est vide.</Text>
//           <Text style={[styles.emptySubText, {color: subtleTextColor}]}>Ajoutez des articles qui vous plaisent !</Text>
//           <TouchableOpacity onPress={() => router.push('/(tabs)/' as any)} style={[styles.shopButton, {backgroundColor: tintColor}]}>
//             <Text style={styles.shopButtonText}>Découvrir les produits</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={wishlistItems}
//           renderItem={renderWishlistItem}
//           keyExtractor={(item) => String(item.id)}
//           contentContainerStyle={styles.listContainer}
//           onRefresh={fetchWishlist} // Permet de rafraîchir la wishlist
//           refreshing={isLoadingWishlist} // Affiche l'indicateur de rafraîchissement
//         />
//       )}
//     </View>
//   );
// }

// // Styles (tu peux t'inspirer de CartScreen.styles et les adapter)
// const styles = StyleSheet.create({
//   screenContainer: { flex: 1 },
//   customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, },
//   backButton: { padding: 5, width: 40, alignItems: 'flex-start',},
//   customHeaderTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1,},
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   emptyText: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10, textAlign: 'center' },
//   emptySubText: { fontSize: 15, marginBottom: 30, textAlign: 'center' },
//   shopButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2 },
//   shopButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
//   listContainer: { padding: 10 },
//   itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 10, borderRadius: 8, elevation: 1, shadowOpacity:0.05, borderWidth:1, borderColor: '#eee' },
//   itemImage: { width: 70, height: 70, borderRadius: 6, marginRight: 12, backgroundColor: '#e0e0e0' },
//   itemDetails: { flex: 1 },
//   itemName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
//   itemPrice: { fontSize: 14, fontWeight: 'bold' },
//   removeItemButton: { padding: 10, marginLeft: 'auto' }, // Pour pousser le bouton à droite
// });




// ARTIVA/front_end/app/(tabs)/WishlistScreen.tsx
import React, { useEffect, useCallback, useState } from 'react'; // useState n'est plus utilisé directement ici pour les données
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Platform, Button, RefreshControl } from 'react-native';
import { Stack, useRouter, Href, Link } from 'expo-router'; // Link pour un bouton de connexion
import { useWishlist, WishlistItem } from '../../context/WishlistContext';
import { FontAwesome, Ionicons } from '@expo/vector-icons'; // Ionicons pour la flèche retour
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme'; // Ton hook custom
import { useAuth } from '../../context/AuthContext';

export default function TabWishlistScreen() {
  const { wishlistItems, removeFromWishlist, isLoadingWishlist, fetchWishlist } = useWishlist();
  const { userToken, isLoading: isAuthLoading } = useAuth(); // isLoading de AuthContext est important
  const router = useRouter();
  
  // Utiliser effectiveAppColorScheme de AuthContext pour le thème si disponible, sinon le thème de l'appareil
  // const deviceColorScheme = useColorScheme(); // Hook de react-native/expo
  // const currentScheme = effectiveAppColorScheme || deviceColorScheme || 'light';
  // Simplifions en utilisant directement useColorScheme (de react-native) si effectiveAppColorScheme n'est pas dans useAuth
  const colorScheme = useColorScheme(); // Hook fourni par Expo/React Native
  const currentScheme = colorScheme ?? 'light';

  const tintColor = Colors[currentScheme].tint;
  const textColor = Colors[currentScheme].text;
  const backgroundColor = Colors[currentScheme].background;
  const cardColor = Colors[currentScheme].card;
  const subtleTextColor = Colors[currentScheme].tabIconDefault;
  const borderColor = Colors[currentScheme].cardBorder;
  const [error, setError] = useState<string | null>(null); // <<< AJOUTE CETTE LIGNE


  // Recharger la wishlist lorsque l'écran obtient le focus ou que userToken change,
  // mais seulement si l'authentification initiale est terminée.
  useEffect(() => {
    if (!isAuthLoading && userToken) { // Attendre que l'auth soit chargée ET qu'il y ait un token
      console.log("WishlistScreen: userToken présent et auth chargée, appel de fetchWishlist.");
      fetchWishlist();
    } else if (!isAuthLoading && !userToken) {
      console.log("WishlistScreen: Utilisateur non connecté (après chargement auth), la wishlist restera vide ou locale.");
      // WishlistContext gère déjà le chargement depuis AsyncStorage si pas de token.
    }
  }, [userToken, isAuthLoading, fetchWishlist]); // Dépendances importantes


  const handleProductPress = (productId: string | number) => {
    const path = `/product/${String(productId)}` as Href;
    router.push(path);
  };

  const onRefresh = useCallback(() => {
    if (userToken) { // Rafraîchir seulement si l'utilisateur est connecté
      fetchWishlist();
    }
  }, [userToken, fetchWishlist]);


  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, {backgroundColor: cardColor, borderColor: borderColor}]} 
      onPress={() => handleProductPress(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, {color: textColor}]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.itemPrice, {color: tintColor}]}>{item.price}</Text> 
      </View>
      <TouchableOpacity onPress={() => removeFromWishlist(item.id)} style={styles.removeItemButton}>
        <FontAwesome name="trash-o" size={24} color="#EF4444" /> 
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  // 1. Gérer le chargement global de l'authentification
  if (isAuthLoading) {
    return (
      <View style={[styles.centered, {backgroundColor}]}>
        <ActivityIndicator size="large" color={tintColor}/>
      </View>
    );
  }

  // 2. Si l'utilisateur n'est pas connecté (après que isAuthLoading est false)
  if (!userToken) {
    return (
      <View style={[styles.screenContainer, {backgroundColor}]}>
        <Stack.Screen options={{ title: 'Liste de Souhaits', headerShown: false }} />
        <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: cardColor }]}>
          <Text style={[styles.customHeaderTitle, { color: textColor }]}>Ma Liste de Souhaits</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesome name="lock" size={60} color={subtleTextColor} />
          <Text style={[styles.emptyText, {color: textColor, marginTop: 20}]}>Connectez-vous pour voir votre liste de souhaits.</Text>
          <Text style={[styles.emptySubText, {color: subtleTextColor}]}>Sauvegardez les articles qui vous plaisent !</Text>
          <TouchableOpacity onPress={() => router.push('/login' as Href)} style={[styles.actionButton, {backgroundColor: tintColor}]}>
            <Text style={styles.actionButtonText}>Se connecter / S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Si connecté, mais la wishlist est en train de charger (pour la première fois ou refresh)
  if (isLoadingWishlist && wishlistItems.length === 0 && !error) {
    return (
      <View style={[styles.centered, {backgroundColor}]}>
        <ActivityIndicator size="large" color={tintColor}/>
        <Text style={{marginTop: 10, color: textColor}}>Chargement de votre liste de souhaits...</Text>
      </View>
    );
  }
  
  // 4. S'il y a une erreur de chargement de la wishlist (et qu'elle est vide)
  if (error && wishlistItems.length === 0) {
    return (
        <View style={[styles.screenContainer, {backgroundColor}]}>
            <Stack.Screen options={{ title: 'Erreur', headerShown: false }} />
            <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: cardColor }]}>
                <Text style={[styles.customHeaderTitle, { color: textColor }]}>Ma Liste de Souhaits</Text>
            </View>
            <View style={styles.centered}>
                <Text style={{color: Colors[currentScheme].errorText, marginBottom: 10, textAlign: 'center'}}>{error}</Text>
                <Button title="Réessayer" onPress={() => fetchWishlist()} color={tintColor}/>
            </View>
        </View>
    );
  }
  
  return (
    <View style={[styles.screenContainer, {backgroundColor}]}>
      <Stack.Screen options={{ title: 'Ma Liste de Souhaits', headerShown: false }} />

      <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: cardColor }]}>
        {router.canGoBack() && ( 
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={tintColor} />
          </TouchableOpacity>
        )}
        <Text style={[styles.customHeaderTitle, { color: textColor }]}>Ma Liste de Souhaits ({wishlistItems.length})</Text>
        {/* Espace pour équilibrer si le bouton retour est présent */}
        <View style={{width: router.canGoBack() ? 40 : 0}} /> 
      </View>
      
      {wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="heart-o" size={80} color={subtleTextColor} />
          <Text style={[styles.emptyText, {color: textColor}]}>Votre liste de souhaits est vide.</Text>
          <Text style={[styles.emptySubText, {color: subtleTextColor}]}>Appuyez sur le ❤️ sur les produits pour les ajouter.</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/' as Href)} style={[styles.shopButton, {backgroundColor: tintColor}]}>
            <Text style={styles.shopButtonText}>Explorer les produits</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => `wishlist-${String(item.id)}`} // Clé plus unique
          contentContainerStyle={styles.listContainer}
          refreshControl={ // Ajout du RefreshControl
            <RefreshControl
              refreshing={isLoadingWishlist && wishlistItems.length > 0} // Affiche seulement si on recharge une liste existante
              onRefresh={onRefresh}
              tintColor={tintColor}
            />
          }
        />
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 12: 15, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, },
  backButton: { paddingHorizontal: 5, }, // Zone de clic un peu plus grande
  customHeaderTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center', flex: 1,},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding:20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10, textAlign: 'center' },
  emptySubText: { fontSize: 15, marginBottom: 30, textAlign: 'center' },
  shopButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2, shadowOpacity: 0.1, shadowRadius: 3 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2, shadowOpacity: 0.1, shadowRadius: 3 }, // Style pour le bouton "Se connecter"
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  shopButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  listContainer: { padding: 10, },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, borderRadius: 10, elevation: 1.5, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, borderWidth:1, },
  itemImage: { width: 75, height: 75, borderRadius: 8, marginRight: 15, backgroundColor: '#e0e0e0' },
  itemDetails: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 5 },
  itemPrice: { fontSize: 14, fontWeight: 'bold' },
  removeItemButton: { padding: 10, marginLeft: 'auto' }, 
});