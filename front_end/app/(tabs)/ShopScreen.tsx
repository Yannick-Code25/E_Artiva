// ARTIVA/front_end/app/(tabs)/ShopScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { Href, Stack, useRouter } from "expo-router"; // Stack pour le titre, useRouter pour la navigation si besoin
import Colors from "../../constants/Colors"; // Ajuste le chemin
import { useColorScheme } from "../../components/useColorScheme"; // Ajuste le chemin

// Types (à adapter/importer de tes fichiers de composants ou types globaux)
interface Category {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  // Ajoute d'autres champs si nécessaire (image_url, slug etc.)
}

interface Product {
  id: string | number;
  name: string;
  price: string; // Déjà formaté
  imageUrl: string;
  category_ids?: (string | number)[]; // IDs des catégories auxquelles ce produit appartient
  // Ajoute d'autres champs
}

// **ATTENTION: METS TON ADRESSE IP LOCALE CORRECTE ICI**
const API_BASE_URL = "http://192.168.248.151:3001/api";
// Exemple: const API_BASE_URL = 'http://192.168.1.105:3001/api';

export default function TabShopScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // États pour les données
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // États pour la navigation interne de la page
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<
    string | number | null
  >(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | number | null
  >(null);

  // États pour l'UI
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Charger toutes les catégories et tous les produits au montage
  const fetchData = useCallback(async () => {
    console.log("ShopScreen: Appel de fetchData (catégories et produits)");
    setIsLoadingCategories(true);
    setIsLoadingProducts(true);
    setError(null);
    try {
      const [catResponse, prodResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/products`), // Suppose que ça renvoie les produits publiés
      ]);

      if (!catResponse.ok)
        throw new Error(`Erreur catégories (${catResponse.status})`);
      const catData = await catResponse.json();
      // Adapter si besoin les noms de champs (id, name, parent_id sont attendus)
      setAllCategories(
        catData.map((c: any) => ({
          ...c,
          id: String(c.id),
          parent_id: c.parent_id ? String(c.parent_id) : null,
        }))
      );
      console.log("ShopScreen: Catégories chargées:", catData.length);

      if (!prodResponse.ok)
        throw new Error(`Erreur produits (${prodResponse.status})`);
      const prodDataWrapper = await prodResponse.json(); // Renommer en prodDataWrapper pour clarté
      console.log(
        "ShopScreen: Données brutes Produits (wrapper):",
        JSON.stringify(prodDataWrapper, null, 2)
      );
      // Adapter si besoin (id, name, price, imageUrl, category_ids sont attendus)
      // Assure-toi que 'price' est formaté si ce n'est pas déjà fait par l'API
      if (!prodDataWrapper || !Array.isArray(prodDataWrapper.products)) {
        console.error(
          "Erreur: prodDataWrapper.products n'est pas un tableau!",
          prodDataWrapper
        );
        throw new Error(
          "Format de données produits inattendu du serveur (ShopScreen)."
        );
      }
      const productsArray = prodDataWrapper.products; // Extraire le tableau de produits
      setAllProducts(
        productsArray.map((p: any) => ({
          id: String(p.id),
          name: p.name || "Produit Inconnu",
          price: `${
            p.price !== undefined && p.price !== null ? String(p.price) : "N/A"
          } FCFA`,
          imageUrl:
            p.image_url ||
            `https://via.placeholder.com/150x150/?text=${encodeURIComponent(
              p.name || "Prod"
            )}`, // ESSENTIEL
          category_ids: (p.category_ids || []).map((id: any) => String(id)), // S'assurer que les IDs sont des chaînes pour la comparaison          categories_names: p.categories_names || [],
          // Les champs suivants doivent être dans ton type Product si tu les utilises dans renderProductItem
          categories_names: p.categories_names || [],
          tags_names: p.tags_names || [],
          stock: p.stock, // Assure-toi que BaseProductType (importé de ProductCard) a 'stock'
          description: p.description, // et 'description'
        }))
      );
      console.log("ShopScreen: Produits chargés:", productsArray.length);
    } catch (err: any) {
      console.error("ShopScreen: Erreur fetchData:", err);
      setError(err.message || "Erreur de chargement des données.");
      setAllCategories([]);
      setAllProducts([]);
    } finally {
      setIsLoadingCategories(false);
      setIsLoadingProducts(false);
    }
  }, []); // API_BASE_URL est une constante hors du composant

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Fonctions de filtrage pour l'affichage ---
  const getMainCategories = (): Category[] => {
    return allCategories.filter((cat) => cat.parent_id === null);
  };

  const getSubCategories = (): Category[] => {
    if (!selectedMainCategoryId) return [];
    return allCategories.filter(
      (cat) => String(cat.parent_id) === String(selectedMainCategoryId)
    );
  };

  const getProductsToDisplay = (): Product[] => {
    let productsToFilter = allProducts; // Commence avec tous les produits

    if (selectedSubCategoryId) {
      console.log(`Filtrage pour sous-catégorie ID: ${selectedSubCategoryId}`);
      productsToFilter = allProducts.filter(
        (prod) =>
          prod.category_ids &&
          prod.category_ids
            .map((id) => String(id))
            .includes(String(selectedSubCategoryId))
      );
      console.log(
        `Produits trouvés pour sous-cat ${selectedSubCategoryId}:`,
        productsToFilter.length
      );
    } else if (selectedMainCategoryId) {
      const subs = getSubCategories(); // getSubCategories doit être défini et fonctionner
      if (subs.length === 0) {
        // Si la catégorie principale n'a pas de sous-catégories
        console.log(
          `Filtrage pour catégorie principale SANS sous-cat ID: ${selectedMainCategoryId}`
        );
        productsToFilter = allProducts.filter(
          (prod) =>
            prod.category_ids &&
            prod.category_ids
              .map((id) => String(id))
              .includes(String(selectedMainCategoryId))
        );
        console.log(
          `Produits trouvés pour cat principale ${selectedMainCategoryId}:`,
          productsToFilter.length
        );
      } else {
        productsToFilter = []; // Aucune sous-catégorie sélectionnée, donc pas de produits affichés pour l'instant
        console.log(
          "Catégorie principale sélectionnée, mais en attente de sélection de sous-catégorie."
        );
      }
    } else {
      // Si rien n'est sélectionné, tu peux choisir de ne rien afficher ou tous les produits (potentiellement limité)
      // productsToFilter = allProducts.slice(0,10); // Exemple: les 10 premiers
      productsToFilter = []; // Ou rien par défaut
      console.log(
        "Aucune catégorie sélectionnée pour l'affichage des produits."
      );
    }

    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      productsToFilter = productsToFilter.filter((prod) =>
        prod.name.toLowerCase().includes(lowerSearchTerm)
      );
      console.log(
        `Produits après recherche "${searchTerm}":`,
        productsToFilter.length
      );
    }
    return productsToFilter;
  };

  // --- Gestionnaires d'événements ---
  const handleSelectMainCategory = (categoryId: string | number | null) => {
    console.log("Main category selected:", categoryId);
    setSelectedMainCategoryId(categoryId);
    setSelectedSubCategoryId(null); // Réinitialise la sous-catégorie
    setSearchTerm(""); // Réinitialise la recherche
  };

  const handleSelectSubCategory = (subCategoryId: string | number | null) => {
    console.log("Sub category selected:", subCategoryId);
    setSelectedSubCategoryId(subCategoryId);
    setSearchTerm(""); // Réinitialise la recherche
  };

  const handleProductPress = (productId: string | number) => {
    // productId est l'ID du produit cliqué
    console.log("Tentative de navigation vers le produit ID:", productId); // Log pour déboguer
    const path = `/product/${String(productId)}` as Href; // Construit le chemin et le caste en Href
    try {
      router.push(path);
      console.log(`Navigation vers ${path} demandée.`);
    } catch (e) {
      console.error("Erreur lors de router.push:", e);
      Alert.alert(
        "Erreur de Navigation",
        "Impossible d'ouvrir la page du produit."
      );
    }
  };

  // --- Rendu des éléments de liste ---
  const renderMainCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.mainCategoryItem,
        item.id === selectedMainCategoryId && styles.mainCategoryItemSelected,
      ]}
      onPress={() => handleSelectMainCategory(item.id)}
    >
      <Text
        style={[
          styles.mainCategoryText,
          item.id === selectedMainCategoryId && styles.mainCategoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSubCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.subCategoryItem,
        item.id === selectedSubCategoryId && styles.subCategoryItemSelected,
      ]}
      onPress={() => handleSelectSubCategory(item.id)}
    >
      <Text
        style={[
          styles.subCategoryText,
          item.id === selectedSubCategoryId && styles.subCategoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
      {/* Tu pourrais ajouter une image pour la sous-catégorie ici */}
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleProductPress(item.id)}
    >
      {/* Si tu affiches l'image directement ici, l'import de Image est crucial DANS CE FICHIER */}
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      {/* <View style={styles.productImagePlaceholder}><Text style={{color: 'grey', fontSize:10}}>Image</Text></View> */}
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.productPrice}>{item.price}</Text>
    </TouchableOpacity>
  );

  // --- Affichage principal ---
  if (isLoadingCategories) {
    // Loader initial pour les catégories
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <Text
          style={{ marginTop: 10, color: Colors[colorScheme ?? "light"].text }}
        >
          Chargement des catégories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        <Button
          title="Réessayer"
          onPress={fetchData}
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  const mainCategories = getMainCategories();
  const subCategories = getSubCategories();
  const productsToDisplay = getProductsToDisplay();

  return (
    <View style={styles.screenContainer}>
      {/* Configurer l'en-tête de la page */}
      <Stack.Screen options={{ title: "Boutique Artiva" }} />

      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher des produits..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <View style={styles.contentContainer}>
        {/* Volet Gauche: Catégories Principales */}
        <View style={styles.leftPane}>
          <FlatList
            data={mainCategories}
            renderItem={renderMainCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Volet Droit: Sous-catégories OU Produits */}
        <View style={styles.rightPane}>
          {selectedMainCategoryId &&
            subCategories.length > 0 &&
            !selectedSubCategoryId && (
              <>
                <Text style={styles.sectionTitle}>Sous-catégories</Text>
                <FlatList
                  data={subCategories}
                  renderItem={renderSubCategoryItem}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={3} // Afficher en grille
                  columnWrapperStyle={styles.subCategoryRow}
                />
              </>
            )}

          {/* Afficher les produits si une sous-catégorie est sélectionnée, OU si une catégorie principale est sélectionnée et n'a pas de sous-catégories */}
          {(selectedSubCategoryId ||
            (selectedMainCategoryId && subCategories.length === 0)) && (
            <>
              <Text style={styles.sectionTitle}>
                {selectedSubCategoryId
                  ? allCategories.find((c) => c.id === selectedSubCategoryId)
                      ?.name
                  : allCategories.find((c) => c.id === selectedMainCategoryId)
                      ?.name}
              </Text>
              {isLoadingProducts ? (
                <ActivityIndicator
                  style={{ marginTop: 20 }}
                  size="large"
                  color={Colors[colorScheme ?? "light"].tint}
                />
              ) : productsToDisplay.length > 0 ? (
                <FlatList
                  data={productsToDisplay}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2} // Afficher les produits en 2 colonnes
                  contentContainerStyle={styles.productList}
                />
              ) : (
                <Text style={styles.noProductsText}>
                  {searchTerm
                    ? "Aucun produit ne correspond à votre recherche."
                    : "Aucun produit dans cette catégorie."}
                </Text>
              )}
            </>
          )}

          {/* Message si aucune catégorie principale n'est sélectionnée ou si elle a des sous-catégories mais aucune n'est sélectionnée */}
          {!selectedMainCategoryId && (
            <Text style={styles.placeholderText}>
              Sélectionnez une catégorie à gauche.
            </Text>
          )}
          {selectedMainCategoryId &&
            subCategories.length > 0 &&
            !selectedSubCategoryId &&
            productsToDisplay.length === 0 && (
              <Text style={styles.placeholderText}>
                Sélectionnez une sous-catégorie pour voir les produits.
              </Text>
            )}
        </View>
      </View>
    </View>
  );
}

// Styles (à affiner considérablement)
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#fff", // Ou Colors[colorScheme].background
  },
  searchBar: {
    padding: 12,
    margin: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row", // Layout à deux colonnes
  },
  leftPane: {
    width: 120, // Largeur du volet des catégories principales
    backgroundColor: "#f8f8f8", // Couleur de fond pour le volet gauche
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  mainCategoryItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  mainCategoryItemSelected: {
    backgroundColor: "tomato", // Couleur pour l'élément sélectionné
  },
  mainCategoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  mainCategoryTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  rightPane: {
    flex: 1, // Prend l'espace restant
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  subCategoryItem: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60, // Hauteur minimale pour les cartes de sous-catégories
    flex: 1, // Pour que les items se répartissent dans numColumns
  },
  subCategoryItemSelected: {
    backgroundColor: "tomato",
    borderColor: "#cc503e",
    borderWidth: 2,
  },
  subCategoryText: {
    fontSize: 12,
    textAlign: "center",
  },
  subCategoryTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  subCategoryRow: {
    justifyContent: "space-between", // Pour espacer les sous-catégories sur la ligne
  },
  productList: {
    // paddingBottom: 20, // Espace en bas de la liste des produits
  },
  productItem: {
    flex: 0.5, // Pour 2 colonnes, chaque item prend la moitié de l'espace (moins les marges)
    margin: 5,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: "100%",
    aspectRatio: 1, // Pour une image carrée
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    // Si tu utilises une vraie image
    width: "100%",
    aspectRatio: 1,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    minHeight: 30, // Pour 2 lignes de texte
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "green",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noProductsText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#777",
  },
  placeholderText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#aaa",
  },
});
