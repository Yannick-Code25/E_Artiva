// // ARTIVA/front_end/app/change-password.tsx
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   Platform,
//   KeyboardAvoidingView,
// } from "react-native";
// import { Stack, useRouter } from "expo-router";
// import { FontAwesome } from "@expo/vector-icons";
// import Colors from "../../constants/Colors";
// import { useColorScheme } from "../../components/useColorScheme";
// import { useAuth } from "../../context/AuthContext"; // Pour le token

// const API_BASE_URL = "http://192.168.1.2:3001/api"; // **METS TON IP**

// export default function ChangePasswordScreen() {
//   const router = useRouter();
//   const { userToken, signOut } = useAuth(); // signOut pour déconnecter après changement de mdp
//   const colorScheme = useColorScheme();
//   const tintColor = Colors[colorScheme ?? "light"].tint;
//   const textColor = Colors[colorScheme ?? "light"].text;
//   const backgroundColor = Colors[colorScheme ?? "light"].background;
//   const cardColor = Colors[colorScheme ?? "light"].card;
//   const subtleTextColor = Colors[colorScheme ?? "light"].tabIconDefault; // <<< DÉFINITION AJOUTÉE ICI

//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmNewPassword, setConfirmNewPassword] = useState("");

//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   const handleChangePassword = async () => {
//     if (!currentPassword || !newPassword || !confirmNewPassword) {
//       Alert.alert("Champs requis", "Veuillez remplir tous les champs.");
//       return;
//     }
//     if (newPassword !== confirmNewPassword) {
//       Alert.alert(
//         "Erreur",
//         "Le nouveau mot de passe et sa confirmation ne correspondent pas."
//       );
//       return;
//     }
//     if (newPassword.length < 6) {
//       Alert.alert(
//         "Erreur",
//         "Le nouveau mot de passe doit contenir au moins 6 caractères."
//       );
//       return;
//     }

//     setIsLoading(true);
//     setError(null);
//     setSuccessMessage(null);

//     try {
//       const response = await fetch(`${API_BASE_URL}/users/change-password`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${userToken}`, // L'utilisateur doit être connecté
//         },
//         body: JSON.stringify({
//           currentPassword,
//           newPassword,
//           confirmNewPassword,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || `Erreur ${response.status}`);
//       }

//       setSuccessMessage(
//         data.message + " Vous serez déconnecté pour des raisons de sécurité."
//       );
//       Alert.alert(
//         "Succès",
//         data.message +
//           "\nVous allez être déconnecté. Veuillez vous reconnecter avec votre nouveau mot de passe.",
//         [
//           {
//             text: "OK",
//             onPress: async () => {
//               await signOut(); // Déconnecte l'utilisateur
//               router.replace("/login"); // Redirige vers la page de connexion
//             },
//           },
//         ]
//       );
//       // Réinitialiser les champs après succès
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmNewPassword("");
//     } catch (err: any) {
//       console.error("ChangePasswordScreen: Erreur:", err);
//       setError(
//         err.message ||
//           "Une erreur est survenue lors du changement de mot de passe."
//       );
//       Alert.alert("Erreur", err.message || "Une erreur est survenue.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={{ flex: 1, backgroundColor }}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <Stack.Screen options={{ title: "Changer le mot de passe" }} />
//         <View style={[styles.container, { backgroundColor }]}>
//           <Text style={[styles.title, { color: textColor }]}>
//             Changer votre mot de passe
//           </Text>

//           {error && <Text style={styles.errorMessage}>{error}</Text>}
//           {successMessage && !error && (
//             <Text style={styles.successMessage}>{successMessage}</Text>
//           )}

//           <View
//             style={[
//               styles.inputContainer,
//               {
//                 backgroundColor: cardColor,
//                 borderColor: Colors[colorScheme ?? "light"].tabIconDefault,
//               },
//             ]}
//           >
//             <TextInput
//               style={[styles.input, { color: textColor }]}
//               placeholder="Mot de passe actuel"
//               placeholderTextColor={subtleTextColor}
//               value={currentPassword}
//               onChangeText={setCurrentPassword}
//               secureTextEntry={!showCurrentPassword}
//               textContentType="password"
//             />
//             <TouchableOpacity
//               onPress={() => setShowCurrentPassword(!showCurrentPassword)}
//               style={styles.eyeIcon}
//             >
//               <FontAwesome
//                 name={showCurrentPassword ? "eye-slash" : "eye"}
//                 size={20}
//                 color={subtleTextColor}
//               />
//             </TouchableOpacity>
//           </View>

