// ARTIVA/front_end/app/tag/[tag].tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Button,
  Platform,
  TouchableOpacity, // Import TouchableOpacity pour le bouton
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
import ProductCard, {
  Product as ProductType,
} from "../../components/ProductCarttag";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext"; // Pour le thème
import { useTranslation } from "react-i18next"; // Pour la traduction

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **TON IP**

export default function ProductsByTagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const router = useRouter();
  const { effectiveAppColorScheme } = useAuth();
  const { t } = useTranslation(); // Hook de traduction

  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = Colors[currentScheme]; // Accès direct aux couleurs du thème

  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState(
    tag ? `${t('tagScreen.titlePrefix', 'Produits :')} ${decodeURIComponent(tag)}` : t('tagScreen.defaultTitle', 'Produits par Tag')
  );

  const fetchProductsByTag = useCallback(async () => {
    if (!tag) {
      setError(t('tagScreen.missingTag', 'Nom du tag manquant.'));
      setIsLoading(false);
      return;
    }
    console.log(`ProductsByTagScreen: Fetching products for tag: ${tag}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/products?tag_name=${encodeURIComponent(tag)}&limit=50`
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(
          errorData.message ||
            t('tagScreen.fetchError', 'Erreur chargement produits pour tag')
        );
      }
      const dataWrapper = await response.json();
      if (!dataWrapper || !Array.isArray(dataWrapper.products)) {
        throw new Error(t('tagScreen.invalidData', 'Format de données produits inattendu.'));
      }
      const productsData = dataWrapper.products;

      const adaptedProducts = productsData.map((prod: any) => {
        const productName = prod.name || t('tagScreen.unknownProduct', 'Produit Inconnu');
        const productPrice =
          prod.price !== undefined && prod.price !== null
            ? String(prod.price)
            : t('common.unavailable', 'N/A');
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
    } catch (err: any) {
      console.error("ProductsByTagScreen: Erreur fetchProductsByTag:", err);
      setError(t('tagScreen.fetchGenericError', 'Impossible de charger les produits pour ce tag.'));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [tag, t]);

  useEffect(() => {
    fetchProductsByTag();
  }, [fetchProductsByTag]);

  useEffect(() => {
    // Mettre à jour le titre si 'tag' change après le premier rendu
    if (tag) setPageTitle(`${t('tagScreen.titlePrefix', 'Produits :')} ${decodeURIComponent(tag)}`);
  }, [tag, t]);

  const handleProductPress = (productId: string | number) => {
    const path = `/product/${String(productId)}` as Href;
    router.push(path);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
         <Text style={{ color: colors.text }}>{t('common.loading', 'Chargement...')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
        <Button
          title={t('common.retry', 'Réessayer')}
          onPress={fetchProductsByTag}
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
          <Text style={[styles.noProductsText, { color: colors.text }]}>
            {t('tagScreen.noProducts', 'Aucun produit trouvé pour "{{tag}}"', { tag: decodeURIComponent(tag || "") })}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            // Utilise styles.productCardContainer pour envelopper ProductCard
            <View style={styles.productCardContainer}>
              <ProductCard item={item} onPress={handleProductPress} />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
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
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 20,
  },
  productCardContainer: {
    // Ajout du style pour l'enveloppe des cartes produits
    width: "50%", // Chaque carte prend la moitié de la largeur (pour 2 colonnes)
    paddingHorizontal: 5, // Ajoute un peu d'espace horizontal autour de chaque carte
    marginBottom: 10, // Ajoute un peu d'espace en bas de chaque carte
    alignItems: "center",
  },
   errorText: { // Style pour les messages d'erreur
    fontSize: 16,
    textAlign: 'center',
    color: 'red', // Sera remplacé par colors.errorText
    marginVertical: 10,
  },
  noProductsText: { // Style pour le message "Aucun produit trouvé"
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
   sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 10,
    // color est appliqué dynamiquement
  },
});