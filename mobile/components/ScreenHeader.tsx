import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

interface Props {
  title: string;
  onBack?: () => void;
}

export function ScreenHeader({ title, onBack }: Props) {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#111111',
    gap: 12,
  },
  back: { width: 36, height: 36, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
});
