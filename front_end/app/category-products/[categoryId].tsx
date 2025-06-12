// ARTIVA/front_end/app/category-products/[categoryId].tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Button,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
import ProductCard, {
  Product as ProductType,
} from "../../components/ProductCartcate"; // Import du composant ProductCard
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";

const API_BASE_URL = "http://192.168.248.151:3001/api"; // **TON IP**

export default function CategoryProductsScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"]; // Simplification pour accéder aux couleurs

  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState(
    categoryName || `Catégorie ${categoryId}`
  );

  const fetchProductsByCategory = useCallback(async () => {
    if (!categoryId) {
      setError("ID de catégorie manquant.");
      setIsLoading(false);
      return;
    }
    console.log(
      `CategoryProductsScreen: Fetching products for category ID: ${categoryId}`
    );
    setIsLoading(true);
    setError(null);
    try {
      // L'API GET /api/products accepte déjà un filtre category_id
      const response = await fetch(
        `${API_BASE_URL}/products?category_id=${categoryId}`
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(
          errorData.message ||
            `Erreur chargement produits pour catégorie (${response.status})`
        );
      }
      // L'API /products renvoie { products: [], ... }
      const dataWrapper = await response.json();
      if (!dataWrapper || !Array.isArray(dataWrapper.products)) {
        throw new Error("Format de données produits inattendu.");
      }
      const productsData = dataWrapper.products;

      const adaptedProducts = productsData.map((prod: any) => {
        const productName = prod.name || "Produit Inconnu";
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
              productName.substring(0, 10)
            )}`,
          stock: prod.stock,
          description: prod.description,
          category_ids: (prod.category_ids || []).map((id: any) => String(id)),
          categories_names: prod.categories_names || [],
          tags_names: prod.tags_names || [],
          is_published: prod.is_published,
        };
      });
      setProducts(adaptedProducts);
      console.log(
        `CategoryProductsScreen: ${adaptedProducts.length} produits chargés pour la catégorie ${categoryId}`
      );

      // Si categoryName n'a pas été passé en paramètre, on pourrait essayer de le récupérer
      // ou se contenter de l'ID. Pour l'instant, on utilise celui passé en param.
      if (
        !categoryName &&
        adaptedProducts.length > 0 &&
        adaptedProducts[0].categories_names
      ) {
        // Essayer de trouver le nom de la catégorie actuelle parmi celles des produits
        // C'est une heuristique, idéalement l'API /categories/:id nous donnerait le nom.
        // Pour l'instant, on se fie au categoryName passé en param.
      }
    } catch (err: any) {
      console.error(
        "CategoryProductsScreen: Erreur fetchProductsByCategory:",
        err
      );
      setError(
        err.message ||
          "Impossible de charger les produits pour cette catégorie."
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, categoryName]); // categoryName est une dépendance pour le titre

  useEffect(() => {
    fetchProductsByCategory();
  }, [fetchProductsByCategory]);

  const handleProductPress = (productId: string | number) => {
    const path = `/product/${String(productId)}` as Href;
    router.push(path);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error}</Text>
        <Button
          title="Réessayer"
          onPress={fetchProductsByCategory}
          color={colors.tint}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.screenContainer, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ title: pageTitle }} />
      {products.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            Aucun produit trouvé dans cette catégorie.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard item={item} onPress={handleProductPress} /> // Utilisation du composant ProductCard
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2} // Affichage en grille
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
  listContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  // Les styles du ProductCard sont définis dans le fichier ProductCard.tsx
  // Ici, on se concentre sur les styles spécifiques à la page de catégorie
});
