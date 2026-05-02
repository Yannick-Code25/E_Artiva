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
import type { ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session'; // ← AJOUTÉ
import * as WebBrowser from 'expo-web-browser';
import { googleConfig, googleScopes } from '../constants/GoogleAuthConfig';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// --- Constantes ---
const TOKEN_KEY = "artiva-auth-token";
const USER_INFO_KEY = "artiva-user-info";
const THEME_PREFERENCE_KEY = "artiva-theme-preference";
const API_BASE_URL = "https://back-end-purple-log-1280.fly.dev/api";

// --- Types ---
export interface User {
  id: number | string;
  name: string;
  email: string;
  role: "customer" | "admin" | string;
  address?: string;
  phone?: string;
  profileImageFromAuthContext?: string;
}

export type AppColorSchemePreference = "light" | "dark" | "system";

interface AuthContextType {
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const [isAuthDataLoading, setIsAuthDataLoading] = useState(true);

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

  // Google Sign-In — URI forcée vers le proxy Expo
  const redirectUri = "https://auth.expo.io/@fathanemarcos/artiva";

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: googleConfig.expoClientId,
    webClientId: googleConfig.webClientId,
    scopes: googleScopes,
    redirectUri,
  });

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
    let appearanceListenerSubscription: { remove: () => void } | undefined;

    const handleSystemThemeChange = (
      preferences: Appearance.AppearancePreferences
    ) => {
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
          appearanceListenerSubscription = Appearance.addChangeListener(
            handleSystemThemeChange
          );
        } else {
          setEffectiveAppColorScheme(initialPreference);
          console.log(
            `AuthContext: Préférence de thème forcée appliquée: ${initialPreference}`
          );
        }
      } catch (e) {
        console.error("AuthContext: Erreur chargement préférence thème", e);
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

    return () => {
      if (appearanceListenerSubscription) {
        console.log("AuthContext: Nettoyage du listener de thème système.");
        appearanceListenerSubscription.remove();
      }
    };
  }, []);

  // 3. Gérer la réponse de Google
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (googleResponse?.type === 'success') {
        const { authentication } = googleResponse;
        const accessToken = authentication?.accessToken;

        console.log("AuthContext: Réponse Google reçue avec succès");

        if (accessToken) {
          try {
            // Récupérer les infos utilisateur depuis Google
            const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            const userInfo = await userInfoResponse.json();
            console.log("AuthContext: Info Google:", userInfo.email);

            // Envoyer au backend
            const backendResponse = await fetch(`${API_BASE_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userInfo.email,
                name: userInfo.name,
                googleId: userInfo.id,
                picture: userInfo.picture,
              }),
            });

            const data = await backendResponse.json();

            if (backendResponse.ok) {
              await SecureStore.setItemAsync(TOKEN_KEY, data.token);
              setUserToken(data.token);

              const userData: User = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role || 'customer',
                profileImageFromAuthContext: data.user.picture || undefined,
              };
              await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userData));
              setUser(userData);

              console.log("AuthContext: Connexion Google réussie");
            } else {
              throw new Error(data.message || 'Erreur connexion Google');
            }
          } catch (error) {
            console.error('AuthContext: Erreur backend Google:', error);
            Alert.alert('Erreur', "Impossible de s'authentifier avec Google");
          }
        }
      } else if (googleResponse?.type === 'error') {
        console.log('AuthContext: Erreur Google:', googleResponse.error);
        Alert.alert('Erreur', "La connexion Google a échoué, veuillez réessayer.");
      } else if (googleResponse?.type === 'dismiss') {
        console.log('AuthContext: Connexion Google annulée par l\'utilisateur');
      }
    };

    handleGoogleResponse();
  }, [googleResponse]);

  // 4. Récupérer le nombre de notifications non lues
  const fetchUnreadNotificationCount = useCallback(async () => {
    if (!userToken) {
      setUnreadNotificationCount(0);
      console.log(
        "AuthContext: Pas de userToken, fetchUnreadNotificationCount annulé."
      );
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
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
  }, [userToken]);

  // Appeler fetchUnreadNotificationCount lorsque userToken change
  useEffect(() => {
    if (!isAuthDataLoading && !isThemePreferenceLoading) {
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
    setIsAuthDataLoading(true);
    try {
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
    } catch (e) {
      console.error("AuthContext: Erreur lors de signIn (sauvegarde).", e);
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
      setUnreadNotificationCount(0);
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

  // Connexion avec Google — MODIFIÉ : ajout de useProxy dans promptGoogleAsync
const signInWithGoogle = useCallback(async () => {
  console.log("AuthContext: Démarrage connexion Google...");
  try {
    await promptGoogleAsync();
  } catch (error) {
    console.error('AuthContext: Erreur Google Sign-In:', error);
    Alert.alert('Erreur', 'Impossible de se connecter avec Google');
  }
}, [promptGoogleAsync]);

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
        setEffectiveAppColorScheme(scheme);
      }
    } catch (e) {
      console.error("AuthContext: Erreur sauvegarde préférence thème", e);
    }
  };

  // Valeur du contexte
  const authContextValue: AuthContextType = {
    signIn,
    signOut,
    signInWithGoogle,
    user,
    userToken,
    isLoading: isAuthDataLoading || isThemePreferenceLoading,
    unreadNotificationCount,
    fetchUnreadNotificationCount,
    appColorSchemePreference,
    setColorSchemePreference: setColorSchemePreferenceInternal,
    effectiveAppColorScheme,
    updateUserInContext,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}