// // ARTIVA/front_end/app/(tabs)/ShopScreen.tsx
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   ActivityIndicator,
//   TextInput,
//   Image,
//   Button,
//   Platform,
//   RefreshControl,
// } from "react-native";
// import { Stack, useRouter, Href, useFocusEffect } from "expo-router";
// import Colors from "../../constants/Colors";
// import { useColorScheme } from "../../components/useColorScheme";
// import { Product as BaseProductType } from "../../components/ProductCard";

// interface Category {
//   id: string | number;
//   name: string;
//   parent_id: string | number | null;
//   image_url?: string;
//   display_order?: number;
// }

// interface ShopProduct extends BaseProductType {}

// const API_BASE_URL = "http://192.168.248.151:3001/api";

// export default function TabShopScreen() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();

//   const currentAppliedTheme = colorScheme ?? "light";
//   const tintColor = Colors[currentAppliedTheme].tint;
//   const textColor = Colors[currentAppliedTheme].text;
//   const backgroundColor = Colors[currentAppliedTheme].background;
//   const cardColor = Colors[currentAppliedTheme].card;
//   const subtleTextColor = Colors[currentAppliedTheme].tabIconDefault;
//   const borderColor =
//     Colors[currentAppliedTheme].cardBorder ||
//     Colors[currentAppliedTheme].tabIconDefault;

//   const [allCategories, setAllCategories] = useState<Category[]>([]);
//   const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
//   const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<
//     string | number | null
//   >(null);
//   const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
//     string | number | null
//   >(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [initialLoadComplete, setInitialLoadComplete] = useState(false);
//   const [firstLoadDone, setFirstLoadDone] = useState(false);

//   const fetchData = useCallback(async () => {
//     console.log("ShopScreen: Appel de fetchData (catégories et produits)");
//     setIsLoading(true);
//     setError(null);

//     let productsUrl = `${API_BASE_URL}/products`;
//     const params = new URLSearchParams();

//     if (selectedSubCategoryId) {
//       params.append("category_id", String(selectedSubCategoryId));
//     } else if (selectedMainCategoryId && subCategories.length === 0) {
//       params.append("category_id", String(selectedMainCategoryId));
//     }
//     if (searchTerm.trim() !== "") {
//       params.append("search", searchTerm);
//     }

//     const queryString = params.toString();
//     if (queryString) {
//       productsUrl += `?${queryString}`;
//     }

//     try {
//       const [catResponse, prodResponse] = await Promise.all([
//         fetch(`${API_BASE_URL}/categories`),
//         fetch(productsUrl),
//       ]);

//       if (!catResponse.ok) {
//         const errText = await catResponse
//           .text()
//           .catch(() => `Erreur HTTP ${catResponse.status}`);
//         throw new Error(
//           `Erreur chargement catégories (${catResponse.status}): ${errText}`
//         );
//       }

//       const catData = await catResponse.json();
//       setAllCategories(
//         catData.map((c: any) => ({
//           id: String(c.id),
//           name: c.name || "Catégorie",
//           parent_id: c.parent_id ? String(c.parent_id) : null,
//           image_url: c.image_url,
//           display_order: c.display_order,
//         }))
//       );
//       console.log("ShopScreen: Catégories chargées:", catData.length);

//       if (!prodResponse.ok) {
//         const errText = await prodResponse
//           .text()
//           .catch(() => `Erreur HTTP ${prodResponse.status}`);
//         throw new Error(
//           `Erreur chargement produits (${prodResponse.status}): ${errText}`
//         );
//       }
//       const prodDataWrapper = await prodResponse.json();

//       if (!prodDataWrapper || !Array.isArray(prodDataWrapper.products)) {
//         console.error(
//           "Erreur: prodDataWrapper.products n'est pas un tableau!",
//           prodDataWrapper
//         );
//         throw new Error(
//           "Format de données produits inattendu du serveur (ShopScreen)."
//         );
//       }

//       const productsArray = prodDataWrapper.products;

