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
  ImageBackground,
  useColorScheme,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Colors from "../constants/Colors";

const API_BASE_URL = "https://back-end-purple-log-1280.fly.dev/api";

const BACKGROUND_IMAGE = "https://i.pinimg.com/736x/28/fa/f9/28faf9cb67b4edabe61120122df74a60.jpg";
const { height } = Dimensions.get("window");

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Email ou mot de passe incorrect");

      router.push({ pathname: "/verify-code", params: { email } });
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              <Text style={[styles.subtitle, { color: colors.subtleText }]}>Connexion</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Email */}
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, {
                  borderColor: "rgba(255,255,255,0.6)",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "#fff"
                }]}
                placeholder="Adresse e-mail"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Mot de passe */}
              <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
              <TextInput
                style={[styles.input, {
                  borderColor: "rgba(255,255,255,0.6)",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "#fff"
                }]}
                placeholder="Mot de passe"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Mot de passe oublié */}
              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                style={{ alignSelf: "flex-end", marginBottom: 20 }}
              >
                <Text style={{ color: colors.primary, fontWeight: "500" }}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              {/* Bouton connexion */}
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
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  topSpacer: { height: height * 0.3 },
  headerContainer: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 50, fontWeight: "bold" },
  subtitle: { fontSize: 22, marginTop: 8 },
  formContainer: { paddingHorizontal: 30, paddingVertical: 20 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 6 },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 15,
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
