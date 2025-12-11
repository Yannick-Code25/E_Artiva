import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request'); // étape actuelle
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert('E-mail requis', 'Veuillez entrer votre adresse e-mail.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.11.116:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Erreur lors de l’envoi du code.');

      Alert.alert(
        'Code envoyé',
        'Si un compte existe avec cet email, vous recevrez un code pour réinitialiser votre mot de passe.'
      );

      setStep('reset'); // passer à la saisie du code et mot de passe
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le code et le nouveau mot de passe.');
      return;
    }
    setIsLoading(true);

    try {
const response = await fetch('http://192.168.11.116:3001/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code, newPassword }),
});

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Erreur lors de la réinitialisation.');

      Alert.alert('Succès', 'Mot de passe réinitialisé !', [
        { text: 'OK', onPress: () => router.push('/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mot de passe oublié' }} />
      <Text style={styles.title}>Réinitialiser le mot de passe</Text>

      {step === 'request' ? (
        <>
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
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer le code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Code reçu par email"
            value={code}
            onChangeText={setCode}
          />
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Réinitialiser</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 30 },
  input: { width: '100%', backgroundColor: '#F0F0F0', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
  button: { width: '100%', backgroundColor: 'tomato', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#FFC0CB' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
