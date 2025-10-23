// ARTIVA/front_end/app/register.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  useColorScheme, // On utilise le hook de React Native
} from "react-native";
import { Link, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "../constants/Colors"; // Assure-toi que le chemin est correct

// N'oublie pas de remplacer cette URL par la tienne ou de la mettre dans un fichier de config
const API_BASE_URL = "http://192.168.11.131:3001/api";

export default function RegisterScreen() {
  const router = useRouter();
  
  // --- Gestion du thème ---
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  // -------------------------

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key:string]: string } = {};
    const { name, email, password, confirmPassword } = formData;
    
    if (!name.trim()) newErrors.name = "Le nom complet est requis.";

    if (!email.trim()) {
      newErrors.email = "L'adresse e-mail est requise.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'adresse e-mail n'est pas valide.";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis.";
    } else if (password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          address: formData.address || null,
          phone: formData.phone || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur serveur (${response.status})`);
      }

      Alert.alert(
        "Inscription réussie !",
        "Votre compte a été créé. Vous allez être redirigé vers la page de connexion."
      );
      router.push("/login");

    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      Alert.alert("Erreur d'inscription", error.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={[styles.title, { color: colors.primary }]}>Artiva</Text>
            <Text style={[styles.subtitle, { color: colors.subtleText }]}>Créer un compte</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Nom complet *"
              placeholderTextColor={colors.subtleText}
              value={formData.name}
              onChangeText={(text) => handleInputChange("name", text)}
            />
            {errors.name && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.name}</Text>}

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Adresse e-mail *"
              placeholderTextColor={colors.subtleText}
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.email}</Text>}
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Numéro de téléphone"
              placeholderTextColor={colors.subtleText}
              value={formData.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Adresse complète"
              placeholderTextColor={colors.subtleText}
              value={formData.address}
              onChangeText={(text) => handleInputChange("address", text)}
            />

            <View style={[styles.passwordContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Mot de passe *"
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

            <View style={[styles.passwordContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Confirmer le mot de passe *"
                placeholderTextColor={colors.subtleText}
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color={colors.subtleText} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.confirmPassword}</Text>}

            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.subtleText }]}>Déjà un compte ? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>Se connecter</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Les styles ne contiennent PLUS de couleurs statiques
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 5,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white', // Le texte du bouton principal reste blanc dans les deux thèmes
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 5,
  },
});