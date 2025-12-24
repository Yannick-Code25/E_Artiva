// ARTIVA/front_end/app/(tabs)/index.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text as DefaultText,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Button,
  Platform,
  Linking,
  Image,
  Dimensions,
} from "react-native";
import ScrollSection from "../../components/ScrollSection";
import CategoryCard, {
  Category as CategoryType,
} from "../../components/CategoryCard";
import ProductCard, { Product as ProductType } from "../../components/ProductCard";
import Colors from "../../constants/Colors";
import { useRouter, Href, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.11.103:3001/api";

const { width } = Dimensions.get("window");

interface TaggedProductsStore {
  tagId: string | number;
  tagName: string;
  products: ProductType[];
}

export default function TabAccueilScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { effectiveAppColorScheme } = useAuth();

  const currentScheme = effectiveAppColorScheme ?? "light";
  const siteNameColor = Colors[currentScheme].text;
  const pageBackgroundColor = Colors[currentScheme].background;
  const textColor = Colors[currentScheme].text;
  const tintColor = Colors[currentScheme].tint;
  const errorTextColor = Colors[currentScheme].errorText;
  const errorBgColor = Colors[currentScheme].errorBackground;
  const noDataTextColor = Colors[currentScheme].subtleText;
  const cardBorderColor = Colors[currentScheme].cardBorder;

  const [mainCategories, setMainCategories] = useState<CategoryType[]>([]);
  const [featuredProductSections, setFeaturedProductSections] = useState<
    TaggedProductsStore[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 CARROUSEL
  const carouselRef = useRef<ScrollView>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselImages = [
    "https://i.pinimg.com/1200x/c5/20/51/c52051b79281ee5b9c9c6f4701cd852f.jpg",
    "https://i.pinimg.com/736x/ca/6e/82/ca6e826d10df23c7b65dc7f124353559.jpg",
    "https://i.pinimg.com/736x/dc/73/2a/dc732ae5b28015fe0790ce89085a8b3b.jpg",
    "https://chatgpt.com/s/m_694afdc8e66881918d0737ad25b43d86",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (carouselIndex + 1) % carouselImages.length;
      carouselRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCarouselIndex(nextIndex);
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
    if (!refreshing) setIsLoading(true);
    setError(null);

    try {
      const catResponse = await fetch(`${API_BASE_URL}/categories`);
      if (!catResponse.ok) {
        const errorText = await catResponse.text();
        throw new Error(`Erreur catégories (${catResponse.status}): ${errorText}`);
      }

      const allCatData = await catResponse.json();
      const mainCats = allCatData
        .filter((cat: any) => cat.parent_id === null)
        .map((cat: any) => ({
          id: String(cat.id),
          name: cat.name || "Catégorie",
          imageUrl:
            cat.image_url ||
            `https://via.placeholder.com/100x100/E2E8F0/4A5568?text=${encodeURIComponent(
              (cat.name || "Cat").substring(0, 3)
            )}`,
        }));

      setMainCategories(mainCats);

      const productSectionsPromises = FEATURED_TAG_NAMES.map(async (tagName) => {
        const prodResponse = await fetch(
          `${API_BASE_URL}/products?tag_name=${encodeURIComponent(
            tagName
          )}&limit=${PRODUCTS_PER_TAG_SECTION}&random=true`
        );

        if (!prodResponse.ok) return null;

        const productsForTagData = await prodResponse.json();
        const actualProductArray = Array.isArray(productsForTagData)
          ? productsForTagData
          : productsForTagData.products || [];

        const adaptedProducts = actualProductArray.map((prod: any) => ({
          id: String(prod.id),
          name: prod.name || "Produit",
          price: prod.price ? `${prod.price} FCFA` : "N/A",
          imageUrl: prod.image_url,
          stock: prod.stock,
          description: prod.description,
        }));

        return { tagId: tagName, tagName, products: adaptedProducts };
      });

      const resolved = (await Promise.all(productSectionsPromises)).filter(
        (s) => s && s.products.length > 0
      ) as TaggedProductsStore[];

      setFeaturedProductSections(resolved);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCategoryPress = (id: string, name?: string) => {
    router.push(`/category-products/${id}?categoryName=${name}` as Href);
  };

  const handleProductPress = (id: string | number) => {
    router.push(`/product/${id}` as Href);
  };

  const openWhatsApp = () => {
    Linking.openURL("https://wa.me/2290149326514").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir WhatsApp.")
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: pageBackgroundColor }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Stack.Screen options={{ title: "Accueil" }} />

        {/* HEADER */}
        <View style={[styles.headerContainer, { borderBottomColor: cardBorderColor }]}>
          <DefaultText style={[styles.siteName, { color: siteNameColor }]}>
            Artiva
          </DefaultText>
          <DefaultText style={[styles.welcomeText, { color: textColor }]}>
            Bienvenue !
          </DefaultText>
        </View>

        {/* CATEGORIES */}
        <ScrollSection<CategoryType>
          title="Catégories"
          data={mainCategories}
          renderItem={({ item }) => (
            <CategoryCard item={item} onPress={() => handleCategoryPress(item.id, item.name)} />
          )}
          keyExtractor={(item) => item.id}
        />

        {/* 🔥 CARROUSEL IMAGES */}
{/* 🔥 CARROUSEL IMAGES */}
<ScrollView
  ref={carouselRef}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ alignItems: "center" }} // centre verticalement si besoin
  style={styles.carousel}
>
  {carouselImages.map((img, index) => (
    <Image
      key={index}
      source={{ uri: img }}
      style={styles.carouselImage}
    />
  ))}
</ScrollView>


        {/* PRODUITS */}
        {featuredProductSections.map((section) => (
          <ScrollSection<ProductType>
            key={section.tagId.toString()}
            title={section.tagName}
            data={section.products}
            renderItem={({ item }) => (
              <ProductCard item={item} onPress={handleProductPress} />
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* WHATSAPP */}
      <View style={styles.fabContainer}>
        <Feather name="headphones" size={32} color="#fff" onPress={openWhatsApp} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
headerContainer: {
  padding: 16,
  borderBottomWidth: 1,
  paddingTop: Platform.OS === "android" ? 40 : 30, // ici on augmente l’espace en haut
},

  siteName: { fontSize: 26, fontWeight: "700" },
  welcomeText: {
    fontSize: 16,
    marginTop: 5,
  },

  carousel: {
    marginVertical: 15,
  },
carouselImage: {
  width: width - 32, // marge de chaque côté
  height: 180,
  resizeMode: "cover",
  borderRadius: 12,
  marginHorizontal: 16, // pour laisser un petit espace à gauche/droite
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
