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
  FlatList,
  TextInput, // Ajouté pour le formulaire
  Share,
  Linking,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { Product as BaseProductType } from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import ScrollSection from "../../components/ScrollSection";
import ProductCard from "../../components/ProductCard";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- INTERFACES ---

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
  video_url?: string;
}

interface ProductDetail extends BaseProductType {
  imagesForCarousel: ProductImageGalleryItem[];
  video_url?: string;
}

interface ViewableItemInfo<T> {
  item: T;
  key: string;
  index: number | null;
  isViewable: boolean;
}

// Interface réelle venant de l'API (Fichier 1)
interface Review {
  id: string | number;
  user_name: string;
  etoiles: number;
  commentaire: string;
  created_at: string;
}

// --- CONSTANTES ---

// J'ai gardé l'IP du fichier 1 qui semble être celle de ton backend actif
const API_BASE_URL = "http://192.168.11.120:3001/api"; 
const { width: screenWidth } = Dimensions.get("window");

const formatPriceForDisplay = (
  price: string | number | undefined | null,
  currency: string = "FCFA"
): string => {
  if (price === undefined || price === null || String(price).trim() === "")
    return "N/A";
  const numericPrice = parseFloat(String(price));
  if (isNaN(numericPrice)) return "Prix invalide";
  return `${numericPrice
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency}`;
};

