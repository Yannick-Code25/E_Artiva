// ARTIVA/front_end/app/checkout.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Button,
} from "react-native";
import { Stack, useRouter, Redirect } from "expo-router";
import { useCart } from "../context/CartContext"; // Pour récupérer les infos du panier
import { useAuth } from "../context/AuthContext"; // Pour récupérer les infos de l'utilisateur connecté
import Colors from "../constants/Colors";
import { useColorScheme } from "../components/useColorScheme";
import { Picker } from "@react-native-picker/picker"; // Pour le sélecteur de méthode de paiement
import AsyncStorage from "@react-native-async-storage/async-storage";

// **ATTENTION: METS TON ADRESSE IP LOCALE CORRECTE ICI**
const API_BASE_URL = "http://192.168.248.151:3001/api";
// Exemple: const API_BASE_URL = 'http://192.168.1.105:3001/api';

// Types pour les données du formulaire
interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string; // Tu pourrais avoir un sélecteur de pays plus tard
  paymentMethod: "cod" | "mobile_money" | "card"; // cod = Cash On Delivery
  notes?: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, userToken, isLoading: isAuthLoading } = useAuth();
  const { cartItems, getTotalPrice, getTotalItems, clearCart } = useCart(); // Fonctions et données du panier
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const textColor = Colors[colorScheme ?? "light"].text;
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const placeholderTextColor = Colors[colorScheme ?? "light"].tabIconDefault;

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: user?.name || "",
    email: user?.email || "", // Email de contact pour la commande
    phone: (user as any)?.phone || "", // Le type User dans AuthContext n'a pas 'phone' par défaut
    addressLine1: (user as any)?.address || "", // Utilise l'adresse du profil si disponible
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "Côte d'Ivoire", // Valeur par défaut
    paymentMethod: "cod", // Paiement à la livraison par défaut
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Rediriger si l'utilisateur n'est pas authentifié ou si l'auth charge encore
  useEffect(() => {
    if (!isAuthLoading && !userToken) {
      console.log(
        "CheckoutScreen: Non authentifié ou token non chargé, redirection vers /login"
      );
      router.replace("/login");
    }
  }, [userToken, isAuthLoading, router]);

  // Pré-remplir le formulaire avec les infos de l'utilisateur si elles existent
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: (user as any).phone || prev.phone,
        addressLine1: (user as any).address || prev.addressLine1,
      }));
    }
  }, [user]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = async () => {
    // Validation basique
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.country
    ) {
      Alert.alert(
        "Champs requis",
        "Veuillez remplir tous les champs obligatoires de l'adresse et du contact."
      );
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert(
        "Panier Vide",
        "Votre panier est vide. Impossible de passer commande."
      );
      return;
    }

    // Utiliser directement userToken du contexte
    if (!userToken) {
      // Double vérification, même si useEffect devrait déjà avoir redirigé
      Alert.alert(
        "Erreur d'authentification",
        "Votre session semble invalide. Veuillez vous reconnecter."
      );
      setIsSubmitting(false);
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    if (isAuthLoading) return;

    const orderPayload = {
      cart_items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })), // Le backend calculera les prix
      shipping_address: {
        // Objet pour l'adresse de livraison
        name: formData.fullName, // Nom sur l'adresse de livraison
        line1: formData.addressLine1,
        line2: formData.addressLine2,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
        phone: formData.phone, // Téléphone pour la livraison
        email: formData.email, // Email de contact pour la commande
      },
      // billing_address: { ... }, // Si tu as une adresse de facturation séparée
      payment_method: formData.paymentMethod,
      notes: formData.notes,
      currency: "XOF", // Ou la devise de ton choix
      // Le total_amount et les sous-totaux seront calculés par le backend pour plus de sécurité
    };

    console.log(
      "Envoi de la commande au backend:",
      JSON.stringify(orderPayload, null, 2)
    );
    console.log(
      "Envoi de la commande avec token:",
      userToken ? "OK" : "MANQUANT!"
    );

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Erreur lors de la création de la commande (${response.status})`
        );
      }

      // Commande créée avec succès !
      Alert.alert(
        "Commande Réussie !",
        `Votre commande N°${
          responseData.order?.order_number || ""
        } a été passée avec succès.`,
        [
          {
            text: "OK",
            onPress: () => {
              clearCart(); // Vider le panier local
              router.replace("/(tabs)/" as any); // Rediriger vers l'accueil
              // Tu pourrais aussi rediriger vers une page de confirmation de commande
              // router.replace(`/order-confirmation/${responseData.order?.id}`);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("Erreur lors de la soumission de la commande:", err);
      setSubmissionError(
        err.message || "Une erreur est survenue. Veuillez réessayer."
      );
      Alert.alert(
        "Erreur de Commande",
        err.message || "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si l'auth charge encore ou si on va être redirigé, afficher un loader
  if (isAuthLoading || !userToken) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  // Calcul du total (pour affichage seulement, le backend recalculera)
  const shippingCost = 0; // Pour l'instant, pas de frais de port
  const orderTotal = getTotalPrice() + shippingCost;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen
        options={{
          title: "Validation de la Commande",
          headerBackTitle: "Panier",
        }}
      />

      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Vos Informations
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Nom complet *"
        value={formData.fullName}
        onChangeText={(text) => handleInputChange("fullName", text)}
      />
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Email de contact *"
        value={formData.email}
        onChangeText={(text) => handleInputChange("email", text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Téléphone de contact *"
        value={formData.phone}
        onChangeText={(text) => handleInputChange("phone", text)}
        keyboardType="phone-pad"
      />

      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Adresse de Livraison
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Adresse (Ligne 1) *"
        value={formData.addressLine1}
        onChangeText={(text) => handleInputChange("addressLine1", text)}
      />
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Adresse (Ligne 2, optionnel)"
        value={formData.addressLine2}
        onChangeText={(text) => handleInputChange("addressLine2", text)}
      />
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Ville *"
        value={formData.city}
        onChangeText={(text) => handleInputChange("city", text)}
      />
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Code Postal (optionnel)"
        value={formData.postalCode}
        onChangeText={(text) => handleInputChange("postalCode", text)}
      />
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: placeholderTextColor },
        ]}
        placeholderTextColor={placeholderTextColor}
        placeholder="Pays *"
        value={formData.country}
        onChangeText={(text) => handleInputChange("country", text)}
      />

      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Méthode de Paiement
      </Text>
      <View
        style={[styles.pickerContainer, { borderColor: placeholderTextColor }]}
      >
        <Picker
          selectedValue={formData.paymentMethod}
          onValueChange={(itemValue) =>
            handleInputChange("paymentMethod", itemValue as string)
          }
          style={{ color: textColor }}
          dropdownIconColor={textColor}
        >
          {/* a implmenter le plus tot possible  */}
          <Picker.Item label="Paiement à la livraison" value="cod" />
          <Picker.Item
            label="Mobile Money (Bientôt)"
            value="mobile_money"
            disabled={true}
          />
          <Picker.Item
            label="Carte Bancaire (Bientôt)"
            value="card"
            disabled={true}
          />
        </Picker>
      </View>

      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Récapitulatif de la Commande
      </Text>
      {cartItems.map((item) => (
        <View key={item.id} style={styles.recapItem}>
          <Text style={{ color: textColor }}>
            {item.name} (x{item.quantity})
          </Text>
          <Text style={{ color: textColor }}>
            {(
              parseFloat(String(item.price).replace(/[^\d.-]/g, "")) *
              item.quantity
            ).toFixed(2)}{" "}
            FCFA
          </Text>
        </View>
      ))}
      <View style={styles.recapTotal}>
        <Text style={[styles.totalText, { color: textColor }]}>
          Total Commande:
        </Text>
        <Text style={[styles.totalAmount, { color: tintColor }]}>
          {orderTotal.toFixed(2)} FCFA
        </Text>
      </View>

      {submissionError && (
        <Text style={styles.errorText}>{submissionError}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: tintColor },
          isSubmitting && styles.disabledButton,
        ]}
        onPress={handleSubmitOrder}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Confirmer la Commande</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles (à adapter et améliorer)
const styles = StyleSheet.create({
  screen: { flex: 1 },
  contentContainer: { padding: 15, paddingBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    // borderColor: '#ccc', // Géré par thème
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    // borderColor: '#ccc', // Géré par thème
    borderRadius: 6,
    marginBottom: 15,
  },
  recapItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  recapTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalText: { fontSize: 16, fontWeight: "bold" },
  totalAmount: { fontSize: 18, fontWeight: "bold" },
  submitButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 25,
  },
  submitButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  disabledButton: { backgroundColor: "#BDBDBD" },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
    fontSize: 15,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // Optionnel, si tu veux un peu d'espace
  },
});
