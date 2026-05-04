import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text as DefaultText,
  RefreshControl,
  Alert,
  Platform,
  Linking,
  Image,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import ScrollSection from "../../components/ScrollSection";
import CategoryCard, {
  Category as CategoryType,
} from "../../components/CategoryCard";
import ProductCard, {
  Product as ProductType,
} from "../../components/ProductCard";
import Colors from "../../constants/Colors";
import { useRouter, Href, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Feather } from "@expo/vector-icons";

const API_BASE_URL = "https://back-end-purple-log-1280.fly.dev/api";
const { width } = Dimensions.get("window");

interface TaggedProductsStore {
  tagId: string | number;
  tagName: string;
  products: ProductType[];
}

export default function TabAccueilScreen() {
  const router = useRouter();

  // ✅ Récupération user + isLoading
  const { effectiveAppColorScheme, user, isLoading } = useAuth();

  const currentScheme = effectiveAppColorScheme ?? "light";
  const pageBackgroundColor = Colors[currentScheme].background;
  const siteNameColor = Colors[currentScheme].text;
  const textColor = Colors[currentScheme].text;
  const cardBorderColor = Colors[currentScheme].cardBorder;

  const [mainCategories, setMainCategories] = useState<CategoryType[]>([]);
  const [featuredProductSections, setFeaturedProductSections] = useState<
    TaggedProductsStore[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);

  /* 🔥 CARROUSEL */
  const carouselRef = useRef<ScrollView>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselImages = [
    "https://i.pinimg.com/1200x/c5/20/51/c52051b79281ee5b9c9c6f4701cd852f.jpg",
    "https://i.pinimg.com/736x/ca/6e/82/ca6e826d10df23c7b65dc7f124353559.jpg",
    "https://i.pinimg.com/736x/dc/73/2a/dc732ae5b28015fe0790ce89085a8b3b.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (carouselIndex + 1) % carouselImages.length;
      carouselRef.current?.scrollTo({ x: next * width, animated: true });
      setCarouselIndex(next);
    }, 3500);

    return () => clearInterval(interval);
  }, [carouselIndex]);

  const FEATURED_TAG_NAMES = [
    "Nouveauté",
    "Populaire",
    "Pour Vous",
    "Meilleures Ventes",
    "Promotion",
  ];

  const PRODUCTS_PER_TAG_SECTION = 5;

  const fetchData = useCallback(async () => {
    try {
      /* CATEGORIES */
      const catRes = await fetch(`${API_BASE_URL}/categories`);
      const catData = await catRes.json();

      setMainCategories(
        catData
          .filter((c: any) => c.parent_id === null)
          .map((c: any) => ({
            id: String(c.id),
            name: c.name,
            imageUrl: c.image_url,
          }))
      );

      /* PRODUITS PAR TAG */
      const sections = await Promise.all(
        FEATURED_TAG_NAMES.map(async (tagName) => {
          const res = await fetch(
            `${API_BASE_URL}/products?tag_name=${encodeURIComponent(
              tagName
            )}&limit=${PRODUCTS_PER_TAG_SECTION}&random=true`
          );
          if (!res.ok) return null;

          const data = await res.json();
          const rawProducts = Array.isArray(data)
            ? data
            : data.products || [];

          const adaptedProducts: ProductType[] = rawProducts.map((p: any) => ({
            id: String(p.id),
            name: p.name || "Produit",
            price:
              p.price !== undefined && p.price !== null
                ? `${p.price} FCFA`
                : "N/A",
            imageUrl: p.image_url,
            stock: p.stock,
            description: p.description,
          }));

          return adaptedProducts.length > 0
            ? { tagId: tagName, tagName, products: adaptedProducts }
            : null;
        })
      );

      setFeaturedProductSections(
        sections.filter(Boolean) as TaggedProductsStore[]
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCategoryPress = (id: string, name?: string) => {
    router.push(`/category-products/${id}?categoryName=${name}` as Href);
  };

  const handleProductPress = (id: string | number) => {
    router.push(`/product/${id}` as Href);
  };

  const handleSeeAllTagProducts = (tagName: string) => {
    router.push(`/tag/${encodeURIComponent(tagName)}` as Href);
  };

  const openWhatsApp = () => {
    Linking.openURL("https://wa.me/2290149326514").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir WhatsApp.")
    );
  };

  /*** ✅ ANIMATION 👋 ***/
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [waveAnim]);

  const waveStyle = {
    transform: [
      {
        rotate: waveAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "20deg"],
        }),
      },
    ],
  };

  /*** ✅ Détermine Bonjour / Bonsoir ***/
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) return "Bonsoir";
    return "Bonjour";
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: pageBackgroundColor }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Stack.Screen options={{ title: "Accueil" }} />

        {/* 🔹 HEADER */}
        <View
          style={[
            styles.headerContainer,
            { borderBottomColor: cardBorderColor },
          ]}
        >
          <DefaultText style={[styles.siteName, { color: siteNameColor }]}>
            Artiva
          </DefaultText>

          {/* ✅ Bienvenue + nom utilisateur avec 👋 animé */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
            <DefaultText style={{ color: textColor, fontSize: 16 }}>
              {isLoading
                ? `${getGreeting()}`
                : `${getGreeting()} ${user?.name ?? ""}`}
            </DefaultText>
            <Animated.Text style={[{ fontSize: 18, marginLeft: 6 }, waveStyle]}>
              👋
            </Animated.Text>
          </View>
        </View>

        <ScrollSection<CategoryType>
          title="Catégories"
          data={mainCategories}
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              onPress={() =>
                handleCategoryPress(item.id, item.name)
              }
            />
          )}
          keyExtractor={(item) => item.id}
        />

        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
        >
          {carouselImages.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={styles.carouselImage}
            />
          ))}
        </ScrollView>

        {featuredProductSections.map((section) => (
          <ScrollSection<ProductType>
            key={section.tagId.toString()}
            title={section.tagName}
            data={section.products}
            renderItem={({ item }) => (
              <ProductCard item={item} onPress={handleProductPress} />
            )}
            keyExtractor={(item) => item.id}
            onSeeAllPress={() =>
              handleSeeAllTagProducts(section.tagName)
            }
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 🔸 BOUTON WHATSAPP */}
      <View style={styles.fabContainer}>
        <Feather
          name="headphones"
          size={32}
          color="#fff"
          onPress={openWhatsApp}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === "android" ? 40 : 30,
  },
  siteName: {
    fontSize: 26,
    fontWeight: "700",
  },
  carousel: {
    marginVertical: 15,
  },
  carouselImage: {
    width: width - 32,
    height: 180,
    borderRadius: 12,
    marginHorizontal: 16,
    resizeMode: "cover",
  },
  fabContainer: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#FF6A00",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
});
