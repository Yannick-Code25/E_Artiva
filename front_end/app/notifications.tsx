// // ARTIVA/front_end/app/(tabs)/NotificationsScreen.tsx
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   Button,
//   Platform,
//   RefreshControl,
//   Alert,
// } from "react-native";
// import { Stack, useRouter, Href } from "expo-router";
// import { FontAwesome, Ionicons } from "@expo/vector-icons"; // Pour les icônes
// import Colors from "../constants/Colors";
// import { useColorScheme } from "../components/useColorScheme";
// import { useAuth } from "../context/AuthContext"; // Pour le token utilisateur

// const API_BASE_URL = "http://192.168.1.2:3001/api"; // **METS TON IP**

// interface NotificationItem {
//   id: string | number;
//   type: string;
//   title: string;
//   message: string;
//   link_url?: string;
//   is_read: boolean;
//   created_at: string; // ou Date
//   updated_at?: string; // ou Date
// }

// export default function NotificationsPage() {
//   const { userToken, fetchUnreadNotificationCount } = useAuth();
//   const router = useRouter();
//   const colorScheme = useColorScheme();
//   const tintColor = Colors[colorScheme ?? "light"].tint;
//   const textColor = Colors[colorScheme ?? "light"].text;
//   const backgroundColor = Colors[colorScheme ?? "light"].background;
//   const cardColor = Colors[colorScheme ?? "light"].card;
//   const subtleTextColor = Colors[colorScheme ?? "light"].tabIconDefault;

//   const [notifications, setNotifications] = useState<NotificationItem[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // Pour la pagination (si tu l'utilises pleinement)
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);

//   const fetchNotifications = useCallback(
//     async (page = 1, isRefreshing = false) => {
//       if (!userToken) {
//         if (!isRefreshing) setIsLoading(true); // Pour le premier chargement
//         setError("Veuillez vous connecter pour voir vos notifications.");
//         if (!isRefreshing) setIsLoading(false);
//         setRefreshing(false);
//         return;
//       }

//       console.log(
//         `NotificationsScreen: Fetching notifications, page: ${page}, isAction: ${isRefreshing}`
//       );
//       if (page === 1 && !isRefreshing) setIsLoading(true); // Loader pour la première page ou si pas un refresh
//       // Mettre isLoading à true seulement pour le chargement initial de la page,
//       // ou si on charge plus, ou si c'est une action explicite comme "tout lu"
//       if (
//         (page === 1 && !notifications.length && !error) ||
//         page > 1 ||
//         isRefreshing
//       ) {
//         if (page > 1) setIsLoadingMore(true);
//         else setIsLoading(true); // Loader principal ou pour action
//       }
//       if (page === 1 && !isRefreshing) setError(null); // Reset error pour premier chargemen

//       try {
//         // Ajoute &read_status=unread si tu veux filtrer par défaut
//         const response = await fetch(
//           `${API_BASE_URL}/notifications?page=${page}&limit=15`,
//           {
//             headers: { Authorization: `Bearer ${userToken}` },
//           }
//         );

//         if (!response.ok) {
//           const errData = await response
//             .json()
//             .catch(() => ({ message: `HTTP ${response.status}` }));
//           throw new Error(errData.message || "Erreur chargement notifications");
//         }
//         const data = await response.json(); // API renvoie { notifications: [], currentPage, totalPages, totalItems }

//         const newNotifications = data.notifications.map((n: any) => ({
//           ...n,
//           id: String(n.id), // S'assurer que l'ID est une chaîne pour les clés
//         }));

//         setNotifications((prev) =>
//           page === 1 ? newNotifications : [...prev, ...newNotifications]
//         );
//         setCurrentPage(data.currentPage);
//         setTotalPages(data.totalPages);
//       } catch (err: any) {
//         console.error("NotificationsScreen: Erreur fetchNotifications:", err);
//         setError(err.message || "Impossible de charger les notifications.");
//         if (page === 1) setNotifications([]); // Vider si erreur sur la première page
//       } finally {
//         setIsLoading(false); // Toujours false ici
//         setIsLoadingMore(false);
//         if (isRefreshing) setRefreshing(false); // Important pour le RefreshControl
//       }
//     },
//     [userToken, notifications.length, error]
//   ); // Ajout de notifications.length et error pour conditionner setIsLoading

