// ARTIVA/front_end/app/(tabs)/ProfileScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Modal, Button, ActivityIndicator, Alert } from 'react-native';
import { Settings, ShoppingBag, Heart, CreditCard, Bell, LogOut } from 'lucide-react-native';
import { useRouter, Href } from 'expo-router'; // Ajout de Href pour un meilleur typage
import { useAuth } from '../../context/AuthContext';

// Définition des types pour les données
interface UserData {
  profileImage?: string;
  full_name?: string;
  email?: string;
  city?: string;
  // Ajoute d'autres champs si ton API /users/me les renvoie
}

interface OrderProduct {
  productName: string;
  // Ajoute d'autres détails du produit si nécessaire
}

interface Order {
  orderId: string | number;
  createdAt: string;
  products: OrderProduct[];
  total: string | number;
  status: string;
}

// Menu Items
const menuItems: { icon: React.ElementType, title: string, subtitle: string, route?: Href }[] = [ // Typage de route avec Href
  { icon: ShoppingBag, title: 'Mes commandes', subtitle: 'Voir l\'historique' }, // Pas de route directe, ouvre le modal
  { icon: Heart, title: 'Liste de souhaits', subtitle: 'Vos produits favoris', route: '/(tabs)/wishlist' as any },
  { icon: CreditCard, title: 'Paiement', subtitle: 'Gérer les moyens', route: '/(tabs)/payment-methods' },
  { icon: Bell, title: 'Notifications', subtitle: 'Vos alertes récentes', route: '/(tabs)/notifications' },
  { icon: Settings, title: 'Paramètres', subtitle: 'Modifier le profil', route: '/(tabs)/settings' },
];

// URL de base de ton API
const API_BASE_URL = 'http://192.168.11.131:3001/api'; // **ASSURE-TOI QUE C'EST TON IP**

