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
  ScrollView,
  Alert,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import Colors from "../constants/Colors";

const API_BASE_URL = "https://e-artiva-htaw.onrender.com/api";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Erreur", "Veuillez remplir tous les champs");
    return;
  }

  setIsSubmitting(true);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json(); // data doit contenir message ou info code envoyé

    if (!res.ok) throw new Error(data.message || "Email ou mot de passe incorrect");

    // Redirection vers la page de vérification du code
    router.push({
      pathname: "/verify-code",
      params: { email },
    });

  } catch (err: any) {
    Alert.alert("Erreur", err.message);
  } finally {
    setIsSubmitting(false);
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
            <Text style={[styles.subtitle, { color: colors.subtleText }]}>Connexion</Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Adresse e-mail"
              placeholderTextColor={colors.subtleText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Mot de passe"
              placeholderTextColor={colors.subtleText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* LIEN "Mot de passe oublié ?" */}
            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              style={{ alignSelf: 'flex-end', marginBottom: 20 }}
            >
              <Text style={{ color: colors.primary, fontWeight: '500' }}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 20 },
  container: { width: "100%" },
  title: { fontSize: 48, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 24, textAlign: "center", marginBottom: 40 },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
