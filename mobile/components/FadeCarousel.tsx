import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/lib/theme';

interface Props {
  children: React.ReactNode;
  contentContainerStyle?: object;
  fadeWidth?: number;
}

export function FadeCarousel({ children, contentContainerStyle, fadeWidth = 28 }: Props) {
  return (
    <View style={[styles.wrapper, { marginHorizontal: spacing.screenX }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </ScrollView>
      <LinearGradient
        colors={[colors.paper, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.fade, styles.fadeLeft, { width: fadeWidth }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', colors.paper]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.fade, styles.fadeRight, { width: fadeWidth }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
});
