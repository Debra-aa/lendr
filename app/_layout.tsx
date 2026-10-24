import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../lib/theme';
import { SETTINGS_BG } from '../components/SettingsList';

// A plain header with a Back button, for screens pushed on top of the tabs.
function pushedHeader(title: string, background: string = colors.paper) {
  return {
    headerShown: true,
    title,
    headerBackTitle: 'Back',
    headerTintColor: colors.ink,
    headerStyle: { backgroundColor: background },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: background },
  };
}

// Decides which screens exist based on whether someone is signed in.
// Stack.Protected handles the redirects: signed-out users only see (auth),
// signed-in users only see the app.
function RootNavigator() {
  const { session, loading } = useAuth();
  if (loading) return null; // still reading the saved session from the phone

  const signedIn = session !== null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="listing/[id]" options={pushedHeader('')} />
        <Stack.Screen name="settings" options={pushedHeader('Settings', SETTINGS_BG)} />
        <Stack.Screen name="blocked-users" options={pushedHeader('Blocked users', SETTINGS_BG)} />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Open to everyone: Sign up links here before there is an account. */}
      <Stack.Screen name="terms" options={pushedHeader('Terms of Use')} />
      <Stack.Screen name="privacy" options={pushedHeader('Privacy policy')} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
