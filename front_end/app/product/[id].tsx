// ARTIVA/front_end/app/product/[id].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TouchableOpacity, ActivityIndicator, Alert, Dimensions, Button,
  FlatList 
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter, Href } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // Pour les icônes +/-
import Colors from '../../constants/Colors';       // Ajuste le chemin si nécessaire
import { useColorScheme } from '../../components/useColorScheme'; // Ajuste le chemin
import { Product as BaseProductType } from '../../components/ProductCard'; // Renommé pour clarté, assure-toi de l'export
import { useCart } from '../../context/CartContext'; // Importer le contexte du panier

// Type pour un élément image dans la galerie/carrousel
interface ProductImageGalleryItem {
  id: string | number;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

// Type pour les données brutes attendues de l'API GET /api/products/:id
interface ProductDetailAPIResponse extends Omit<BaseProductType, 'imageUrl' | 'price' | 'id'> {
  id: string | number; // L'API peut renvoyer un nombre pour l'ID
  price: string | number; // Prix brut (nombre ou chaîne numérique)
  main_image_url?: string; // L'image principale de la table 'products' (si tu l'as en plus de 'images')
  images?: ProductImageGalleryItem[]; // Tableau des images de la table 'product_images'
  // Les autres champs comme category_ids, tags_names etc. sont hérités via Omit si présents dans BaseProductType
  // ou peuvent être ajoutés ici s'ils sont spécifiques à la réponse API détaillée.
}

// Type pour l'objet 'product' utilisé dans l'état de ce composant.
// Il étend BaseProductType pour la compatibilité avec CartItem et ProductCard.
interface ProductDetail extends BaseProductType {
  // BaseProductType devrait avoir: id (string), name, price (string formaté), imageUrl, stock, etc.
  imagesForCarousel: ProductImageGalleryItem[]; // Spécifique pour le carrousel de cette page
}

// **ATTENTION: METS TON ADRESSE IP LOCALE CORRECTE ICI**
const API_BASE_URL = 'http://192.168.248.151:3001/api'; // Exemple, mets la tienne
const { width: screenWidth } = Dimensions.get('window');

// Fonction utilitaire pour formater le prix (peut être déplacée dans un fichier utils/)
const formatPriceForDisplay = (price: string | number | undefined | null, currency: string = 'FCFA'): string => {
  if (price === undefined || price === null || String(price).trim() === '') return 'Prix N/A';
  const numericPrice = parseFloat(String(price));
  if (isNaN(numericPrice)) return 'Prix invalide';
  // Affiche .00 seulement si nécessaire, ou toujours pour la cohérence, c'est un choix.
  // Ici, on affiche toujours deux décimales pour les prix.
  return `${numericPrice.toFixed(2)} ${currency}`;
};

// Interface pour les éléments visibles dans FlatList (pour typer onViewableItemsChanged)
interface ViewableItemInfo<T> {
  item: T; key: string; index: number | null; isViewable: boolean;
}

export default function ProductDetailScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>(); // ID du produit depuis l'URL
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { cartItems, addToCart, updateQuantity } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeIndex, setActiveIndex] = useState(0); // Pour le carrousel d'images
  const flatListRef = useRef<FlatList<ProductImageGalleryItem>>(null);

  // Déterminer la quantité de ce produit déjà dans le panier
  const cartItemForThisProduct = product ? cartItems.find(item => String(item.id) === String(product.id)) : undefined;
  const quantityInCart = cartItemForThisProduct ? cartItemForThisProduct.quantity : 0;

  const fetchProductDetails = useCallback(async () => {
    if (!routeId) { 
      setError("ID du produit manquant dans la route."); 
      setIsLoading(false); 
      return; 
    }
    console.log(`ProductDetailScreen: Fetching details for product ID: ${routeId}`);
    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${routeId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: `Erreur HTTP ${response.status}`}));
        throw new Error(errorData.message || `Produit non trouvé ou erreur serveur (${response.status})`);
      }
      const dataFromApi = await response.json() as ProductDetailAPIResponse;
      console.log("ProductDetailScreen: Données brutes API:", JSON.stringify(dataFromApi, null, 2));
      
      // Déterminer l'image principale pour ProductCard/CartItem et le carrousel
      let mainImageUrlForCard: string = `https://via.placeholder.com/150x150/?text=${encodeURIComponent(dataFromApi.name || 'Prod')}`;
      let carouselImages: ProductImageGalleryItem[] = [];

      if (dataFromApi.images && dataFromApi.images.length > 0) {
        carouselImages = dataFromApi.images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)); // Trier par display_order
        const primaryApiImage = carouselImages.find(img => img.is_primary);
        mainImageUrlForCard = primaryApiImage?.image_url || carouselImages[0].image_url;
      } else if (dataFromApi.main_image_url) { // Fallback sur main_image_url de la table products
        mainImageUrlForCard = dataFromApi.main_image_url;
        carouselImages = [{ id: `main_${dataFromApi.id}`, image_url: dataFromApi.main_image_url, is_primary: true, display_order: 0 }];
      }

      const processedData: ProductDetail = {
        // Champs attendus par BaseProductType (pour ProductCard et CartItem)
        id: String(dataFromApi.id), // S'assurer que l'ID est une chaîne
        name: dataFromApi.name || 'Produit Inconnu',
        price: formatPriceForDisplay(dataFromApi.price), // Formater le prix
        imageUrl: mainImageUrlForCard, // Image principale pour affichage simple
        stock: dataFromApi.stock,
        description: dataFromApi.description,
        sku: dataFromApi.sku,
        is_published: dataFromApi.is_published,
        category_ids: dataFromApi.category_ids || [],
        categories_names: dataFromApi.categories_names || [],
        tag_ids: dataFromApi.tag_ids || [],
        tags_names: dataFromApi.tags_names || [],
        // Champ spécifique à ProductDetail pour le carrousel
        imagesForCarousel: carouselImages,
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
  }, [routeId]); // API_BASE_URL est une constante globale, pas besoin ici

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const handleQuantityChangeOnDetailPage = (amount: number) => {
    if (!product) return;
    const currentQuantityInCart = cartItemForThisProduct ? cartItemForThisProduct.quantity : 0;
    let newQuantity = currentQuantityInCart + amount;
    // updateQuantity dans CartContext gère la logique de suppression si newQuantity <= 0
    // et la limite par rapport au stock.
    updateQuantity(product.id, newQuantity);
  };

  const handleInitialAddToCart = () => {
    if (!product) return;
    // 'product' est de type ProductDetail, qui étend BaseProductType.
    // addToCart attend un objet compatible avec BaseProductType.
    addToCart(product, 1); // Ajoute 1 article
    Alert.alert("Panier", `${product.name} ajouté au panier !`);
  };
  
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewableItemInfo<ProductImageGalleryItem>> }) => {
      if (viewableItems.length > 0) {
        const firstViewableItem = viewableItems[0];
        if (firstViewableItem.index !== null) {
          setActiveIndex(firstViewableItem.index);
        }
      }
    },[]);
  
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderImageItem = ({ item }: { item: ProductImageGalleryItem }) => (
    <View style={styles.carouselImageContainer}>
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.carouselImage} 
        resizeMode="contain" 
      />
    </View>
  );

  const renderCarouselDots = () => {
    if (!product?.imagesForCarousel || product.imagesForCarousel.length <= 1) return null;
    return (
      <View style={styles.dotsContainer}>
        {product.imagesForCarousel.map((_, index) => (
          <View 
            key={`dot-${index}`} 
            style={[ styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive ]} 
          />
        ))}
      </View>
    );
  };


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
        <Button title="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/' as any)} color={Colors[colorScheme ?? 'light'].tint}/>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Produit non trouvé.</Text>
        <Button title="Retour à l'accueil" onPress={() => router.replace('/(tabs)/' as any)} color={Colors[colorScheme ?? 'light'].tint}/>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenContainer}>
      <Stack.Screen options={{ title: product.name || 'Détail Produit' }} />

      {product.imagesForCarousel && product.imagesForCarousel.length > 0 ? (
        <View style={styles.carouselWrapper}>
          <FlatList
            ref={flatListRef}
            data={product.imagesForCarousel}
            renderItem={renderImageItem}
            keyExtractor={(imgItem, index) => `carousel-${imgItem.id}-${index}`}
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
        <Text style={styles.productName}>{product.name}</Text>
        
        {product.tags_names && product.tags_names.length > 0 && (
            <Text style={styles.tags}>Tags: {product.tags_names.join(', ')}</Text>
        )}
        {product.categories_names && product.categories_names.length > 0 && (
            <Text style={styles.categories}>Catégories: {product.categories_names.join(', ')}</Text>
        )}

        <Text style={styles.productPrice}>{product.price}</Text> 
        
        <Text style={styles.productDescription}>{product.description || 'Pas de description disponible.'}</Text>
        
        {/* Logique pour afficher soit les contrôles de quantité, soit le bouton "Ajouter au panier" */}
        {quantityInCart > 0 ? (
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantité au panier :</Text>
            <TouchableOpacity 
              onPress={() => handleQuantityChangeOnDetailPage(-1)} 
              style={styles.quantityButton}>
              <FontAwesome name="minus" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantityInCart}</Text>
            <TouchableOpacity 
              onPress={() => handleQuantityChangeOnDetailPage(1)} 
              style={styles.quantityButton}
              disabled={quantityInCart >= (product.stock ?? Infinity)}>
              <FontAwesome name="plus" size={20} color={(quantityInCart >= (product.stock ?? Infinity)) ? '#ccc' : '#333'} />
            </TouchableOpacity>
          </View>
        ) : (

          (product.stock !== undefined && product.stock > 0) ? (
            <TouchableOpacity style={styles.addToCartButton} onPress={handleInitialAddToCart}>
              <Text style={styles.addToCartButtonText}>Ajouter au panier</Text>
            </TouchableOpacity>
          ) : null 
        )}
        
        <Text style={styles.stockInfo}>
            {(product.stock !== undefined && product.stock > 0) 
                ? `Stock disponible : ${product.stock}` 
                : 'Produit indisponible'}
        </Text>
      </View>
    </ScrollView>
  );
}



