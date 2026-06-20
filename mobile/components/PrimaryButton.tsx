import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

type Variant = 'filled' | 'lime' | 'bordered' | 'danger' | 'primary' | 'outline';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  disabled?: boolean;
}

const VARIANT_MAP: Record<string, 'filled' | 'lime' | 'bordered' | 'danger'> = {
  primary: 'filled', outline: 'bordered', filled: 'filled', lime: 'lime', bordered: 'bordered', danger: 'danger',
};

export function PrimaryButton({ title, onPress, loading, variant = 'filled', style, disabled }: Props) {
  const v = VARIANT_MAP[variant] ?? 'filled';
  const isDisabled = loading || disabled;
  return (
    <TouchableOpacity
      style={[styles.base, styles[v], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          color={v === 'lime' ? colors.ink : v === 'filled' ? colors.white : colors.ink}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${v}Label` as keyof typeof styles]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, height: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  filled: { backgroundColor: colors.ink },
  lime: { backgroundColor: colors.lime },
  bordered: { backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(32,32,32,0.10)' },
  danger: { backgroundColor: colors.destructive + '18', borderWidth: 1, borderColor: colors.destructive },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16, fontFamily: fonts.semiBold },
  filledLabel: { color: colors.white },
  limeLabel: { color: colors.ink },
  borderedLabel: { color: colors.ink },
  dangerLabel: { color: colors.destructive },
});
