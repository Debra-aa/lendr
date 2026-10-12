// Black banner at the top of every tab: logo, wordmark, motto and the user's initial.
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

export function Banner() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const name: string = session?.user.user_metadata?.full_name || session?.user.email || '?';

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 12 }]}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <View style={styles.logoHole} />
        </View>
        <View>
          <Text style={styles.wordmark}>lendr</Text>
          <Text style={styles.motto}>Your campus is your supply closet.</Text>
        </View>
      </View>
      <View style={styles.avatar} accessibilityLabel={`Signed in as ${name}`}>
        <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#000', paddingHorizontal: 20, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 6, borderBottomColor: colors.maize,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 30, height: 30, backgroundColor: colors.maize, alignItems: 'center', paddingTop: 4 },
  logoHole: { width: 6, height: 6, backgroundColor: colors.ink },
  wordmark: { color: '#fff', fontSize: 30, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 },
  motto: { color: colors.maize, fontSize: 13, marginTop: 2 },
  avatar: {
    width: 40, height: 40, backgroundColor: colors.maize, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#000', fontWeight: '700', fontSize: 18 },
});
