// // front_end/app/tag/[tag].tsx
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   ActivityIndicator,
//   Button,
//   Platform,
//   Dimensions, // Import Dimensions
// } from "react-native";
// import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
// import ProductCard, {
//   Product as ProductType,
// } from "../../components/ProductCard";
// import Colors from "../../constants/Colors";
// import { useColorScheme } from "../../components/useColorScheme";

// const API_BASE_URL = "http://192.168.248.151:3001/api"; // **TON IP**

// export default function ProductsByTagScreen() {
//   const { tag } = useLocalSearchParams<{ tag: string }>();
//   const router = useRouter();
//   const colorScheme = useColorScheme();
//   const currentScheme = colorScheme ?? "light";
//   const tintColor = Colors[currentScheme].tint;
//   const textColor = Colors[currentScheme].text;
//   const backgroundColor = Colors[currentScheme].background;

//   const [products, setProducts] = useState<ProductType[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [pageTitle, setPageTitle] = useState(
//     tag ? `Produits : ${decodeURIComponent(tag)}` : "Produits par Tag"
//   );

//   const fetchProductsByTag = useCallback(async () => {
//     if (!tag) {
//       setError("Nom du tag manquant.");
//       setIsLoading(false);
//       return;
//     }
//     console.log(`ProductsByTagScreen: Fetching products for tag: ${tag}`);
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/products?tag_name=${encodeURIComponent(tag)}&limit=50`
//       );
//       if (!response.ok) {
//         const errorData = await response
//           .json()
//           .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
//         throw new Error(
//           errorData.message ||
//             `Erreur chargement produits pour tag (${response.status})`
//         );
//       }
//       const dataWrapper = await response.json();
//       if (!dataWrapper || !Array.isArray(dataWrapper.products)) {
//         throw new Error("Format de données produits inattendu.");
//       }
//       const productsData = dataWrapper.products;

//       const adaptedProducts = productsData.map((prod: any) => {
//         const productName = prod.name || "Produit Inconnu";
//         const productPrice =
//           prod.price !== undefined && prod.price !== null
//             ? String(prod.price)
//             : "N/A";
//         return {
//           id: String(prod.id),
//           name: productName,
//           price: `${productPrice} FCFA`,
//           imageUrl:
//             prod.image_url ||
//             `https://via.placeholder.com/150x150/BFDBFE/000?text=${encodeURIComponent(
//               productName.substring(0, 10)
//             )}`,
//           stock: prod.stock,
//           description: prod.description,
//           category_ids: (prod.category_ids || []).map((id: any) => String(id)),
//           categories_names: prod.categories_names || [],
//           tags_names: prod.tags_names || [],
//           is_published: prod.is_published,
//         };
//       });
//       setProducts(adaptedProducts);
//     } catch (err: any) {
//       console.error("ProductsByTagScreen: Erreur fetchProductsByTag:", err);
//       setError(
//         err.message || "Impossible de charger les produits pour ce tag."
//       );
//       setProducts([]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [tag]);

//   useEffect(() => {
//     fetchProductsByTag();
//   }, [fetchProductsByTag]);

//   useEffect(() => {
//     // Mettre à jour le titre si 'tag' change après le premier rendu
//     if (tag) setPageTitle(`${decodeURIComponent(tag)}`);
//   }, [tag]);

//   const handleProductPress = (productId: string | number) => {
//     const path = `/product/${String(productId)}` as Href;
//     router.push(path);
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={tintColor} />
//       </View>
//     );
//   }
//   if (error) {
//     return (
//       <View style={styles.centered}>
//         <Text style={{ color: "red" }}>{error}</Text>
//         <Button
//           title="Réessayer"
//           onPress={fetchProductsByTag}
//           color={tintColor}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.screenContainer, { backgroundColor }]}>
//       <Stack.Screen options={{ title: pageTitle }} />
//       {products.length === 0 ? (
//         <View style={styles.centered}>
//           <Text style={{ color: textColor }}>
//             Aucun produit trouvé pour "{decodeURIComponent(tag || "")}".
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={products}
//           renderItem={({ item }) => (
//             <ProductCard item={item} onPress={handleProductPress} />
//           )}
//           keyExtractor={(item) => item.id.toString()}
//           numColumns={2}
//           contentContainerStyle={styles.listContainer}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   screenContainer: { flex: 1 },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   listContainer: { paddingHorizontal: 5, paddingTop: 10, paddingBottom: 20, alignItems:'center', },

// });

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
} from "../../components/ProductCarttag";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";

const API_BASE_URL = "http://192.168.248.151:3001/api"; // **TON IP**

export default function ProductsByTagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const currentScheme = colorScheme ?? "light";
  const colors = Colors[currentScheme]; // Accès direct aux couleurs du thème

  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState(
    tag ? `Produits : ${decodeURIComponent(tag)}` : "Produits par Tag"
  );

  const fetchProductsByTag = useCallback(async () => {
    if (!tag) {
      setError("Nom du tag manquant.");
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
            `Erreur chargement produits pour tag (${response.status})`
        );
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
      setError(
        err.message || "Impossible de charger les produits pour ce tag."
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    fetchProductsByTag();
  }, [fetchProductsByTag]);

  useEffect(() => {
    // Mettre à jour le titre si 'tag' change après le premier rendu
    if (tag) setPageTitle(`${decodeURIComponent(tag)}`);
  }, [tag]);

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
          <Text style={{ color: colors.text }}>
            Aucun produit trouvé pour "{decodeURIComponent(tag || "")}".
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
    marginBottom: 1, // Ajoute un peu d'espace en bas de chaque carte
    padding: 0,
    alignItems: "center",
  },
});