//       setAllProducts(
//         productsArray.map((p: any) => ({
//           id: String(p.id),
//           name: p.name || "Produit Inconnu",
//           price: `${
//             p.price !== undefined && p.price !== null
//               ? parseFloat(String(p.price)).toFixed(2)
//               : "N/A"
//           } FCFA`,
//           imageUrl:
//             p.image_url ||
//             `https://via.placeholder.com/150x150/E0E0E0/909090?text=${encodeURIComponent(
//               p.name || "Prod"
//             )}`,
//           stock: p.stock,
//           category_ids: (p.category_ids || []).map((id: any) => String(id)),
//           description: p.description,
//           sku: p.sku,
//           is_published: p.is_published,
//           categories_names: p.categories_names || [],
//           tags_names: p.tags_names || [],
//         }))
//       );
//       console.log(
//         "ShopScreen: Produits chargés et adaptés:",
//         productsArray.length
//       );
//     } catch (err: any) {
//       console.error("ShopScreen: Erreur fetchData:", err.message, err);
//       setError(err.message || "Erreur de chargement des données.");
//       setAllCategories([]);
//       setAllProducts([]);
//     } finally {
//       setIsLoading(false);
//       setInitialLoadComplete(true);
//       setFirstLoadDone(true);
//     }
//   }, [selectedMainCategoryId, selectedSubCategoryId, searchTerm]);

//   useEffect(() => {
//     console.log(
//       "ShopScreen: Premier chargement ou fetchData a changé (devrait être rare)."
//     );
//     fetchData();
//   }, [fetchData]);

//   const onRefresh = useCallback(() => {
//     // Pour le Pull-to-Refresh
//     console.log("ShopScreen: Pull-to-refresh déclenché");
//     setIsLoading(true); // fetchData le fera si besoin
//     fetchData();
//   }, [fetchData]);

//   const mainCategories = useMemo(
//     () =>
//       allCategories
//         .filter((cat) => cat.parent_id === null)
//         .sort(
//           (a, b) =>
//             (a.display_order || 0) - (b.display_order || 0) ||
//             a.name.localeCompare(b.name)
//         ),
//     [allCategories]
//   );

//   const subCategories = useMemo(() => {
//     if (!selectedMainCategoryId) return [];
//     console.log(
//       `ShopScreen: Filtrage sous-catégories pour mainCategoryId: ${selectedMainCategoryId}`
//     );
//     console.log(
//       "ShopScreen: allCategories",
//       JSON.stringify(allCategories, null, 2)
//     );
//     return allCategories
//       .filter((cat) => String(cat.parent_id) === String(selectedMainCategoryId))
//       .sort(
//         (a, b) =>
//           (a.display_order || 0) - (b.display_order || 0) ||
//           a.name.localeCompare(b.name)
//       );
//   }, [allCategories, selectedMainCategoryId]);

//   const productsToDisplay = useMemo(() => {
//     let filtered = allProducts;
//     // Pas de filtrage ici car c'est le backend qui le fait
//     return filtered;
//   }, [allProducts]);

//   const handleSelectMainCategory = (categoryId: string | number | null) => {
//     setSelectedMainCategoryId(categoryId);
//     setSelectedSubCategoryId(null);
//     setSearchTerm("");
//   };
//   const handleSelectSubCategory = (subCategoryId: string | number | null) => {
//     setSelectedSubCategoryId(subCategoryId);
//     setSearchTerm("");
//   };
//   const handleProductPress = (productId: string | number) => {
//     router.push(`/product/${String(productId)}`);
//   };

//   useFocusEffect(
//     useCallback(() => {
//       return () => {
//         console.log(
//           "ShopScreen: L'écran a perdu le focus, réinitialisation des états."
//         );
//         setSearchTerm("");
//         setSelectedMainCategoryId(null);
//         setSelectedSubCategoryId(null);
//       };
//     }, [])
//   );

//   if (isLoading && !initialLoadComplete) {
//     return (
//       <View style={[styles.centered, { backgroundColor }]}>
//         <ActivityIndicator size="large" color={tintColor} />
//         <Text style={{ marginTop: 10, color: textColor }}>Chargement...</Text>
//       </View>
//     );
//   }

