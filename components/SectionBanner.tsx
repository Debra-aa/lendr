// A charcoal banner that marks the start of a section, like "Wanted" or "Your listings".
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, type IconName } from '../lib/theme';

type Props = { icon: IconName; title: string; sub?: string; count?: number; slim?: boolean };

export function SectionBanner({ icon, title, sub, count, slim }: Props) {
  return (
    <LinearGradient
      colors={[colors.heroTop, colors.heroBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, slim && styles.slim]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.motto} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, slim && { fontSize: 18 }]}>{title}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {count !== undefined ? (
        <View style={styles.count}><Text style={styles.countText}>{count}</Text></View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
  },
  slim: { paddingVertical: 10, borderRadius: 12, borderLeftWidth: 6, borderLeftColor: colors.mint, marginTop: 10 },
  icon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#C9D2DC', fontSize: 14, marginTop: 2 },
  count: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 },
  countText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
