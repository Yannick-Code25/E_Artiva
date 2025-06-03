// ARTIVA/front_end/app/(tabs)/NotificationsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Button, Platform, RefreshControl, Alert 
} from 'react-native';
import { Stack, useRouter, Href } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons'; // Pour les icônes
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import { useAuth } from '../context/AuthContext'; // Pour le token utilisateur

const API_BASE_URL = 'http://192.168.248.151:3001/api'; // **METS TON IP**

interface NotificationItem {
  id: string | number;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string; // ou Date
  updated_at?: string; // ou Date
}

export default function NotificationsPage() {
  const { userToken } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const cardColor = Colors[colorScheme ?? 'light'].card;
  const subtleTextColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pour la pagination (si tu l'utilises pleinement)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (page = 1, isRefreshing = false) => {
    if (!userToken) {
      if (!isRefreshing) setIsLoading(true); // Pour le premier chargement
      setError("Veuillez vous connecter pour voir vos notifications.");
      if (!isRefreshing) setIsLoading(false);
      setRefreshing(false);
      return;
    }
    
console.log(`NotificationsScreen: Fetching notifications, page: ${page}, isAction: ${isRefreshing}`);    if (page === 1 && !isRefreshing) setIsLoading(true); // Loader pour la première page ou si pas un refresh
    // Mettre isLoading à true seulement pour le chargement initial de la page,
  // ou si on charge plus, ou si c'est une action explicite comme "tout lu"
  if ((page === 1 && !notifications.length && !error) || page > 1 || isRefreshing) {
      if (page > 1) setIsLoadingMore(true);
      else setIsLoading(true); // Loader principal ou pour action
  }
  if (page === 1 && !isRefreshing) setError(null); // Reset error pour premier chargemen

    try {
      // Ajoute &read_status=unread si tu veux filtrer par défaut
      const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=15`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: `HTTP ${response.status}`}));
        throw new Error(errData.message || 'Erreur chargement notifications');
      }
      const data = await response.json(); // API renvoie { notifications: [], currentPage, totalPages, totalItems }
      
      const newNotifications = data.notifications.map((n: any) => ({
          ...n,
          id: String(n.id) // S'assurer que l'ID est une chaîne pour les clés
      }));

      setNotifications(prev => (page === 1 ? newNotifications : [...prev, ...newNotifications]));
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);

    } catch (err: any) {
      console.error("NotificationsScreen: Erreur fetchNotifications:", err);
      setError(err.message || 'Impossible de charger les notifications.');
      if (page === 1) setNotifications([]); // Vider si erreur sur la première page
    } finally {
      setIsLoading(false); // Toujours false ici
    setIsLoadingMore(false);
    if (isRefreshing) setRefreshing(false); // Important pour le RefreshControl
    }
  }, [userToken, notifications.length, error]); // Ajout de notifications.length et error pour conditionner setIsLoading

  useEffect(() => {
    if (userToken) { // Charger seulement si l'utilisateur est connecté
      console.log("NotificationsScreen: useEffect [userToken, fetchNotifications] - Appel fetchNotifications");
        fetchNotifications(1, false);
    } else {
        setNotifications([]); // Vider les notifications si l'utilisateur se déconnecte
        setIsLoading(false);
    }
  }, [userToken]); // Re-fetch si userToken change

  const onRefresh = useCallback(() => {
  setRefreshing(true);
  setCurrentPage(1); 
  fetchNotifications(1, true); // isRefreshingOrAction = true
}, [fetchNotifications]); // fetchNotifications est stable

  const loadMoreNotifications = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      console.log("Chargement page suivante de notifications...");
      fetchNotifications(currentPage + 1);
    }
  };

   const handleNotificationPress = async (notification: NotificationItem) => {
    console.log("Notification cliquée:", notification.id, "Lien:", notification.link_url, "Déjà lue:", notification.is_read);
    
    // 1. Marquer comme lue (si pas déjà lue et si utilisateur connecté)
    if (!notification.is_read && userToken) {
       // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
    );
      try {
        console.log(`Marquage de la notification ${notification.id} comme lue...`);
        const response = await fetch(`${API_BASE_URL}/notifications/${notification.id}/read`, { // Assure-toi que cet endpoint existe
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${userToken}` },
        });
        if (!response.ok) {
          // Revert optimistic update if API call fails
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: false } : n) // Remettre à non lu
        );
            const errorData = await response.json().catch(() => ({message: `HTTP ${response.status}`}));
            console.warn(`Échec du marquage de la notification ${notification.id} comme lue: ${errorData.message}`);
            // Ne pas bloquer la navigation pour une erreur de marquage comme lu, mais logger
        } else {
            console.log(`Notification ${notification.id} marquée comme lue avec succès.`);
            // Mettre à jour l'état local pour refléter le changement immédiatement
            setNotifications(prev => 
              prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
            );
        }
      } catch (e) {
        console.error("Erreur API marquage notif comme lue:", e);
      }
    }

    // 2. Naviguer si link_url existe
    if (notification.link_url && typeof notification.link_url === 'string' && notification.link_url.trim() !== '') {
      try {
        const path = notification.link_url as Href; // Caster en Href
        console.log(`Tentative de navigation vers le lien de la notification: ${path}`);
        router.push(path);
      } catch (e) {
        console.error("Erreur de navigation depuis la notification:", e);
        Alert.alert("Erreur de lien", "Le lien de cette notification semble invalide.");
      }
    } else {
        console.log("Aucun link_url valide pour cette notification ou navigation non nécessaire.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userToken || notifications.filter(n => !n.is_read).length === 0) return;
    Alert.alert(
        "Marquer tout comme lu",
        "Êtes-vous sûr de vouloir marquer toutes les notifications comme lues ?",
        [
            { text: "Annuler", style: "cancel" },
            { text: "Oui", onPress: async () => {
              // Pas besoin de setIsLoading(true) ici, car on fait une mise à jour optimiste
          // puis on re-fetch si l'API réussit.
          const previousNotifications = [...notifications]; // Sauvegarde pour revert
          // Mise à jour optimiste de l'UI
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                try {
                    setIsLoading(true); // Ou un loader spécifique

                    // Mise à jour optimiste de l'UI
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

                    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${userToken}` },
                    });

                    if (!response.ok) { // Si l'API échoue, annuler la mise à jour optimiste
                  setNotifications(previousNotifications);
                  const errData = await response.json().catch(() => ({message: `HTTP ${response.status}`}));
                  throw new Error(errData.message || "Échec API Tout Lu");
              }
              const data = await response.json(); // Lire la réponse { message, updatedCount }
              console.log("Réponse API 'Tout lu':", data); 
    // Normalement, pas besoin de re-fetch ici si la MàJ optimiste est faite
              console.log("NotificationsScreen: API 'Tout lu' succès. Les notifications devraient être à jour.");
              // Optionnel: re-fetch pour confirmer avec le serveur, mais la MàJ optimiste suffit souvent.
              // Si tu re-fetch, assure-toi que ça ne boucle pas.
              // fetchNotifications(1, true); // Indiquer que c'est une action, donc un refresh.
                } catch (e : any) {
                    console.error("Erreur marquage toutes notifs comme lues:", e);
                    Alert.alert("Erreur", "Impossible de marquer toutes les notifications comme lues.");
                    setNotifications(previousNotifications); // Revert en cas d'erreur
                } finally {
                    // setIsLoading(false); // fetchNotifications le fera
                }
            }}
        ]
    );
  };


  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, {backgroundColor: item.is_read ? cardColor : Colors[colorScheme??'light'].tint + '20' }]} // Fond différent si non lue
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIconArea}>
        <FontAwesome 
            name={item.type === 'order_status_update' ? "truck" : "bell"} // Exemple d'icône par type
            size={24} 
            color={item.is_read ? subtleTextColor : tintColor} 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, {color: textColor}, !item.is_read && styles.unreadText]}>{item.title}</Text>
        <Text style={[styles.notificationMessage, {color: subtleTextColor}, !item.is_read && styles.unreadTextLight]} numberOfLines={2}>{item.message}</Text>
        <Text style={[styles.notificationDate, {color: subtleTextColor}]}>{new Date(item.created_at).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})} à {new Date(item.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Si l'utilisateur n'est pas connecté (après le chargement initial de AuthContext)
  if (!isLoading && !userToken) {
    return (
      <View style={styles.centered}>
        <Text style={{color: textColor, fontSize: 16, textAlign: 'center', marginBottom: 20}}>
          Veuillez vous connecter pour voir vos notifications.
        </Text>
        <Button title="Se connecter" onPress={() => router.push('/login')} color={tintColor}/>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, {backgroundColor}]}>
      <Stack.Screen options={{ title: ' Mes Notifications', headerBackTitle: 'Retour' }} />
      <View style={[{ borderBottomColor: subtleTextColor, backgroundColor: cardColor }]}>
        
        {notifications.some(n => !n.is_read) && ( // Affiche seulement s'il y a des non lues
             <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllReadButton}>
                <Text style={{color: tintColor, fontSize: 14}}>Tout lu</Text>
            </TouchableOpacity>
        )}
      </View>

      {isLoading && notifications.length === 0 && !refreshing ? ( // Loader principal seulement si la liste est vide ET qu'on n'est pas en train de rafraîchir
        <View style={styles.centered}><ActivityIndicator size="large" color={tintColor}/></View>
      ) : error && notifications.length === 0 ? (
        <View style={styles.centered}><Text style={{color: 'red'}}>{error}</Text><Button title="Réessayer" onPress={() => fetchNotifications(1, true)} color={tintColor}/></View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="bell-slash-o" size={60} color={subtleTextColor} />
          <Text style={[styles.emptyText, {color: textColor}]}>Aucune notification pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor}/>}
          onEndReached={loadMoreNotifications} // Pour charger plus d'items en scrollant
          onEndReachedThreshold={0.5} // Se déclenche quand le dernier item est à mi-chemin de la fin de la liste
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{marginVertical:20}} color={tintColor}/> : null}
        />
      )}
    </View>
  );
}

// Styles (inspirés de CartScreen et ProfileScreen)
const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, },
  customHeaderTitle: { fontSize: 20, fontWeight: 'bold', },
  markAllReadButton: { paddingVertical: 5, paddingHorizontal:10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding:20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, marginTop: 20, marginBottom: 30, textAlign: 'center' },
  listContainer: { padding: 10, },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent', // Sera surchargé par la couleur de fond si non lu
  },
  notificationIconArea: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    // color: '#777', // Géré par subtleTextColor
  },
  unreadText: {
    fontWeight: 'bold', // Pour le titre et le message si non lu
  },
  unreadTextLight: {
    // Optionnel: Si tu veux que le message non lu soit moins gras que le titre
  },
  unreadDot: { // Petit point pour indiquer non lu
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'tomato', // Ou tintColor
    alignSelf: 'center',
    marginLeft: 10,
  },
});