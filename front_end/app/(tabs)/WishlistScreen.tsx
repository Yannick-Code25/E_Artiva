// ARTIVA/front_end/app/(tabs)/WishlistScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Button, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, Href } from 'expo-router';
import { useWishlist, WishlistItem } from '../../context/WishlistContext'; // Importer WishlistItem
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

export default function TabWishlistScreen() {
  const { wishlistItems, removeFromWishlist, isLoadingWishlist, fetchWishlist } = useWishlist();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const cardColor = Colors[colorScheme ?? 'light'].card;
  const subtleTextColor = Colors[colorScheme ?? 'light'].tabIconDefault;


  const handleProductPress = (productId: string | number) => {
    const path = `/product/${String(productId)}` as Href;
    router.push(path);
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity style={[styles.itemContainer, {backgroundColor: cardColor}]} onPress={() => handleProductPress(item.id)}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, {color: textColor}]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.itemPrice, {color: tintColor}]}>{item.price}</Text> 
        {/* Tu pourrais afficher d'autres infos ici si besoin */}
      </View>
      <TouchableOpacity onPress={() => removeFromWishlist(item.id)} style={styles.removeItemButton}>
        <FontAwesome name="trash-o" size={24} color="#EF4444" /> 
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Afficher un loader pendant le chargement initial de la wishlist
  if (isLoadingWishlist && wishlistItems.length === 0) { // Loader seulement si la liste est vide et qu'on charge
    return (
      <View style={[styles.centered, {backgroundColor}]}>
        <ActivityIndicator size="large" color={tintColor}/>
        <Text style={{marginTop: 10, color: textColor}}>Chargement de votre liste de souhaits...</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.screenContainer, {backgroundColor}]}>
      <Stack.Screen options={{ title: 'Listes de Souhaits', headerShown: false }} />

      {/* En-tête personnalisé (similaire à CartScreen) */}
      <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        {router.canGoBack() && ( // Bouton retour si applicable (peu probable pour un onglet racine)
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={24} color={tintColor} />
          </TouchableOpacity>
        )}
        <Text style={[styles.customHeaderTitle, { color: textColor }]}>Ma Liste de Souhaits</Text>
        <View style={{width: router.canGoBack() ? 40 : 0}} /> 
      </View>
      
      {wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="heart-o" size={80} color={subtleTextColor} />
          <Text style={[styles.emptyText, {color: textColor}]}>Votre liste de souhaits est vide.</Text>
          <Text style={[styles.emptySubText, {color: subtleTextColor}]}>Ajoutez des articles qui vous plaisent !</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/' as any)} style={[styles.shopButton, {backgroundColor: tintColor}]}>
            <Text style={styles.shopButtonText}>Découvrir les produits</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchWishlist} // Permet de rafraîchir la wishlist
          refreshing={isLoadingWishlist} // Affiche l'indicateur de rafraîchissement
        />
      )}
    </View>
  );
}

// Styles (tu peux t'inspirer de CartScreen.styles et les adapter)
const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, },
  backButton: { padding: 5, width: 40, alignItems: 'flex-start',},
  customHeaderTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1,},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10, textAlign: 'center' },
  emptySubText: { fontSize: 15, marginBottom: 30, textAlign: 'center' },
  shopButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2 },
  shopButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  listContainer: { padding: 10 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 10, borderRadius: 8, elevation: 1, shadowOpacity:0.05, borderWidth:1, borderColor: '#eee' },
  itemImage: { width: 70, height: 70, borderRadius: 6, marginRight: 12, backgroundColor: '#e0e0e0' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: 'bold' },
  removeItemButton: { padding: 10, marginLeft: 'auto' }, // Pour pousser le bouton à droite
});