// // ARTIVA/front_end/app/checkout.tsx
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Platform,
//   Button,
// } from "react-native";
// import { Stack, useRouter, Redirect } from "expo-router";
// import { useCart } from "../context/CartContext"; // Pour récupérer les infos du panier
// import { useAuth } from "../context/AuthContext"; // Pour récupérer les infos de l'utilisateur connecté
// import Colors from "../constants/Colors";
// import { useColorScheme } from "../components/useColorScheme";
// import { Picker } from "@react-native-picker/picker"; // Pour le sélecteur de méthode de paiement
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // **ATTENTION: METS TON ADRESSE IP LOCALE CORRECTE ICI**
// const API_BASE_URL = "http://192.168.1.2:3001/api";
// // Exemple: const API_BASE_URL = 'http://192.168.1.105:3001/api';

// // Types pour les données du formulaire
// interface CheckoutFormData {
//   fullName: string;
//   email: string;
//   phone: string;
//   addressLine1: string;
//   addressLine2?: string;
//   city: string;
//   postalCode: string;
//   country: string; // Tu pourrais avoir un sélecteur de pays plus tard
//   paymentMethod: "cod" | "mobile_money" | "card"; // cod = Cash On Delivery
//   notes?: string;
// }

// export default function CheckoutScreen() {
//   const router = useRouter();
//   const { user, userToken, isLoading: isAuthLoading } = useAuth();
//   const { cartItems, getTotalPrice, getTotalItems, clearCart } = useCart(); // Fonctions et données du panier
//   const colorScheme = useColorScheme();
//   const tintColor = Colors[colorScheme ?? "light"].tint;
//   const textColor = Colors[colorScheme ?? "light"].text;
//   const backgroundColor = Colors[colorScheme ?? "light"].background;
//   const placeholderTextColor = Colors[colorScheme ?? "light"].tabIconDefault;

//   const [formData, setFormData] = useState<CheckoutFormData>({
//     fullName: user?.name || "",
//     email: user?.email || "", // Email de contact pour la commande
//     phone: (user as any)?.phone || "", // Le type User dans AuthContext n'a pas 'phone' par défaut
//     addressLine1: (user as any)?.address || "", // Utilise l'adresse du profil si disponible
//     addressLine2: "",
//     city: "",
//     postalCode: "",
//     country: "Côte d'Ivoire", // Valeur par défaut
//     paymentMethod: "cod", // Paiement à la livraison par défaut
//     notes: "",
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submissionError, setSubmissionError] = useState<string | null>(null);

//   // Rediriger si l'utilisateur n'est pas authentifié ou si l'auth charge encore
//   useEffect(() => {
//     if (!isAuthLoading && !userToken) {
//       console.log(
//         "CheckoutScreen: Non authentifié ou token non chargé, redirection vers /login"
//       );
//       router.replace("/login");
//     }
//   }, [userToken, isAuthLoading, router]);

//   // Pré-remplir le formulaire avec les infos de l'utilisateur si elles existent
//   useEffect(() => {
//     if (user) {
//       setFormData((prev) => ({
//         ...prev,
//         fullName: user.name || prev.fullName,
//         email: user.email || prev.email,
//         phone: (user as any).phone || prev.phone,
//         addressLine1: (user as any).address || prev.addressLine1,
//       }));
//     }
//   }, [user]);

//   const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSubmitOrder = async () => {
//     // Validation basique
//     if (
//       !formData.fullName ||
//       !formData.email ||
//       !formData.phone ||
//       !formData.addressLine1 ||
//       !formData.city ||
//       !formData.country
//     ) {
//       Alert.alert(
//         "Champs requis",
//         "Veuillez remplir tous les champs obligatoires de l'adresse et du contact."
//       );
//       return;
//     }
//     if (cartItems.length === 0) {
//       Alert.alert(
//         "Panier Vide",
//         "Votre panier est vide. Impossible de passer commande."
//       );
//       return;
//     }

