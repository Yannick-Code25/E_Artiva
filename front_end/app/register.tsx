// front_end/app/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.11.131:3001/api"; // EXEMPLE: 'http://192.168.1.105:3001/api'

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Ajoutons les champs optionnels pour le test, même si le formulaire ne les a pas encore tous explicitement
  const [address, setAddress] = useState(""); // Tu peux ajouter des inputs pour ça plus tard
  const [phone, setPhone] = useState(""); // Tu peux ajouter des inputs pour ça plus tard

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert(
        "Champs requis",
        "Veuillez remplir tous les champs obligatoires."
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        "Erreur de mot de passe",
        "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        // Utilise l'URL de l'API
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          address: address || null, // Envoie null si vide
          phone: phone || null, // Envoie null si vide
        }),
      });

      const data = await response.json(); // Essaie de parser la réponse JSON

      if (!response.ok) {
        // Vérifie si la réponse HTTP est un succès (status 2xx)
        // Si le backend renvoie un message d'erreur spécifique, utilise-le
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      // Si l'enregistrement est réussi
      Alert.alert(
        "Inscription réussie",
        "Votre compte a été créé. Vous pouvez maintenant vous connecter."
      );
      router.push("/login"); // Redirige vers la page de connexion après inscription
    } catch (error: any) {
      console.error("Erreur d'inscription frontend:", error);
      Alert.alert(
        "Erreur d'inscription",
        error.message ||
          "Une erreur de communication avec le serveur est survenue. Vérifiez votre connexion ou l'URL de l'API."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Artiva</Text>
          <Text style={styles.subtitle}>Créer un compte</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom complet *"
            value={name}
            onChangeText={setName}
            textContentType="name"
          />
          <TextInput
            style={styles.input}
            placeholder="Adresse e-mail *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
          <TextInput
            style={styles.input}
            placeholder="Numéro de téléphone (ex: 0612345678)" // Nouveau
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
          <TextInput
            style={[styles.input, styles.addressInput]} // Style spécifique pour l'adresse si besoin de plus de hauteur
            placeholder="Adresse complète (rue, ville, code postal)" // Nouveau
            value={address}
            onChangeText={setAddress}
            textContentType="fullStreetAddress" // type plus générique
            autoComplete="street-address"
            multiline={true} // Permet plusieurs lignes pour l'adresse
            numberOfLines={3} // Hauteur indicative pour multiline
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIconContainer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome
                name={showPassword ? "eye-slash" : "eye"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirmer le mot de passe *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              textContentType="newPassword"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIconContainer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome
                name={showConfirmPassword ? "eye-slash" : "eye"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20, // Réduit un peu pour que tout tienne mieux
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 40, // Un peu réduit
    fontWeight: "bold",
    color: "tomato",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 22, // Un peu réduit
    color: "#333",
    marginBottom: 25, // Un peu réduit
  },
  input: {
    width: "100%",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 20,
    paddingVertical: 12, // Un peu réduit pour plus de champs
    borderRadius: 10,
    fontSize: 15, // Un peu réduit
    marginBottom: 12, // Un peu réduit
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  addressInput: {
    // Style pour le champ adresse multiline
    minHeight: 80, // Hauteur minimale pour l'adresse
    textAlignVertical: "top", // Aligne le placeholder en haut pour multiline
    paddingTop: 12, // Ajustement du padding pour multiline
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 12, // Un peu réduit
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12, // Un peu réduit
    fontSize: 15, // Un peu réduit
  },
  eyeIconContainer: {
    paddingHorizontal: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "tomato",
    paddingVertical: 15, // Un peu réduit
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48, // Un peu réduit
    marginTop: 10, // Espace avant le bouton
  },
  buttonDisabled: {
    backgroundColor: "#FFC0CB",
  },
  buttonText: {
    color: "white",
    fontSize: 17, // Un peu réduit
    fontWeight: "600",
  },
  linksContainer: {
    marginTop: 15, // Un peu réduit
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 15, // Un peu réduit
    color: "#555",
  },
  linkText: {
    fontSize: 15, // Un peu réduit
    color: "tomato",
    fontWeight: "500",
    marginLeft: 5,
  },
});
