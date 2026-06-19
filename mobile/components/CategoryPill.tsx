import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ label, active, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.pill, active && styles.active]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.label, active && styles.activeLabel]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  active: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  label: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  activeLabel: { color: '#111111' },
});