const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  carouselWrapper: { /* Hauteur implicite ou à définir */ },
  carouselImageContainer: { width: screenWidth, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' },
  carouselImage: { width: '100%', aspectRatio: 1.1, /* Ratio pour images un peu plus hautes que larges */ },
  imagePlaceholderContainer: { width: screenWidth, aspectRatio: 1.1, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 15, left: 0, right: 0, },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
  dotActive: { backgroundColor: 'tomato' , borderColor: 'tomato'},
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.5)' },
  detailsContainer: { padding: 20, },
  productName: { fontSize: 26, fontWeight: 'bold', marginBottom: 6, color: '#212121', lineHeight: 32 },
  tags: { fontSize: 13, color: '#757575', fontStyle: 'italic', marginBottom: 4, },
  categories: { fontSize: 13, color: '#757575', marginBottom: 12, },
  productPrice: { fontSize: 24, fontWeight: 'bold', color: '#00796B', marginBottom: 15, }, // Un vert plus foncé
  productDescription: { fontSize: 16, lineHeight: 24, color: '#424242', marginBottom: 25, },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, alignSelf: 'flex-start', },
  quantityLabel: { fontSize: 16, marginRight: 10, color: '#333', fontWeight: '500' },
  quantityButton: { borderWidth: 1, borderColor: '#BDBDBD', padding: 12, borderRadius: 6, backgroundColor: '#FAFAFA' },
  quantityValue: { fontSize: 18, fontWeight: '600', marginHorizontal: 18, minWidth: 30, textAlign: 'center', color: '#333' },
  stockInfo: { fontSize: 14, color: '#616161', marginBottom: 25, fontStyle: 'italic', },
  addToCartButton: { backgroundColor: 'tomato', paddingVertical: 15, borderRadius: 8, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity:0.2, shadowRadius:2 },
  addToCartButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', },
  disabledButton: { backgroundColor: '#E0E0E0', }, // Gris plus clair pour désactivé
});