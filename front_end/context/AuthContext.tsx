// ARTIVA/front_end/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";
import type { ColorSchemeName } from "react-native"; // Importer le type
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Constantes ---
const TOKEN_KEY = "artiva-auth-token";
const USER_INFO_KEY = "artiva-user-info";
const THEME_PREFERENCE_KEY = "artiva-theme-preference";
const API_BASE_URL = "http://192.168.1.2:3001/api"; // **METS TON IP ICI**

// --- Types ---
export interface User {
  id: number | string;
  name: string;
  email: string;
  role: "customer" | "admin" | string; // Sois plus précis si tu as une liste fixe de rôles
  address?: string;
  phone?: string;
  profileImageFromAuthContext?: string; // Ajouté pour la cohérence avec ton interface
  // Ajoute d'autres champs que tu veux disponibles globalement pour l'utilisateur
}

export type AppColorSchemePreference = "light" | "dark" | "system"; // 'null' n'est pas une préférence que l'utilisateur choisit

interface AuthContextType {
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  unreadNotificationCount: number;
  fetchUnreadNotificationCount: () => Promise<void>;
  appColorSchemePreference: AppColorSchemePreference;
  setColorSchemePreference: (scheme: AppColorSchemePreference) => Promise<void>;
  effectiveAppColorScheme: "light" | "dark";
  updateUserInContext: (newUserData: Partial<User>) => void;
}