export default function TabProfileScreen() {
  const { user, userToken, signOut, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [userDataDetails, setUserDataDetails] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);

  const fetchUserDetails = useCallback(async () => {
    if (!userToken) return;
    console.log("ProfileScreen: Appel de fetchUserDetails");
    setIsFetchingData(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.message || `Erreur lors de la récupération des détails utilisateur (${response.status})`);
      }
      const data: UserData = await response.json();
      setUserDataDetails(data);
    } catch (err: any) {
      console.error('fetchUserDetails error:', err);
      setError(err.message || 'Impossible de charger les détails du profil.');
    } finally {
      setIsFetchingData(false);
    }
  }, [userToken]);

  const fetchUserOrders = useCallback(async () => {
    if (!userToken) return;
    console.log("ProfileScreen: Appel de fetchUserOrders");
    setIsFetchingData(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      if (!response.ok) {
        // Tenter de parser le JSON d'erreur, sinon message générique
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.message || `Erreur lors de la récupération des commandes (${response.status})`);
      }
      const ordersData: Order[] = await response.json();
      setOrders(ordersData);
    } catch (err: any) {
      console.error('fetchUserOrders error:', err);
      setError(err.message || 'Impossible de charger l\'historique des commandes.');
      setOrders([]);
    } finally {
      setIsFetchingData(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (user && userToken) {
      // Optionnel: Appeler fetchUserDetails si user de AuthContext n'est pas suffisant
      // fetchUserDetails(); 
      
      // Appeler fetchUserOrders au montage si l'utilisateur est connecté
      // (sera aussi appelé en cliquant sur "Mes commandes")
      fetchUserOrders();
    }
  }, [user, userToken, fetchUserOrders]); // fetchUserDetails si tu l'utilises ici


  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Oui", onPress: async () => { await signOut(); } }
      ]
    );
  };

  const toggleModal = () => setModalVisible(!modalVisible);

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Date non disponible';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + date.toLocaleTimeString('fr-FR');
  };

  const renderModalContent = () => {
    if (isFetchingData) { // Afficher le loader si isFetchingData est true, même si orders.length > 0 (pour un refresh)
      return <ActivityIndicator style={{ marginTop: 20, marginBottom: 20 }} size="large" color="tomato" />;
    }
    // Note: Si error est défini, fetch n'est plus en cours.
    if (error) { // Afficher l'erreur s'il y en a une, même si des commandes précédentes sont chargées
      return <Text style={styles.errorText}>{error}</Text>;
    }
    // Si pas de chargement et pas d'erreur
    if (orders.length === 0) {
      return <Text style={styles.noOrdersText}>Vous n'avez aucune commande pour le moment.</Text>;
    }
    return (
      <ScrollView style={styles.ordersContainer} nestedScrollEnabled={true}>
        {orders.map((order) => (
          <View key={order.orderId} style={styles.orderItem}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>Commande #{order.orderId || 'N/A'}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.orderProducts}>
              <Text style={styles.productsTitle}>Produits:</Text>
              {order.products && order.products.length > 0 ? (
                order.products.map((product, idx) => (
                  <Text key={idx} style={styles.productItem}>- {product.productName || 'Produit inconnu'}</Text>
                ))
              ) : (
                <Text style={styles.productItem}>Détails des produits non disponibles.</Text>
              )}
            </View>
            <View style={styles.orderFooter}>
              <Text style={styles.orderPrice}>Total: {order.total !== undefined ? order.total : 'N/A'} FCFA</Text>
              <Text style={styles.orderStatus}>Statut: {order.status || 'Inconnu'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  if (isAuthLoading) { // Chargement initial de l'état d'authentification global
    return <View style={styles.centered}><ActivityIndicator size="large" color="tomato" /></View>;
  }

  if (!user) { // Utilisateur non authentifié (devrait avoir été redirigé par AuthContext/index.tsx)
    return <View style={styles.centered}><Text>Veuillez vous connecter.</Text><Button title="Se connecter" onPress={() => router.replace('/login')} /></View>;
  }

  // Affichage principal du profil
  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 30}}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: userDataDetails?.profileImage || (user as any)?.profileImageFromAuthContext || 'https://via.placeholder.com/80?text=User' }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{userDataDetails?.full_name || user.name || 'Nom non disponible'}</Text>
            <Text style={styles.email}>{user.email || 'Email non disponible'}</Text>
            {userDataDetails?.city && <Text style={styles.location}>{userDataDetails.city}</Text>}
          </View>
        </View>
      </View>

      {/* Indicateur de chargement pour fetchUserDetails/fetchUserOrders si besoin, en dehors du modal */}
      {isFetchingData && <ActivityIndicator style={{marginVertical: 10}} size="small" color="gray"/>} 
      {/* Afficher l'erreur principale de la page ici si ce n'est pas dans le modal */}
      {error && !modalVisible && <Text style={[styles.errorText, {marginVertical:10}]}>{error}</Text>}


      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            style={styles.menuItem}
            onPress={() => {
              if (item.title === 'Mes commandes') {
                if (!modalVisible) { // Pour éviter de re-fetch si déjà ouvert, optionnel
                    fetchUserOrders();
                }
                toggleModal();
              } else if (item.route) {
                router.push(item.route); // Href est déjà typé dans menuItems
              }
            }}
          >
            <View style={styles.menuItemIcon}>
              <item.icon size={24} color="#1F2937" strokeWidth={1.5} />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={24} color="#FF4B55" strokeWidth={1.5}/>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>

      {/* Modal pour afficher les commandes */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={toggleModal}>
        <Pressable style={styles.modalOverlay} onPress={toggleModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Mes commandes</Text>
            {renderModalContent()}
            <Pressable style={styles.closeButton} onPress={toggleModal}>
                <Text style={styles.closeButtonText}>Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// Styles (ceux que tu as fournis, sans les polices Poppins pour l'instant)
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom:24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16, backgroundColor: '#E5E7EB' },
  profileInfo: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 22, color: '#1F2937' },
  email: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  location: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  menuSection: { backgroundColor: '#FFFFFF', marginTop: 24, borderRadius: 16, marginHorizontal: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity:0.1, shadowRadius:2  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemLast: { borderBottomWidth: 0 }, // Pour le dernier item du menu
  menuItemIcon: { width: 36, height: 36, backgroundColor: '#EBF4FF', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuItemContent: { flex: 1 },
  menuItemTitle: { fontWeight: '600', fontSize: 16, color: '#1F2937' },
  menuItemSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F2', marginHorizontal: 24, marginTop: 30, marginBottom: 32, padding: 16, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#FFCCD0'},
  logoutText: { fontWeight: '600', fontSize: 16, color: '#EF4444' },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, width: '100%', maxHeight: '75%', elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:-2}, shadowOpacity:0.1, shadowRadius:4 },
  modalTitle: { fontWeight: 'bold', fontSize: 20, marginBottom: 20, textAlign: 'center' },
  ordersContainer: { /* maxHeight: '80%', */ flexGrow: 0 }, // flexGrow: 0 pour éviter que ScrollView ne pousse le bouton "Fermer" en dehors de l'écran dans le modal
  orderItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNumber: { fontWeight: 'bold', fontSize: 16, color: '#1F2937' },
  orderDate: { fontSize: 13, color: '#6B7280' },
  orderProducts: { marginLeft: 8, marginBottom: 8 },
  productsTitle: { fontWeight: '600', fontSize: 14, color: '#374151', marginBottom: 4 },
  productItem: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  orderFooter: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderPrice: { fontWeight: 'bold', fontSize: 16, color: '#10B981' },
  orderStatus: { fontSize: 14, color: '#F59E0B', fontWeight: '500' },
  noOrdersText: { fontSize: 16, color: '#6B7280', textAlign: 'center', paddingVertical: 20 },
  closeButton: { backgroundColor: 'tomato', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 20},
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold'},
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center', marginVertical: 15, paddingHorizontal: 10 },
});