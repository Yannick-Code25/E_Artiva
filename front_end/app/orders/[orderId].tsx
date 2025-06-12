// // ARTIVA/front_end/app/orders/[orderId].tsx
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   Button,
//   Platform,
// } from "react-native";
// import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
// import Colors from "../../constants/Colors";
// import { useColorScheme } from "../../components/useColorScheme";
// import { useAuth } from "../../context/AuthContext";

// const API_BASE_URL = "http://192.168.1.2:3001/api"; // **TON IP**

// interface OrderItem {
//   itemId: number | string;
//   product_id?: number | string | null; // << AJOUTÉ ET OPTIONNEL
//   product_name: string;
//   quantity: number;
//   unit_price: string | number;
//   subtotal: string | number;
//   // productImageUrl?: string;
// }
// interface OrderDetailsType {
//   orderId: number | string;
//   order_number: string;
//   status: string;
//   total: string | number; // Déjà formaté avec devise par l'API ou à formater ici
//   currency: string;
//   createdAt: string;
//   shipping_address: any;
//   billing_address?: any;
//   notes?: string;
//   items: OrderItem[];
//   // Ajoute d'autres champs si l'API les renvoie (userName, userEmail etc.)
//   userName?: string;
//   userEmail?: string;
//   shipping_method?: string;
//   shipping_cost?: string | number;
// }

// export default function OrderDetailScreen() {
//   const { orderId } = useLocalSearchParams<{ orderId: string }>();
//   const router = useRouter();
//   const { userToken, effectiveAppColorScheme } = useAuth();
//   const colorScheme = useColorScheme(); // Ou effectiveAppColorScheme de useAuth
//   const currentScheme = colorScheme ?? "light";
//   const tintColor = Colors[currentScheme].tint;
//   const textColor = Colors[currentScheme].text;
//   const backgroundColor = Colors[currentScheme].background;
//   const cardColor = Colors[currentScheme].card;
//   const subtleTextColor = Colors[currentScheme].subtleText;
//   const borderColor = Colors[currentScheme].cardBorder;

//   const [order, setOrder] = useState<OrderDetailsType | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [pageTitle, setPageTitle] = useState(
//     orderId ? `Commande #${orderId}` : "Détails Commande"
//   );

//   const fetchOrderDetails = useCallback(async () => {
//     if (!orderId || !userToken) {
//       setError(!orderId ? "ID de commande manquant." : "Connexion requise.");
//       setIsLoading(false);
//       return;
//     }
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
//         // Appelle GET /api/orders/:orderId
//         headers: { Authorization: `Bearer ${userToken}` },
//       });
//       if (!response.ok) {
//         const errData = await response
//           .json()
//           .catch(() => ({ message: `HTTP ${response.status}` }));
//         throw new Error(
//           errData.message || "Erreur chargement détails commande"
//         );
//       }
//       if (!response.ok) {
//         /* ... */
//       }
//       const data: OrderDetailsType = await response.json();
//       setOrder(data);
//       if (data.order_number) {
//         // Mettre à jour le titre avec le vrai numéro de commande
//         setPageTitle(`Commande #${data.order_number}`);
//       }
//     } catch (err: any) {
//       setError(err.message);
//       setOrder(null);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [orderId, userToken]);

//   useEffect(() => {
//     fetchOrderDetails();
//   }, [fetchOrderDetails]);

//   const formatDate = (dateString?: string): string => {
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
//   // Fonction pour parser et afficher joliment les adresses JSONB
//   const renderAddress = (addressData: any) => {
//     if (!addressData)
//       return <Text style={{ color: subtleTextColor }}>Non spécifiée</Text>;
//     // L'API peut renvoyer une chaîne JSON ou un objet déjà parsé si Content-Type est bien application/json
//     const addressObj =
//       typeof addressData === "string" ? JSON.parse(addressData) : addressData;

