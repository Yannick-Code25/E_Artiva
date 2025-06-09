// ARTIVA/front_end/app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text as DefaultText,
  useColorScheme, // Gardé pour la compatibilité avec Colors, mais effectiveAppColorScheme est prioritaire
  ActivityIndicator,
  RefreshControl,
  Alert,
  Button,
  Platform,
} from "react-native";
import ScrollSection from "../../components/ScrollSection";
import CategoryCard, {
  Category as CategoryType,
} from "../../components/CategoryCard";
import ProductCard, {
  Product as ProductType,
} from "../../components/ProductCard";
import Colors from "../../constants/Colors";
import { useRouter, Href, Stack } from "expo-router"; // Stack ajouté pour l'en-tête
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **VÉIRIFIE TON IP**

interface TaggedProductsStore {
  tagId: string | number;
  tagName: string;
  products: ProductType[];
}

export default function TabAccueilScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { effectiveAppColorScheme } = useAuth(); // Source principale pour le thème

  // Déterminer les couleurs basées sur le thème effectif
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

  // Configure ici les noms exacts des tags de ta BDD que tu veux afficher
  const FEATURED_TAG_NAMES: string[] = [
    "Nouveauté",
    "Populaire",
    "Pour Vous",
    "Meilleures Ventes",
    "Promotion",
  ];
  const PRODUCTS_PER_TAG_SECTION = 5;

  const fetchData = useCallback(async () => {
    console.log("TabAccueilScreen: Appel de fetchData...");
    if (!refreshing) {
      setIsLoading(true);
    }
    setError(null);
    try {
      // 1. Charger toutes les catégories
      console.log("TabAccueilScreen: fetchCategories (toutes)...");
      const catResponse = await fetch(`${API_BASE_URL}/categories`);
      if (!catResponse.ok) {
        const errorText = await catResponse
          .text()
          .catch(() => "Impossible de lire le corps de l'erreur catégorie");
        throw new Error(
          `Erreur catégories (${catResponse.status}): ${errorText}`
        );
      }
      const allCatData = await catResponse.json();
      console.log(
        "TabAccueilScreen: Toutes les catégories brutes:",
        allCatData.length
      );

      const mainCats = allCatData
        .filter((cat: any) => cat.parent_id === null)
        .map((cat: any) => {
          const categoryName = cat.name || "Catégorie";
          return {
            id: String(cat.id),
            name: categoryName,
            imageUrl:
              cat.image_url ||
              `https://via.placeholder.com/100x100/E2E8F0/4A5568?text=${encodeURIComponent(
                categoryName.substring(0, 3)
              )}`,
          };
        });
      setMainCategories(mainCats);
      console.log(
        "TabAccueilScreen: Catégories principales traitées:",
        mainCats.length
      );

      // 2. Pour chaque tag à mettre en avant, charger quelques produits aléatoires
      const productSectionsPromises = FEATURED_TAG_NAMES.map(
        async (tagName) => {
          console.log(
            `TabAccueilScreen: fetchProducts pour tag "${tagName}"...`
          );
          // La logique pour setFeaturedProductSections a été déplacée en dehors de ce map
          const prodResponse = await fetch(
            `${API_BASE_URL}/products?tag_name=${encodeURIComponent(
              tagName
            )}&limit=${PRODUCTS_PER_TAG_SECTION}&random=true`
          );
          if (!prodResponse.ok) {
            console.warn(
              `Erreur produits pour tag "${tagName}" (${prodResponse.status}), section ignorée.`
            );
            return null;
          }
          const productsForTagData = await prodResponse.json(); // Doit être un objet { products: [] } ou un tableau

          let actualProductArray = [];
          if (Array.isArray(productsForTagData)) {
            // Si l'API renvoie directement un tableau de produits
            actualProductArray = productsForTagData;
          } else if (
            productsForTagData &&
            Array.isArray(productsForTagData.products)
          ) {
            // Si l'API renvoie un objet de pagination
            actualProductArray = productsForTagData.products;
          } else {
            console.warn(
              `Format de données produits inattendu pour tag "${tagName}", section ignorée.`
            );
            return null;
          }

          const adaptedProducts = actualProductArray.map((prod: any) => {
            const productName = prod.name || "Produit";
            const productPrice =
              prod.price !== undefined && prod.price !== null
                ? String(prod.price)
                : "N/A";
            return {
              id: String(prod.id),
              name: productName,
              price: `${productPrice} FCFA`,
              imageUrl:
                prod.image_url ||
                `https://via.placeholder.com/150x150/BFDBFE/000?text=${encodeURIComponent(
                  productName.substring(0, 3)
                )}`,
              stock: prod.stock,
              description: prod.description,
              category_ids: (prod.category_ids || []).map((id: any) =>
                String(id)
              ),
              categories_names: prod.categories_names || [],
              tag_ids: prod.tag_ids || [],
              tags_names: prod.tags_names || [],
              is_published: prod.is_published,
            };
          });
          return {
            tagId: tagName,
            tagName: tagName,
            products: adaptedProducts,
          };
        }
      );

      // Attendre que toutes les promesses de fetch par tag soient résolues
      const resolvedSectionsFromAPI = (
        await Promise.all(productSectionsPromises)
      ).filter(
        (section) => section !== null && section.products.length > 0
      ) as TaggedProductsStore[];
      setFeaturedProductSections(resolvedSectionsFromAPI); // Mettre à jour l'état UNE SEULE FOIS avec toutes les sections
      console.log(
        "TabAccueilScreen: Sections de produits par tag chargées:",
        resolvedSectionsFromAPI.length
      );
    } catch (err: any) {
      console.error(
        "TabAccueilScreen: Erreur fetchData global:",
        err.message,
        err
      );
      setError(
        err.message || "Une erreur est survenue lors du chargement des données."
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]); // FEATURED_TAG_NAMES et PRODUCTS_PER_TAG_SECTION sont des constantes hors du scope de useCallback ou stables.

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    console.log("TabAccueilScreen: onRefresh appelé");
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCategoryPress = (categoryId: string, categoryName?: string) => {
    let pathToPush = `/category-products/${categoryId}`;
    if (categoryName) {
      pathToPush += `?categoryName=${encodeURIComponent(categoryName)}`;
    } else {
      const defaultName = `Catégorie ${categoryId}`;
      pathToPush += `?categoryName=${encodeURIComponent(defaultName)}`;
    }
    router.push(pathToPush as Href);
  };

  const handleProductPress = (productId: string | number) => {
    const path = `/product/${String(productId)}` as Href;
    router.push(path);
  };

  const handleSeeAllTagProducts = (tagName: string) => {
    console.log(`Accueil: Voir tous les produits pour le tag: ${tagName}`);
    // Naviguer vers la page listant tous les produits de ce tag
    // Le nom du fichier est app/tag/[tag].tsx
    // On passe le tagName encodé comme paramètre de route.
    const path = `/tag/${encodeURIComponent(tagName)}` as Href;
    try {
      router.push(path);
      console.log(`Accueil: Navigation vers ${path}`);
    } catch (e) {
      console.error("Accueil: Erreur router.push pour tag:", e);
      Alert.alert(
        "Erreur Navigation",
        "Impossible d'afficher les produits de ce tag."
      );
    }
  };

  if (
    isLoading &&
    mainCategories.length === 0 &&
    featuredProductSections.length === 0 &&
    !refreshing
  ) {
    return (
      <View
        style={[
          styles.centeredLoader,
          { backgroundColor: pageBackgroundColor },
        ]}
      >
        <ActivityIndicator size="large" color={tintColor} />
        <DefaultText style={{ marginTop: 10, color: textColor }}>
          {t("loadingData", "Chargement des données...")}
        </DefaultText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: pageBackgroundColor }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
        />
      }
    >
      {/* Utiliser Stack.Screen ici pour configurer le titre de l'onglet Accueil */}
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
            {
              backgroundColor: errorBgColor,
              borderColor: errorTextColor + "80",
            },
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
          title={t("homePage.sections.categories", "Catégories")} // Clé de traduction pour le titre
          data={mainCategories}
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              onPress={() => handleCategoryPress(item.id, item.name)}
            />
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
            `homePage.sections.tag_${section.tagName
              .toLowerCase()
              .replace(/\s+/g, "")}`,
            section.tagName
          )} // Clé de trad. dynamique pour le tag
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
    // borderBottomColor est appliqué dynamiquement
  },
  siteName: {
    fontSize: 26,
    fontWeight: "700",
    // color est appliqué dynamiquement
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    // backgroundColor et borderColor sont appliqués dynamiquement
  },
  errorText: {
    // color est appliqué dynamiquement
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  noDataText: {
    textAlign: "center",
    marginVertical: 25,
    fontSize: 15,
    fontStyle: "italic",
    // color est appliqué dynamiquement
  },
});
