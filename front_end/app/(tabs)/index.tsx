// ARTIVA/front_end/app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text as DefaultText, // Renommé pour éviter conflit si tu as un composant Text personnalisé
  useColorScheme,
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
import { useRouter, Href } from "expo-router";
// import { useAuth } from '../../context/AuthContext'; // Non utilisé directement ici, mais disponible

// **ATTENTION: REMPLACE 'VOTRE_ADRESSE_IP_LOCALE' PAR TON IP RÉELLE**
const API_BASE_URL = "http://192.168.1.2:3001/api"; // Exemple, mets la tienne

interface TaggedProductsStore {
  tagId: string | number; // Peut être l'ID du tag si tu le récupères
  tagName: string;
  products: ProductType[];
}

export default function TabAccueilScreen() {
  const router = useRouter();

  const colorScheme = useColorScheme();
  const siteNameColor = Colors[colorScheme ?? "light"].text;
  const pageBackgroundColor = Colors[colorScheme ?? "light"].background;
  const textColor = Colors[colorScheme ?? "light"].text;
  const tintColor = Colors[colorScheme ?? "light"].tint;

  const [mainCategories, setMainCategories] = useState<CategoryType[]>([]);
  const [featuredProductSections, setFeaturedProductSections] = useState<
    TaggedProductsStore[]
  >([]);

  // Configure ici les noms exacts des tags de ta BDD que tu veux afficher
  const FEATURED_TAG_NAMES: string[] = ["Nouveaute", "Populaire", "Pour Vous"]; //Utiliser sa pour afficher choisir les tags qui devront apparait sur la page d'accueil
  const PRODUCTS_PER_TAG_SECTION = 5;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    console.log("TabAccueilScreen: Appel de fetchData pour l'accueil...");
    // Ne mettre setIsLoading(true) que si ce n'est pas un refresh, pour éviter que le loader plein écran ne s'affiche pendant le refresh
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
        .filter((cat: any) => cat.parent_id === null) // Garder seulement les catégories principales
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
          // L'API /products renvoie directement un tableau de produits (ou un objet avec une clé products si tu as la pagination)
          // On suppose ici que si tag_name est utilisé, l'API renvoie directement le tableau de produits filtrés.
          // Si elle renvoie {products: [...]}, il faut adapter prodData.map plus bas.
          const productsForTag = await prodResponse.json();

          // Vérifier si productsForTag est bien un tableau (si l'API renvoie direct un tableau)
          // ou si c'est un objet avec une clé 'products' (si l'API renvoie un objet de pagination)
          let actualProductArray = [];
          if (Array.isArray(productsForTag)) {
            actualProductArray = productsForTag;
          } else if (productsForTag && Array.isArray(productsForTag.products)) {
            actualProductArray = productsForTag.products;
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
              price: `${productPrice} FCFA`, // Ou utilise ta fonction formatPrice
              imageUrl:
                prod.image_url ||
                `https://via.placeholder.com/150x150/BFDBFE/000?text=${encodeURIComponent(
                  productName.substring(0, 3)
                )}`,
              stock: prod.stock,
              description: prod.description,
              category_ids: prod.category_ids || [],
              categories_names: prod.categories_names || [],
              tag_ids: prod.tag_ids || [],
              tags_names: prod.tags_names || [],
              is_published: prod.is_published,
            };
          });
          // Tu pourrais vouloir l'ID du tag ici si tu l'as dans la réponse ou si tu fais un autre appel pour les tags
          return {
            tagId: tagName,
            tagName: tagName,
            products: adaptedProducts,
          };
        }
      );

      const resolvedSections = (
        await Promise.all(productSectionsPromises)
      ).filter(
        (section) => section !== null && section.products.length > 0
      ) as TaggedProductsStore[];
      setFeaturedProductSections(resolvedSections);
      console.log(
        "TabAccueilScreen: Sections de produits par tag chargées:",
        resolvedSections.length
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
      // Ne pas vider les données existantes en cas d'erreur de refresh pour une meilleure UX
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]); // Dépend de refreshing pour que le premier setIsLoading ne s'active pas pendant un refresh

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    console.log("TabAccueilScreen: onRefresh appelé");
    setRefreshing(true); // Cela va déclencher un re-rendu, et l'effet ci-dessus ne mettra pas setIsLoading(true)
    fetchData();
  }, [fetchData]);

  const handleCategoryPress = (categoryId: string, categoryName?: string) => {
    // categoryId est l'ID de la catégorie sur laquelle l'utilisateur a cliqué.
    // categoryName est le nom de cette catégorie (optionnel, mais utile pour le titre de la page suivante).

    console.log('Accueil: Catégorie cliquée - ID:', categoryId, 'Nom:', categoryName);

    // Construire le chemin vers la page qui affichera les produits de cette catégorie.
    // Le nom du fichier pour cette page est `app/category-products/[categoryId].tsx`
    // Donc, la route sera de la forme `/category-products/ID_DE_LA_CATEGORIE`
    const path = `/category-products/${categoryId}` as Href; 

    // Utiliser router.push pour naviguer.
    // On peut passer des paramètres supplémentaires (comme categoryName) via la propriété 'params'.
    // Ces paramètres seront accessibles sur la page de destination via `useLocalSearchParams`.
    router.push(`/category-products/${categoryId}` as Href);
  };

  const handleProductPress = (productId: string | number) => {
    console.log("Navigation vers produit ID:", productId);
    const path = `/product/${String(productId)}` as Href;
    router.push(path);
  };

  const handleSeeAllTagProducts = (tagName: string) => {
    Alert.alert(
      "Voir tout par Tag",
      `Redirection pour le tag: ${tagName} (à implémenter)`
    );
    // const path = `/tag/${encodeURIComponent(tagName)}/products` as Href;
    // router.push(path);
  };

  // Loader pour le premier chargement uniquement
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
          Chargement...
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
      <View style={styles.headerContainer}>
        <DefaultText style={[styles.siteName, { color: siteNameColor }]}>
          Artiva
        </DefaultText>
      </View>

      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <DefaultText style={styles.errorText}>{error}</DefaultText>
          <Button title="Réessayer" onPress={onRefresh} color={tintColor} />
        </View>
      )}

      {/* Section des Catégories Principales */}
      {(mainCategories.length > 0 || (isLoading && !refreshing)) && !error && (
        <ScrollSection<CategoryType>
          title="Catégories"
          data={mainCategories}
          renderItem={({ item }) => (
            <CategoryCard item={item} onPress={() => handleCategoryPress(item.id, item.name)} />
          )}
          keyExtractor={(item) => item.id.toString()}
          // onSeeAllPress={() => router.push('/all-categories' as Href)}
        />
      )}
      {!isLoading && !error && mainCategories.length === 0 && (
        <DefaultText style={styles.noDataText}>
          Aucune catégorie à afficher.
        </DefaultText>
      )}

      {/* Sections de Produits par Tag */}
      {featuredProductSections.map((section) => (
        <ScrollSection<ProductType>
          key={section.tagId.toString()}
          title={section.tagName}
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
          <DefaultText style={styles.noDataText}>
            Découvrez bientôt nos sélections spéciales !
          </DefaultText>
        )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 30, // Plus d'espace pour la barre de statut
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  siteName: {
    fontSize: 26,
    fontWeight: "700",
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 15,
    padding: 15,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  noDataText: {
    textAlign: "center",
    color: "#757575",
    marginVertical: 25,
    fontSize: 15,
    fontStyle: "italic",
  },
});