//   useEffect(() => {
//     if (userToken) {
//       // Charger seulement si l'utilisateur est connecté
//       console.log(
//         "NotificationsScreen: useEffect [userToken, fetchNotifications] - Appel fetchNotifications"
//       );
//       fetchNotifications(1, false);
//     } else {
//       setNotifications([]); // Vider les notifications si l'utilisateur se déconnecte
//       setIsLoading(false);
//     }
//   }, [userToken]); // Re-fetch si userToken change

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     setCurrentPage(1);
//     fetchNotifications(1, true); // isRefreshingOrAction = true
//   }, [fetchNotifications]); // fetchNotifications est stable

//   const loadMoreNotifications = () => {
//     if (!isLoadingMore && currentPage < totalPages) {
//       console.log("Chargement page suivante de notifications...");
//       fetchNotifications(currentPage + 1);
//     }
//   };

//   const handleNotificationPress = async (notification: NotificationItem) => {
//     console.log(
//       "Notification cliquée:",
//       notification.id,
//       "Lien:",
//       notification.link_url,
//       "Déjà lue:",
//       notification.is_read
//     );

//     // 1. Marquer comme lue (si pas déjà lue et si utilisateur connecté)
//     if (!notification.is_read && userToken) {
//       // Optimistic UI update
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n.id === notification.id ? { ...n, is_read: true } : n
//         )
//       );

//       try {
//         console.log(
//           `Marquage de la notification ${notification.id} comme lue...`
//         );
//         const response = await fetch(
//           `${API_BASE_URL}/notifications/${notification.id}/read`,
//           {
//             // Assure-toi que cet endpoint existe
//             method: "PUT",
//             headers: { Authorization: `Bearer ${userToken}` },
//           }
//         );
//         if (response.ok && !notification.is_read) {
//           // Si le marquage a réussi
//           setNotifications((prev) =>
//             prev.map((n) =>
//               n.id === notification.id ? { ...n, is_read: true } : n
//             )
//           );
//           fetchUnreadNotificationCount(); // Mettre à jour le badge
//         }
//         if (!response.ok) {
//           // Revert optimistic update if API call fails
//           setNotifications(
//             (prev) =>
//               prev.map((n) =>
//                 n.id === notification.id ? { ...n, is_read: false } : n
//               ) // Remettre à non lu
//           );
//           const errorData = await response
//             .json()
//             .catch(() => ({ message: `HTTP ${response.status}` }));
//           console.warn(
//             `Échec du marquage de la notification ${notification.id} comme lue: ${errorData.message}`
//           );
//           // Ne pas bloquer la navigation pour une erreur de marquage comme lu, mais logger
//         } else {
//           console.log(
//             `Notification ${notification.id} marquée comme lue avec succès.`
//           );
//           // Mettre à jour l'état local pour refléter le changement immédiatement
//           setNotifications((prev) =>
//             prev.map((n) =>
//               n.id === notification.id ? { ...n, is_read: true } : n
//             )
//           );
//         }
//       } catch (e) {
//         console.error("Erreur API marquage notif comme lue:", e);
//       }
//     }

//     // 2. Naviguer si link_url existe
//     if (
//       notification.link_url &&
//       typeof notification.link_url === "string" &&
//       notification.link_url.trim() !== ""
//     ) {
//       try {
//         const path = notification.link_url as Href; // Caster en Href
//         console.log(
//           `Tentative de navigation vers le lien de la notification: ${path}`
//         );
//         router.push(path);
//       } catch (e) {
//         console.error("Erreur de navigation depuis la notification:", e);
//         Alert.alert(
//           "Erreur de lien",
//           "Le lien de cette notification semble invalide."
//         );
//       }
//     } else {
//       console.log(
//         "Aucun link_url valide pour cette notification ou navigation non nécessaire."
//       );
//     }
//   };