//   if (error && allCategories.length === 0 && allProducts.length === 0) {
//     return (
//       <View style={[styles.centered, { backgroundColor }]}>
//         <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
//           {error}
//         </Text>
//         <Button title="Réessayer" onPress={fetchData} color={tintColor} />
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.screenContainer, { backgroundColor }]}>
//       <Stack.Screen options={{ title: "Boutique", headerShown: false }} />

//       <TextInput
//         style={[
//           styles.searchBar,
//           {
//             backgroundColor: cardColor,
//             color: textColor,
//             borderColor: borderColor,
//           },
//         ]}
//         placeholder="Rechercher des produits..."
//         placeholderTextColor={subtleTextColor}
//         value={searchTerm}
//         onChangeText={setSearchTerm}
//       />

//       <View style={styles.contentContainer}>
//         <View
//           style={[
//             styles.leftPane,
//             {
//               backgroundColor:
//                 Platform.OS === "ios"
//                   ? cardColor
//                   : backgroundColor === Colors.dark.background
//                   ? Colors.dark.card
//                   : "#f0f0f0",
//               borderRightColor: borderColor,
//             },
//           ]}
//         >
//           {mainCategories.length > 0 ? (
//             <FlatList
//               data={mainCategories}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={[
//                     styles.mainCategoryItem,
//                     item.id === selectedMainCategoryId && {
//                       backgroundColor: tintColor,
//                     },
//                   ]}
//                   onPress={() => handleSelectMainCategory(item.id)}
//                 >
//                   <Text
//                     style={[
//                       styles.mainCategoryText,
//                       {
//                         color:
//                           item.id === selectedMainCategoryId
//                             ? "white"
//                             : textColor,
//                       },
//                     ]}
//                   >
//                     {item.name}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//               keyExtractor={(item) => item.id.toString()}
//               showsVerticalScrollIndicator={false}
//             />
//           ) : !isLoading ? (
//             <Text style={[styles.noDataText, { color: textColor }]}>
//               Aucune catégorie.
//             </Text>
//           ) : null}
//         </View>

//         <View style={styles.rightPane}>
//           {isLoading &&
//             productsToDisplay.length === 0 &&
//             selectedMainCategoryId && (
//               <ActivityIndicator color={tintColor} style={{ marginTop: 20 }} />
//             )}

//           {selectedMainCategoryId &&
//             subCategories.length > 0 &&
//             !selectedSubCategoryId && (
//               <>
//                 <Text style={[styles.sectionTitle, { color: textColor }]}>
//                   {allCategories.find((c) => c.id === selectedMainCategoryId)
//                     ?.name || "Sous-catégories"}
//                 </Text>
//                 <FlatList
//                   data={subCategories}
//                   renderItem={({ item }) => (
//                     <TouchableOpacity
//                       style={[
//                         styles.subCategoryItem,
//                         {
//                           backgroundColor: cardColor,
//                           borderColor: borderColor,
//                         },
//                         item.id === selectedSubCategoryId && {
//                           backgroundColor: tintColor,
//                           borderColor: tintColor,
//                         },
//                       ]}
//                       onPress={() => handleSelectSubCategory(item.id)}
//                     >
//                       {item.image_url && (
//                         <Image
//                           source={{ uri: item.image_url }}
//                           style={styles.subCategoryImage}
//                         />
//                       )}
//                       <Text
//                         style={[
//                           styles.subCategoryText,
//                           {
//                             color:
//                               item.id === selectedSubCategoryId
//                                 ? "white"
//                                 : textColor,
//                           },
//                         ]}
//                       >
//                         {item.name}
//                       </Text>
//                     </TouchableOpacity>
//                   )}
//                   keyExtractor={(item) => item.id.toString()}
//                   numColumns={2}
//                   columnWrapperStyle={styles.subCategoryRow}
//                 />
//               </>
//             )}

