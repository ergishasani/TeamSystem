import { View, Text, StyleSheet } from 'react-native';

interface Props {
  message: string;
  icon?: string;
}

export function EmptyState({ message, icon = '🌿' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40 },
  icon: { fontSize: 40, marginBottom: 12 },
  message: { color: '#A1A1AA', fontSize: 15, textAlign: 'center' },
});