//   // Dans NotificationsScreen.tsx

//   const handleMarkAllAsRead = async () => {
//     // 1. Vérifier si l'action est nécessaire ou possible
//     const unreadNotifications = notifications.filter((n) => !n.is_read);
//     if (!userToken || unreadNotifications.length === 0) {
//       console.log(
//         "handleMarkAllAsRead: Pas de token ou aucune notification non lue."
//       );
//       return; // Sortir si pas de token ou si tout est déjà lu
//     }

//     Alert.alert(
//       "Marquer tout comme lu",
//       "Êtes-vous sûr de vouloir marquer toutes les notifications comme lues ?",
//       [
//         {
//           text: "Annuler",
//           style: "cancel",
//         },
//         {
//           text: "Oui",
//           onPress: async () => {
//             const previousNotificationsState = [...notifications]; // Sauvegarder l'état actuel pour un revert potentiel

//             // 2. Mise à jour optimiste de l'UI
//             // On met toutes les notifications à 'is_read: true' dans l'état local
//             setNotifications((prev) =>
//               prev.map((n) => ({ ...n, is_read: true }))
//             );
//             console.log(
//               "handleMarkAllAsRead: Mise à jour optimiste UI effectuée."
//             );

//             // On peut mettre un loader spécifique pour cette action si on veut,
//             // mais comme l'UI est déjà mise à jour, ce n'est pas toujours nécessaire.
//             // Si tu veux un loader pendant l'appel API :
//             // setIsLoading(true); // Ou un état de chargement spécifique à cette action

//             try {
//               // 3. Appel API
//               console.log(
//                 "handleMarkAllAsRead: Appel API vers /notifications/read-all"
//               );
//               const response = await fetch(
//                 `${API_BASE_URL}/notifications/read-all`,
//                 {
//                   method: "PUT",
//                   headers: {
//                     Authorization: `Bearer ${userToken}`,
//                     "Content-Type": "application/json", // Même si pas de corps, c'est une bonne pratique
//                   },
//                 }
//               );
//               if (response.ok) {
//                 setNotifications((prev) =>
//                   prev.map((n) => ({ ...n, is_read: true }))
//                 );
//                 fetchUnreadNotificationCount();
//               }

//               if (!response.ok) {
//                 // 4a. Si l'API échoue, annuler la mise à jour optimiste
//                 setNotifications(previousNotificationsState);
//                 const errorData = await response.json().catch(() => ({
//                   message: `Erreur HTTP ${response.status} lors de la tentative de marquer tout comme lu.`,
//                 }));
//                 console.error(
//                   "handleMarkAllAsRead: Échec API Tout Lu - Erreur:",
//                   errorData.message || `Statut ${response.status}`
//                 );
//                 Alert.alert(
//                   "Erreur",
//                   errorData.message ||
//                     "Impossible de marquer toutes les notifications comme lues."
//                 );
//                 throw new Error(errorData.message || "Échec API Tout Lu"); // Pour que le catch externe le voie
//               }