//           {(selectedSubCategoryId ||
//             (selectedMainCategoryId && subCategories.length === 0)) && (
//             <>
//               <Text style={[styles.sectionTitle, { color: textColor }]}>
//                 Produits de "
//                 {selectedSubCategoryId
//                   ? allCategories.find((c) => c.id === selectedSubCategoryId)
//                       ?.name
//                   : allCategories.find((c) => c.id === selectedMainCategoryId)
//                       ?.name}
//                 "
//               </Text>
//               {productsToDisplay.length > 0 ? (
//                 <FlatList
//                   data={productsToDisplay}
//                   renderItem={({ item }) => (
//                     <TouchableOpacity
//                       style={[
//                         styles.productItem,
//                         {
//                           backgroundColor: cardColor,
//                           borderColor: borderColor,
//                         },
//                       ]}
//                       onPress={() => handleProductPress(item.id)}
//                     >
//                       <Image
//                         source={{ uri: item.imageUrl }}
//                         style={styles.productImage}
//                       />
//                       <Text
//                         style={[styles.productName, { color: textColor }]}
//                         numberOfLines={2}
//                       >
//                         {item.name}
//                       </Text>
//                       <Text style={[styles.productPrice, { color: tintColor }]}>
//                         {item.price}
//                       </Text>
//                     </TouchableOpacity>
//                   )}
//                   keyExtractor={(item) => item.id.toString()}
//                   numColumns={2}
//                   contentContainerStyle={styles.productList}
//                   showsVerticalScrollIndicator={false}
//                   refreshControl={
//                     <RefreshControl
//                       refreshing={isLoading && initialLoadComplete}
//                       onRefresh={onRefresh}
//                       tintColor={tintColor}
//                     />
//                   }
//                 />
//               ) : !isLoading ? (
//                 <View style={styles.placeholderContainer}>
//                   <Text style={[styles.noProductsText, { color: textColor }]}>
//                     {searchTerm
//                       ? "Aucun produit ne correspond à votre recherche."
//                       : "Aucun produit dans cette sélection."}
//                   </Text>
//                 </View>
//               ) : null}
//             </>
//           )}

//           {!selectedMainCategoryId && (
//             <View style={styles.placeholderContainer}>
//               <Text
//                 style={[styles.placeholderText, { color: subtleTextColor }]}
//               >
//                 Sélectionnez une catégorie.
//               </Text>
//             </View>
//           )}
//           {selectedMainCategoryId &&
//             subCategories.length > 0 &&
//             !selectedSubCategoryId &&
//             productsToDisplay.length === 0 &&
//             !isLoading && (
//               <View style={styles.placeholderContainer}>
//                 <Text
//                   style={[styles.placeholderText, { color: subtleTextColor }]}
//                 >
//                   Sélectionnez une sous-catégorie.
//                 </Text>
//               </View>
//             )}
//         </View>
//       </View>
//     </View>
//   );
// }