export default function ProductDetailScreen() {
  // Hooks
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { effectiveAppColorScheme, userToken } = useAuth(); // Ajout userToken
  const { cartItems, addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isProductInWishlist } = useWishlist();

  // Thème
  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = Colors[currentScheme];
  const pageBackgroundColor = currentScheme === "dark" ? "#121212" : "#F2F2F2";
  const cardBackgroundColor = colors.background;
  const GAP_SIZE = 10; // Espacement entre les sections

  // États Produit
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États UI
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ProductImageGalleryItem>>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // États Produits Similaires / Historique
  const [similarSubCategoryProducts, setSimilarSubCategoryProducts] = useState<BaseProductType[]>([]);
  const [similarMainCategoryProducts, setSimilarMainCategoryProducts] = useState<BaseProductType[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<BaseProductType[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // États Avis (Venant du Fichier 1)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewetoiles, setReviewetoiles] = useState<number>(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isInWishlist = product ? isProductInWishlist(product.id) : false;

  // --- 1. CHARGEMENT PRODUIT ---
  const fetchProductDetails = useCallback(async () => {
    if (!routeId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${routeId}`);
      if (!response.ok) throw new Error("Erreur chargement");
      const dataFromApi = (await response.json()) as ProductDetailAPIResponse;

      let mainImageUrlForCard: string =
        dataFromApi.main_image_url || `https://via.placeholder.com/150`;
      let carouselImages: ProductImageGalleryItem[] = [];

      if (dataFromApi.images && dataFromApi.images.length > 0) {
        carouselImages = dataFromApi.images.sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        );
        const primaryApiImage = carouselImages.find((img) => img.is_primary);
        mainImageUrlForCard =
          primaryApiImage?.image_url || carouselImages[0].image_url;
      } else if (dataFromApi.main_image_url) {
        carouselImages = [
          {
            id: `main_${dataFromApi.id}`,
            image_url: dataFromApi.main_image_url,
            is_primary: true,
          },
        ];
      }

      setProduct({
        id: String(dataFromApi.id),
        name: dataFromApi.name || "Produit",
        price: formatPriceForDisplay(dataFromApi.price),
        imageUrl: mainImageUrlForCard,
        stock: dataFromApi.stock,
        description: dataFromApi.description,
        is_published: dataFromApi.is_published,
        category_ids: dataFromApi.category_ids || [],
        categories_names: dataFromApi.categories_names || [],
        tag_ids: dataFromApi.tag_ids || [],
        tags_names: dataFromApi.tags_names || [],
        imagesForCarousel: carouselImages,
        video_url: dataFromApi.video_url,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  // --- 2. CHARGEMENT AVIS (Logique Fichier 1) ---
  const fetchReviews = useCallback(async () => {
    if (!product) return;
    try {
      const url = `${API_BASE_URL}/products/${product.id}/avis`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // S'assurer que 'data.avis' existe, sinon tableau vide
        setReviews(data.avis || []);
      }
    } catch (e) {
      console.error("Erreur fetchReviews :", e);
    }
  }, [product]);

  // --- 3. CHARGEMENT SIMILAIRES & HISTORIQUE ---
  const fetchSimilarProducts = useCallback(async () => {
    if (!product || !product.category_ids?.[0]) return;
    setIsLoadingSimilar(true);
    try {
      const subCatResponse = await fetch(
        `${API_BASE_URL}/products?category_id=${product.category_ids[0]}&limit=6`
      );
      if (subCatResponse.ok) {
        const data = await subCatResponse.json();
        setSimilarSubCategoryProducts(
          (data.products || [])
            .filter((p: any) => String(p.id) !== String(product.id))
            .map((p: any) => ({
              id: String(p.id),
              name: p.name,
              price: formatPriceForDisplay(p.price),
              imageUrl: p.image_url || "https://via.placeholder.com/150",
              stock: p.stock,
            }))
        );
      }
      const popResponse = await fetch(
        `${API_BASE_URL}/products?tag_name=Populaire&limit=6&random=true`
      );
      if (popResponse.ok) {
        const data = await popResponse.json();
        setSimilarMainCategoryProducts(
          (data.products || [])
            .filter((p: any) => String(p.id) !== String(product.id))
            .map((p: any) => ({
              id: String(p.id),
              name: p.name,
              price: formatPriceForDisplay(p.price),
              imageUrl: p.image_url || "https://via.placeholder.com/150",
              stock: p.stock,
            }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, [product]);

  const handleRecentHistory = useCallback(async () => {
    if (!product) return;
    try {
      const jsonValue = await AsyncStorage.getItem("@recently_viewed");
      let history: BaseProductType[] =
        jsonValue != null ? JSON.parse(jsonValue) : [];
      const historyForDisplay = history.filter(
        (item) => String(item.id) !== String(product.id)
      );
      setRecentlyViewed(historyForDisplay);
      const newHistory = history.filter(
        (item) => String(item.id) !== String(product.id)
      );
      const productSummary: BaseProductType = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      };
      newHistory.unshift(productSummary);
      if (newHistory.length > 10) newHistory.pop();
      await AsyncStorage.setItem(
        "@recently_viewed",
        JSON.stringify(newHistory)
      );
    } catch (e) {
      console.error("Erreur historique", e);
    }
  }, [product]);

  // Déclencher les effets secondaires quand 'product' change
  useEffect(() => {
    if (product) {
      fetchReviews(); // On charge les avis
      fetchSimilarProducts();
      handleRecentHistory();
    }
  }, [product, fetchReviews, fetchSimilarProducts, handleRecentHistory]);

  // --- 4. SOUMETTRE UN AVIS (Logique Fichier 1) ---
  const submitReview = async () => {
    if (!userToken || !product || !reviewText.trim()) return;
    setIsSubmittingReview(true);
    try {
      const url = `${API_BASE_URL}/products/${product.id}/avis`;
      const body = { etoiles: reviewetoiles, commentaire: reviewText };
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        setReviewText("");
        setReviewetoiles(5);
        await fetchReviews(); // Recharger les avis
      } else {
        alert("Erreur lors de l'envoi de l'avis");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // --- AUTRES ACTIONS ---
  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    setCartMessage("Ajouté au panier !");
    setTimeout(() => setCartMessage(null), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Regarde ce produit sur Artiva : ${product?.name} - ${product?.price}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // --- RENDU HELPER ---
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  // Calcul moyenne notes
  const averageRating = reviews.length
    ? (reviews.reduce((acc, curr) => acc + curr.etoiles, 0) / reviews.length).toFixed(1)
    : "N/A";

  if (isLoading)
    return (
      <View style={[styles.centered, { backgroundColor: pageBackgroundColor }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  if (!product)
    return (
      <View style={[styles.centered, { backgroundColor: pageBackgroundColor }]}>
        <Text style={{ color: colors.text }}>Produit introuvable</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: pageBackgroundColor }}>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: pageBackgroundColor },
          headerShadowVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 15, marginRight: 10 }}>
              <TouchableOpacity onPress={handleShare}>
                <Ionicons
                  name="share-social-outline"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  isInWishlist
                    ? removeFromWishlist(product.id)
                    : addToWishlist(product)
                }
              >
                <FontAwesome
                  name={isInWishlist ? "heart" : "heart-o"}
                  size={24}
                  color={isInWishlist ? "#E74C3C" : colors.text}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* --- CAROUSEL --- */}
        <View style={{ backgroundColor: cardBackgroundColor }}>
          <FlatList
            ref={flatListRef}
            data={product.imagesForCarousel}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View
                style={{
                  width: screenWidth,
                  height: 350,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: "90%", height: "90%", resizeMode: "contain" }}
                />
              </View>
            )}
          />
          {product.imagesForCarousel.length > 1 && (
            <View style={styles.dotsContainer}>
              {product.imagesForCarousel.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeIndex
                      ? { backgroundColor: colors.tint, width: 20 }
                      : { backgroundColor: "#ccc" },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* --- MAIN INFO CARD --- */}
        <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Text style={[styles.productName, { color: colors.text }]}>
              {product.name}
            </Text>
            {/* Badge de stock */}
            {product.stock && product.stock > 0 ? (
              <View style={styles.inStockBadge}>
                <Text style={styles.inStockText}>En stock</Text>
              </View>
            ) : (
              <View
                style={[styles.inStockBadge, { backgroundColor: "#ffebee" }]}
              >
                <Text
                  style={{ color: "#d32f2f", fontSize: 10, fontWeight: "bold" }}
                >
                  Rupture
                </Text>
              </View>
            )}
          </View>

          {/* Note globale dynamique */}
          <View style={styles.ratingContainer}>
            <View style={{ flexDirection: "row" }}>
              <FontAwesome name="star" size={14} color="#FFD700" />
            </View>
            <Text
              style={{ color: colors.subtleText, fontSize: 12, marginLeft: 5 }}
            >
              {averageRating}/5 • {reviews.length} avis
            </Text>
          </View>

          <Text style={[styles.productPrice, { color: colors.tint }]}>
            {product.price}
          </Text>

          {/* Tags Catégories */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
            {product.categories_names?.map((cat, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.card,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: colors.subtleText, fontSize: 10 }}>
                  {cat}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- LIVRAISON ET RETOURS --- */}
        <View style={[styles.card, { backgroundColor: cardBackgroundColor, marginTop: GAP_SIZE }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Livraison et Retours
          </Text>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="car-sport-outline" size={20} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Livraison estimée
              </Text>
              <Text style={[styles.infoDesc, { color: colors.subtleText }]}>
                Livré entre le {new Date().getDate() + 2} et le {new Date().getDate() + 5} du mois
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.card }]} />
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <MaterialIcons name="assignment-return" size={20} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Politique de retour
              </Text>
              <Text style={[styles.infoDesc, { color: colors.subtleText }]}>
                Retour gratuit sous 7 jours en cas de pépin.
              </Text>
            </View>
          </View>
        </View>

        {/* --- DESCRIPTION & VIDEO --- */}
        <View style={[styles.card, { backgroundColor: cardBackgroundColor, marginTop: GAP_SIZE }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Description
          </Text>

          <Text
            numberOfLines={isDescriptionExpanded ? undefined : 3}
            style={[styles.descriptionText, { color: colors.text, marginBottom: 15 }]}
          >
            {product.description || "Aucune description disponible."}
          </Text>

          {product.description && product.description.length > 100 && (
            <TouchableOpacity
              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              style={{ marginBottom: 15 }}
            >
              <Text style={{ color: colors.tint, fontWeight: "600" }}>
                {isDescriptionExpanded ? "Masquer la description" : "Lire la suite"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: colors.card, paddingTop: 15 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text, marginBottom: 10 }}>
              Présentation Vidéo
            </Text>

            {product.video_url ? (
              <TouchableOpacity
                onPress={() => {
                  if (product.video_url) Linking.openURL(product.video_url);
                }}
                style={styles.videoPlaceholder}
              >
                <Image
                  source={{ uri: product.imageUrl }}
                  style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.6 }}
                  blurRadius={4}
                />
                <View style={styles.playButton}>
                  <Ionicons name="play-circle" size={60} color="white" />
                </View>
                <Text style={styles.videoText}>Regarder la vidéo</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ fontStyle: "italic", color: colors.subtleText, marginBottom: 20 }}>
                Aucune vidéo disponible.
              </Text>
            )}

            <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text, marginBottom: 10 }}>
              Détails en images
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {product.imagesForCarousel.map((img, index) => (
                <View key={index} style={{ marginRight: 10 }}>
                  <Image
                    source={{ uri: img.image_url }}
                    style={{
                      width: 120, height: 120, borderRadius: 8,
                      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.card
                    }}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* --- AVIS CLIENTS (Dynamique et Design) --- */}
        <View style={[styles.card, { backgroundColor: cardBackgroundColor, marginTop: GAP_SIZE }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Avis Clients</Text>

          {/* Résumé Note */}
          <View style={styles.ratingSummaryBox}>
            <View>
              <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
                {averageRating}<Text style={{ fontSize: 16, color: colors.subtleText }}>/5</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtleText }}>
                Basé sur {reviews.length} avis
              </Text>
            </View>
            <View style={{ marginLeft: 20 }}>
              <View style={{ flexDirection: "row", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <FontAwesome key={i} name="star" size={18} color="#FFD700" />
                ))}
              </View>
            </View>
          </View>

          {/* Liste des avis */}
          {reviews.length === 0 ? (
            <Text style={{ color: colors.subtleText, fontStyle: "italic", marginBottom: 15 }}>
              Soyez le premier à donner votre avis !
            </Text>
          ) : (
            reviews.map((review, index) => (
              <View
                key={review.id}
                style={{
                  marginBottom: 15,
                  borderBottomWidth: index !== reviews.length - 1 ? 1 : 0,
                  borderBottomColor: colors.card,
                  paddingBottom: index !== reviews.length - 1 ? 15 : 0,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                  <Text style={{ fontWeight: "bold", color: colors.text }}>{review.user_name}</Text>
                  <Text style={{ fontSize: 12, color: colors.subtleText }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 5 }}>
                  {[...Array(5)].map((_, i) => (
                    <FontAwesome
                      key={i}
                      name={i < review.etoiles ? "star" : "star-o"}
                      size={12}
                      color="#FFD700"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
                <Text style={{ color: colors.text, lineHeight: 20 }}>{review.commentaire}</Text>
              </View>
            ))
          )}

          {/* Formulaire d'ajout d'avis */}
          {userToken ? (
            <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: colors.card, paddingTop: 15 }}>
              <Text style={{ fontWeight: "bold", color: colors.text, marginBottom: 10 }}>
                Laisser un avis
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity key={i} onPress={() => setReviewetoiles(i)}>
                    <FontAwesome
                      name={i <= reviewetoiles ? "star" : "star-o"}
                      size={24}
                      color={colors.tint}
                      style={{ marginRight: 8 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                placeholder="Partagez votre expérience..."
                placeholderTextColor={colors.subtleText}
                value={reviewText}
                onChangeText={setReviewText}
                style={[styles.reviewInput, { color: colors.text, borderColor: colors.card }]}
                multiline
              />
              <TouchableOpacity
                onPress={submitReview}
                disabled={isSubmittingReview || !reviewText.trim()}
                style={[styles.submitButton, { backgroundColor: colors.tint }]}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Publier l'avis</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => router.push("/(auth)/login" as Href)}
              style={{ padding: 10, backgroundColor: colors.card, borderRadius: 5, alignItems: 'center' }}
            >
              <Text style={{ color: colors.tint }}>Connectez-vous pour laisser un avis</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- PRODUITS SIMILAIRES --- */}
        {similarSubCategoryProducts.length > 0 && (
          <View style={{ marginTop: GAP_SIZE, backgroundColor: cardBackgroundColor, paddingVertical: 15 }}>
            <ScrollSection
              title="Produits similaires"
              data={similarSubCategoryProducts}
              renderItem={({ item }) => (
                <ProductCard
                  item={item}
                  onPress={() => router.push(`/product/${item.id}` as Href)}
                />
              )}
              keyExtractor={(item) => `sim-${item.id}`}
            />
          </View>
        )}

        {/* --- VOUS POURRIEZ AIMER --- */}
        {similarMainCategoryProducts.length > 0 && (
          <View style={{ marginTop: 10, backgroundColor: cardBackgroundColor, paddingVertical: 15 }}>
            <ScrollSection
              title="Vous pourriez aimer"
              data={similarMainCategoryProducts}
              renderItem={({ item }) => (
                <ProductCard
                  item={item}
                  onPress={() => router.push(`/product/${item.id}` as Href)}
                />
              )}
              keyExtractor={(item) => `like-${item.id}`}
            />
          </View>
        )}

        {/* --- CONSULTÉ RÉCEMMENT --- */}
        {recentlyViewed.length > 0 && (
          <View style={{ marginTop: GAP_SIZE, backgroundColor: cardBackgroundColor, paddingVertical: 15, marginBottom: 20 }}>
            <ScrollSection
              title="Consulté récemment"
              data={recentlyViewed}
              renderItem={({ item }) => (
                <ProductCard
                  item={item}
                  onPress={() => router.push(`/product/${item.id}` as Href)}
                />
              )}
              keyExtractor={(item) => `recent-${item.id}`}
            />
          </View>
        )}
      </ScrollView>

      {/* --- FOOTER (STICKY) --- */}
      <View style={[styles.footer, { backgroundColor: cardBackgroundColor, borderTopColor: colors.card }]}>
        {cartMessage ? (
          <View style={[styles.successMessage, { backgroundColor: colors.successBackground }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.successText} />
            <Text style={{ color: colors.successText, fontWeight: "bold", marginLeft: 8 }}>
              {cartMessage}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.tint }]}>
              <Ionicons name="call-outline" size={24} color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mainButton,
                { backgroundColor: product.stock && product.stock > 0 ? colors.tint : "#ccc" },
              ]}
              onPress={handleAddToCart}
              disabled={!product.stock || product.stock <= 0}
            >
              <Text style={styles.mainButtonText}>
                {product.stock && product.stock > 0 ? "Ajouter au panier" : "Indisponible"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 15,
  },
  dot: { height: 6, width: 6, borderRadius: 3, marginHorizontal: 3 },
  productName: { fontSize: 18, fontWeight: "700", lineHeight: 24, flex: 1, marginRight: 10 },
  productPrice: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  descriptionText: { fontSize: 14, lineHeight: 22 },
  inStockBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  inStockText: { color: "#2e7d32", fontSize: 10, fontWeight: "bold" },
  ratingContainer: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  iconBox: { width: 40, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: 14, fontWeight: "600" },
  infoDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, width: "100%", marginVertical: 4 },
  
  // Video Styles
  videoPlaceholder: {
    width: "100%", height: 180, backgroundColor: "#000", borderRadius: 8,
    justifyContent: "center", alignItems: "center", marginBottom: 20, overflow: "hidden"
  },
  playButton: { backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 50, padding: 5 },
  videoText: { color: "white", marginTop: 10, fontWeight: "bold", textShadowColor: "black", textShadowRadius: 5 },

  // Avis Styles
  ratingSummaryBox: {
    flexDirection: "row", alignItems: "center", marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.03)", padding: 10, borderRadius: 8
  },
  reviewInput: {
    borderWidth: 1, borderRadius: 6, padding: 10,
    marginBottom: 10, height: 80, textAlignVertical: "top"
  },
  submitButton: { padding: 12, borderRadius: 6, alignItems: "center", justifyContent: "center" },

  // Footer Styles
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, elevation: 20
  },
  secondaryButton: { padding: 12, borderWidth: 1, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  mainButton: { flex: 1, flexDirection: "row", paddingVertical: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  mainButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  successMessage: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 15, borderRadius: 8 },
});