//               const data = await response.json(); // Lire la réponse { message, updatedCount }
//               console.log("handleMarkAllAsRead: Réponse API 'Tout lu':", data);
//               // La mise à jour optimiste a déjà fait le travail visuel.
//               // Pas besoin de re-fetcher toute la liste ici, sauf si la réponse API
//               // contenait des informations cruciales que la mise à jour optimiste n'a pas.
//               // Si tu veux absolument être synchrone avec le serveur :
//               // console.log("handleMarkAllAsRead: Succès API, re-fetching notifications...");
//               // fetchNotifications(1, true); // 'true' pour indiquer que c'est un refresh/action
//             } catch (e: any) {
//               // Ce catch attrape les erreurs réseau de fetch ou l'erreur jetée par le !response.ok
//               console.error(
//                 "handleMarkAllAsRead: Erreur dans le bloc try/catch API:",
//                 e.message
//               );
//               // Si l'erreur n'est pas une alerte, on peut en afficher une générique
//               if (!Alert.alert) {
//                 // Vérifier si Alert a déjà été affiché (pas une super méthode)
//                 //Alert.alert("Erreur", e.message || "Une erreur s'est produite.");
//               }
//               // S'assurer de revert si ce n'est pas déjà fait (au cas où l'erreur est avant le !response.ok)
//               setNotifications(previousNotificationsState);
//             } finally {
//               // Si tu avais mis un setIsLoading(true) spécifique pour cette action :
//               // setIsLoading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
//     <TouchableOpacity
//       style={[
//         styles.notificationItem,
//         {
//           backgroundColor: item.is_read
//             ? cardColor
//             : Colors[colorScheme ?? "light"].tint + "20",
//         },
//       ]} // Fond différent si non lue
//       onPress={() => handleNotificationPress(item)}
//     >
//       <View style={styles.notificationIconArea}>
//         <FontAwesome
//           name={item.type === "order_status_update" ? "truck" : "bell"} // Exemple d'icône par type
//           size={24}
//           color={item.is_read ? subtleTextColor : tintColor}
//         />
//       </View>
//       <View style={styles.notificationContent}>
//         <Text
//           style={[
//             styles.notificationTitle,
//             { color: textColor },
//             !item.is_read && styles.unreadText,
//           ]}
//         >
//           {item.title}
//         </Text>
//         <Text
//           style={[
//             styles.notificationMessage,
//             { color: subtleTextColor },
//             !item.is_read && styles.unreadTextLight,
//           ]}
//           numberOfLines={2}
//         >
//           {item.message}
//         </Text>
//         <Text style={[styles.notificationDate, { color: subtleTextColor }]}>
//           {new Date(item.created_at).toLocaleDateString("fr-FR", {
//             day: "2-digit",
//             month: "short",
//           })}{" "}
//           à{" "}
//           {new Date(item.created_at).toLocaleTimeString("fr-FR", {
//             hour: "2-digit",
//             minute: "2-digit",
//           })}
//         </Text>
//       </View>
//       {!item.is_read && <View style={styles.unreadDot} />}
//     </TouchableOpacity>
//   );

//   // Si l'utilisateur n'est pas connecté (après le chargement initial de AuthContext)
//   if (!isLoading && !userToken) {
//     return (
//       <View style={styles.centered}>
//         <Text
//           style={{
//             color: textColor,
//             fontSize: 16,
//             textAlign: "center",
//             marginBottom: 20,
//           }}
//         >
//           Veuillez vous connecter pour voir vos notifications.
//         </Text>
//         <Button
//           title="Se connecter"
//           onPress={() => router.push("/login")}
//           color={tintColor}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.screenContainer, { backgroundColor }]}>
//       <Stack.Screen
//         options={{ title: " Mes Notifications", headerBackTitle: "Retour" }}
//       />
//       <View
//         style={[
//           { borderBottomColor: subtleTextColor, backgroundColor: cardColor },
//         ]}
//       >
//         {notifications.some((n) => !n.is_read) && ( // Affiche seulement s'il y a des non lues
//           <TouchableOpacity
//             onPress={handleMarkAllAsRead}
//             style={styles.markAllReadButton}
//           >
//             <Text style={{ color: tintColor, fontSize: 14 }}>Tout lu</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {isLoading && notifications.length === 0 && !refreshing ? ( // Loader principal seulement si la liste est vide ET qu'on n'est pas en train de rafraîchir
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color={tintColor} />
//         </View>
//       ) : error && notifications.length === 0 ? (
//         <View style={styles.centered}>
//           <Text style={{ color: "red" }}>{error}</Text>
//           <Button
//             title="Réessayer"
//             onPress={() => fetchNotifications(1, true)}
//             color={tintColor}
//           />
//         </View>
//       ) : notifications.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <FontAwesome name="bell-slash-o" size={60} color={subtleTextColor} />
//           <Text style={[styles.emptyText, { color: textColor }]}>
//             Aucune notification pour le moment.
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={notifications}
//           renderItem={renderNotificationItem}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={styles.listContainer}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor={tintColor}
//             />
//           }
//           onEndReached={loadMoreNotifications} // Pour charger plus d'items en scrollant
//           onEndReachedThreshold={0.5} // Se déclenche quand le dernier item est à mi-chemin de la fin de la liste
//           ListFooterComponent={
//             isLoadingMore ? (
//               <ActivityIndicator
//                 style={{ marginVertical: 20 }}
//                 color={tintColor}
//               />
//             ) : null
//           }
//         />
//       )}
//     </View>
//   );
// }

