// ARTIVA/front_end/app/product/[id].tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Button,
  FlatList,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { Product as BaseProductType } from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import ScrollSection from "../../components/ScrollSection";
import ProductCard from "../../components/ProductCard";

// Interfaces (conservées de la version de base, car plus complètes)
interface ProductImageGalleryItem {
  id: string | number;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}
interface ProductDetailAPIResponse
  extends Omit<BaseProductType, "imageUrl" | "price" | "id"> {
  id: string | number;
  price: string | number;
  main_image_url?: string;
  images?: ProductImageGalleryItem[];
}
interface ProductDetail extends BaseProductType {
  imagesForCarousel: ProductImageGalleryItem[];
  
}
interface ViewableItemInfo<T> {
  item: T;
  key: string;
  index: number | null;
  isViewable: boolean;
}

// **ATTENTION: METS TON ADRESSE IP LOCALE CORRECTE ICI**
const API_BASE_URL = "http://192.168.1.2:3001/api";
const { width: screenWidth } = Dimensions.get("window");

const formatPriceForDisplay = (
  price: string | number | undefined | null,
  currency: string = "FCFA"
): string => {
  if (price === undefined || price === null || String(price).trim() === "")
    return "Prix N/A";
  const numericPrice = parseFloat(String(price));
  if (isNaN(numericPrice)) return "Prix invalide";
  return `${numericPrice.toFixed(2)} ${currency}`;
};

