// ARTIVA/front_end/app/product/[id].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TouchableOpacity, ActivityIndicator, Alert, Dimensions, Button,
  FlatList // Assure-toi que FlatList est importé
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter, Href } from 'expo-router'; // Href pour la navigation
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { Product } from '../../components/ProductCard'; // Assure-toi que ce chemin et l'export sont corrects

// Type pour une image de produit (venant de la table product_images ou de l'image principale)
interface ProductImageItem {
  id: string | number; // Doit être unique pour la key de FlatList
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

// Type pour un produit détaillé
interface ProductDetail extends Product {
  images?: ProductImageItem[]; // Tableau d'objets ProductImageItem
  // description est déjà dans Product (si tu l'as défini dans ProductCard.Product)
  // category_ids, categories_names, tag_ids, tags_names sont déjà dans Product
}

const API_BASE_URL = 'http://192.168.1.2:3001/api'; // TON IP

const { width: screenWidth } = Dimensions.get('window');

interface ViewableItemInfo<T> { // T sera ProductImageItem dans notre cas
  item: T;
  key: string;
  index: number | null; // L'index peut être null dans certains cas rares
  isViewable: boolean;
  // Il y a d'autres propriétés, mais celles-ci sont les plus courantes
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ProductImageItem>>(null);

  