//     // Utiliser directement userToken du contexte
//     if (!userToken) {
//       // Double vérification, même si useEffect devrait déjà avoir redirigé
//       Alert.alert(
//         "Erreur d'authentification",
//         "Votre session semble invalide. Veuillez vous reconnecter."
//       );
//       setIsSubmitting(false);
//       router.push("/login");
//       return;
//     }

//     setIsSubmitting(true);
//     setSubmissionError(null);

//     if (isAuthLoading) return;

//     const orderPayload = {
//       cart_items: cartItems.map((item) => ({
//         product_id: item.id,
//         quantity: item.quantity,
//       })), // Le backend calculera les prix
//       shipping_address: {
//         // Objet pour l'adresse de livraison
//         name: formData.fullName, // Nom sur l'adresse de livraison
//         line1: formData.addressLine1,
//         line2: formData.addressLine2,
//         city: formData.city,
//         postal_code: formData.postalCode,
//         country: formData.country,
//         phone: formData.phone, // Téléphone pour la livraison
//         email: formData.email, // Email de contact pour la commande
//       },
//       // billing_address: { ... }, // Si tu as une adresse de facturation séparée
//       payment_method: formData.paymentMethod,
//       notes: formData.notes,
//       currency: "XOF", // Ou la devise de ton choix
//       // Le total_amount et les sous-totaux seront calculés par le backend pour plus de sécurité
//     };

//     console.log(
//       "Envoi de la commande au backend:",
//       JSON.stringify(orderPayload, null, 2)
//     );
//     console.log(
//       "Envoi de la commande avec token:",
//       userToken ? "OK" : "MANQUANT!"
//     );

//     try {
//       const response = await fetch(`${API_BASE_URL}/orders`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${userToken}`,
//         },
//         body: JSON.stringify(orderPayload),
//       });

//       const responseData = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           responseData.message ||
//             `Erreur lors de la création de la commande (${response.status})`
//         );
//       }

//       // Commande créée avec succès !
//       Alert.alert(
//         "Commande Réussie !",
//         `Votre commande N°${
//           responseData.order?.order_number || ""
//         } a été passée avec succès.`,
//         [
//           {
//             text: "OK",
//             onPress: () => {
//               clearCart(); // Vider le panier local
//               router.replace("/(tabs)/" as any); // Rediriger vers l'accueil
//               // Tu pourrais aussi rediriger vers une page de confirmation de commande
//               // router.replace(`/order-confirmation/${responseData.order?.id}`);
//             },
//           },
//         ]
//       );
//     } catch (err: any) {
//       console.error("Erreur lors de la soumission de la commande:", err);
//       setSubmissionError(
//         err.message || "Une erreur est survenue. Veuillez réessayer."
//       );
//       Alert.alert(
//         "Erreur de Commande",
//         err.message || "Une erreur est survenue. Veuillez réessayer."
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Si l'auth charge encore ou si on va être redirigé, afficher un loader
//   if (isAuthLoading || !userToken) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator
//           size="large"
//           color={Colors[colorScheme ?? "light"].tint}
//         />
//       </View>
//     );
//   }

//   // Calcul du total (pour affichage seulement, le backend recalculera)
//   const shippingCost = 0; // Pour l'instant, pas de frais de port
//   const orderTotal = getTotalPrice() + shippingCost;

//   return (
//     <ScrollView
//       style={[styles.screen, { backgroundColor }]}
//       contentContainerStyle={styles.contentContainer}
//     >
//       <Stack.Screen
//         options={{
//           title: "Validation de la Commande",
//           headerBackTitle: "Panier",
//         }}
//       />

