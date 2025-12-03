// ARTIVA/front_end/app/product/[id].tsx
import { StyleSheet } from "react-native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Button,
  FlatList,
  TextInput,
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

// Interfaces
interface ProductImageGalleryItem {
  id: string | number;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}
interface ProductDetailAPIResponse extends Omit<BaseProductType, "imageUrl" | "price" | "id"> {
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
interface Review {
  id: string | number;
  user_name: string;
  etoiles: number;
  commentaire: string;
  created_at: string;
}

// Adresse API locale
const API_BASE_URL = "http://192.168.11.120:3001/api";
const { width: screenWidth } = Dimensions.get("window");

// Formattage prix
const formatPriceForDisplay = (
  price: string | number | undefined | null,
  currency: string = "FCFA"
): string => {
  if (price === undefined || price === null || String(price).trim() === "") return "Prix N/A";
  const numericPrice = parseFloat(String(price));
  if (isNaN(numericPrice)) return "Prix invalide";
  return `${numericPrice.toFixed(2)} ${currency}`;
};

export default function ProductDetailScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { effectiveAppColorScheme, userToken } = useAuth();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { addToWishlist, removeFromWishlist, isProductInWishlist } = useWishlist();

  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = Colors[currentScheme];
  const tintColor = colors.tint;
  const textColor = colors.text;
  const backgroundColor = colors.background;
  const subtleTextColor = colors.subtleText;
  const successBackgroundColor = colors.successBackground;
  const successTextColor = colors.successText;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ProductImageGalleryItem>>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [similarSubCategoryProducts, setSimilarSubCategoryProducts] = useState<BaseProductType[]>([]);
  const [similarMainCategoryProducts, setSimilarMainCategoryProducts] = useState<BaseProductType[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // Avis
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewetoiles, setReviewetoiles] = useState<number>(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const cartItemForThisProduct = product
    ? cartItems.find((item) => String(item.id) === String(product.id))
    : undefined;
  const isInWishlist = product ? isProductInWishlist(product.id) : false;

  // --- Fetch product details ---
  const fetchProductDetails = useCallback(async () => {
    if (!routeId) {
      setError("ID du produit manquant dans la route.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${routeId}`);
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const dataFromApi = (await response.json()) as ProductDetailAPIResponse;

      let mainImageUrl = dataFromApi.main_image_url || `https://via.placeholder.com/150x150/?text=${encodeURIComponent(dataFromApi.name || "Prod")}`;
      let imagesForCarousel: ProductImageGalleryItem[] = [];

      if (dataFromApi.images?.length) {
        imagesForCarousel = dataFromApi.images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const primaryImage = imagesForCarousel.find(img => img.is_primary);
        mainImageUrl = primaryImage?.image_url || imagesForCarousel[0].image_url;
      } else if (dataFromApi.main_image_url) {
        imagesForCarousel = [{ id: `main_${dataFromApi.id}`, image_url: dataFromApi.main_image_url, is_primary: true, display_order: 0 }];
      }

      setProduct({
        id: String(dataFromApi.id),
        name: dataFromApi.name || "Produit Inconnu",
        price: formatPriceForDisplay(dataFromApi.price),
        imageUrl: mainImageUrl,
        stock: dataFromApi.stock,
        description: dataFromApi.description,
        sku: dataFromApi.sku,
        is_published: dataFromApi.is_published,
        category_ids: dataFromApi.category_ids || [],
        categories_names: dataFromApi.categories_names || [],
        tag_ids: dataFromApi.tag_ids || [],
        tags_names: dataFromApi.tags_names || [],
        imagesForCarousel,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de charger le produit.");
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useEffect(() => { fetchProductDetails(); }, [fetchProductDetails]);

  // --- Fetch similar products ---
  const fetchSimilarProducts = useCallback(async () => {
    if (!product?.category_ids?.length) return;
    setIsLoadingSimilar(true);
    try {
      const subCategoryId = product.category_ids[0];
      if (subCategoryId) {
        const resp = await fetch(`${API_BASE_URL}/products?category_id=${subCategoryId}&limit=6`);
        if (resp.ok) {
          const data = await resp.json();
          setSimilarSubCategoryProducts(
            (data.products || []).filter((p: any) => String(p.id) !== String(product.id)).map((p: any) => ({
              id: String(p.id),
              name: p.name || "Produit",
              price: formatPriceForDisplay(p.price),
              imageUrl: p.image_url || `https://via.placeholder.com/150?text=${encodeURIComponent(p.name || "P")}`,
              stock: p.stock,
            })).slice(0,5)
          );
        }
      }
      const popularResp = await fetch(`${API_BASE_URL}/products?tag_name=Populaire&limit=6&random=true`);
      if (popularResp.ok) {
        const data = await popularResp.json();
        setSimilarMainCategoryProducts(
          (data.products || []).filter((p: any) => String(p.id) !== String(product.id)).map((p: any) => ({
            id: String(p.id),
            name: p.name || "Produit",
            price: formatPriceForDisplay(p.price),
            imageUrl: p.image_url || `https://via.placeholder.com/150?text=${encodeURIComponent(p.name || "P")}`,
            stock: p.stock,
          })).slice(0,5)
        );
      }
    } catch (e) {
      console.error("Erreur fetchSimilarProducts:", e);
    } finally { setIsLoadingSimilar(false); }
  }, [product]);

useEffect(() => {
    if (product) {
      fetchSimilarProducts();
      fetchReviews(); // NOUVEAU: charger les avis dès que le produit est chargé
    }
}, [product, fetchSimilarProducts]);

  // --- Wishlist toggle ---
  const handleWishlistToggleOnDetail = () => {
    if (!product) return;
    isInWishlist ? removeFromWishlist(product.id) : addToWishlist(product);
  };

  // --- Panier ---
  const handleInitialAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    setCartMessage(`${product.name} ajouté au panier !`);
    setTimeout(() => setCartMessage(null), 3000);
  };

  // --- Carousel ---
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<ViewableItemInfo<ProductImageGalleryItem>> }) => {
    if (viewableItems.length && viewableItems[0].index !== null) setActiveIndex(viewableItems[0].index);
  }, []);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const renderImageItem = ({ item }: { item: ProductImageGalleryItem }) => (
    <View style={{ width: screenWidth, height: 300, justifyContent: "center", alignItems: "center" }}>
      <Image source={{ uri: item.image_url }} style={{ width: screenWidth, height: 300 }} resizeMode="contain" />
    </View>
  );

// --- FETCH REVIEWS ---
const fetchReviews = useCallback(async () => {
  console.log("=== fetchReviews appelé ===");
  
  if (!product) {
    console.warn("fetchReviews : produit non défini !");
    return;
  }
  
  console.log("Produit pour fetchReviews :", product.id, product.name);

  try {
    const url = `${API_BASE_URL}/products/${product.id}/avis`;
    console.log("[fetchReviews] URL :", url);

    const response = await fetch(url);
    console.log("[fetchReviews] Status :", response.status);

    const text = await response.text();
    console.log("[fetchReviews] Body brut :", text);

    if (response.ok) {
      // Si le body était du JSON valide
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("[fetchReviews] Erreur parsing JSON :", err);
        data = null;
      }
      console.log("[fetchReviews] JSON parsé :", data);

      const avis = data?.avis || [];
      console.log("[fetchReviews] Avis extraits :", avis);

      setReviews(avis);
      console.log("[fetchReviews] State reviews mis à jour !");
    } else {
      console.warn("[fetchReviews] Erreur HTTP :", response.status);
    }
  } catch (e) {
    console.error("[fetchReviews] Exception :", e);
  }
}, [product]);

// --- SUBMIT REVIEW ---
const submitReview = async () => {
  console.log("=== submitReview appelé ===");
  console.log("[submitReview] userToken :", userToken);
  console.log("[submitReview] product :", product);
  console.log("[submitReview] reviewText :", reviewText);
  console.log("[submitReview] reviewetoiles :", reviewetoiles);

  if (!userToken) {
    console.warn("[submitReview] Pas de token utilisateur !");
    return;
  }
  if (!product) {
    console.warn("[submitReview] Produit non défini !");
    return;
  }
  if (!reviewText.trim()) {
    console.warn("[submitReview] Commentaire vide !");
    return;
  }

  setIsSubmittingReview(true);
  console.log("[submitReview] isSubmittingReview = true");

  try {
    const url = `${API_BASE_URL}/products/${product.id}/avis`;
    console.log("[submitReview] URL POST :", url);

    const body = { etoiles: reviewetoiles, commentaire: reviewText };
    console.log("[submitReview] Body :", body);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(body),
    });

    console.log("[submitReview] Status :", resp.status);

    const respText = await resp.text();
    console.log("[submitReview] Body brut :", respText);

    if (resp.ok) {
      console.log("[submitReview] Review envoyée avec succès !");
      setReviewText("");
      setReviewetoiles(5);
      console.log("[submitReview] Réinitialisation reviewText et reviewetoiles");

      console.log("[submitReview] Rappel fetchReviews pour mettre à jour la liste");
      await fetchReviews();
    } else {
      console.warn("[submitReview] Erreur HTTP :", resp.status);
    }
  } catch (e) {
    console.error("[submitReview] Exception :", e);
  } finally {
    setIsSubmittingReview(false);
    console.log("[submitReview] isSubmittingReview = false");
  }
};


