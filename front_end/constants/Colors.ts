const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    card: '#f9f9f9',    // <<< NOUVEAU : Couleur pour les cartes en mode clair (un gris très clair)
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    // Ajoute d'autres couleurs si besoin (bordures, etc.)
    borderColor: '#e0e0e0',
    error: '#D32F2F', // Rouge foncé pour les erreurs/actions destructives
},
  dark: {
    text: '#fff',
    background: '#000',
    card: '#1c1c1e',    // <<< NOUVEAU : Couleur pour les cartes en mode sombre (un gris foncé)
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    borderColor: '#3a3a3c',
    error: '#EF4444', // Rouge plus clair pour la visibilité sur fond sombre
  },
};