//     // Adapte les champs à ce que ton objet adresse contient réellement
//     // Ex: addressObj.street, addressObj.zip_code, addressObj.countryName
//     return (
//       <>
//         {addressObj.name && (
//           <Text style={{ color: textColor }}>{addressObj.name}</Text>
//         )}
//         {addressObj.line1 && (
//           <Text style={{ color: textColor }}>{addressObj.line1}</Text>
//         )}
//         {addressObj.line2 && (
//           <Text style={{ color: textColor }}>{addressObj.line2}</Text>
//         )}
//         {(addressObj.city || addressObj.postal_code) && (
//           <Text style={{ color: textColor }}>
//             {addressObj.city}
//             {addressObj.postal_code && `, ${addressObj.postal_code}`}
//           </Text>
//         )}
//         {addressObj.country && (
//           <Text style={{ color: textColor }}>{addressObj.country}</Text>
//         )}
//         {addressObj.phone && (
//           <Text style={{ color: textColor }}>Tél: {addressObj.phone}</Text>
//         )}
//       </>
//     );
//   };
//   if (isLoading) {
//     return (
//       <View style={[styles.centered, { backgroundColor }]}>
//         <ActivityIndicator size="large" color={tintColor} />
//       </View>
//     );
//   }
//   if (error) {
//     return (
//       <View style={[styles.centered, { backgroundColor }]}>
//         <Text style={{ color: "red" }}>{error}</Text>
//         <Button
//           title="Réessayer"
//           onPress={fetchOrderDetails}
//           color={tintColor}
//         />
//       </View>
//     );
//   }
//   if (!order) {
//     return (
//       <View style={[styles.centered, { backgroundColor }]}>
//         <Text style={{ color: textColor }}>
//           Détails de la commande non trouvés.
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={[styles.screenContainer, { backgroundColor }]}>
//       <Stack.Screen options={{ title: pageTitle }} />

//       <View
//         style={[
//           styles.section,
//           { backgroundColor: cardColor, borderColor: borderColor },
//         ]}
//       >
//         <Text style={[styles.sectionTitle, { color: textColor }]}>
//           Récapitulatif Commande
//         </Text>
//         <Text style={[styles.text, { color: textColor }]}>
//           Numéro : <Text style={styles.value}>{order.order_number}</Text>
//         </Text>
//         <Text style={[styles.text, { color: textColor }]}>
//           Date : <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
//         </Text>
//         <Text style={[styles.text, { color: textColor }]}>
//           Statut :{" "}
//           <Text
//             style={[styles.value, { color: tintColor, fontWeight: "bold" }]}
//           >
//             {order.status}
//           </Text>
//         </Text>
//         <Text style={[styles.text, { color: textColor }]}>
//           Total :{" "}
//           <Text style={[styles.value, styles.totalValue]}>
//             {order.total} {order.currency}
//           </Text>
//         </Text>
//       </View>

//       {/* Informations client (si renvoyées par l'API /orders/:orderId) */}
//       {(order.userName || order.userEmail) && (
//         <View
//           style={[
//             styles.section,
//             { backgroundColor: cardColor, borderColor: borderColor },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, { color: textColor }]}>
//             Client
//           </Text>
//           {order.userName && (
//             <Text style={[styles.text, { color: textColor }]}>
//               Nom : <Text style={styles.value}>{order.userName}</Text>
//             </Text>
//           )}
//           {order.userEmail && (
//             <Text style={[styles.text, { color: textColor }]}>
//               Email : <Text style={styles.value}>{order.userEmail}</Text>
//             </Text>
//           )}
//           {/* Ajoute le téléphone du client si ton API le renvoie pour la commande */}
//         </View>
//       )}

//       <View
//         style={[
//           styles.section,
//           { backgroundColor: cardColor, borderColor: borderColor },
//         ]}
//       >
//         <Text style={[styles.sectionTitle, { color: textColor }]}>
//           Adresse de Livraison
//         </Text>
//         {renderAddress(order.shipping_address)}
//       </View>

