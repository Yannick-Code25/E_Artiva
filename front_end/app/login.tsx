// ARTIVA/front_end/app/login.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  useColorScheme,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Colors from "../constants/Colors";

const API_BASE_URL = "http://192.168.244.128:3001/api";

export default function LoginScreen() {
  const { signIn, isLoading: isAuthLoading } = useAuth();
  
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // NOUVEAU: État pour gérer l'erreur renvoyée par le serveur
  const [serverError, setServerError] = useState<string>("");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // On efface les erreurs dès que l'utilisateur modifie un champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const { email, password } = formData;
    
    if (!email.trim()) {
      newErrors.email = "L'adresse e-mail est requise.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'adresse e-mail n'est pas valide.";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setServerError(""); 
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur de serveur: ${response.status}`);
      }

      await signIn(data.token, data.user);

    } catch (error: any) {
      setServerError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading && !isSubmitting) {
    return (
      <SafeAreaView style={[styles.centeredLoader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={[styles.title, { color: colors.primary }]}>Artiva</Text>
            <Text style={[styles.subtitle, { color: colors.subtleText }]}>Connexion</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: errors.email ? colors.errorText : colors.inputBorder, color: colors.text }]}
              placeholder="Adresse e-mail"
              placeholderTextColor={colors.subtleText}
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.email}</Text>}

            <View style={[styles.passwordContainer, { backgroundColor: colors.inputBackground, borderColor: errors.password ? colors.errorText : colors.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Mot de passe"
                placeholderTextColor={colors.subtleText}
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color={colors.subtleText} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.password}</Text>}

            {/* NOUVEAU: Zone d'affichage pour l'erreur du serveur */}
            {serverError && (
              <View style={[styles.serverErrorContainer, { backgroundColor: colors.errorBackground }]}>
                 <FontAwesome name="exclamation-circle" size={18} color={colors.errorText} style={{ marginRight: 10 }} />
                <Text style={[styles.serverErrorText, { color: colors.errorText }]}>{serverError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>Créer un compte</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles mis à jour
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  container: { width: '100%' },
  centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 24, textAlign: 'center', marginBottom: 40 },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 15,
    marginBottom: 5,
  },
  passwordInput: { flex: 1, paddingHorizontal: 20, paddingVertical: 15, fontSize: 16 },
  eyeIcon: { padding: 15 },
  button: {
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 20, // Ajusté pour l'erreur serveur
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  linksContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 16, fontWeight: '500', paddingVertical: 5 },
  errorText: {
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
    marginBottom: 10, // Ajoute un peu d'espace avant le champ suivant
  },
  // NOUVEAUX STYLES pour l'erreur serveur
  serverErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20, // Espace avant le bouton
  },
  serverErrorText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1, // Pour que le texte prenne la place restante
  },
});