// ARTIVA/front_end/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
// Retirer useRouter et useSegments d'ici pour l'instant si l'erreur persiste
// import { useRouter, useSegments, useRootNavigationState } from 'expo-router'; 

const TOKEN_KEY = 'artiva-auth-token';
const USER_INFO_KEY = 'artiva-user-info';

export interface User {
  profileImageFromAuthContext: string | undefined; 
  id: number | string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | string; 
}

interface AuthContextType {
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  userToken: string | null;
  isLoading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // const router = useRouter(); // On le retire d'ici pour l'instant
  // const segments = useSegments();
  // const navigationState = useRootNavigationState();

  useEffect(() => {
    const bootstrapAsync = async () => {
      let storedToken: string | null = null;
      let storedUserJson: string | null = null;
      console.log('AuthContext (bootstrapAsync): Tentative de chargement des données auth...');
      try {
        storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        storedUserJson = await SecureStore.getItemAsync(USER_INFO_KEY);

        if (storedToken && storedUserJson) {
          setUserToken(storedToken);
          setUser(JSON.parse(storedUserJson) as User); 
          console.log('AuthContext (bootstrapAsync): Données chargées depuis SecureStore.');
        } else {
          console.log('AuthContext (bootstrapAsync): Aucune donnée trouvée dans SecureStore.');
        }
      } catch (e) {
        console.error('AuthContext (bootstrapAsync): Erreur de chargement depuis SecureStore.', e);
        setUserToken(null);
        setUser(null);
      } finally {
        console.log('AuthContext (bootstrapAsync): Chargement initial terminé.');
        setIsLoading(false); 
      }
    };
    bootstrapAsync();
  }, []);

  // ON RETIRE L'EFFET DE REDIRECTION AUTOMATIQUE D'ICI POUR L'INSTANT
  // useEffect(() => {
  //   // ... ancienne logique de redirection ...
  // }, [userToken, segments, isLoading, router, navigationState]);


  const signIn = async (token: string, userData: User) => {
    setIsLoading(true); 
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userData));
      setUserToken(token);
      setUser(userData);
      console.log('AuthContext: signIn effectué.');
      // La redirection sera maintenant gérée explicitement dans login.tsx
    } catch (e) {
      console.error('AuthContext: Erreur lors de signIn (sauvegarde).', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_INFO_KEY);
      setUserToken(null);
      setUser(null);
      console.log('AuthContext: signOut effectué.');
      // La redirection après signOut devra être gérée là où signOut est appelé
    } catch (e) {
      console.error('AuthContext: Erreur lors de signOut (suppression).', e);
    } finally {
      setIsLoading(false);
    }
  };

  const authContextValue: AuthContextType = { signIn, signOut, user, userToken, isLoading };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}