import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  style?: ViewStyle;
  disabled?: boolean;
}

export function PrimaryButton({ title, onPress, loading, variant = 'primary', style, disabled }: Props) {
  const isDisabled = loading || disabled;
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#111' : '#22C55E'} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#22C55E' },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#22C55E' },
  danger: { backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444' },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '700' },
  primaryLabel: { color: '#111111' },
  outlineLabel: { color: '#22C55E' },
  dangerLabel: { color: '#EF4444' },
});
