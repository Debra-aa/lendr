// The rounded charcoal banner at the top of every tab. On Wanted and Profile
// it shrinks once the student scrolls down, to leave more room for content.
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  LayoutAnimation, StyleSheet, Text, View,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { colors, radius } from '../lib/theme';
import { Avatar } from './Avatar';
import { Logo } from './Logo';

export function Banner({ compact = false }: { compact?: boolean }) {
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const name = profile?.full_name || session?.user.email || '?';

  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, backgroundColor: colors.paper }}>
      <LinearGradient
        colors={[colors.heroTop, colors.heroBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, compact && styles.bannerCompact]}
      >
        <View style={styles.brand}>
          <Logo size={compact ? 24 : 32} />
          <View>
            <Text style={[styles.wordmark, compact && { fontSize: 20, lineHeight: 22 }]}>lendr</Text>
            {compact ? null : <Text style={styles.motto}>Your campus is your supply closet.</Text>}
          </View>
        </View>
        <Avatar name={name} url={profile?.avatar_url} size={compact ? 30 : 40} style={styles.avatar} />
      </LinearGradient>
    </View>
  );
}

/**
 * Use on a scrolling screen to make the banner shrink after scrolling down.
 * Pass the returned function to the ScrollView's onScroll.
 */
export function useShrinkingBanner() {
  const navigation = useNavigation();
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ header: () => <Banner compact={compact} /> });
  }, [navigation, compact]);

  return useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y > 24;
    if (next !== compactRef.current) {
      compactRef.current = next;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCompact(next);
    }
  }, []);
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.xl, paddingHorizontal: 18, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 4, borderBottomColor: colors.mint,
  },
  bannerCompact: { borderRadius: radius.lg, paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 3 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { color: '#fff', fontSize: 30, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 },
  motto: { color: colors.motto, fontSize: 13, marginTop: 2 },
  avatar: { borderWidth: 2, borderColor: '#fff' },
});
