// app/(tabs)/tendances.tsx
import { StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';

export default function TabTendancesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tendances</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text>Contenu de la page tendances.</Text>
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