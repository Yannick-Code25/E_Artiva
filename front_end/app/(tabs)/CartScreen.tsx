// app/(tabs)/panier.tsx
import { StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';

export default function TabPanierScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panier</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text>Contenu de la page panier.</Text>
    </View>
  );
}

const styles = StyleSheet.create({ // Tu peux réutiliser ou centraliser ces styles plus tard
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});