  const fetchProductDetails = useCallback(async () => {
    if (!id) { 
      setError("ID du produit manquant."); 
      setIsLoading(false); 
      return; 
    }
    console.log(`ProductDetailScreen: Fetching details for product ID: ${id}`);
    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: `Erreur HTTP ${response.status}`}));
        throw new Error(errorData.message || `Produit non trouvé ou erreur serveur (${response.status})`);
      }
      const dataFromApi: ProductDetail = await response.json();
      
      const processedData: ProductDetail = {
        ...dataFromApi,
        // S'assurer que 'images' est un tableau. Si l'API ne renvoie pas 'images' mais seulement 'image_url',
        // on crée un tableau 'images' à partir de 'image_url'.
        images: dataFromApi.images && dataFromApi.images.length > 0 
                ? dataFromApi.images 
                : (dataFromApi.imageUrl ? [{id: 'main_img_0', image_url: dataFromApi.imageUrl, is_primary: true}] : []),
        category_ids: dataFromApi.category_ids || [],
        categories_names: dataFromApi.categories_names || [],
        tag_ids: dataFromApi.tag_ids || [],
        tags_names: dataFromApi.tags_names || [],
      };
      setProduct(processedData);
      console.log("ProductDetailScreen: Details fetched and processed:", processedData);
    } catch (err: any) {
      console.error("ProductDetailScreen: Erreur fetchProductDetails:", err);
      setError(err.message || 'Impossible de charger les détails du produit.');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]); // API_BASE_URL est une constante, pas besoin ici

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleAddToCart = () => {
    if (!product) return;
    Alert.alert("Ajout au panier", `${quantity} x ${product.name} ajouté(s) au panier (simulation).`);
    console.log({ productId: product.id, quantity });
  };

   // Fonction pour gérer le changement d'index lors du scroll du carrousel
   const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<ViewableItemInfo<ProductImageItem>> }) => { // << TYPAGE AJOUTÉ ICI
    if (viewableItems.length > 0) {
      const firstViewableItem = viewableItems[0];
      if (firstViewableItem.index !== null) { // Vérifier que l'index n'est pas null
        setActiveIndex(firstViewableItem.index);
        console.log("Image active (index):", firstViewableItem.index);
      }
    }
  }, []); // Pas de dépendances car elle ne dépend que de son argument

  
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderImageItem = ({ item }: { item: ProductImageItem }) => (
    <View style={styles.carouselImageContainer}>
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.carouselImage} 
        resizeMode="contain" 
      />
    </View>
  );

  const renderCarouselDots = () => {
    if (!product?.images || product.images.length <= 1) return null;
    return (
      <View style={styles.dotsContainer}>
        {product.images.map((_, index) => (
          <View
            key={`dot-${index}`} // Utiliser un préfixe pour la clé
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    );
  };
  // L'ACCOLADE FERMANTE EN TROP A ÉTÉ SUPPRIMÉE D'ICI

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={{marginTop: 10, color: Colors[colorScheme ?? 'light'].text}}>Chargement du produit...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{color: 'red', textAlign: 'center'}}>{error}</Text>
        <Button title="Retour" onPress={() => router.back()} color={Colors[colorScheme ?? 'light'].tint}/>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Produit non trouvé.</Text>
        <Button title="Retour" onPress={() => router.back()} color={Colors[colorScheme ?? 'light'].tint}/>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenContainer}>
      <Stack.Screen options={{ title: product.name || 'Détail Produit' }} />

      {/* Carrousel d'Images */}
      {product.images && product.images.length > 0 ? (
        <View style={styles.carouselWrapper}>
          <FlatList
            ref={flatListRef}
            data={product.images}
            renderItem={renderImageItem}
            keyExtractor={(imgItem, index) => `img-carousel-${imgItem.id}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => (
              { length: screenWidth, offset: screenWidth * index, index }
            )}
          />
          {renderCarouselDots()}
        </View>
      ) : (
        <View style={[styles.imagePlaceholderContainer]}><Text>Pas d'image disponible</Text></View>
      )}

      <View style={styles.detailsContainer}>
        <Text style={styles.productName}>{product.name || 'Nom du produit non disponible'}</Text>
        {product.tags_names && product.tags_names.length > 0 && (
            <Text style={styles.tags}>Tags: {product.tags_names.join(', ')}</Text>
        )}
        {product.categories_names && product.categories_names.length > 0 && (
            <Text style={styles.categories}>Catégories: {product.categories_names.join(', ')}</Text>
        )}
        <Text style={styles.productPrice}>{product.price || 'Prix N/A'} {'FCFA'}</Text> 
        <Text style={styles.productDescription}>{product.description || 'Pas de description disponible.'}</Text>
        
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantité :</Text>
          <TouchableOpacity onPress={() => handleQuantityChange(-1)} style={styles.quantityButton}>
            <FontAwesome name="minus" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity onPress={() => handleQuantityChange(1)} style={styles.quantityButton}>
            <FontAwesome name="plus" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.stockInfo}>
            {(product.stock !== undefined && product.stock > 0) ? `Stock disponible : ${product.stock}` : 'Produit indisponible'}
        </Text>
        
        <TouchableOpacity 
            style={[styles.addToCartButton, (product.stock === undefined || product.stock === 0) && styles.disabledButton]} 
            onPress={handleAddToCart} 
            disabled={product.stock === undefined || product.stock === 0}>
          <Text style={styles.addToCartButtonText}>
            {(product.stock === undefined || product.stock === 0) ? 'Indisponible' : 'Ajouter au panier'}
          </Text>
        </TouchableOpacity>      
      </View>
    </ScrollView>
  );
} // <<< ACCOLADE FERMANTE DE ProductDetailScreen

// Styles (incluant les styles du carrousel que j'avais fournis)
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  carouselWrapper: { /* La hauteur est implicite par l'image, ou tu peux la fixer */ },
  carouselImageContainer: { width: screenWidth, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' /* Fond pour les images */ },
  carouselImage: { width: '100%', aspectRatio: 1.2, /* ou height: screenWidth * 0.8 par exemple */ },
  imagePlaceholderContainer: { width: screenWidth, aspectRatio: 1.2, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 10, left: 0, right: 0 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  dotActive: { backgroundColor: 'tomato' },
  dotInactive: { backgroundColor: '#ccc' },
  detailsContainer: { padding: 20 },
  productName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  tags: { fontSize: 13, color: 'dimgray', fontStyle: 'italic', marginBottom: 4 },
  categories: { fontSize: 13, color: 'dimgray', marginBottom: 12 },
  productPrice: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginBottom: 15 }, // Vert pour le prix
  productDescription: { fontSize: 16, lineHeight: 24, color: '#424242', marginBottom: 20 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, alignSelf: 'flex-start' },
  quantityLabel: { fontSize: 16, marginRight: 10, color: '#333' },
  quantityButton: { borderWidth: 1, borderColor: '#bdbdbd', padding: 10, borderRadius: 5 },
  quantityValue: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, minWidth: 30, textAlign: 'center', color: '#333' },
  stockInfo: { fontSize: 14, color: '#757575', marginBottom: 25, fontStyle: 'italic' },
  addToCartButton: { backgroundColor: 'tomato', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  addToCartButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#BDBDBD' }, // Gris pour désactivé
});