//           <View
//             style={[
//               styles.inputContainer,
//               {
//                 backgroundColor: cardColor,
//                 borderColor: Colors[colorScheme ?? "light"].tabIconDefault,
//               },
//             ]}
//           >
//             <TextInput
//               style={[styles.input, { color: textColor }]}
//               placeholder="Nouveau mot de passe"
//               placeholderTextColor={subtleTextColor}
//               value={newPassword}
//               onChangeText={setNewPassword}
//               secureTextEntry={!showNewPassword}
//               textContentType="newPassword"
//             />
//             <TouchableOpacity
//               onPress={() => setShowNewPassword(!showNewPassword)}
//               style={styles.eyeIcon}
//             >
//               <FontAwesome
//                 name={showNewPassword ? "eye-slash" : "eye"}
//                 size={20}
//                 color={subtleTextColor}
//               />
//             </TouchableOpacity>
//           </View>

//           <View
//             style={[
//               styles.inputContainer,
//               {
//                 backgroundColor: cardColor,
//                 borderColor: Colors[colorScheme ?? "light"].tabIconDefault,
//               },
//             ]}
//           >
//             <TextInput
//               style={[styles.input, { color: textColor }]}
//               placeholder="Confirmer le nouveau mot de passe"
//               placeholderTextColor={subtleTextColor}
//               value={confirmNewPassword}
//               onChangeText={setConfirmNewPassword}
//               secureTextEntry={!showConfirmNewPassword}
//               textContentType="newPassword"
//             />
//             <TouchableOpacity
//               onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
//               style={styles.eyeIcon}
//             >
//               <FontAwesome
//                 name={showConfirmNewPassword ? "eye-slash" : "eye"}
//                 size={20}
//                 color={subtleTextColor}
//               />
//             </TouchableOpacity>
//           </View>

//           <TouchableOpacity
//             style={[
//               styles.button,
//               { backgroundColor: tintColor },
//               isLoading && styles.buttonDisabled,
//             ]}
//             onPress={handleChangePassword}
//             disabled={isLoading}
//           >
//             {isLoading ? (
//               <ActivityIndicator size="small" color="#ffffff" />
//             ) : (
//               <Text style={styles.buttonText}>
//                 Mettre à jour le mot de passe
//               </Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: "center",
//   },
//   container: {
//     flex: 1, // Important pour KeyboardAvoidingView + ScrollView
//     justifyContent: "center",
//     paddingHorizontal: 24,
//     paddingVertical: 20,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 30,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 8,
//     borderWidth: 1,
//     marginBottom: 20,
//     paddingHorizontal: 10, // Padding intérieur pour l'input et l'icône
//   },
//   input: {
//     flex: 1, // Pour que l'input prenne l'espace
//     paddingVertical: Platform.OS === "ios" ? 15 : 12, // Ajustement pour iOS
//     fontSize: 16,
//   },
//   eyeIcon: {
//     padding: 10, // Zone de clic pour l'icône
//   },
//   button: {
//     paddingVertical: 15,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 10,
//     minHeight: 50,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   errorMessage: {
//     color: "red",
//     textAlign: "center",
//     marginBottom: 15,
//     fontSize: 15,
//   },
//   successMessage: {
//     color: "green",
//     textAlign: "center",
//     marginBottom: 15,
//     fontSize: 15,
//   },
// });


// ARTIVA/front_end/app/change-password.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext"; // Pour le token