//       <Text style={[styles.sectionTitle, { color: textColor }]}>
//         Vos Informations
//       </Text>
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Nom complet *"
//         value={formData.fullName}
//         onChangeText={(text) => handleInputChange("fullName", text)}
//       />
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Email de contact *"
//         value={formData.email}
//         onChangeText={(text) => handleInputChange("email", text)}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Téléphone de contact *"
//         value={formData.phone}
//         onChangeText={(text) => handleInputChange("phone", text)}
//         keyboardType="phone-pad"
//       />

//       <Text style={[styles.sectionTitle, { color: textColor }]}>
//         Adresse de Livraison
//       </Text>
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Adresse (Ligne 1) *"
//         value={formData.addressLine1}
//         onChangeText={(text) => handleInputChange("addressLine1", text)}
//       />
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Adresse (Ligne 2, optionnel)"
//         value={formData.addressLine2}
//         onChangeText={(text) => handleInputChange("addressLine2", text)}
//       />
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Ville *"
//         value={formData.city}
//         onChangeText={(text) => handleInputChange("city", text)}
//       />
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Code Postal (optionnel)"
//         value={formData.postalCode}
//         onChangeText={(text) => handleInputChange("postalCode", text)}
//       />
//       <TextInput
//         style={[
//           styles.input,
//           { color: textColor, borderColor: placeholderTextColor },
//         ]}
//         placeholderTextColor={placeholderTextColor}
//         placeholder="Pays *"
//         value={formData.country}
//         onChangeText={(text) => handleInputChange("country", text)}
//       />

//       <Text style={[styles.sectionTitle, { color: textColor }]}>
//         Méthode de Paiement
//       </Text>
//       <View
//         style={[styles.pickerContainer, { borderColor: placeholderTextColor }]}
//       >
//         <Picker
//           selectedValue={formData.paymentMethod}
//           onValueChange={(itemValue) =>
//             handleInputChange("paymentMethod", itemValue as string)
//           }
//           style={{ color: textColor }}
//           dropdownIconColor={textColor}
//         >
//           {/* a implmenter le plus tot possible  */}
//           <Picker.Item label="Paiement à la livraison" value="cod" />
//           <Picker.Item
//             label="Mobile Money (Bientôt)"
//             value="mobile_money"
//             disabled={true}
//           />
//           <Picker.Item
//             label="Carte Bancaire (Bientôt)"
//             value="card"
//             disabled={true}
//           />
//         </Picker>
//       </View>

//       <Text style={[styles.sectionTitle, { color: textColor }]}>
//         Récapitulatif de la Commande
//       </Text>
//       {cartItems.map((item) => (
//         <View key={item.id} style={styles.recapItem}>
//           <Text style={{ color: textColor }}>
//             {item.name} (x{item.quantity})
//           </Text>
//           <Text style={{ color: textColor }}>
//             {(
//               parseFloat(String(item.price).replace(/[^\d.-]/g, "")) *
//               item.quantity
//             ).toFixed(2)}{" "}
//             FCFA
//           </Text>
//         </View>
//       ))}
//       <View style={styles.recapTotal}>
//         <Text style={[styles.totalText, { color: textColor }]}>
//           Total Commande:
//         </Text>
//         <Text style={[styles.totalAmount, { color: tintColor }]}>
//           {orderTotal.toFixed(2)} FCFA
//         </Text>
//       </View>

//       {submissionError && (
//         <Text style={styles.errorText}>{submissionError}</Text>
//       )}

