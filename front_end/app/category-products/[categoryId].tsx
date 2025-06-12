// ARTIVA/front_end/app/category-products/[categoryId].tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Button,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
import ProductCard, { Product as ProductType } from "../../components/ProductCartcate"; // CORRECTION: Le nom du fichier est probablement ProductCard
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext"; // CHANGEMENT: Utilisation du hook d'authentification pour le thème

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **TON IP**

export default function CategoryProductsScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
  }>();
  const router = useRouter();

  // CHANGEMENT: Utilisation de useAuth pour obtenir le thème effectif
  const { effectiveAppColorScheme } = useAuth();
  const currentScheme = effectiveAppColorScheme ?? "light";
  
  // Centralisation des couleurs pour cet écran
  const colors = {
      background: Colors[currentScheme].background,
      text: Colors[currentScheme].text,
      tint: Colors[currentScheme].tint,
      errorText: Colors[currentScheme].errorText,
  };

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
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/products?category_id=${categoryId}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.message || `Erreur chargement produits (${response.status})`);
      }
      
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
          price: `${parseFloat(productPrice).toFixed(2)} FCFA`, // Formatage propre du prix
          imageUrl: prod.image_url || `https://via.placeholder.com/150x150/?text=${encodeURIComponent(productName.substring(0, 10))}`,
          stock: prod.stock,
          description: prod.description,
          category_ids: (prod.category_ids || []).map(String),
          categories_names: prod.categories_names || [],
          tags_names: prod.tags_names || [],
          is_published: prod.is_published,
        };
      });
      setProducts(adaptedProducts);

    } catch (err: any) {
      console.error("CategoryProductsScreen: Erreur fetchProductsByCategory:", err);
      setError(err.message || "Impossible de charger les produits.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, categoryName]);

  useEffect(() => {
    fetchProductsByCategory();
  }, [fetchProductsByCategory]);

  const handleProductPress = (productId: string | number) => {
    const path = `/product/${String(productId)}` as Href;
    router.push(path);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {/* CHANGEMENT: Utilisation de la couleur d'erreur du thème */}
        <Text style={{ color: colors.errorText, marginBottom: 15, textAlign: 'center' }}>{error}</Text>
        <Button
          title="Réessayer"
          onPress={fetchProductsByCategory}
          color={colors.tint}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
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
            <ProductCard item={item} onPress={handleProductPress} />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: 8, // Un peu moins d'espace pour que 2 cartes tiennent bien
    paddingTop: 10,
    paddingBottom: 20,
  },
});