const API_BASE_URL = "http://192.168.1.2:3001/api"; // **METS TON IP**

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { userToken, signOut, effectiveAppColorScheme } = useAuth(); // signOut pour déconnecter après changement de mdp
  // const colorScheme = useColorScheme(); // Retire car on a effectiveAppColorScheme
  // const tintColor = Colors[colorScheme ?? "light"].tint;
  // const textColor = Colors[colorScheme ?? "light"].text;
  // const backgroundColor = Colors[colorScheme ?? "light"].background;
  // const cardColor = Colors[colorScheme ?? "light"].card;
  // const subtleTextColor = Colors[colorScheme ?? "light"].tabIconDefault; // <<< DÉFINITION AJOUTÉE ICI

  // CHANGEMENT: Utilisation directe de l'objet de couleurs basé sur le thème
  const currentScheme = effectiveAppColorScheme ?? "light";
  const colors = Colors[currentScheme];
  const tintColor = colors.tint;
  const textColor = colors.text;
  const backgroundColor = colors.background;
  const cardColor = colors.card;
  const subtleTextColor = colors.subtleText;
  const errorTextColor = colors.errorText; // Ajout pour les messages d'erreur

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null); // Message de succès en UI
  const [error, setError] = useState<string | null>(null); // Message d'erreur en UI

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      //Alert.alert("Champs requis", "Veuillez remplir tous les champs.");
        setError("Veuillez remplir tous les champs.");
        setTimeout(() => setError(null), 3000);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      //Alert.alert( "Erreur", "Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      setError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (newPassword.length < 6) {
      //Alert.alert( "Erreur", "Le nouveau mot de passe doit contenir au moins 6 caractères.");
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null); // Effacer les anciens messages
    setMessage(null);
    try {
      console.log("Frontend: Tentative de changement de mot de passe...");
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`, // L'utilisateur doit être connecté
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Frontend: Erreur API changement mot de passe:",
          response.status,
          data
        );
          setError(data.message || "Erreur lors du changement de mot de passe.");
        setTimeout(() => setError(null), 3000);
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      console.log("Frontend: Réponse API changement mot de passe:", data);
      // Alert.alert(successTitle,data.message + "\nVous allez être déconnecté. Veuillez vous reconnecter avec votre nouveau mot de passe.",[ {  text: "OK", onPress: async () => {   await signOut(); // Déconnecte l'utilisateur du frontend (efface token local, etc.)  router.replace("/login"); // Redirige vers la page de connexion  }, }, ]);
       setMessage(data.message + ". Vous allez être déconnecté pour des raisons de sécurité.");
      setTimeout(async () => {
        await signOut(); // Déconnecte l'utilisateur
        router.replace("/login");
      }, 3000);


      // Réinitialiser les champs après succès
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      console.error("ChangePasswordScreen: Erreur:", e);
      //Alert.alert("Erreur", e.message || genericErrorMessage);
      setError(e.message || "Une erreur est survenue lors du changement de mot de passe.");
        setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.screenContainer, { flex: 1, backgroundColor }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Stack.Screen options={{ title: "Changer le mot de passe" }} />
          {/* Affichage des messages de succès ou d'erreur */}
          {error && <Text style={[styles.message, {backgroundColor: Colors[currentScheme].errorBackground, color: Colors[currentScheme].errorText}]}>{error}</Text>}
          {message && <Text style={[styles.message, {backgroundColor: Colors[currentScheme].successBackground, color: Colors[currentScheme].successText}]}>{message}</Text>}

        <View style={[styles.container, { backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            Changer votre mot de passe
          </Text>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: cardColor,
                borderColor: subtleTextColor,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Mot de passe actuel"
              placeholderTextColor={subtleTextColor}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              textContentType="password"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              <FontAwesome
                name={showCurrentPassword ? "eye-slash" : "eye"}
                size={20}
                color={subtleTextColor}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: cardColor,
                borderColor: subtleTextColor,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={subtleTextColor}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              textContentType="newPassword"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              <FontAwesome
                name={showNewPassword ? "eye-slash" : "eye"}
                size={20}
                color={subtleTextColor}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: cardColor,
                borderColor: subtleTextColor,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Confirmer le nouveau mot de passe"
              placeholderTextColor={subtleTextColor}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry={!showConfirmNewPassword}
              textContentType="newPassword"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              style={styles.eyeIcon}
            >
              <FontAwesome
                name={showConfirmNewPassword ? "eye-slash" : "eye"}
                size={20}
                color={subtleTextColor}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: tintColor },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                Mettre à jour le mot de passe
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 }, // Ajouté pour le conteneur principal
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1, // Important pour KeyboardAvoidingView + ScrollView
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10, // Padding intérieur pour l'input et l'icône
  },
  input: {
    flex: 1, // Pour que l'input prenne l'espace
    paddingVertical: Platform.OS === "ios" ? 15 : 12, // Ajustement pour iOS
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10, // Zone de clic pour l'icône
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  errorMessage: {
    color: "red",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 15,
  },
     message: {
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 15,
    fontSize: 15,
  },
  successMessage: {
    color: "green",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 15,
  },
});