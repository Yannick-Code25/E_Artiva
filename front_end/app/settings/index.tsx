import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter, Href, Stack } from "expo-router";
import {
  ChevronRight,
  UserCog,
  Lock,
  Palette,
  Languages,
  UserX,
} from "lucide-react-native"; // Icônes
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next"; // Pour traduire les textes des liens

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **METS TON IP**

interface SettingsItemProps {
  icon: React.ElementType;
  title: string;
  onPress: () => void;
  color: string;
  textColor: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon: Icon,
  title,
  onPress,
  color,
  textColor,
}) => (
  <Pressable
    style={[
      styles.itemContainer,
      { borderBottomColor: Colors[useColorScheme() ?? "light"].tabIconDefault },
    ]}
    onPress={onPress}
  >
    <View style={styles.iconContainer}>
      <Icon size={22} color={color} strokeWidth={1.75} />
    </View>
    <Text style={[styles.itemText, { color: textColor }]}>{title}</Text>
    <ChevronRight
      size={20}
      color={Colors[useColorScheme() ?? "light"].tabIconDefault}
    />
  </Pressable>
);

export default function SettingsMainScreen() {
  const router = useRouter();
  const { userToken, signOut } = useAuth(); // signOut pour la désactivation
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const textColor = Colors[colorScheme ?? "light"].text;
  const cardBackgroundColor = Colors[colorScheme ?? "light"].card;
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const subtleTextColor = Colors[colorScheme ?? "light"].tabIconDefault;

  const [isLoadingDeactivate, setIsLoadingDeactivate] = useState(false);

  const handleDeactivateAccount = async () => {
    Alert.alert(
      t(
        "settingsScreen.deactivateAccountConfirmationTitle",
        "Supprimer le compte"
      ),
      t(
        "settingsScreen.deactivateAccountConfirmationMessage",
        "Êtes-vous sûr ? Cette action est irréversible et vous serez déconnecté."
      ),
      [
        { text: t("common.cancel", "Annuler"), style: "cancel" },
        {
          text: t("common.deactivate", "Désactiver"),
          style: "destructive",
          onPress: async () => {
            if (!userToken) return;
            try {
              setIsLoadingDeactivate(true);
              const response = await fetch(
                `${API_BASE_URL}/users/me/deactivate`,
                {
                  // Assure-toi qu'API_BASE_URL est défini ici ou importé
                  method: "PUT",
                  headers: { Authorization: `Bearer ${userToken}` },
                }
              );
              const data = await response.json();
              if (!response.ok)
                throw new Error(data.message || "Erreur désactivation");
              Alert.alert(
                t("settingsScreen.accountDeactivatedTitle", "Compte désactivé"),
                data.message
              );
              await signOut();
              router.replace("/register");
            } catch (e: any) {
              console.error("Erreur désactivation compte:", e);
              Alert.alert(
                t("common.error", "Erreur"),
                e.message ||
                  t(
                    "settingsScreen.deactivateAccountError",
                    "Impossible de désactiver le compte."
                  )
              );
            } finally {
              setIsLoadingDeactivate(false);
            }
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      id: "edit-profile",
      icon: UserCog,
      title: "Modifier le Profil",
      onPress: () => router.push("/settings/edit-profile" as Href),
    },
    {
      id: "change-password",
      icon: Lock,
      title: "Changer le Mot de Passe",
      onPress: () => router.push("/settings/change-password" as Href),
    },
    {
      id: "preferences",
      icon: Palette,
      title: "Préférences d'Affichage",
      onPress: () => router.push("/settings/preferences" as Href),
    },
    {
      id: "language",
      icon: Languages,
      title: "Langue",
      onPress: () => router.push("/settings/language" as Href),
    },
    {
      id: "deactivate",
      icon: UserX,
      title: "Supprimer mon compte",
      onPress: handleDeactivateAccount,
      isDestructive: true,
    },
  ];

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
        {settingsOptions.map((opt) => (
          <SettingsItem
            key={opt.id}
            icon={opt.icon}
            title={opt.title}
            onPress={opt.onPress}
            color={opt.isDestructive ? Colors.light.errorBackground : tintColor} // Couleur différente pour désactiver
            textColor={opt.isDestructive ? Colors.light.errorBackground : textColor}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  section: {
    marginTop: 20,
    marginHorizontal: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 30, // Espace pour l'icône
    alignItems: "center",
    marginRight: 15,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  // Tu peux ajouter d'autres styles au besoin
  centered: { flex: 1, justifyContent: "center", alignItems: "center" }, // Utile pour les sous-pages
  input: {
    /* ... */
  }, // Styles pour les inputs dans les sous-pages
  button: {
    /* ... */
  },
});