//       {order.billing_address &&
//         Object.keys(order.billing_address).length > 0 && (
//           <View
//             style={[
//               styles.section,
//               { backgroundColor: cardColor, borderColor: borderColor },
//             ]}
//           >
//             <Text style={[styles.sectionTitle, { color: textColor }]}>
//               Adresse de Facturation
//             </Text>
//             {renderAddress(order.billing_address)}
//           </View>
//         )}

//       <View
//         style={[
//           styles.section,
//           { backgroundColor: cardColor, borderColor: borderColor },
//         ]}
//       >
//         <Text style={[styles.sectionTitle, { color: textColor }]}>
//           Articles ({order.items?.length || 0})
//         </Text>
//         {order.items &&
//           order.items.map((item) => (
//             // La clé ici utilise itemId, qui est l'ID de la ligne order_items (plus unique)
//             <View
//               key={item.itemId}
//               style={[styles.item, { borderBottomColor: borderColor }]}
//             >
//               <Text style={[styles.itemName, { color: textColor }]}>
//                 {item.product_name} (x{item.quantity})
//               </Text>
//               <Text style={[styles.itemPrice, { color: subtleTextColor }]}>
//                 {parseFloat(String(item.unit_price)).toFixed(2)}{" "}
//                 {order.currency} x {item.quantity} ={" "}
//                 {parseFloat(String(item.subtotal)).toFixed(2)} {order.currency}
//               </Text>
//             </View>
//           ))}
//         {(!order.items || order.items.length === 0) && (
//           <Text style={{ color: subtleTextColor }}>
//             Aucun article dans cette commande.
//           </Text>
//         )}
//       </View>

//       {(order.shipping_method || order.shipping_cost !== undefined) && (
//         <View
//           style={[
//             styles.section,
//             { backgroundColor: cardColor, borderColor: borderColor },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, { color: textColor }]}>
//             Livraison
//           </Text>
//           {order.shipping_method && (
//             <Text style={[styles.text, { color: textColor }]}>
//               Méthode :{" "}
//               <Text style={styles.value}>{order.shipping_method}</Text>
//             </Text>
//           )}
//           {order.shipping_cost !== undefined && (
//             <Text style={[styles.text, { color: textColor }]}>
//               Coût :{" "}
//               <Text style={styles.value}>
//                 {parseFloat(String(order.shipping_cost)).toFixed(2)}{" "}
//                 {order.currency}
//               </Text>
//             </Text>
//           )}
//         </View>
//       )}

//       {order.notes && (
//         <View
//           style={[
//             styles.section,
//             { backgroundColor: cardColor, borderColor: borderColor },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, { color: textColor }]}>
//             Vos Notes
//           </Text>
//           <Text style={[styles.text, { color: textColor }]}>{order.notes}</Text>
//         </View>
//       )}
//     </ScrollView>
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
//   section: {
//     marginBottom: 15,
//     padding: 15,
//     borderRadius: 10,
//     borderWidth: 1,
//     elevation: 1, // Petite ombre Android
//     shadowColor: "#000", // Ombre iOS
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600", // Un peu moins que bold
//     marginBottom: 12,
//     paddingBottom: 8,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     // borderBottomColor est appliqué dynamiquement
//   },
//   text: {
//     fontSize: 15,
//     marginBottom: 6,
//     lineHeight: 22,
//   },
//   value: {
//     // Style pour les valeurs à côté des labels
//     fontWeight: "500",
//   },
//   totalValue: {
//     fontWeight: "bold",
//     fontSize: 16,
//   },
//   item: {
//     marginBottom: 10,
//     paddingBottom: 10,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//   },
//   itemLast: {
//     // Pour le dernier item, pas de bordure en bas
//     borderBottomWidth: 0,
//     marginBottom: 0,
//     paddingBottom: 0,
//   },
//   itemName: {
//     fontSize: 16,
//     fontWeight: "500",
//     marginBottom: 3,
//   },
//   itemPrice: {
//     fontSize: 14,
//   },
//   // Tu peux ajouter des styles pour les adresses ici si renderAddress retourne des Text non stylés
//   // Par exemple :
//   // addressText: { color: textColor, marginBottom: 2 }
// });