// --- Contexte ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// --- Fournisseur de Contexte ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthDataLoading, setIsAuthDataLoading] = useState(true); // Chargement spécifique au token/user

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState<number>(0);

  // États pour le thème
  const [appColorSchemePreference, setAppColorSchemePreferenceState] =
    useState<AppColorSchemePreference>("system");
  const [effectiveAppColorScheme, setEffectiveAppColorScheme] = useState<
    "light" | "dark"
  >(Appearance.getColorScheme() ?? "light");
  const [isThemePreferenceLoading, setIsThemePreferenceLoading] =
    useState(true);

  // 1. Charger le token et les informations utilisateur au démarrage
  useEffect(() => {
    const bootstrapAuthData = async () => {
      setIsAuthDataLoading(true);
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUserJson = await SecureStore.getItemAsync(USER_INFO_KEY);

        if (storedToken && storedUserJson) {
          setUserToken(storedToken);
          setUser(JSON.parse(storedUserJson) as User);
          console.log(
            "AuthContext: Données d'authentification chargées depuis SecureStore."
          );
        } else {
          console.log(
            "AuthContext: Aucune donnée d'authentification (token/user) trouvée."
          );
        }
      } catch (e) {
        console.error(
          "AuthContext: Erreur chargement token/user depuis SecureStore.",
          e
        );
        // S'assurer de réinitialiser en cas d'erreur (ex: JSON corrompu)
        setUserToken(null);
        setUser(null);
      } finally {
        setIsAuthDataLoading(false);
        console.log("AuthContext: Chargement token/user terminé.");
      }
    };
    bootstrapAuthData();
  }, []);

  // 2. Charger la préférence de thème et gérer le thème effectif
  useEffect(() => {
    // Déclarer la variable pour stocker la souscription au listener
    let appearanceListenerSubscription: { remove: () => void } | undefined;

    const handleSystemThemeChange = (
      preferences: Appearance.AppearancePreferences
    ) => {
      // Met à jour effectiveAppColorScheme SEULEMENT si la préférence est 'system'
      setAppColorSchemePreferenceState((currentStoredPref) => {
        if (currentStoredPref === "system") {
          const newSystemScheme = preferences.colorScheme ?? "light";
          setEffectiveAppColorScheme(newSystemScheme);
          console.log(
            "AuthContext: Thème OS changé et appliqué via listener:",
            newSystemScheme
          );
        }
        return currentStoredPref;
      });
    };

    const loadThemePreference = async () => {
      console.log("AuthContext: Chargement de la préférence de thème...");
      setIsThemePreferenceLoading(true);
      try {
        const storedScheme = (await AsyncStorage.getItem(
          THEME_PREFERENCE_KEY
        )) as AppColorSchemePreference | null;
        const initialPreference = storedScheme || "system";
        setAppColorSchemePreferenceState(initialPreference);

        if (initialPreference === "system") {
          const systemTheme = Appearance.getColorScheme() ?? "light";
          setEffectiveAppColorScheme(systemTheme);
          console.log(
            "AuthContext: Thème système initial appliqué:",
            systemTheme
          );
          // Attacher le listener pour les changements de thème système
          appearanceListenerSubscription = Appearance.addChangeListener(
            handleSystemThemeChange
          );
        } else {
          setEffectiveAppColorScheme(initialPreference); // 'light' ou 'dark'
          console.log(
            `AuthContext: Préférence de thème forcée appliquée: ${initialPreference}`
          );
        }
      } catch (e) {
        console.error("AuthContext: Erreur chargement préférence thème", e);
        // Fallback en cas d'erreur
        setAppColorSchemePreferenceState("system");
        const systemTheme = Appearance.getColorScheme() ?? "light";
        setEffectiveAppColorScheme(systemTheme);
        appearanceListenerSubscription = Appearance.addChangeListener(
          handleSystemThemeChange
        );
      } finally {
        setIsThemePreferenceLoading(false);
        console.log("AuthContext: Chargement préférence de thème terminé.");
      }
    };

    loadThemePreference();

    // Fonction de nettoyage pour le useEffect
    return () => {
      if (appearanceListenerSubscription) {
        console.log("AuthContext: Nettoyage du listener de thème système.");
        appearanceListenerSubscription.remove(); // Appelle la méthode remove() de la souscription
      }
    };
  }, []); // S'exécute une seule fois au montage pour configurer le thème initialement

  const setColorSchemePreferenceInternal = async (
    scheme: AppColorSchemePreference
  ) => {
    console.log(
      "AuthContext: Changement de préférence de thème demandé:",
      scheme
    );
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, scheme);
      setAppColorSchemePreferenceState(scheme);
      if (scheme === "system") {
        setEffectiveAppColorScheme(Appearance.getColorScheme() ?? "light");
      } else {
        // 'light' or 'dark'
        setEffectiveAppColorScheme(scheme);
        // Si on force un thème, on pourrait vouloir retirer le listener, mais le useEffect le gère au prochain re-rendu.
      }
    } catch (e) {
      console.error("AuthContext: Erreur sauvegarde préférence thème", e);
    }
  };

  // 3. Récupérer le nombre de notifications non lues
  const fetchUnreadNotificationCount = useCallback(async () => {
    if (!userToken) {
      // Correction pour Erreur 3
      setUnreadNotificationCount(0);
      console.log(
        "AuthContext: Pas de userToken, fetchUnreadNotificationCount annulé."
      );
      return;
    }
    console.log(
      "AuthContext: fetchUnreadNotificationCount avec token:",
      userToken ? "Présent" : "Absent"
    );
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${userToken}` }, // userToken est garanti d'être une string ici
        }
      );
      if (!response.ok) {
        console.error(
          "AuthContext: Erreur API unread-count, statut:",
          response.status
        );
        return;
      }
      const data = await response.json();
      if (data && typeof data.unreadCount === "number") {
        setUnreadNotificationCount(data.unreadCount);
        console.log(
          "AuthContext: Unread notification count mis à jour:",
          data.unreadCount
        );
      }
    } catch (e) {
      console.error(
        "AuthContext: Erreur lors de fetchUnreadNotificationCount",
        e
      );
    }
  }, [userToken]); // Dépend de userToken

  // Appeler fetchUnreadNotificationCount lorsque userToken change et que les chargements initiaux sont faits
  useEffect(() => {
    if (!isAuthDataLoading && !isThemePreferenceLoading) {
      // Attendre que tout soit chargé
      console.log(
        "AuthContext: Auth et Thème chargés, appel de fetchUnreadNotificationCount."
      );
      fetchUnreadNotificationCount();
    }
  }, [
    userToken,
    isAuthDataLoading,
    isThemePreferenceLoading,
    fetchUnreadNotificationCount,
  ]);

  // --- Fonctions d'action ---
  const signIn = async (token: string, userData: User) => {
    console.log("AuthContext: Appel de signIn.");
    setIsAuthDataLoading(true); // Indiquer un changement d'état d'auth
    try {
      // Assurer que les champs optionnels sont au moins undefined ou null si pas dans userData
      const completeUserData: User = {
        ...userData,
        address: userData.address || undefined,
        phone: userData.phone || undefined,
        profileImageFromAuthContext:
          userData.profileImageFromAuthContext || undefined,
      };
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(
        USER_INFO_KEY,
        JSON.stringify(completeUserData)
      );
      setUserToken(token);
      setUser(completeUserData);
      console.log("AuthContext: signIn réussi et données stockées.");
      // fetchUnreadNotificationCount sera appelé par l'useEffect qui dépend de userToken
    } catch (e) {
      console.error("AuthContext: Erreur lors de signIn (sauvegarde).", e);
      // Réinitialiser si erreur
      setUserToken(null);
      setUser(null);
    } finally {
      setIsAuthDataLoading(false);
    }
  };

  const signOut = async () => {
    console.log("AuthContext: Appel de signOut.");
    setIsAuthDataLoading(true);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_INFO_KEY);
    } catch (e) {
      console.error(
        "AuthContext: Erreur lors de signOut (suppression SecureStore).",
        e
      );
    } finally {
      setUserToken(null);
      setUser(null);
      setUnreadNotificationCount(0); // Réinitialiser explicitement
      setIsAuthDataLoading(false);
      console.log("AuthContext: signOut terminé.");
    }
  };

  const updateUserInContext = (newUserData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...newUserData };
      SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(updatedUser))
        .then(() =>
          console.log("AuthContext: Utilisateur mis à jour dans SecureStore.")
        )
        .catch((e) =>
          console.error(
            "AuthContext: Erreur MàJ utilisateur dans SecureStore.",
            e
          )
        );
      return updatedUser;
    });
    console.log(
      "AuthContext: Utilisateur mis à jour dans le contexte.",
      newUserData
    );
  };

  // Valeur du contexte
  const authContextValue: AuthContextType = {
    signIn,
    signOut,
    user,
    userToken,
    isLoading: isAuthDataLoading || isThemePreferenceLoading, // État de chargement global
    unreadNotificationCount,
    fetchUnreadNotificationCount,
    appColorSchemePreference,
    setColorSchemePreference: setColorSchemePreferenceInternal, // Utiliser la nouvelle fonction
    effectiveAppColorScheme,
    updateUserInContext,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
