// front_end/app/forgot-password.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router'; // Stack pour l'en-tête

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = () => {
    if (!email.trim()) {
      Alert.alert('E-mail requis', 'Veuillez entrer votre adresse e-mail.');
      return;
    }
    setIsLoading(true);
    // TODO: Appel API pour envoyer le lien de réinitialisation
    console.log('Demande de réinitialisation pour:', email);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Vérifiez vos e-mails', 
        'Si un compte est associé à cet e-mail, un lien de réinitialisation a été envoyé.',
        [{ text: "OK", onPress: () => router.back() }] // Bouton OK qui ramène en arrière
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Optionnel: Ajoute un titre à l'en-tête de cet écran */}
      <Stack.Screen options={{ title: 'Mot de passe oublié' }} /> 

      <Text style={styles.title}>Réinitialiser le mot de passe</Text>
      <Text style={styles.instructions}>
        Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSendResetLink}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Envoyer le lien</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Styles similaires aux autres écrans d'auth
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10, // Pour que le texte ne soit pas trop large
  },
  input: {
    width: '100%',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    width: '100%',
    backgroundColor: 'tomato',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: '#FFC0CB',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});