// // Styles (ceux que tu avais, avec les modifications pour le thème)
// const styles = StyleSheet.create({
//   screenContainer: { flex: 1, paddingTop: Platform.OS === "android" ? 25 : 0 },
//   searchBar: {
//     height: 45,
//     paddingHorizontal: 20,
//     marginHorizontal: 10,
//     marginTop: 10,
//     marginBottom: 5,
//     borderRadius: 25,
//     borderWidth: 1,
//     fontSize: 16,
//     // backgroundColor, color, borderColor sont appliqués dynamiquement
//   },
//   contentContainer: { flex: 1, flexDirection: "row" },
//   leftPane: {
//     width: 110,
//     //borderRightWidth: 1,
//     // backgroundColor, borderRightColor sont appliqués dynamiquement
//   },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   mainCategoryItem: {
//     paddingVertical: 18,
//     paddingHorizontal: 10,
//     borderBottomWidth: 1,
//     // borderBottomColor est appliqué dynamiquement (ou une couleur fixe si tu préfères un séparateur constant)
//     alignItems: "center",
//   },
//   // mainCategoryItemSelected n'est plus une clé de style, c'est appliqué en ligne
//   mainCategoryText: {
//     fontSize: 13,
//     fontWeight: "500",
//     textAlign: "center",
//     // color est appliqué dynamiquement
//   },
//   rightPane: {
//     flex: 1,
//     paddingVertical: 10,
//     paddingHorizontal: 5,
//   },
//   sectionTitle: {
//     fontSize: 17,
//     fontWeight: "600",
//     marginBottom: 12,
//     paddingHorizontal: 10,
//     // color est appliqué dynamiquement
//   },
//   subCategoryItem: {
//     flex: 1,
//     margin: 4,
//     padding: 8,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     minHeight: 80,
//     elevation: 1,
//     // shadowOpacity:0.05, // Les ombres en React Native sont souvent gérées par 'elevation' (Android) ou des props shadowXxx (iOS)
//     borderWidth: 1,
//     // backgroundColor et borderColor sont appliqués dynamiquement
//   },
//   // subCategoryItemSelected n'est plus une clé de style
//   subCategoryText: {
//     fontSize: 11,
//     textAlign: "center",
//     fontWeight: "500",
//     // color est appliqué dynamiquement
//   },
//   subCategoryImage: {
//     width: 35,
//     height: 35,
//     marginBottom: 5,
//     borderRadius: 4,
//     resizeMode: "contain",
//   },
//   subCategoryRow: {
//     marginHorizontal: 5,
//   },
//   productList: {
//     paddingHorizontal: 5,
//   },
//   productItem: {
//     flex: 0.5,
//     margin: 4,
//     padding: 8,
//     borderRadius: 8,
//     elevation: 1.5,
//     // shadowColor: '#000', // Pour iOS si tu veux des ombres plus custom
//     // shadowOffset: { width: 0, height: 1 },
//     // shadowOpacity: 0.1,
//     // shadowRadius: 2,
//     // backgroundColor et borderColor sont appliqués dynamiquement
//   },
//   productImage: {
//     width: "100%",
//     aspectRatio: 1,
//     borderRadius: 6,
//     marginBottom: 8,
//     backgroundColor: "#e0e0e0", // Placeholder si l'image ne charge pas (peut être thémé)
//   },
//   productName: {
//     fontSize: 13,
//     fontWeight: "600",
//     textAlign: "left",
//     marginBottom: 4,
//     height: 36 /* Approx 2 lignes */,
//     // color est appliqué dynamiquement
//   },
//   productPrice: {
//     fontSize: 14,
//     fontWeight: "bold",
//     textAlign: "left",
//     // color est appliqué dynamiquement
//   },
//   noProductsText: {
//     textAlign: "center",
//     marginTop: 30,
//     fontSize: 16,
//     // color est appliqué dynamiquement
//   },
//   placeholderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   noDataText: {
//     // Style ajouté pour les messages "Aucune catégorie/produit"
//     textAlign: "center",
//     marginVertical: 20,
//     fontSize: 15,
//     fontStyle: "italic",
//     // color sera appliqué dynamiquement
//   },
//   placeholderText: {
//     textAlign: "center",
//     marginTop: 50,
//     fontSize: 16,
//     // color est appliqué dynamiquement
//   },
// });








// ARTIVA/front_end/app/(tabs)/ShopScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  Button,
  Platform,
  RefreshControl,
} from "react-native";
import { Stack, useRouter, Href, useFocusEffect } from "expo-router";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { Product as BaseProductType } from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";

interface Category {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  image_url?: string;
  display_order?: number;
}

interface ShopProduct extends BaseProductType {}

const API_BASE_URL = "http://192.168.248.151:3001/api";

