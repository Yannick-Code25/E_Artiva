// ARTIVA/front_end/app/settings/edit-profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth, User } from "../../context/AuthContext"; // Assure-toi que User est exporté et contient address/phone
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **METS TON IP**

interface ProfileFormData {
  name: string;
  address: string;
  phone: string;
}

export default function EditProfileScreen() {
  const { user, userToken, fetchUnreadNotificationCount, updateUserInContext } =
    useAuth(); // fetchUnread... pour mettre à jour le contexte user si besoin
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const textColor = Colors[colorScheme ?? "light"].text;
  const cardColor = Colors[colorScheme ?? "light"].card;
  const subtleTextColor = Colors[colorScheme ?? "light"].tabIconDefault;
  const backgroundColor = Colors[colorScheme ?? "light"].background;

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    address: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pré-remplir le formulaire avec les données utilisateur actuelles
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        address: (user as any).address || "", // Caster si 'address' n'est pas dans le type User de base
        phone: (user as any).phone || "", // Caster si 'phone' n'est pas dans le type User de base
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // Réinitialiser les messages lors de la saisie
    setSuccess(null);
  };

  const handleUpdateProfile = async () => {
    if (!userToken) {
      Alert.alert("Erreur", "Vous n'êtes pas connecté.");
      return;
    }
    if (!formData.name.trim()) {
      setError("Le nom ne peut pas être vide.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const payload: Partial<ProfileFormData> = {};
    // Envoyer seulement les champs qui ont été modifiés ou qui ont une valeur
    if (formData.name.trim() !== (user?.name || ""))
      payload.name = formData.name.trim();
    // Pour address et phone, envoyer même si vide pour permettre de les effacer,
    // ou ajouter une logique pour ne les envoyer que s'ils sont différents et non vides.
    // Ici, on les envoie s'ils sont différents de l'état initial de l'utilisateur.
    if (formData.address.trim() !== ((user as any)?.address || ""))
      payload.address = formData.address.trim();
    if (formData.phone.trim() !== ((user as any)?.phone || ""))
      payload.phone = formData.phone.trim();

    if (Object.keys(payload).length === 0) {
      setSuccess("Aucune modification détectée.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        // API pour mettre à jour son propre profil
        method: "PUT",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la mise à jour du profil"
        );
      }

      setSuccess("Profil mis à jour avec succès !");
      // Idéalement, mettre à jour l'objet 'user' dans AuthContext ici
      // Pour cela, AuthContext devrait exposer une fonction updateUser(newUserData)
      // Pour l'instant, on pourrait rafraîchir les infos en appelant une fonction du contexte
      // ou simplement informer l'utilisateur.
      // Exemple: authContext.refreshUserData(); (fonction à créer dans AuthContext)
      if (data.user) {
        updateUserInContext(data.user); // <<<< APPELLE CETTE FONCTION
      }
      Alert.alert("Succès", "Votre profil a été mis à jour.");
      // fetchUnreadNotificationCount(); // Si on veut rafraîchir le user complet du contexte
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      console.error("Erreur UpdateProfile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor }]}
      contentContainerStyle={styles.contentScroll}
    >
      {/* Le titre est géré par app/settings/_layout.tsx */}
      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: textColor }]}>Nom complet :</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              borderColor: subtleTextColor,
              backgroundColor: cardColor,
            },
          ]}
          value={formData.name}
          onChangeText={(val) => handleInputChange("name", val)}
          placeholder="Votre nom et prénom"
          placeholderTextColor={subtleTextColor}
        />

        <Text style={[styles.label, { color: textColor }]}>Adresse :</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              color: textColor,
              borderColor: subtleTextColor,
              backgroundColor: cardColor,
            },
          ]}
          value={formData.address}
          onChangeText={(val) => handleInputChange("address", val)}
          placeholder="Votre adresse de livraison principale"
          placeholderTextColor={subtleTextColor}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: textColor }]}>
          Numéro de téléphone :
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              borderColor: subtleTextColor,
              backgroundColor: cardColor,
            },
          ]}
          value={formData.phone}
          onChangeText={(val) => handleInputChange("phone", val)}
          placeholder="Votre numéro de téléphone"
          placeholderTextColor={subtleTextColor}
          keyboardType="phone-pad"
        />

        {success && <Text style={styles.successText}>{success}</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: tintColor },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleUpdateProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  contentScroll: { padding: 20, flexGrow: 1 }, // flexGrow pour que le contenu s'étende si petit
  formContainer: {
    // Styles pour le conteneur du formulaire
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    // color: // géré par textColor
  },
  input: {
    height: 50,
    borderWidth: 1,
    // borderColor: // géré par subtleTextColor
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    // backgroundColor: // géré par cardColor
  },
  textArea: {
    height: 100, // Hauteur pour multiline
    textAlignVertical: "top", // Pour Android
    paddingTop: 15, // Padding pour multiline
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  errorText: {
    color: "red",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  successText: {
    color: "green",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" }, // Au cas où
});
