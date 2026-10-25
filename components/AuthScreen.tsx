// Shared frame for Log in and Sign up: charcoal hero card with the logo,
// a Log in / Sign up switch, then the form.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/theme';
import { Logo } from './Logo';

type Props = { mode: 'login' | 'signup'; title: string; sub: string; children: ReactNode };

export function AuthScreen({ mode, title, sub, children }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={[colors.heroTop, colors.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.ring} />
          <Logo size={56} />
          <Text style={styles.word}>lendr</Text>
          <Text style={styles.motto}>Your campus is your supply closet.</Text>
        </LinearGradient>

        <View style={styles.tabs}>
          {(['login', 'signup'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
              onPress={() => mode !== m && router.replace(m === 'login' ? '/(auth)/login' : '/(auth)/register')}
              style={[styles.tab, mode === m && styles.tabSelected]}
            >
              <Text style={[styles.tabText, mode === m && { color: '#fff' }]}>{m === 'login' ? 'Log in' : 'Sign up'}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const authText = StyleSheet.create({
  fine: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 14 },
  link: { color: colors.mint, fontWeight: '700' },
});

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  hero: { borderRadius: 24, padding: 22, paddingTop: 26, overflow: 'hidden', marginBottom: 18 },
  ring: {
    position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: 75,
    borderWidth: 18, borderColor: 'rgba(15,159,118,0.18)',
  },
  word: { color: '#fff', fontSize: 38, fontWeight: '700', letterSpacing: -1, marginTop: 10 },
  motto: { color: colors.motto, fontSize: 15, marginTop: 4 },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm },
  tabSelected: { backgroundColor: colors.mint },
  tabText: { fontWeight: '700', color: colors.muted },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginTop: 16 },
  sub: { fontSize: 15, color: colors.muted, marginTop: 2 },
});