// // Styles (inspirés de CartScreen et ProfileScreen)
// const styles = StyleSheet.create({
//   screenContainer: { flex: 1 },
//   customHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     paddingTop: Platform.OS === "android" ? 40 : 15,
//     borderBottomWidth: 1,
//   },
//   customHeaderTitle: { fontSize: 20, fontWeight: "bold" },
//   markAllReadButton: { paddingVertical: 5, paddingHorizontal: 10 },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 18,
//     marginTop: 20,
//     marginBottom: 30,
//     textAlign: "center",
//   },
//   listContainer: { padding: 10 },
//   notificationItem: {
//     flexDirection: "row",
//     padding: 15,
//     marginBottom: 10,
//     borderRadius: 8,
//     elevation: 1.5,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//     borderWidth: 1,
//     borderColor: "transparent", // Sera surchargé par la couleur de fond si non lu
//   },
//   notificationIconArea: {
//     marginRight: 15,
//     justifyContent: "center",
//     alignItems: "center",
//     width: 30,
//   },
//   notificationContent: {
//     flex: 1,
//   },
//   notificationTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 3,
//   },
//   notificationMessage: {
//     fontSize: 14,
//     marginBottom: 5,
//     lineHeight: 20,
//   },
//   notificationDate: {
//     fontSize: 12,
//     // color: '#777', // Géré par subtleTextColor
//   },
//   unreadText: {
//     fontWeight: "bold", // Pour le titre et le message si non lu
//   },
//   unreadTextLight: {
//     // Optionnel: Si tu veux que le message non lu soit moins gras que le titre
//   },
//   unreadDot: {
//     // Petit point pour indiquer non lu
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: "tomato", // Ou tintColor
//     alignSelf: "center",
//     marginLeft: 10,
//   },
// });






