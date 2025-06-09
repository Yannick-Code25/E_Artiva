// front_end/components/ProductCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native'; // Ajout de Dimensions
import { FontAwesome } from '@expo/vector-icons';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/Colors';

// Obtenir la largeur de l'écran
const screenWidth = Dimensions.get('window').width;
// Calculer la largeur de la carte produit
const cardWidth = (screenWidth / 2) - 20; // Ajuster pour les marges

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  category_ids?: (string | number)[];
  categories_names?: string[];
  tag_ids?: (string | number)[];
  tags_names?: string[];
  sku?: string;
  is_published?: boolean;
  description?: string;
  stock?: number;
}

interface ProductCardProps {
  item: Product;
  onPress: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onPress }) => {
  const { effectiveAppColorScheme } = useAuth();
  const cardBackgroundColor = Colors[effectiveAppColorScheme].card;
  const nameTextColor = Colors[effectiveAppColorScheme].text;
  const priceTextColor = Colors[effectiveAppColorScheme].tint;
  const iconColor = Colors[effectiveAppColorScheme].tabIconDefault;
  const iconActiveColor = Colors[effectiveAppColorScheme].tint;

  const { addToWishlist, removeFromWishlist, isProductInWishlist } = useWishlist();
  const isInWishlist = isProductInWishlist(item.id);

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  return (
    <TouchableOpacity onPress={() => onPress(item.id)} style={[styles.container, { backgroundColor: cardBackgroundColor, width: cardWidth }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <TouchableOpacity onPress={handleWishlistToggle} style={styles.wishlistIconContainer}>
        <FontAwesome
          name={isInWishlist ? "heart" : "heart-o"}
          size={22}
          color={isInWishlist ? iconActiveColor : iconColor}
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={[styles.nameText, { color: nameTextColor }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.priceText, { color: priceTextColor }]}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
     // Largeur calculée dynamiquement
    marginHorizontal: 10, // Réduire la marge pour compenser la largeur plus grande
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: '#e0e0e0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  wishlistIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 5,
    borderRadius: 15,
  },
  infoContainer: {
    padding: 8,
    paddingTop: 5,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 36,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProductCard;