// ARTIVA/front_end/app/verify-code.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import Colors from "../constants/Colors";

const API_BASE_URL = "https://back-end-purple-log-1280.fly.dev/api";


export default function VerifyCode() {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = typeof params.email === "string" ? params.email : "";

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyCodeAPI = async (email: string, code: string) => {
const res = await fetch(`${API_BASE_URL}/auth/verify-code`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, code }),
});

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Code invalide");
    return data;
  };

const handleVerify = async () => {
  if (!/^\d{6}$/.test(code)) {
    Alert.alert("Erreur", "Veuillez saisir un code à 6 chiffres valide");
    return;
  }

  setLoading(true);
  try {
    const data = await verifyCodeAPI(email, code);
    await signIn(data.token, data.user);
    console.log("Token JWT :", data.token); // <-- ici tu vois le token
    console.log("User info :", data.user);
    router.replace("/"); // Authentification complète → accueil
  } catch (error: any) {
    Alert.alert("Erreur", error.message);
  } finally {
    setLoading(false);
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
            <Text style={[styles.subtitle, { color: colors.subtleText }]}>
              Entrez le code envoyé à
            </Text>
            <Text style={[styles.email, { color: colors.text }]}>{email}</Text>

            <TextInput
              style={[styles.input, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text,
              }]}
              placeholder="Code à 6 chiffres"
              placeholderTextColor={colors.subtleText}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Valider le code</Text>
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
  subtitle: { fontSize: 20, textAlign: "center" },
  email: { fontSize: 16, textAlign: "center", marginBottom: 30 },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
