// ARTIVA/front_end/app/(tabs)/CartScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'; // useState est utilisé pour cartMessage
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Button, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, Link, Href } from 'expo-router';
import { useCart, CartItem } from '../../context/CartContext'; // Importer CartItem aussi
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext'; // Pour le thème et userToken

export default function TabCartScreen() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, isLoadingCart } = useCart();
  const { userToken, isLoading: isAuthLoading, effectiveAppColorScheme } = useAuth(); 
  const router = useRouter();

  // Couleurs basées sur le thème effectif
  const currentScheme = effectiveAppColorScheme ?? 'light';
  const colors = Colors[currentScheme];
  const tintColor = colors.tint;
  const textColor = colors.text;
  const backgroundColor = colors.background;
  const cardColor = colors.card;
  const subtleTextColor = colors.subtleText;
  const borderColor = colors.cardBorder;
  const errorColor = colors.errorText;
  const successTextColor = colors.successText; // Pour les messages de succès
  const successBackgroundColor = colors.successBackground;

  const [cartMessage, setCartMessage] = useState<string | null>(null); // Pour afficher les messages de succès/erreur

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      //Alert.alert("Panier vide", "Votre panier est vide. Ajoutez des articles avant de passer à la caisse.");
      setCartMessage("Votre panier est vide. Ajoutez des articles avant de passer à la caisse.");
      setTimeout(() => setCartMessage(null), 3000); // Faire disparaître après 3s
      return;
    }
    if (!userToken) {
      //Alert.alert(
      //  "Connexion requise",
      //  "Vous devez être connecté pour passer une commande.",
      //  [
      //    { text: "Annuler", style: "cancel" },
      //    { text: "Se connecter", onPress: () => router.push('/login' as Href) } 
      //  ]
      //);
      setCartMessage("Vous devez être connecté pour passer une commande.");
      setTimeout(() => setCartMessage(null), 3000);
      router.push('/login' as Href); // Toujours rediriger après l'affichage du message
      return;
    }
    router.push('/checkout' as Href); 
  };

  const getItemSubtotal = (item: CartItem): number => {
    const priceString = String(item.price).replace(/[^\d.-]/g, '');
    const priceNumber = parseFloat(priceString);
    return isNaN(priceNumber) ? 0 : priceNumber * item.quantity;
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    // console.log("Render CartItem:", item.name, "imageUrl:", item.imageUrl);
    return(
    <View style={[styles.itemContainer, {backgroundColor: cardColor, borderColor: borderColor}]}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, {color: textColor}]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.itemPrice, {color: tintColor}]}>{item.price}</Text> 
        <View style={styles.quantityControls}>
        <TouchableOpacity 
            onPress={() => {
              updateQuantity(item.id, item.quantity - 1);
              setCartMessage(`Quantité de ${item.name} mise à jour.`); // Message
              setTimeout(() => setCartMessage(null), 2000);
            }} 
            style={[styles.controlButton, {borderColor: subtleTextColor}, item.quantity <= 1 && styles.controlButtonDisabled]}
            disabled={item.quantity <= 1} 
          >
            <FontAwesome name="minus" size={16} color={item.quantity <= 1 ? subtleTextColor : tintColor} />
          </TouchableOpacity>
          <Text style={[styles.itemQuantity, {color: textColor}]}>{item.quantity}</Text>
          <TouchableOpacity 
            onPress={() => {
              updateQuantity(item.id, item.quantity + 1);
              setCartMessage(`Quantité de ${item.name} mise à jour.`); // Message
              setTimeout(() => setCartMessage(null), 2000);
            }}
            style={[styles.controlButton, {borderColor: subtleTextColor}, item.quantity >= (item.stock || Infinity) && styles.controlButtonDisabled]}
            disabled={item.quantity >= (item.stock || Infinity)}
          >
            <FontAwesome name="plus" size={16} color={item.quantity >= (item.stock || Infinity) ? subtleTextColor : tintColor} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemSubtotalActions}>
        <Text style={[styles.itemSubtotal, {color: textColor}]}>
          {getItemSubtotal(item).toFixed(2)} FCFA
        </Text>
        <TouchableOpacity 
          onPress={() => {
            removeFromCart(item.id);
            setCartMessage(`${item.name} a été retiré du panier.`); // Message
            setTimeout(() => setCartMessage(null), 3000);
          }} 
          style={styles.removeItemButton}
        >
          <FontAwesome name="trash-o" size={24} color={errorColor} /> 
        </TouchableOpacity>
      </View>
    </View>
  );
  }; // Fin de renderCartItem

  if (isLoadingCart || isAuthLoading) {
    return <View style={[styles.centered, {backgroundColor}]}><ActivityIndicator size="large" color={tintColor}/></View>;
  }

  if (!userToken) { // Vérifier après les chargements initiaux
    return (
      <View style={[styles.screenContainer, {backgroundColor}]}>
        <Stack.Screen options={{ title: 'Panier', headerShown: false }} />
        <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: cardColor }]}>
            <Text style={[styles.customHeaderTitle, { color: textColor }]}>Votre Panier</Text>
            {/* Espace pour équilibrer si pas de bouton retour (car on ne sait pas si router.canGoBack() est vrai encore) */}
            <View style={{width: 40}} /> 
        </View>
        <View style={styles.emptyCartContainer}>
            <FontAwesome name="lock" size={60} color={subtleTextColor} />
            <Text style={[styles.emptyCartText, {color: textColor, marginTop: 20}]}>Connectez-vous pour voir votre panier.</Text>
            <TouchableOpacity onPress={() => router.push('/login' as Href)} style={[styles.actionButton, {backgroundColor: tintColor}]}>
                <Text style={styles.actionButtonText}>Se connecter / S'inscrire</Text>
            </TouchableOpacity>
            {cartMessage && <Text style={[styles.cartMessage, {backgroundColor: successBackgroundColor, color: successTextColor }]}>{cartMessage}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, {backgroundColor}]}>
      <Stack.Screen options={{ title: `Panier (${getTotalItems()})`, headerShown: false }} />

      <View style={[styles.customHeader, { borderBottomColor: subtleTextColor, backgroundColor: cardColor }]}>
        {router.canGoBack() ? ( // Vérifier si router est défini avant d'appeler canGoBack
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={tintColor} />
          </TouchableOpacity>
        ) : <View style={{width: 40}} /> }
        <Text style={[styles.customHeaderTitle, { color: textColor }]}>Votre Panier ({getTotalItems()})</Text>
        <View style={{width: 40}} /> 
      </View>
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <FontAwesome name="shopping-basket" size={80} color={subtleTextColor} />
          <Text style={[styles.emptyCartText, {color: textColor}]}>Votre panier est vide.</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/' as Href)} style={[styles.shopButton, {backgroundColor: tintColor}]}>
            <Text style={styles.shopButtonText}>Continuer vos achats</Text>
          </TouchableOpacity>
            {cartMessage && <Text style={[styles.cartMessage, {backgroundColor: successBackgroundColor, color: successTextColor }]}>{cartMessage}</Text>}
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem} // Utilise la fonction définie dans ce composant
            keyExtractor={(item) => `cart-${String(item.id)}`}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={<View style={{height: 20}}/>}
          />
          <View style={[styles.summaryContainer, {borderTopColor: subtleTextColor, backgroundColor: cardColor}]}>
            <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, {color: textColor}]}>Sous-total ({getTotalItems()} article(s)):</Text>
                <Text style={[styles.summaryAmount, {color: textColor}]}>{getTotalPrice().toFixed(2)} FCFA</Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, {color: textColor}]}>Frais de livraison :</Text>
                <Text style={[styles.summaryAmount, {color: textColor}]}>À calculer</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow, {borderTopColor: subtleTextColor}]}>
                <Text style={[styles.summaryTotalText, {color: textColor}]}>Total :</Text>
                <Text style={[styles.summaryTotalAmount, {color: tintColor}]}>{getTotalPrice().toFixed(2)} FCFA</Text>
            </View>
            <TouchableOpacity style={[styles.checkoutButton, {backgroundColor: tintColor}]} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Valider et Payer</Text>
            </TouchableOpacity>
          </View>
          {cartMessage && <Text style={[styles.cartMessage, {backgroundColor: successBackgroundColor, color: successTextColor }]}>{cartMessage}</Text>}
        </>
      )}
    </View>
  );
}

// Styles (ceux que tu as fournis en dernier)
const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 12: 15, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, },
  actionButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2, shadowOpacity: 0.1, shadowRadius: 3, marginTop: 10 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  backButton: { padding: 5, width: 40, alignItems: 'flex-start',},
  customHeaderTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1,},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' , backgroundColor: "#fff"},
  emptyCartContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyCartText: { fontSize: 18, marginTop: 20, marginBottom: 30, textAlign: 'center' },
  shopButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, },
  shopButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  listContainer: { paddingVertical: 10, paddingHorizontal: 10 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, borderRadius: 10, elevation: 1.5, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, borderWidth:1, },
  itemImage: { width: 75, height: 75, borderRadius: 8, marginRight: 15, backgroundColor: '#e0e0e0' },
  itemDetails: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 5 },
  itemPrice: { fontSize: 14, fontWeight: 'bold' },
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
  cartMessage: {
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 15,
    fontSize: 15,
  },
   emptySubText: { fontSize: 15, marginBottom: 30, textAlign: 'center', },
    errorText: {
    fontSize: 15,
    textAlign: "center",
    marginVertical: 15,
    paddingHorizontal: 10,
  },
});