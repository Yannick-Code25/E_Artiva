// front_end/app/(tabs)/index.tsx
import React from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Text as DefaultText, // Renommé pour éviter conflit potentiel avec Text themé
  useColorScheme,
  TouchableOpacity, // Ajouté pour les fonctions "Voir tout" (même si non stylé ici)
  Platform
} from 'react-native';

// Importer nos composants réutilisables
import ScrollSection from '../../components/ScrollSection';
import CategoryCard, { Category } from '../../components/CategoryCard';
import ProductCard, { Product } from '../../components/ProductCard';

// Importer les couleurs du thème (si utilisées)
import Colors from '../../constants/Colors'; // Assure-toi que ce chemin est correct
import { useRouter } from 'expo-router'; // Pour la navigation

// --- Données Factices (Dummy Data) ---
const DUMMY_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Électronique', imageUrl: 'https://via.placeholder.com/100x100/FFD700/000000?Text=Électro' },
  { id: 'cat2', name: 'Mode Homme', imageUrl: 'https://via.placeholder.com/100x100/ADD8E6/000000?Text=Mode+H' },
  { id: 'cat3', name: 'Mode Femme', imageUrl: 'https://via.placeholder.com/100x100/FFA07A/000000?Text=Mode+F' },
  { id: 'cat4', name: 'Maison & Cuisine', imageUrl: 'https://via.placeholder.com/100x100/90EE90/000000?Text=Maison' },
  { id: 'cat5', name: 'Beauté & Soins', imageUrl: 'https://via.placeholder.com/100x100/FFC0CB/000000?Text=Beauté' },
  { id: 'cat6', name: 'Sports & Loisirs', imageUrl: 'https://via.placeholder.com/100x100/D3D3D3/000000?Text=Sport' },
];

const DUMMY_NEW_ARRIVALS: Product[] = [
  { id: 'prod1', name: 'Super Smartphone XZ', price: '699 €', imageUrl: 'https://via.placeholder.com/150x150/E6E6FA/000000?Text=Phone+XZ' },
  { id: 'prod2', name: 'Écouteurs Sans Fil Pro', price: '149 €', imageUrl: 'https://via.placeholder.com/150x150/FFFACD/000000?Text=Écouteurs' },
  { id: 'prod3', name: 'Montre Connectée Fit+', price: '229 €', imageUrl: 'https://via.placeholder.com/150x150/AFEEEE/000000?Text=Montre' },
  { id: 'prod4', name: 'Chemise Élégante Coton', price: '45 €', imageUrl: 'https://via.placeholder.com/150x150/F0E68C/000000?Text=Chemise' },
];

const DUMMY_FOR_YOU: Product[] = [
  { id: 'prod5', name: 'Sac à Dos Urbain', price: '75 €', imageUrl: 'https://via.placeholder.com/150x150/FFB6C1/000000?Text=Sac+Dos' },
  { id: 'prod6', name: 'Machine à Café Express', price: '89 €', imageUrl: 'https://via.placeholder.com/150x150/87CEFA/000000?Text=Cafetière' },
  { id: 'prod7', name: 'Jeu Vidéo Aventure Ultime', price: '59 €', imageUrl: 'https://via.placeholder.com/150x150/98FB98/000000?Text=Jeu+Vidéo' },
  { id: 'prod8', name: 'Livre Best-Seller Roman', price: '19 €', imageUrl: 'https://via.placeholder.com/150x150/FFE4B5/000000?Text=Livre' },
];
// --- Fin des Données Factices ---


export default function TabAccueilScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter(); // Hook pour la navigation
  const siteNameColor = Colors[colorScheme ?? 'light'].text;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  const handleCategoryPress = (categoryId: string) => {
    console.log('Catégorie cliquée :', categoryId);
    router.push(`/category/${categoryId}` as any); // Ajout de 'as any' pour le typage
  };

  const handleProductPress = (productId: string) => {
    console.log('Produit cliqué :', productId);
    // Plus tard: router.push(`/product/${productId}`);
  };

  const handleSeeAllCategories = () => {
    console.log('Voir toutes les catégories');
    // Plus tard: router.push('/categories');
  };

  const handleSeeAllNewArrivals = () => {
    console.log('Voir toutes les nouvelles arrivées');
    // Plus tard: router.push('/products/new');
  };

  const handleSeeAllForYou = () => {
    console.log('Voir tout "Pour Vous"');
    // Plus tard: router.push('/products/recommended');
  };
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: backgroundColor }]}
      showsVerticalScrollIndicator={false}
      // contentContainerStyle={{ paddingBottom: 20 }} // Pour un peu d'espace en bas du scroll
    >
      {/* En-tête avec le nom du site */}
      <View style={styles.headerContainer}>
        <DefaultText style={[styles.siteName, { color: siteNameColor }]}>Artiva</DefaultText>
      </View>

      {/* Section des Catégories */}
      <ScrollSection<Category>
        title="Catégories"
        data={DUMMY_CATEGORIES}
        renderItem={({ item }) => (
          <CategoryCard item={item} onPress={handleCategoryPress} />
        )}
        keyExtractor={(item) => item.id}
        onSeeAllPress={handleSeeAllCategories}
      />

      {/* Section des Nouvelles Arrivées */}
      <ScrollSection<Product>
        title="Nouvelles Arrivées"
        data={DUMMY_NEW_ARRIVALS}
        renderItem={({ item }) => (
          <ProductCard item={item} onPress={handleProductPress} />
        )}
        keyExtractor={(item) => item.id}
        onSeeAllPress={handleSeeAllNewArrivals}
      />

      {/* Section "Pour Vous" */}
      <ScrollSection<Product>
        title="Pour Vous"
        data={DUMMY_FOR_YOU}
        renderItem={({ item }) => (
          <ProductCard item={item} onPress={handleProductPress} />
        )}
        keyExtractor={(item) => item.id}
        onSeeAllPress={handleSeeAllForYou}
      />
      
      {/* Espace final pour éviter que le contenu soit collé à la barre d'onglets */}
      <View style={{ height: 30 }} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 25 : 20, // Ajustement pour la barre de statut Android
    paddingBottom: 10,
  },
  siteName: {
    fontSize: 32, // Un peu plus grand
    fontWeight: 'bold',
  },
  // Les styles pour ScrollSection, CategoryCard, ProductCard sont dans leurs fichiers respectifs.
});