export default function ProductDetailScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { effectiveAppColorScheme, userToken } = useAuth();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { addToWishlist, removeFromWishlist, isProductInWishlist } =
    useWishlist();

  // CHANGEMENT: Utilisation des couleurs dynamiques du thème partout
  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = Colors[currentScheme];
  const tintColor = Colors[currentScheme].tint;
  const textColor = Colors[currentScheme].text;
  const backgroundColor = Colors[currentScheme].background;
  const subtleTextColor = Colors[currentScheme].subtleText;
  const successBackgroundColor = Colors[currentScheme].successBackground;
  const successTextColor = Colors[currentScheme].successText;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ProductImageGalleryItem>>(null);

  // CHANGEMENT: Ajout de l'état pour les messages UI au lieu des alertes
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  // CHANGEMENT: Ajout des états pour les produits similaires
  const [similarSubCategoryProducts, setSimilarSubCategoryProducts] = useState<
    BaseProductType[]
  >([]);
  const [similarMainCategoryProducts, setSimilarMainCategoryProducts] =
    useState<BaseProductType[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  const cartItemForThisProduct = product
    ? cartItems.find((item) => String(item.id) === String(product.id))
    : undefined;
  const quantityInCart = cartItemForThisProduct
    ? cartItemForThisProduct.quantity
    : 0;
  const isInWishlist = product ? isProductInWishlist(product.id) : false;

  const fetchProductDetails = useCallback(async () => {
    // ... (fonction conservée de la version de base, elle est complète et robuste)
    if (!routeId) {
      setError("ID du produit manquant dans la route.");
      setIsLoading(false);
      return;
    }
    console.log(
      `ProductDetailScreen: Fetching details for product ID: ${routeId}`
    );
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${routeId}`);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(
          errorData.message ||
            `Produit non trouvé ou erreur serveur (${response.status})`
        );
      }
      const dataFromApi = (await response.json()) as ProductDetailAPIResponse;
      let mainImageUrlForCard: string = `https://via.placeholder.com/150x150/?text=${encodeURIComponent(
        dataFromApi.name || "Prod"
      )}`;
      let carouselImages: ProductImageGalleryItem[] = [];

      if (dataFromApi.images && dataFromApi.images.length > 0) {
        carouselImages = dataFromApi.images.sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        );
        const primaryApiImage = carouselImages.find((img) => img.is_primary);
        mainImageUrlForCard =
          primaryApiImage?.image_url || carouselImages[0].image_url;
      } else if (dataFromApi.main_image_url) {
        mainImageUrlForCard = dataFromApi.main_image_url;
        carouselImages = [
          {
            id: `main_${dataFromApi.id}`,
            image_url: dataFromApi.main_image_url,
            is_primary: true,
            display_order: 0,
          },
        ];
      }
      const processedData: ProductDetail = {
        id: String(dataFromApi.id),
        name: dataFromApi.name || "Produit Inconnu",
        price: formatPriceForDisplay(dataFromApi.price),
        imageUrl: mainImageUrlForCard,
        stock: dataFromApi.stock,
        description: dataFromApi.description,
        sku: dataFromApi.sku,
        is_published: dataFromApi.is_published,
        category_ids: dataFromApi.category_ids || [],
        categories_names: dataFromApi.categories_names || [],
        tag_ids: dataFromApi.tag_ids || [],
        tags_names: dataFromApi.tags_names || [],
        imagesForCarousel: carouselImages,
      };
      setProduct(processedData);
    } catch (err: any) {
      console.error("ProductDetailScreen: Erreur fetchProductDetails:", err);
      setError(err.message || "Impossible de charger les détails du produit.");
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  // CHANGEMENT: Nouvelle fonction pour charger les produits similaires
  const fetchSimilarProducts = useCallback(async () => {
    if (!product || !product.category_ids || product.category_ids.length === 0)
      return;
    setIsLoadingSimilar(true);
    try {
      const subCategoryId = product.category_ids[0];
      if (subCategoryId) {
        const subCatResponse = await fetch(
          `${API_BASE_URL}/products?category_id=${subCategoryId}&limit=6`
        );
        if (subCatResponse.ok) {
          const subCatData = await subCatResponse.json();
          const adaptedSubCat = (subCatData.products || [])
            .filter((p: any) => String(p.id) !== String(product.id))
            .map((p: any) => ({
              id: String(p.id),
              name: p.name || "Produit",
              price: formatPriceForDisplay(p.price),
              imageUrl:
                p.image_url ||
                `https://via.placeholder.com/150?text=${encodeURIComponent(
                  p.name || "P"
                )}`,
              stock: p.stock,
            }));
          setSimilarSubCategoryProducts(adaptedSubCat.slice(0, 5));
        }
      }

      const popularResponse = await fetch(
        `${API_BASE_URL}/products?tag_name=Populaire&limit=6&random=true`
      );
      if (popularResponse.ok) {
        const popularData = await popularResponse.json();
        const adaptedPopular = (popularData.products || [])
          .filter((p: any) => String(p.id) !== String(product.id))
          .map((p: any) => ({
            id: String(p.id),
            name: p.name || "Produit",
            price: formatPriceForDisplay(p.price),
            imageUrl:
              p.image_url ||
              `https://via.placeholder.com/150?text=${encodeURIComponent(
                p.name || "P"
              )}`,
            stock: p.stock,
          }));
        setSimilarMainCategoryProducts(adaptedPopular.slice(0, 5));
      }
    } catch (e) {
      console.error("Erreur fetchSimilarProducts:", e);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      fetchSimilarProducts();
    }
  }, [product, fetchSimilarProducts]);

  const handleWishlistToggleOnDetail = () => {
    if (!product) return;
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  // CHANGEMENT: Logique de panier améliorée
  const handleInitialAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    setCartMessage(`${product.name} a été ajouté à votre panier !`);
    setTimeout(() => setCartMessage(null), 3000);
  };

  const handleUpdateQuantityInCart = (amount: number) => {
    if (!product || !cartItemForThisProduct) return;
    const newQuantity = cartItemForThisProduct.quantity + amount;
    updateQuantity(product.id, newQuantity);
    if (newQuantity > 0) {
      setCartMessage(
        `Quantité de ${product.name} mise à jour à ${newQuantity}.`
      );
    } else {
      setCartMessage(`${product.name} retiré du panier.`);
    }
    setTimeout(() => setCartMessage(null), 3000);
  };

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewableItemInfo<ProductImageGalleryItem>>;
    }) => {
      if (viewableItems.length > 0) {
        const firstViewableItem = viewableItems[0];
        if (firstViewableItem.index !== null)
          setActiveIndex(firstViewableItem.index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;
  const renderImageItem = ({ item }: { item: ProductImageGalleryItem }) => (
    <View
      style={[styles.carouselImageContainer, { backgroundColor: colors.card }]}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.carouselImage}
        resizeMode="contain"
      />
    </View>
  );
  const renderCarouselDots = () => {
    if (!product?.imagesForCarousel || product.imagesForCarousel.length <= 1)
      return null;
    return (
      <View style={styles.dotsContainer}>
        {product.imagesForCarousel.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              index === activeIndex
                ? { backgroundColor: tintColor, borderColor: tintColor }
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <Text style={{ marginTop: 10, color: textColor }}>
          Chargement du produit...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        <Button
          title="Retour"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/" as Href)
          }
          color={tintColor}
        />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={{ color: textColor }}>Produit non trouvé.</Text>
        <Button
          title="Retour à l'accueil"
          onPress={() => router.replace("/(tabs)/" as Href)}
          color={tintColor}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screenContainer, { backgroundColor }]}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          title: product.name || "Détail Produit",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleWishlistToggleOnDetail}
              style={{ marginRight: 15 }}
            >
              <FontAwesome
                name={isInWishlist ? "heart" : "heart-o"}
                size={24}
                color={isInWishlist ? tintColor : tintColor}
              />
            </TouchableOpacity>
          ),
        }}
      />
      {product.imagesForCarousel && product.imagesForCarousel.length > 0 ? (
        <View style={styles.carouselWrapper}>
          <FlatList
            ref={flatListRef}
            data={product.imagesForCarousel}
            renderItem={renderImageItem}
            keyExtractor={(imgItem, index) => `carousel-${imgItem.id}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
          {renderCarouselDots()}
        </View>
      ) : (
        <View
          style={[
            styles.imagePlaceholderContainer,
            { backgroundColor: colors.card },
          ]}
        >
          <Text style={{ color: subtleTextColor }}>Pas d'image disponible</Text>
        </View>
      )}

      <View style={styles.detailsContainer}>
        <Text style={[styles.productName, { color: textColor }]}>
          {product.name}
        </Text>
        {product.tags_names && product.tags_names.length > 0 && (
          <Text style={[styles.tags, { color: subtleTextColor }]}>
            Tags: {product.tags_names.join(", ")}
          </Text>
        )}
        {product.categories_names && product.categories_names.length > 0 && (
          <Text style={[styles.categories, { color: subtleTextColor }]}>
            Catégories: {product.categories_names.join(", ")}
          </Text>
        )}
        <Text style={[styles.productPrice, { color: tintColor }]}>
          {product.price}
        </Text>
        <Text style={[styles.productDescription, { color: textColor }]}>
          {product.description || "Pas de description disponible."}
        </Text>

        {/* CHANGEMENT: Affichage du message du panier */}
        {cartMessage && (
          <Text
            style={[
              styles.cartMessage,
              {
                backgroundColor: successBackgroundColor,
                color: successTextColor,
              },
            ]}
          >
            {cartMessage}
          </Text>
        )}

        {/* CHANGEMENT: Nouvelle logique pour les boutons du panier */}
        {quantityInCart > 0 ? (
          <View style={styles.quantityContainer}>
            <Text style={[styles.quantityLabel, { color: textColor }]}>
              Au panier :
            </Text>
            <TouchableOpacity
              onPress={() => handleUpdateQuantityInCart(-1)}
              style={[styles.quantityButton, { borderColor: subtleTextColor }]}
            >
              <FontAwesome name="minus" size={20} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.quantityValue, { color: textColor }]}>
              {quantityInCart}
            </Text>
            <TouchableOpacity
              onPress={() => handleUpdateQuantityInCart(1)}
              style={[styles.quantityButton, { borderColor: subtleTextColor }]}
              disabled={quantityInCart >= (product.stock ?? Infinity)}
            >
              <FontAwesome
                name="plus"
                size={20}
                color={
                  quantityInCart >= (product.stock ?? Infinity)
                    ? subtleTextColor
                    : textColor
                }
              />
            </TouchableOpacity>
          </View>
        ) : (
          product.stock !== undefined &&
          product.stock > 0 && (
            <TouchableOpacity
              style={[styles.addToCartButton, { backgroundColor: tintColor }]}
              onPress={handleInitialAddToCart}
            >
              <Text style={styles.addToCartButtonText}>Ajouter au panier</Text>
            </TouchableOpacity>
          )
        )}
        <Text style={[styles.stockInfo, { color: subtleTextColor }]}>
          {product.stock !== undefined && product.stock > 0
            ? `Stock : ${product.stock}`
            : "Produit indisponible"}
        </Text>
      </View>

      {/* CHANGEMENT: Section pour produits de la même sous-catégorie */}
      {similarSubCategoryProducts.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <ScrollSection<BaseProductType>
            title={`Dans la même catégorie`}
            data={similarSubCategoryProducts}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={() => router.push(`/product/${item.id}` as Href)}
              />
            )}
            keyExtractor={(item) => `subcat-${item.id.toString()}`}
          />
        </View>
      )}

      {/* CHANGEMENT: Section pour produits populaires/suggérés */}
      {similarMainCategoryProducts.length > 0 && (
        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <ScrollSection<BaseProductType>
            title="Vous pourriez aussi aimer"
            data={similarMainCategoryProducts}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={() => router.push(`/product/${item.id}` as Href)}
              />
            )}
            keyExtractor={(item) => `maincat-${item.id.toString()}`}
          />
        </View>
      )}
    </ScrollView>
  );
}

