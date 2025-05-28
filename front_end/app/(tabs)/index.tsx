// ARTIVA/front_end/app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Platform 
} from 'react-native';
import ScrollSection from '../../components/ScrollSection';
import CategoryCard, { Category } from '../../components/CategoryCard';
import ProductCard, { Product } from '../../components/ProductCard';
import Colors from '../../constants/Colors'; // Ajuste le chemin si nécessaire
import { useRouter, Href } from 'expo-router'; // Href pour le typage de router.push
import { useAuth } from '../../context/AuthContext';

// **ATTENTION: REMPLACE 'VOTRE_ADRESSE_IP_LOCALE' PAR TON IP RÉELLE**
const API_BASE_URL = 'http://192.168.248.151:3001/api'; // Exemple, mets la tienne

export default function TabAccueilScreen() {
  const router = useRouter();
  const { userToken } = useAuth(); // Non utilisé ici, mais disponible si besoin
  const colorScheme = useColorScheme();
  const siteNameColor = Colors[colorScheme ?? 'light'].text;
  const pageBackgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;

  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [forYouProducts, setForYouProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(true); // Loader global pour le premier chargement
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); // Pour le Pull-to-Refresh

  const fetchData = useCallback(async () => {
    console.log("TabAccueilScreen: Appel de fetchData...");
    // Ne pas remettre isLoading à true ici si ce n'est pas le premier chargement (géré par onRefresh)
    // setIsLoading(true); // Commenté pour que le loader n'apparaisse que si c'est pertinent
    setError(null);
    try {
      // --- Charger les catégories ---
      console.log("TabAccueilScreen: fetchCategories...");
      const catResponse = await fetch(`${API_BASE_URL}/categories`);
      if (!catResponse.ok) {
        const errorText = await catResponse.text();
        throw new Error(`Erreur catégories (${catResponse.status}): ${errorText}`);
      }
      const catData = await catResponse.json();
      console.log("Données brutes Catégories reçues:", JSON.stringify(catData, null, 2));
      
      setCategories(catData.map((cat: any) => {
        const categoryName = cat.name || 'Catégorie Inconnue';
        return {
          id: String(cat.id),
          name: categoryName,
          imageUrl: cat.image_url || `https://via.placeholder.com/100x100/FECACA/000?text=${encodeURIComponent(categoryName.substring(0,10))}`,
        };
      }));
      console.log("TabAccueilScreen: Catégories traitées.");

      // --- Charger les produits ---
      console.log("TabAccueilScreen: fetchProducts...");
      const prodResponse = await fetch(`${API_BASE_URL}/products`);
      if (!prodResponse.ok) {
        const errorText = await prodResponse.text();
        throw new Error(`Erreur produits (${prodResponse.status}): ${errorText}`);
      }
      const prodData = await prodResponse.json();
      console.log("Données brutes Produits reçues:", JSON.stringify(prodData, null, 2));

      if (!Array.isArray(prodData)) {
          console.error("Erreur: prodData n'est pas un tableau!", prodData);
          throw new Error("Format de données produits inattendu du serveur.");
      }

      const adaptedProdData = prodData.map((prod: any) => {
        const productName = prod.name || 'Produit Inconnu';
        const productPrice = prod.price !== undefined && prod.price !== null ? String(prod.price) : 'N/A';
        return {
          id: String(prod.id),
          name: productName,
          price: `${productPrice} FCFA`,
          imageUrl: prod.image_url || `https://via.placeholder.com/150x150/BFDBFE/000?text=${encodeURIComponent(productName.substring(0,10))}`,
          categories_names: prod.categories_names || [],
          tags_names: prod.tags_names || [],
          // Assure-toi que ton type Product inclut ces champs si tu les utilises dans ProductCard
          stock: prod.stock, 
          description: prod.description,
          is_published: prod.is_published,
        };
      });

      // Logique pour diviser les produits (à améliorer avec tes tags "nouveau", "pour_vous")
      // Pour l'instant, division simple
      const allPublishedProducts = adaptedProdData.filter(p => p.is_published !== false); // Si is_published peut être undefined
      setNewArrivals(allPublishedProducts.slice(0, 5)); 
      setForYouProducts(allPublishedProducts.slice(5, 10)); 
      console.log("TabAccueilScreen: Produits (publiés) traités et chargés:", allPublishedProducts.length);
      console.log("TabAccueilScreen: Total produits adaptés (avant filtre publication):", adaptedProdData.length);
    } catch (err: any) {
      console.error("TabAccueilScreen: Erreur fetchData:", err.message, err);
      setError(err.message || 'Une erreur est survenue lors du chargement des données.');
      // Ne pas vider les données existantes en cas d'erreur de refresh pour une meilleure UX
      // setCategories([]); 
      // setNewArrivals([]); 
      // setForYouProducts([]);
    } finally {
      setIsLoading(false); // Toujours mettre à false, même le loader initial
      setRefreshing(false);
    }
  }, []); // Tableau de dépendances vide pour que fetchData ne soit défini qu'une fois

  useEffect(() => {
    fetchData(); // Appeler au montage initial
  }, [fetchData]); // fetchData est maintenant stable grâce à useCallback

  const onRefresh = useCallback(() => {
    console.log("TabAccueilScreen: onRefresh appelé");
    setRefreshing(true);
    fetchData(); // Appelle la fonction qui mettra refreshing à false dans son finally
  }, [fetchData]);

  const handleCategoryPress = (categoryId: string) => {
    Alert.alert('Navigation Catégorie', `ID: ${categoryId}`);
    // const path = `/category/${categoryId}` as Href; // Prépare pour la navigation réelle
    // router.push(path);
  };

  const handleProductPress = (productId: string | number) => { // productId est l'ID du produit cliqué
    console.log('Tentative de navigation vers le produit ID:', productId); // Log pour déboguer
    const path = `/product/${String(productId)}` as Href; // Construit le chemin et le caste en Href
    try {
      router.push(path);
      console.log(`Navigation vers ${path} demandée.`);
    } catch (e) {
      console.error("Erreur lors de router.push:", e);
      Alert.alert("Erreur de Navigation", "Impossible d'ouvrir la page du produit.");
    }
  };
  

  // Loader pour le premier chargement uniquement si aucune donnée n'est encore affichée
  if (isLoading && categories.length === 0 && newArrivals.length === 0 && !refreshing) {
    return (
      <View style={[styles.centeredLoader, { backgroundColor: pageBackgroundColor }]}>
        <ActivityIndicator size="large" color="tomato" />
        <DefaultText style={{ marginTop: 10, color: textColor }}>Chargement des données...</DefaultText>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: pageBackgroundColor }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="tomato" />}
    >
      <View style={styles.headerContainer}>
        <DefaultText style={[styles.siteName, { color: siteNameColor }]}>Artiva</DefaultText>
      </View>

      {error && !isLoading && ( // Afficher l'erreur seulement si on ne charge plus (évite d'afficher erreur + loader)
        <View style={styles.errorContainer}>
          <DefaultText style={styles.errorText}>{error}</DefaultText>
          <Button title="Réessayer" onPress={onRefresh} color="tomato"/>
        </View>
      )}

      {(categories.length > 0 || isLoading) && !error && ( // Afficher la section si on a des données ou si on charge encore (et pas d'erreur globale)
         <ScrollSection<Category>
            title="Catégories"
            data={categories}
            renderItem={({ item }) => <CategoryCard item={item} onPress={handleCategoryPress} />}
            keyExtractor={(item) => item.id.toString()} // item.id est déjà une chaîne après adaptation
          />
      )}
      {!isLoading && !error && categories.length === 0 && (
        <DefaultText style={styles.noDataText}>Aucune catégorie disponible.</DefaultText>
      )}


      
      {(newArrivals.length > 0 || isLoading) && !error && (
         <ScrollSection<Product>
            title="Nouvelles Arrivées"
            data={newArrivals}
            renderItem={({ item }) => <ProductCard item={item} onPress={handleProductPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
      )}
       {!isLoading && !error && newArrivals.length === 0 && (
        <DefaultText style={styles.noDataText}>Aucune nouvelle arrivée pour le moment.</DefaultText>
      )}


      
      {(forYouProducts.length > 0 || isLoading) && !error && (
          <ScrollSection<Product>
            title="Pour Vous"
            data={forYouProducts}
            renderItem={({ item }) => <ProductCard item={item} onPress={handleProductPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
      )}
      {!isLoading && !error && forYouProducts.length === 0 && (
        <DefaultText style={styles.noDataText}>Pas de recommandations pour le moment.</DefaultText>
      )}
      
      <View style={{height: 30}} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  centeredLoader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  headerContainer: { 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'android' ? 40 : 30, // Plus d'espace en haut
    paddingBottom: 15, 
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Ligne de séparation subtile
  },
  siteName: { 
    fontSize: 26, // Légèrement réduit pour un look plus moderne
    fontWeight: '700', // Un peu plus gras
  },
  errorContainer: { 
    marginHorizontal: 16, 
    marginVertical: 15, 
    padding: 15, 
    backgroundColor: '#FFEBEE', // Fond rouge clair pour l'erreur
    borderRadius: 8, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { 
    color: '#D32F2F', // Rouge plus foncé pour le texte d'erreur
    fontSize: 16, 
    marginBottom: 10, 
    textAlign: 'center',
  },
  noDataText: { 
    textAlign: 'center', 
    color: '#757575', 
    marginVertical: 25, 
    fontSize: 15, 
    fontStyle: 'italic',
  }
});

