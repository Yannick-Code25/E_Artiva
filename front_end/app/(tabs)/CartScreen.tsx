// ARTIVA/front_end/app/(tabs)/CartScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Button, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { useCart, CartItem } from '../../context/CartContext'; // Importer CartItem aussi
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useAuth } from '../../context/AuthContext'; //Verifie si le users est connecté

export default function TabCartScreen() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart, isLoadingCart } = useCart();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const subtleTextColor = Colors[colorScheme ?? 'light'].tabIconDefault

  const { userToken } = useAuth(); // Récupérer le token pour vérifier l'authentification

  const canGoBack = router.canGoBack(); // Vérifie si on peut revenir en arrière


  const handleCheckout = () => {
    if (!userToken) { // Vérifier si l'utilisateur est connecté
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour passer une commande.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se connecter", onPress: () => router.push('/login') } 
        ]
      );
      return;
    }
    if (cartItems.length === 0) {
        Alert.alert("Panier vide", "Votre panier est vide. Ajoutez des articles avant de passer à la caisse.");
        return;
    }
    // Naviguer vers l'écran de checkout
    router.push('/checkout'); 
  };

  const getItemSubtotal = (item: CartItem): number => {
    const priceString = String(item.price).replace(/[^\d.-]/g, '');
    const priceNumber = parseFloat(priceString);
    return isNaN(priceNumber) ? 0 : priceNumber * item.quantity;
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    console.log("Render CartItem:", item.name, "imageUrl:", item.imageUrl);
    return(
      <View style={[styles.itemContainer, {backgroundColor: Colors[colorScheme ?? 'light'].card}]}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, {color: textColor}]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.itemPrice, {color: tintColor}]}>{item.price}</Text> 
        <View style={styles.quantityControls}>
        <TouchableOpacity 
            onPress={() => updateQuantity(item.id, item.quantity - 1)} 
            style={[styles.controlButton, item.quantity <= 1 && styles.controlButtonDisabled]} // Style pour griser
            disabled={item.quantity <= 1} // Désactiver le bouton si quantité est 1
          >
            <FontAwesome name="minus" size={16} color={item.quantity <= 1 ? '#ccc' : tintColor} />
          </TouchableOpacity>
          <Text style={[styles.itemQuantity, {color: textColor}]}>{item.quantity}</Text>
          <TouchableOpacity 
            onPress={() => updateQuantity(item.id, item.quantity + 1)} 
            style={styles.controlButton}
            disabled={item.quantity >= (item.stock || Infinity)} // Désactiver si stock max atteint
          >
            <FontAwesome name="plus" size={16} color={item.quantity >= (item.stock || Infinity) ? '#ccc' : tintColor} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemSubtotalActions}>
        <Text style={[styles.itemSubtotal, {color: textColor}]}>
          {getItemSubtotal(item).toFixed(2)} FCFA
        </Text>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeItemButton}>
          <FontAwesome name="trash-o" size={24} color="#EF4444" /> 
        </TouchableOpacity>
      </View>
    </View>
  );
  }

  if (isLoadingCart) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={tintColor}/></View>
  }

  return (
    <View style={[styles.screenContainer, {backgroundColor}]}>
      <Stack.Screen options={{ title: `Panier (${getTotalItems()})`, headerShown: false }} />

      <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={tintColor} />
          </TouchableOpacity>
        )}
        <Text style={[styles.customHeaderTitle, { color: textColor }]}>Votre Panier</Text>
        <View style={{width: router.canGoBack() ? 40 : 0}} /> 
      </View>
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <FontAwesome name="shopping-basket" size={80} color={subtleTextColor} />
          <Text style={[styles.emptyCartText, {color: textColor}]}>Votre panier est vide.</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/' as any)} style={[styles.shopButton, {backgroundColor: tintColor}]}>
            <Text style={styles.shopButtonText}>Continuer vos achats</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={<View style={{height: 20}}/>} // Espace en bas de la liste
          />
          <View style={[styles.summaryContainer, {borderTopColor: subtleTextColor, backgroundColor: Colors[colorScheme ?? 'light'].card}]}>
            <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, {color: textColor}]}>Sous-total ({getTotalItems()} article(s)):</Text>
                <Text style={[styles.summaryAmount, {color: textColor}]}>{getTotalPrice().toFixed(2)} FCFA</Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, {color: textColor}]}>Frais de livraison :</Text>
                <Text style={[styles.summaryAmount, {color: textColor}]}>À calculer</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.summaryTotalText, {color: textColor}]}>Total :</Text>
                <Text style={[styles.summaryTotalAmount, {color: tintColor}]}>{getTotalPrice().toFixed(2)} FCFA</Text>
            </View>
            <TouchableOpacity style={[styles.checkoutButton, {backgroundColor: tintColor}]} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Valider et Payer</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, },
  backButton: { padding: 5, width: 40, alignItems: 'flex-start',},
  customHeaderTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1,},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCartContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyCartText: { fontSize: 18, marginTop: 20, marginBottom: 30, textAlign: 'center' },
  shopButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, },
  shopButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  listContainer: { paddingVertical: 10, paddingHorizontal: 10 },
  itemContainer: { flexDirection: 'row', padding: 10, marginBottom: 10, borderRadius: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, },
  itemImage: { width: 80, height: 80, borderRadius: 6, marginRight: 12, backgroundColor: '#e0e0e0' },
  itemDetails: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  controlButton: { padding: 8, borderWidth:1, borderRadius: 4, marginHorizontal: 5 },
  controlButtonDisabled: { borderColor: '#e0e0e0' },
  itemQuantity: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 10, minWidth: 25, textAlign: 'center' },
  itemSubtotalActions: { justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: 10 },
  itemSubtotal: { fontSize: 14, fontWeight: '500', marginBottom: 10 },
  removeItemButton: { padding: 5, /* backgroundColor: '#ffdddd', borderRadius: 4*/ },
  summaryContainer: { padding: 20, borderTopWidth: 1, },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, },
  summaryText: { fontSize: 16, },
  summaryAmount: { fontSize: 16, fontWeight: '500'},
  totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee', marginTop:10},
  summaryTotalText: { fontSize: 18, fontWeight: 'bold'},
  summaryTotalAmount: { fontSize: 20, fontWeight: 'bold'},
  checkoutButton: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 15},
  checkoutButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
