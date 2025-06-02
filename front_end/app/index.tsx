// // ARTIVA/front_end/app/index.tsx
// import { Redirect, SplashScreen } from 'expo-router';
// import React, { useEffect } from 'react';
// import { useAuth } from '../context/AuthContext'; // Vérifie le chemin
// import { ActivityIndicator, View, StyleSheet } from 'react-native';

// export default function StartPage() {
//   const { userToken, isLoading: isAuthLoading } = useAuth();

//   // Note: Le masquage du SplashScreen est maintenant géré dans app/_layout.tsx
//   // pour s'assurer qu'il est masqué une seule fois quand l'auth est prête.

//   if (isAuthLoading) {
//     // Pendant que AuthContext charge, _layout gère le splash.
//     // On peut retourner null ici ou un loader si on veut un double niveau.
//     // Pour la simplicité, on s'appuie sur _layout.
//     console.log("StartPage (index.tsx): Auth en cours de chargement...");
//     return (
//         <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
//             {/* Ce loader sera visible si _layout a déjà masqué le splash mais qu'on est encore ici */}
//             <ActivityIndicator size="large" color="tomato"/>
//         </View>
//     );
//   }

//   console.log("StartPage (index.tsx): Auth chargé. Token:", userToken ? "Présent" : "Absent");
//   if (userToken) {
//     console.log("StartPage (index.tsx): Token présent, redirection vers (tabs)");
//     return <Redirect href="/(tabs)" />;
//   } else {
//     console.log("StartPage (index.tsx): Pas de token, redirection vers login");
//     return <Redirect href="/login" />;
//   }
// }




// ARTIVA/front_end/app/index.tsx
import { Redirect, SplashScreen, Href } from 'expo-router';
import React, { useEffect  } from 'react';
import { useAuth } from '../context/AuthContext'; // Vérifie le chemin
import { ActivityIndicator, View } from 'react-native'; // Pour le loader

export default function StartPage() {
  const { userToken, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    // Le masquage du SplashScreen est géré dans app/_layout.tsx
    // Mais on peut logguer ici pour voir l'état
    if (!isAuthLoading) {
      console.log("StartPage (index.tsx): Vérification Auth terminée. Token:", userToken ? "Présent" : "Absent");
    }
  }, [isAuthLoading, userToken]);

  if (isAuthLoading) {

    console.log("StartPage (index.tsx): Auth en cours de chargement...");
    // Pendant que AuthContext charge, _layout.tsx gère le splash screen.
    // Retourner null ici est OK, ou un loader minimaliste si tu veux être explicite.
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white'}}>
            <ActivityIndicator size="large" color="tomato"/>
        </View>
    );
  }

  // Une fois que l'état d'authentification est connu :
  // On redirige TOUJOURS vers la section principale (les onglets).
  // La logique à l'intérieur des onglets ou des pages spécifiques
  // gérera si l'utilisateur doit être redirigé vers /login pour certaines actions.
  console.log("StartPage (index.tsx): Redirection vers /(tabs)/");
  return <Redirect href="/(tabs)"  />; 
}
