import { View, Text, StyleSheet } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';

interface Props {
  message: string;
  title?: string;
}

export function EmptyState({ message, title = 'Nothing here' }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Inbox size={28} color={colors.ink} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  iconWrap: {
    width: 64, height: 64, borderRadius: radius['2xl'],
    backgroundColor: colors.lime,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: colors.ink, fontSize: 18, fontFamily: fonts.bold, marginBottom: 6 },
  message: { color: colors.labelSecondary, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center', lineHeight: 20 },
});
