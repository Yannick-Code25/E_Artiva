// // ARTIVA/front_end/app/(tabs)/ProfileScreen.tsx

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   Image,
//   ScrollView,
//   Modal,
//   Button,
//   ActivityIndicator,
//   Alert,Platform
// } from "react-native";
// import {
//   Settings,
//   ShoppingBag,
//   Heart,
//   CreditCard,
//   Bell,
//   LogOut as LogOutIcon,
//   ChevronRight,
//   ChevronDown,
//   ChevronUp,
//   LogOut
// } from "lucide-react-native";
// import { useRouter, Href, Stack, useFocusEffect } from "expo-router"; // Ajout de Href pour un meilleur typage
// import { useAuth, User } from "../../context/AuthContext";
// import Colors from "../../constants/Colors"; // Pour les couleurs du bouton
// import { useColorScheme } from "../../components/useColorScheme";

// // Définition des types pour les données
// interface UserData {
//   profileImage?: string;
//   full_name?: string;
//   email?: string;
//   city?: string;
//   // Ajoute d'autres champs si ton API /users/me les renvoie
// }

// // Type pour un article DANS UNE COMMANDE (order_item)
// interface OrderItem {
//   // Renommé de OrderProduct pour éviter confusion avec le type Product global
//   itemId: string | number; // Vient de oi.id as "itemId"
//   product_id: string | number; // Vient de oi.product_id
//   product_name: string; // Vient de oi.product_name as "productName"
//   sku?: string; // Vient de oi.sku
//   quantity: number;
//   unit_price: string | number; // Vient de oi.unit_price
//   subtotal: string | number; // Vient de oi.subtotal
//   productImageUrl?: string; // Vient de p.image_url as "productImageUrl"
// }

// interface Order {
//   orderId: string | number;
//   order_number: string;
//   status: string;
//   total: string | number; // total_amount as total
//   currency: string; // Vient de o.currency
//   createdAt: string;
//   updatedAt?: string;
//   products: OrderItem[];
// }

// // Menu Items
// const menuItems: {
//   icon: React.ElementType;
//   title: string;
//   subtitle: string;
//   route?: Href;
// }[] = [
//   // Typage de route avec Href
//   { icon: ShoppingBag, title: "Mes commandes", subtitle: "Voir l'historique" }, // Pas de route directe, ouvre le modal
//   {
//     icon: Heart,
//     title: "Liste de souhaits",
//     subtitle: "Vos produits favoris",
//     route: "/(tabs)/WishlistScreen" as any,
//   },
//   // { En cours D'implementation
//   //   icon: CreditCard,
//   //   title: "Paiement",
//   //   subtitle: "Gérer les moyens",
//   //   route: "/(tabs)/payment-methods",
//   // },
//   {
//     icon: Bell,
//     title: "Notifications",
//     subtitle: "Vos alertes récentes",
//     route: "notifications" as any,
//   },
//   {
//     icon: Settings,
//     title: "Paramètres",
//     subtitle: "Modifier le profil",
//     route: "/(tabs)/settings",
//   },
// ];

// // URL de base de ton API
// const API_BASE_URL = "http://192.168.248.151:3001/api"; // **ASSURE-TOI QUE C'EST TON IP**

// export default function TabProfileScreen() {
//   const { user, userToken, signOut, isLoading: isAuthLoading, unreadNotificationCount, fetchUnreadNotificationCount } = useAuth();
//   const router = useRouter();
//   const colorScheme = useColorScheme(); // Pour le style du bouton
//   const tintColor = Colors[colorScheme ?? "light"].tint;
//   const cardColor = Colors[colorScheme ?? 'light'].card; // Utilise cardColor pour le fond des sections

//   const [userDataDetails, setUserDataDetails] = useState<UserData | null>(null);
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isFetchingData, setIsFetchingData] = useState<boolean>(false);

//   useFocusEffect(
//     useCallback(() => {
//       console.log("Écran Accueil/Profil a le focus, mise à jour du compte des notifications.");
//       fetchUnreadNotificationCount();
//       return () => {
//         // Optionnel: nettoyage si besoin quand l'écran perd le focus
//       };
//     }, [fetchUnreadNotificationCount])
//   );