//       <TouchableOpacity
//         style={[
//           styles.submitButton,
//           { backgroundColor: tintColor },
//           isSubmitting && styles.disabledButton,
//         ]}
//         onPress={handleSubmitOrder}
//         disabled={isSubmitting}
//       >
//         {isSubmitting ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.submitButtonText}>Confirmer la Commande</Text>
//         )}
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// // Styles (à adapter et améliorer)
// const styles = StyleSheet.create({
//   screen: { flex: 1 },
//   contentContainer: { padding: 15, paddingBottom: 30 },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   input: {
//     borderWidth: 1,
//     // borderColor: '#ccc', // Géré par thème
//     paddingHorizontal: 12,
//     paddingVertical: Platform.OS === "ios" ? 12 : 8,
//     borderRadius: 6,
//     marginBottom: 12,
//     fontSize: 16,
//   },
//   pickerContainer: {
//     borderWidth: 1,
//     // borderColor: '#ccc', // Géré par thème
//     borderRadius: 6,
//     marginBottom: 15,
//   },
//   recapItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 5,
//   },
//   recapTotal: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingTop: 10,
//     marginTop: 10,
//     borderTopWidth: 1,
//     borderTopColor: "#eee",
//   },
//   totalText: { fontSize: 16, fontWeight: "bold" },
//   totalAmount: { fontSize: 18, fontWeight: "bold" },
//   submitButton: {
//     paddingVertical: 15,
//     borderRadius: 8,
//     alignItems: "center",
//     marginTop: 25,
//   },
//   submitButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
//   disabledButton: { backgroundColor: "#BDBDBD" },
//   errorText: {
//     color: "red",
//     textAlign: "center",
//     marginVertical: 10,
//     fontSize: 15,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20, // Optionnel, si tu veux un peu d'espace
//   },
// });





// ARTIVA/front_end/app/checkout.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, Image, KeyboardAvoidingView, Alert
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import QRCode from 'react-native-qrcode-svg';
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from 'expo-media-library';

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Colors from "../constants/Colors";

// **ATTENTION: METS TON ADRESSE IP LOCALE CORRECTE ICI**
const API_BASE_URL = "http://192.168.1.2:3001/api";

// --- TYPES ---
interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: "cod" | "mobile_money" | "card";
  notes?: string;
}

interface OrderConfirmationData {
  orderNumber: string;
  qrValue: string;
}