export default function TabShopScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { effectiveAppColorScheme } = useAuth();

  // Débogage du thème
  console.log("ShopScreen: Thème détecté par useColorScheme:", colorScheme);
  console.log("ShopScreen: Thème effectif depuis useAuth:", effectiveAppColorScheme);

  // Utilisation directe de l'objet de couleurs basé sur le thème
  const currentAppliedTheme = effectiveAppColorScheme || colorScheme || "light";
  const colors = Colors[currentAppliedTheme];

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<
    string | number | null
  >(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | number | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [firstLoadDone, setFirstLoadDone] = useState(false);

  const fetchData = useCallback(async () => {
    console.log("ShopScreen: Appel de fetchData (catégories et produits)");
    setIsLoading(true);
    setError(null);

    let productsUrl = `${API_BASE_URL}/products`;
    const params = new URLSearchParams();

    if (selectedSubCategoryId) {
      params.append("category_id", String(selectedSubCategoryId));
    } else if (selectedMainCategoryId && subCategories.length === 0) {
      params.append("category_id", String(selectedMainCategoryId));
    }
    if (searchTerm.trim() !== "") {
      params.append("search", searchTerm);
    }

    const queryString = params.toString();
    if (queryString) {
      productsUrl += `?${queryString}`;
    }

    try {
      const [catResponse, prodResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(productsUrl),
      ]);

      if (!catResponse.ok) {
        const errText = await catResponse
          .text()
          .catch(() => `Erreur HTTP ${catResponse.status}`);
        throw new Error(
          `Erreur chargement catégories (${catResponse.status}): ${errText}`
        );
      }

      const catData = await catResponse.json();
      setAllCategories(
        catData.map((c: any) => ({
          id: String(c.id),
          name: c.name || "Catégorie",
          parent_id: c.parent_id ? String(c.parent_id) : null,
          image_url: c.image_url,
          display_order: c.display_order,
        }))
      );
      console.log("ShopScreen: Catégories chargées:", catData.length);

      if (!prodResponse.ok) {
        const errText = await prodResponse
          .text()
          .catch(() => `Erreur HTTP ${prodResponse.status}`);
        throw new Error(
          `Erreur chargement produits (${prodResponse.status}): ${errText}`
        );
      }
      const prodDataWrapper = await prodResponse.json();

      if (!prodDataWrapper || !Array.isArray(prodDataWrapper.products)) {
        console.error(
          "Erreur: prodDataWrapper.products n'est pas un tableau!",
          prodDataWrapper
        );
        throw new Error(
          "Format de données produits inattendu du serveur (ShopScreen)."
        );
      }

      const productsArray = prodDataWrapper.products;

      setAllProducts(
        productsArray.map((p: any) => ({
          id: String(p.id),
          name: p.name || "Produit Inconnu",
          price: `${
            p.price !== undefined && p.price !== null
              ? parseFloat(String(p.price)).toFixed(2)
              : "N/A"
          } FCFA`,
          imageUrl:
            p.image_url ||
            `https://via.placeholder.com/150x150/E0E0E0/909090?text=${encodeURIComponent(
              p.name || "Prod"
            )}`,
          stock: p.stock,
          category_ids: (p.category_ids || []).map((id: any) => String(id)),
          description: p.description,
          sku: p.sku,
          is_published: p.is_published,
          categories_names: p.categories_names || [],
          tags_names: p.tags_names || [],
        }))
      );
      console.log(
        "ShopScreen: Produits chargés et adaptés:",
        productsArray.length
      );
    } catch (err: any) {
      console.error("ShopScreen: Erreur fetchData:", err.message, err);
      setError(err.message || "Erreur de chargement des données.");
      setAllCategories([]);
      setAllProducts([]);
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
      setFirstLoadDone(true);
    }
  }, [selectedMainCategoryId, selectedSubCategoryId, searchTerm]);

  useEffect(() => {
    console.log(
      "ShopScreen: Premier chargement ou fetchData a changé (devrait être rare)."
    );
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    // Pour le Pull-to-Refresh
    console.log("ShopScreen: Pull-to-refresh déclenché");
    setIsLoading(true); // fetchData le fera si besoin
    fetchData();
  }, [fetchData]);

  const mainCategories = useMemo(
    () =>
      allCategories
        .filter((cat) => cat.parent_id === null)
        .sort(
          (a, b) =>
            (a.display_order || 0) - (b.display_order || 0) ||
            a.name.localeCompare(b.name)
        ),
    [allCategories]
  );

  const subCategories = useMemo(() => {
    if (!selectedMainCategoryId) return [];
    console.log(
      `ShopScreen: Filtrage sous-catégories pour mainCategoryId: ${selectedMainCategoryId}`
    );
    console.log(
      "ShopScreen: allCategories",
      JSON.stringify(allCategories, null, 2)
    );
    return allCategories
      .filter((cat) => String(cat.parent_id) === String(selectedMainCategoryId))
      .sort(
        (a, b) =>
          (a.display_order || 0) - (b.display_order || 0) ||
          a.name.localeCompare(b.name)
      );
  }, [allCategories, selectedMainCategoryId]);

  const productsToDisplay = useMemo(() => {
    let filtered = allProducts;
    // Pas de filtrage ici car c'est le backend qui le fait
    return filtered;
  }, [allProducts]);

  const handleSelectMainCategory = (categoryId: string | number | null) => {
    setSelectedMainCategoryId(categoryId);
    setSelectedSubCategoryId(null);
    setSearchTerm("");
  };
  const handleSelectSubCategory = (subCategoryId: string | number | null) => {
    setSelectedSubCategoryId(subCategoryId);
    setSearchTerm("");
  };
  const handleProductPress = (productId: string | number) => {
    router.push(`/product/${String(productId)}`);
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        console.log(
          "ShopScreen: L'écran a perdu le focus, réinitialisation des états."
        );
        setSearchTerm("");
        setSelectedMainCategoryId(null);
        setSelectedSubCategoryId(null);
      };
    }, [])
  );

  if (isLoading && !initialLoadComplete) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ marginTop: 10, color: colors.text }}>Chargement...</Text>
      </View>
    );
  }

  if (error && allCategories.length === 0 && allProducts.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.errorText, marginBottom: 10, textAlign: "center" }}>
          {error}
        </Text>
        <Button title="Réessayer" onPress={fetchData} color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Boutique", headerShown: false }} />

      <TextInput
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.cardBorder,
          },
        ]}
        placeholder="Rechercher des produits..."
        placeholderTextColor={colors.subtleText}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <View style={styles.contentContainer}>
        <View
          style={[
            styles.leftPane,
            {
              backgroundColor:
                Platform.OS === "ios"
                  ? colors.card
                  : colors.card, // Utiliser une seule variable de thème
              borderRightColor: colors.cardBorder,
            },
          ]}
        >
          {mainCategories.length > 0 ? (
            <FlatList
              data={mainCategories}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.mainCategoryItem,
                    item.id === selectedMainCategoryId && {
                      backgroundColor: colors.tint,
                    },
                  ]}
                  onPress={() => handleSelectMainCategory(item.id)}
                >
                  <Text
                    style={[
                      styles.mainCategoryText,
                      {
                        color:
                          item.id === selectedMainCategoryId
                            ? "white"
                            : colors.text,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          ) : !isLoading ? (
            <Text style={[styles.noDataText, { color: colors.text }]}>
              Aucune catégorie.
            </Text>
          ) : null}
        </View>

        <View style={styles.rightPane}>
          {isLoading &&
            productsToDisplay.length === 0 &&
            selectedMainCategoryId && (
              <ActivityIndicator color={colors.tint} style={{ marginTop: 20 }} />
            )}

          {selectedMainCategoryId &&
            subCategories.length > 0 &&
            !selectedSubCategoryId && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {allCategories.find((c) => c.id === selectedMainCategoryId)
                    ?.name || "Sous-catégories"}
                </Text>
                <FlatList
                  data={subCategories}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.subCategoryItem,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                        },
                        item.id === selectedSubCategoryId && {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => handleSelectSubCategory(item.id)}
                    >
                      {item.image_url && (
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.subCategoryImage}
                        />
                      )}
                      <Text
                        style={[
                          styles.subCategoryText,
                          {
                            color:
                              item.id === selectedSubCategoryId
                                ? "white"
                                : colors.text,
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  columnWrapperStyle={styles.subCategoryRow}
                />
              </>
            )}

          {(selectedSubCategoryId ||
            (selectedMainCategoryId && subCategories.length === 0)) && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Produits de "
                {selectedSubCategoryId
                  ? allCategories.find((c) => c.id === selectedSubCategoryId)
                      ?.name
                  : allCategories.find((c) => c.id === selectedMainCategoryId)
                      ?.name}
                "
              </Text>
              {productsToDisplay.length > 0 ? (
                <FlatList
                  data={productsToDisplay}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.productItem,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                      onPress={() => handleProductPress(item.id)}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.productImage}
                      />
                      <Text
                        style={[styles.productName, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.productPrice, { color: colors.tint }]}>
                        {item.price}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  contentContainerStyle={styles.productList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isLoading && initialLoadComplete}
                      onRefresh={onRefresh}
                      tintColor={colors.tint}
                    />
                  }
                />
              ) : !isLoading ? (
                <View style={styles.placeholderContainer}>
                  <Text style={[styles.noProductsText, { color: colors.text }]}>
                    {searchTerm
                      ? "Aucun produit ne correspond à votre recherche."
                      : "Aucun produit dans cette sélection."}
                  </Text>
                </View>
              ) : null}
            </>
          )}

          {!selectedMainCategoryId && (
            <View style={styles.placeholderContainer}>
              <Text
                style={[styles.placeholderText, { color: colors.subtleText }]}
              >
                Sélectionnez une catégorie.
              </Text>
            </View>
          )}
          {selectedMainCategoryId &&
            subCategories.length > 0 &&
            !selectedSubCategoryId &&
            productsToDisplay.length === 0 &&
            !isLoading && (
              <View style={styles.placeholderContainer}>
                <Text
                  style={[styles.placeholderText, { color: colors.subtleText }]}
                >
                  Sélectionnez une sous-catégorie.
                </Text>
              </View>
            )}
        </View>
      </View>
    </View>
  );
}