// ARTIVA/front_end/app/orders/[orderId].tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Button,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, Href } from "expo-router";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **TON IP**

interface OrderItem {
  itemId: number | string;
  product_id?: number | string | null; // << AJOUTÉ ET OPTIONNEL
  product_name: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
  // productImageUrl?: string;
}
interface OrderDetailsType {
  orderId: number | string;
  order_number?: string;
  status: string;
  total: string | number; // Déjà formaté avec devise par l'API ou à formater ici
  currency: string;
  createdAt: string;
  shipping_address: any;
  billing_address?: any;
  notes?: string;
  items: OrderItem[];
  // Ajoute d'autres champs si l'API les renvoie (userName, userEmail etc.)
  userName?: string;
  userEmail?: string;
  shipping_method?: string;
  shipping_cost?: string | number;
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { userToken, effectiveAppColorScheme } = useAuth();

  const colorScheme = useColorScheme(); // Ou effectiveAppColorScheme de useAuth
  const colors = Colors[effectiveAppColorScheme ?? "light"]; //Acceder a colors de theme

  const [order, setOrder] = useState<OrderDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState(
    orderId ? `Commande #${orderId}` : "Détails Commande"
  );

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !userToken) {
      setError(!orderId ? "ID de commande manquant." : "Connexion requise.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        // Appelle GET /api/orders/:orderId
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(
          errorData.message || "Erreur chargement détails commande"
        );
      }
      if (!response.ok) {
        /* ... */
      }
      const data: OrderDetailsType = await response.json();
      setOrder(data);
      if (data.order_number) {
        // Mettre à jour le titre avec le vrai numéro de commande
        setPageTitle(`Commande #${data.order_number}`);
      }
    } catch (err: any) {
      setError(err.message);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, userToken]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const formatDate = (dateString?: string): string => {
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
  // Fonction pour parser et afficher joliment les adresses JSONB
  const renderAddress = (addressData: any) => {
    if (!addressData)
      return <Text style={[styles.addressText, {color: colors.subtleText}]}>Non spécifiée</Text>;
    // L'API peut renvoyer une chaîne JSON ou un objet déjà parsé si Content-Type est bien application/json
    const addressObj =
      typeof addressData === "string" ? JSON.parse(addressData) : addressData;

    // Adapte les champs à ce que ton objet adresse contient réellement
    // Ex: addressObj.street, addressObj.zip_code, addressObj.countryName
    return (
      <>
        {addressObj.name && (
          <Text style={[styles.addressText, { color: colors.text }]}>{addressObj.name}</Text>
        )}
        {addressObj.line1 && (
          <Text style={[styles.addressText, { color: colors.text }]}>{addressObj.line1}</Text>
        )}
        {addressObj.line2 && (
          <Text style={[styles.addressText, { color: colors.text }]}>{addressObj.line2}</Text>
        )}
        {(addressObj.city || addressObj.postal_code) && (
          <Text style={[styles.addressText, { color: colors.text }]}>
            {addressObj.city}
            {addressObj.postal_code && `, ${addressObj.postal_code}`}
          </Text>
        )}
        {addressObj.country && (
          <Text style={[styles.addressText, { color: colors.text }]}>{addressObj.country}</Text>
        )}
        {addressObj.phone && (
          <Text style={[styles.addressText, { color: colors.text }]}>Tél: {addressObj.phone}</Text>
        )}
      </>
    );
  };
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.errorText }}>{error}</Text>
        <Button
          title="Réessayer"
          onPress={fetchOrderDetails}
          color={colors.tint}
        />
      </View>
    );
  }
  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>
          Détails de la commande non trouvés.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: pageTitle }} />

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Récapitulatif Commande
        </Text>
        <Text style={[styles.text, { color: colors.text }]}>
          Numéro : <Text style={[styles.value, { color: colors.text }]}>{order.order_number}</Text>
        </Text>
        <Text style={[styles.text, { color: colors.text }]}>
          Date : <Text style={[styles.value, { color: colors.text }]}>{formatDate(order.createdAt)}</Text>
        </Text>
        <Text style={[styles.text, { color: colors.text }]}>
          Statut :{" "}
          <Text
            style={[styles.value, { color: colors.tint, fontWeight: "bold" }]}
          >
            {order.status}
          </Text>
        </Text>
        <Text style={[styles.text, { color: colors.text }]}>
          Total :{" "}
          <Text style={[styles.value, styles.totalValue, { color: colors.tint }]}>
            {order.total} {order.currency}
          </Text>
        </Text>
      </View>

      {/* Informations client (si renvoyées par l'API /orders/:orderId) */}
      {(order.userName || order.userEmail) && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Client
          </Text>
          {order.userName && (
            <Text style={[styles.text, { color: colors.text }]}>
              Nom : <Text style={[styles.value, { color: colors.text }]}>{order.userName}</Text>
            </Text>
          )}
          {order.userEmail && (
            <Text style={[styles.text, { color: colors.text }]}>
              Email : <Text style={[styles.value, { color: colors.text }]}>{order.userEmail}</Text>
            </Text>
          )}
          {/* Ajoute le téléphone du client si ton API le renvoie pour la commande */}
        </View>
      )}

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Adresse de Livraison
        </Text>
        {renderAddress(order.shipping_address)}
      </View>

      {order.billing_address &&
        Object.keys(order.billing_address).length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Adresse de Facturation
            </Text>
            {renderAddress(order.billing_address)}
          </View>
        )}

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Articles ({order.items?.length || 0})
        </Text>
        {order.items &&
          order.items.map((item) => (
            // La clé ici utilise itemId, qui est l'ID de la ligne order_items (plus unique)
            <View
              key={item.itemId}
              style={[styles.item, { borderBottomColor: colors.cardBorder }]}
            >
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.product_name} (x{item.quantity})
              </Text>
              <Text style={[styles.itemPrice, { color: colors.subtleText }]}>
                {parseFloat(String(item.unit_price)).toFixed(2)}{" "}
                {order.currency} x {item.quantity} ={" "}
                {parseFloat(String(item.subtotal)).toFixed(2)} {order.currency}
              </Text>
            </View>
          ))}
        {(!order.items || order.items.length === 0) && (
          <Text style={[styles.itemPrice, { color: colors.subtleText }]}>
            Aucun article dans cette commande.
          </Text>
        )}
      </View>

      {(order.shipping_method || order.shipping_cost !== undefined) && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Livraison
          </Text>
          {order.shipping_method && (
            <Text style={[styles.text, { color: colors.text }]}>
              Méthode :{" "}
              <Text style={[styles.value, { color: colors.text }]}>{order.shipping_method}</Text>
            </Text>
          )}
          {order.shipping_cost !== undefined && (
            <Text style={[styles.text, { color: colors.text }]}>
              Coût :{" "}
              <Text style={[styles.value, { color: colors.text }]}>
                {parseFloat(String(order.shipping_cost)).toFixed(2)}{" "}
                {order.currency}
              </Text>
            </Text>
          )}
        </View>
      )}

      {order.notes && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vos Notes
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>{order.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  section: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 1, // Petite ombre Android
    shadowColor: "#000", // Ombre iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600", // Un peu moins que bold
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor est appliqué dynamiquement
  },
  text: {
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 22,
  },
  value: {
    // Style pour les valeurs à côté des labels
    fontWeight: "500",
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 16,
  },
  item: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLast: {
    // Pour le dernier item, pas de bordure en bas
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 3,
  },
  itemPrice: {
    fontSize: 14,
  },
  // Ajout du style pour les adresses (sinon, elles ne prendront pas les couleurs du thème)
  addressText: {
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 22,
  },
});