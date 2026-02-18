// ARTIVA/front_end/app/checkout.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Colors from "../constants/Colors";

const API_BASE_URL = "https://back-end-purple-log-1280.fly.dev/api";

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

// --- COMPOSANT PRINCIPAL ---
export default function CheckoutScreen() {
  const router = useRouter();
  const { user, userToken, isLoading: isAuthLoading, effectiveAppColorScheme } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const qrCodeRef = useRef<ViewShot>(null);

  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = {
    tint: Colors[currentScheme].tint,
    text: Colors[currentScheme].text,
    background: Colors[currentScheme].background,
    subtleText: Colors[currentScheme].subtleText,
    card: Colors[currentScheme].card,
    border: Colors[currentScheme].cardBorder,
    errorText: Colors[currentScheme].errorText,
    successText: Colors[currentScheme].successText,
    disabled: "#BDBDBD",
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    country: "Bénin",
    paymentMethod: "cod",
    addressLine2: "",
    postalCode: "",
    notes: "",
  });
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [orderConfirmationData, setOrderConfirmationData] = useState<OrderConfirmationData | null>(null);

  // --- Effets ---
  useEffect(() => {
    if (!isAuthLoading && !userToken) {
      router.replace("/login");
    }
  }, [userToken, isAuthLoading]);

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

  // --- Gestionnaires ---
  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

  const handleSubmitOrder = async () => {
    if (!validateStep2()) return;
    if (cartItems.length === 0) {
      setSubmissionError("Votre panier est vide.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);

    const orderPayload = {
      cart_items: cartItems.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      shipping_address: {
        name: formData.fullName,
        line1: formData.addressLine1,
        line2: formData.addressLine2,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
      },
      payment_method: formData.paymentMethod,
      notes: formData.notes,
      currency: "FCFA",
    };

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
      if (!response.ok) throw new Error(responseData.message || "Erreur lors de la création de la commande.");
      clearCart();
      setOrderConfirmationData({
        orderNumber: responseData.order?.order_number || "N/A",
        qrValue: String(responseData.order?.id),
      });
    } catch (err: any) {
      setSubmissionError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQrCode = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (permission.status !== "granted") {
        Alert.alert("Permission refusée", "Autorisez l'accès aux photos pour sauvegarder le QR Code.");
        return;
      }
      if (!qrCodeRef.current) {
        Alert.alert("Erreur", "QR Code introuvable.");
        return;
      }
      const uri = await (qrCodeRef.current as any).capture();
      if (!uri) throw new Error("Capture du QR Code échouée");
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Commandes Artiva", asset, false);
      Alert.alert("Succès", "QR Code enregistré dans votre galerie (Album: Commandes Artiva)");
    } catch (error) {
      console.error("Erreur sauvegarde QR:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder le QR Code.");
    }
  };

  // --- STEPS INDICATOR ---
  const renderStepsIndicator = () => {
    if (orderConfirmationData) return null; // pas de steps quand QR code affiché

    const steps = [
      { label: "Panier" },
      { label: "Livraison" },
      { label: "Paiement" },
    ];

    return (
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 15 }}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          return (
            <View key={index} style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: isCompleted ? colors.successText : colors.tint,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  {isCompleted ? "✓" : stepNumber}
                </Text>
              </View>
              <Text style={{ marginTop: 5, fontSize: 12, color: colors.text }}>{step.label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // --- RENDER STEPS ---
  const renderStep1 = () => {
    const subTotal = getTotalPrice();
    const total = subTotal - discount;

    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20, paddingBottom: 100 }} style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Récapitulatif du Panier</Text>
        {cartItems.map((item) => (
          <View key={item.id} style={[styles.recapItem, { borderBottomColor: colors.border }]}>
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "bold" }}>{item.name}</Text>
              <Text style={{ color: colors.subtleText }}>Quantité: {item.quantity}</Text>
            </View>
            <Text style={{ color: colors.text }}>{item.price}</Text>
          </View>
        ))}
        <View style={[styles.totalSection, { backgroundColor: colors.card }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalText, { color: colors.subtleText }]}>Sous-total</Text>
            <Text style={[styles.totalText, { color: colors.subtleText }]}>{subTotal.toFixed(2)} FCFA</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalText, { color: colors.subtleText }]}>Réduction</Text>
            <Text style={[styles.totalText, { color: colors.subtleText }]}>{`- ${discount.toFixed(2)} FCFA`}</Text>
          </View>
          <View style={[styles.grandTotalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalText, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.tint }]}>{total.toFixed(2)} FCFA</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.tint, marginTop: 30 }]} onPress={handleNextStep}>
          <Text style={styles.submitButtonText}>Informations de Livraison</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20, paddingBottom: 100 }} style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Informations de Livraison</Text>
      {["fullName", "email", "phone", "addressLine1", "addressLine2", "city"].map((field) => (
        <TextInput
          key={field}
          style={styles.inputLine}
          placeholder={field === "fullName" ? "Nom complet *" :
                       field === "email" ? "Email de contact *" :
                       field === "phone" ? "Téléphone de contact *" :
                       field === "addressLine1" ? "Adresse (Ligne 1) *" :
                       field === "addressLine2" ? "Adresse (Ligne 2, optionnel)" :
                       "Ville *"}
          placeholderTextColor={colors.subtleText}
          value={(formData as any)[field] || ""}
          onChangeText={(text) => handleInputChange(field as keyof CheckoutFormData, text)}
          keyboardType={field === "email" ? "email-address" : field === "phone" ? "phone-pad" : "default"}
          autoCapitalize={field === "email" ? "none" : "sentences"}
        />
      ))}
      <TextInput
        style={[styles.inputLine, { backgroundColor: colors.card }]}
        placeholder="Pays *"
        placeholderTextColor={colors.subtleText}
        value={formData.country}
        editable={false}
      />
      {submissionError && <Text style={[styles.errorText, { color: colors.errorText, marginBottom: 20 }]}>{submissionError}</Text>}
      <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.tint, marginTop: 30 }]} onPress={handleNextStep}>
        <Text style={styles.submitButtonText}>Suivant : Paiement</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => {
    const total = getTotalPrice() - discount;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20, paddingBottom: 120 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>3. Paiement et Confirmation</Text>
          <Text style={[styles.subSectionTitle, { color: colors.text, marginBottom: 10 }]}>Méthode de paiement</Text>
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity style={[styles.paymentOption, { borderColor: colors.tint, backgroundColor: colors.card }]}>
              <FontAwesome name="check-circle" size={20} color={colors.tint} />
              <Text style={[styles.paymentText, { color: colors.text, marginLeft: 10 }]}>Paiement à la livraison</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subSectionTitle, { color: colors.text, marginBottom: 10 }]}>Récapitulatif Final</Text>
          <View style={[styles.finalRecap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 5 }}>Livraison à :</Text>
            <Text style={{ color: colors.subtleText, lineHeight: 22, marginBottom: 10 }}>
              {formData.fullName}, {formData.addressLine1}, {formData.city}.{"\n"}Contact : {formData.phone}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
              <Text style={[styles.totalText, { color: colors.text }]}>Total à payer</Text>
              <Text style={[styles.totalAmount, { color: colors.tint }]}>{total.toFixed(2)} FCFA</Text>
            </View>
          </View>
          {submissionError && <Text style={[styles.errorText, { color: colors.errorText, marginBottom: 10 }]}>{submissionError}</Text>}
        </ScrollView>

        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 20,
            left: 16,
            right: 16,
            backgroundColor: isSubmitting ? colors.disabled : colors.tint,
            borderRadius: 12,
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={[styles.submitButtonText, { fontSize: 18, fontWeight: "700" }]}>Confirmer la Commande</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  // --- RENDER CONFIRMATION ---
  const renderOrderConfirmation = () => (
    <ScrollView contentContainerStyle={[styles.centered, { backgroundColor: colors.background, justifyContent: "center", padding: 20 }]}>
      <View style={{ alignItems: "center" }}>
        <FontAwesome name="check-circle" size={80} color={colors.successText} />
        <Text
          style={[
            styles.confirmationTitle,
            {
              color: colors.text,
              fontSize: 22,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 30,
              marginVertical: 20,
            },
          ]}
        >
          🎉 Merci !{"\n"}Votre commande a été créée avec succès.
        </Text>
        <Text style={[styles.confirmationText, { color: colors.subtleText, textAlign: "center", marginBottom: 20 }]}>
          Numéro de commande : {orderConfirmationData?.orderNumber}
        </Text>

        {orderConfirmationData?.qrValue && (
          <ViewShot ref={qrCodeRef} options={{ format: "png", quality: 1 }} style={{ marginBottom: 20 }}>
            <QRCode value={orderConfirmationData.qrValue} size={180} backgroundColor="white" />
          </ViewShot>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.tint,
              paddingVertical: 18,
              paddingHorizontal: 25,
              borderRadius: 12,
              marginBottom: 15,
            },
          ]}
          onPress={handleDownloadQrCode}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700", textAlign: "center" }}>
            Télécharger le QR Code
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  // --- RENDER PRINCIPAL ---
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: orderConfirmationData ? "Commande Confirmée" : "Passer la Commande",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontSize: 20, fontWeight: "700" },
          headerTitleAlign: "center",
          headerTintColor: "#000",
          headerShadowVisible: false,
          headerLeft: () =>
            orderConfirmationData ? (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
                <FontAwesome name="arrow-left" size={24} color="#000" />
              </TouchableOpacity>
            ) : null,
        }}
      />

      {/* Steps Indicator */}
      {renderStepsIndicator()}

      {/* Contenu principal selon l'étape */}
      {orderConfirmationData
        ? renderOrderConfirmation()
        : currentStep === 1
        ? renderStep1()
        : currentStep === 2
        ? renderStep2()
        : renderStep3()}
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  recapItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 8,
  },
  totalSection: {
    marginTop: 20,
    borderRadius: 12,
    padding: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalText: {
    fontSize: 16,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  inputLine: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  paymentText: {
    fontSize: 16,
  },
  finalRecap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  errorText: {
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  confirmationText: {
    fontSize: 16,
  },
});
