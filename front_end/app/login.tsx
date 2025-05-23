// ARTIVA/front_end/app/login.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Link, useRouter } from 'expo-router'; // useRouter n'est plus explicitement utilisé ici pour la redirection post-login
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Vérifie le chemin d'importation

// **ATTENTION : REMPLACE PAR TON IP LOCALE OU 10.0.2.2 POUR ÉMULATEUR ANDROID**
const API_BASE_URL = 'http://192.168.11.131:3001/api'; 
// Exemple : const API_BASE_URL = 'http://192.168.1.105:3001/api';

export default function LoginScreen() {
  const { signIn, isLoading: isAuthLoading } = useAuth(); // isLoading de AuthContext
  const router = useRouter();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // État de chargement pour la soumission du formulaire
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez entrer votre e-mail et votre mot de passe.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur de serveur: ${response.status}`);
      }

      // 'data' devrait contenir { token, user (avec id, name, email, role) }
      console.log('LoginScreen: Connexion réussie, données reçues:', data);
      
      // Appel de signIn du contexte. Ceci mettra à jour l'état global
      // et déclenchera la redirection via l'useEffect dans AuthContext.
      await signIn(data.token, data.user);

      // Plus besoin de redirection manuelle ici (router.replace)

    } catch (error: any) {
      console.error("LoginScreen: Erreur lors de la tentative de connexion:", error);
      Alert.alert('Erreur de connexion', error.message || 'Impossible de se connecter. Vérifiez vos identifiants ou votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si AuthContext est toujours en train de déterminer l'état initial, afficher un loader
  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Artiva</Text>
        <Text style={styles.subtitle}>Connexion</Text>

        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email" // Pour le remplissage automatique
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password" // Pour le remplissage automatique
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.eyeIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, (isSubmitting || isAuthLoading) && styles.buttonDisabled]} // Le bouton est aussi désactivé si AuthContext charge
          onPress={handleLogin}
          disabled={isSubmitting || isAuthLoading}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <View style={styles.linksContainer}>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Créer un compte</Text>
            </TouchableOpacity>
          </Link>
          {/* 
          <Link href="/forgot-password" asChild style={{marginTop: 10}}>
             <TouchableOpacity>
                <Text style={styles.linkText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
          </Link>
          */}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Tes styles (assure-toi qu'ils sont bien définis comme précédemment)
const styles = StyleSheet.create({
    keyboardAvoidingContainer: { flex: 1, },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#FFFFFF', },
    title: { fontSize: 48, fontWeight: 'bold', color: 'tomato', marginBottom: 8, },
    subtitle: { fontSize: 24, color: '#333', marginBottom: 40, },
    input: { width: '100%', backgroundColor: '#F0F0F0', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 10, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E0E0E0', },
    passwordContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 25, },
    passwordInput: { flex: 1, paddingHorizontal: 20, paddingVertical: 15, fontSize: 16, },
    eyeIconContainer: { paddingHorizontal: 15, },
    button: { width: '100%', backgroundColor: 'tomato', paddingVertical: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minHeight: 50, },
    buttonDisabled: { backgroundColor: '#FFC0CB', },
    buttonText: { color: 'white', fontSize: 18, fontWeight: '600', },
    linksContainer: { marginTop: 20, alignItems: 'center', },
    linkText: { fontSize: 16, color: 'tomato', fontWeight: '500', paddingVertical: 5, },
});