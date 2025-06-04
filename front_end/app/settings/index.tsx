import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, Href, Stack } from 'expo-router';
import { ChevronRight, UserCog, Lock, Palette, Languages, UserX } from 'lucide-react-native'; // Icônes
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://192.168.248.151:3001/api'; // **METS TON IP**


interface SettingsItemProps {
  icon: React.ElementType;
  title: string;
  onPress: () => void;
  color: string;
  textColor: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon: Icon, title, onPress, color, textColor }) => (
  <Pressable style={[styles.itemContainer, {borderBottomColor: Colors[useColorScheme() ?? 'light'].tabIconDefault}]} onPress={onPress}>
    <View style={styles.iconContainer}>
      <Icon size={22} color={color} strokeWidth={1.75} />
    </View>
    <Text style={[styles.itemText, {color: textColor}]}>{title}</Text>
    <ChevronRight size={20} color={Colors[useColorScheme() ?? 'light'].tabIconDefault} />
  </Pressable>
);


export default function SettingsMainScreen() {
  const router = useRouter();
  const { userToken, signOut } = useAuth(); // signOut pour la désactivation
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const cardBackgroundColor = Colors[colorScheme ?? 'light'].card;

  const handleDeactivateAccount = async () => {
     Alert.alert(
         "Désactiver le compte",
         "Êtes-vous sûr de vouloir désactiver votre compte ? Vous ne pourrez plus vous connecter avec ces identifiants. Cette action est réversible par un administrateur.",
         [
             { text: "Annuler", style: "cancel" },
             { 
                 text: "Désactiver", 
                 style: 'destructive',
                 onPress: async () => {
                     if (!userToken) return;
                     try {
                         // TODO: Appeler l'API PUT /api/users/me/deactivate
                         // Pour l'instant, on simule et on déconnecte
                         console.log("API pour désactiver le compte à appeler");
                         // const response = await fetch(`${API_BASE_URL}/users/me/deactivate`, {
                         //    method: 'PUT',
                         //    headers: { 'Authorization': `Bearer ${userToken}` },
                         // });
                         // if (!response.ok) throw new Error("Erreur désactivation compte");
                         
                         Alert.alert("Compte désactivé", "Votre compte a été désactivé. Vous allez être déconnecté.");
                         await signOut(); // Déconnecte l'utilisateur
                         // La redirection vers login est gérée par AuthContext/app/index.tsx
                     } catch (err: any) {
                         Alert.alert("Erreur", err.message || "Impossible de désactiver le compte.");
                     }
                 } 
             }
         ]
     );
  };

  const settingsOptions = [
    { id: 'editProfile', icon: UserCog, title: 'Modifier le Profil', onPress: () => router.push('/settings/edit-profile' as Href) },
    { id: 'changePassword', icon: Lock, title: 'Changer le Mot de Passe', onPress: () => router.push('/settings/change-password' as Href) },
    { id: 'preferences', icon: Palette, title: "Préférences d'Affichage", onPress: () => router.push('/settings/preferences' as Href) },
    { id: 'language', icon: Languages, title: 'Langue', onPress: () => Alert.alert("Langue", "Choix de langue à implémenter") },
    { id: 'deactivate', icon: UserX, title: 'Désactiver mon compte', onPress: handleDeactivateAccount, isDestructive: true },
  ];

  return (
    <ScrollView style={[styles.screen, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
      
      <View style={[styles.section, {backgroundColor: cardBackgroundColor}]}>
        {settingsOptions.map((opt) => (
          <SettingsItem
            key={opt.id}
            icon={opt.icon}
            title={opt.title}
            onPress={opt.onPress}
            color={opt.isDestructive ? Colors.light.error : tintColor} // Couleur différente pour désactiver
            textColor={opt.isDestructive ? Colors.light.error : textColor}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, },
  section: { marginTop: 20, marginHorizontal: 10, borderRadius: 8, overflow: 'hidden', },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 30, // Espace pour l'icône
    alignItems: 'center',
    marginRight: 15,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  // Tu peux ajouter d'autres styles au besoin
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, // Utile pour les sous-pages
  input: { /* ... */ }, // Styles pour les inputs dans les sous-pages
  button: { /* ... */ },
});