const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

// ARTIVA/front_end/constants/Colors.ts

// Couleurs de base que tu peux réutiliser et ajuster
const primaryColor = '#E53E3E'; // Un rouge Artiva (similaire à tomato, mais tu peux le changer)
const primaryColorDarker = '#C53030'; // Une version plus foncée pour les états :hover ou les bordures
const primaryColorLighter = '#FC8181'; // Une version plus claire pour le thème sombre ou les accents

const textColorLight = '#1A202C'; // Texte principal presque noir pour thème clair
const backgroundColorLight = '#FFFFFF'; // Fond blanc pour thème clair
const cardColorLight = '#FFFFFF'; // Fond des cartes en thème clair (peut être identique au fond ou légèrement différent)
const cardBorderLight = '#E2E8F0'; // Bordure subtile pour les cartes en clair (gris clair)
const subtleTextColorLight = '#718096'; // Texte secondaire/gris clair
const inputBackgroundLight = '#F7FAFC'; // Fond pour les champs de saisie en clair
const inputBorderLight = '#CBD5E0'; // Bordure pour les champs de saisie en clair

const textColorDark = '#F7FAFC'; // Texte principal presque blanc pour thème sombre
const backgroundColorDark = '#171923'; // Fond très foncé (pas noir pur) pour thème sombre
const cardColorDark = '#2D3748';   // Fond des cartes en thème sombre (bleu-gris foncé)
const cardBorderDark = '#4A5568';   // Bordure pour les cartes en sombre (gris plus foncé)
const subtleTextColorDark = '#A0AEC0'; // Texte secondaire/gris clair pour thème sombre
const inputBackgroundDark = '#2D3748'; // Identique à cardColorDark pour un look intégré
const inputBorderDark = '#4A5568';   // Identique à cardBorderDark

// Couleurs sémantiques
const errorColor = '#E53E3E'; // Rouge pour les erreurs (identique à la primaire ici, mais pourrait être différent)
const errorBackgroundLight = '#FED7D7';
const errorBackgroundDark = '#4A2424'; // Un rouge plus sombre pour le fond d'erreur en thème sombre

const successColor = '#38A169'; // Vert pour les succès
const successBackgroundLight = '#C6F6D5';
const successBackgroundDark = '#2F855A40'; // Vert foncé transparent

const warningColor = '#DD6B20'; // Orange pour les avertissements
const warningBackgroundLight = '#FEEBC8';
const warningBackgroundDark = '#4A3B24';


export default {
  light: {
    text: textColorLight,
    background: backgroundColorLight,
    tint: primaryColor, // Couleur d'accentuation principale
    tabIconDefault: '#A0AEC0', // Icônes d'onglet inactives
    tabIconSelected: primaryColor, // Icônes d'onglet actives
    card: cardColorLight,
    cardBorder: cardBorderLight,
    subtleText: subtleTextColorLight,
    inputBackground: inputBackgroundLight,
    inputBorder: inputBorderLight,
    // Couleurs sémantiques pour le thème clair
    errorText: errorColor,
    errorBackground: errorBackgroundLight,
    successText: successColor,
    successBackground: successBackgroundLight,
    warningText: warningColor,
    warningBackground: warningBackgroundLight,
    // Tu peux ajouter d'autres couleurs spécifiques ici
    primary: primaryColor,
    primaryDarker: primaryColorDarker,
  },
  dark: {
    text: textColorDark,
    background: backgroundColorDark,
    tint: primaryColorLighter, // Couleur d'accentuation principale pour le thème sombre
    tabIconDefault: '#718096', // Icônes d'onglet inactives
    tabIconSelected: primaryColorLighter, // Icônes d'onglet actives
    card: cardColorDark,
    cardBorder: cardBorderDark,
    subtleText: subtleTextColorDark,
    inputBackground: inputBackgroundDark,
    inputBorder: inputBorderDark,
    // Couleurs sémantiques pour le thème sombre
    errorText: primaryColorLighter, // Utiliser la teinte claire du rouge pour le texte sur fond sombre
    errorBackground: errorBackgroundDark,
    successText: '#68D391', // Vert plus clair
    successBackground: successBackgroundDark,
    warningText: '#FABD05', // Jaune/Orange plus clair
    warningBackground: warningBackgroundDark,
    // Tu peux ajouter d'autres couleurs spécifiques ici
    primary: primaryColorLighter,
    primaryDarker: primaryColor, // La couleur primaire claire devient plus foncée en thème sombre
  },
  // Tu peux aussi ajouter des couleurs communes ici si elles ne changent pas avec le thème
  // common: {
  //   activeGreen: '#38A169',
  //   inactiveGray: '#A0AEC0',
  // }
};

// export default {
//   light: {
//     text: '#1A202C', // Texte principal (presque noir)
//     background: '#FFFFFF', // Fond principal (blanc)
//     tint: tintColorLight, // Couleur d'accentuation principale
//     tabIconDefault: '#A0AEC0', // Gris pour icônes inactives
//     tabIconSelected: tintColorLight,
//     borderColor: '#e0e0e0',
//     card: '#FFFFFF', // Fond pour les éléments type carte
//     cardBorder: '#E2E8F0', // Bordure subtile pour les cartes
//     subtleText: '#718096', // Texte secondaire plus clair
//     errorText: '#C53030', // Rouge foncé pour les erreurs
//     errorBackground: '#FED7D7', // Fond rouge clair pour les erreurs
//     successText: '#2F855A', // Vert pour succès
//     successBackground: '#C6F6D5', // Fond vert clair
//     inputBackground: '#F7FAFC',
//     inputBorder: '#CBD5E0',
//   },
//   dark: {
//     text: '#F7FAFC', // Texte principal (presque blanc)
//     background: '#1A202C', // Fond principal (bleu-gris très foncé)
//     tint: tintColorDark,
//     tabIconDefault: '#718096', // Gris moyen pour icônes inactives
//     tabIconSelected: tintColorDark,
//     borderColor: '#3a3a3c',
//     card: '#2D3748', // Fond pour les cartes en thème sombre
//     cardBorder: '#4A5568', // Bordure pour les cartes en sombre
//     subtleText: '#A0AEC0', // Texte secondaire
//     errorText: '#FC8181', // Rouge clair pour erreurs sur fond sombre
//     errorBackground: '#4A2424', // Fond rouge foncé pour erreurs
//     successText: '#68D391', // Vert clair pour succès
//     successBackground: '#2F855A40', // Fond vert foncé transparent
//     inputBackground: '#2D3748',
//     inputBorder: '#4A5568',
//   },
// };