//   useEffect(() => {
//     if (!isAuthLoading && !userToken) {
//       router.replace("/login"); // Ou router.push si tu veux que l'utilisateur puisse revenir
//     }
//   }, [isAuthLoading, userToken, router]);

//   if (isAuthLoading || !userToken) {
//     // Affiche un loader ou rien tant que l'état n'est pas clair ou si pas de token
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   const fetchUserDetails = useCallback(async () => {
//     if (!userToken) return;
//     console.log("ProfileScreen: Appel de fetchUserDetails");
//     setIsFetchingData(true);
//     setError(null);
//     try {
//       const response = await fetch(`${API_BASE_URL}/users/me`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${userToken}` },
//       });
//       if (!response.ok) {
//         const errorData = await response
//           .json()
//           .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
//         throw new Error(
//           errorData.message ||
//             `Erreur lors de la récupération des détails utilisateur (${response.status})`
//         );
//       }
//       const data: UserData = await response.json();
//       setUserDataDetails(data);
//     } catch (err: any) {
//       console.error("fetchUserDetails error:", err);
//       setError(err.message || "Impossible de charger les détails du profil.");
//     } finally {
//       setIsFetchingData(false);
//     }
//   }, [userToken]);

//   const fetchUserOrders = useCallback(async () => {
//     if (!userToken) return;
//     console.log("ProfileScreen: Appel de fetchUserOrders");
//     setIsFetchingData(true);
//     setError(null);
//     try {
//       const response = await fetch(`${API_BASE_URL}/orders`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${userToken}` },
//       });
//       if (!response.ok) {
//         // Tenter de parser le JSON d'erreur, sinon message générique
//         const errorData = await response
//           .json()
//           .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
//         throw new Error(
//           errorData.message ||
//             `Erreur lors de la récupération des commandes (${response.status})`
//         );
//       }
//       const ordersData: Order[] = await response.json();
//       setOrders(ordersData);
//     } catch (err: any) {
//       console.error("fetchUserOrders error:", err);
//       setError(
//         err.message || "Impossible de charger l'historique des commandes."
//       );
//       setOrders([]);
//     } finally {
//       setIsFetchingData(false);
//     }
//   }, [userToken]);

//   useEffect(() => {
//     if (user && userToken) {
//       // Optionnel: Appeler fetchUserDetails si user de AuthContext n'est pas suffisant
//       // fetchUserDetails();

//       // Appeler fetchUserOrders au montage si l'utilisateur est connecté
//       // (sera aussi appelé en cliquant sur "Mes commandes")
//       fetchUserOrders();
//     }
//   }, [user, userToken, fetchUserOrders]); // fetchUserDetails si tu l'utilises ici

//   const handleLogout = async () => {
//     Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
//       { text: "Annuler", style: "cancel" },
//       {
//         text: "Oui",
//         onPress: async () => {
//           await signOut();
//         },
//       },
//     ]);
//   };

//   const toggleModal = () => setModalVisible(!modalVisible);

//   const formatDate = (dateString: string | undefined): string => {
//     if (!dateString) return "Date non disponible";
//     const date = new Date(dateString);
//     return isNaN(date.getTime())
//       ? "Date invalide"
//       : date.toLocaleDateString("fr-FR", {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         }) +
//           " " +
//           date.toLocaleTimeString("fr-FR");
//   };

//    if (isAuthLoading) { return <View style={styles.centered}><ActivityIndicator size="large" color={tintColor} /></View>; }
//   if (!user) { return <View style={styles.centered}><Text>Veuillez vous connecter.</Text><Button title="Se connecter" onPress={() => router.replace('/login')} color={tintColor}/></View>; }

//   const renderModalContent = () => {
//     if (isFetchingData) {
//       // Afficher le loader si isFetchingData est true, même si orders.length > 0 (pour un refresh)
//       return (
//         <ActivityIndicator
//           style={{ marginTop: 20, marginBottom: 20 }}
//           size="large"
//           color="tomato"
//         />
//       );
//     }
//     // Note: Si error est défini, fetch n'est plus en cours.
//     if (error) {
//       // Afficher l'erreur s'il y en a une, même si des commandes précédentes sont chargées
//       return <Text style={styles.errorText}>{error}</Text>;
//     }
//     // Si pas de chargement et pas d'erreur
//     if (orders.length === 0) {
//       return (
//         <Text style={styles.noOrdersText}>
//           Vous n'avez aucune commande pour le moment.
//         </Text>
//       );
//     }
//     // Si l'authentification est en cours de vérification ou si l'utilisateur n'est pas encore authentifié (et la redirection n'a pas encore eu lieu)
//     if (isAuthLoading || !userToken || !user) {
//       return (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color={tintColor} />
//           <Text
//             style={{
//               marginTop: 10,
//               color: Colors[colorScheme ?? "light"].text,
//             }}
//           >
//             Chargement du profil...
//           </Text>
//         </View>
//       );
//     }

//     return (
//       <ScrollView style={styles.ordersContainer} nestedScrollEnabled={true}>
//         {orders.map((order) => (
//           <View key={order.orderId} style={styles.orderItem}>
//             <View style={styles.orderHeader}>
//               <Text style={styles.orderNumber}>
//                 Commande #{order.order_number || "N/A"}
//               </Text>
//               <Text style={styles.orderDate}>
//                 {formatDate(order.createdAt)}
//               </Text>
//             </View>
//             <View style={styles.orderProducts}>
//               <Text style={styles.productsTitle}>Produits:</Text>
//               {order.products && order.products.length > 0 ? (
//                 order.products.map(
//                   (
//                     productItem,
//                     idx // Renommé 'product' en 'productItem' pour éviter confusion
//                   ) => (
//                     <View
//                       key={productItem.itemId || productItem.product_id || idx}
//                       style={styles.modalProductItem}
//                     >
//                       {productItem.productImageUrl && ( // Afficher l'image si disponible
//                         <Image
//                           source={{ uri: productItem.productImageUrl }}
//                           style={styles.modalProductImage}
//                         />
//                       )}
//                       <View style={styles.modalProductInfo}>
//                         <Text style={styles.modalProductName}>
//                           {productItem.product_name || "Produit inconnu"}
//                         </Text>
//                         <Text style={styles.modalProductDetails}>
//                           Qté: {productItem.quantity} - Prix Unit.:{" "}
//                           {productItem.unit_price} {order.currency}
//                         </Text>
//                       </View>
//                     </View>
//                   )
//                 )
//               ) : (
//                 <Text style={styles.productItem}>
//                   Aucun détail de produit pour cette commande.
//                 </Text> // Message amélioré
//               )}
//             </View>
//             <View style={styles.orderFooter}>
//               <Text style={styles.orderPrice}>
//                 Total: {order.total !== undefined ? order.total : "N/A"} FCFA
//               </Text>
//               <Text style={styles.orderStatus}>
//                 Statut: {order.status || "Inconnu"}
//               </Text>
//             </View>
//           </View>
//         ))}
//       </ScrollView>
//     );
//   };

//   if (isAuthLoading) {
//     // Chargement initial de l'état d'authentification global
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="tomato" />
//       </View>
//     );
//   }

//   if (!user) {
//     // Utilisateur non authentifié (devrait avoir été redirigé par AuthContext/index.tsx)
//     return (
//       <View style={styles.centered}>
//         <Text>Veuillez vous connecter.</Text>
//         <Button title="Se connecter" onPress={() => router.replace("/login")} />
//       </View>
//     );
//   }

//   // Affichage principal du profil
//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 30 }}
//     >
//       <View style={styles.header}>
//         <View style={styles.profileSection}>
//           <Image
//             source={{
//               uri:
//                 userDataDetails?.profileImage ||
//                 (user as any)?.profileImageFromAuthContext ||
//                 "https://via.placeholder.com/80?text=User",
//             }}
//             style={styles.avatar}
//           />
//           <View style={styles.profileInfo}>
//             <Text style={styles.name}>
//               {userDataDetails?.full_name || user.name || "Nom non disponible"}
//             </Text>
//             <Text style={styles.email}>
//               {user.email || "Email non disponible"}
//             </Text>
//             {userDataDetails?.city && (
//               <Text style={styles.location}>{userDataDetails.city}</Text>
//             )}
//           </View>
//         </View>
//       </View>

//       {/* Indicateur de chargement pour fetchUserDetails/fetchUserOrders si besoin, en dehors du modal */}
//       {isFetchingData && (
//         <ActivityIndicator
//           style={{ marginVertical: 10 }}
//           size="small"
//           color="gray"
//         />
//       )}
//       {/* Afficher l'erreur principale de la page ici si ce n'est pas dans le modal */}
//       {error && !modalVisible && (
//         <Text style={[styles.errorText, { marginVertical: 10 }]}>{error}</Text>
//       )}

//       <View style={styles.menuSection}>
//         {menuItems.map((item, index) => (
//           <Pressable
//             key={index}
//             style={styles.menuItem}
//             onPress={() => {
//               if (item.title === "Mes commandes") {
//                 if (!modalVisible) {
//                   // Pour éviter de re-fetch si déjà ouvert, optionnel
//                   fetchUserOrders();
//                 }
//                 toggleModal();
//               } else if (item.route) {
//                 router.push(item.route); // Href est déjà typé dans menuItems
//               }
//             }}
//           >
//             <View style={styles.menuItemIcon}>
//               <item.icon size={24} color="#1F2937" strokeWidth={1.5} />
//             </View>
//             <View style={styles.menuItemContent}>
//               <Text style={styles.menuItemTitle}>{item.title}</Text>
//               <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
//             </View>
//           </Pressable>
//         ))}
//       </View>

//       <Pressable style={styles.logoutButton} onPress={handleLogout}>
//         <LogOut size={24} color="#FF4B55" strokeWidth={1.5} />
//         <Text style={styles.logoutText}>Se déconnecter</Text>
//       </Pressable>

//       {/* Modal pour afficher les commandes */}
//       <Modal
//         visible={modalVisible}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={toggleModal}
//       >
//         <Pressable style={styles.modalOverlay} onPress={toggleModal}>
//           <Pressable
//             style={styles.modalContent}
//             onPress={(e) => e.stopPropagation()}
//           >
//             <Text style={styles.modalTitle}>Mes commandes</Text>
//             {renderModalContent()}
//             <Pressable style={styles.closeButton} onPress={toggleModal}>
//               <Text style={styles.closeButtonText}>Fermer</Text>
//             </Pressable>
//           </Pressable>
//         </Pressable>
//       </Modal>
//     </ScrollView>
//   );
// }

// // Styles (ceux que tu as fournis, sans les polices Poppins pour l'instant)
// const styles = StyleSheet.create({
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F9FAFB",
//   },
//   container: { flex: 1, backgroundColor: "#F9FAFB" },
//   header: {
//     paddingHorizontal: 24,
//     paddingTop: 40,
//     paddingBottom: 24,
//     backgroundColor: "#FFFFFF",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E5E7EB",
//   },
//   profileSection: { flexDirection: "row", alignItems: "center" },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginRight: 16,
//     backgroundColor: "#E5E7EB",
//   },
//   profileInfo: { flex: 1 },
//   name: { fontWeight: "bold", fontSize: 22, color: "#1F2937" },
//   email: { fontSize: 15, color: "#6B7280", marginTop: 4 },
//   location: { fontSize: 14, color: "#6B7280", marginTop: 4 },
//   menuSection: {
//     backgroundColor: "#FFFFFF",
//     marginTop: 24,
//     borderRadius: 16,
//     marginHorizontal: 16,
//     overflow: "hidden",
//     elevation: 1,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",
//   },
//   menuItemLast: { borderBottomWidth: 0 }, // Pour le dernier item du menu
//   menuItemIcon: {
//     width: 36,
//     height: 36,
//     backgroundColor: "#EBF4FF",
//     borderRadius: 18,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 16,
//   },
//   menuItemContent: { flex: 1 },
//   menuItemTitle: { fontWeight: "600", fontSize: 16, color: "#1F2937" },
//   menuItemSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
//   logoutButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#FFF1F2",
//     marginHorizontal: 24,
//     marginTop: 30,
//     marginBottom: 32,
//     padding: 16,
//     borderRadius: 12,
//     gap: 8,
//     borderWidth: 1,
//     borderColor: "#FFCCD0",
//   },
//   logoutText: { fontWeight: "600", fontSize: 16, color: "#EF4444" },

//   modalOverlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.4)",
//   },
//   modalContent: {
//     backgroundColor: "#FFFFFF",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 24,
//     width: "100%",
//     maxHeight: "75%",
//     elevation: 5,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   modalTitle: {
//     fontWeight: "bold",
//     fontSize: 20,
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   ordersContainer: { /* maxHeight: '80%', */ flexGrow: 0 }, // flexGrow: 0 pour éviter que ScrollView ne pousse le bouton "Fermer" en dehors de l'écran dans le modal
//   orderItem: {
//     marginBottom: 16,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E5E7EB",
//   },
//   orderHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 8,
//   },
//   orderNumber: { fontWeight: "bold", fontSize: 16, color: "#1F2937" },
//   orderDate: { fontSize: 13, color: "#6B7280" },
//   orderProducts: { marginLeft: 8, marginBottom: 8 },
//   productsTitle: {
//     fontWeight: "600",
//     fontSize: 14,
//     color: "#374151",
//     marginBottom: 4,
//   },
//   productItem: { fontSize: 14, color: "#6B7280", marginLeft: 8 },
//   orderFooter: {
//     marginTop: 10,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   orderPrice: { fontWeight: "bold", fontSize: 16, color: "#10B981" },
//   orderStatus: { fontSize: 14, color: "#F59E0B", fontWeight: "500" },
//   noOrdersText: {
//     fontSize: 16,
//     color: "#6B7280",
//     textAlign: "center",
//     paddingVertical: 20,
//   },
//   closeButton: {
//     backgroundColor: "tomato",
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: "center",
//     marginTop: 20,
//   },
//   closeButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
//   errorText: {
//     fontSize: 15,
//     color: "#EF4444",
//     textAlign: "center",
//     marginVertical: 15,
//     paddingHorizontal: 10,
//   },
//   modalProductItem: {
//     flexDirection: "row",
//     marginBottom: 10,
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   modalProductImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 4,
//     marginRight: 10,
//     backgroundColor: "#e0e0e0",
//   },
//   modalProductInfo: {
//     flex: 1,
//     justifyContent: "center",
//   },
//   modalProductName: {
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   modalProductDetails: {
//     fontSize: 12,
//     color: "#555",
//   },
//   notificationBadgeOnItem: { // Style pour le point rouge sur l'item de menu
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: 'red',
//     marginLeft: 'auto', // Pousse à droite
//     marginRight: 5, // Un peu d'espace avant le chevron
//   },
//   // Ajoute ou modifie pour le badge sur l'item de menu "Notifications"
//   notificationItemBadgeContainer: {
//     backgroundColor: 'red',
//     borderRadius: 10,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     marginLeft: 'auto', // Pousse à droite avant le chevron
//     marginRight: 8,     // Espace avant le chevron
//     minWidth: 20, // Pour que le cercle soit bien rond même avec un seul chiffre
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   notificationItemBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
// });

// ARTIVA/front_end/app/(tabs)/ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Modal,
  Button,
  ActivityIndicator,
  Alert,
  Platform, // Ajout de Platform pour les styles
} from "react-native";
import {
  Settings,
  ShoppingBag,
  Heart,
  CreditCard,
  Bell,
  LogOut as LogOutIcon, // Renommé pour éviter conflit si LogOut est utilisé ailleurs
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useRouter, Href, Stack, useFocusEffect } from "expo-router";
import { useAuth, User } from "../../context/AuthContext"; // Assure-toi que User est exporté depuis AuthContext
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { FontAwesome } from "@expo/vector-icons";

// Définition des types pour les données
interface UserDetails {
  // User est importé de AuthContext
  profileImage?: string;
  full_name?: string; // Si différent de user.name de AuthContext
  city?: string;
  email?: string;
}

// Type pour un article DANS UNE COMMANDE (order_item)
interface OrderItem {
  itemId?: string | number; // Vient de oi.id as "itemId"
  product_id?: string | number; // Vient de oi.product_id
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
  productImageUrl?: string; // Image du produit dans la commande
}

interface Order {
  orderId: string | number;
  order_number?: string; // Rendu optionnel si l'API ne le renvoie pas toujours
  status: string;
  total: string | number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
  products: OrderItem[]; // Tableau d'OrderItem
}

// Menu Items
const menuItemsBaseConfig: {
  // Renommé en menuItemsBaseConfig pour clarté
  id: string;
  icon: React.ElementType;
  title: string;
  subtitleBase: string; // Sous-titre de base
  route?: Href;
  action?: "toggleOrdersModal"; // Pour les actions qui ne sont pas des navigations directes
}[] = [
  {
    id: "orders",
    icon: ShoppingBag,
    title: "Mes commandes",
    subtitleBase: "Voir l'historique",
    action: "toggleOrdersModal",
  },
  {
    id: "wishlist",
    icon: Heart,
    title: "Liste de souhaits",
    subtitleBase: "Vos produits favoris",
    route: "/(tabs)/WishlistScreen" as Href,
  },
  // { id: 'payment', icon: CreditCard, title: "Paiement", subtitleBase: "Gérer les moyens", route: "/(tabs)/payment-methods" as Href },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    subtitleBase: "Vos alertes récentes",
    route: "/notifications" as Href,
  }, // Route directe
  {
    id: "settings",
    icon: Settings,
    title: "Paramètres",
    subtitleBase: "Modifier le profil",
    route: "/settings" as Href,
  },
];

const API_BASE_URL = "http://192.168.248.151:3001/api"; // TON IP

export default function TabProfileScreen() {
  const {
    user,
    userToken,
    signOut,
    isLoading: isAuthLoading,
    unreadNotificationCount,
    fetchUnreadNotificationCount,
  } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const textColor = Colors[colorScheme ?? "light"].text;
  const cardColor = Colors[colorScheme ?? "light"].card;
  const subtleTextColor = Colors[colorScheme ?? "light"].tabIconDefault;
  const backgroundColor = Colors[colorScheme ?? "light"].background;

  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersModalVisible, setIsOrdersModalVisible] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false); // Pour fetchUserOrders
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null); // Pour les détails supplémentaires du profil

  useFocusEffect(
    useCallback(() => {
      if (userToken) {
        console.log(
          "ProfileScreen a le focus, mise à jour du compte des notifications."
        );
        fetchUnreadNotificationCount();
      }
    }, [userToken, fetchUnreadNotificationCount])
  );

  const fetchUserOrders = useCallback(async () => {
    if (!userToken) return;
    console.log("ProfileScreen: Appel de fetchUserOrders");
    setIsLoadingData(true); // Utiliser cet état pour le chargement des commandes
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(
          errorData.message ||
            `Erreur lors de la récupération des commandes (${response.status})`
        );
      }
      const ordersData: Order[] = await response.json();
      setOrders(ordersData);
    } catch (err: any) {
      console.error("fetchUserOrders error:", err);
      setError(
        err.message || "Impossible de charger l'historique des commandes."
      );
      setOrders([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [userToken]);

  // Charger les commandes une fois au montage si l'utilisateur est connecté
  useEffect(() => {
    if (user && userToken) {
      // fetchUserOrders(); // Déplacé dans toggleOrdersModal pour ne charger qu'à l'ouverture
    }
  }, [user, userToken]);

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Oui",
        onPress: async () => {
          await signOut(); /* La redirection est gérée par AuthContext/app/index.tsx */
        },
      },
    ]);
  };

  const toggleOrdersModal = () => {
    if (!isOrdersModalVisible && user && userToken) {
      // Charger les commandes seulement si on ouvre le modal et qu'on est connecté
      fetchUserOrders();
    }
    setIsOrdersModalVisible(!isOrdersModalVisible);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Date non disponible";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Date invalide"
      : date.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }) +
          " " +
          date.toLocaleTimeString("fr-FR");
  };

  // Construire dynamiquement les items du menu pour inclure le compte des notifications dans le sous-titre
  // ou simplement pour utiliser la variable unreadNotificationCount pour le badge
  const menuItemsToDisplay = menuItemsBaseConfig.map((item) => {
    if (item.id === "notifications") {
      return {
        ...item,
        // Optionnel : Mettre à jour le sous-titre
        // subtitle: unreadNotificationCount > 0
        //   ? `${unreadNotificationCount} nouvelle(s)`
        //   : item.subtitleBase,
        subtitle: item.subtitleBase, // Garder le sous-titre de base, le badge visuel suffit
      };
    }
    return item; // Retourner l'item original pour les autres
  });

  if (isAuthLoading || !user) {
    // Attendre que AuthContext ait chargé l'utilisateur
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  const displayName =
    userDetails?.full_name || user.name || "Utilisateur Artiva";
  const displayEmail =
    userDetails?.email || user.email || "Email non disponible";
  // Utilise une image de placeholder ou une logique pour une vraie image de profil
  const profileImageUrl =
    userDetails?.profileImage ||
    (user as any)?.profileImageFromAuthContext ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=random&size=128`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainerScrollView}
    >
      <Stack.Screen options={{ title: "Mon Profil", headerShown: false }} />

      <View
        style={[
          styles.customHeader,
          { borderBottomColor: subtleTextColor, backgroundColor: cardColor },
        ]}
      >
        {/* Espace pour équilibrer si pas de bouton retour. Si tu veux un bouton retour: */}
        {/* {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={tintColor} />
          </TouchableOpacity>
        )} */}
        <View style={{ width: 40 }} />
        <Text style={[styles.customHeaderTitle, { color: textColor }]}>
          Mon Profil
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View
        style={[
          styles.header,
          { backgroundColor: cardColor, borderBottomColor: subtleTextColor },
        ]}
      >
        <View style={styles.profileSection}>
          <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: textColor }]}>
              {displayName}
            </Text>
            <Text style={[styles.email, { color: subtleTextColor }]}>
              {displayEmail}
            </Text>
          </View>
        </View>
      </View>

      {/* Section Menu */}
      <View style={[styles.menuSection, { backgroundColor: cardColor }]}>
        {menuItemsToDisplay.map((menuItem, index) => (
          <Pressable
            key={menuItem.id}
            style={[
              styles.menuItem,
              index === menuItemsToDisplay.length - 1 && styles.menuItemLast,
              { borderBottomColor: subtleTextColor },
            ]}
            onPress={() => {
              if (menuItem.action === "toggleOrdersModal") {
                toggleOrdersModal();
              } else if (menuItem.route) {
                router.push(menuItem.route);
              }
            }}
          >
            <View
              style={[
                styles.menuItemIcon,
                {
                  backgroundColor:
                    backgroundColor === "#000000" ? "#374151" : "#EBF4FF",
                },
              ]}
            >
              <menuItem.icon size={20} color={tintColor} strokeWidth={1.75} />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>
                {menuItem.title}
              </Text>
              <Text
                style={[styles.menuItemSubtitle, { color: subtleTextColor }]}
              >
                {menuItem.subtitleBase}
              </Text>
            </View>

            {/* Badge de Notification */}
            {menuItem.id === "notifications" && unreadNotificationCount > 0 && (
              <View style={styles.notificationItemBadgeContainer}>
                <Text style={styles.notificationItemBadgeText}>
                  {unreadNotificationCount}
                </Text>
              </View>
            )}

            {/* Chevrons */}
            {menuItem.action === "toggleOrdersModal" ? (
              <FontAwesome
                name={isOrdersModalVisible ? "chevron-up" : "chevron-down"}
                size={16}
                color={subtleTextColor}
              />
            ) : menuItem.route ? (
              <FontAwesome
                name="chevron-right"
                size={16}
                color={subtleTextColor}
              />
            ) : null}
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <LogOutIcon size={20} color="#EF4444" strokeWidth={2} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>

      {/* Modal pour afficher les commandes */}
      <Modal
        visible={isOrdersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleOrdersModal}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleOrdersModal}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Mes Commandes</Text>
            {isLoadingData && orders.length === 0 ? (
              <ActivityIndicator
                size="large"
                color={tintColor}
                style={{ marginVertical: 20 }}
              />
            ) : error && orders.length === 0 ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : orders.length === 0 ? (
              <Text style={styles.noOrdersText}>
                Vous n'avez aucune commande pour le moment.
              </Text>
            ) : (
              <ScrollView
                style={styles.ordersContainer}
                nestedScrollEnabled={true}
              >
                {orders.map((order) => (
                  <View key={order.orderId} style={styles.orderItem}>
                    <View style={styles.orderHeader}>
                      <Text style={[styles.orderNumber, { color: textColor }]}>
                        CDE #{order.order_number || order.orderId}
                      </Text>
                      <Text
                        style={[styles.orderDate, { color: subtleTextColor }]}
                      >
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.orderProducts}>
                      <Text
                        style={[styles.productsTitle, { color: textColor }]}
                      >
                        Produits:
                      </Text>
                      {order.products && order.products.length > 0 ? (
                        order.products.map((productItem, idx) => (
                          <View
                            key={
                              productItem.itemId ||
                              productItem.product_id ||
                              idx
                            }
                            style={styles.modalProductItem}
                          >
                            {productItem.productImageUrl && (
                              <Image
                                source={{ uri: productItem.productImageUrl }}
                                style={styles.modalProductImage}
                              />
                            )}
                            <View style={styles.modalProductInfo}>
                              <Text
                                style={[
                                  styles.modalProductName,
                                  { color: textColor },
                                ]}
                              >
                                {productItem.product_name || "Produit"}
                              </Text>
                              <Text
                                style={[
                                  styles.modalProductDetails,
                                  { color: subtleTextColor },
                                ]}
                              >
                                Qté: {productItem.quantity} - Prix Unit.:{" "}
                                {productItem.unit_price} {order.currency}
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text
                          style={[
                            styles.productItem,
                            { color: subtleTextColor },
                          ]}
                        >
                          Détails non disponibles.
                        </Text>
                      )}
                    </View>
                    <View style={styles.orderFooter}>
                      <Text style={[styles.orderPrice, { color: tintColor }]}>
                        Total: {order.total} {order.currency}
                      </Text>
                      <Text style={[styles.orderStatus, { color: tintColor }]}>
                        Statut: {order.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            <Pressable
              style={[styles.closeButton, { backgroundColor: tintColor }]}
              onPress={toggleOrdersModal}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// Styles (Assure-toi d'avoir tous les styles nécessaires ici)
const styles = StyleSheet.create({
  contentContainerScrollView: { paddingBottom: 30 }, // Pour que le contenu ne soit pas caché par la barre d'onglet
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center" /* backgroundColor est appliqué dynamiquement */,
  },
  container: { flex: 1 /* backgroundColor est appliqué dynamiquement */ },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === "android" ? 45 : 20,
    borderBottomWidth: 1,
  },
  customHeaderTitle: { fontSize: 20, fontWeight: "600", textAlign: "center" }, // flex:1 retiré pour un meilleur centrage avec boutons optionnels
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: "#E5E7EB",
  },
  profileInfo: { flex: 1 },
  name: { fontWeight: "bold", fontSize: 20 },
  email: { fontSize: 14, marginTop: 2 },
  menuSection: {
    marginTop: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuItemContent: { flex: 1 },
  menuItemTitle: { fontWeight: "600", fontSize: 15 },
  menuItemSubtitle: { fontSize: 13, marginTop: 2 },
  notificationItemBadgeContainer: {
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: "auto",
    marginRight: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationItemBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F2",
    marginHorizontal: 24,
    marginTop: 25,
    marginBottom: 32,
    padding: 15,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFCCD0",
  },
  logoutText: { fontWeight: "600", fontSize: 16, color: "#EF4444" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    width: "100%",
    maxHeight: "75%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    color: "green",
  },
  ordersContainer: {
    /* maxHeight: 'calc(100% - 80px)' si le bouton fermer est fixe en bas */
  },
  orderItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderNumber: { fontWeight: "bold", fontSize: 16, color: "red" },
  orderDate: { fontSize: 13 },
  orderProducts: { marginLeft: 8, marginBottom: 8, marginTop: 5 },
  productsTitle: { fontWeight: "600", fontSize: 14, marginBottom: 6 },
  modalProductItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalProductImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: "#e0e0e0",
  },
  modalProductInfo: { flex: 1 },
  modalProductName: { fontSize: 14, fontWeight: "500" },
  modalProductDetails: { fontSize: 12 },
  productItem: { fontSize: 14 }, // style pour les items produits dans la liste
  orderFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderPrice: { fontWeight: "bold", fontSize: 16, color: "tintColor" },
  orderStatus: { fontSize: 14, fontWeight: "500", color: "tintColor" },
  noOrdersText: { fontSize: 16, textAlign: "center", paddingVertical: 30 },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    // color: cardColor === '#000000' || cardColor === '#121212' ? tintColor : 'white', // Adapte la couleur du texte au fond du bouton
    color: "white",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginVertical: 15,
    paddingHorizontal: 10,
    color: "red",
  },
});