// ARTIVA/front_end/app/notifications.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Platform,
  RefreshControl,
} from "react-native";
import { Stack, useRouter, Href } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons"; // Pour les icônes
import Colors from "../constants/Colors";
import { useColorScheme } from "../components/useColorScheme";
import { useAuth } from "../context/AuthContext"; // Pour le token utilisateur

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **METS TON IP**

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
  const { userToken, fetchUnreadNotificationCount, effectiveAppColorScheme } = useAuth();
  const router = useRouter();

  // CHANGEMENT: Utilisation des couleurs dynamiques du thème partout
  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = Colors[currentScheme];
  const tintColor = colors.tint;
  const textColor = colors.text;
  const backgroundColor = colors.background;
  const subtleTextColor = colors.subtleText;
  const card = colors.card;


  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // Ajout pour les messages de succès

  // Pour la pagination (si tu l'utilises pleinement)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchNotifications = useCallback(
    async (page = 1, isRefreshing = false) => {
      if (!userToken) {
        if (!isRefreshing) setIsLoading(true); // Pour le premier chargement
        setError("Veuillez vous connecter pour voir vos notifications.");
        setSuccessMessage(null);  // Effacer le message de succes
        if (!isRefreshing) setIsLoading(false);
        setRefreshing(false);
        return;
      }

      console.log(
        `NotificationsScreen: Fetching notifications, page: ${page}, isAction: ${isRefreshing}`
      );
      if (page === 1 && !isRefreshing) setIsLoading(true); // Loader pour la première page ou si pas un refresh
      // Mettre isLoading à true seulement pour le chargement initial de la page,
      // ou si on charge plus, ou si c'est une action explicite comme "tout lu"
      if (
        (page === 1 && !notifications.length && !error) ||
        page > 1 ||
        isRefreshing
      ) {
        if (page > 1) setIsLoadingMore(true);
        else setIsLoading(true); // Loader principal ou pour action
      }
      if (page === 1 && !isRefreshing) setError(null); // Reset error pour premier chargement
        setSuccessMessage(null)

      try {
        // Ajoute &read_status=unread si tu veux filtrer par défaut
        const response = await fetch(
          `${API_BASE_URL}/notifications?page=${page}&limit=15`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
          throw new Error(errData.message || "Erreur chargement notifications");
        }
        const data = await response.json(); // API renvoie { notifications: [], currentPage, totalPages, totalItems }

        const newNotifications = data.notifications.map((n: any) => ({
          ...n,
          id: String(n.id), // S'assurer que l'ID est une chaîne pour les clés
        }));

        setNotifications((prev) =>
          page === 1 ? newNotifications : [...prev, ...newNotifications]
        );
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        console.error("NotificationsScreen: Erreur fetchNotifications:", err);
        setError(err.message || "Impossible de charger les notifications.");
          setSuccessMessage(null);
        if (page === 1) setNotifications([]); // Vider si erreur sur la première page
      } finally {
        setIsLoading(false); // Toujours false ici
        setIsLoadingMore(false);
        if (isRefreshing) setRefreshing(false); // Important pour le RefreshControl
      }
    },
    [userToken, notifications.length, error]
  ); // Ajout de notifications.length et error pour conditionner setIsLoading

  useEffect(() => {
    if (userToken) {
      // Charger seulement si l'utilisateur est connecté
      console.log(
        "NotificationsScreen: useEffect [userToken, fetchNotifications] - Appel fetchNotifications"
      );
      fetchNotifications(1, false);
    } else {
      setNotifications([]); // Vider les notifications si l'utilisateur se déconnecte
      setIsLoading(false);
    }
  }, [userToken]); // Re-fetch si userToken change

  const onRefresh = useCallback(() => {
    setRefreshing(true); // Correction : utiliser setRefreshing ici
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
    console.log(
      "Notification cliquée:",
      notification.id,
      "Lien:",
      notification.link_url,
      "Déjà lue:",
      notification.is_read
    );

    // 1. Marquer comme lue (si pas déjà lue et si utilisateur connecté)
    if (!notification.is_read && userToken) {
      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );

      try {
        console.log(
          `Marquage de la notification ${notification.id} comme lue...`
        );
        const response = await fetch(
          `${API_BASE_URL}/notifications/${notification.id}/read`,
          {
            // Assure-toi que cet endpoint existe
            method: "PUT",
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );
        if (response.ok && !notification.is_read) {
          // Si le marquage a réussi
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, is_read: true } : n
            )
          );
          fetchUnreadNotificationCount(); // Mettre à jour le badge
          setSuccessMessage("Notification marquée comme lue !");
          setTimeout(() => setSuccessMessage(null), 3000);
        }
        if (!response.ok) {
          // Revert optimistic update if API call fails
          setNotifications(
            (prev) =>
              prev.map((n) =>
                n.id === notification.id ? { ...n, is_read: false } : n
              ) // Remettre à non lu
          );
          const errorData = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
          console.warn(
            `Échec du marquage de la notification ${notification.id} comme lue: ${errorData.message}`
          );
            setError(errorData.message || "Impossible de marquer la notification comme lue.");
            setTimeout(() => setError(null), 3000);
          // Ne pas bloquer la navigation pour une erreur de marquage comme lu, mais logger
        } else {
          console.log(
            `Notification ${notification.id} marquée comme lue avec succès.`
          );
          // Mettre à jour l'état local pour refléter le changement immédiatement
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, is_read: true } : n
            )
          );
        }
      } catch (e) {
        console.error("Erreur API marquage notif comme lue:", e);
        setError("Erreur lors de la communication avec le serveur.");
          setTimeout(() => setError(null), 3000);
      }
    }

    // 2. Naviguer si link_url existe
    if (
      notification.link_url &&
      typeof notification.link_url === "string" &&
      notification.link_url.trim() !== ""
    ) {
      try {
        const path = notification.link_url as Href; // Caster en Href
        console.log(
          `Tentative de navigation vers le lien de la notification: ${path}`
        );
        router.push(path);
      } catch (e) {
        console.error("Erreur de navigation depuis la notification:", e);
        setError("Le lien de cette notification semble invalide.");
          setTimeout(() => setError(null), 3000);
      }
    } else {
      console.log(
        "Aucun link_url valide pour cette notification ou navigation non nécessaire."
      );
    }
  };

  // Dans NotificationsScreen.tsx

  const handleMarkAllAsRead = async () => {
    // 1. Vérifier si l'action est nécessaire ou possible
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (!userToken || unreadNotifications.length === 0) {
      console.log(
        "handleMarkAllAsRead: Pas de token ou aucune notification non lue."
      );
      return; // Sortir si pas de token ou si tout est déjà lu
    }

      /*Alert.alert( // Alert retiré
      "Marquer tout comme lu",
      "Êtes-vous sûr de vouloir marquer toutes les notifications comme lues ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          onPress: async () => {*/
            const previousNotificationsState = [...notifications]; // Sauvegarder l'état actuel pour un revert potentiel

            // 2. Mise à jour optimiste de l'UI
            // On met toutes les notifications à 'is_read: true' dans l'état local
            setNotifications((prev) =>
              prev.map((n) => ({ ...n, is_read: true }))
            );
            console.log(
              "handleMarkAllAsRead: Mise à jour optimiste UI effectuée."
            );

            // On peut mettre un loader spécifique pour cette action si on veut,
            // mais comme l'UI est déjà mise à jour, ce n'est pas toujours nécessaire.
            // Si tu veux un loader pendant l'appel API :
            // setIsLoading(true); // Ou un état de chargement spécifique à cette action

            try {
              // 3. Appel API
              console.log(
                "handleMarkAllAsRead: Appel API vers /notifications/read-all"
              );
              const response = await fetch(
                `${API_BASE_URL}/notifications/read-all`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${userToken}`,
                    "Content-Type": "application/json", // Même si pas de corps, c'est une bonne pratique
                  },
                }
              );
              if (response.ok) {
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, is_read: true }))
                );
                fetchUnreadNotificationCount();
                  setSuccessMessage("Toutes les notifications ont été marquées comme lues.");
                  setTimeout(() => setSuccessMessage(null), 3000);
              }

              if (!response.ok) {
                // 4a. Si l'API échoue, annuler la mise à jour optimiste
                setNotifications(previousNotificationsState);
                const errorData = await response.json().catch(() => ({
                  message: `Erreur HTTP ${response.status} lors de la tentative de marquer tout comme lu.`,
                }));
                console.error(
                  "handleMarkAllAsRead: Échec API Tout Lu - Erreur:",
                  errorData.message || `Statut ${response.status}`
                );
                  setError(errorData.message || "Impossible de marquer toutes les notifications comme lues.");
                  setTimeout(() => setError(null), 3000);
                throw new Error(errorData.message || "Échec API Tout Lu"); // Pour que le catch externe le voie
              }

              const data = await response.json(); // Lire la réponse { message, updatedCount }
              console.log("handleMarkAllAsRead: Réponse API 'Tout lu':", data);
              // La mise à jour optimiste a déjà fait le travail visuel.
              // Pas besoin de re-fetcher toute la liste ici, sauf si la réponse API
              // contenait des informations cruciales que la mise à jour optimiste n'a pas.
              // Si tu veux absolument être synchrone avec le serveur :
              // console.log("handleMarkAllAsRead: Succès API, re-fetching notifications...");
              // fetchNotifications(1, true); // 'true' pour indiquer que c'est un refresh/action
            } catch (e: any) {
              // Ce catch attrape les erreurs réseau de fetch ou l'erreur jetée par le !response.ok
              console.error(
                "handleMarkAllAsRead: Erreur dans le bloc try/catch API:",
                e.message
              );
              // Si l'erreur n'est pas une alerte, on peut en afficher une générique
             
              // S'assurer de revert si ce n'est pas déjà fait (au cas où l'erreur est avant le !response.ok)
              setNotifications(previousNotificationsState);
                setError(e.message || "Une erreur s'est produite.");
                setTimeout(() => setError(null), 3000);
            } finally {
              // Si tu avais mis un setIsLoading(true) spécifique pour cette action :
              // setIsLoading(false);
            }
          /*},
        },
      ]
    );*/
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.is_read
            ? colors.card
            : Colors[currentScheme].tint + "20",
        },
      ]} // Fond différent si non lue
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIconArea}>
        <FontAwesome
          name={item.type === "order_status_update" ? "truck" : "bell"} // Exemple d'icône par type
          size={24}
          color={item.is_read ? subtleTextColor : tintColor}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationTitle,
            { color: textColor },
            !item.is_read && styles.unreadText,
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.notificationMessage,
            { color: subtleTextColor },
            !item.is_read && styles.unreadTextLight,
          ]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text style={[styles.notificationDate, { color: subtleTextColor }]}>
          {new Date(item.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          })}{" "}
          à{" "}
          {new Date(item.created_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Si l'utilisateur n'est pas connecté (après le chargement initial de AuthContext)
  if (!isLoading && !userToken) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text
          style={{
            color: textColor,
            fontSize: 16,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Veuillez vous connecter pour voir vos notifications.
        </Text>
        <Button
          title="Se connecter"
          onPress={() => router.push("/login")}
          color={tintColor}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor }]}>
      <Stack.Screen
        options={{ title: " Mes Notifications", headerBackTitle: "Retour" }}
      />
            {/* Affichage des messages de succès ou d'erreur */}
            {error && <Text style={[styles.message, {color: colors.errorText, backgroundColor: Colors[currentScheme].errorBackground}]}>{error}</Text>}
            {successMessage && <Text style={[styles.message, {color: Colors[currentScheme].successText, backgroundColor: Colors[currentScheme].successBackground }]}>{successMessage}</Text>}

      <View
        style={[
          { borderBottomColor: subtleTextColor, backgroundColor: card },
        ]}
      >
        {notifications.some((n) => !n.is_read) && ( // Affiche seulement s'il y a des non lues
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={styles.markAllReadButton}
          >
            <Text style={{ color: tintColor, fontSize: 14 }}>Tout lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && notifications.length === 0 && !refreshing ? ( // Loader principal seulement si la liste est vide ET qu'on n'est pas en train de rafraîchir
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : error && notifications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.errorText, textAlign: "center" }}>{error}</Text>
          <Button
            title="Réessayer"
            onPress={() => fetchNotifications(1, true)}
            color={tintColor}
          />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="bell-slash-o" size={60} color={subtleTextColor} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            Aucune notification pour le moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tintColor}
            />
          }
          onEndReached={loadMoreNotifications} // Pour charger plus d'items en scrollant
          onEndReachedThreshold={0.5} // Se déclenche quand le dernier item est à mi-chemin de la fin de la liste
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 20 }}
                color={tintColor}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

// Styles (inspirés de CartScreen et ProfileScreen)
const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === "android" ? 40 : 15,
    borderBottomWidth: 1,
  },
  customHeaderTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", flex: 1, color: "#212121"},
  markAllReadButton: { paddingVertical: 5, paddingHorizontal: 10 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  listContainer: { padding: 10 },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "transparent", // Sera surchargé par la couleur de fond si non lu
  },
  notificationIconArea: {
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
    width: 30,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
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
    fontWeight: "bold", // Pour le titre et le message si non lu
  },
  unreadTextLight: {
    // Optionnel: Si tu veux que le message non lu soit moins gras que le titre
  },
  unreadDot: {
    // Petit point pour indiquer non lu
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "tomato", // Ou tintColor
    alignSelf: "center",
    marginLeft: 10,
  },
    message: {
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 15,
    fontSize: 15,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginVertical: 15,
    paddingHorizontal: 10,
  },
});