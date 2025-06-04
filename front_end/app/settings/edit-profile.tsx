// ARTIVA/front_end/app/settings/edit-profile.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function EditProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Le titre est géré par le _layout.tsx de settings */}
      {/* <Stack.Screen options={{ title: 'Modifier le Profil' }} /> */}
      <Text style={styles.text}>Page de Modification du Profil</Text>
      <Text style={styles.text}>Formulaire pour nom, adresse, téléphone ici...</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 16, textAlign: 'center', marginVertical: 5 }
});