// --- COMPOSANT POUR LA BARRE DE PROGRESSION ---
const StepIndicator = ({ currentStep, colors }: { currentStep: number, colors: any }) => {
  const steps = ["Panier", "Livraison", "Paiement"];
  return (
    <View style={styles.stepIndicatorContainer}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                { backgroundColor: isActive || isCompleted ? colors.tint : colors.card, borderColor: isActive || isCompleted ? colors.tint : colors.border }
              ]}>
                {isCompleted ? (
                  <FontAwesome name="check" size={14} color={colors.background} />
                ) : (
                  <Text style={[styles.stepNumber, { color: isActive ? colors.background : colors.subtleText }]}>{stepNumber}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, { color: isActive ? colors.tint : colors.subtleText }]}>{step}</Text>
            </View>
            {index < steps.length - 1 && <View style={[styles.stepLine, { backgroundColor: isCompleted ? colors.tint : colors.border }]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
};


export default function CheckoutScreen() {
  const router = useRouter();
  const { user, userToken, isLoading: isAuthLoading, effectiveAppColorScheme } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const qrCodeRef = useRef<ViewShot>(null);

  // --- COULEURS DU THÈME ---
  const currentScheme = effectiveAppColorScheme ?? 'light';
  const colors = {
    tint: Colors[currentScheme].tint,
    text: Colors[currentScheme].text,
    background: Colors[currentScheme].background,
    subtleText: Colors[currentScheme].subtleText,
    card: Colors[currentScheme].card,
    border: Colors[currentScheme].cardBorder,
    errorText: Colors[currentScheme].errorText,
    successText: Colors[currentScheme].successText, // CORRECTION: Utilisation de successText
    disabled: '#BDBDBD',
  };

  // --- ÉTATS ---
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "", email: "", phone: "", addressLine1: "", city: "",
    country: "Bénin", paymentMethod: "cod", addressLine2: "", postalCode: "", notes: ""
  });
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [orderConfirmationData, setOrderConfirmationData] = useState<OrderConfirmationData | null>(null);

  // --- EFFETS ---
  useEffect(() => {
    if (!isAuthLoading && !userToken) {
      router.replace("/login");
    }
  }, [userToken, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: (user as any).phone || prev.phone,
        addressLine1: (user as any).address || prev.addressLine1,
      }));
    }
  }, [user]);

  // --- GESTIONNAIRES & LOGIQUE ---
  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep2 = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.addressLine1 || !formData.city) {
      setSubmissionError("Veuillez remplir tous les champs de livraison obligatoires (*).");
      return false;
    }
    setSubmissionError(null);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => prev + 1);
  };
  
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmitOrder = async () => {
    if (!validateStep2()) return;
    if (cartItems.length === 0) {
      setSubmissionError("Votre panier est vide.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);
    const orderPayload = {
        cart_items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })),
        shipping_address: { name: formData.fullName, line1: formData.addressLine1, line2: formData.addressLine2, city: formData.city, postal_code: formData.postalCode, country: formData.country, phone: formData.phone, email: formData.email },
        payment_method: formData.paymentMethod, notes: formData.notes, currency: "FCFA",
    };
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
            body: JSON.stringify(orderPayload),
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || "Erreur lors de la création de la commande.");
        clearCart();
        setOrderConfirmationData({
            orderNumber: responseData.order?.order_number || "N/A",
            qrValue: String(responseData.order?.id)
        });
    } catch (err: any) {
        setSubmissionError(err.message || "Une erreur est survenue.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDownloadQrCode = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert("Permission refusée", "Impossible de sauvegarder l'image sans votre autorisation.");
        return;
    }
    if (qrCodeRef.current) {
        try {
            const uri = await qrCodeRef.current.capture?.();
            if (!uri) throw new Error("Impossible de capturer le QR Code.");
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('Commandes Artiva', asset, false);
            Alert.alert('Succès', 'QR Code sauvegardé dans votre galerie (Album: Commandes Artiva).');
        } catch (error) {
            console.error("Erreur de sauvegarde QR:", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de la sauvegarde du QR Code.");
        }
    }
  };

  // --- SECTIONS DE RENDU ---
  function renderStep1() {
    const subTotal = getTotalPrice();
    const total = subTotal - discount;
    return (
        <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Récapitulatif du Panier</Text>
            {cartItems.map(item => (
                <View key={item.id} style={[styles.recapItem, { borderBottomColor: colors.border }]}>
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>{item.name}</Text>
                        <Text style={{ color: colors.subtleText }}>Quantité: {item.quantity}</Text>
                    </View>
                    <Text style={{ color: colors.text }}>{item.price}</Text>
                </View>
            ))}
            <View style={styles.promoContainer}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 10, color: colors.text, borderColor: colors.border }]} placeholder="Code promo" placeholderTextColor={colors.subtleText} value={promoCode} onChangeText={setPromoCode}/>
                <TouchableOpacity style={[styles.promoButton, { backgroundColor: colors.disabled }]} disabled>
                    <Text style={styles.promoButtonText}>Appliquer</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.totalSection, {backgroundColor: colors.card}]}>
                <View style={styles.totalRow}><Text style={{ color: colors.subtleText }}>Sous-total</Text><Text style={{ color: colors.subtleText }}>{subTotal.toFixed(2)} FCFA</Text></View>
                <View style={styles.totalRow}><Text style={{ color: colors.subtleText }}>Réduction</Text><Text style={{ color: colors.subtleText }}>- {discount.toFixed(2)} FCFA</Text></View>
                <View style={[styles.grandTotalRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.totalText, { color: colors.text }]}>Total</Text>
                    <Text style={[styles.totalAmount, { color: colors.tint }]}>{total.toFixed(2)} FCFA</Text>
                </View>
            </View>
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.tint }]} onPress={handleNextStep}>
                <Text style={styles.submitButtonText}>Suivant : Informations de Livraison</Text>
                <FontAwesome name="arrow-right" size={16} color="white" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
        </View>
    );
  }

  function renderStep2() {
    return (
        <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Informations de Livraison</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.subtleText} placeholder="Nom complet *" value={formData.fullName} onChangeText={(text) => handleInputChange("fullName", text)} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.subtleText} placeholder="Email de contact *" value={formData.email} onChangeText={(text) => handleInputChange("email", text)} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.subtleText} placeholder="Téléphone de contact *" value={formData.phone} onChangeText={(text) => handleInputChange("phone", text)} keyboardType="phone-pad" />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.subtleText} placeholder="Adresse (Ligne 1) *" value={formData.addressLine1} onChangeText={(text) => handleInputChange("addressLine1", text)} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.subtleText} placeholder="Adresse (Ligne 2, optionnel)" value={formData.addressLine2 || ''} onChangeText={(text) => handleInputChange("addressLine2", text)} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.subtleText} placeholder="Ville *" value={formData.city} onChangeText={(text) => handleInputChange("city", text)} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} placeholderTextColor={colors.subtleText} placeholder="Pays *" value={formData.country} onChangeText={(text) => handleInputChange("country", text)} editable={false} />
            {submissionError && <Text style={[styles.errorText, {color: colors.errorText}]}>{submissionError}</Text>}
            <View style={styles.navigationButtons}>
                <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handlePrevStep}>
                    <Text style={[styles.navButtonText, { color: colors.text }]}>Précédent</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.tint, borderColor: colors.tint }]} onPress={handleNextStep}>
                    <Text style={styles.navButtonText}>Suivant : Paiement</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  function renderStep3() {
    return (
        <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Paiement et Confirmation</Text>
            <Text style={[styles.subSectionTitle, { color: colors.text }]}>Méthode de paiement</Text>
            <View>
                <TouchableOpacity style={[styles.paymentOption, { borderColor: colors.tint, backgroundColor: colors.card }]}>
                    <FontAwesome name="check-circle" size={20} color={colors.tint} />
                    <Text style={[styles.paymentText, { color: colors.text }]}>Paiement à la livraison</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.paymentOption, { borderColor: colors.border, backgroundColor: colors.background }]} disabled>
                    <FontAwesome name="circle-o" size={20} color={colors.disabled} />
                    <Text style={[styles.paymentText, { color: colors.disabled }]}>Mobile Money (Bientôt)</Text>
                </TouchableOpacity>
            </View>
            <Text style={[styles.subSectionTitle, { color: colors.text, marginTop: 30 }]}>Récapitulatif Final</Text>
            <View style={[styles.finalRecap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>Livraison à :</Text>
                <Text style={{ color: colors.subtleText, lineHeight: 20 }}>{formData.fullName}, {formData.addressLine1}, {formData.city}.\nContact : {formData.phone}</Text>
                <View style={[styles.totalRow, { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Text style={[styles.totalText, { color: colors.text }]}>Total à payer</Text>
                    <Text style={[styles.totalAmount, { color: colors.tint }]}>{getTotalPrice().toFixed(2)} FCFA</Text>
                </View>
            </View>
            {submissionError && <Text style={[styles.errorText, {color: colors.errorText}]}>{submissionError}</Text>}
            <View style={styles.navigationButtons}>
                <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handlePrevStep} disabled={isSubmitting}>
                    <Text style={[styles.navButtonText, { color: colors.text }]}>Précédent</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.tint, borderColor: colors.tint }, isSubmitting && {backgroundColor: colors.disabled}]} onPress={handleSubmitOrder} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.navButtonText}>Confirmer la Commande</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  function renderOrderConfirmation() {
    return (
        <ScrollView contentContainerStyle={[styles.centered, { backgroundColor: colors.background, justifyContent: 'space-around' }]}>
            <View style={{alignItems: 'center'}}>
                <FontAwesome name="check-circle" size={80} color={colors.successText} />
                <Text style={[styles.confirmationTitle, { color: colors.text }]}>Commande Validée !</Text>
                <Text style={[styles.confirmationSubText, { color: colors.subtleText }]}>Votre commande N° <Text style={{fontWeight: 'bold', color: colors.text}}>{orderConfirmationData?.orderNumber}</Text> a été passée avec succès.</Text>
            </View>
            <View style={styles.qrSection}>
                <Text style={[styles.qrInstruction, {color: colors.text}]}>Conservez ce QR Code. Il sera scanné lors du retrait de votre commande.</Text>
                <ViewShot ref={qrCodeRef} options={{ format: "png", quality: 1.0 }}>
                    <View style={styles.qrCodeContainer}>
                         <QRCode value={orderConfirmationData?.qrValue || "error"} size={200} backgroundColor="white" color="black"/>
                    </View>
                </ViewShot>
                <TouchableOpacity style={[styles.downloadButton, { backgroundColor: colors.tint }]} onPress={handleDownloadQrCode}>
                    <FontAwesome name="download" size={16} color="white" />
                    <Text style={styles.submitButtonText}>Télécharger le QR Code</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)/' as any)}>
                <Text style={[styles.homeButtonText, {color: colors.tint}]}>Retour à l'accueil</Text>
            </TouchableOpacity>
        </ScrollView>
    );
  }

  // --- AFFICHAGE PRINCIPAL ---
  if (isAuthLoading || !userToken && !orderConfirmationData) {
    return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.tint} /></View>;
  }
  if (orderConfirmationData) {
    return renderOrderConfirmation();
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: "Validation de la Commande" }} />
        <StepIndicator currentStep={currentStep} colors={colors} />
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  screen: { flex: 1 },
  contentContainer: { paddingHorizontal: 15, paddingVertical: 20, paddingBottom: 50 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  stepIndicatorContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30 },
  stepItem: { alignItems: 'center', flexShrink: 1, paddingHorizontal: 4 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  stepNumber: { fontSize: 14, fontWeight: 'bold' },
  stepLabel: { fontSize: 12, textAlign: 'center' },
  stepLine: { flex: 1, height: 2, marginTop: 14, marginHorizontal: -15 },
  stepContainer: { paddingVertical: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  subSectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  input: { borderWidth: 1, paddingHorizontal: 15, paddingVertical: Platform.OS === "ios" ? 14 : 10, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  promoContainer: { flexDirection: 'row', marginTop: 20 },
  promoButton: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  promoButtonText: { color: 'white', fontWeight: 'bold' },
  recapItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  totalSection: { marginTop: 20, padding: 15, borderRadius: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandTotalRow: { paddingTop: 15, marginTop: 10, borderTopWidth: 1 },
  totalText: { fontSize: 18, fontWeight: 'bold' },
  totalAmount: { fontSize: 18, fontWeight: 'bold' },
  navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  navButton: { flex: 1, paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, borderWidth: 1 },
  navButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 2, borderRadius: 8, marginBottom: 10 },
  paymentText: { marginLeft: 15, fontSize: 16 },
  finalRecap: { padding: 15, borderRadius: 8, borderWidth: 1, marginTop: 10 },
  errorText: { textAlign: 'center', marginVertical: 10, fontSize: 15 },
  submitButton: { flexDirection: 'row', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  // Confirmation Screen Styles
  confirmationTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  confirmationSubText: { fontSize: 16, textAlign: 'center', marginTop: 10, paddingHorizontal: 20, lineHeight: 24 },
  qrSection: { alignItems: 'center', width: '100%', paddingVertical: 30 },
  qrInstruction: { fontSize: 15, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  qrCodeContainer: { padding: 15, backgroundColor: 'white', borderRadius: 10, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  downloadButton: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 25, gap: 10 },
  homeButton: { marginTop: 20, padding: 10 },
  homeButtonText: { fontSize: 16, fontWeight: 'bold' },
});