// Styles (ceux que tu avais, avec les modifications pour le thème)
const styles = StyleSheet.create({
  screenContainer: { flex: 1, paddingTop: Platform.OS === "android" ? 25 : 0 },
  searchBar: {
    height: 45,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 25,
    borderWidth: 1,
    fontSize: 16,
    // backgroundColor, color, borderColor sont appliqués dynamiquement
  },
  contentContainer: { flex: 1, flexDirection: "row" },
  leftPane: {
    width: 110,
    //borderRightWidth: 1,
    // backgroundColor, borderRightColor sont appliqués dynamiquement
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  mainCategoryItem: {
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    // borderBottomColor est appliqué dynamiquement (ou une couleur fixe si tu préfères un séparateur constant)
    alignItems: "center",
  },
  // mainCategoryItemSelected n'est plus une clé de style, c'est appliqué en ligne
  mainCategoryText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    // color est appliqué dynamiquement
  },
  rightPane: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 10,
    // color est appliqué dynamiquement
  },
  subCategoryItem: {
    flex: 1,
    margin: 4,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    elevation: 1,
    // shadowOpacity:0.05, // Les ombres en React Native sont souvent gérées par 'elevation' (Android) ou des props shadowXxx (iOS)
    borderWidth: 1,
    // backgroundColor et borderColor sont appliqués dynamiquement
  },
  // subCategoryItemSelected n'est plus une clé de style
  subCategoryText: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
    // color est appliqué dynamiquement
  },
  subCategoryImage: {
    width: 35,
    height: 35,
    marginBottom: 5,
    borderRadius: 4,
    resizeMode: "contain",
  },
  subCategoryRow: {
    marginHorizontal: 5,
  },
  productList: {
    paddingHorizontal: 5,
  },
  productItem: {
    flex: 0.5,
    margin: 4,
    padding: 8,
    borderRadius: 8,
    elevation: 1.5,
    // shadowColor: '#000', // Pour iOS si tu veux des ombres plus custom
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // backgroundColor et borderColor sont appliqués dynamiquement
  },
  productImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#e0e0e0", // Placeholder si l'image ne charge pas (peut être thémé)
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "left",
    marginBottom: 4,
    height: 36 /* Approx 2 lignes */,
    // color est appliqué dynamiquement
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "left",
    // color est appliqué dynamiquement
  },
  noProductsText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    // color est appliqué dynamiquement
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    // Style ajouté pour les messages "Aucune catégorie/produit"
    textAlign: "center",
    marginVertical: 20,
    fontSize: 15,
    fontStyle: "italic",
    // color sera appliqué dynamiquement
  },
  placeholderText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    // color est appliqué dynamiquement
  },
});