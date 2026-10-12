// Shared look for the login and register screens.
import { StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

export const authStyles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.paper },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logo: { width: 34, height: 34, backgroundColor: colors.maize, alignItems: 'center', paddingTop: 5 },
  logoHole: { width: 7, height: 7, backgroundColor: colors.ink },
  wordmark: { fontSize: 32, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 16, color: colors.muted, marginTop: 4, marginBottom: 8 },
  linkWrap: { paddingVertical: 16 },
  link: { textAlign: 'center', color: colors.ink, fontWeight: '700', fontSize: 15 },
});
