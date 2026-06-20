import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.ink} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center' },
});
