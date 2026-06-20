import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

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
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  active: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: { color: colors.labelSecondary, fontSize: 13, fontFamily: fonts.semiBold },
  activeLabel: { color: colors.white },
});
