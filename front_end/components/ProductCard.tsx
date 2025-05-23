// front_end/components/ProductCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

// Type pour les props d'une carte de produit
export interface Product { // Exporté pour l'écran d'accueil
  id: string;
  name: string;
  imageUrl: string;
  price: string; // Ou number si tu préfères, puis formater en string
  // Tu pourrais ajouter d'autres champs comme oldPrice, discount, rating, etc.
}

interface ProductCardProps {
  item: Product;
  onPress: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item.id)} style={styles.container}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.priceText}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150, // Largeur de la carte produit
    marginRight: 12,
    backgroundColor: 'white', // Fond blanc pour la carte
    borderRadius: 8,
    elevation: 2, // Ombre pour Android
    shadowColor: '#000', // Ombre pour iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    overflow: 'hidden', // Pour que l'ombre ne soit pas coupée par l'image si elle a un borderRadius
  },
  image: {
    width: '100%',
    height: 130, // Hauteur de l'image produit
    backgroundColor: '#e0e0e0', // Placeholder
  },
  infoContainer: {
    padding: 8, // Padding pour les infos du produit
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    // color: '#333',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'green', // Ou ta couleur de prix
  },
});

export default ProductCard;