  // --- Rendu ---
  if (isLoading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor }}><ActivityIndicator size="large" color={tintColor} /></View>;
  if (error) return <View style={{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor }}><Text style={{ color: "red" }}>{error}</Text><Button title="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/" as Href)} color={tintColor} /></View>;
  if (!product) return <View style={{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor }}><Text style={{ color: textColor }}>Produit non trouvé</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Stack.Screen options={{
          title: product.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleWishlistToggleOnDetail} style={{ marginRight: 15 }}>
              <FontAwesome name={isInWishlist ? "heart" : "heart-o"} size={24} color={tintColor} />
            </TouchableOpacity>
          )
        }} />

        {/* Carousel */}
        <FlatList ref={flatListRef} data={product.imagesForCarousel} renderItem={renderImageItem} keyExtractor={item => String(item.id)} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} />

        {/* Détails */}
        <View style={{ padding: 15 }}>
          <Text style={{ color: textColor, fontSize: 24 }}>{product.name}</Text>
          <Text style={{ color: tintColor, fontSize: 20, marginVertical: 5 }}>{product.price}</Text>
          <Text style={{ color: textColor }}>{product.description}</Text>
          <Text style={{ color: subtleTextColor }}>Stock : {product.stock}</Text>

          {/* Avis */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: textColor, fontSize: 18 }}>Avis clients</Text>
            {reviews.length === 0 ? <Text style={{ color: subtleTextColor }}>Aucun avis pour le moment</Text> :
              reviews.map(r => (
                <View key={r.id} style={{ marginTop: 5 }}>
                  <Text style={{ color: textColor }}>{r.user_name} - {r.etoiles}/5</Text>
                  <Text style={{ color: textColor }}>{r.commentaire}</Text>
                  <Text style={{ color: subtleTextColor, fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            }
            {userToken && (
              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", marginBottom: 5 }}>
                  {[1,2,3,4,5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setReviewetoiles(i)}>
                      <FontAwesome name={i <= reviewetoiles ? "star" : "star-o"} size={24} color={tintColor} style={{ marginRight: 5 }} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput placeholder="Votre commentaire..." placeholderTextColor={subtleTextColor} value={reviewText} onChangeText={setReviewText} style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 5, marginBottom: 5, color: textColor }} multiline />
                <TouchableOpacity onPress={submitReview} disabled={isSubmittingReview || !reviewText.trim()} style={{ backgroundColor: tintColor, padding: 10, borderRadius: 5, alignItems:"center" }}>
                  <Text style={{ color: "#fff" }}>{isSubmittingReview ? "Envoi..." : "Envoyer"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {/* Ajouter au panier */}
{product.stock !== undefined && product.stock > 0 && (
  <View style={{ position: "absolute", bottom: 0, left:0, right:0, padding:15, backgroundColor }}>
    <TouchableOpacity
      onPress={handleInitialAddToCart}
      style={{ backgroundColor: tintColor, padding: 15, borderRadius: 5, alignItems:"center" }}
    >
      <Text style={{ color: "#fff", fontSize:16 }}>Ajouter au panier</Text>
    </TouchableOpacity>
  </View>
)}

    </View>
  );
}





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
  },
  carouselImage: {
    width: "100%",
    aspectRatio: 1.1,
    resizeMode: "cover",
  },
  imagePlaceholderContainer: {
    width: screenWidth,
    aspectRatio: 1.1,
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

  // ---- Section avis ----
  reviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  reviewItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  reviewUser: {
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  reviewTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 10,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});
