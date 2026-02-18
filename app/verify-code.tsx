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
  ImageBackground,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "../context/AuthContext";
import Colors from "../constants/Colors";

const API_BASE_URL = "https://back-end-purple-log-1280.fly.dev/api";
const BACKGROUND_IMAGE = "https://i.pinimg.com/736x/28/fa/f9/28faf9cb67b4edabe61120122df74a60.jpg";
const { height } = Dimensions.get("window");

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
      router.replace("/"); // Authentification complète → accueil
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Changer le titre de la barre de navigation */}
      <Stack.Screen options={{ title: "Vérifiez votre code" }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ImageBackground
          source={{ uri: BACKGROUND_IMAGE }}
          style={styles.background}
          resizeMode="cover"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.topSpacer} />

              <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: colors.primary }]}>Artiva</Text>
                <Text style={[styles.subtitle, { color: colors.subtleText }]}>Entrez le code envoyé à</Text>
                <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
              </View>

              <View style={styles.formContainer}>
                <Text style={[styles.label, { color: "#fff" }]}>Code à 6 chiffres</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: "rgba(255,255,255,0.6)",
                      backgroundColor: "rgba(255,255,255,0.15)",
                      color: "#fff",
                    },
                  ]}
                  placeholder="123456"
                  placeholderTextColor="rgba(255,255,255,0.7)"
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
        </ImageBackground>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  topSpacer: { height: height * 0.3 },
  headerContainer: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 50, fontWeight: "bold" },
  subtitle: { fontSize: 22, marginTop: 8 },
  email: { fontSize: 16, marginTop: 4, marginBottom: 30 },
  formContainer: { paddingHorizontal: 30, paddingVertical: 20 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 6 },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
