import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '@/lib/theme';

interface Props {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, rightElement }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <View style={styles.pill}>
        {onBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.ink} strokeWidth={1.75} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.iconBtn}>{rightElement ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, paddingBottom: 8, backgroundColor: colors.paper },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 52,
    paddingHorizontal: 8,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: fonts.semiBold, color: colors.ink },
});