// CHANGEMENT: Styles nettoyés pour ne plus contenir de couleurs codées en dur
const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  carouselWrapper: {},
  carouselImageContainer: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
    //backgroundColor: "#f8f8f8", Garde une couleur neutre pour le fond de l'image
  },
  carouselImage: {
    width: "100%",
    aspectRatio: 1.1,
    resizeMode: "cover", // Ajuste l'image pour couvrir l'espace sans déformation
  },
  imagePlaceholderContainer: {
    width: screenWidth,
    aspectRatio: 1.1,
    // backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderColor: "rgba(0,0,0,0.2)",
  },
  detailsContainer: { padding: 20 },
  productName: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    lineHeight: 32,
  },
  tags: { fontSize: 13, fontStyle: "italic", marginBottom: 4 },
  categories: { fontSize: 13, marginBottom: 12 },
  productPrice: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  productDescription: { fontSize: 16, lineHeight: 24, marginBottom: 25 },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  quantityLabel: { fontSize: 16, marginRight: 10, fontWeight: "500" },
  quantityButton: { borderWidth: 1, padding: 12, borderRadius: 6 },
  quantityValue: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 18,
    minWidth: 30,
    textAlign: "center",
  },
  stockInfo: { fontSize: 14, marginBottom: 25, fontStyle: "italic" },
  addToCartButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addToCartButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  cartMessage: {
    padding: 12,
    borderRadius: 5,
    textAlign: "center",
    fontWeight: "bold",
    marginVertical: 15,
    fontSize: 15,
    overflow: "hidden",
  },
});
