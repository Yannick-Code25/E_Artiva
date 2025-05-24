// ARTIVA/front_end/app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text as DefaultText, useColorScheme, ActivityIndicator, RefreshControl, Alert, Button, Platform } from 'react-native';
import ScrollSection from '../../components/ScrollSection';
import CategoryCard, { Category } from '../../components/CategoryCard'; // Assure-toi que les types exportés sont corrects
import ProductCard, { Product } from '../../components/ProductCard';   // Assure-toi que les types exportés sont corrects
import Colors from '../../constants/Colors';       // Ajuste le chemin si nécessaire
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext'; // Importer pour vérifier si l'user est là

// **ATTENTION: METS TON ADRESSE IP LOCALE CORRECTE ICI**
const API_BASE_URL = 'http://192.168.11.131:3001/api'; 
// Exemple: const API_BASE_URL = 'http://192.168.1.105:3001/api';

export default function TabAccueilScreen() {
  const router = useRouter();
  const { userToken } = useAuth(); // Pourrait être utilisé pour des logiques conditionnelles si besoin
  const colorScheme = useColorScheme();
  const siteNameColor = Colors[colorScheme ?? 'light'].text;

  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [forYouProducts, setForYouProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(true); // Un seul loader global pour la page
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    console.log("TabAccueilScreen: Appel de fetchData...");
    setIsLoading(true); // Active le loader global au début de fetchData (surtout pour le premier chargement)
    setError(null);
    try {
      // Charger les catégories
      console.log("TabAccueilScreen: fetchCategories...");
      const catResponse = await fetch(`${API_BASE_URL}/categories`);
      if (!catResponse.ok) throw new Error(`Erreur catégories (${catResponse.status})`);
      const catData = await catResponse.json();
      setCategories(catData.map((cat: any) => {
  const categoryName = cat.name || 'Catégorie Inconnue'; // Fallback pour le nom
  return {
    id: String(cat.id),
    name: categoryName,
    imageUrl: cat.image_url || `https://via.placeholder.com/100x100/?text=${encodeURIComponent(categoryName)}`, // Utilise le nom avec fallback
  };
}));

// Dans fetchProducts / adaptation des produits
const prodResponse = await fetch(`${API_BASE_URL}/products`);
const prodData = await prodResponse.json();
const adaptedProdData = prodData.map((prod: any) => {
  const productName = prod.name || 'Produit Inconnu'; // Fallback pour le nom
  const productPrice = prod.price !== undefined && prod.price !== null ? String(prod.price) : 'N/A'; // Fallback pour le prix

  return {
    id: String(prod.id),
    name: productName,
    price: `${productPrice} FCFA`, // Maintenant, productPrice est toujours une chaîne
    imageUrl: prod.image_url || `https://via.placeholder.com/150x150/?text=${encodeURIComponent(productName)}`, // Utilise le nom avec fallback
    categories_names: prod.categories_names || [],
    tags_names: prod.tags_names || [],
  };
});

      // Logique simple pour diviser les produits (à améliorer plus tard)
      setNewArrivals(adaptedProdData.slice(0, 5)); // Ex: 5 premiers
      setForYouProducts(adaptedProdData.slice(5, 10)); // Ex: 5 suivants
      console.log("TabAccueilScreen: Produits chargés:", prodData.length);

    } catch (err: any) {
      console.error("TabAccueilScreen: Erreur fetchData:", err);
      setError(err.message || 'Une erreur est survenue lors du chargement des données.');
      setCategories([]); setNewArrivals([]); setForYouProducts([]); // Vider en cas d'erreur
    } finally {
      setIsLoading(false);
      setRefreshing(false); // S'assurer que refreshing est false ici aussi
    }
  }, []); // useCallback avec tableau de dépendances vide pour le premier chargement

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true); // Active l'indicateur de refresh
    fetchData(); // Appelle la fonction qui mettra aussi refreshing à false dans son finally
  }, [fetchData]);

  const handleCategoryPress = (categoryId: string) => {
    Alert.alert('Navigation Catégorie', `ID: ${categoryId}`);
    // router.push(`/category/${categoryId}`);
  };
  const handleProductPress = (productId: string) => {
    Alert.alert('Navigation Produit', `ID: ${productId}`);
    // router.push(`/product/${productId}`);
  };

  if (isLoading && !refreshing && categories.length === 0 && newArrivals.length === 0) {
    return (
      <View style={[styles.centeredLoader, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ActivityIndicator size="large" color="tomato" />
        <DefaultText style={{ marginTop: 10, color: Colors[colorScheme ?? 'light'].text }}>Chargement des données...</DefaultText>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="tomato" />}
    >
      <View style={styles.headerContainer}>
        <DefaultText style={[styles.siteName, { color: siteNameColor }]}>Artiva</DefaultText>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <DefaultText style={styles.errorText}>{error}</DefaultText>
          <Button title="Réessayer" onPress={onRefresh} color="tomato"/>
        </View>
      )}

      {!isLoading || categories.length > 0 ? ( // Afficher même si en refresh
        categories.length > 0 ? (
          <ScrollSection<Category>
            title="Catégories"
            data={categories}
            renderItem={({ item }) => <CategoryCard item={item} onPress={handleCategoryPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
        ) : !error && !isLoading ? <DefaultText style={styles.noDataText}>Aucune catégorie disponible.</DefaultText> : null
      ) : null}


      {!isLoading || newArrivals.length > 0 ? (
        newArrivals.length > 0 ? (
          <ScrollSection<Product>
            title="Nouvelles Arrivées"
            data={newArrivals}
            renderItem={({ item }) => <ProductCard item={item} onPress={handleProductPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
        ) : !error && !isLoading ? <DefaultText style={styles.noDataText}>Aucune nouvelle arrivée.</DefaultText> : null
      ) : null}


      {!isLoading || forYouProducts.length > 0 ? (
        forYouProducts.length > 0 ? (
          <ScrollSection<Product>
            title="Pour Vous"
            data={forYouProducts}
            renderItem={({ item }) => <ProductCard item={item} onPress={handleProductPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
        ) : !error && !isLoading ? <DefaultText style={styles.noDataText}>Pas de recommandations pour le moment.</DefaultText> : null
      ) : null}
      
      <View style={{height: 30}} /> {/* Espace en bas */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  headerContainer: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 25 : 20, paddingBottom: 10, }, // Ajustement pour Android status bar
  siteName: { fontSize: 28, fontWeight: 'bold', },
  errorContainer: { marginHorizontal: 16, marginVertical: 10, padding: 15, backgroundColor: '#ffebee', borderRadius: 8, alignItems: 'center' },
  errorText: { color: '#c62828', fontSize: 16, marginBottom: 10, textAlign: 'center' },
  noDataText: { textAlign: 'center', color: '#757575', marginVertical: 20, fontSize: 16, fontStyle: 'italic' }
});