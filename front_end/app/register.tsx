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

const API_BASE_URL = "http://192.168.248.151:3001/api"; // EXEMPLE: 'http://192.168.1.105:3001/api'

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







// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
// import axios from 'axios';
// import Colors from '../../constants/Colors';

// const RegisterScreen = () => {
//   const colorScheme = useColorScheme();
//   const themeColors = Colors[colorScheme || 'light'];

//   const [form, setForm] = useState({
//     name: '',
//     email: '',
//     password: '',
//     address: '',
//     phone: '',
//   });

//   const [feedback, setFeedback] = useState({ message: '', type: '' });

//   const handleChange = (field, value) => {
//     setForm({ ...form, [field]: value });
//   };

//   const handleRegister = async () => {
//     setFeedback({ message: '', type: '' });
//     try {
//       const res = await axios.post('http://localhost:3000/api/auth/register', form);
//       setFeedback({ message: res.data.message, type: 'success' });
//       setForm({ name: '', email: '', password: '', address: '', phone: '' });
//     } catch (err) {
//       const msg = err?.response?.data?.message || "Une erreur s'est produite.";
//       setFeedback({ message: msg, type: 'error' });
//     }
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: themeColors.background }]}>      
//       <Text style={[styles.title, { color: themeColors.text }]}>Créer un compte</Text>

//       <TextInput
//         style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]}
//         placeholder="Nom"
//         placeholderTextColor={themeColors.subtleText}
//         onChangeText={(text) => handleChange('name', text)}
//         value={form.name}
//       />

//       <TextInput
//         style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]}
//         placeholder="Email"
//         placeholderTextColor={themeColors.subtleText}
//         onChangeText={(text) => handleChange('email', text)}
//         value={form.email}
//         keyboardType="email-address"
//       />

//       <TextInput
//         style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]}
//         placeholder="Mot de passe"
//         placeholderTextColor={themeColors.subtleText}
//         onChangeText={(text) => handleChange('password', text)}
//         value={form.password}
//         secureTextEntry
//       />

//       <TextInput
//         style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]}
//         placeholder="Adresse (facultatif)"
//         placeholderTextColor={themeColors.subtleText}
//         onChangeText={(text) => handleChange('address', text)}
//         value={form.address}
//       />

//       <TextInput
//         style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]}
//         placeholder="Téléphone (facultatif)"
//         placeholderTextColor={themeColors.subtleText}
//         onChangeText={(text) => handleChange('phone', text)}
//         value={form.phone}
//         keyboardType="phone-pad"
//       />

//       {feedback.message.length > 0 && (
//         <Text
//           style={{
//             color: feedback.type === 'success' ? themeColors.successText : themeColors.errorText,
//             marginBottom: 10,
//             textAlign: 'center',
//             fontWeight: '500',
//           }}
//         >
//           {feedback.message}
//         </Text>
//       )}

//       <TouchableOpacity
//         style={[styles.button, { backgroundColor: themeColors.primary }]}
//         onPress={handleRegister}
//       >
//         <Text style={[styles.buttonText, { color: '#fff' }]}>S'inscrire</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     marginBottom: 12,
//     fontSize: 16,
//   },
//   button: {
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   buttonText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default RegisterScreen;
