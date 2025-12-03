// ARTIVA/front_end/app/(tabs)/index.tsx

import React, { useState, useEffect, useCallback } from "react";
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

const API_BASE_URL = "http://192.168.11.120:3001/api";

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
        let actualProductArray = [];

        if (Array.isArray(productsForTagData)) {
          actualProductArray = productsForTagData;
        } else if (
          productsForTagData &&
          Array.isArray(productsForTagData.products)
        ) {
          actualProductArray = productsForTagData.products;
        } else {
          return null;
        }

        const adaptedProducts = actualProductArray.map((prod: any) => ({
          id: String(prod.id),
          name: prod.name || "Produit",
          price:
            prod.price !== undefined && prod.price !== null
              ? `${String(prod.price)} FCFA`
              : "N/A",
          imageUrl:
            prod.image_url ||
            `https://via.placeholder.com/150x150/BFDBFE/000?text=${encodeURIComponent(
              (prod.name || "").substring(0, 3)
            )}`,
          stock: prod.stock,
          description: prod.description,
          category_ids: (prod.category_ids || []).map((id: any) => String(id)),
          categories_names: prod.categories_names || [],
          tag_ids: prod.tag_ids || [],
          tags_names: prod.tags_names || [],
          is_published: prod.is_published,
        }));

        return {
          tagId: tagName,
          tagName,
          products: adaptedProducts,
        };
      });

      const resolved = (await Promise.all(productSectionsPromises)).filter(
        (section) => section && section.products.length > 0
      ) as TaggedProductsStore[];

      setFeaturedProductSections(resolved);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
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

  const handleCategoryPress = (categoryId: string, categoryName?: string) => {
    let path = `/category-products/${categoryId}`;
    path += `?categoryName=${encodeURIComponent(categoryName ?? `Catégorie ${categoryId}`)}`;
    router.push(path as Href);
  };

  const handleProductPress = (productId: string | number) => {
    router.push(`/product/${String(productId)}` as Href);
  };

  const handleSeeAllTagProducts = (tagName: string) => {
    router.push(`/tag/${encodeURIComponent(tagName)}` as Href);
  };

  // 🔥 Bouton WhatsApp
  const openWhatsApp = () => {
    const url = "https://wa.me/2290149326514";
    Linking.openURL(url).catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir WhatsApp.")
    );
  };

  if (
    isLoading &&
    mainCategories.length === 0 &&
    featuredProductSections.length === 0 &&
    !refreshing
  ) {
    return (
      <View style={[styles.centeredLoader, { backgroundColor: pageBackgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <DefaultText style={{ marginTop: 10, color: textColor }}>
          {t("loadingData", "Chargement des données...")}
        </DefaultText>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: pageBackgroundColor }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
        }
      >
        <Stack.Screen options={{ title: t("tabHeaders.home", "Accueil") }} />

        <View
          style={[styles.headerContainer, { borderBottomColor: cardBorderColor }]}
        >
          <DefaultText style={[styles.siteName, { color: siteNameColor }]}>
            Artiva
          </DefaultText>
          <DefaultText style={{ color: textColor, marginTop: 5 }}>
            {t("welcome")}
          </DefaultText>
        </View>

        {error && !isLoading && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: errorBgColor, borderColor: errorTextColor + "80" },
            ]}
          >
            <DefaultText style={[styles.errorText, { color: errorTextColor }]}>
              {error}
            </DefaultText>
            <Button title="Réessayer" onPress={onRefresh} color={tintColor} />
          </View>
        )}

        {(mainCategories.length > 0 || (isLoading && !refreshing)) && !error && (
          <ScrollSection<CategoryType>
            title={t("homePage.sections.categories", "Catégories")}
            data={mainCategories}
            renderItem={({ item }) => (
              <CategoryCard item={item} onPress={() => handleCategoryPress(item.id, item.name)} />
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        )}

        {!isLoading && !error && mainCategories.length === 0 && (
          <DefaultText style={[styles.noDataText, { color: noDataTextColor }]}>
            Aucune catégorie à afficher.
          </DefaultText>
        )}

        {featuredProductSections.map((section) => (
          <ScrollSection<ProductType>
            key={section.tagId.toString()}
            title={t(
              `homePage.sections.tag_${section.tagName.toLowerCase().replace(/\s+/g, "")}`,
              section.tagName
            )}
            data={section.products}
            renderItem={({ item }) => (
              <ProductCard item={item} onPress={handleProductPress} />
            )}
            keyExtractor={(item) => item.id.toString()}
            onSeeAllPress={() => handleSeeAllTagProducts(section.tagName)}
          />
        ))}

        {!isLoading &&
          !error &&
          featuredProductSections.length === 0 &&
          mainCategories.length > 0 && (
            <DefaultText style={[styles.noDataText, { color: noDataTextColor }]}>
              Découvrez bientôt nos sélections spéciales !
            </DefaultText>
          )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* --- BOUTON FLOTTANT WHATSAPP SERVICE CLIENT --- */}
      <View style={styles.fabContainer}>
        <Feather
          name="headphones"  // 🎧 Icône casque support
          size={32}
          color="#fff"
          onPress={openWhatsApp}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredLoader: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },

  siteName: {
    fontSize: 26,
    fontWeight: "700",
  },

  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },

  errorText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },

  noDataText: {
    textAlign: "center",
    marginVertical: 25,
    fontSize: 15,
    fontStyle: "italic",
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
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});
