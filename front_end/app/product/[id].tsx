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
  Modal,
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
import Constants from "expo-constants";
import { Video, ResizeMode } from 'expo-av';


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

const API_BASE_URL = "https://back-end-purple-log-1280.fly.dev/api";
  Constants.expoConfig?.extra?.API_BASE_URL ?? "https://back-end-purple-log-1280.fly.dev/api";
// J'ai gardé l'IP du fichier 1 qui semble être celle de ton backend actif

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
  const { addToWishlist, removeFromWishlist, isProductInWishlist } =
    useWishlist();

  // Thème
  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = Colors[currentScheme];
  const pageBackgroundColor = currentScheme === "dark" ? "#121212" : "#F2F2F2";
  const cardBackgroundColor = colors.background;
  const GAP_SIZE = 4; // Espacement entre les sections

  // États Produit
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États UI
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ProductImageGalleryItem>>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Pour le menu 3 points
  const [searchQuery, setSearchQuery] = useState("");

  // AJOUTE CECI : Pour stocker l'URL de l'image qu'on veut voir en grand (null = rien d'ouvert)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // États Produits Similaires / Historique
  const [similarSubCategoryProducts, setSimilarSubCategoryProducts] = useState<
    BaseProductType[]
  >([]);
  const [similarMainCategoryProducts, setSimilarMainCategoryProducts] =
    useState<BaseProductType[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<BaseProductType[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // États Avis (Venant du Fichier 1)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewetoiles, setReviewetoiles] = useState<number>(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isInWishlist = product ? isProductInWishlist(product.id) : false;


  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

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
  // --- MODIFICATION ICI : Vérification de la connexion ---
  const handleAddToCart = () => {
    if (!product) return;

    // Si pas de token (pas connecté)
    if (!userToken) {
      setCartMessage("Connectez-vous pour commander !");
      setTimeout(() => setCartMessage(null), 3000);
      return; // On arrête la fonction ici, on n'ajoute rien au panier
    }

    // Si connecté, on ajoute au panier avec la quantité choisie
    addToCart(product, quantity);
    setCartMessage("Ajouté au panier !");
    setTimeout(() => setCartMessage(null), 2000);
  };

  // --- ACTION APPEL SERVICE CLIENT ---
  const handleCallSupport = () => {
    // Remplace ce numéro par le vrai numéro du service client
    const phoneNumber = "+2290149326514";

    // Ouvre l'application téléphone
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleQuantityChange = (type: "increase" | "decrease") => {
    if (!product) return;

    if (type === "decrease") {
      if (quantity > 1) setQuantity(quantity - 1);
    } else {
      // On vérifie le stock (si stock disponible)
      if (product.stock && quantity < product.stock) {
        setQuantity(quantity + 1);
      }
    }
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

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      // On redirige vers l'accueil (ou ta page de liste) avec le paramètre de recherche
      // Adapte le chemin "/(tabs)/" si ta page d'accueil est ailleurs
      router.push(`/(tabs)/?search=${encodeURIComponent(searchQuery)}` as Href);
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
    ? (
        reviews.reduce((acc, curr) => acc + curr.etoiles, 0) / reviews.length
      ).toFixed(1)
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
      {/* 1. On cache le header par défaut */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 2. Notre Header Personnalisé */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 50,
          paddingBottom: 10,
          paddingHorizontal: 15,
          backgroundColor: pageBackgroundColor,
          zIndex: 100,
        }}
      >
        {/* Flèche Retour */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Champ de Recherche */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 20,
            paddingHorizontal: 10,
            height: 40,
            marginRight: 10,
            borderWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <Ionicons name="search" size={20} color={colors.subtleText} />
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor={colors.subtleText}
            style={{ flex: 1, marginLeft: 5, color: colors.text }}
            value={searchQuery} // 1. La valeur
            onChangeText={setSearchQuery} // 2. Mise à jour du texte
            onSubmitEditing={handleSearch} // 3. Lancer quand on appuie sur "Entrée"
            returnKeyType="search"
          />
        </View>

        {/* Panier - AFFICHÉ UNIQUEMENT SI CONNECTÉ */}
        {userToken && (
          <TouchableOpacity
            onPress={() => router.push("/cart" as Href)}
            style={{ marginRight: 15 }}
          >
            <View>
              <Ionicons name="cart-outline" size={26} color={colors.text} />
              {cartItems.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    backgroundColor: "red",
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {cartItems.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Menu 3 points */}
        <TouchableOpacity onPress={() => setIsMenuVisible(!isMenuVisible)}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Le petit Menu Déroulant (s'affiche si isMenuVisible est true) */}
      {isMenuVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 90,
              right: 15,
              backgroundColor: cardBackgroundColor,
              borderRadius: 8,
              padding: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
              zIndex: 101,
              minWidth: 150,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setIsMenuVisible(false);
                router.push("/" as Href);
              }}
              style={{
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="home-outline"
                size={20}
                color={colors.text}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: colors.text }}>Accueil</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: "#eee" }} />
            <TouchableOpacity
              onPress={() => {
                setIsMenuVisible(false);
                handleShare();
              }}
              style={{
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={colors.text}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: colors.text }}>Partager</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: "#eee" }} />
            <TouchableOpacity
              onPress={() => {
                setIsMenuVisible(false);
                isInWishlist
                  ? removeFromWishlist(product.id)
                  : addToWishlist(product);
              }}
              style={{
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <FontAwesome
                name={isInWishlist ? "heart" : "heart-o"}
                size={20}
                color={isInWishlist ? "#E74C3C" : colors.text}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: colors.text }}>
                {isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* --- BLOC 1 : CAROUSEL IMAGE (CORRIGÉ) --- */}
        <View
          style={{
            backgroundColor: "#F9F9F9",
            height: 380,
            width: screenWidth,
          }}
        >
          {product.imagesForCarousel && product.imagesForCarousel.length > 0 ? (
            <>
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
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setSelectedImage(item.image_url)}
                    style={{
                      width: screenWidth,
                      height: 380,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      // Essaye 'cover' si tu veux que ça remplisse tout, ou 'contain' pour voir l'image entière
                      resizeMode="contain"
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </TouchableOpacity>
                )}
              />
              {/* Pagination (Points) */}
              <View style={styles.dotsContainer}>
                {product.imagesForCarousel.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === activeIndex
                        ? {
                            backgroundColor: colors.tint,
                            width: 24,
                            height: 6,
                            borderRadius: 3,
                          }
                        : {
                            backgroundColor: "#D1D1D6",
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                          },
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="image-outline" size={60} color="#CCC" />
              <Text style={{ color: "#999", marginTop: 10 }}>
                Image indisponible
              </Text>
            </View>
          )}
        </View>

        {/* --- 2. MAIN INFO CARD (VERSION FINALE) --- */}
        <View style={[styles.card, { backgroundColor: "#F9F9F9", borderRadius: 8 }]}>
          
          {/* LIGNE 1 : Nom du produit (Noir, pas gras) */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "400",
              color: "black",
              marginBottom: 5,
              lineHeight: 30,
            }}
          >
            {product.name}
          </Text>

          {/* LIGNE 2 : Catégorie */}
          <Text style={{ fontSize: 14, color: colors.subtleText, marginBottom: 12 }}>
            <Text style={{fontWeight: '600'}}>Catégorie : </Text> 
            {product.categories_names && product.categories_names.length > 0
              ? product.categories_names[0]
              : "Général"}
          </Text>

          {/* LIGNE 3 : Prix + Prix Barré + Badge Promo */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            {/* Prix actuel */}
            <Text style={{ fontSize: 26, fontWeight: "bold", color: colors.tint, marginRight: 10 }}>
              {product.price}
            </Text>

            {/* Prix barré */}
            <Text
              style={{
                fontSize: 16,
                color: "#999",
                textDecorationLine: "line-through",
                marginRight: 10,
              }}
            >
              {(parseInt(product.price.replace(/\D/g, '')) * 3)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
              FCFA
            </Text>

            {/* Badge Promo Ajusté */}
            <View
              style={{
                backgroundColor: colors.tint, // Fond orange pour ressortir
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                -66%
              </Text>
            </View>
          </View>

          {/* LIGNE 4 : État du stock (Gris moyen) */}
          <View style={{ marginBottom: 10 }}>
            {product.stock && product.stock > 0 ? (
              <Text style={{ color: "#666", fontWeight: "500", fontSize: 14 }}>
                 Disponible en stock
              </Text>
            ) : (
              <Text style={{ color: "#D32F2F", fontWeight: "500", fontSize: 14 }}>
                 Actuellement indisponible
              </Text>
            )}
          </View>

          {/* LIGNE 5 : Avis (Gauche) + Icônes (Droite) */}
          <View 
            style={{ 
                flexDirection: "row", 
                justifyContent: "space-between", 
                alignItems: "center",
                // borderTopWidth: 1,      // Petite ligne de séparation
                borderTopColor: "#E0E0E0",
                paddingTop: 2
            }}
          >
            {/* GAUCHE : Étoiles + Nombre d'avis */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flexDirection: "row", marginRight: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <FontAwesome
                    key={i}
                    name={i <= Math.round(Number(averageRating)) ? "star" : "star-o"}
                    size={16}
                    color="#FFD700"
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text style={{ color: colors.subtleText, fontSize: 14 }}>
                ({reviews.length} avis)
              </Text>
            </View>

            {/* DROITE : Icônes Partage et Coeur (ORANGE) */}
            <View style={{ flexDirection: "row", gap: 20 }}>
              <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-social-outline" size={24} color={colors.tint} />
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
                  color={isInWishlist ? "#E74C3C" : colors.tint} // Coeur plein rouge, sinon Orange
                />
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* --- 3. SECTION OFFRES & SERVICES --- */}
        <View style={[styles.card, { backgroundColor: cardBackgroundColor, marginTop: GAP_SIZE }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Nos offres
          </Text>
          {/* Offre 1 : Besoin d'aide (Cliquable pour appeler) */}
          <TouchableOpacity 
            onPress={handleCallSupport}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}
          >
            <View style={{ width: 40, alignItems: 'center' }}>
                <Ionicons name="headset-outline" size={26} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                    Besoin d'aide ? Contactez le
                    <Text> </Text>
                    <Text style={{ color: colors.tint, fontWeight: 'bold' }}>
                    +229 01 49 32 65 14
                </Text>
                </Text>
                
            </View>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />

          {/* Offre 2 : Moins de frais */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
            <View style={{ width: 40, alignItems: 'center' }}>
                <Ionicons name="wallet-outline" size={26} color={colors.tint} />
            </View>
            <Text style={{ color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>
                Payez moins de frais en choisissant la livraison chez nous
            </Text>
          </View>

          {/* Séparateur */}
          <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />

          {/* Offre 3 : Livraison gratuite */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5 }}>
            <View style={{ width: 40, alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="cube-outline" size={26} color={colors.tint} />
            </View>
            <Text style={{ color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>
                Livraison gratuite sur des centaines d'articles dans les villes ci-dessous, commande minimum 10 000 FCFA
            </Text>
          </View>

        </View>

        {/* --- LIVRAISON ET RETOURS --- */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBackgroundColor, marginTop: GAP_SIZE },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Livraison et Retours
          </Text>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons
                name="car-sport-outline"
                size={20}
                color={colors.tint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Livraison estimée
              </Text>
              <Text style={[styles.infoDesc, { color: colors.subtleText }]}>
                Livré entre le {new Date().getDate() + 2} et le{" "}
                {new Date().getDate() + 5} du mois
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.card }]} />
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <MaterialIcons
                name="assignment-return"
                size={20}
                color={colors.tint}
              />
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
<View
  style={[
    styles.card,
    { backgroundColor: cardBackgroundColor, marginTop: GAP_SIZE },
  ]}
>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>
    Détails sur le produit
  </Text>

  <Text
    numberOfLines={isDescriptionExpanded ? undefined : 3}
    style={[
      styles.descriptionText,
      { color: colors.text, marginBottom: 15 },
    ]}
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

  <View
    style={{
      borderTopWidth: 1,
      borderTopColor: colors.card,
      paddingTop: 15,
    }}
  >
    <Text
      style={{
        fontSize: 14,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 10,
      }}
    >
      Présentation Vidéo
    </Text>

    {product.video_url ? (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (isPlaying) {
            videoRef.current?.pauseAsync();
          } else {
            videoRef.current?.playAsync();
          }
          setIsPlaying(!isPlaying);
        }}
        style={{
          width: "100%",
          height: 220,
          borderRadius: 12,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 15,
          overflow: "hidden",
        }}
      >
        <Video
          ref={videoRef}
          source={{ uri: product.video_url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode={ResizeMode.CONTAIN}
          isMuted={isMuted}
          shouldPlay={false}
          useNativeControls={false}
        />

        {/* ▶️ Play */}
        {!isPlaying && (
          <View
            style={{
              position: "absolute",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: 16,
              borderRadius: 50,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 22 }}>▶</Text>
          </View>
        )}

        {/* 🔊 / ⛶ */}
        <View
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setIsMuted(!isMuted)}
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#fff" }}>
              {isMuted ? "🔇" : "🔊"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              videoRef.current?.presentFullscreenPlayer()
            }
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#fff" }}>⛶</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ) : (
      <Text
        style={{
          fontStyle: "italic",
          color: colors.subtleText,
          marginBottom: 20,
        }}
      >
        Aucune vidéo disponible.
      </Text>
    )}

    <Text
      style={{
        fontSize: 14,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 10,
      }}
    >
      Détails en images
    </Text>

    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {product.imagesForCarousel.map((img, index) => (
        <TouchableOpacity
          key={index}
          style={{ marginRight: 10 }}
          onPress={() => setSelectedImage(img.image_url)}
        >
          <Image
            source={{ uri: img.image_url }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 8,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.card,
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
</View>
        {/* --- AVIS CLIENTS (Dynamique et Design) --- */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBackgroundColor, marginTop: GAP_SIZE },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Avis Clients
          </Text>

          {/* Résumé Note */}
          <View style={styles.ratingSummaryBox}>
            <View>
              <Text
                style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}
              >
                {averageRating}
                <Text style={{ fontSize: 16, color: colors.subtleText }}>
                  /5
                </Text>
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
            <Text
              style={{
                color: colors.subtleText,
                fontStyle: "italic",
                marginBottom: 15,
              }}
            >
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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: colors.text }}>
                    {review.user_name}
                  </Text>
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
                <Text style={{ color: colors.text, lineHeight: 20 }}>
                  {review.commentaire}
                </Text>
              </View>
            ))
          )}

          {/* Formulaire d'ajout d'avis */}
          {userToken ? (
           <View
  style={{
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.card,
    paddingTop: 15,
  }}
>
  <Text
    style={{
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
    }}
  >
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

  {/* Conteneur TextInput + icône */}
  <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.card, borderRadius: 8 }}>
    <TextInput
      placeholder="Partagez votre expérience..."
      placeholderTextColor={colors.subtleText}
      value={reviewText}
      onChangeText={setReviewText}
      multiline
      style={{ flex: 1, padding: 10, color: colors.text }}
    />
    <TouchableOpacity
      onPress={submitReview}
      disabled={isSubmittingReview || !reviewText.trim()}
      style={{ padding: 10 }}
    >
      {isSubmittingReview ? (
        <ActivityIndicator color={colors.tint} size="small" />
      ) : (
        <FontAwesome name="send" size={20} color={colors.tint} />
      )}
    </TouchableOpacity>
  </View>
</View>

          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login" as Href)}
              style={{
                padding: 10,
                backgroundColor: colors.card,
                borderRadius: 5,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.tint }}>
                Connectez-vous pour laisser un avis
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- PRODUITS SIMILAIRES --- */}
        {similarSubCategoryProducts.length > 0 && (
          <View
            style={{
              marginTop: GAP_SIZE,
              backgroundColor: cardBackgroundColor,
              paddingVertical: 15,
            }}
          >
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
          <View
            style={{
              marginTop: 10,
              backgroundColor: cardBackgroundColor,
              paddingVertical: 15,
            }}
          >
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
          <View
            style={{
              marginTop: GAP_SIZE,
              backgroundColor: cardBackgroundColor,
              paddingVertical: 15,
              marginBottom: 20,
            }}
          >
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
      <View
        style={[
          styles.footer,
          { backgroundColor: cardBackgroundColor, borderTopColor: colors.card },
        ]}
      >
        {cartMessage ? (
          <View
            style={[
              styles.successMessage,
              {
                backgroundColor: cartMessage.includes("panier")
                  ? "#E8F5E9"
                  : "#FFF3E0",
              },
            ]}
          >
            <Ionicons
              name={
                cartMessage.includes("panier")
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={20}
              color={cartMessage.includes("panier") ? "#2E7D32" : "#E65100"}
            />
            <Text
              style={{
                color: cartMessage.includes("panier") ? "#2E7D32" : "#E65100",
                fontWeight: "bold",
                marginLeft: 8,
              }}
            >
              {cartMessage}
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              height: 50,
              gap: 10,
            }}
          >
            {/* 1. Bouton MAISON (En premier + Contour Orange) */}
            <TouchableOpacity
              style={{
                width: 50,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.tint, // Contour Orange
                borderRadius: 8,
                backgroundColor: cardBackgroundColor,
              }}
              onPress={() => router.push("/" as Href)}
            >
              <Ionicons name="home-outline" size={24} color={colors.tint} />
            </TouchableOpacity>

            {/* 2. Bouton TÉLÉPHONE (En deuxième + Contour Orange) */}
            <TouchableOpacity
              style={{
                width: 50,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.tint, // Contour Orange
                borderRadius: 8,
                backgroundColor: cardBackgroundColor,
              }}
              onPress={handleCallSupport}
            >
              <Ionicons name="call-outline" size={24} color={colors.tint} />
            </TouchableOpacity>

            {/* 3. Bouton PRINCIPAL (Dynamique) */}
            {userToken ? (
              // --- CAS CONNECTÉ : Bouton avec + et - intégrés ---
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  backgroundColor: colors.tint,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {/* Zone Moins */}
                <TouchableOpacity
                  onPress={() => handleQuantityChange("decrease")}
                  style={{
                    width: 50,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.1)",
                  }}
                >
                  <Ionicons name="remove" size={24} color="white" />
                </TouchableOpacity>

                {/* Zone Centrale (Ajouter) */}
                <TouchableOpacity
                  onPress={handleAddToCart}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  disabled={!product.stock || product.stock <= 0}
                >
                  <Text
                    style={{ color: "white", fontSize: 14, fontWeight: "bold" }}
                  >
                    AJOUTER
                  </Text>
                  <Text
                    style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}
                  >
                    (Qté: {quantity})
                  </Text>
                </TouchableOpacity>

                {/* Zone Plus */}
                <TouchableOpacity
                  onPress={() => handleQuantityChange("increase")}
                  style={{
                    width: 50,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.1)",
                  }}
                >
                  <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              // --- CAS NON CONNECTÉ : Bouton simple ---
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.tint,
                  borderRadius: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  // borderWidth: 1,
                  // borderColor: colors.tint // Contour orange aussi ici pour harmoniser
                }}
                onPress={handleAddToCart}
              >
                <Text
                  style={{
                    color: colors.card,
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  Se connecter pour commander
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* --- MODAL IMAGE PLEIN ÉCRAN --- */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Fin du Return principal */}
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
  productName: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    flex: 1,
    marginRight: 10,
  },
  productPrice: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
    width: "100%",
    height: 180,
    backgroundColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  playButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 50,
    padding: 5,
  },
  videoText: {
    color: "white",
    marginTop: 10,
    fontWeight: "bold",
    textShadowColor: "black",
    textShadowRadius: 5,
  },

  // Avis Styles
  ratingSummaryBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 10,
    borderRadius: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer Styles
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    elevation: 20,
  },
  secondaryButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mainButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
  },
  // Ajoute ça à la fin de tes styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)", // Fond noir quasi opaque
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
});
